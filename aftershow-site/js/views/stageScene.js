// The onboarding scene: a stick-figure act in a living room (private) or on a stage (public).
// Who is in it depends on the kind of shows someone goes to. The centre figure never changes between the two moods;
// in public, band-mates and dancers appear around it.

export const GENRES = [
  { id: 'rock', label: 'Rock & metal', hint: 'Riffs, pits, loud amps' },
  { id: 'solo', label: 'Pop, R&B & hip-hop', hint: 'Solo artists, big voices' },
  { id: 'dance', label: 'K-pop & dance', hint: 'Choreography, light sticks' },
  { id: 'band', label: 'Bands', hint: 'Indie, folk, country, everything in a band' },
  { id: 'mix', label: 'A bit of everything', hint: 'No favourite, just good nights' },
];
const KIND = { rock: 'rock', solo: 'solo', dance: 'dance', band: 'band', mix: 'band' };
export const kindOf = (genre) => KIND[genre] || 'rock';

const HEAD = `<svg class="sc" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="scLamp" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F4C760" stop-opacity=".5"/><stop offset="1" stop-color="#F4C760" stop-opacity="0"/></radialGradient>
    <linearGradient id="scBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4E6B8" stop-opacity=".55"/><stop offset="1" stop-color="#F4E6B8" stop-opacity="0"/></linearGradient>
    <linearGradient id="scCrowd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3B552" stop-opacity=".38"/><stop offset="1" stop-color="#E3B552" stop-opacity=".05"/></linearGradient>
  </defs>
  <g class="sc-room">
    <rect width="320" height="200" fill="#17120e"/>
    <rect y="150" width="320" height="50" fill="#21180f"/><path d="M0 150H320" stroke="#33261a" stroke-width="2"/>
    <rect x="22" y="24" width="60" height="72" rx="3" fill="#0d1626" stroke="#3a2e22" stroke-width="2"/><path d="M52 24V96M22 60H82" stroke="#3a2e22" stroke-width="2"/><circle cx="66" cy="42" r="7" fill="#E9E2CC" opacity=".9"/>
    <rect x="200" y="30" width="26" height="36" fill="#6b2d2d"/><rect x="232" y="40" width="22" height="30" fill="#2d4a6b"/>
    <rect x="14" y="112" width="76" height="40" rx="7" fill="#2b2017"/><rect x="10" y="130" width="84" height="22" rx="7" fill="#35271c"/>
    <circle cx="276" cy="66" r="46" fill="url(#scLamp)"/><path d="M276 70V150" stroke="#4a3a28" stroke-width="3"/><path d="M262 70H290L284 52H268Z" fill="#E3B552" opacity=".92"/>
    <ellipse cx="160" cy="170" rx="82" ry="11" fill="#3a1f1a" opacity=".85"/>
    <rect x="206" y="126" width="38" height="26" rx="3" fill="#1a1613" stroke="#4a3a28" stroke-width="1.5"/><circle cx="216" cy="133" r="2" fill="#E3B552"/><circle cx="224" cy="133" r="2" fill="#E3B552"/><circle cx="232" cy="133" r="2" fill="#E3B552"/><rect x="211" y="139" width="28" height="9" rx="1.5" fill="#0d0b09"/>
  </g>
  <g class="sc-stage">
    <rect width="320" height="200" fill="#0c0b10"/>
    <rect width="320" height="12" fill="#1d1b27"/>
    <circle cx="70" cy="12" r="5" fill="#F4E6B8"/><circle cx="160" cy="12" r="5" fill="#F4E6B8"/><circle cx="250" cy="12" r="5" fill="#F4E6B8"/>
    <path d="M62 12L78 12L176 170L112 170Z" fill="url(#scBeam)"/><path d="M242 12L258 12L204 170L142 170Z" fill="url(#scBeam)"/><path d="M152 12L168 12L190 170L130 170Z" fill="url(#scBeam)" opacity=".7"/>
    <rect y="150" width="320" height="22" fill="#1b1824"/><path d="M0 172H320" stroke="#E3B552" stroke-width="2" opacity=".7"/>
    <rect y="172" width="320" height="28" fill="url(#scCrowd)"/>
    <rect x="228" y="86" width="42" height="64" rx="2" fill="#17151c" stroke="#2f2b3a" stroke-width="1.5"/><circle cx="249" cy="104" r="10" fill="#0d0c12" stroke="#3a3646" stroke-width="1.5"/><circle cx="249" cy="132" r="10" fill="#0d0c12" stroke="#3a3646" stroke-width="1.5"/>
    <path d="M52 150L96 150L88 140L60 140Z" fill="#17151c" stroke="#2f2b3a" stroke-width="1.5"/>
    <g class="sc-crowd" fill="#050408"><circle cx="8" cy="192" r="6"/><rect x="1" y="197" width="14" height="14" rx="6"/><path d="M12 198 L17 178" stroke="#050408" stroke-width="3" stroke-linecap="round" fill="none"/><rect class="sc-phone" x="15" y="171" width="4" height="6" rx="1" stroke="none"/><circle cx="36" cy="190" r="6"/><rect x="29" y="195" width="14" height="14" rx="6"/><path d="M32 196 L27 178" stroke="#050408" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="62" cy="192" r="6"/><rect x="55" y="197" width="14" height="14" rx="6"/><circle cx="90" cy="194" r="6"/><rect x="83" y="199" width="14" height="14" rx="6"/><path d="M94 200 L99 180" stroke="#050408" stroke-width="3" stroke-linecap="round" fill="none"/><rect class="sc-phone" x="97" y="173" width="4" height="6" rx="1" stroke="none"/><circle cx="118" cy="190" r="6"/><rect x="111" y="195" width="14" height="14" rx="6"/><path d="M114 196 L109 178" stroke="#050408" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="146" cy="190" r="6"/><rect x="139" y="195" width="14" height="14" rx="6"/><circle cx="174" cy="194" r="6"/><rect x="167" y="199" width="14" height="14" rx="6"/><path d="M178 200 L183 180" stroke="#050408" stroke-width="3" stroke-linecap="round" fill="none"/><rect class="sc-phone" x="181" y="173" width="4" height="6" rx="1" stroke="none"/><circle cx="202" cy="190" r="6"/><rect x="195" y="195" width="14" height="14" rx="6"/><path d="M198 196 L193 178" stroke="#050408" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="230" cy="192" r="6"/><rect x="223" y="197" width="14" height="14" rx="6"/><circle cx="258" cy="194" r="6"/><rect x="251" y="199" width="14" height="14" rx="6"/><path d="M262 200 L267 180" stroke="#050408" stroke-width="3" stroke-linecap="round" fill="none"/><rect class="sc-phone" x="265" y="173" width="4" height="6" rx="1" stroke="none"/><circle cx="286" cy="190" r="6"/><rect x="279" y="195" width="14" height="14" rx="6"/><path d="M282 196 L277 178" stroke="#050408" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="312" cy="194" r="6"/><rect x="305" y="199" width="14" height="14" rx="6"/></g>
  </g>
`;
const STROKE = 'fill="none" stroke="#F2EEE4" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"';
const SHADOW = '<ellipse cx="160" cy="169" rx="34" ry="4" fill="#000" opacity=".35"/>';
const HAIR = '<path d="M149 60Q148 49 160 49Q172 49 171 60"/><path d="M149 60Q145 70 148 78M171 60Q175 70 172 78"/>';

