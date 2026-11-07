// Activity: who liked, commented on and followed you. Grouped by day; new items glow until you leave the page.
import { app, avatar, emptyState, ICON, coverStyle, coverClass, followButton, personRow } from '../ui.js';
import { esc, relativeTime } from '../util.js';
import { refreshBadge } from '../activity.js';
import { bindSocial } from '../social.js';
import { withRail, railCard, voteCta, yourPhotosCard } from '../rails.js';

const BADGE = { like: ICON.heart, comment: ICON.comment, follow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' };
const VERB = { like: 'Liked', comment: 'Commented', follow: 'Followed you' };

const line = (a) => {
  if (a.type === 'like') return `<b>${esc(a.actorName)}</b> liked your <em>${esc(a.artistName)}</em> show`;
  if (a.type === 'comment') return `<b>${esc(a.actorName)}</b> commented on <em>${esc(a.artistName)}</em>`;
  return `<b>${esc(a.actorName)}</b> started following you`;
};

function card(a, unread) {
  const href = a.entryId ? '#/entry/' + a.entryId : '#/u/' + encodeURIComponent(a.actorName);
  const right = a.type === 'follow'
    ? (a.actorId ? `<span class="act-follow">${followButton(a.actorId, !!a.following, a.actorName)}</span>` : '')
    : `<span class="act-thumb cover ${coverClass(a.photoUrl)}" style="${coverStyle(a.artistName, a.photoUrl)}" aria-hidden="true"></span>`;
  return `<div class="act-card ${unread ? 'unread' : ''}">
    <span class="act-av">${avatar(a.actorAvatar, a.actorName, 48)}<span class="act-badge ${a.type}" title="${VERB[a.type]}">${BADGE[a.type]}</span></span>
    <div class="act-main"><a class="act-line stretch" href="${href}">${line(a)}</a>
      ${a.type === 'comment' && a.body ? `<blockquote class="act-quote">“${esc(a.body)}”</blockquote>` : ''}
      <span class="act-time">${unread ? '<i class="pilot on" aria-hidden="true"></i><span class="act-new">New</span>' : ''}${esc(relativeTime(a.createdAt))}</span></div>
    ${right}</div>`;
}

const dayLabel = (iso) => {
  const d = new Date(iso), now = new Date();
  const mid = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((mid(now) - mid(d)) / 86400000);
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 7 ? 'This week' : 'Earlier';
};

export async function activity(ctx) {
  const data = await ctx.guard(async () => {
    const [list, people, photos, shows] = await Promise.all([app.api.listActivity(), app.api.suggestPeople(4).catch(() => []), app.api.listPhotos({}).catch(() => []), app.api.listShows({}).catch(() => [])]);
    return { list, people, photos, shows };
  });
  if (!data) return;
  const { list, people, photos, shows } = data;
  const showMap = new Map(shows.map((x) => [x.id, x]));
  const seen = app.profile.settings?.activitySeenAt || '';
  const isNew = (a) => a.createdAt > seen;
  const fresh = list.filter(isNew).length;
  const groups = [];
  list.forEach((a) => { const l = dayLabel(a.createdAt); const g = groups.find((x) => x.l === l); g ? g.items.push(a) : groups.push({ l, items: [a] }); });
  const sub = !list.length ? 'Likes, comments and new followers show up here.'
    : fresh ? `<i class="pilot on" aria-hidden="true"></i>${fresh} new since you last looked` : 'You’re all caught up.';
  const main = `<header class="page-head act-hero"><h1 class="title" tabindex="-1">Activity.</h1><p class="sub act-sub">${sub}</p></header>
    ${!list.length ? `<div class="card">${emptyState('Quiet so far.', 'When someone likes or comments on one of your shows, or follows you, it shows up here.', '<a class="btn primary" href="#/feed/global">See what everyone is logging</a>')}</div>`
      : groups.map((g) => `<section class="act-day" aria-label="${g.l}"><h2 class="act-day-h"><span>${g.l}</span><i></i></h2><div class="act-list">${g.items.map((a) => card(a, isNew(a))).join('')}</div></section>`).join('')}`;
  const rail = `${voteCta(photos)}${yourPhotosCard(photos, showMap, app.profile.id)}${people.length ? railCard('People to follow', people.map((p) => personRow(p)).join('')) : ''}`;
  ctx.setHTML(withRail(main, rail));
  bindSocial(ctx);
  if (fresh) {
    try { app.profile = { ...app.profile, ...(await app.api.updateMyProfile({ settings: { activitySeenAt: new Date().toISOString() } })) }; } catch { /* non-fatal */ }
    refreshBadge();
  }
}
