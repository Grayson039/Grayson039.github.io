// Shared UI building blocks (all return HTML strings; views own the DOM).
import { esc, initials, ratingDial, formatDate, relativeTime } from './util.js';

export const app = { api: null, profile: null, theme: 'dark', mode: 'live' };

/* ---------- icons ---------- */
export const ICON = {
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.6 4.5 6.9 4.5c2 0 3.5 1.1 5.1 3 1.6-1.9 3.1-3 5.1-3 3.3 0 5.3 3.1 4.1 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 13v7h14v-7"/></svg>'
};

export function avatar(url, name, size = 38) {
  const style = `width:${size}px;height:${size}px;font-size:${Math.max(11, Math.round(size / 3.2))}px`;
  return url
    ? `<img class="avatar" style="${style}" src="${esc(url)}" alt="" loading="lazy">`
    : `<span class="avatar" style="${style}" aria-hidden="true">${esc(initials(name))}</span>`;
}

/* ---------- covers: every artist gets a deterministic look; a photo replaces it when there is one ---------- */
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const PALETTES = [['#FF6A3D', '#6B1608'], ['#5E6BFF', '#141A66'], ['#2FD08A', '#08402B'], ['#B655FF', '#3A0F66'], ['#44B5E8', '#0A3350'], ['#FF4F7E', '#5E0C28'], ['#19C3B8', '#06403D'], ['#A6D63B', '#2F4A06']];
export function paletteFor(name) {
  const h = hash(name); const [c1, c2] = PALETTES[h % PALETTES.length];
  return { c1, c2, x: 15 + ((h >> 4) % 70), y: 10 + ((h >> 9) % 55) };
}
export function coverStyle(name, photo) {
  const { c1, c2, x, y } = paletteFor(name);
  return `--x:${x}%;--y:${y}%;--c1:${c1};--c2:${c2};${photo ? `--photo:url('${String(photo).replace(/'/g, '%27')}');` : ''}`;
}
export const coverClass = (photo) => `cover${photo ? ' photo' : ''}`;

export function pageHeader(_eyebrow, title, sub = '', extra = '') {
  return `<header class="page-head"><h1 class="title" tabindex="-1">${esc(title)}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}${extra}</header>`;
}
export const sectionHead = (label, right = '') => `<div class="section-head"><h2 class="label">${esc(label)}</h2>${right}</div>`;
export const statTile = (num, label) => `<div class="stat-tile"><div class="stat-num">${esc(num)}</div><div class="stat-label">${esc(label)}</div></div>`;
export const statRow = (tiles) => `<div class="stat-row">${tiles.map(([n, l]) => statTile(n, l)).join('')}</div>`;

export function tabs(items, active, { label = 'Sections', attr = 'href' } = {}) {
  return `<nav class="tabs" aria-label="${esc(label)}">${items.map((i) =>
    attr === 'href'
      ? `<a class="tab ${i.id === active ? 'active' : ''}" href="${i.href}" ${i.id === active ? 'aria-current="page"' : ''}>${i.lamp != null ? `<i class="pilot ${i.lamp ? 'on' : 'off'}" aria-hidden="true"></i>` : ''}${esc(i.label)}</a>`
      : `<button type="button" class="tab ${i.id === active ? 'active' : ''}" data-tab="${i.id}" aria-pressed="${i.id === active}">${esc(i.label)}</button>`).join('')}</nav>`;
}

export function skeleton(rows = 4) {
  return `<div class="card skeleton" aria-busy="true" aria-label="Loading"><span class="sr-only">Loading…</span>${Array.from({ length: rows }, (_, i) => `<div class="sk-row"><div class="sk-line w${40 + ((i * 17) % 50)}"></div><div class="sk-line sm w${30 + ((i * 23) % 40)}"></div></div>`).join('')}</div>`;
}
export function emptyState(title, text = '', cta = '') {
  return `<div class="empty"><div class="empty-title">${esc(title)}</div>${text ? `<p>${text}</p>` : ''}${cta}</div>`;
}
export function errorState(err, { retry = true } = {}) {
  const m = esc(err?.friendly || err?.message || 'Something went wrong.');
  return `<div class="card error-card" role="alert"><div class="empty-title" style="color:var(--live-text)">Something broke</div><p class="sub" style="margin-bottom:14px">${m}</p>${retry ? '<button class="btn primary" type="button" data-action="retry">Try again</button>' : ''}</div>`;
}

