// Tab 2: Friends / Everyone / Tonight. Chronological, no algorithm. Unlocks after your first logged show.
import { app, tabs, post, emptyState, avatar, liveTag, coverStyle, coverClass, personRow } from '../ui.js';
import { esc } from '../util.js';
import { bindSocial } from '../social.js';
import { liveCta, voteCta, recentShowsCard } from '../rails.js';

const META = { friends: 'Friends', global: 'Everyone', tonight: 'Tonight' };

export async function feed(ctx) {
  const tab = META[ctx.params.tab] ? ctx.params.tab : 'friends';
  const mkNav = (lit) => tabs([{ id: 'friends', label: 'Friends', href: '#/feed/friends' }, { id: 'global', label: 'Everyone', href: '#/feed/global' }, { id: 'tonight', label: 'Tonight', href: '#/feed/tonight', lamp: lit }], tab, { label: 'Feed type' });
  const head = `<h1 class="sr-only" tabindex="-1">${META[tab]} feed</h1>`;

  const data = await ctx.guard(async () => {
    const [mine, list, tonight, people, popular, photos, recent] = await Promise.all([
      app.api.listEntries({ userId: app.profile.id, limit: 1 }), app.api.listEntries({ scope: tab }),
      tab === 'tonight' ? null : app.api.listEntries({ scope: 'tonight' }), app.api.suggestPeople(4).catch(() => []), app.api.topArtists(6).catch(() => []),
      app.api.listPhotos({}).catch(() => []), app.api.listEntries({ userId: app.profile.id }).catch(() => [])
    ]);
    return { unlocked: mine.length > 0, list, tonight: tonight || list, people, popular, photos, recent };
  });
  if (!data) return;
  const nav = mkNav(data.tonight.length > 0);
  if (!data.unlocked) {
    ctx.setHTML(`${head}<div class="feed-layout"><div class="feed-col">${nav}<div class="card">${emptyState('The feed is the reward.', 'Your archive comes first. Log a single show — even one from years ago — and everyone else’s nights appear here.', '<div class="empty-actions"><a class="btn-block inline" href="#/log">Log your first show</a><a class="btn" href="#/import">Import a CSV</a></div>')}</div></div></div>`);
    return;
  }
  const emptyCopy = {
    friends: emptyState('Nobody to show yet.', 'Follow people to fill this feed, or browse everyone to find some.', '<div class="empty-actions"><a class="btn primary" href="#/feed/global">Browse everyone</a><a class="btn" href="#/search">Find people</a></div>'),
    global: emptyState('No logs yet.', 'Be the first.', '<a class="btn primary" href="#/log">Log a show</a>'),
    tonight: emptyState('Quiet night.', 'Nobody has live-logged a show today. At a show? Log it live and start the setlist.', '<a class="btn primary" href="#/log?mode=live">Log live</a>')
  }[tab];
  const rail = `<aside class="rail" aria-label="Around Aftershow">
    <section class="rail-card"><h2>Happening tonight</h2>
      ${data.tonight.length ? data.tonight.slice(0, 4).map((e) => `<a class="rail-row" href="#/entry/${e.id}"><span class="mini-cover ${coverClass(e.cover?.url || e.photos?.[0]?.url)}" style="${coverStyle(e.artistName, e.cover?.url || e.photos?.[0]?.url)}"></span><span class="info"><b>${esc(e.artistName)}</b><span>${esc(e.username)} at ${esc(e.venueName)}</span></span>${liveTag(e)}</a>`).join('') : '<p class="sub">Nobody is live-logging yet.</p>'}
      <a class="rail-more" href="#/feed/tonight">See tonight</a></section>
    ${data.people.length ? `<section class="rail-card"><h2>People to follow</h2>${data.people.map((p) => personRow(p)).join('')}</section>` : ''}
    <section class="rail-card"><h2>Most logged</h2><div class="pill-row">${data.popular.map((a) => `<a class="chip" href="#/artist/${a.id}">${esc(a.name)} <span class="meta">${a.logs}</span></a>`).join('') || '<p class="sub">Nothing yet.</p>'}</div></section>
  </aside>`;
  const left = `<aside class="rail rail-left" aria-label="Your corner">${liveCta()}${voteCta(data.photos)}${recentShowsCard(data.recent)}</aside>`;
  let shown = 20;
  const postsHtml = () => (data.list.length ? data.list.slice(0, shown).map((e) => post(e)).join('') + (data.list.length > shown ? '<div class="center"><button class="btn" type="button" data-more>Load more</button></div>' : '') : `<div class="card">${emptyCopy}</div>`);
  ctx.setHTML(`${head}<div class="feed-layout">${left}<div class="feed-col">${nav}
    <div id="feedList">${postsHtml()}</div>
    <div class="center"><button class="btn" type="button" data-action="retry">Refresh</button></div></div>${rail}</div>`);
  bindSocial(ctx);
  ctx.on('click', '[data-more]', () => { shown += 20; ctx.view.querySelector('#feedList').innerHTML = postsHtml(); });
  if (tab === 'tonight') { // the Tonight tab refreshes itself while you are at the top of the page
    const t = setInterval(() => { if (!ctx.view.isConnected) return clearInterval(t); if (!document.hidden && window.scrollY < 300) ctx.rerun(); }, 45000);
  }
}
