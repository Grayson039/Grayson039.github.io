// Show detail: big cover, who logged it, setlist, notes, photos, comments, share.
import { app, reportDialog, creditHtml, sectionHead, photoStrip, memoryTag, liveTag, likeButton, toast, confirmDialog, coverStyle, coverClass, avatar, followButton, ICON } from '../ui.js';
import { esc, formatDate, ratingDial, friendlyError, relativeTime } from '../util.js';
import { bindSocial } from '../social.js';
import { shareEntry } from '../share.js';
import { photoFieldHtml, bindPhotoField, photoProblem, uploadSelected } from './photoField.js';

const commentHtml = (c) => `<div class="comment" data-cid="${c.id}">${avatar(c.avatarUrl, c.username, 34)}<div><div class="c-body"><b><a href="#/u/${encodeURIComponent(c.username)}">${esc(c.username)}</a></b>${esc(c.body)}</div><div class="c-meta">${esc(relativeTime(c.createdAt))}${c.mine ? ' · <button type="button" class="link" data-action="del-comment" data-id="' + c.id + '" style="background:none;border:0;cursor:pointer;font-size:12px">Delete</button>' : ' · <button type="button" class="link" data-action="report-comment" data-id="' + c.id + '" style="background:none;border:0;cursor:pointer;font-size:12px">Report</button>'}</div></div></div>`;