export const memoryTag = (e) => (e.fromMemory ? '<span class="tag">From memory</span>' : '');
export const liveTag = (e) => (e.isLive ? '<span class="live-badge"><span class="live-dot"></span>Live</span>' : '');

export function likeButton(e) {
  return `<button type="button" class="like-btn ${e.likedByMe ? 'on' : ''}" data-action="like" data-id="${e.id}" aria-pressed="${e.likedByMe}" aria-label="${e.likedByMe ? 'Unlike' : 'Like'} this log">${ICON.heart}<span class="like-count">${e.likeCount || 0}</span></button>`;
}
const shortDate = (iso) => formatDate(iso);

/* A person's log in a feed (Instagram-style: who, big image, reactions, what they wrote). */
export function post(e, { fallbackPhoto = '' } = {}) {
  const ph = asPhoto(e.cover || e.photos?.[0] || fallbackPhoto); const photo = ph?.url || '';
  const where = [e.venueName, e.city].filter(Boolean).join(', ');
  const peek = (e.setlist || []).slice(0, 3);
  return `<article class="post">
    <div class="post-head">${avatar(e.avatarUrl, e.username, 40)}
      <div class="who"><a class="name" href="#/u/${encodeURIComponent(e.username)}">${esc(e.username)}</a><span class="meta">${esc(where)}</span></div>
      <span class="when">${esc(relativeTime(e.createdAt))}</span></div>
    <a class="post-media ${coverClass(photo)}" style="${coverStyle(e.artistName, photo)}" href="#/entry/${e.id}" aria-label="${esc(e.artistName)}, ${esc(where)}">
      <div class="badges">${liveTag(e)}${memoryTag(e)}</div>
      <div class="bottom"><div class="cover-name">${esc(e.artistName)}</div><div class="venue">${esc(e.venueName)}</div><div class="cover-meta">${esc(shortDate(e.date))}</div></div>${ph && ph.uploaderName !== e.username ? creditHtml(ph, !!ph.community) : ''}
    </a>
    <div class="post-actions">${likeButton(e)}<a class="act-btn" href="#/entry/${e.id}?c=1" aria-label="${e.commentCount || 0} comments">${ICON.comment}<span>${e.commentCount || 0}</span></a><span class="grow"></span>${ratingDial(e.rating)}</div>
    <div class="post-body">${e.note ? `<b>${esc(e.username)}</b> <span class="note">${esc(e.note)}</span>` : ''}
      ${peek.length ? `<div class="setlist-peek">${peek.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}${e.setlist.length > 3 ? `<span class="chip">+${e.setlist.length - 3} more</span>` : ''}</div>` : ''}</div>
    ${e.commentCount ? `<a class="post-foot-link" href="#/entry/${e.id}?c=1">View all ${e.commentCount} comment${e.commentCount === 1 ? '' : 's'}</a>` : ''}
  </article>`;
}


// A cover photo can be a plain URL or a photo object ({ url, uploaderName }). Credit shows who took it.
const asPhoto = (p) => (p && typeof p === 'object' ? p : p ? { url: p } : null);
export function creditHtml(ph, community = false, link = false) {
  if (!ph || !ph.uploaderName) return '';
  const who = link ? `<a class="cr-link" href="#/u/${encodeURIComponent(ph.uploaderName)}">${esc(ph.uploaderName)}</a>` : esc(ph.uploaderName);
  const votes = community && ph.votes != null ? `<small>${Number(ph.votes).toLocaleString()} vote${ph.votes === 1 ? '' : 's'}</small>` : '';
  return `<span class="t-credit${votes ? ' has-votes' : ''}" title="Photo by ${esc(ph.uploaderName)}${votes ? ', the community’s top-voted photo' : ''}">${ICON.camera}<span class="who"><b>${who}</b>${votes}</span></span>`;
}

