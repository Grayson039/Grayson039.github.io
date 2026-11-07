// One place that decides which photo a show shows. Every entry, artist and show the API returns gets a
// `cover` (or `photo`) attached, so a photo uploaded or voted for anywhere appears everywhere.
//   cover rule: your own photo for that show -> the show's top-voted photo -> the artist's top-voted photo
import { app } from './ui.js';

let cache = null, at = 0, key = '', pending = null;
const TTL = 20000;

export function invalidateCovers() { cache = null; pending = null; }

export async function loadCovers() {
  const who = app.profile?.id || '';
  if (cache && who === key && Date.now() - at < TTL) return cache;
  if (pending) return pending;
  pending = (async () => {
    let photos = [];
    try { photos = (await app.api.listPhotos({})) || []; } catch { /* covers are optional */ }
    const byShow = {}, byArtist = {};
    [...photos].sort((a, b) => (b.votes || 0) - (a.votes || 0)).forEach((p) => {
      if (p.showId && !byShow[p.showId]) byShow[p.showId] = p;
      if (p.artistId && !byArtist[p.artistId]) byArtist[p.artistId] = p;
    });
    cache = { byShow, byArtist }; at = Date.now(); key = who; pending = null;
    return cache;
  })();
  return pending;
}

function setCover(e, c) {
  const own = e.photos?.[0];
  // a private profile keeps its own posters to its own photos; the community cover is a public-profile perk
  const hide = app.profile?.settings?.private && e.userId === app.profile.id;
  const shared = hide ? null : c.byShow[e.showId] || c.byArtist[e.artistId];
  e.cover = own ? { ...own, community: false } : shared ? { ...shared, community: true } : null;
}

export function installCovers(api) {
  if (!api || api.__covers) return;
  api.__covers = true;
  const wrap = (name, fn) => { const raw = api[name]?.bind(api); if (raw) api[name] = async (...a) => fn(await raw(...a), await loadCovers()); };
  wrap('listEntries', (list, c) => { (list || []).forEach((e) => setCover(e, c)); return list; });
  wrap('getEntry', (e, c) => { if (e) setCover(e, c); return e; });
  wrap('topArtists', (list, c) => { (list || []).forEach((a) => { a.photo = c.byArtist[a.id] || null; }); return list; });
  wrap('listShows', (list, c) => { (list || []).forEach((s) => { s.cover = c.byShow[s.id] || c.byArtist[s.artistId] || null; }); return list; });
  wrap('search', (list, c) => { (list || []).forEach((r) => { if (r.type === 'artist') r.photo = c.byArtist[r.id] || null; }); return list; });
  // a vote or an upload can change a cover: drop the cache so the next screen sees it
  ['votePhoto', 'uploadPhoto', 'deletePhoto', 'deleteEntry'].forEach((name) => {
    const raw = api[name]?.bind(api); if (raw) api[name] = async (...a) => { const r = await raw(...a); invalidateCovers(); return r; };
  });
}
