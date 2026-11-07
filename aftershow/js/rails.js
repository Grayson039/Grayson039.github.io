// Right-hand rail cards that fill the open space beside a page's main column.
import { ICON, coverStyle, coverClass } from './ui.js';
import { esc, formatDate } from './util.js';

export const railCard = (title, body, more = '') => `<section class="rail-card"><h2>${title}</h2>${body}${more}</section>`;

const mini = (name, url) => `<span class="mini-cover ${coverClass(url)}" style="${coverStyle(name, url)}"></span>`;

export function withRail(main, rail) {
  return `<div class="with-rail"><div class="rail-main">${main}</div><aside class="rail" aria-label="More">${rail}</aside></div>`;
}

// shows that have photos you have not voted on yet
export function needsVote(photos) {
  const by = new Map();
  (photos || []).forEach((p) => { if (!by.has(p.showId)) by.set(p.showId, []); by.get(p.showId).push(p); });
  return [...by.values()].filter((ps) => ps.some((p) => p.canVote) && !ps.some((p) => p.votedByMe)).length;
}

export function voteCta(photos) {
  const n = needsVote(photos);
  return `<a class="rail-cta" href="#/vote"><span class="vb-ico" aria-hidden="true">${ICON.camera}</span><span class="vb-text"><b>${n ? `${n} show${n === 1 ? '' : 's'} need your vote` : 'Vote on cover photos'}</b><span>${n ? 'Pick the best shot for each one.' : 'Help choose each show’s cover.'}</span></span><span class="chev" aria-hidden="true">›</span></a>`;
}

export function mostSeenCard(stats, entries) {
  const top = (stats.artists || []).slice(0, 5);
  if (!top.length) return '';
  const rows = top.map(([name, n]) => {
    const e = entries.find((x) => x.artistName === name);
    return `<a class="rail-row" href="#/artist/${e?.artistId || ''}">${mini(name, e?.cover?.url)}<span class="info"><b>${esc(name)}</b><span>${n} show${n === 1 ? '' : 's'}</span></span></a>`;
  }).join('');
  return railCard('Most seen', rows);
}

export function milestoneCard(total) {
  const MILESTONES = [1, 5, 10, 25, 50, 100, 150, 200, 300, 500, 1000];
  const next = MILESTONES.find((m) => m > total) || total + 1;
  const prev = [...MILESTONES].reverse().find((m) => m <= total) || 0;
  const pct = Math.round(((total - prev) / (next - prev)) * 100);
  return railCard('Next milestone', `<p class="rail-big"><b>${next - total}</b> to go until show ${next}</p><div class="progress thin" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Progress to show ${next}"><span style="width:${pct}%"></span></div>`);
}

export function thisMonthCard(entries) {
  const now = new Date(); const m = String(now.getMonth() + 1).padStart(2, '0');
  const list = entries.filter((e) => e.date.slice(5, 7) === m && +e.date.slice(0, 4) < now.getFullYear()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  if (!list.length) return '';
  const month = now.toLocaleDateString(undefined, { month: 'long' });
  return railCard(`${month}, in years past`, list.map((e) => `<a class="rail-row" href="#/entry/${e.id}">${mini(e.artistName, e.cover?.url)}<span class="info"><b>${esc(e.artistName)}</b><span>${esc(formatDate(e.date))}</span></span></a>`).join(''));
}

export function needsPhotoCard(entries) {
  const list = entries.filter((e) => !e.photos?.length).slice(0, 3);
  if (!list.length) return '';
  return railCard('Add a photo', `<p class="sub" style="margin-bottom:6px">Your own photo becomes that show’s cover.</p>${list.map((e) => `<a class="rail-row" href="#/entry/${e.id}">${mini(e.artistName, e.cover?.url)}<span class="info"><b>${esc(e.artistName)}</b><span>${esc(formatDate(e.date))}</span></span><span class="meta">Add</span></a>`).join('')}`);
}

const photoRow = (p, sh, right) => `<a class="rail-row" href="#/show/${sh.id}"><span class="mini-cover cover photo" style="--photo:url('${esc(p.url)}')"></span><span class="info"><b>${esc(sh.artistName)}</b><span>${esc(formatDate(sh.date))}</span></span><span class="meta">${right}</span></a>`;

export function topPhotosCard(photos, showMap, n = 5) {
  const top = [...(photos || [])].filter((p) => showMap.has(p.showId)).sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, n);
  if (!top.length) return '';
  return railCard('Top photos right now', top.map((p, i) => `<a class="rail-row" href="#/show/${p.showId}"><span class="rank-no">${i + 1}</span><span class="mini-cover cover photo" style="--photo:url('${esc(p.url)}')"></span><span class="info"><b>${esc(showMap.get(p.showId).artistName)}</b><span>by ${esc(p.uploaderName || 'a fan')}</span></span><span class="meta">▲ ${Number(p.votes || 0).toLocaleString()}</span></a>`).join(''));
}

export function yourPhotosCard(photos, showMap, meId) {
  const mine = (photos || []).filter((p) => p.uploaderId === meId && showMap.has(p.showId)).sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 4);
  if (!mine.length) return '';
  return railCard('Your photos', mine.map((p) => photoRow(p, showMap.get(p.showId), `▲ ${Number(p.votes || 0).toLocaleString()}`)).join(''));
}

export function yourVotesCard(photos, showMap) {
  const voted = (photos || []).filter((p) => p.votedByMe && showMap.has(p.showId)).slice(0, 5);
  return railCard('Your votes', voted.length ? voted.map((p) => photoRow(p, showMap.get(p.showId), p.uploaderName || '')).join('') : '<p class="sub">You haven’t voted yet. Pick a photo and it shows up here.</p>');
}

export function spotlightCard(a) {
  if (!a) return '';
  const url = a.photo?.url || '';
  return `<a class="rail-spot ${coverClass(url)}" style="${coverStyle(a.name, url)}" href="#/artist/${a.id}"><span class="cover-meta">Spotlight</span><span class="cover-name">${esc(a.name)}</span><span class="cover-meta">${a.logs} log${a.logs === 1 ? '' : 's'}</span></a>`;
}

export function recentShowsCard(entries) {
  const list = [...(entries || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  if (!list.length) return '';
  return railCard('Your latest shows', list.map((e) => `<a class="rail-row" href="#/entry/${e.id}">${mini(e.artistName, e.cover?.url)}<span class="info"><b>${esc(e.artistName)}</b><span>${esc(formatDate(e.date))}</span></span></a>`).join(''), '<a class="rail-more" href="#/shows">See all</a>');
}

export const liveCta = () => `<a class="rail-cta" href="#/log?mode=live"><span class="vb-ico" aria-hidden="true"><span class="pilot on" style="margin:0"></span></span><span class="vb-text"><b>At a show right now?</b><span>Log it live and start the setlist.</span></span><span class="chev" aria-hidden="true">›</span></a>`;