/* Archive tile: a portrait "poster" for one show. */
export function tile(e, { fallbackPhoto = '', showYear = true } = {}) {
  const ph = asPhoto(e.cover || e.photos?.[0] || fallbackPhoto); const photo = ph?.url || '';
  const when = [e.date ? formatDate(e.date) : '', e.city].filter(Boolean).join(' · ');
  // Resting state: name + rating only. Hover/focus opens the poster to show venue, date, uploader and votes.
  return `<article class="tile ${coverClass(photo)}" style="${coverStyle(e.artistName, photo)}">
    <div class="t-top">${e.fromMemory ? '<span class="tag" title="Logged from memory">Memory</span>' : ''}</div>
    <div class="t-bottom"><h3 class="cover-name"><a class="stretch" href="#/entry/${e.id}">${esc(e.artistName)}</a></h3>
      <div class="t-more"><div class="t-more-in"><div class="t-venue">${esc(e.venueName)}</div><div class="cover-meta t-when">${esc(when)}</div></div></div>${ratingDial(e.rating)}</div>${creditHtml(ph, ph?.community ?? !e.photos?.[0], true)}
  </article>`;
}
export function diaryRow(e, { fallbackPhoto = '' } = {}) {
  const photo = asPhoto(e.cover || e.photos?.[0] || fallbackPhoto)?.url || '';
  return `<div class="diary-row"><span class="d-date">${esc(shortDate(e.date))}</span><span class="mini-cover ${coverClass(photo)}" style="${coverStyle(e.artistName, photo)}"></span>
    <a class="d-art stretch" href="#/entry/${e.id}">${esc(e.artistName)}</a><span class="d-ven">${esc([e.venueName, e.city].filter(Boolean).join(', '))}</span>${ratingDial(e.rating)}</div>`;
}

export function personRow(p, { showFollow = true } = {}) {
  const sub = [p.displayName, p.shows != null ? `${p.shows} shows` : ''].filter(Boolean).join(' · ');
  return `<div class="user-row">
    <a href="#/u/${encodeURIComponent(p.username)}" class="user-link" aria-label="View ${esc(p.username)}'s profile">${avatar(p.avatarUrl, p.username, 44)}</a>
    <div class="user-info"><a class="user-name" href="#/u/${encodeURIComponent(p.username)}">${esc(p.username)}</a>${p.isFollowing && p.followsMe ? ' <span class="tag">Mutual</span>' : ''}
      ${sub ? `<span class="user-meta">${esc(sub)}</span>` : ''}${p.topArtists?.length ? `<div class="user-artists">${esc(p.topArtists.join(' · '))}</div>` : ''}</div>
    ${showFollow && !p.isMe ? followButton(p.id, p.isFollowing, p.username) : ''}</div>`;
}
export function followButton(userId, on, name = '') {
  return `<button type="button" class="btn ${on ? '' : 'primary'}" data-action="follow" data-id="${userId}" data-on="${on ? 1 : 0}" aria-pressed="${!!on}" aria-label="${on ? 'Unfollow' : 'Follow'} ${esc(name)}">${on ? 'Following' : 'Follow'}</button>`;
}

export function setlistHtml(songs, { counts = null } = {}) {
  if (!songs?.length) return '<p class="sub">No setlist logged.</p>';
  return `<ol class="setlist">${songs.map((s) => `<li><span class="t">${esc(Array.isArray(s) ? s[0] : s)}</span>${counts ? `<span class="song-count">${Array.isArray(s) ? s[1] + '×' : ''}</span>` : ''}</li>`).join('')}</ol>`;
}

export function photoStrip(photos, label = 'Photos', { vote = false } = {}) {
  if (!photos?.length) return '';
  return `<div class="photo-strip" role="list" aria-label="${esc(label)}">${photos.map((p, i) => `<figure role="listitem"><img src="${esc(p.url)}" alt="Concert photo${p.uploaderName ? ' by ' + esc(p.uploaderName) : ''}" loading="lazy">
    <figcaption><span>${esc(p.uploaderName || '')}</span>${vote && p.canVote !== undefined ? (p.canVote ? `<button type="button" class="vote-btn ${p.votedByMe ? 'on' : ''}" data-action="vote-photo" data-id="${p.id}" aria-pressed="${!!p.votedByMe}" aria-label="${p.votedByMe ? 'Remove your vote' : 'Vote for this photo'}">▲ ${p.votes || 0}</button>` : (p.votes ? `<span class="vote-btn static">▲ ${p.votes}</span>` : '')) : ''}${vote && i === 0 && p.votes > 0 ? '<span class="tag">Top photo</span>' : ''}</figcaption></figure>`).join('')}</div>`;
}

