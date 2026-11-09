// Supabase backend — same API surface as backends/demo.js. Requires supabase-migration.sql, -002-photos.sql and -003-app.sql.
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SCHEMA, SUPABASE_ESM, PHOTO_BUCKET } from '../config.js';
import { todayISO, uid } from '../util.js';
import { compressPhoto } from '../photo.js';

let sb = null;
const likeEsc = (s) => String(s).replace(/[\\%_]/g, (c) => '\\' + c);
const PROFILE_COLS = 'id, username, display_name, avatar_url, bio, theme_preference, settings, onboarded, agreed_to_ugc_license, created_at';
const ENTRY_SELECT = 'id, user_id, show_id, rating, note, setlist, from_memory, is_live, created_at, profiles(username, avatar_url), shows!inner(id, date, artist_id, venue_id, artists(id, name, genres), venues(id, name, city)), likes(user_id), comments(count)';

const mapProfile = (p) => p && ({ id: p.id, username: p.username, displayName: p.display_name || '', bio: p.bio || '', avatarUrl: p.avatar_url || '', theme: p.theme_preference || 'dark', settings: p.settings || {}, onboarded: !!p.onboarded, agreedToUgc: !!p.agreed_to_ugc_license, createdAt: p.created_at });
const photoUrl = (path) => sb.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
const mapPhoto = (p) => ({ id: p.id, url: photoUrl(p.storage_path), showId: p.show_id, artistId: p.shows?.artist_id, uploaderId: p.uploader_id, uploaderName: p.profiles?.username || '', votes: p.photo_votes ? p.photo_votes.length : (p.vote_count || 0), votedByMe: !!meId && (p.photo_votes || []).some((v) => v.voter_id === meId), canVote: !!meId && p.uploader_id !== meId });
let meId = null;

function mapEntry(r) {
  return {
    id: r.id, userId: r.user_id, username: r.profiles?.username || 'unknown', avatarUrl: r.profiles?.avatar_url || '',
    showId: r.shows?.id, artistId: r.shows?.artists?.id, artistName: r.shows?.artists?.name || 'Unknown artist', genres: r.shows?.artists?.genres || [],
    venueId: r.shows?.venues?.id, venueName: r.shows?.venues?.name || 'Unknown venue', city: r.shows?.venues?.city || '', date: r.shows?.date || '',
    rating: r.rating, note: r.note || '', setlist: r.setlist || [], fromMemory: !!r.from_memory, isLive: !!r.is_live, createdAt: r.created_at,
    commentCount: r.comments?.[0]?.count ?? 0, likeCount: (r.likes || []).length, likedByMe: !!meId && (r.likes || []).some((l) => l.user_id === meId), photos: []
  };
}
async function attachPhotos(entries) {
  const ids = [...new Set(entries.map((e) => e.showId).filter(Boolean))];
  if (!ids.length) return entries;
  const { data, error } = await sb.from('photos').select('*, profiles:uploader_id(username)').in('show_id', ids);
  if (error) throw error;
  entries.forEach((e) => { e.photos = (data || []).filter((p) => p.show_id === e.showId && p.uploader_id === e.userId).map(mapPhoto); });
  return entries;
}
const ok = ({ data, error }) => { if (error) throw error; return data; };
const requireUser = async () => { const { data } = await sb.auth.getUser(); if (!data.user) throw new Error('Not signed in.'); meId = data.user.id; return data.user; };