// Guitarist with a Flying V (the original figure).
const ROCK = `<ellipse cx="160" cy="169" rx="34" ry="4" fill="#000" opacity=".35"/>
    <g fill="none" stroke="#F2EEE4" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="160" cy="62" r="11"/><path d="M149 60Q148 49 160 49Q172 49 171 60"/><path d="M149 60Q145 70 148 78M171 60Q175 70 172 78"/>
      <path d="M160 73V120"/><path d="M160 120L146 168M160 120L176 166"/><path d="M146 168H137M176 166H185"/>
    </g>
    <path d="M163 78Q196 84 205 118" fill="none" stroke="#8a6a2a" stroke-width="2.4" stroke-linecap="round"/>
    <g transform="translate(160 112) rotate(28)">
      <rect x="-72" y="-3" width="62" height="6" rx="1" fill="#7a5a2e"/>
      <path d="M-62-3V3M-52-3V3M-42-3V3M-32-3V3M-22-3V3" stroke="#d8c89a" stroke-width=".8"/>
      <path d="M-72-5L-91-8L-92 4L-72 5Z" fill="#3a2a14"/><circle cx="-80" cy="-5" r="1.6" fill="#ddd"/><circle cx="-86" cy="-6" r="1.6" fill="#ddd"/><circle cx="-80" cy="4" r="1.6" fill="#ddd"/><circle cx="-86" cy="3" r="1.6" fill="#ddd"/>
      <path d="M-10 0L40-22L45-16L12 1L45 18L40 24Z" fill="#E3B552" stroke="#7a5a1a" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M0-3L30-15L32-12L6 0L32 12L30 15L0 3Z" fill="#17110a" opacity=".85"/>
      <rect x="6" y="-5" width="3" height="10" rx=".8" fill="#d6d6d6"/><rect x="14" y="-7" width="3" height="14" rx=".8" fill="#d6d6d6"/><rect x="24" y="-9" width="3" height="18" rx=".8" fill="#b8b8b8"/>
      <circle cx="22" cy="11" r="1.8" fill="#222"/><circle cx="28" cy="14" r="1.8" fill="#222"/>
      <path d="M-72 0H26" stroke="#e4e4e4" stroke-width=".7"/>
    </g>
    <g fill="none" stroke="#F2EEE4" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M160 84L140 98L117 89"/><path d="M160 84L178 98L178 121"/>
    </g>
`;