export function barChart(pairs) {
  if (!pairs.length) return '<div class="empty">Not enough data yet.</div>';
  const max = Math.max(1, ...pairs.map((p) => p[1]));
  return `<div class="ribbon" role="img" aria-label="${esc(pairs.map(([l, v]) => `${l}: ${v}`).join(', '))}">${pairs.map(([l, v]) => `<div class="ribbon-bar"><span class="ribbon-fill" style="height:${Math.max(6, (v / max) * 100)}%"></span><span class="ribbon-y">${esc(String(l).length === 4 ? "'" + String(l).slice(2) : l)}</span></div>`).join('')}</div>`;
}
export function rankList(pairs, { hrefFor, unit = '×' } = {}) {
  if (!pairs.length) return '<div class="empty">Nothing yet.</div>';
  const max = Math.max(1, ...pairs.map((p) => p[1]));
  return `<ol class="rank-bars">${pairs.map(([name, n]) => `<li style="--w:${Math.round((n / max) * 100)}%"><span class="rank-name">${hrefFor ? `<a href="${hrefFor(name)}">${esc(name)}</a>` : esc(name)}</span><span class="rank-n">${n}${unit}</span></li>`).join('')}</ol>`;
}

export function knobInput(name, value = 0) {
  const v = Math.max(0, Math.min(10, +value || 0));
  const ticks = Array.from({ length: 11 }, (_, i) => `<i class="k-tick${i % 5 === 0 ? ' big' : ''}${v > 0 && i <= v ? ' on' : ''}" style="--a:${-135 + i * 27}deg"></i>`).join('');
  return `<div class="knob-input" data-knob>
    <div class="k-dial" role="slider" tabindex="0" aria-label="Rating" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${v}" aria-valuetext="${v ? v + ' out of 10' : 'Not rated'}" style="--v:${v}">${ticks}<span class="k-cap"><i></i></span></div>
    <div class="k-side">
      <div class="k-read"><output class="k-num${v ? '' : ' empty'}" aria-hidden="true">${v || '–'}</output><span>/ 10</span></div>
      <span class="k-hint">Drag the knob or use the arrow keys. Save the top end for nights that wrecked you.</span>
      <button type="button" class="btn star-clear" data-action="clear-rating">Clear</button>
    </div>
    <input type="hidden" name="${name}" value="${v || ''}">
  </div>`;
}

// Wires every knob inside ctx.view: pointer drag, arrow keys, Clear. Fires a bubbling "change" on the hidden input.
export function bindKnob(ctx) {
  const set = (box, raw) => {
    const v = Math.max(0, Math.min(10, Math.round(raw)));
    const dial = box.querySelector('.k-dial');
    dial.style.setProperty('--v', v);
    dial.setAttribute('aria-valuenow', v);
    dial.setAttribute('aria-valuetext', v ? `${v} out of 10` : 'Not rated');
    const num = box.querySelector('.k-num'); num.textContent = v || '–'; num.classList.toggle('empty', !v);
    dial.querySelectorAll('.k-tick').forEach((t, i) => t.classList.toggle('on', v > 0 && i <= v));
    const input = box.querySelector('input[type=hidden]');
    if (input.value !== String(v || '')) { input.value = v || ''; input.dispatchEvent(new Event('change', { bubbles: true })); }
    return v;
  };
  const read = (box) => +box.querySelector('input[type=hidden]').value || 0;
  const fromPoint = (dial, e, last) => {
    const r = dial.getBoundingClientRect();
    const a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
    let v = (Math.max(-135, Math.min(135, a)) + 135) / 27;
    if (Math.abs(v - last) > 5) v = last < 5 ? 0 : 10; // the knob has stops; don't spin through the bottom
    return v;
  };
  ctx.view.addEventListener('pointerdown', (e) => {
    const dial = e.target.closest('.k-dial'); if (!dial) return;
    const box = dial.closest('[data-knob]'); dial.focus(); dial.setPointerCapture(e.pointerId);
    set(box, fromPoint(dial, e, read(box) || 5));
    const move = (ev) => set(box, fromPoint(dial, ev, read(box)));
    const up = () => { dial.removeEventListener('pointermove', move); dial.removeEventListener('pointerup', up); dial.removeEventListener('pointercancel', up); };
    dial.addEventListener('pointermove', move); dial.addEventListener('pointerup', up); dial.addEventListener('pointercancel', up);
  });
  ctx.view.addEventListener('keydown', (e) => {
    const dial = e.target.closest('.k-dial'); if (!dial) return;
    const box = dial.closest('[data-knob]'); const v = read(box);
    const map = { ArrowUp: v + 1, ArrowRight: v + 1, ArrowDown: v - 1, ArrowLeft: v - 1, PageUp: v + 2, PageDown: v - 2, Home: 0, End: 10 };
    if (e.key in map) { e.preventDefault(); set(box, map[e.key]); }
  });
  ctx.view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action=clear-rating]'); if (b) set(b.closest('[data-knob]'), 0);
  });
}

