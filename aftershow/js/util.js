// Small shared helpers: escaping, dates, ratings, aggregation.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y) return iso;
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
export function relativeTime(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 86400 * 30) return Math.floor(diff / 86400) + 'd ago';
  return formatDate(String(ts).slice(0, 10));
}
export const initials = (name) => (name || '?').split(/[\s_.-]+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
export const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

// Ratings run 1-10 and show as a small amp knob pointing at the number.
export function ratingDial(n) {
  if (!n) return '';
  return `<span class="dial" role="img" aria-label="Rated ${n} out of 10" style="--v:${n}"><i aria-hidden="true"></i><b aria-hidden="true">${n}</b></span>`;
}

export function countBy(list, keyFn) {
  const m = new Map();
  list.forEach((x) => { const k = keyFn(x); if (k) m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}
export const avg = (nums) => { const n = nums.filter((x) => x != null); return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null; };

// Aggregates a user's (or anyone's) entry list into the numbers the Stats / Profile screens show.
export function computeStats(entries) {
  const years = countBy(entries, (e) => (e.date || '').slice(0, 4)).sort((a, b) => a[0].localeCompare(b[0]));
  const ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => entries.filter((e) => e.rating === r).length);
  const dates = entries.map((e) => e.date).filter(Boolean).sort();
  const genres = countBy(entries.flatMap((e) => e.genres || []), (g) => g);
  return {
    total: entries.length,
    artists: countBy(entries, (e) => e.artistName),
    venues: countBy(entries, (e) => e.venueName),
    cities: countBy(entries, (e) => e.city),
    genres,
    years,
    ratings,
    avgRating: avg(entries.map((e) => e.rating)),
    memoryCount: entries.filter((e) => e.fromMemory).length,
    first: dates[0] || null,
    last: dates[dates.length - 1] || null,
    songs: countBy(entries.flatMap((e) => e.setlist || []), (s) => s)
  };
}

export function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

export function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadFile(name, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Friendly message for network/auth failures (the Supabase project is currently unreachable).
export function friendlyError(e) {
  const m = (e && e.message) || String(e);
  if (/failed to fetch|networkerror|load failed|network request/i.test(m)) return "Can't reach the Aftershow server. Check your connection, or try demo mode.";
  if (/invalid login/i.test(m)) return 'Wrong email or password.';
  if (/already registered|already exists/i.test(m)) return 'That email is already registered — try signing in.';
  return m;
}

// Typo-tolerant match: substring, or every query word is within one edit of a word that starts like it.
export function editDistance(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 3;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
export function fuzzyMatch(text, query) {
  const t = norm(text), q = norm(query); if (!q) return true; if (t.includes(q)) return true;
  const words = t.split(/[\s,.'’-]+/).filter(Boolean);
  return q.split(' ').every((w) => w.length < 3 ? words.some((x) => x.startsWith(w)) : words.some((x) => x.startsWith(w) || editDistance(x.slice(0, w.length + 1), w) <= (w.length >= 5 ? 2 : 1)));
}