// find-or-create artist / venue / show. `cache` lets bulk imports avoid thousands of lookups.
async function resolveShow(input, cache = new Map()) {
  const aKey = 'a|' + input.artistName.toLowerCase().trim();
  let artistId = cache.get(aKey);
  if (!artistId) {
    let a = ok(await sb.from('artists').select('id').ilike('name', likeEsc(input.artistName.trim())).limit(1).maybeSingle());
    if (!a) a = ok(await sb.from('artists').insert({ name: input.artistName.trim() }).select('id').single());
    artistId = a.id; cache.set(aKey, artistId);
  }
  const vName = (input.venueName || 'Unknown venue').trim(), city = (input.city || '').trim();
  const vKey = 'v|' + vName.toLowerCase() + '|' + city.toLowerCase();
  let venueId = cache.get(vKey);
  if (!venueId) {
    let q = sb.from('venues').select('id').ilike('name', likeEsc(vName));
    if (city) q = q.ilike('city', likeEsc(city));
    let v = ok(await q.limit(1).maybeSingle());
    if (!v) v = ok(await sb.from('venues').insert({ name: vName, city: city || null }).select('id').single());
    venueId = v.id; cache.set(vKey, venueId);
  }
  const sKey = `s|${artistId}|${venueId}|${input.date}`;
  let showId = cache.get(sKey);
  if (!showId) {
    let s = ok(await sb.from('shows').select('id').eq('artist_id', artistId).eq('venue_id', venueId).eq('date', input.date).limit(1).maybeSingle());
    if (!s) s = ok(await sb.from('shows').insert({ artist_id: artistId, venue_id: venueId, date: input.date }).select('id').single());
    showId = s.id; cache.set(sKey, showId);
  }
  return showId;
}
const entryRow = (userId, showId, input, fromMemory) => ({ user_id: userId, show_id: showId, rating: input.rating || null, note: input.note || null, setlist: input.setlist || [], from_memory: fromMemory ?? !!input.fromMemory, is_live: !!input.isLive });

