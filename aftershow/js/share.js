// Share cards: renders a 1080x1350 image (Instagram-story friendly) to a canvas, then shares or downloads it.
import { paletteFor } from './ui.js';
import { formatDate, downloadBlob } from './util.js';

const W = 1080, H = 1350;

async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('italic 700 100px "Playfair Display"'), document.fonts.load('600 40px "Inter"'),
      document.fonts.load('400 30px "DM Mono"'), document.fonts.load('400 100px "Bebas Neue"'), document.fonts.load('italic 400 40px "Crimson Pro"')
    ]);
  } catch { /* fall back to system fonts */ }
}
function loadImage(url) {
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => rej(new Error('Could not load the photo for the card.')); i.src = url; });
}
function wrap(ctx, text, maxWidth) {
  const words = text.split(' '); const lines = []; let line = '';
  words.forEach((w) => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line); return lines;
}
async function background(ctx, name, photo) {
  const { c1, c2, x, y } = paletteFor(name);
  if (photo) {
    try {
      const img = await loadImage(photo); const r = Math.max(W / img.width, H / img.height);
      ctx.drawImage(img, (W - img.width * r) / 2, (H - img.height * r) / 2, img.width * r, img.height * r);
    } catch { photo = null; }
  }
  if (!photo) {
    ctx.fillStyle = '#0A0A0B'; ctx.fillRect(0, 0, W, H);
    const lin = ctx.createLinearGradient(0, 0, W * 0.4, H); lin.addColorStop(0, c2); lin.addColorStop(1, '#0A0A0B'); ctx.fillStyle = lin; ctx.fillRect(0, 0, W, H);
    const rad = ctx.createRadialGradient(W * x / 100, H * y / 100, 0, W * x / 100, H * y / 100, W * 1.0); rad.addColorStop(0, c1); rad.addColorStop(0.65, 'rgba(0,0,0,0)'); ctx.fillStyle = rad; ctx.fillRect(0, 0, W, H);
  }
  const shade = ctx.createLinearGradient(0, H * 0.3, 0, H); shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.82)'); ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
  const top = ctx.createLinearGradient(0, 0, 0, 260); top.addColorStop(0, 'rgba(0,0,0,.5)'); top.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = top; ctx.fillRect(0, 0, W, 260);
}
function wordmark(ctx) {
  ctx.fillStyle = '#fff'; ctx.font = 'italic 700 56px "Playfair Display", serif'; ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText('aftershow').width; ctx.fillText('aftershow', 72, 116);
  ctx.fillStyle = '#E3B552'; ctx.fillText('.', 72 + w, 116);
}

function halftone(ctx) {
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.16)';
  for (let y = 6; y < H; y += 20) for (let x = (y / 20) % 2 ? 16 : 6; x < W; x += 20) { ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.2832); ctx.fill(); }
  ctx.restore();
}
function stub(ctx, e, username) {
  const top = H - 230;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, top, W, H - top);
  ctx.setLineDash([16, 12]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.moveTo(40, top); ctx.lineTo(W - 40, top); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#0A0A0B'; [0, W].forEach((x) => { ctx.beginPath(); ctx.arc(x, top, 30, 0, 6.2832); ctx.fill(); });
  const no = String([...e.id].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 10000).padStart(4, '0');
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic'; ctx.font = '400 78px "Bebas Neue", sans-serif'; ctx.fillText('ADMIT ONE', 72, top + 100);
  ctx.font = '500 30px "DM Mono", monospace'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('No. ' + no + '   @' + username, 72, top + 162);
  if (e.rating) { ctx.textAlign = 'right'; ctx.font = '500 64px "DM Mono", monospace'; ctx.fillStyle = '#F4C760'; ctx.fillText(e.rating + ' / 10', W - 72, top + 118); ctx.textAlign = 'left'; }
  ctx.restore();
}
const toBlob = (canvas) => new Promise((res) => canvas.toBlob(res, 'image/png'));

async function output(blob, filename, title) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; } }
  downloadBlob(filename, blob); return 'downloaded';
}

export async function shareEntry(e, username, credit = '', coverUrl = '') {
  await fontsReady();
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d');
  await background(ctx, e.artistName, coverUrl || e.photos?.[0]?.url);
  halftone(ctx);
  wordmark(ctx);
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
  const name = e.artistName.toUpperCase();
  let size = 280; ctx.font = `400 ${size}px "Bebas Neue", "Playfair Display", sans-serif`;
  let lines = wrap(ctx, name, W - 144);
  while ((lines.length > 3 || lines.some((l) => ctx.measureText(l).width > W - 144)) && size > 110) { size -= 10; ctx.font = `400 ${size}px "Bebas Neue", "Playfair Display", sans-serif`; lines = wrap(ctx, name, W - 144); }
  const lh = size * 0.9; const base = H - 230 - 250 - (lines.length - 1) * lh;
  lines.forEach((l, k) => ctx.fillText(l, 72, base + k * lh));
  ctx.fillRect(72, H - 230 - 214, 96, 6);
  ctx.font = '600 46px "Inter", sans-serif'; ctx.fillText([e.venueName, e.city].filter(Boolean).join(', ').slice(0, 40), 72, H - 230 - 140);
  ctx.font = '400 32px "DM Mono", monospace'; ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fillText(formatDate(e.date) + (e.fromMemory ? '  ·  from memory' : ''), 72, H - 230 - 86);
  if (credit) { ctx.textAlign = 'right'; ctx.font = '500 30px "DM Mono", monospace'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText('Photo by @' + credit, W - 72, H - 230 - 86); ctx.textAlign = 'left'; }
  stub(ctx, e, username);
  return output(await toBlob(canvas), `aftershow-${e.artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`, `${e.artistName} on Aftershow`);
}

export async function shareRecap({ username, total, artists, venues, top, since }) {
  await fontsReady();
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d');
  await background(ctx, top[0]?.[0] || 'recap');
  wordmark(ctx);
  ctx.fillStyle = '#fff'; ctx.font = 'italic 700 96px "Playfair Display", serif'; ctx.fillText('My life in', 72, 400); ctx.fillText('concerts.', 72, 500);
  ctx.font = '700 260px "Inter", sans-serif'; ctx.fillText(String(total), 64, 780);
  ctx.font = '500 42px "Inter", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(`shows since ${since}  ·  ${artists} artists  ·  ${venues} venues`, 72, 850);
  ctx.font = '600 40px "Inter", sans-serif'; ctx.fillStyle = '#fff';
  top.forEach(([n, c], i) => { ctx.fillText(`${i + 1}  ${n.slice(0, 26)}`, 72, 990 + i * 70); ctx.textAlign = 'right'; ctx.fillStyle = '#F4C760'; ctx.fillText(`${c}×`, W - 72, 990 + i * 70); ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; });
  ctx.font = '500 32px "Inter", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('@' + username, 72, H - 72);
  return output(await toBlob(canvas), 'aftershow-recap.png', 'My life in concerts');
}
