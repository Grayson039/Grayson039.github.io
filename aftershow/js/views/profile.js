// Tab 5: Me / profile (four favourites, numbers, posters), Followers & Following.
import { app, sectionHead, tabs, avatar, tile, emptyState, barChart, rankList, followButton, personRow, toast, coverStyle } from '../ui.js';
import { esc, computeStats, friendlyError } from '../util.js';
import { bindSocial } from '../social.js';
import { withRail, voteCta, yourPhotosCard, milestoneCard, thisMonthCard } from '../rails.js';

export function meRedirect() { location.replace('#/u/' + encodeURIComponent(app.profile.username)); }

// Favourites the person pinned; falls back to their four best-rated recent shows.
function favoriteEntries(entries, ids) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const picked = (ids || []).map((id) => byId.get(id)).filter(Boolean);
  if (picked.length) return { list: picked.slice(0, 4), custom: true };
  const auto = [...entries].sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.date.localeCompare(a.date)).slice(0, 4);
  return { list: auto, custom: false };
}

export async function profile(ctx) {
  const d = await ctx.guard(async () => {
    const p = await app.api.getProfile(ctx.params.username);
    if (!p) return { p: null };
    const entries = p.locked ? [] : await app.api.listEntries({ userId: p.id });
    const extra = p.isMe && !p.locked ? await Promise.all([app.api.listPhotos({}).catch(() => []), app.api.listShows({}).catch(() => [])]) : [[], []];
    return { p, entries, photos: extra[0], shows: extra[1] };
  });
  if (!d) return;
  const { p, entries, photos, shows } = d;
  if (!p) { ctx.setHTML(`<header class="page-head"><h1 class="title" tabindex="-1">No such user.</h1><p class="sub"><a href="#/search">Search for people</a></p></header>`); return; }
  const s = computeStats(entries || []);
  const base = `#/u/${encodeURIComponent(p.username)}`;
  const favs = favoriteEntries(entries, p.settings?.favorites);
  document.title = `${p.username} · Aftershow`;
  const showMap = new Map((shows || []).map((x) => [x.id, x]));
  const rail = p.isMe ? `${voteCta(photos)}${yourPhotosCard(photos, showMap, p.id)}${milestoneCard(entries.length)}${thisMonthCard(entries)}` : '';
  const wrap = (html) => (p.isMe && !p.locked && entries.length ? withRail(html, rail) : html);
  ctx.setHTML(wrap(`
    ${p.isMe ? '' : '<a class="back" href="#/shows" data-back>← Back</a>'}
    <header class="profile-hero">
      ${avatar(p.avatarUrl, p.username, 112)}
      <div class="profile-main">
        <h1 tabindex="-1">${esc(p.username)}</h1>${p.displayName ? `<div class="real">${esc(p.displayName)}</div>` : ''}
        ${p.bio ? `<p class="profile-bio">${esc(p.bio)}</p>` : (p.isMe ? '<p class="profile-bio sub">Add a bio in settings.</p>' : '')}
        <div class="profile-nums">
          <div><b>${p.locked ? '—' : s.total}</b><span>shows</span></div>
          <div><b>${p.locked ? '—' : s.artists.length}</b><span>artists</span></div>
          <a href="${base}/followers"><b id="fersNum">${p.followers}</b><span>followers</span></a>
          <a href="${base}/following"><b>${p.following}</b><span>following</span></a>
        </div>
        <div class="detail-actions">${p.isMe ? '<a class="btn primary" href="#/settings">Edit profile</a><a class="btn" href="#/stats">Stats</a><a class="btn" href="#/import">Import</a><button class="btn" type="button" data-action="signout">Sign out</button>' : followButton(p.id, p.isFollowing, p.username)}</div>
      </div>
    </header>
    ${p.locked ? `<div class="card" style="margin-top:28px">${emptyState('This profile is private.', `Follow ${esc(p.username)} to see their shows.`)}</div>` : !entries.length ? `<div class="card" style="margin-top:28px">${emptyState(p.isMe ? 'Your archive is empty.' : 'No shows yet.', p.isMe ? 'Log a show or import your history.' : '', p.isMe ? '<div class="empty-actions"><a class="btn-block inline" href="#/log">Log a show</a><a class="btn" href="#/import">Import CSV</a></div>' : '')}</div>` : `
    ${sectionHead('Four favourite shows', p.isMe ? '<button class="btn" type="button" data-action="edit-favs">Choose</button>' : '')}
    <div class="fav-grid">${favs.list.map((e) => tile(e)).join('')}${Array.from({ length: Math.max(0, 4 - favs.list.length) }, () => `<div class="fav-empty">${p.isMe ? 'Pick a favourite' : ''}</div>`).join('')}</div>
    ${!favs.custom && p.isMe ? '<p class="sub" style="margin-top:8px">Showing your top-rated shows. Choose your own four.</p>' : ''}
    ${sectionHead('Concerts per year')}<div class="card">${barChart(s.years.filter(([y]) => y))}</div>
    <div class="cols-2">
      <div>${sectionHead('Top artists')}<div class="card list-card">${rankList(s.artists.slice(0, 5), { hrefFor: (n) => `#/search?q=${encodeURIComponent(n)}` })}</div></div>
      <div>${sectionHead('Top venues')}<div class="card list-card">${rankList(s.venues.slice(0, 5))}</div></div>
    </div>
    ${sectionHead('Recent shows', p.isMe ? '<a class="btn" href="#/shows">All shows</a>' : '')}
    <div class="tile-grid">${entries.slice(0, 8).map((e) => tile(e)).join('')}</div>`}`));

  bindSocial(ctx, { onFollowChange: (_, on) => { const n = ctx.view.querySelector('#fersNum'); if (n) n.textContent = Math.max(0, +n.textContent + (on ? 1 : -1)); } });
  ctx.on('click', '[data-back]', (ev) => { ev.preventDefault(); history.back(); });
  ctx.on('click', '[data-action=signout]', () => app.api.signOut());
  ctx.on('click', '[data-action=edit-favs]', () => {
    const chosen = new Set(favs.custom ? favs.list.map((e) => e.id) : []);
    const dlg = document.createElement('dialog'); dlg.className = 'dialog';
    const rows = () => entries.map((e) => `<label class="pick-row"><input type="checkbox" value="${e.id}" ${chosen.has(e.id) ? 'checked' : ''}><span><b>${esc(e.artistName)}</b><span class="meta">${esc(e.venueName)} · ${esc(e.date.slice(0, 4))}</span></span></label>`).join('');
    dlg.innerHTML = `<form method="dialog"><h2>Your four favourites</h2><p class="sub">The shows you’d tell anyone about first. Pick up to four.</p><div class="pick-list">${rows()}</div><div class="dialog-actions"><button class="btn" value="cancel">Cancel</button><button class="btn primary" value="ok">Save</button></div></form>`;
    document.body.appendChild(dlg);
    dlg.addEventListener('change', (ev) => { const cb = ev.target; if (cb.checked) { if (chosen.size >= 4) { cb.checked = false; toast('Four is the limit — uncheck one first.'); return; } chosen.add(cb.value); } else chosen.delete(cb.value); });
    dlg.addEventListener('close', async () => {
      const ok = dlg.returnValue === 'ok'; dlg.remove(); if (!ok) return;
      try { app.profile = { ...app.profile, ...(await app.api.updateMyProfile({ settings: { favorites: [...chosen] } })) }; toast('Favourites saved'); ctx.rerun(); }
      catch (e) { toast(friendlyError(e), 'error'); }
    });
    dlg.showModal();
  });
}

