// CSV parsing + column mapping for history imports.
// Concert Archives' "Export to Spreadsheet" is emailed to the user and its exact headers are not publicly documented,
// so the mapper matches a broad alias list and the import screen lets the user fix the mapping before importing.
import { norm } from './util.js';

export function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split('\n')[0];
  const delim = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? '\t' : ',';
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  if (!rows.length) return { headers: [], rows: [] };
  return { headers: rows[0].map((h) => h.trim()), rows: rows.slice(1) };
}

export const FIELDS = [
  { key: 'artist', label: 'Artist', required: true, aliases: ['artist', 'artists', 'band', 'bands', 'headliner', 'performer', 'act', 'event', 'main act', 'band/artist', 'artist/band'] },
  { key: 'date', label: 'Date', required: true, aliases: ['date', 'concert date', 'show date', 'event date', 'when'] },
  { key: 'venue', label: 'Venue', required: true, aliases: ['venue', 'venue name', 'location', 'place', 'club'] },
  { key: 'city', label: 'City', aliases: ['city', 'town'] },
  { key: 'state', label: 'State / region', aliases: ['state', 'region', 'province'] },
  { key: 'rating', label: 'Rating', aliases: ['rating', 'stars', 'score', 'my rating'] },
  { key: 'notes', label: 'Notes', aliases: ['notes', 'note', 'comments', 'comment', 'review', 'description', 'memo'] },
  { key: 'openers', label: 'Openers (added to notes)', aliases: ['warm up', 'warmup', 'openers', 'opener', 'opening acts', 'support', 'supporting acts', 'also performing', 'other acts'] },
  { key: 'setlist', label: 'Setlist', aliases: ['setlist', 'set list', 'songs'] }
];

export function guessMapping(headers) {
  const map = {}; const used = new Set();
  FIELDS.forEach((f) => {
    const idx = headers.findIndex((h, i) => !used.has(i) && f.aliases.includes(norm(h)));
    if (idx >= 0) { map[f.key] = idx; used.add(idx); }
  });
  return map;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export function parseDate(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const pad = (n) => String(n).padStart(2, '0');
  let m;
  if ((m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/))) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/))) { // US month-first
    let y = +m[3]; if (y < 100) y += y > 40 ? 1900 : 2000;
    let mo = +m[1], d = +m[2];
    if (mo > 12 && d <= 12) [mo, d] = [d, mo];
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  if ((m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/))) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (mi >= 0) return `${m[3]}-${pad(mi + 1)}-${pad(m[2])}`;
  }
  if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/))) {
    const mi = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    if (mi >= 0) return `${m[3]}-${pad(mi + 1)}-${pad(m[1])}`;
  }
  if ((m = s.match(/^(\d{4})$/))) return `${m[1]}-01-01`;
  const d = new Date(s);
  return isNaN(d) ? null : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseRating(raw) {
  const n = parseFloat(String(raw || '').replace(/[^\d.]/g, ''));
  if (!n) return null;
  // Concert Archives and most spreadsheets use 1-5; anything 5 or under is doubled onto our 10-point dial.
  return Math.min(10, Math.max(1, Math.round(n <= 5 ? n * 2 : n)));
}

// Returns { valid: [entryInput], skipped: [{row, reason}] } — dedupes within the file on artist+venue+date.
export function mapRows(rows, map) {
  const valid = [], skipped = []; const seen = new Set();
  const get = (r, k) => (map[k] != null ? String(r[map[k]] ?? '').trim() : '');
  rows.forEach((r, i) => {
    const artistName = get(r, 'artist'), venueName = get(r, 'venue') || 'Unknown venue', date = parseDate(get(r, 'date'));
    if (!artistName) return skipped.push({ row: i + 2, reason: 'Missing artist' });
    if (!date) return skipped.push({ row: i + 2, reason: `Unreadable date "${get(r, 'date')}"` });
    const key = [artistName, venueName, date].map(norm).join('|');
    if (seen.has(key)) return skipped.push({ row: i + 2, reason: 'Duplicate in file' });
    seen.add(key);
    const openers = get(r, 'openers'); let note = get(r, 'notes');
    if (openers) note = (note ? note + '\n' : '') + 'With: ' + openers;
    const city = [get(r, 'city'), get(r, 'state')].filter(Boolean).join(', ');
    const setlist = get(r, 'setlist') ? get(r, 'setlist').split(/\s*[\n;|]\s*/).filter(Boolean) : [];
    valid.push({ artistName, venueName, city, date, rating: parseRating(get(r, 'rating')), note, setlist, fromMemory: true, isLive: false });
  });
  return { valid, skipped };
}

export const SAMPLE_CSV = `Date,Band,Venue,City,State,Rating,Notes,Warm Up
2019-06-14,Tool,Pinnacle Bank Arena,Lincoln,NE,5,Fear Inoculum live was unreal,Opener Band
2017-03-02,Deftones,Skyway Theatre,Minneapolis,MN,4,Pit was tight,Frank Iero
2022-10-21,Paramore,Fiserv Forum,Milwaukee,WI,5,Cried during Misery Business,Foals
`;
