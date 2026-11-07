// Vote: go through shows people have posted photos for and pick the best shot. The top photo becomes
// the default cover for everyone who did not upload their own. One vote per show; voting again moves it.
import { app, emptyState, statRow, toast, ICON, reportDialog } from '../ui.js';
import { esc, formatDate, friendlyError, fuzzyMatch } from '../util.js';
import { withRail, railCard, yourVotesCard } from '../rails.js';

const isPrivate = () => !!app.profile.settings?.private;
const MODES = [['new', 'Newest'], ['needs', 'Needs your vote'], ['hot', 'Most votes']];

const leaderOf = (photos) => { const top = [...photos].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0]; return top && top.votes > 0 ? top.id : null; };

function photoHtml(p, show, leaderId) {
  const lead = p.id === leaderId;
  const mine = p.uploaderId === app.profile.id;
  const votes = Number(p.votes || 0);
  const action = p.canVote && !isPrivate()
    ? `<button type="button" class="vc-vote ${p.votedByMe ? 'on' : ''}" data-vote data-id="${p.id}" aria-pressed="${!!p.votedByMe}" aria-label="${p.votedByMe ? 'Remove your vote for' : 'Vote for'} this photo by ${esc(p.uploaderName)}"><span class="vc-arrow" aria-hidden="true">▲</span><span class="vc-n">${votes.toLocaleString()}</span><span class="vc-lbl">${p.votedByMe ? 'Your pick' : 'Vote'}</span></button>`
    : `<span class="vc-own">${mine ? '<b>Yours</b>' : ''}<span><span aria-hidden="true">▲</span> ${votes.toLocaleString()}<span class="sr-only"> votes</span></span></span>`;
  return `<figure class="vc-photo ${lead ? 'lead' : ''} ${p.votedByMe ? 'picked' : ''}">
    <button type="button" class="vc-img" data-zoom="${esc(p.url)}" data-by="${esc(p.uploaderName || '')}" data-id="${p.id}" aria-label="View this photo larger"><img src="${esc(p.url)}" alt="${esc(show.artistName)} concert photo by ${esc(p.uploaderName || 'a fan')}" loading="lazy"></button>
    ${lead ? '<span class="vc-crown">Current cover</span>' : ''}
    <figcaption class="vc-stub"><span class="vc-by">${ICON.camera}<b>${esc(p.uploaderName || 'fan')}</b></span>${action}</figcaption>
  </figure>`;
}

function cardHtml(show, photos) {
  const leaderId = leaderOf(photos);
  const ordered = [...photos].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  return `<article class="vote-card" data-show="${show.id}" aria-label="${esc(show.artistName)} photos">
    <header class="vc-head"><div><h2 class="vc-name"><a href="#/show/${show.id}">${esc(show.artistName)}</a></h2><p class="vc-meta">${esc([show.venueName, show.city].filter(Boolean).join(', '))} · ${esc(formatDate(show.date))}</p></div>
      <span class="vc-count">${photos.length} photo${photos.length === 1 ? '' : 's'}</span></header>
    <div class="vc-grid n${Math.min(ordered.length, 4)}">${ordered.map((p) => photoHtml(p, show, leaderId)).join('')}</div>
  </article>`;
}

