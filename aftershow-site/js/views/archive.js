// Tab 1: My Shows (poster grid / diary) + Stats.
import { app, sectionHead, tabs, tile, diaryRow, emptyState, rankList, coverStyle, coverClass, toast } from '../ui.js';
import { esc, computeStats, formatDate, friendlyError } from '../util.js';
import { shareRecap } from '../share.js';
import { withRail, mostSeenCard, milestoneCard, thisMonthCard, needsPhotoCard, voteCta } from '../rails.js';

const archiveTabs = (active) => tabs([{ id: 'shows', label: 'Archive', href: '#/shows' }, { id: 'stats', label: 'Stats', href: '#/stats' }], active, { label: 'My Shows sections' });
const view = { sort: 'newest', year: 'all', q: '', memory: false, mode: 'tiles' };

function filtered(entries) {
  let list = entries.filter((e) => (view.year === 'all' || e.date.startsWith(view.year)) && (!view.memory || e.fromMemory));
  const q = view.q.trim().toLowerCase();
  if (q) list = list.filter((e) => [e.artistName, e.venueName, e.city, e.note].join(' ').toLowerCase().includes(q));
  const by = {
    newest: (a, b) => b.date.localeCompare(a.date),
    oldest: (a, b) => a.date.localeCompare(b.date),
    artist: (a, b) => a.artistName.localeCompare(b.artistName) || b.date.localeCompare(a.date),
    venue: (a, b) => a.venueName.localeCompare(b.venueName) || b.date.localeCompare(a.date),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || b.date.localeCompare(a.date)
  };
  return list.sort(by[view.sort]);
}
function yearRange(entries) {
  const ys = entries.map((e) => +e.date.slice(0, 4)).filter(Boolean);
  if (!ys.length) return [];
  const lo = Math.min(...ys), hi = Math.max(...ys);
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}

