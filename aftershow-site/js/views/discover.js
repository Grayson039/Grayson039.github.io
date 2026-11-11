// Tab 4: Discover / search, Artist page, Show page, Venue page.
import { app, creditHtml, sectionHead, statRow, post, emptyState, avatar, photoStrip, toast, coverStyle, coverClass, personRow, liveTag } from '../ui.js';
import { esc, debounce, formatDate, countBy, ratingDial, friendlyError, avg } from '../util.js';
import { bindSocial } from '../social.js';
import { withRail, topPhotosCard, spotlightCard, voteCta } from '../rails.js';

const ICON = { artist: '♪', venue: '⌂' };
const artistTile = (a) => `<article class="tile cover ${coverClass(a.photo?.url)}" style="${coverStyle(a.name, a.photo?.url)}"><div class="t-top"></div><div class="t-bottom"><h3 class="cover-name"><a class="stretch" href="#/artist/${a.id}">${esc(a.name)}</a></h3><div class="t-more"><div class="t-more-in"><div class="cover-meta t-when">${a.logs} log${a.logs === 1 ? '' : 's'}</div></div></div></div>${creditHtml(a.photo, true)}</article>`;

export async function search(ctx) {
  const st = { q: ctx.query.q || '', type: 'all' };
  const idle = await ctx.guard(async () => {
    const [popular, tonight, people, photos, shows] = await Promise.all([app.api.topArtists(8).catch(() => []), app.api.listEntries({ scope: 'tonight' }).catch(() => []), app.api.suggestPeople(5).catch(() => []), app.api.listPhotos({}).catch(() => []), app.api.listShows({}).catch(() => [])]);
    return { popular, tonight, people, photos, shows };
  });
  if (!idle) return;
  const showMap = new Map(idle.shows.map((x) => [x.id, x]));
  const spot = [...idle.popular].sort((a, b) => (b.photo ? 1 : 0) - (a.photo ? 1 : 0) || b.logs - a.logs)[0];
  const rail = `${spotlightCard(spot)}${topPhotosCard(idle.photos, showMap)}${voteCta(idle.photos)}`;
  ctx.setHTML(withRail(`<header class="page-head"><h1 class="title" tabindex="-1">Discover.</h1><p class="sub">Find artists, venues and the people who were there.</p></header>
    <a class="vote-banner" href="#/vote"><span class="vb-ico" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></span><span class="vb-text"><b>Vote on cover photos</b><span>Pick the best shot from shows people posted.</span></span><span class="chev" aria-hidden="true">›</span></a>
    <div class="search-box" role="search"><label class="sr-only" for="q">Search Aftershow</label><input id="q" type="search" placeholder="Search artists, venues, people" value="${esc(st.q)}" autocomplete="off"></div>
    <div class="chip-row" role="group" aria-label="Filter results" style="margin-bottom:22px">${[['all', 'All'], ['artist', 'Artists'], ['venue', 'Venues'], ['user', 'People']].map(([k, l]) => `<button type="button" class="chip ${k === 'all' ? 'active' : ''}" data-type="${k}" aria-pressed="${k === 'all'}">${l}</button>`).join('')}</div>
    <div id="results" aria-live="polite"></div>`, rail));
  const out = ctx.view.querySelector('#results');
  const home = () => {
    out.innerHTML = `${idle.tonight.length ? `${sectionHead('Happening tonight')}<div class="card list-card">${idle.tonight.slice(0, 4).map((e) => `<a class="result-row" href="#/entry/${e.id}"><span class="mini-cover ${coverClass(e.photos?.[0]?.url)}" style="${coverStyle(e.artistName, e.photos?.[0]?.url)}"></span><span class="user-info"><span class="user-name">${esc(e.artistName)}</span><span class="user-meta">${esc(e.username)} at ${esc(e.venueName)}</span></span>${liveTag(e)}</a>`).join('')}</div>` : ''}
      ${idle.popular.length ? `${sectionHead('Most-logged artists')}<div class="tile-grid">${idle.popular.map(artistTile).join('')}</div>` : ''}
      ${idle.people.length ? `${sectionHead('People to follow')}<div class="card list-card">${idle.people.map((p) => personRow(p)).join('')}</div>` : ''}`;
  };
  const row = (r) => {
    const href = r.type === 'user' ? `#/u/${encodeURIComponent(r.name)}` : `#/${r.type}/${r.id}`;
    return `<a class="result-row" href="${href}">${r.type === 'user' ? avatar(r.avatarUrl, r.name, 44) : (r.photo ? `<span class="mini-cover ${coverClass(r.photo.url)}" style="width:44px;height:44px;${coverStyle(r.name, r.photo.url).replace(/^/, '')}" aria-hidden="true"></span>` : `<span class="avatar sq" style="width:44px;height:44px" aria-hidden="true">${ICON[r.type]}</span>`)}<span class="user-info"><span class="user-name">${esc(r.name)}</span><span class="user-meta">${esc(r.type === 'user' ? 'Person' : r.type[0].toUpperCase() + r.type.slice(1))}${r.sub ? ' · ' + esc(r.sub) : ''}</span></span><span class="chev" aria-hidden="true">›</span></a>`;
  };
  let seq = 0;
  const run = async () => {
    const q = st.q.trim(); const my = ++seq;
    if (!q) return home();
    out.innerHTML = '<p class="sub">Searching…</p>';
    try {
      const res = await app.api.search(q, st.type);
      if (my !== seq || !ctx.alive()) return;
      out.innerHTML = res.length ? `<div class="card list-card">${res.map(row).join('')}</div>` : `<div class="card">${emptyState(`No matches for “${q}”.`, st.type === 'artist' || st.type === 'all' ? 'Seen them live? <a class="link" href="#/log?artist=' + encodeURIComponent(q) + '">Log the show</a> and they’ll appear here.' : '')}</div>`;
    } catch (e) { if (my === seq) out.innerHTML = `<p class="err" role="alert">${esc(friendlyError(e))} <button class="btn" data-action="retry-search">Retry</button></p>`; }
  };
  const debounced = debounce(run, 250);
  ctx.on('input', '#q', (_, el) => { st.q = el.value; debounced(); });
  ctx.on('click', '[data-type]', (_, b) => { st.type = b.dataset.type; ctx.view.querySelectorAll('[data-type]').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); }); run(); });
  ctx.on('click', '[data-action=retry-search]', run);
  bindSocial(ctx);
  run();
}

