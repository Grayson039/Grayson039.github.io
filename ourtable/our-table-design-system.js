/**
 * Our Table — Shared Design System
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for color tokens, typography, spacing,
 * and every reusable UI component used across all screen files.
 *
 * USAGE (in any prototype HTML file):
 *   <script src="our-table-design-system.js"></script>
 *
 *   All tokens and components live on the global `OT` object.
 *   Pass OT.L (light theme) or OT.D (dark theme) as the first
 *   argument to any component function.
 *
 * QUICK REFERENCE:
 *   OT.L / OT.D                  — color theme objects
 *   OT.T                         — typography constants
 *   OT.S                         — spacing constants
 *   OT.R                         — border radius constants
 *   OT.c.statusBar(theme)        — iOS status bar
 *   OT.c.navBar(theme, activeIdx)— bottom tab bar (0–4)
 *   OT.c.btn(theme, label, fn, variant) — button
 *   OT.c.input(theme, id, type, placeholder, value)
 *   OT.c.recipeCardLarge(theme, recipe, onClickFn)
 *   OT.c.recipeCardSmall(theme, recipe, onClickFn)
 *   OT.c.listItem(theme, item, checked, onClickFn)
 *   OT.nav(screens, startId, containerId, opts) — wires navigation
 * ─────────────────────────────────────────────────────────────
 */

