// The onboarding scene: the kind of act someone goes to see, in a living room (private) or on a stage (public).
// The figures are 3D clay mannequins (assets/acts/*.webp) on a white background. The scene is light and the images use
// multiply blending, so the white drops out and the figure sits in the room or on the stage.

// Acts and their pictures. Rock and K-pop have a different picture for private and public; the others use one for both.
const SPLIT = new Set(['rock', 'kpop']);
// folk reuses the seated guitarist from the rock act's private picture
const src = (act, mode) => `assets/acts/${act === 'folk' ? 'rock-private' : SPLIT.has(act) ? `${act}-${mode}` : act}.webp`;

// Genres shown in the picker, grouped. Each one maps to one of the acts above.
export const GENRE_GROUPS = [
  { label: 'Rock & metal', items: [['Rock', 'rock'], ['Hard rock', 'rock'], ['Metal', 'rock'], ['Punk', 'rock'], ['Grunge', 'rock'], ['Alternative', 'rock'], ['Industrial', 'rock']] },
  { label: 'Pop & R&B', items: [['Pop', 'pop'], ['R&B', 'pop'], ['Soul', 'pop'], ['Hip-hop & rap', 'pop'], ['Singer-songwriter', 'pop'], ['Latin', 'latin'], ['Reggae', 'latin']] },
  { label: 'Dance', items: [['K-pop', 'kpop'], ['J-pop', 'kpop'], ['Electronic & EDM', 'dj'], ['Disco & funk', 'dj']] },
  { label: 'Bands & roots', items: [['Indie', 'folk'], ['Folk', 'folk'], ['Country', 'country'], ['Blues', 'folk'], ['Jazz', 'pop'], ['Classical & orchestral', 'folk']] },
  { label: 'Other', items: [['A bit of everything', 'pop']] },
];
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const GENRES = GENRE_GROUPS.flatMap((g) => g.items.map(([label, act]) => ({ id: slug(label), label, group: g.label, act })));
// settings saved by earlier versions of the picker
const LEGACY = { rock: 'rock', solo: 'pop', dance: 'kpop', band: 'folk', mix: 'pop' };
export const actOf = (genre) => GENRES.find((g) => g.id === genre)?.act || LEGACY[genre] || 'rock';

const BG = `<svg class="sc-bg" viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="scGlow" cx="50%" cy="45%" r="62%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fbefd2"/><stop offset="1" stop-color="#efcf8e"/></radialGradient>
    <radialGradient id="scLamp" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2c4" stop-opacity=".95"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></radialGradient>
    <linearGradient id="scBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <g class="sc-room">
    <rect width="320" height="240" fill="#e7e1d5"/>
    <rect y="176" width="320" height="64" fill="#d2c8b6"/><path d="M0 176H320" stroke="#bfb39e" stroke-width="2"/>
    <rect x="26" y="34" width="64" height="80" rx="3" fill="#d4e3ef" stroke="#b6aa94" stroke-width="3"/><path d="M58 34V114M26 74H90" stroke="#b6aa94" stroke-width="3"/><circle cx="72" cy="52" r="7" fill="#fff7dd"/>
    <rect x="216" y="44" width="30" height="40" fill="#caa7a0"/><rect x="252" y="56" width="26" height="34" fill="#a9bccb"/>
    <rect x="10" y="138" width="92" height="40" rx="9" fill="#b7a287"/><rect x="6" y="158" width="100" height="22" rx="9" fill="#a8927a"/>
    <circle cx="282" cy="88" r="52" fill="url(#scLamp)"/><path d="M282 92V176" stroke="#8c7a63" stroke-width="3.5"/><path d="M266 92H298L291 70H273Z" fill="#E3B552"/>
    <ellipse cx="170" cy="196" rx="92" ry="13" fill="#b8a98f" opacity=".6"/>
  </g>
  <g class="sc-stage">
    <rect width="320" height="240" fill="url(#scGlow)"/>
    <rect width="320" height="16" fill="#a9824a"/>
    <circle cx="70" cy="16" r="6" fill="#fff6dc"/><circle cx="160" cy="16" r="6" fill="#fff6dc"/><circle cx="250" cy="16" r="6" fill="#fff6dc"/>
    <path d="M62 16L78 16L184 200L98 200Z" fill="url(#scBeam)"/><path d="M242 16L258 16L222 200L136 200Z" fill="url(#scBeam)"/><path d="M152 16L168 16L214 200L106 200Z" fill="url(#scBeam)" opacity=".6"/>
    <rect y="178" width="320" height="26" fill="#e0b46c"/><path d="M0 204H320" stroke="#8a5a1f" stroke-width="2.5"/>
  </g>
</svg>`;

// Fans in front of the stage, with a few phones held up.
const person = (x, h, arm) => `<g transform="translate(${x} 0)"><circle cx="0" cy="${235 - h}" r="9"/><path d="M-14 240Q-14 ${240 - h + 4} 0 ${240 - h + 4}Q14 ${240 - h + 4} 14 240Z"/>${arm ? `<path d="M10 ${240 - h + 10}L18 ${240 - h - 14}" stroke="#4a382a" stroke-width="5" stroke-linecap="round"/><rect class="sc-phone" x="13" y="${240 - h - 26}" width="9" height="13" rx="2" transform="rotate(10 17 ${240 - h - 20})"/>` : ''}</g>`;
const CROWD = `<svg class="sc-crowd" viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="#4a382a">${[[18, 38, 0], [52, 30, 1], [88, 40, 0], [126, 28, 0], [166, 38, 1], [206, 30, 0], [244, 40, 0], [282, 32, 1], [314, 38, 0]].map(([x, h, a]) => person(x, h, a)).join('')}</g></svg>`;

/** The scene. `genres` is up to three picks, favourite first: the first stands in the middle, the second and third beside it on the stage. */
export const sceneHtml = (genres) => {
  const acts = [...new Set((Array.isArray(genres) ? genres : [genres]).filter(Boolean).map(actOf))].slice(0, 3);
  if (!acts.length) acts.push('rock');
  const [mid, left, right] = acts;
  const img = (cls, act, mode) => `<img class="sc-fig ${cls}" src="${src(act, mode)}" alt="" width="640" height="640" decoding="async">`;
  return `<div class="sc" aria-hidden="true">${BG}
    ${left ? img('sc-side sc-l', left, 'public') : ''}${right ? img('sc-side sc-r', right, 'public') : ''}
    ${img('sc-mid sc-priv', mid, 'private')}${img('sc-mid sc-pub', mid, 'public')}${CROWD}</div>`;
};