/* ---------- Artist ---------- */
export async function artistPage(ctx) {
  const d = await ctx.guard(async () => {
    const [artist, entries, shows, photos] = await Promise.all([app.api.getArtist(ctx.params.id), app.api.listEntries({ artistId: ctx.params.id }), app.api.listShows({ artistId: ctx.params.id }), app.api.listPhotos({ artistId: ctx.params.id })]);
    return { artist, entries, shows, photos };
  });
  if (!d) return;
  const { artist, entries, shows, photos } = d;
  if (!artist) { ctx.setHTML(`<header class="page-head"><h1 class="title" tabindex="-1">Artist not found.</h1><p class="sub"><a href="#/search">Back to search</a></p></header>`); return; }
  const fans = new Map(); entries.forEach((e) => fans.set(e.userId, (fans.get(e.userId) || 0) + 1));
  const repeat = [...fans.values()].filter((c) => c > 1).length;
  const topSongs = countBy(entries.flatMap((e) => e.setlist), (s) => s).slice(0, 10);
  const rating = avg(entries.map((e) => e.rating));
  const heroPhoto = photos[0]?.url;
  const followBtn = (on) => `<button type="button" class="btn ${on ? '' : 'primary'}" data-action="follow-artist" aria-pressed="${on}">${on ? 'Following' : 'Follow'}</button>`;
  document.title = `${artist.name} · Aftershow`;
  ctx.setHTML(`
    <a class="back" href="#/search">← Discover</a>
    <header class="artist-hero ${coverClass(heroPhoto)}" style="${coverStyle(artist.name, heroPhoto)}">
      <div>${artist.genres.map((g) => `<span class="tag">${esc(g)}</span>`).join(' ')}</div>
      <h1 class="cover-name" tabindex="-1" style="outline:none">${esc(artist.name)}</h1>
      <div class="detail-actions" id="followWrap" style="margin:0">${followBtn(artist.followedByMe)}<a class="btn" href="#/log?artist=${encodeURIComponent(artist.name)}">Log a show</a><span class="cover-meta"><span id="fcount">${artist.followerCount}</span> following</span></div>
    </header>
    ${statRow([[entries.length, 'Logs'], [fans.size, 'Fans'], [repeat, 'Seen them twice+'], [rating ? rating.toFixed(1) : '—', 'Avg rating']])}
    <nav class="learn-links" aria-label="More about ${esc(artist.name)}"><span>More about them</span>
      <a href="https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(artist.name + ' band musician')}" target="_blank" rel="noopener noreferrer">Wikipedia</a>
      <a href="https://www.setlist.fm/search?query=${encodeURIComponent(artist.name)}" target="_blank" rel="noopener noreferrer">Setlist.fm</a>
      <a href="https://musicbrainz.org/search?type=artist&query=${encodeURIComponent(artist.name)}" target="_blank" rel="noopener noreferrer" title="Official site and social links">Socials &amp; links</a></nav>
    ${photos.length ? `${sectionHead('Fan photos')}<div class="card">${photoStrip(photos.slice(0, 6), 'Community photos', { vote: true })}</div>` : ''}
    ${topSongs.length ? `${sectionHead('Most-played songs')}<div class="card list-card"><ol class="song-list">${topSongs.map(([s, n]) => `<li><span class="t">${esc(s)}</span><span class="song-count">${n} setlist${n === 1 ? '' : 's'}</span></li>`).join('')}</ol></div>` : ''}
    ${sectionHead('Shows')}<div class="card list-card">${shows.length ? shows.slice(0, 12).map(showRow).join('') : emptyState('No shows logged.')}</div>
    ${sectionHead('Fan logs')}<div class="feed-col" style="max-width:600px">${entries.length ? [...entries].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5).map((e) => post(e)).join('') : `<div class="card">${emptyState('No logs yet.')}</div>`}</div>`);
  bindSocial(ctx);
  ctx.on('click', '[data-action=follow-artist]', async (_, btn) => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.disabled = true;
    try {
      await app.api.setFollowArtist(artist.id, on);
      ctx.view.querySelector('#followWrap button[data-action=follow-artist]').outerHTML = followBtn(on);
      const c = ctx.view.querySelector('#fcount'); c.textContent = Math.max(0, +c.textContent + (on ? 1 : -1));
      toast(on ? `Following ${artist.name}` : `Unfollowed ${artist.name}`);
    } catch (e) { toast(friendlyError(e), 'error'); btn.disabled = false; }
  });
}