/* ---------- toasts, dialogs ---------- */
export function toast(msg, kind = '') {
  let host = document.getElementById('toasts');
  if (!host) { host = Object.assign(document.createElement('div'), { id: 'toasts' }); host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
  const t = Object.assign(document.createElement('div'), { className: 'toast ' + kind, textContent: msg });
  host.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, kind === 'error' ? 5000 : 2600);
}
export function confirmDialog(title, text, okLabel = 'Delete') {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'dialog';
    d.innerHTML = `<form method="dialog"><h2>${esc(title)}</h2><p class="sub">${esc(text)}</p><div class="dialog-actions"><button class="btn" value="cancel">Cancel</button><button class="btn danger" value="ok" autofocus>${esc(okLabel)}</button></div></form>`;
    document.body.appendChild(d);
    d.addEventListener('close', () => { resolve(d.returnValue === 'ok'); d.remove(); });
    d.showModal();
  });
}

export function reportDialog(label = 'this') {
  return new Promise((resolve) => {
    const d = document.createElement('dialog'); d.className = 'dialog';
    d.innerHTML = `<form method="dialog"><h2>Report ${esc(label)}</h2><p class="sub">Tell us what is wrong. A person reads every report. For copyright, see <a href="photo-ugc-license.html" target="_blank" rel="noopener">the takedown steps</a>.</p>
      <div class="field"><label for="rReason">Reason</label><select id="rReason"><option>Not their photo or copyright</option><option>Inappropriate or unsafe</option><option>Spam</option><option>Harassment</option><option>Something else</option></select></div>
      <div class="field"><label for="rNote">Details (optional)</label><textarea id="rNote" rows="3" maxlength="400"></textarea></div>
      <div class="dialog-actions"><button class="btn" value="cancel">Cancel</button><button class="btn danger" value="ok">Send report</button></div></form>`;
    document.body.appendChild(d);
    d.addEventListener('close', () => { const ok = d.returnValue === 'ok'; const r = ok ? [d.querySelector('#rReason').value, d.querySelector('#rNote').value.trim()].filter(Boolean).join(': ') : null; d.remove(); resolve(r); });
    d.showModal();
  });
}
export function passwordDialog() {
  return new Promise((resolve) => {
    const d = document.createElement('dialog'); d.className = 'dialog';
    d.innerHTML = `<form method="dialog"><h2>Choose a new password</h2><p class="sub">At least 6 characters.</p>
      <div class="field"><label for="npw">New password</label><input id="npw" type="password" minlength="6" autocomplete="new-password" required></div>
      <div class="dialog-actions"><button class="btn" value="cancel">Cancel</button><button class="btn primary" value="ok">Save password</button></div></form>`;
    document.body.appendChild(d);
    d.addEventListener('close', () => { const v = d.returnValue === 'ok' ? d.querySelector('#npw').value : null; d.remove(); resolve(v && v.length >= 6 ? v : null); });
    d.showModal();
  });
}

/* ---------- poster wall: the drifting backdrop for sign-in and onboarding ---------- */
const WALL = [
  [['Tool', 'Tool.jpg'], ['Bruno Mars', 'BrunoMarsSuit.jpg'], ['Phoebe Bridgers', 'PhoebeBridgers.jpg'], ['Mastodon', 'Mastodon.jpg']],
  [['Nine Inch Nails', 'NineInchNailsArms.jpg'], ['Paramore', 'Paramore.jpg'], ['Deftones', 'DeftonesStage.jpg'], ['Moe Shop', 'MoeShop.jpg']],
  [['The Black Queen', 'BlackQueenDuo.jpg'], ['Tool', 'ToolStage.jpg'], ['Bruno Mars', 'BrunoMarsCongas.jpg'], ['Deftones', 'Deftones.jpg']]
];
export const posterWall = () => `<div class="gate-wall" aria-hidden="true">${WALL.map((col, i) => {
  const posters = col.map(([n, f]) => `<span class="wall-poster cover photo" style="--photo:url('${f}')"><span class="cover-name">${n}</span></span>`).join('');
  return `<div class="wall-col c${i + 1}">${posters}${posters}</div>`; // doubled so the drift loops seamlessly
}).join('')}</div><div class="gate-shade" aria-hidden="true"></div>`;