(function (global) {

  /* ══════════════════════════════════════════════════════════
     COLOR TOKENS
     All screens must import these rather than hardcoding hex
     values — this is how dark mode works for free.
  ══════════════════════════════════════════════════════════ */

  var L = {
    _name:     'light',
    bg:        '#FAF7F0',   // page / screen background
    card:      '#FFFFFF',   // card surfaces
    primary:   '#1B3A5C',   // midnight navy — CTAs, active states
    secondary: '#E8A84A',   // warm amber — accents, dietary tags
    text:      '#2C2416',   // primary text
    muted:     '#8A7060',   // secondary / placeholder text
    border:    '#E8DDD5',   // dividers, card borders
    chip:      '#E8EFF6',   // filter pill backgrounds
    chipTx:    '#5A7090',   // filter pill text
    input:     '#FFFFFF',   // input field background
    // Hero placeholder colors (shown when no photo is available)
    hero:      '#3A5A8C',   // featured card — medium navy
    hero2:     '#C89040',   // secondary card — deep amber
    hero3:     '#2A4070',   // tertiary card — deeper navy
    // Semantic colors
    success:   '#5A8A52',
    warning:   '#C4884A',
    error:     '#B04040',
    // Overlay / scrim
    overlay:   'rgba(44,36,22,0.52)',
    scrim:     'rgba(0,0,0,0.28)'
  };

  var D = {
    _name:     'dark',
    bg:        '#1C1917',
    card:      '#2E2A27',
    primary:   '#4A8AB8',   // lighter navy for dark bg contrast
    secondary: '#F0B84A',   // brighter amber for dark bg
    text:      '#FEFAF6',
    muted:     '#C8BAB2',
    border:    'rgba(255,255,255,0.15)',
    chip:      '#1E2A38',   // dark navy-tinted chip
    chipTx:    '#90AACA',   // light blue chip text
    input:     '#242120',
    hero:      '#1A2A40',   // dark navy
    hero2:     '#3A2C14',   // dark amber/brown
    hero3:     '#152030',   // deeper dark navy
    success:   '#7AB86A',
    warning:   '#D4A870',
    error:     '#D46A5A',
    overlay:   'rgba(0,0,0,0.62)',
    scrim:     'rgba(0,0,0,0.46)'
  };


  /* ══════════════════════════════════════════════════════════
     TYPOGRAPHY
  ══════════════════════════════════════════════════════════ */

  var T = {
    sans:  "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
    sz: {
      xxs:  '9px',   // decorative labels, badges
      xs:   '10px',  // timestamps, metadata
      sm:   '11px',  // chip labels, section labels
      base: '13px',  // body text, list items
      md:   '15px',  // sub-headings, button labels
      lg:   '18px',  // card titles
      xl:   '22px',  // page titles
      xxl:  '26px',  // onboarding headings
      hero: '32px'   // splash / welcome headings
    },
    wt: { reg: 400, med: 500, semi: 600, bold: 700, heavy: 800 }
  };


  /* ══════════════════════════════════════════════════════════
     SPACING  (use these rather than raw px values)
  ══════════════════════════════════════════════════════════ */

  var S = {
    xs:     '4px',
    sm:     '8px',
    md:     '12px',
    lg:     '16px',
    xl:     '22px',    // standard screen-edge padding
    xxl:    '32px',
    section:'14px'     // gap between UI sections
  };


  /* ══════════════════════════════════════════════════════════
     BORDER RADIUS
  ══════════════════════════════════════════════════════════ */

  var R = {
    xs:   '6px',
    sm:   '10px',
    md:   '13px',
    lg:   '16px',
    xl:   '20px',
    pill: '100px',
    full: '50%'
  };


  /* ══════════════════════════════════════════════════════════
     SHADOW HELPER
  ══════════════════════════════════════════════════════════ */

  function shadow(c, size) {
    if (size === 'sm')      return '0 2px 8px rgba(0,0,0,0.08)';
    if (size === 'lg')      return '0 12px 36px rgba(0,0,0,0.14)';
    if (size === 'primary') return '0 8px 20px ' + c.primary + '44';
    return '0 6px 20px rgba(0,0,0,0.10)'; // md (default)
  }


  /* ══════════════════════════════════════════════════════════
     COMPONENT FUNCTIONS
     Every function returns an HTML string.
     Prefix:  c  (short for "components")
  ══════════════════════════════════════════════════════════ */

  var c = {};

  /* ── Structural chrome ──────────────────────────────────── */

  c.notch = function () {
    return '<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);' +
      'width:90px;height:26px;background:#0D0D0D;border-radius:0 0 18px 18px;z-index:30"></div>';
  };

  /** Standard status bar (sits on bg color) */
  c.statusBar = function (theme) {
    var sig = '<svg width="17" height="12" viewBox="0 0 17 12">' +
      '<rect x="0" y="9" width="3" height="3" rx=".5" fill="' + theme.text + '"/>' +
      '<rect x="4.5" y="6" width="3" height="6" rx=".5" fill="' + theme.text + '"/>' +
      '<rect x="9" y="3" width="3" height="9" rx=".5" fill="' + theme.text + '"/>' +
      '<rect x="13.5" y="0" width="3" height="12" rx=".5" fill="' + theme.text + '"/></svg>';
    var bat = '<svg width="24" height="12" viewBox="0 0 24 12">' +
      '<rect x=".6" y="1" width="19.8" height="10" rx="2.5" stroke="' + theme.text + '" stroke-width="1.2" fill="none"/>' +
      '<rect x="20.6" y="3.8" width="2.8" height="4.4" rx="1.2" fill="' + theme.text + '" opacity=".5"/>' +
      '<rect x="2.2" y="2.6" width="16.6" height="6.8" rx="1.5" fill="' + theme.text + '"/></svg>';
    return '<div style="display:flex;justify-content:space-between;align-items:center;' +
      'padding:38px 22px 4px;font-size:12px;font-weight:600;font-family:' + T.sans + ';' +
      'color:' + theme.text + ';position:relative;z-index:5">' +
      '<span>9:41</span><div style="display:flex;align-items:center;gap:6px">' + sig + bat + '</div></div>';
  };

  /** Overlay status bar for screens whose hero image fills the top */
  c.statusBarOverlay = function () {
    return '<div style="position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;' +
      'align-items:center;padding:38px 22px 4px;font-size:12px;font-weight:600;' +
      'font-family:' + T.sans + ';color:white;z-index:20">' +
      '<span>9:41</span><span style="letter-spacing:2px">•••</span></div>';
  };

  /**
   * Bottom navigation bar.
   * @param {object} theme
   * @param {number} activeIdx  0=Home 1=Search 2=Fridge 3=List 4=Me
   * @param {string} goFn  name of global nav function (default: 'otGo')
   */
  c.navBar = function (theme, activeIdx, goFn) {
    var fn = goFn || 'otGo';
    var items = [
      ['Home',   'home',    'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'],
      ['Search', 'search',  'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z'],
      ['Fridge', 'fridge',  'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 7h14'],
      ['List',   'list',    'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4'],
      ['Me',     'profile', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z']
    ];
    var html = '<div style="position:absolute;bottom:0;left:0;right:0;display:flex;' +
      'justify-content:space-around;align-items:center;padding:10px 0 22px;' +
      'border-top:0.5px solid ' + theme.border + ';background:' + theme.bg + ';z-index:10">';
    for (var i = 0; i < items.length; i++) {
      var col = i === activeIdx ? theme.primary : theme.muted;
      html += '<div onclick="' + fn + '(\'' + items[i][1] + '\')" style="display:flex;flex-direction:column;' +
        'align-items:center;gap:3px;font-size:9px;font-family:' + T.sans + ';color:' + col + ';cursor:pointer">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="' + col + '" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + items[i][2] + '"/></svg>' +
        '<span>' + items[i][0] + '</span></div>';
    }
    return html + '</div>';
  };

  /** Back chevron with optional text label */
  c.backBtn = function (theme, label, onClickFn) {
    var fn = onClickFn || 'otBack()';
    return '<div onclick="' + fn + '" style="cursor:pointer;padding:4px;display:inline-flex;align-items:center;gap:4px">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + theme.muted + '" stroke-width="2">' +
      '<path d="M15 18l-6-6 6-6"/></svg>' +
      (label ? '<span style="font-size:13px;color:' + theme.muted + ';font-family:' + T.sans + '">' + label + '</span>' : '') +
      '</div>';
  };

  /** Page header: optional back button, title, optional right-side element */
  c.pageHeader = function (theme, title, rightHtml, showBack, backLabel) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px ' + S.xl + ' 10px">' +
      (showBack ? c.backBtn(theme, backLabel) : '') +
      '<div style="flex:1' + (showBack ? ';margin-left:' + S.sm : '') + ';font-size:' + T.sz.xl + ';' +
      'font-weight:' + T.wt.heavy + ';color:' + theme.text + ';font-family:' + T.sans + '">' + title + '</div>' +
      (rightHtml ? '<div>' + rightHtml + '</div>' : '') +
    '</div>';
  };


  /* ── Buttons ────────────────────────────────────────────── */

  /**
   * Full-width button.
   * @param {string} variant  'primary' | 'secondary' | 'ghost' | 'danger'
   */
  c.btn = function (theme, label, onClickFn, variant, extraStyle) {
    var base = 'width:100%;padding:14px;border-radius:' + R.md + ';font-size:' + T.sz.md + ';' +
      'font-weight:' + T.wt.bold + ';cursor:pointer;font-family:' + T.sans + ';';
    var v = variant || 'primary';
    var styles = {
      primary:   base + 'border:none;background:' + theme.primary + ';color:white;box-shadow:' + shadow(theme, 'primary') + ';',
      secondary: base + 'border:1.5px solid ' + theme.border + ';background:transparent;color:' + theme.text + ';',
      ghost:     base + 'border:1.5px solid ' + theme.secondary + ';background:transparent;color:' + theme.secondary + ';font-size:' + T.sz.base + ';',
      danger:    base + 'border:none;background:' + theme.error + ';color:white;'
    };
    return '<button onclick="' + onClickFn + '" style="' + (styles[v] || styles.primary) + (extraStyle || '') + '">' + label + '</button>';
  };

  /** Small pill button (inline use, not full-width) */
  c.btnSmall = function (theme, label, onClickFn, variant) {
    var isPrimary = variant === 'primary';
    return '<button onclick="' + onClickFn + '" style="padding:6px 14px;border-radius:' + R.pill + ';' +
      'font-size:12px;font-weight:' + T.wt.semi + ';cursor:pointer;font-family:' + T.sans + ';' +
      'border:1.5px solid ' + (isPrimary ? theme.primary : theme.border) + ';' +
      'background:' + (isPrimary ? theme.primary : 'transparent') + ';' +
      'color:' + (isPrimary ? 'white' : theme.text) + '">' + label + '</button>';
  };


  /* ── Form inputs ────────────────────────────────────────── */

  c.inputLabel = function (theme, text) {
    return '<div style="font-size:12px;font-weight:' + T.wt.semi + ';color:' + theme.text + ';margin-bottom:6px">' + text + '</div>';
  };

  c.input = function (theme, id, type, placeholder, value) {
    return '<input type="' + type + '" id="' + id + '" placeholder="' + placeholder + '" value="' + (value || '') + '" ' +
      'style="width:100%;padding:13px 16px;border-radius:' + R.md + ';border:1.5px solid ' + theme.border + ';' +
      'background:' + theme.input + ';font-size:14px;font-family:' + T.sans + ';color:' + theme.text + ';outline:none;display:block">';
  };

  /** Label + input combined */
  c.field = function (theme, id, type, labelText, placeholder, value) {
    return c.inputLabel(theme, labelText) + c.input(theme, id, type, placeholder, value);
  };


  /* ── Pills & chips ──────────────────────────────────────── */

  /** Generic filter chip */
  c.chip = function (theme, label, active, onClickFn) {
    return '<span ' + (onClickFn ? 'onclick="' + onClickFn + '"' : '') + ' style="font-size:' + T.sz.sm + ';' +
      'padding:5px 13px;border-radius:' + R.pill + ';background:' + (active ? theme.primary : theme.chip) + ';' +
      'color:' + (active ? 'white' : theme.chipTx) + ';font-weight:' + (active ? T.wt.semi : T.wt.reg) + ';' +
      'white-space:nowrap;' + (onClickFn ? 'cursor:pointer;' : '') + '">' + label + '</span>';
  };

  /** Dietary preference tag (with checkmark when selected) */
  c.dietTag = function (theme, label, selected, onClickFn) {
    return '<span ' + (onClickFn ? 'onclick="' + onClickFn + '"' : '') + ' style="font-size:11px;' +
      'padding:7px 14px;border-radius:' + R.pill + ';cursor:pointer;' +
      'border:1.5px solid ' + (selected ? theme.primary : theme.border) + ';' +
      'background:' + (selected ? theme.primary : theme.chip) + ';' +
      'color:' + (selected ? 'white' : theme.chipTx) + '">' +
      (selected ? '✓ ' : '') + label + '</span>';
  };

  /** "Saved from TikTok / Instagram" provenance badge */
  c.sourceBadge = function (theme, platform) {
    return '<span style="display:inline-flex;align-items:center;gap:3px;font-size:9px;' +
      'padding:3px 9px;border-radius:' + R.pill + ';background:' + theme.chip + ';' +
      'color:' + theme.secondary + ';font-weight:' + T.wt.semi + ';border:0.5px solid ' + theme.border + '">' +
      '<svg width="7" height="7" viewBox="0 0 24 24" fill="' + theme.secondary + '"><path d="M5 3l14 9-14 9V3z"/></svg>' +
      (platform || 'Social') + '</span>';
  };

  /** Row of metadata chips (time, servings, difficulty) */
  c.metaRow = function (theme, items) {
    return '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      items.map(function (item) {
        return '<span style="font-size:' + T.sz.xs + ';padding:4px 10px;border-radius:' + R.pill + ';' +
          'background:' + theme.chip + ';color:' + theme.chipTx + '">' + item + '</span>';
      }).join('') + '</div>';
  };


  /* ── Recipe cards ───────────────────────────────────────── */

  /**
   * Large featured recipe card (hero image + info strip).
   * recipe: { title, image?, heroColor?, time?, rating?, difficulty?, source? }
   */
  c.recipeCardLarge = function (theme, recipe, onClickFn) {
    var bg = recipe.image ?
      'background:url(\'' + recipe.image + '\') center/cover no-repeat' :
      'background:' + (recipe.heroColor || theme.hero);
    var click = onClickFn ? 'onclick="' + onClickFn + '"' : '';
    return '<div ' + click + ' style="border-radius:' + R.lg + ';overflow:hidden;border:0.5px solid ' + theme.border + ';' +
      (onClickFn ? 'cursor:pointer;' : '') + 'box-shadow:' + shadow(theme, 'md') + '">' +
      '<div style="height:120px;' + bg + ';position:relative;display:flex;align-items:center;justify-content:center">' +
        (!recipe.image ? '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>' : '') +
        '<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.4) 0%,transparent 55%)"></div>' +
        '<div style="position:absolute;bottom:9px;left:11px"><span style="background:rgba(0,0,0,0.45);border-radius:6px;padding:2px 8px;font-size:8px;color:white;font-weight:700;letter-spacing:0.06em">FEATURED</span></div>' +
        (recipe.source ? '<div style="position:absolute;bottom:9px;right:11px"><span style="background:rgba(0,0,0,0.4);border-radius:6px;padding:2px 8px;font-size:8px;color:white">from ' + recipe.source + '</span></div>' : '') +
      '</div>' +
      '<div style="padding:10px 14px;background:' + theme.card + '">' +
        '<div style="font-size:' + T.sz.lg + ';font-weight:' + T.wt.bold + ';color:' + theme.text + ';margin-bottom:4px">' + recipe.title + '</div>' +
        '<div style="display:flex;gap:7px;align-items:center">' +
          (recipe.time     ? '<span style="font-size:' + T.sz.xs + ';color:' + theme.muted + '">⏱ ' + recipe.time + '</span>' : '') +
          (recipe.rating   ? '<span style="font-size:' + T.sz.xs + ';color:' + theme.primary + ';font-weight:' + T.wt.bold + '">★ ' + recipe.rating + '</span>' : '') +
          (recipe.difficulty ? '<span style="font-size:' + T.sz.xs + ';color:' + theme.secondary + ';font-weight:' + T.wt.semi + '">' + recipe.difficulty + '</span>' : '') +
        '</div>' +
      '</div></div>';
  };

  /**
   * Small recipe card (for 2-column rows).
   * recipe: { title, image?, heroColor?, time? }
   */
  c.recipeCardSmall = function (theme, recipe, onClickFn) {
    var bg = recipe.image ?
      'background:url(\'' + recipe.image + '\') center/cover no-repeat' :
      'background:' + (recipe.heroColor || theme.hero2);
    var click = onClickFn ? 'onclick="' + onClickFn + '"' : '';
    return '<div ' + click + ' style="flex:1;border-radius:' + R.md + ';overflow:hidden;' +
      'border:0.5px solid ' + theme.border + ';' + (onClickFn ? 'cursor:pointer;' : '') + '">' +
      '<div style="height:64px;' + bg + ';display:flex;align-items:center;justify-content:center">' +
        (!recipe.image ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg>' : '') +
      '</div>' +
      '<div style="padding:6px 10px;background:' + theme.card + '">' +
        '<div style="font-size:' + T.sz.xs + ';font-weight:' + T.wt.bold + ';color:' + theme.text + ';line-height:1.3">' + recipe.title + '</div>' +
        (recipe.time ? '<div style="font-size:9px;color:' + theme.muted + '">' + recipe.time + '</div>' : '') +
      '</div></div>';
  };


  /* ── List items ─────────────────────────────────────────── */

  /**
   * Grocery / ingredient list row.
   * item: { label, qty? }
   */
  c.listItem = function (theme, item, checked, onClickFn) {
    var click = onClickFn ? 'onclick="' + onClickFn + '"' : '';
    if (checked) {
      return '<div ' + click + ' style="display:flex;align-items:center;gap:12px;padding:10px 14px;' +
        'margin-bottom:6px;border-radius:' + R.md + ';background:' + theme.chip + ';' + (onClickFn ? 'cursor:pointer;' : '') + '">' +
        '<div style="width:22px;height:22px;border-radius:50%;background:' + theme.secondary + ';flex-shrink:0;display:flex;align-items:center;justify-content:center">' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"><path d="M20 6L9 17l-5-5"/></svg>' +
        '</div>' +
        '<span style="font-size:' + T.sz.base + ';color:' + theme.muted + ';flex:1;text-decoration:line-through">' + item.label + '</span>' +
        (item.qty ? '<span style="font-size:12px;color:' + theme.muted + ';text-decoration:line-through">' + item.qty + '</span>' : '') +
        '</div>';
    }
    return '<div ' + click + ' style="display:flex;align-items:center;gap:12px;padding:10px 14px;' +
      'margin-bottom:6px;border-radius:' + R.md + ';background:' + theme.card + ';' +
      'border:0.5px solid ' + theme.border + ';' + (onClickFn ? 'cursor:pointer;' : '') + '">' +
      '<div style="width:22px;height:22px;border-radius:50%;border:2px solid ' + theme.border + ';flex-shrink:0"></div>' +
      '<span style="font-size:' + T.sz.base + ';color:' + theme.text + ';flex:1">' + item.label + '</span>' +
      (item.qty ? '<span style="font-size:12px;color:' + theme.muted + '">' + item.qty + '</span>' : '') +
      '</div>';
  };

  /** Settings row (icon, label, optional value, chevron) */
  c.settingsRow = function (theme, icon, label, value, onClickFn) {
    var click = onClickFn ? 'onclick="' + onClickFn + '"' : '';
    return '<div ' + click + ' style="display:flex;align-items:center;gap:13px;padding:13px 16px;' +
      'border-bottom:0.5px solid ' + theme.border + ';' + (onClickFn ? 'cursor:pointer;' : '') + '">' +
      '<div style="width:32px;height:32px;border-radius:' + R.xs + ';background:' + theme.chip + ';' +
        'display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">' + icon + '</div>' +
      '<span style="flex:1;font-size:14px;color:' + theme.text + ';font-family:' + T.sans + '">' + label + '</span>' +
      (value ? '<span style="font-size:' + T.sz.base + ';color:' + theme.muted + '">' + value + '</span>' : '') +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + theme.muted + '" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' +
      '</div>';
  };


  /* ── Structural helpers ─────────────────────────────────── */

  /** Horizontal divider, optional centred text label */
  c.divider = function (theme, label) {
    if (!label) return '<div style="height:0.5px;background:' + theme.border + ';margin:' + S.md + ' 0"></div>';
    return '<div style="display:flex;align-items:center;gap:10px;margin:' + S.lg + ' 0">' +
      '<div style="flex:1;height:0.5px;background:' + theme.border + '"></div>' +
      '<span style="font-size:11px;color:' + theme.muted + '">' + label + '</span>' +
      '<div style="flex:1;height:0.5px;background:' + theme.border + '"></div></div>';
  };

  /** Progress bar (e.g. grocery list completion) */
  c.progressBar = function (theme, value, max, color) {
    var pct = Math.round((value / (max || 1)) * 100);
    return '<div style="height:6px;border-radius:' + R.pill + ';background:' + theme.chip + '">' +
      '<div style="height:100%;border-radius:' + R.pill + ';background:' + (color || theme.secondary) + ';width:' + pct + '%"></div></div>';
  };

  /** Avatar (initials fallback or image) */
  c.avatar = function (theme, initials, imageUrl, size) {
    var sz = size || '38px';
    var inner = imageUrl ?
      '<img src="' + imageUrl + '" style="width:100%;height:100%;object-fit:cover">' :
      '<span style="font-size:' + Math.round(parseInt(sz) / 2.5) + 'px;font-weight:' + T.wt.heavy + ';color:white;font-family:' + T.sans + '">' + initials + '</span>';
    return '<div style="width:' + sz + ';height:' + sz + ';border-radius:50%;background:' + theme.primary + ';' +
      'display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">' + inner + '</div>';
  };

  /** Onboarding step-progress dots */
  c.stepDots = function (theme, current, total) {
    var html = '<div style="display:flex;gap:6px;align-items:center">';
    for (var i = 0; i < total; i++) {
      html += '<div style="width:' + (i === current ? '20px' : '7px') + ';height:7px;' +
        'border-radius:' + R.pill + ';background:' + (i === current ? theme.primary : theme.chip) + '"></div>';
    }
    return html + '</div>';
  };

  /** Toast notification (auto-animates out via CSS) */
  c.toast = function (theme, message) {
    if (!message) return '';
    return '<div style="position:absolute;bottom:88px;left:50%;transform:translateX(-50%);white-space:nowrap;' +
      'background:' + theme.primary + ';color:white;font-size:12px;font-weight:' + T.wt.bold + ';' +
      'padding:8px 18px;border-radius:' + R.pill + ';animation:toastAnim 2s ease forwards;' +
      'z-index:50;pointer-events:none;font-family:' + T.sans + '">' + message + '</div>';
  };

  /** Empty state (icon + title + optional subtitle) */
  c.emptyState = function (theme, icon, title, subtitle) {
    return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'padding:40px 32px;text-align:center">' +
      '<div style="font-size:48px;margin-bottom:14px">' + (icon || '🍽️') + '</div>' +
      '<div style="font-size:' + T.sz.lg + ';font-weight:' + T.wt.bold + ';color:' + theme.text + ';margin-bottom:6px">' + title + '</div>' +
      (subtitle ? '<div style="font-size:' + T.sz.base + ';color:' + theme.muted + ';line-height:1.6">' + subtitle + '</div>' : '') +
    '</div>';
  };

  /** Dietary conflict warning banner */
  c.conflictWarning = function (theme, member, ingredient, suggestion, onAcceptFn) {
    var isDark = theme._name === 'dark';
    return '<div style="background:' + (isDark ? '#3A1A1A' : '#FEF2F2') + ';' +
      'border:1px solid ' + (isDark ? '#7A2A2A' : '#FECACA') + ';' +
      'border-radius:' + R.md + ';padding:12px 14px;margin-bottom:10px">' +
      '<div style="display:flex;align-items:flex-start;gap:10px">' +
        '<span style="font-size:18px;flex-shrink:0">⚠️</span>' +
        '<div style="flex:1">' +
          '<div style="font-size:12px;font-weight:' + T.wt.bold + ';color:' + theme.error + ';margin-bottom:4px">' +
            ingredient + ' conflicts with ' + member + '\'s dietary needs</div>' +
          (suggestion ? '<div style="font-size:11px;color:' + theme.muted + ';margin-bottom:8px">Swap: <strong style="color:' + theme.text + '">' + suggestion + '</strong></div>' : '') +
          (onAcceptFn ? c.btnSmall(theme, 'Accept swap', onAcceptFn, 'primary') : '') +
        '</div>' +
      '</div></div>';
  };

  /** Cooking step card (used in step-by-step cooking mode) */
  c.cookingStepCard = function (theme, step) {
    return '<div style="border-radius:' + R.xl + ';background:' + theme.card + ';border:0.5px solid ' + theme.border + ';' +
      'padding:24px;box-shadow:' + shadow(theme, 'md') + '">' +
      '<div style="font-size:42px;text-align:center;margin-bottom:14px">' + (step.icon || '🍳') + '</div>' +
      '<div style="text-align:center;margin-bottom:8px">' +
        '<span style="background:' + theme.primary + ';color:white;border-radius:' + R.xs + ';' +
          'padding:4px 10px;font-size:10px;font-weight:' + T.wt.heavy + ';letter-spacing:0.05em">STEP ' + step.number + '</span>' +
      '</div>' +
      '<div style="font-size:' + T.sz.lg + ';font-weight:' + T.wt.heavy + ';color:' + theme.text + ';text-align:center;' +
        'margin-bottom:12px;font-family:' + T.serif + ';line-height:1.2">' + step.title + '</div>' +
      '<div style="font-size:' + T.sz.base + ';color:' + theme.muted + ';line-height:1.7;text-align:center;margin-bottom:16px">' + step.body + '</div>' +
      (step.time ? '<div style="display:flex;justify-content:center">' +
        '<div style="display:inline-flex;align-items:center;gap:6px;background:' + theme.chip + ';border-radius:' + R.pill + ';padding:6px 16px">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="' + theme.primary + '" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' +
          '<span style="font-size:12px;font-weight:' + T.wt.semi + ';color:' + theme.primary + '">' + step.time + '</span>' +
        '</div></div>' : '') +
    '</div>';
  };

  /** Bottom sheet panel (overlays from bottom, use inside a scrim) */
  c.bottomSheet = function (theme, title, content) {
    return '<div style="width:100%;background:' + theme.card + ';border-radius:' + R.xl + ' ' + R.xl + ' 0 0;padding:20px 22px 40px">' +
      '<div style="width:40px;height:4px;border-radius:' + R.pill + ';background:' + theme.border + ';margin:0 auto 16px"></div>' +
      (title ? '<div style="font-size:17px;font-weight:' + T.wt.bold + ';color:' + theme.text + ';margin-bottom:16px;font-family:' + T.serif + '">' + title + '</div>' : '') +
      content + '</div>';
  };


  /* ══════════════════════════════════════════════════════════
     NAVIGATION SYSTEM
     OT.nav(screenMap, startScreenId, containerId, options)

     screenMap:  { screenId: function(theme, state){return html} }
     startId:    first screen to show
     containerId: id of the div that receives screen HTML
     options: {
       mainScreens: ['home','search',...],  // get fade-up anim
       onRender: function(state, theme){},  // called after each render
       state: { ...extra initial state }    // merged into nav state
     }

     Exposes globals: otGo(screenId), otBack(), otToggleTheme(),
                      otState, otRender(), otTheme()
  ══════════════════════════════════════════════════════════ */

  function nav(screenMap, startId, containerId, options) {
    var opts  = options || {};
    var elId  = containerId || 'phone-screen';
    var state = { cur: startId || Object.keys(screenMap)[0], hist: [], dark: false };
    if (opts.state) {
      for (var k in opts.state) state[k] = opts.state[k];
    }

    function theme() { return state.dark ? D : L; }

    function render(anim) {
      var el = document.getElementById(elId);
      if (!el) return;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      if (anim) wrap.className = anim;
      var fn = screenMap[state.cur];
      wrap.innerHTML = fn ? fn(theme(), state) : '<div style="padding:40px;color:red">Screen not found: ' + state.cur + '</div>';
      el.innerHTML = '';
      el.appendChild(wrap);
      el.style.background = theme().bg;
      if (opts.onRender) opts.onRender(state, theme());
    }

    function go(screenId, back) {
      if (screenId === state.cur) return;
      if (!back) state.hist.push(state.cur);
      state.cur = screenId;
      var mains = opts.mainScreens || [];
      var anim  = back ? 'anim-back' : (mains.indexOf(screenId) >= 0 ? 'anim-up' : 'anim-forward');
      render(anim);
    }

    window.otGo          = go;
    window.otBack        = function () { if (state.hist.length) { state.cur = state.hist.pop(); render('anim-back'); } };
    window.otToggleTheme = function () { state.dark = !state.dark; render(); };
    window.otState       = state;
    window.otRender      = render;
    window.otTheme       = theme;

    injectAnimations();
    render('anim-up');
    return { go: go, state: state, theme: theme, render: render };
  }


  /* ══════════════════════════════════════════════════════════
     CSS ANIMATIONS  (injected once per page)
  ══════════════════════════════════════════════════════════ */

  function injectAnimations() {
    if (document.getElementById('ot-anim')) return;
    var s = document.createElement('style');
    s.id = 'ot-anim';
    s.textContent =
      '@keyframes slideFromRight{from{transform:translateX(100%);opacity:.6}to{transform:translateX(0);opacity:1}}' +
      '@keyframes slideFromLeft{from{transform:translateX(-100%);opacity:.6}to{transform:translateX(0);opacity:1}}' +
      '@keyframes fadeScaleUp{from{opacity:0;transform:scale(.97) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}' +
      '@keyframes scanLine{0%{top:0}100%{top:calc(100% - 3px)}}' +
      '@keyframes toastAnim{0%{opacity:0;transform:translateX(-50%) translateY(12px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}78%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-5px)}}' +
      '.anim-forward{animation:slideFromRight .3s cubic-bezier(.25,.46,.45,.94)}' +
      '.anim-back{animation:slideFromLeft .3s cubic-bezier(.25,.46,.45,.94)}' +
      '.anim-up{animation:fadeScaleUp .35s cubic-bezier(.16,1,.3,1)}';
    document.head.appendChild(s);
  }


  /* ══════════════════════════════════════════════════════════
     EXPORT
  ══════════════════════════════════════════════════════════ */

  global.OT = {
    L: L,          // light theme
    D: D,          // dark theme
    T: T,          // typography
    S: S,          // spacing
    R: R,          // border radius
    shadow: shadow,
    c: c,          // all component functions
    nav: nav,      // navigation system factory
    injectAnimations: injectAnimations
  };

})(window);