export async function follows(ctx) {
  const kind = ctx.params.kind === 'following' ? 'following' : 'followers';
  const d = await ctx.guard(async () => {
    const p = await app.api.getProfile(ctx.params.username);
    if (!p) return { p: null };
    const [fers, fing] = await Promise.all([app.api.listFollowers(p.id), app.api.listFollowing(p.id)]);
    return { p, fers, fing };
  });
  if (!d) return;
  if (!d.p) { ctx.setHTML(`<header class="page-head"><h1 class="title" tabindex="-1">No such user.</h1></header>`); return; }
  const { p, fers, fing } = d; const base = `#/u/${encodeURIComponent(p.username)}`;
  const list = kind === 'followers' ? fers : fing;
  ctx.setHTML(`<a class="back" href="${base}">← ${esc(p.username)}</a>
    <header class="page-head"><h1 class="title" tabindex="-1">${esc(p.username)}</h1></header>
    ${tabs([{ id: 'followers', label: `${fers.length} follower${fers.length === 1 ? '' : 's'}`, href: base + '/followers' }, { id: 'following', label: `${fing.length} following`, href: base + '/following' }], kind, { label: 'Social graph' })}
    <div class="card list-card">${list.length ? list.map((x) => personRow(x)).join('') : emptyState(kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.', p.isMe && kind === 'following' ? 'Find people in <a class="link" href="#/search">Discover</a>.' : '')}</div>`);
  bindSocial(ctx);
}