export async function myShows(ctx) {
  const me = app.profile;
  const data = await ctx.guard(async () => {
    const [entries, photos] = await Promise.all([app.api.listEntries({ userId: me.id }), app.api.listPhotos({}).catch(() => [])]);
    return { entries, photos };
  });
  if (!data) return;
  const { entries, photos } = data;
  const communityByArtist = {}, communityByShow = {};
  [...photos].sort((a, b) => (b.votes || 0) - (a.votes || 0)).forEach((p) => {
    if (p.showId && !communityByShow[p.showId]) communityByShow[p.showId] = p;
    if (p.artistId && !communityByArtist[p.artistId]) communityByArtist[p.artistId] = p;
  });
  const stats = computeStats(entries);

  if (!entries.length) {
    ctx.setHTML(`<header class="page-head"><h1 class="title" tabindex="-1">Your shows.</h1><p class="sub">Every show you’ve ever been to, no proof needed.</p></header>
      <div class="card">${emptyState('Nothing here yet.', 'Log the first one — from last night or from 2009. Memory is enough.',
        '<div class="empty-actions"><a class="btn-block inline" href="#/log">Log a show</a><a class="btn" href="#/import">Import from CSV</a></div>')}</div>`);
    return;
  }
  const years = yearRange(entries);
  const perYear = Object.fromEntries(stats.years);
  const maxYear = Math.max(1, ...Object.values(perYear));
  const ribbonHtml = () => `<div class="ribbon" role="group" aria-label="Filter by year">${years.map((y) => {
    const n = perYear[y] || 0;
    return `<button type="button" class="ribbon-bar ${view.year === String(y) ? 'on' : ''}" data-year="${y}" ${n ? '' : 'disabled'} aria-pressed="${view.year === String(y)}" aria-label="${y}: ${n} show${n === 1 ? '' : 's'}"><span class="ribbon-fill" style="height:${n ? Math.max(10, (n / maxYear) * 100) : 4}%"></span><span class="ribbon-y">${years.length > 16 && y % 2 ? '' : "’" + String(y).slice(2)}</span></button>`;
  }).join('')}</div>`;

  const listHtml = () => {
    const list = filtered(entries);
    if (!list.length) return emptyState('No matches.', 'Try clearing the filters.', '<button class="btn" type="button" data-action="clear">Clear filters</button>');
    const fb = (e) => (app.profile.settings?.private ? undefined : communityByShow[e.showId] || communityByArtist[e.artistId]); // private profiles use only their own photos
    if (view.mode === 'diary') return `<div class="diary">${list.map((e) => diaryRow(e, { fallbackPhoto: fb(e) })).join('')}</div>`;
    const grouped = (view.sort === 'newest' || view.sort === 'oldest') && view.year === 'all' && !view.q.trim();
    if (!grouped) return `<div class="tile-grid">${list.map((e) => tile(e, { fallbackPhoto: fb(e) })).join('')}</div>`;
    const groups = new Map(); list.forEach((e) => { const y = e.date.slice(0, 4); if (!groups.has(y)) groups.set(y, []); groups.get(y).push(e); });
    return [...groups.entries()].map(([y, es]) => {
      const crowded = es.length >= 7; // a busy year becomes a carousel you can scroll sideways
      const tiles = es.map((e) => tile(e, { fallbackPhoto: fb(e), showYear: false })).join('');
      return `<section class="year-group ${crowded ? 'crowded' : ''}" aria-label="${y}"><div class="year-head"><h2 class="year-mark">${y}<small>${es.length} show${es.length === 1 ? '' : 's'}</small></h2>${crowded ? '<div class="year-nav"><button type="button" data-scroll="-1" aria-label="Scroll ' + y + ' left">‹</button><button type="button" data-scroll="1" aria-label="Scroll ' + y + ' right">›</button></div>' : ''}</div>${crowded ? `<div class="tile-row" tabindex="0" role="region" aria-label="${y} shows, scroll sideways">${tiles}</div>` : `<div class="tile-grid">${tiles}</div>`}</section>`;
    }).join('');
  };

  ctx.setHTML(`
    <header class="archive-top">
      <div><h1 class="title" tabindex="-1">Your shows.</h1>
        <div class="archive-numbers"><div><b>${entries.length}</b><span>shows</span></div><div><b>${stats.artists.length}</b><span>artists</span></div><div><b>${stats.venues.length}</b><span>venues</span></div>${stats.avgRating ? `<div><b>${stats.avgRating.toFixed(1)}</b><span>avg stars</span></div>` : ''}</div></div>
      <div class="seg" role="group" aria-label="Layout"><button type="button" data-mode="tiles" class="${view.mode === 'tiles' ? 'on' : ''}" aria-pressed="${view.mode === 'tiles'}">Posters</button><button type="button" data-mode="diary" class="${view.mode === 'diary' ? 'on' : ''}" aria-pressed="${view.mode === 'diary'}">Diary</button></div>
    </header>
    ${archiveTabs('shows')}
    ${withRail(`<div class="hero-ribbon">${ribbonHtml()}</div>
    <div class="toolbar" role="search" aria-label="Filter your shows">
      <div class="field grow"><label class="sr-only" for="fq">Search your shows</label><input id="fq" type="search" placeholder="Search artist, venue, city or note" value="${esc(view.q)}"></div>
      <div class="field"><label class="sr-only" for="fsort">Sort</label><select id="fsort">${[['newest', 'Newest first'], ['oldest', 'Oldest first'], ['artist', 'Artist A–Z'], ['venue', 'Venue A–Z'], ['rating', 'Top rated']].map(([v, l]) => `<option value="${v}" ${view.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <label class="chip-check"><input type="checkbox" id="fmem" ${view.memory ? 'checked' : ''}><span>From memory</span></label>
    </div>
    <div id="archiveList" aria-live="polite">${listHtml()}</div>`, `${voteCta(photos)}${mostSeenCard(stats, entries)}${milestoneCard(entries.length)}${thisMonthCard(entries)}${needsPhotoCard(entries)}`)}`);

  const refresh = () => {
    ctx.view.querySelector('#archiveList').innerHTML = listHtml();
    ctx.view.querySelector('.hero-ribbon').innerHTML = ribbonHtml();
    ctx.view.querySelectorAll('[data-mode]').forEach((b) => { b.classList.toggle('on', b.dataset.mode === view.mode); b.setAttribute('aria-pressed', b.dataset.mode === view.mode); });
  };
  ctx.on('input', '#fq', (_, el) => { view.q = el.value; refresh(); });
  ctx.on('change', '#fsort', (_, el) => { view.sort = el.value; refresh(); });
  ctx.on('change', '#fmem', (_, el) => { view.memory = el.checked; refresh(); });
  ctx.on('click', '[data-scroll]', (_, b) => {
    const row = b.closest('.year-group')?.querySelector('.tile-row'); if (!row) return;
    const start = row.scrollLeft, max = row.scrollWidth - row.clientWidth;
    const target = Math.max(0, Math.min(max, start + (+b.dataset.scroll) * Math.round(row.clientWidth * 0.85)));
    row.scrollTo({ left: target, behavior: 'smooth' });
    setTimeout(() => { if (Math.abs(row.scrollLeft - start) < 2 && Math.abs(target - start) > 2) row.scrollTo({ left: target, behavior: 'auto' }); }, 450); // if smooth scrolling is unavailable, still move
  });
  ctx.on('click', '[data-year]', (_, b) => { view.year = view.year === b.dataset.year ? 'all' : b.dataset.year; refresh(); });
  ctx.on('click', '[data-mode]', (_, b) => { view.mode = b.dataset.mode; refresh(); });
  ctx.on('click', '[data-action=clear]', () => { Object.assign(view, { sort: 'newest', year: 'all', q: '', memory: false }); ctx.rerun(); });
}

const MILESTONES = [1, 5, 10, 25, 50, 100, 150, 200, 300, 500, 1000];
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function stats(ctx) {
  const entries = await ctx.guard(() => app.api.listEntries({ userId: app.profile.id }));
  if (!entries) return;
  const s = computeStats(entries);
  if (!entries.length) {
    ctx.setHTML(`<header class="page-head"><h1 class="title" tabindex="-1">Your numbers.</h1></header>${archiveTabs('stats')}<div class="card">${emptyState('Nothing to count yet.', 'Log a few shows and your numbers show up here.', '<a class="btn-block inline" href="#/log">Log a show</a>')}</div>`);
    return;
  }
  const next = MILESTONES.find((m) => m > s.total) || s.total + 100;
  const prev = [...MILESTONES].reverse().find((m) => m <= s.total) || 0;
  const pct = Math.round(((s.total - prev) / (next - prev)) * 100);
  const [topArtist, topCount] = s.artists[0] || [];
  const recapPhoto = entries.find((e) => e.artistName === topArtist)?.cover?.url || '';
  const bands = [[9, 10], [7, 8], [5, 6], [3, 4], [1, 2]].map(([a, b]) => [a, b, s.ratings[a - 1] + s.ratings[b - 1]]);
  const maxRating = Math.max(1, ...bands.map((b) => b[2]));
  const years = yearRange(entries);
  const byMonth = {}; entries.forEach((e) => { const k = e.date.slice(0, 7); byMonth[k] = (byMonth[k] || 0) + 1; });
  const busiest = [...s.years].sort((a, b) => b[1] - a[1])[0];
  const matrix = [...years].reverse().map((y) => `<div class="mx-year">${y}</div>${MONTH_NAMES.map((m, i) => { const n = byMonth[`${y}-${String(i + 1).padStart(2, '0')}`] || 0; return `<i class="dot ${n ? 'on n' + Math.min(n, 3) : ''}" title="${m} ${y}: ${n} show${n === 1 ? '' : 's'}"></i>`; }).join('')}`).join('');

  ctx.setHTML(`<header class="page-head"><h1 class="title" tabindex="-1">Your numbers.</h1><p class="sub">${s.total} shows across ${years.length} year${years.length === 1 ? '' : 's'}${s.first ? `, starting ${esc(formatDate(s.first))}` : ''}.</p></header>
    ${archiveTabs('stats')}
    <div class="stats-hero">
      <div class="big-numbers"><div><b>${s.total}</b><span>Shows</span></div><div><b>${s.artists.length}</b><span>Artists</span></div><div><b>${s.venues.length}</b><span>Venues</span></div><div><b>${s.avgRating ? s.avgRating.toFixed(1) : '—'}</b><span>Average stars</span></div></div>
      <div class="recap cover ${coverClass(recapPhoto)}" style="${coverStyle(topArtist || 'recap', recapPhoto)}">
        <div><h2>Your life in concerts.</h2><p>${topArtist ? `${esc(topArtist)} leads with ${topCount} show${topCount === 1 ? '' : 's'}.` : ''}${busiest ? ` Busiest year: ${busiest[0]}.` : ''} ${next - s.total} to go until show ${next}.</p></div>
        <button class="btn" type="button" data-action="share-recap">${'Share your recap'}</button>
      </div>
    </div>
    <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progress to ${next} shows"><span style="width:${pct}%"></span></div>
    ${sectionHead('Every year, month by month')}
    <div class="card matrix-card"><div class="matrix" role="img" aria-label="Shows by month for each year. ${esc(s.years.map(([y, n]) => `${y}: ${n}`).join(', '))}"><div></div>${MONTHS.map((m, i) => `<div class="mx-head" title="${MONTH_NAMES[i]}">${m}</div>`).join('')}${matrix}</div></div>
    <div class="cols-2">
      <div>${sectionHead('Most-seen artists')}<div class="card list-card">${rankList(s.artists.slice(0, 8), { hrefFor: (n) => `#/search?q=${encodeURIComponent(n)}` })}</div></div>
      <div>${sectionHead('Favourite rooms')}<div class="card list-card">${rankList(s.venues.slice(0, 8))}</div></div>
      ${s.genres.length ? `<div>${sectionHead('Genres')}<div class="card list-card">${rankList(s.genres.slice(0, 6))}</div></div>` : ''}
      <div>${sectionHead('How you rate')}<div class="card"><div class="rating-bars">${bands.map(([a, b, n]) => `<div class="rating-row"><span class="band">${a}–${b}</span><div class="progress thin"><span style="width:${(n / maxRating) * 100}%"></span></div><span class="meta">${n}</span></div>`).join('')}</div></div></div>
    </div>
    <p class="sub center" style="margin-top:28px">${s.memoryCount} of ${s.total} shows were logged from memory. We trust you.</p>`);
  ctx.on('click', '[data-action=share-recap]', async () => {
    try { await shareRecap({ username: app.profile.username, total: s.total, artists: s.artists.length, venues: s.venues.length, top: s.artists.slice(0, 3), since: years[0] }); toast('Recap image ready'); }
    catch (e) { toast(friendlyError(e), 'error'); }
  });
}
