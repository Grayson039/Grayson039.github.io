// Delegated like / follow handlers shared by every screen that shows those buttons.
import { app, toast, followButton, likeButton, boltBurst } from './ui.js';
import { friendlyError } from './util.js';

export function bindSocial(ctx, { onFollowChange } = {}) {
  ctx.on('click', '[data-action=like]', async (ev, btn) => {
    ev.stopPropagation();
    const on = btn.getAttribute('aria-pressed') !== 'true';
    const countEl = btn.querySelector('.like-count');
    const prev = Number(countEl.textContent) || 0;
    // optimistic update, roll back on failure
    btn.outerHTML = likeButton({ id: btn.dataset.id, likedByMe: on, likeCount: Math.max(0, prev + (on ? 1 : -1)) });
    try { await app.api.setLike(btn.dataset.id, on); }
    catch (e) {
      toast(friendlyError(e), 'error');
      const cur = ctx.view.querySelector(`[data-action=like][data-id="${btn.dataset.id}"]`);
      if (cur) cur.outerHTML = likeButton({ id: btn.dataset.id, likedByMe: !on, likeCount: prev });
    }
  });
  ctx.on('click', '[data-action=vote-photo]', async (ev, btn) => {
    ev.stopPropagation();
    const on = btn.getAttribute('aria-pressed') !== 'true'; btn.disabled = true;
    try { await app.api.votePhoto(btn.dataset.id, on); if (on) boltBurst(btn); toast(on ? 'Vote counted' : 'Vote removed'); setTimeout(() => ctx.rerun(), on ? 450 : 0); }
    catch (e) { toast(friendlyError(e), 'error'); btn.disabled = false; }
  });
  ctx.on('click', '[data-action=follow]', async (ev, btn) => {
    ev.stopPropagation();
    const was = btn.dataset.on === '1';
    btn.disabled = true;
    try {
      await app.api.setFollow(btn.dataset.id, !was);
      const name = btn.getAttribute('aria-label').replace(/^(Un)?[Ff]ollow /, '');
      btn.outerHTML = followButton(btn.dataset.id, !was, name);
      toast(was ? `Unfollowed ${name}` : `Following ${name}`);
      onFollowChange?.(btn.dataset.id, !was);
    } catch (e) { toast(friendlyError(e), 'error'); btn.disabled = false; }
  });
  // whole-card navigation (the title link is the keyboard/screen-reader path)
  ctx.view.addEventListener('click', (ev) => {
    if (ev.target.closest('a,button,input,select,textarea,label')) return;
    const card = ev.target.closest('[data-href]');
    if (card && ctx.view.contains(card)) location.hash = card.dataset.href;
  });
}