const showRow = (s) => `<a class="result-row" href="#/show/${s.id}"><span class="mini-cover ${coverClass(s.cover?.url)}" style="width:44px;height:44px;${coverStyle(s.artistName, s.cover?.url)}" aria-hidden="true"></span><span class="user-info"><span class="user-name">${esc(s.venueName)}${s.city ? ', ' + esc(s.city) : ''}</span><span class="user-meta">${esc(formatDate(s.date))} · ${s.logCount} log${s.logCount === 1 ? '' : 's'}</span></span>${ratingDial(s.avgRating ? Math.round(s.avgRating) : 0)}<span class="chev" aria-hidden="true">›</span></a>`;

/* ---------- Show page: every fan's log of one concert + aggregated setlist ---------- */
export async function showPage(ctx) {
  const d = await ctx.guard(async () => {
    const [show, entries, photos] = await Promise.all([app.api.getShow(ctx.params.id), app.api.listEntries({ showId: ctx.params.id }), app.api.listPhotos({ showId: ctx.params.id })]);
    return { show, entries, photos };
  });
  if (!d) return;
  const { show, entries, photos } = d;
  if (!show) { ctx.setHTML(`<header class="page-head"><h1 class="title" tabindex="-1">Show not found.</h1><p class="sub"><a href="#/search">Back to search</a></p></header>`); return; }
  const rating = avg(entries.map((e) => e.rating));
  const songs = countBy(entries.flatMap((e) => e.setlist), (s) => s).slice(0, 40);
  const iLogged = entries.some((e) => e.userId === app.profile.id);
  const heroPhoto = photos[0]?.url;
  document.title = `${show.artistName} @ ${show.venueName} · Aftershow`;
  ctx.setHTML(`
    <a class="back" href="#/artist/${show.artistId}">← ${esc(show.artistName)}</a>
    <header class="artist-hero ${coverClass(heroPhoto)}" style="${coverStyle(show.artistName, heroPhoto)}">
      <span class="cover-meta">${esc(formatDate(show.date))}</span>
      <h1 class="cover-name" tabindex="-1" style="outline:none">${esc(show.artistName)}</h1>
      <p style="font-size:18px;font-weight:600"><a href="#/venue/${show.venueId}">${esc(show.venueName)}</a>${show.city ? ', ' + esc(show.city) : ''}</p>
      ${iLogged ? '' : `<div class="detail-actions" style="margin:0"><a class="btn primary" href="#/log?artist=${encodeURIComponent(show.artistName)}&venue=${encodeURIComponent(show.venueName)}">I was there — log it</a></div>`}
    </header>
    ${statRow([[entries.length, 'Logs'], [rating ? rating.toFixed(1) : '—', 'Avg rating'], [songs.length, 'Songs logged']])}
    ${photos.length ? `${sectionHead('Photos')}<div class="card">${photoStrip(photos, 'Photos from this show', { vote: true })}</div>` : ''}
    ${songs.length ? `${sectionHead('The setlist, as fans remember it')}<div class="card list-card"><ol class="song-list">${songs.map(([s, n]) => `<li><span class="t">${esc(s)}</span><span class="song-count">${n} fan${n === 1 ? '' : 's'}</span></li>`).join('')}</ol></div>` : ''}
    ${sectionHead('Fan logs')}<div class="feed-col" style="max-width:600px">${entries.length ? entries.map((e) => post(e)).join('') : `<div class="card">${emptyState('No logs yet.')}</div>`}</div>`);
  bindSocial(ctx);
}