export const api = {
  mode: 'live',
  async init() {
    const mod = await import(SUPABASE_ESM);
    sb = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: SUPABASE_SCHEMA } });
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    const u = data.session?.user || null; meId = u?.id || null;
    return u && { id: u.id, email: u.email };
  },
  onAuth(cb) {
    const { data } = sb.auth.onAuthStateChange((_e, session) => { if (_e === 'PASSWORD_RECOVERY') setTimeout(() => document.dispatchEvent(new CustomEvent('password-recovery')), 0); meId = session?.user?.id || null; cb(session?.user ? { id: session.user.id, email: session.user.email } : null); });
    return () => data.subscription.unsubscribe();
  },
  async signUp(email, password, username) {
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username, app: 'aftershow' } } });
    if (error) throw error;
    return { needsConfirm: !data.session };
  },
  async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; },
  async signOut() { await sb.auth.signOut(); },
  async resetPassword(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); if (error) throw error; },
  async signInWithLink(email) { const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: false } }); if (error) throw error; },
  async updatePassword(password) { const { error } = await sb.auth.updateUser({ password }); if (error) throw error; },
  // Removes the user's files from Storage, then runs the delete_my_account() function from migration 007.
  async deleteAccount() {
    const user = await requireUser();
    try {
      const { data } = await sb.storage.from(PHOTO_BUCKET).list(user.id, { limit: 1000 });
      if (data?.length) await sb.storage.from(PHOTO_BUCKET).remove(data.map((f) => `${user.id}/${f.name}`));
    } catch { /* files may linger; the account still goes */ }
    ok(await sb.rpc('delete_my_account'));
    await sb.auth.signOut();
  },
  async report(type, id, reason = '') { const user = await requireUser(); ok(await sb.from('reports').insert({ reporter_id: user.id, target_type: type, target_id: id, reason: reason.slice(0, 500) })); },

  async getMyProfile() {
    const user = await requireUser();
    let p = ok(await sb.from('profiles').select(PROFILE_COLS).eq('id', user.id).maybeSingle());
    if (!p) { // first real session: create the row (RLS blocks this before a session exists)
      const username = user.user_metadata?.username || user.email.split('@')[0];
      const ins = await sb.from('profiles').insert({ id: user.id, username }).select(PROFILE_COLS).single();
      if (ins.error?.code === '23505') { // a parallel first-session call made the row first: use it
        p = ok(await sb.from('profiles').select(PROFILE_COLS).eq('id', user.id).maybeSingle());
        if (!p) throw ins.error;
      } else p = ok(ins);
    }
    return mapProfile(p);
  },
  async getProfile(username) {
    await sb.auth.getSession();
    const p = ok(await sb.from('profiles').select(PROFILE_COLS).ilike('username', likeEsc(username)).maybeSingle());
    if (!p) return null;
    const [fers, fing] = await Promise.all([
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id),
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', p.id)
    ]);
    let isFollowing = false;
    if (meId && meId !== p.id) isFollowing = !!ok(await sb.from('follows').select('follower_id').eq('follower_id', meId).eq('following_id', p.id).maybeSingle());
    const locked = !!p.settings?.private && meId !== p.id && !isFollowing;
    return { ...mapProfile(p), isMe: meId === p.id, isFollowing, followers: fers.count || 0, following: fing.count || 0, locked };
  },
  async updateMyProfile(patch) {
    const user = await requireUser();
    const cur = ok(await sb.from('profiles').select('settings').eq('id', user.id).single());
    const row = {};
    if ('username' in patch) row.username = patch.username;
    if ('displayName' in patch) row.display_name = patch.displayName;
    if ('bio' in patch) row.bio = patch.bio;
    if ('avatarUrl' in patch) row.avatar_url = patch.avatarUrl;
    if ('theme' in patch) row.theme_preference = patch.theme;
    if ('onboarded' in patch) row.onboarded = patch.onboarded;
    if (patch.settings) row.settings = { ...(cur.settings || {}), ...patch.settings };
    const { data, error } = await sb.from('profiles').update(row).eq('id', user.id).select(PROFILE_COLS).single();
    if (error) throw new Error(/duplicate key/.test(error.message) ? 'That username is taken.' : error.message);
    return mapProfile(data);
  },

  async listEntries({ userId, showId, artistId, venueId, scope, limit = 500 } = {}) {
    await sb.auth.getSession();
    let q = sb.from('entries').select(ENTRY_SELECT);
    if (userId) q = q.eq('user_id', userId);
    if (showId) q = q.eq('show_id', showId);
    if (artistId) q = q.eq('shows.artist_id', artistId);
    if (venueId) q = q.eq('shows.venue_id', venueId);
    if (scope === 'friends') {
      if (!meId) return [];
      const f = ok(await sb.from('follows').select('following_id').eq('follower_id', meId));
      const ids = (f || []).map((r) => r.following_id);
      if (!ids.length) return [];
      q = q.in('user_id', ids);
    }
    if (scope) q = q.is('import_source', null); // bulk imports never flood feeds
    if (scope === 'tonight') q = q.eq('shows.date', todayISO());
    q = q.order('created_at', { ascending: false }).limit(scope ? Math.min(limit, 60) : limit);
    const rows = ok(await q).map(mapEntry);
    if (!scope) rows.sort((a, b) => (b.date || '').localeCompare(a.date || '') || String(b.createdAt).localeCompare(String(a.createdAt)));
    return attachPhotos(rows);
  },
  async getEntry(id) {
    const r = ok(await sb.from('entries').select(ENTRY_SELECT).eq('id', id).maybeSingle());
    return r ? (await attachPhotos([mapEntry(r)]))[0] : null;
  },
  async createEntry(input) {
    const user = await requireUser();
    const showId = await resolveShow(input);
    const dup = ok(await sb.from('entries').select('id').eq('user_id', user.id).eq('show_id', showId).limit(1).maybeSingle());
    if (dup) throw new Error('You already logged this show.');
    const row = ok(await sb.from('entries').insert(entryRow(user.id, showId, input)).select(ENTRY_SELECT).single());
    return mapEntry(row);
  },
  async createMany(inputs, onProgress) {
    const user = await requireUser(); const cache = new Map();
    const have = new Set((ok(await sb.from('entries').select('show_id').eq('user_id', user.id)) || []).map((r) => r.show_id));
    let added = 0, dupes = 0; const batch = [];
    for (let i = 0; i < inputs.length; i++) {
      const showId = await resolveShow(inputs[i], cache);
      if (have.has(showId)) dupes++;
      else { have.add(showId); batch.push({ ...entryRow(user.id, showId, inputs[i], true), is_live: false, import_source: 'csv' }); added++; }
      if (i % 5 === 0) onProgress?.(i + 1, inputs.length);
    }
    for (let i = 0; i < batch.length; i += 100) ok(await sb.from('entries').insert(batch.slice(i, i + 100)));
    onProgress?.(inputs.length, inputs.length);
    return { added, dupes };
  },
  async updateEntry(id, input) {
    const user = await requireUser();
    const showId = await resolveShow(input);
    const dup = ok(await sb.from('entries').select('id').eq('user_id', user.id).eq('show_id', showId).neq('id', id).limit(1).maybeSingle());
    if (dup) throw new Error('You already logged that show.');
    const { is_live, user_id, ...row } = entryRow(user.id, showId, input);
    const r = ok(await sb.from('entries').update(row).eq('id', id).eq('user_id', user.id).select(ENTRY_SELECT).single());
    return mapEntry(r);
  },
  async deleteEntry(id) { const user = await requireUser(); ok(await sb.from('entries').delete().eq('id', id).eq('user_id', user.id)); },
  async setLike(entryId, on) {
    const user = await requireUser();
    if (on) { const { error } = await sb.from('likes').upsert({ user_id: user.id, entry_id: entryId }, { onConflict: 'user_id,entry_id' }); if (error) throw error; }
    else ok(await sb.from('likes').delete().eq('user_id', user.id).eq('entry_id', entryId));
    const { count } = await sb.from('likes').select('*', { count: 'exact', head: true }).eq('entry_id', entryId);
    return count || 0;
  },

  async listComments(entryId) {
    return ok(await sb.from('comments').select('id, entry_id, user_id, body, created_at, profiles(username, avatar_url)').eq('entry_id', entryId).order('created_at')).map(mapComment);
  },
  async addComment(entryId, body) {
    const user = await requireUser(); const text = String(body || '').trim().slice(0, 500);
    if (!text) throw new Error('Write something first.');
    return mapComment(ok(await sb.from('comments').insert({ entry_id: entryId, user_id: user.id, body: text }).select('id, entry_id, user_id, body, created_at, profiles(username, avatar_url)').single()));
  },
  async deleteComment(id) { const user = await requireUser(); ok(await sb.from('comments').delete().eq('id', id).eq('user_id', user.id)); },
  async suggestPeople(limit = 5) {
    await sb.auth.getSession();
    const mine = meId ? new Set((ok(await sb.from('follows').select('following_id').eq('follower_id', meId)) || []).map((r) => r.following_id)) : new Set();
    let q = sb.from('profiles').select('id, username, display_name, avatar_url').order('created_at', { ascending: false }).limit(40);
    if (meId) q = q.neq('id', meId);
    const rows = ok(await q).filter((p) => !mine.has(p.id)).slice(0, limit);
    return peopleList(rows);
  },

  async listActivity() {
    const user = await requireUser();
    const [cm, lk, fl] = await Promise.all([
      sb.from('comments').select('id, body, created_at, entry_id, user_id, profiles:user_id(username, avatar_url), entries!inner(user_id, show_id, shows(artists(name)))').eq('entries.user_id', user.id).neq('user_id', user.id).order('created_at', { ascending: false }).limit(40),
      sb.from('likes').select('id, created_at, entry_id, user_id, profiles:user_id(username, avatar_url), entries!inner(user_id, show_id, shows(artists(name)))').eq('entries.user_id', user.id).neq('user_id', user.id).order('created_at', { ascending: false }).limit(40),
      sb.from('follows').select('created_at, follower_id, profiles:follower_id(username, avatar_url)').eq('following_id', user.id).order('created_at', { ascending: false }).limit(40)
    ]);
    const out = [];
    (cm.data || []).forEach((r) => out.push({ id: 'c' + r.id, type: 'comment', actorId: r.user_id, showId: r.entries?.show_id, actorName: r.profiles?.username || 'someone', actorAvatar: r.profiles?.avatar_url || '', entryId: r.entry_id, artistName: r.entries?.shows?.artists?.name || '', body: r.body, createdAt: r.created_at }));
    (lk.data || []).forEach((r) => out.push({ id: 'l' + r.id, type: 'like', actorId: r.user_id, showId: r.entries?.show_id, actorName: r.profiles?.username || 'someone', actorAvatar: r.profiles?.avatar_url || '', entryId: r.entry_id, artistName: r.entries?.shows?.artists?.name || '', body: '', createdAt: r.created_at }));
    (fl.data || []).forEach((r) => out.push({ id: 'f' + r.follower_id, type: 'follow', actorId: r.follower_id, actorName: r.profiles?.username || 'someone', actorAvatar: r.profiles?.avatar_url || '', entryId: null, artistName: '', body: '', createdAt: r.created_at }));
    const list = out.filter((a) => a.createdAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 60);
    try { // cover photo for each liked/commented show, and whether I already follow each follower
      const showIds = [...new Set(list.map((a) => a.showId).filter(Boolean))];
      const [ph, mine] = await Promise.all([
        showIds.length ? sb.from('photos').select('show_id, storage_path').in('show_id', showIds) : { data: [] },
        sb.from('follows').select('following_id').eq('follower_id', user.id)
      ]);
      const cover = {}; (ph.data || []).forEach((p) => { if (!cover[p.show_id]) cover[p.show_id] = photoUrl(p.storage_path); });
      const following = new Set((mine.data || []).map((r) => r.following_id));
      list.forEach((a) => { a.photoUrl = cover[a.showId] || ''; a.following = following.has(a.actorId); });
    } catch { /* thumbnails and follow state are optional */ }
    return list;
  },
  async votePhoto(photoId, on) {
    const user = await requireUser();
    const p = ok(await sb.from('photos').select('id, show_id, uploader_id').eq('id', photoId).single());
    if (p.uploader_id === user.id) throw new Error('You can’t vote for your own photo.');
    const siblings = ok(await sb.from('photos').select('id').eq('show_id', p.show_id)).map((x) => x.id);
    ok(await sb.from('photo_votes').delete().eq('voter_id', user.id).in('photo_id', siblings)); // one vote per show: move it
    if (on) ok(await sb.from('photo_votes').insert({ photo_id: photoId, voter_id: user.id }));
  },

  async setFollow(userId, on) {
    const user = await requireUser();
    if (on) { const { error } = await sb.from('follows').upsert({ follower_id: user.id, following_id: userId }); if (error) throw error; }
    else ok(await sb.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId));
  },
  async listFollowers(userId) {
    const rows = ok(await sb.from('follows').select('p:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)').eq('following_id', userId));
    return peopleList(rows.map((r) => r.p).filter(Boolean));
  },
  async listFollowing(userId) {
    const rows = ok(await sb.from('follows').select('p:profiles!follows_following_id_fkey(id, username, display_name, avatar_url)').eq('follower_id', userId));
    return peopleList(rows.map((r) => r.p).filter(Boolean));
  },

  async getArtist(id) {
    const a = ok(await sb.from('artists').select('id, name, genres').eq('id', id).maybeSingle());
    if (!a) return null;
    const { count } = await sb.from('artist_follows').select('*', { count: 'exact', head: true }).eq('artist_id', id);
    let followedByMe = false;
    if (meId) followedByMe = !!ok(await sb.from('artist_follows').select('artist_id').eq('artist_id', id).eq('user_id', meId).maybeSingle());
    return { id: a.id, name: a.name, genres: a.genres || [], followerCount: count || 0, followedByMe };
  },
  async setFollowArtist(artistId, on) {
    const user = await requireUser();
    if (on) { const { error } = await sb.from('artist_follows').upsert({ user_id: user.id, artist_id: artistId }); if (error) throw error; }
    else ok(await sb.from('artist_follows').delete().eq('user_id', user.id).eq('artist_id', artistId));
  },
  async getShow(id) {
    const s = ok(await sb.from('shows').select('id, date, artists(id, name), venues(id, name, city)').eq('id', id).maybeSingle());
    return s && { id: s.id, artistId: s.artists?.id, artistName: s.artists?.name, venueId: s.venues?.id, venueName: s.venues?.name, city: s.venues?.city || '', date: s.date };
  },
  async getVenue(id) { const v = ok(await sb.from('venues').select('id, name, city').eq('id', id).maybeSingle()); return v && { id: v.id, name: v.name, city: v.city || '' }; },
  async listShows({ artistId, venueId } = {}) {
    let q = sb.from('shows').select('id, date, artists(id, name), venues(id, name, city), entries!inner(rating)').order('date', { ascending: false }).limit(200);
    if (artistId) q = q.eq('artist_id', artistId);
    if (venueId) q = q.eq('venue_id', venueId);
    return ok(await q).map((s) => {
      const rs = (s.entries || []).map((e) => e.rating).filter(Boolean);
      return { id: s.id, artistId: s.artists?.id, artistName: s.artists?.name, venueId: s.venues?.id, venueName: s.venues?.name, city: s.venues?.city || '', date: s.date, logCount: s.entries.length, avgRating: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null };
    });
  },
  async listPhotos({ artistId, showId } = {}) {
    let q = sb.from('photos').select('*, profiles:uploader_id(username), shows!inner(artist_id), photo_votes(voter_id)').order('vote_count', { ascending: false }).limit(500);
    if (showId) q = q.eq('show_id', showId);
    if (artistId) q = q.eq('shows.artist_id', artistId);
    return ok(await q).map(mapPhoto).sort((a, b) => b.votes - a.votes);
  },
  async uploadPhoto(showId, file, onProgress) {
    const user = await requireUser();
    const { blob, mime } = await compressPhoto(file, onProgress);
    const path = `${user.id}/${uid()}.${mime === 'image/webp' ? 'webp' : 'jpg'}`;
    onProgress?.('uploading');
    const up = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: mime, upsert: false });
    if (up.error) throw up.error;
    const row = ok(await sb.from('photos').insert({ show_id: showId, uploader_id: user.id, storage_path: path }).select('*').single());
    onProgress?.('complete');
    return mapPhoto(row);
  },
  async uploadAvatar(file) {
    const user = await requireUser();
    const { blob, mime } = await compressPhoto(file, null, { maxDim: 320, targetBytes: 40 * 1024 });
    const path = `${user.id}/avatar-${uid()}.${mime === 'image/webp' ? 'webp' : 'jpg'}`;
    const up = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: mime });
    if (up.error) throw up.error;
    return photoUrl(path);
  },
  async acceptUgcLicense() {
    const user = await requireUser();
    ok(await sb.from('profiles').update({ agreed_to_ugc_license: true, agreed_to_ugc_license_at: new Date().toISOString() }).eq('id', user.id));
  },

  async search(q, type = 'all') {
    const p = `%${likeEsc(q.trim())}%`; const out = [];
    if (!q.trim()) return out;
    if (type === 'all' || type === 'artist') ok(await sb.from('artists').select('id, name, genres').ilike('name', p).limit(15)).forEach((a) => out.push({ type: 'artist', id: a.id, name: a.name, sub: (a.genres || []).join(', ') }));
    if (type === 'all' || type === 'venue') ok(await sb.from('venues').select('id, name, city').ilike('name', p).limit(15)).forEach((v) => out.push({ type: 'venue', id: v.id, name: v.name, sub: v.city || '' }));
    if (type === 'all' || type === 'user') ok(await sb.from('profiles').select('id, username, display_name, avatar_url').ilike('username', p).limit(15)).forEach((u) => out.push({ type: 'user', id: u.id, name: u.username, sub: u.display_name || '', avatarUrl: u.avatar_url }));
    return out;
  },
  async topArtists(limit = 8) {
    const rows = ok(await sb.from('entries').select('shows!inner(artist_id, artists(name))').order('created_at', { ascending: false }).limit(500));
    const m = new Map();
    rows.forEach((r) => { const id = r.shows?.artist_id; if (id) m.set(id, { id, name: r.shows.artists?.name, logs: (m.get(id)?.logs || 0) + 1 }); });
    return [...m.values()].sort((a, b) => b.logs - a.logs).slice(0, limit);
  },
  async suggestions() {
    const [a, v] = await Promise.all([sb.from('artists').select('name').order('name').limit(1000), sb.from('venues').select('name, city').order('name').limit(1000)]);
    return { artists: (a.data || []).map((x) => x.name), venues: (v.data || []).map((x) => ({ name: x.name, city: x.city || '' })) };
  }
};

