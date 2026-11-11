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
  // best photos first: the community's top covers sit above everything else
  const seen = new Set();
  const topPics = [...data.photos].sort((a, b) => (b.votes || 0) - (a.votes || 0)).filter((p) => !seen.has(p.showId) && seen.add(p.showId)).slice(0, 10).map((p) => {
    const e = [...data.list, ...data.recent].find((x) => x.showId === p.showId);
    return e ? `<a class="tp-item" style="--photo:url('${esc(p.url)}')" href="#/entry/${e.id}" aria-label="${esc(e.artistName)} photo, ${Number(p.votes || 0)} votes"><span><b>${esc(e.artistName)}</b>▲ ${Number(p.votes || 0)}</span></a>` : '';
  }).filter(Boolean).join('');
  const topStrip = topPics ? `<section class="top-photos" aria-label="Top photos"><h2>Top photos <a href="#/vote">Vote</a></h2><div class="tp-row">${topPics}</div></section>` : '';
  const followCard = tab === 'friends' && data.people.length ? `<section class="card follow-card"><h2>Start following people</h2><p class="sub">Follow fans to see their nights here.</p>${data.people.map((p) => personRow(p)).join('')}</section>` : '';
  let shown = 20;
  const postsHtml = () => (data.list.length ? data.list.slice(0, shown).map((e) => post(e)).join('') + (data.list.length > shown ? '<div class="center"><button class="btn" type="button" data-more>Load more</button></div>' : '') : `<div class="card">${emptyCopy}</div>`);
  ctx.setHTML(`${head}<div class="feed-layout">${left}<div class="feed-col">${topStrip}${nav}
    ${followCard}<div id="feedList">${postsHtml()}</div>
    <div class="center"><button class="btn" type="button" data-action="retry">Refresh</button></div></div>${rail}</div>`);
  bindSocial(ctx);
  ctx.on('click', '[data-more]', () => { shown += 20; ctx.view.querySelector('#feedList').innerHTML = postsHtml(); });
  if (tab === 'tonight') { // the Tonight tab refreshes itself while you are at the top of the page
    const t = setInterval(() => { if (!ctx.view.isConnected) return clearInterval(t); if (!document.hidden && window.scrollY < 300) ctx.rerun(); }, 45000);
  }
}