export async function vote(ctx) {
  const data = await ctx.guard(async () => {
    const [photos, shows] = await Promise.all([app.api.listPhotos({}), app.api.listShows({})]);
    return { photos, shows };
  });
  if (!data) return;
  const showMap = new Map(data.shows.map((s) => [s.id, s]));
  const byShow = new Map();
  data.photos.forEach((p) => { if (showMap.has(p.showId)) { if (!byShow.has(p.showId)) byShow.set(p.showId, []); byShow.get(p.showId).push(p); } });
  const st = { q: '', mode: 'new', limit: 12 };

  const artists = [...new Set([...byShow.keys()].map((id) => showMap.get(id).artistName))].sort();
  const topArtists = Object.entries([...byShow.entries()].reduce((o, [id, ps]) => { const n = showMap.get(id).artistName; o[n] = (o[n] || 0) + ps.length; return o; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n]) => n);
  const photoCount = data.photos.length, myVotes = data.photos.filter((p) => p.votedByMe).length;

  const visible = () => {
    const q = st.q.trim().toLowerCase();
    let list = [...byShow.entries()].map(([id, photos]) => ({ show: showMap.get(id), photos }))
      .filter(({ show }) => !q || [show.artistName, show.venueName, show.city].some((x) => fuzzyMatch(x || '', q)));
    if (st.mode === 'needs') list = list.filter(({ photos }) => photos.some((p) => p.canVote) && !photos.some((p) => p.votedByMe));
    if (st.mode === 'hot') list.sort((a, b) => b.photos.reduce((s, p) => s + (p.votes || 0), 0) - a.photos.reduce((s, p) => s + (p.votes || 0), 0));
    else list.sort((a, b) => b.show.date.localeCompare(a.show.date));
    return list;
  };

  const listHtml = () => {
    const list = visible();
    if (!byShow.size) return `<div class="card">${emptyState('No photos to vote on yet.', 'Add a photo to one of your shows and it joins the vote.', '<a class="btn primary" href="#/shows">Go to my shows</a>')}</div>`;
    if (!list.length) {
      const q = st.q.trim();
      return `<div class="card">${emptyState(q ? `No photos for “${esc(q)}” yet.` : 'You’re all caught up.', q ? 'Nobody has added a photo for that artist. Went to a show? Add yours and it becomes the first entry.' : 'You’ve voted on every show that has photos. New ones appear as people upload.', q ? '<div class="empty-actions"><button class="btn" type="button" data-clear>Clear search</button><a class="btn primary" href="#/log">Log a show</a></div>' : '<button class="btn" type="button" data-mode="new">See everything</button>')}</div>`;
    }
    const shown = list.slice(0, st.limit);
    return shown.map(({ show, photos }) => cardHtml(show, photos)).join('') + (list.length > shown.length ? `<div class="center"><button class="btn" type="button" data-more>Show ${Math.min(12, list.length - shown.length)} more shows</button></div>` : '');
  };
  const chips = () => `<div class="vc-modes" role="radiogroup" aria-label="Sort and filter">${MODES.map(([id, label]) => `<button type="button" class="chip ${st.mode === id ? 'active' : ''}" role="radio" aria-checked="${st.mode === id}" data-mode="${id}">${label}</button>`).join('')}</div>`;
  const quick = () => `<div class="vc-quick" aria-label="Popular artists">${topArtists.map((n) => `<button type="button" class="chip ${st.q.toLowerCase() === n.toLowerCase() ? 'active' : ''}" data-artist="${esc(n)}">${esc(n)}</button>`).join('')}</div>`;

  const main = `${isPrivate() ? '<div class="vc-private"><b>Your profile is private.</b> Switch to public in <a href="#/settings">Settings</a> to vote and to get community covers on your own posters.</div>' : ''}<header class="page-head vc-hero"><h1 class="title" tabindex="-1">Pick the cover.</h1>
      <p class="sub">Every show gets one cover photo, and you choose it. Vote for the best shot. The top photo becomes the default cover for everyone who didn’t upload their own.</p></header>
    ${statRow([[byShow.size, 'Shows'], [photoCount, 'Photos'], [myVotes, 'Your votes']])}
    <div class="vc-bar"><div class="vc-search"><label class="sr-only" for="vq">Search for an artist’s concert photos</label>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4"/></svg>
      <input id="vq" type="search" list="vArtists" placeholder="Find an artist’s concert photos" autocomplete="off" value="${esc(st.q)}"><datalist id="vArtists">${artists.map((a) => `<option value="${esc(a)}">`).join('')}</datalist></div>
      <div id="vModes">${chips()}</div></div>
    <div id="vQuick">${quick()}</div>
    <div id="vList" class="vc-list" aria-live="polite">${listHtml()}</div>`;
  const top = [...data.photos].filter((p) => showMap.has(p.showId)).sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 5);
  const board = railCard('Top photos right now', top.map((p, i) => { const sh = showMap.get(p.showId); return `<a class="rail-row" href="#/show/${sh.id}"><span class="rank-no">${i + 1}</span><span class="mini-cover cover photo" style="--photo:url('${esc(p.url)}')"></span><span class="info"><b>${esc(sh.artistName)}</b><span>by ${esc(p.uploaderName || 'a fan')}</span></span><span class="meta">▲ ${Number(p.votes || 0).toLocaleString()}</span></a>`; }).join(''));
  const how = railCard('How it works', '<ol class="how-list"><li><b>Upload</b> a photo to your show.</li><li><b>Vote</b> once per show for the best shot.</li><li>The top photo becomes the <b>cover</b> for everyone without their own.</li></ol>');
  ctx.setHTML(withRail(main, `${board}${yourVotesCard(data.photos, showMap)}${how}`));

  const repaint = () => { ctx.view.querySelector('#vList').innerHTML = listHtml(); ctx.view.querySelector('#vModes').innerHTML = chips(); ctx.view.querySelector('#vQuick').innerHTML = quick(); };
  let t;
  ctx.view.addEventListener('input', (e) => { if (e.target.id !== 'vq') return; clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; st.limit = 12; repaint(); }, 120); });
  ctx.on('click', '[data-mode]', (_, b) => { st.mode = b.dataset.mode; st.limit = 12; repaint(); });
  ctx.on('click', '[data-more]', () => { st.limit += 12; repaint(); });
  ctx.on('click', '[data-artist]', (_, b) => { const same = st.q.toLowerCase() === b.dataset.artist.toLowerCase(); st.q = same ? '' : b.dataset.artist; ctx.view.querySelector('#vq').value = st.q; repaint(); });
  ctx.on('click', '[data-clear]', () => { st.q = ''; ctx.view.querySelector('#vq').value = ''; repaint(); });

  ctx.on('click', '[data-vote]', async (_, btn) => {
    if (isPrivate()) return;
    const card = btn.closest('.vote-card'); const showId = card.dataset.show;
    const on = btn.getAttribute('aria-pressed') !== 'true'; btn.disabled = true;
    try {
      await app.api.votePhoto(btn.dataset.id, on);
      const fresh = await app.api.listPhotos({ showId });
      byShow.set(showId, fresh);
      card.outerHTML = cardHtml(showMap.get(showId), fresh);
      ctx.view.querySelector(`.vote-card[data-show="${showId}"] [data-vote][data-id="${btn.dataset.id}"]`)?.focus();
      toast(on ? `Vote counted for ${showMap.get(showId).artistName}` : 'Vote removed');
    } catch (e) { toast(friendlyError(e), 'error'); btn.disabled = false; }
  });

  ctx.on('click', '[data-zoom]', (_, opener) => {
    const set = [...opener.closest('.vote-card').querySelectorAll('[data-zoom]')]; let i = set.indexOf(opener);
    const d = document.createElement('dialog'); d.className = 'lightbox';
    const paint = () => {
      const b = set[i];
      d.innerHTML = `<button type="button" class="lb-close" aria-label="Close">×</button>${set.length > 1 ? '<button type="button" class="lb-nav prev" aria-label="Previous photo">‹</button><button type="button" class="lb-nav next" aria-label="Next photo">›</button>' : ''}<img src="${esc(b.dataset.zoom)}" alt="Concert photo${b.dataset.by ? ' by ' + esc(b.dataset.by) : ''}"><p>${b.dataset.by ? 'Photo by <b>' + esc(b.dataset.by) + '</b>' : ''}<span class="lb-count">${i + 1} / ${set.length}</span><button type="button" class="lb-report">Report</button></p>`;
    };
    const go = (n) => { i = (i + n + set.length) % set.length; paint(); };
    d.addEventListener('click', async (e) => {
      if (e.target === d || e.target.closest('.lb-close')) return d.close();
      if (e.target.closest('.prev')) return go(-1);
      if (e.target.closest('.next')) return go(1);
      if (e.target.closest('.lb-report')) {
        const id = set[i].dataset.id; d.close();
        const why = await reportDialog('this photo'); if (!why) return;
        try { await app.api.report('photo', id, why); toast('Report sent. Thank you.'); } catch (err) { toast(friendlyError(err), 'error'); }
      }
    });
    d.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });
    d.addEventListener('close', () => { d.remove(); opener.focus?.(); });
    paint(); document.body.appendChild(d); d.showModal();
  });
}