async function peopleList(profiles) {
  if (!profiles.length) return [];
  const ids = profiles.map((p) => p.id);
  const [mine, theirs, ents] = await Promise.all([
    meId ? sb.from('follows').select('following_id').eq('follower_id', meId) : { data: [] },
    meId ? sb.from('follows').select('follower_id').eq('following_id', meId) : { data: [] },
    sb.from('entries').select('user_id, shows(artists(name))').in('user_id', ids)
  ]);
  const iFollow = new Set((mine.data || []).map((r) => r.following_id)), followsMe = new Set((theirs.data || []).map((r) => r.follower_id));
  return profiles.map((p) => {
    const mine_ = (ents.data || []).filter((e) => e.user_id === p.id);
    const c = new Map(); mine_.forEach((e) => { const n = e.shows?.artists?.name; if (n) c.set(n, (c.get(n) || 0) + 1); });
    return { id: p.id, username: p.username, displayName: p.display_name || '', avatarUrl: p.avatar_url || '', isMe: p.id === meId, isFollowing: iFollow.has(p.id), followsMe: followsMe.has(p.id), shows: mine_.length, topArtists: [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n) };
  });
}

function mapComment(r) {
  return { id: r.id, entryId: r.entry_id, userId: r.user_id, username: r.profiles?.username || 'unknown', avatarUrl: r.profiles?.avatar_url || '', body: r.body, createdAt: r.created_at, mine: r.user_id === meId };
}