export async function entryDetail(ctx) {
  const d = await ctx.guard(async () => {
    const e = await app.api.getEntry(ctx.params.id);
    if (!e) return { e: null };
    const [comments, profile, community] = await Promise.all([app.api.listComments(e.id).catch(() => []), e.userId === app.profile.id ? null : app.api.getProfile(e.username), app.api.listPhotos({ artistId: e.artistId }).catch(() => [])]);
    return { e, comments, owner: profile, community };
  });
  if (!d) return;
  const e = d.e;
  if (!e) { ctx.setHTML(`<header class="page-head"><h1 class="title" tabindex="-1">Show not found.</h1><p class="sub">It may have been deleted, or it belongs to a private profile. <a href="#/shows">Back to your shows</a>.</p></header>`); return; }
  const mine = e.userId === app.profile.id;
  const byVotes = [...(d.community || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  // Cover rule: your own photo, else this show's top-voted photo, else the artist's top-voted photo.
  const cover = e.photos[0] || byVotes.find((p) => p.showId === e.showId) || byVotes[0] || null;
  const photo = cover?.url;
  const where = [e.venueName, e.city].filter(Boolean).join(', ');
  document.title = `${e.artistName} · Aftershow`;
  ctx.setHTML(`
    <a class="back" href="${mine ? '#/shows' : '#/feed/global'}">← ${mine ? 'My shows' : 'Back'}</a>
    <div class="entry-layout">
      <div class="entry-media poster ${coverClass(photo)}" style="${coverStyle(e.artistName, photo)}">
        <div class="poster-top"><span class="badges" style="display:flex;gap:6px">${liveTag(e)}${memoryTag(e)}</span><span>${e.fromMemory ? 'From memory' : e.isLive ? 'Logged live' : 'One night only'}</span></div>
        <div class="poster-body">${photo ? '' : `<div class="cover-name">${esc(e.artistName)}</div><div class="poster-rule"></div>`}<div class="venue">${esc(where)}</div><div class="poster-date">${esc(formatDate(e.date))}</div></div>
        ${creditHtml(cover, !e.photos[0], true)}<div class="stub"><b>Admit one</b><span class="no">No. ${String([...e.id].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 10000).padStart(4, '0')}</span>${ratingDial(e.rating)}</div>
      </div>
      <div class="entry-side">
        <div class="post-head">${avatar(e.avatarUrl, e.username, 40)}<div class="who"><a class="name" href="#/u/${encodeURIComponent(e.username)}">${esc(e.username)}</a><span class="meta" style="font-family:var(--ui)">${mine ? 'You logged this' : 'Logged ' + esc(relativeTime(e.createdAt))}</span></div>${!mine && d.owner ? `<span style="margin-left:auto">${followButton(d.owner.id, d.owner.isFollowing, e.username)}</span>` : ''}</div>
        <h1 class="${photo ? '' : 'sr-only'}" tabindex="-1"><a href="#/artist/${e.artistId}">${esc(e.artistName)}</a></h1>
        <p class="where"><a href="#/show/${e.showId}">${esc(where)}</a> · ${esc(formatDate(e.date))}</p>
        <div class="entry-actions">${likeButton(e)}<button type="button" class="act-btn" data-action="focus-comment">${ICON.comment}<span id="ccount">${d.comments.length}</span></button><button type="button" class="act-btn" data-action="share">${ICON.share}<span>Share</span></button><span style="flex:1"></span>${ratingDial(e.rating)}</div>
        ${mine ? `<div class="entry-actions" style="margin-top:0"><a class="btn" href="#/log/${e.id}">Edit</a><button type="button" class="btn danger" data-action="delete">Delete</button></div>` : ''}
        ${e.note ? `<p class="note-big">${esc(e.note).replace(/\n/g, '<br>')}</p>` : ''}
        ${sectionHead('Setlist')}<div class="card">${e.setlist.length ? `<ol class="setlist">${e.setlist.map((s) => `<li><span class="t">${esc(s)}</span></li>`).join('')}</ol>` : `<p class="sub">Nothing written down yet.${mine ? ` <a href="#/log/${e.id}">Add what you remember</a>.` : ''}</p>`}</div>
        ${e.photos.length || mine ? `${sectionHead('Photos')}<div class="card">${photoStrip(e.photos, 'Photos from this show') || '<p class="sub">No photos yet.</p>'}${mine ? `<form id="photoForm" style="margin-top:14px">${photoFieldHtml()}<button class="btn primary" type="submit">Add photo</button></form>` : ''}</div>` : ''}
        ${sectionHead('Comments')}<div class="comments" id="comments"><div id="clist">${d.comments.map(commentHtml).join('') || '<p class="sub" id="cempty">No comments yet. Say something.</p>'}</div>
          <form class="comment-form" id="commentForm"><label class="sr-only" for="cbody">Add a comment</label><textarea id="cbody" rows="1" maxlength="500" placeholder="Add a comment…"></textarea><button class="btn primary" type="submit">Post</button></form></div>
        <p style="margin-top:18px"><a class="btn" href="#/show/${e.showId}">Everyone’s logs of this show</a></p>
      </div>
    </div>`);
  bindSocial(ctx);
  bindPhotoField(ctx);
  if (ctx.query.c) setTimeout(() => ctx.view.querySelector('#cbody')?.focus(), 80);
  ctx.on('click', '[data-action=report-comment]', async (_, b) => {
    const why = await reportDialog('this comment'); if (!why) return;
    try { await app.api.report('comment', b.dataset.id, why); toast('Report sent. Thank you.'); } catch (err) { toast(friendlyError(err), 'error'); }
  });
  ctx.on('click', '[data-action=focus-comment]', () => ctx.view.querySelector('#cbody').focus());
  ctx.on('click', '[data-action=share]', async (_, btn) => {
    btn.disabled = true;
    try { const r = await shareEntry(e, app.profile.username, cover?.uploaderName || '', cover?.url); if (r === 'downloaded') toast('Image saved. Post it anywhere.'); }
    catch (err) { toast(friendlyError(err), 'error'); }
    btn.disabled = false;
  });
  ctx.on('click', '[data-action=delete]', async () => {
    if (!(await confirmDialog('Delete this show?', `${e.artistName} · ${formatDate(e.date)} will be removed from your archive.`))) return;
    try { await app.api.deleteEntry(e.id); toast('Show deleted'); location.hash = '#/shows'; }
    catch (err) { toast(friendlyError(err), 'error'); }
  });
  ctx.on('submit', '#commentForm', async (ev, form) => {
    ev.preventDefault();
    const ta = form.querySelector('textarea'); const body = ta.value.trim(); if (!body) return;
    const btn = form.querySelector('button'); btn.disabled = true;
    try {
      const c = await app.api.addComment(e.id, body);
      ctx.view.querySelector('#cempty')?.remove();
      ctx.view.querySelector('#clist').insertAdjacentHTML('beforeend', commentHtml(c));
      const n = ctx.view.querySelector('#ccount'); n.textContent = +n.textContent + 1; ta.value = '';
    } catch (err) { toast(friendlyError(err), 'error'); }
    btn.disabled = false;
  });
  ctx.on('click', '[data-action=del-comment]', async (_, b) => {
    try { await app.api.deleteComment(b.dataset.id); b.closest('.comment').remove(); const n = ctx.view.querySelector('#ccount'); n.textContent = Math.max(0, +n.textContent - 1); }
    catch (err) { toast(friendlyError(err), 'error'); }
  });
  ctx.on('submit', '#photoForm', async (ev, form) => {
    ev.preventDefault();
    const btn = form.querySelector('button[type=submit]'), status = form.querySelector('.photo-field .sub');
    if (!form.querySelector('#photoFile').files[0]) { status.textContent = 'Choose a photo first.'; return; }
    const problem = photoProblem(ctx); if (problem) { toast(problem, 'error'); return; }
    btn.disabled = true;
    try { await uploadSelected(ctx, e.showId, (t) => (btn.textContent = t)); toast('Photo added'); ctx.rerun(); }
    catch (err) { toast(friendlyError(err), 'error'); btn.disabled = false; btn.textContent = 'Add photo'; }
  });
}