// Singer with a microphone.
const SOLO = `${SHADOW}<g ${STROKE}><circle cx="160" cy="62" r="11"/>${HAIR}<path d="M160 73V120"/><path d="M160 120L148 168M160 120L174 168"/><path d="M148 168H139M174 168H183"/>
  <path d="M160 84L179 80L167 67"/><path d="M160 84L142 92L126 78"/></g>
  <path d="M168 69L173 61" stroke="#9a9a9a" stroke-width="4.5" stroke-linecap="round"/><circle cx="166" cy="64" r="4.6" fill="#d6d6d6" stroke="#6a6a6a" stroke-width="1"/>`;

// Mid-dance: one arm up, one leg kicked out.
const DANCE = `<ellipse cx="160" cy="169" rx="34" ry="4" fill="#000" opacity=".35"/><g ${STROKE}><circle cx="162" cy="61" r="11"/><path d="M151 58Q150 48 162 48Q173 48 172 58"/><path d="M151 58Q146 68 149 76M172 58Q177 66 175 74"/>
  <path d="M161 72Q157 96 160 118"/><path d="M160 118L157 168"/><path d="M157 168H148"/><path d="M160 118L182 132L199 122"/>
  <path d="M161 82L142 66L136 48"/><path d="M161 84L181 94L195 82"/></g><path d="M133 42L136 36L139 42L145 45L139 48L136 54L133 48L127 45Z" fill="#F4C760"/>`;

const place = (inner, dx, s, flip) => `<g transform="translate(${160 + dx} 168) scale(${flip ? -s : s} ${s}) translate(-160 -168)">${inner}</g>`;

const centre = (kind) => (kind === 'dance' ? DANCE : kind === 'rock' ? ROCK : SOLO);
const extras = (kind) => (kind === 'dance'
  ? place(DANCE, -66, 0.84, false) + place(DANCE, 66, 0.84, true)
  : kind === 'band'
    ? place(ROCK, -94, 0.75, false) + place(ROCK, 94, 0.75, true)
    : '');

/** The full scene. Same centre figure in both moods; band-mates and dancers join it on the public stage. */
export const sceneSvg = (genre) => {
  const kind = kindOf(genre);
  return HEAD + `  <g class="sc-extra">${extras(kind)}</g>\n  <g class="sc-figure">${centre(kind)}</g>\n</svg>`;
};

/** A small picture of the act for the genre picker. */
export const thumbSvg = (genre) => {
  const kind = kindOf(genre);
  return `<svg class="gn-art" viewBox="10 30 300 150" aria-hidden="true" focusable="false"><rect x="10" y="30" width="300" height="150" fill="#0f0f11"/><path d="M10 168H310" stroke="#E3B552" stroke-width="2" opacity=".6"/><g>${extras(kind)}</g><g>${centre(kind)}</g></svg>`;
};