export async function venuePage(ctx) {
  const d = await ctx.guard(async () => ({ venue: await app.api.getVenue(ctx.params.id), shows: await app.api.listShows({ venueId: ctx.params.id }) }));
  if (!d) return;
  if (!d.venue) { ctx.setHTML(`<header class="page-head"><h1 class="title" tabindex="-1">Venue not found.</h1><p class="sub"><a href="#/search">Back to search</a></p></header>`); return; }
  ctx.setHTML(`<a class="back" href="#/search">← Discover</a><header class="page-head"><h1 class="title" tabindex="-1">${esc(d.venue.name)}</h1><p class="sub">${esc(d.venue.city)}</p></header>
    ${statRow([[d.shows.length, 'Shows logged'], [new Set(d.shows.map((s) => s.artistId)).size, 'Artists']])}
    ${sectionHead('Shows here')}<div class="card list-card">${d.shows.length ? d.shows.map((s) => `<a class="result-row" href="#/show/${s.id}"><span class="user-info"><span class="user-name">${esc(s.artistName)}</span><span class="user-meta">${esc(formatDate(s.date))} · ${s.logCount} log${s.logCount === 1 ? '' : 's'}</span></span><span class="chev" aria-hidden="true">›</span></a>`).join('') : emptyState('No shows logged here yet.')}</div>`);
}
