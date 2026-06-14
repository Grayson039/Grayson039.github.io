// Kitchen Bandits — Figma Plugin v2
// Creates all 11 screens: 5 illustrated onboarding slides + Auth + Home + Search + Library
// IMPORTANT: manifest.json must include:
//   "networkAccess": { "allowedDomains": ["https://raw.githubusercontent.com"] }

(async function () {
try {

// ─── PALETTE ──────────────────────────────────────────────────────────────────
var P = {
  bg:       '#F5F1EB',
  card:     '#FFFFFF',
  primary:  '#6B4FA8',
  secondary:'#C3B1E1',
  text:     '#1E1A2E',
  muted:    '#9A8A78',
  border:   '#E2DCF0',
  chip:     '#EDE7F6',
  chipTx:   '#7A6090',
  accent:   '#F6C45C',
  dbg:      '#1E1525',
  dcard:    '#2A1F33',
  dprimary: '#A685D4',
  dsec:     '#C3B1E1',
  dtext:    '#F0ECFA',
  dmuted:   '#A090B0',
  dborder:  '#3A2E48',
  dchip:    '#2E2040',
  dchipTx:  '#C3B1E1',
  white:    '#FFFFFF',
  black:    '#000000'
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function rgb(h) {
  h = h.replace('#','');
  return { r: parseInt(h.slice(0,2),16)/255, g: parseInt(h.slice(2,4),16)/255, b: parseInt(h.slice(4,6),16)/255 };
}
function solid(hex, a) {
  return [{ type:'SOLID', color: rgb(hex), opacity: a === undefined ? 1 : a }];
}
function rgbA(hex, a) {
  var c = rgb(hex);
  return {r:c.r, g:c.g, b:c.b, a: a === undefined ? 1 : a};
}
function topToBottomGrad(h1, h2) {
  return [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[0, 1, 0], [-1, 0, 1]],
    gradientStops: [
      {position:0, color:rgbA(h1)},
      {position:1, color:rgbA(h2)}
    ]
  }];
}
function diagonalGrad(h1, h2) {
  return [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[0, 1, 0], [-1, 0, 1]],
    gradientStops: [
      {position:0, color:rgbA(h1)},
      {position:1, color:rgbA(h2)}
    ]
  }];
}
function dropShadow(yOff, blur, alpha) {
  return [{
    type:'DROP_SHADOW', visible:true, blendMode:'NORMAL',
    color:{r:0,g:0,b:0,a:alpha||0.15},
    offset:{x:0,y:yOff||4}, radius:blur||12, spread:0
  }];
}

function addRect(par, x, y, w, h, hex, radius, alpha) {
  var n = figma.createRectangle();
  par.appendChild(n);
  n.x=x; n.y=y; n.resize(w,h);
  n.fills = solid(hex, alpha);
  if (radius) n.cornerRadius = radius;
  return n;
}
function addEllipse(par, x, y, w, h, hex, alpha) {
  var n = figma.createEllipse();
  par.appendChild(n);
  n.x=x; n.y=y; n.resize(w,h);
  n.fills = solid(hex, alpha);
  return n;
}
function addText(par, str, x, y, sz, style, hex, opts) {
  var t = figma.createText();
  par.appendChild(t);
  t.fontName = {family:'Inter', style:style||'Regular'};
  t.fontSize = sz || 14;
  // Layout props BEFORE characters to avoid hang
  if (opts && opts.w)     { t.textAutoResize = 'HEIGHT'; t.resize(opts.w, 40); }
  if (opts && opts.align) t.textAlignHorizontal = opts.align;
  if (opts && opts.lh)    t.lineHeight = {value: opts.lh, unit:'PIXELS'};
  if (opts && opts.ls)    t.letterSpacing = {value: opts.ls, unit:'PERCENT'};
  t.fills = solid(hex || P.text);
  t.characters = str;
  t.x = x; t.y = y;
  return t;
}
function mkFrame(name, x, w, h) {
  var f = figma.createFrame();
  figma.currentPage.appendChild(f);
  f.name = name; f.resize(w||390, h||844);
  f.x = x||0; f.y = 0; f.clipsContent = true;
  return f;
}

function addButton(par, label, x, y, w, bgHex, txHex, outlined) {
  var g = figma.createFrame();
  par.appendChild(g);
  g.name = label; g.resize(w, 50); g.x = x; g.y = y;
  g.cornerRadius = 14; g.clipsContent = false;
  if (outlined) {
    g.fills = solid('#FFFFFF', 0);
    g.strokes = solid(bgHex); g.strokeWeight = 1.5; g.strokeAlign = 'INSIDE';
  } else {
    g.fills = solid(bgHex);
    g.effects = dropShadow(6, 18, 0.28);
  }
  var t = figma.createText(); g.appendChild(t);
  t.fontName = {family:'Inter', style:'Bold'};
  t.fontSize = 15;
  t.textAlignHorizontal = 'CENTER';
  t.textAutoResize = 'HEIGHT'; t.resize(w-32, 40);
  t.fills = solid(txHex || P.white);
  t.characters = label;
  t.x = 16; t.y = 17;
  return g;
}

function addInput(par, labelTxt, placeholder, x, y, w) {
  var g = figma.createFrame();
  par.appendChild(g);
  g.name = 'field-'+labelTxt; g.resize(w, 56); g.x = x; g.y = y;
  g.cornerRadius = 12; g.clipsContent = false;
  g.fills = solid('#F0EBF6');
  g.strokes = solid('#D8CEF0'); g.strokeWeight = 1.5; g.strokeAlign = 'INSIDE';
  var lbl = figma.createText(); g.appendChild(lbl);
  lbl.fontName = {family:'Inter', style:'Semi Bold'};
  lbl.fontSize = 10;
  lbl.letterSpacing = {value:4, unit:'PERCENT'};
  lbl.fills = solid('#9A8AB0');
  lbl.characters = labelTxt.toUpperCase();
  lbl.x = 14; lbl.y = 10;
  var ph = figma.createText(); g.appendChild(ph);
  ph.fontName = {family:'Inter', style:'Regular'};
  ph.fontSize = 13;
  ph.fills = solid('#BEB8D0');
  ph.characters = placeholder;
  ph.x = 14; ph.y = 30;
  return g;
}

function addStatusBar(par, dark) {
  var bar = figma.createFrame(); par.appendChild(bar);
  bar.name = 'Status Bar'; bar.resize(390, 44); bar.x = 0; bar.y = 0;
  bar.fills = []; bar.clipsContent = false;
  var col = dark ? P.dtext : P.text;
  var t1 = figma.createText(); bar.appendChild(t1);
  t1.fontName = {family:'Inter', style:'Bold'}; t1.fontSize = 15;
  t1.fills = solid(col);
  t1.characters = '9:41';
  t1.x = 28; t1.y = 14;
  var t2 = figma.createText(); bar.appendChild(t2);
  t2.fontName = {family:'Inter', style:'Medium'}; t2.fontSize = 11;
  t2.textAlignHorizontal = 'RIGHT'; t2.textAutoResize = 'HEIGHT';
  t2.resize(120, 10);
  t2.fills = solid(col, 0.65);
  t2.characters = 'LTE  100%';
  t2.x = 242; t2.y = 15;
}

function addAppIcon(par, x, y, sz, imgHash) {
  sz = sz || 56;
  var g = figma.createFrame(); par.appendChild(g);
  g.name = 'App Icon'; g.resize(sz, sz); g.x = x; g.y = y;
  g.cornerRadius = Math.round(sz * 0.22);
  g.fills = solid(P.primary);
  g.effects = dropShadow(4, 14, 0.25);
  if (imgHash) {
    var pad = Math.round(sz * 0.12);
    var icon = figma.createRectangle(); g.appendChild(icon);
    icon.resize(sz - pad*2, sz - pad*2);
    icon.x = pad; icon.y = pad;
    icon.fills = [{ type:'IMAGE', scaleMode:'FIT', imageHash: imgHash }];
  } else {
    var t = figma.createText(); g.appendChild(t);
    t.fontName = {family:'Inter', style:'Extra Bold'};
    t.fontSize = Math.round(sz * 0.3);
    t.textAlignHorizontal = 'CENTER'; t.textAutoResize = 'HEIGHT';
    t.resize(sz - 8, 10);
    t.fills = solid(P.white);
    t.characters = 'KB';
    t.x = 4; t.y = Math.round(sz*0.34);
  }
  return g;
}

// addWhisker: uses real image hash when available, falls back to styled circle
function addWhisker(par, x, y, sz, label, imgHash) {
  sz = sz || 100;
  if (imgHash) {
    var img = figma.createRectangle(); par.appendChild(img);
    img.name = 'Whisker'; img.resize(sz, sz); img.x = x; img.y = y;
    img.fills = [{ type:'IMAGE', scaleMode:'FIT', imageHash: imgHash }];
    return img;
  }
  var g = figma.createFrame(); par.appendChild(g);
  g.name = 'Whisker'; g.resize(sz, sz); g.x = x; g.y = y;
  g.cornerRadius = sz / 2;
  g.fills = [{
    type:'GRADIENT_LINEAR',
    gradientTransform:[[0,1,0],[-1,0,1]],
    gradientStops:[
      {position:0, color:rgbA('#C3B1E1', 0.35)},
      {position:1, color:rgbA('#8060B0', 0.25)}
    ]
  }];
  g.strokes = solid(P.secondary, 0.4); g.strokeWeight = 2;
  var t = figma.createText(); g.appendChild(t);
  t.fontName = {family:'Inter', style:'Semi Bold'};
  t.fontSize = 11;
  t.textAlignHorizontal = 'CENTER'; t.textAutoResize = 'HEIGHT';
  t.resize(sz - 16, 10);
  t.fills = solid(P.primary, 0.75);
  t.characters = label || 'Whisker';
  t.x = 8; t.y = Math.round(sz/2 - 8);
  return g;
}

function addNavBar(par, activeIdx, dark) {
  var bg     = dark ? P.dcard : P.card;
  var active = dark ? P.dprimary : P.primary;
  var inact  = dark ? P.dmuted : '#B0A8C0';
  var bdr    = dark ? P.dborder : P.border;
  var W = 390, H = 83;
  var bar = figma.createFrame(); par.appendChild(bar);
  bar.name = 'Nav Bar'; bar.resize(W, H); bar.x = 0; bar.y = 844 - H;
  bar.fills = solid(bg); bar.clipsContent = false;
  addRect(bar, 0, 0, W, 1, bdr);
  var ind = figma.createRectangle(); bar.appendChild(ind);
  ind.resize(24, 3); ind.cornerRadius = 2;
  ind.fills = solid(active);
  ind.x = Math.round(W/4 * activeIdx + W/8 - 12); ind.y = 0;
  var tabs = ['Home', 'Search', 'Library', 'Profile'];
  var icons = ['H', 'S', 'L', 'P'];
  tabs.forEach(function(label, i) {
    var col = i === activeIdx ? active : inact;
    var cx = Math.round(W/4 * i + W/8);
    var ic = figma.createEllipse(); bar.appendChild(ic);
    ic.resize(22, 22); ic.x = cx - 11; ic.y = 10;
    ic.fills = solid(i === activeIdx ? active : bdr, i === activeIdx ? 0.15 : 0.5);
    var iconTxt = figma.createText(); bar.appendChild(iconTxt);
    iconTxt.fontName = {family:'Inter', style:'Bold'};
    iconTxt.fontSize = 9;
    iconTxt.textAlignHorizontal = 'CENTER'; iconTxt.textAutoResize = 'HEIGHT';
    iconTxt.resize(22, 10);
    iconTxt.fills = solid(col);
    iconTxt.characters = icons[i];
    iconTxt.x = cx - 11; iconTxt.y = 15;
    var lbl = figma.createText(); bar.appendChild(lbl);
    lbl.fontName = {family:'Inter', style: i === activeIdx ? 'Semi Bold' : 'Regular'};
    lbl.fontSize = 10;
    lbl.textAlignHorizontal = 'CENTER'; lbl.textAutoResize = 'HEIGHT';
    lbl.resize(60, 10);
    lbl.fills = solid(col);
    lbl.characters = label;
    lbl.x = cx - 30; lbl.y = 36;
  });
}

function addRecipeCard(par, x, y, w, h, title, time, color, tag, rating) {
  var card = figma.createRectangle(); par.appendChild(card);
  card.resize(w, h); card.x = x; card.y = y;
  card.cornerRadius = 14; card.fills = solid(color);
  card.effects = dropShadow(3, 12, 0.18);
  var scrim = figma.createRectangle(); par.appendChild(scrim);
  scrim.resize(w, Math.round(h * 0.45));
  scrim.x = x; scrim.y = y + h - Math.round(h * 0.45);
  scrim.cornerRadius = 14;
  scrim.fills = [{
    type:'GRADIENT_LINEAR',
    gradientTransform:[[0,1,0],[-1,0,1]],
    gradientStops:[
      {position:0, color:{r:0,g:0,b:0,a:0}},
      {position:1, color:{r:0,g:0,b:0,a:0.55}}
    ]
  }];
  var timeBg = figma.createFrame(); par.appendChild(timeBg);
  var tw = time.length * 6 + 16;
  timeBg.resize(tw, 20); timeBg.x = x+8; timeBg.y = y + h - 28;
  timeBg.cornerRadius = 100; timeBg.fills = solid('#000000', 0.45);
  var tt = figma.createText(); timeBg.appendChild(tt);
  tt.fontName = {family:'Inter', style:'Regular'}; tt.fontSize = 9;
  tt.characters = time; tt.fills = solid(P.white);
  tt.x = 8; tt.y = 5;
  if (rating) {
    var ratBg = figma.createFrame(); par.appendChild(ratBg);
    ratBg.resize(36, 20); ratBg.x = x + w - 44; ratBg.y = y + h - 28;
    ratBg.cornerRadius = 100; ratBg.fills = solid('#000000', 0.45);
    var rt = figma.createText(); ratBg.appendChild(rt);
    rt.fontName = {family:'Inter', style:'Bold'}; rt.fontSize = 9;
    rt.characters = rating; rt.fills = solid(P.accent);
    rt.x = 6; rt.y = 5;
  }
  if (tag) {
    var tagBg = figma.createFrame(); par.appendChild(tagBg);
    var tgw = tag.length * 6.5 + 16;
    tagBg.resize(tgw, 20); tagBg.x = x+8; tagBg.y = y+8;
    tagBg.cornerRadius = 100; tagBg.fills = solid('#000000', 0.5);
    var tgt = figma.createText(); tagBg.appendChild(tgt);
    tgt.fontName = {family:'Inter', style:'Bold'}; tgt.fontSize = 9;
    tgt.characters = tag; tgt.fills = solid(P.white);
    tgt.x = 8; tgt.y = 5;
  }
  var titleTxt = figma.createText(); par.appendChild(titleTxt);
  titleTxt.fontName = {family:'Inter', style:'Semi Bold'};
  titleTxt.fontSize = 11;
  titleTxt.textAutoResize = 'HEIGHT'; titleTxt.resize(w, 10);
  titleTxt.fills = solid(P.text);
  titleTxt.characters = title;
  titleTxt.x = x; titleTxt.y = y + h + 6;
}

function addSectionHeader(par, title, x, y, w, dark) {
  var col = dark ? P.dsec : P.secondary;
  addText(par, title, x, y, 15, 'Bold', col, {w: w});
}

function addDivider(par, y, dark) {
  addRect(par, 28, y, 136, 1, dark ? P.dborder : P.border);
  addText(par, 'or', 28+140, y-8, 12, 'Regular', dark ? P.dmuted : P.muted, {w:50, align:'CENTER'});
  addRect(par, 28+198, y, 136, 1, dark ? P.dborder : P.border);
}

function addFilterChips(par, chips, activeIdx, x, y, dark) {
  var cx = x;
  chips.forEach(function(chip, i) {
    var isActive = i === activeIdx;
    var bg = isActive ? (dark ? P.dprimary : P.primary) : (dark ? P.dchip : P.chip);
    var tx = isActive ? P.white : (dark ? P.dchipTx : P.chipTx);
    var bdr = dark ? P.dborder : P.border;
    var g = figma.createFrame(); par.appendChild(g);
    var cw = chip.length * 7 + 28;
    g.resize(cw, 30); g.x = cx; g.y = y;
    g.cornerRadius = 100; g.fills = solid(bg);
    if (!isActive) { g.strokes = solid(bdr); g.strokeWeight = 1; g.strokeAlign = 'INSIDE'; }
    var t = figma.createText(); g.appendChild(t);
    t.fontName = {family:'Inter', style: isActive ? 'Semi Bold' : 'Regular'};
    t.fontSize = 11; t.characters = chip;
    t.fills = solid(tx); t.x = 14; t.y = 8;
    cx += cw + 8;
  });
}

// ─── LOAD FONTS ───────────────────────────────────────────────────────────────
figma.notify('Loading fonts…');
var fontStyles = ['Regular', 'Medium', 'Semi Bold', 'Bold', 'Extra Bold'];
for (var fi = 0; fi < fontStyles.length; fi++) {
  try {
    await figma.loadFontAsync({family: 'Inter', style: fontStyles[fi]});
  } catch (fontErr) {
    figma.closePlugin('Font load failed — Inter ' + fontStyles[fi] + ': ' + fontErr.toString());
    return;
  }
}

// ─── LOAD ILLUSTRATIONS FROM GITHUB ──────────────────────────────────────────
figma.notify('Fetching illustrations from GitHub…');
var BASE = 'https://raw.githubusercontent.com/grayson039/grayson039.github.io/claude/ladle-design-tokens/ourtable/';
var IMG_NAMES = ['ob-1.png','ob-2.png','ob-3.png','ob-4.png','ob-5.png','whisker-welcome.png','whisker-confident.png','kb-icon.png'];
var IMGS = {};
for (var ii = 0; ii < IMG_NAMES.length; ii++) {
  try {
    IMGS[IMG_NAMES[ii]] = await figma.createImageAsync(BASE + IMG_NAMES[ii]);
    figma.notify('Loaded ' + IMG_NAMES[ii] + ' (' + (ii+1) + '/' + IMG_NAMES.length + ')');
  } catch (imgErr) {
    IMGS[IMG_NAMES[ii]] = null;
    figma.notify('Warning: skipped ' + IMG_NAMES[ii] + ' — using placeholder', {timeout: 4000});
  }
}

// ─── CLEAN UP OLD FRAMES ──────────────────────────────────────────────────────
figma.notify('Cleaning up old frames…');
var REPLACE = [
  // Old slide names (in case they exist from prior session)
  'Slide 1','Slide 2','Slide 3','Slide 4','Slide 5',
  // New names we'll create
  'Onboarding — Slide 1','Onboarding — Slide 2','Onboarding — Slide 3',
  'Onboarding — Slide 4','Onboarding — Slide 5',
  // Auth / home screens
  'Auth — Welcome','Auth — Sign In','Onboarding — Complete',
  'Home — Dark','Search','Library'
];
figma.currentPage.children.slice().forEach(function(n) {
  if (REPLACE.indexOf(n.name) >= 0) n.remove();
});

// ─── FIND RIGHT EDGE ──────────────────────────────────────────────────────────
var maxRight = 0;
figma.currentPage.children.forEach(function(n) {
  if (n.x + n.width > maxRight) maxRight = n.x + n.width;
});
var sx = maxRight > 0 ? maxRight + 60 : 0;
var GAP = 60, W = 390, H = 844;

// ─── SLIDE CONTENT ────────────────────────────────────────────────────────────
var SLIDES = [
  {
    title: 'Welcome to\nKitchen Bandits',
    sub:   'Outsmart picky eaters.\nFeed your whole crew.',
    cta:   'Get Started',
    img:   'ob-1.png'
  },
  {
    title: 'Save Recipes\nfrom Anywhere',
    sub:   'TikTok, Reels, websites — grab any\nrecipe in one tap.',
    cta:   'Next',
    img:   'ob-2.png'
  },
  {
    title: "What's in\nthe Fridge?",
    sub:   "Scan your ingredients. We'll figure\nout what's for dinner.",
    cta:   'Next',
    img:   'ob-3.png'
  },
  {
    title: "Everyone's\nCovered",
    sub:   'Set dietary needs and preferences\nfor every household member.',
    cta:   'Next',
    img:   'ob-4.png'
  },
  {
    title: 'Shop Without\nthe Stress',
    sub:   'Auto-built grocery lists from your\nweekly meal plan.',
    cta:   "Let's Cook!",
    img:   'ob-5.png'
  }
];

// ════════════════════════════════════════════════════════════════════════════════
// ONBOARDING SLIDES 1–5
// ════════════════════════════════════════════════════════════════════════════════
SLIDES.forEach(function(slide, i) {
  figma.notify('(' + (i+1) + '/11) Building Slide ' + (i+1) + '…');
  var f = mkFrame('Onboarding — Slide ' + (i+1), sx + i * (W + GAP));

  // Full-bleed illustration or gradient fallback
  if (IMGS[slide.img]) {
    f.fills = [{ type:'IMAGE', scaleMode:'FILL', imageHash: IMGS[slide.img].hash }];
  } else {
    f.fills = topToBottomGrad('#4A3080', '#C3B1E1');
    addWhisker(f, Math.round((W - 130) / 2), 230, 130, 'Slide ' + (i+1));
  }

  // Bottom scrim — transparent to deep plum (shorter so character body is visible)
  var scrimRect = figma.createRectangle(); f.appendChild(scrimRect);
  scrimRect.resize(W, 254); scrimRect.x = 0; scrimRect.y = H - 254;
  scrimRect.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[0, 1, 0], [-1, 0, 1]],
    gradientStops: [
      {position: 0,    color: {r:0.075, g:0.051, b:0.114, a:0}},
      {position: 0.25, color: {r:0.075, g:0.051, b:0.114, a:0.55}},
      {position: 1,    color: {r:0.075, g:0.051, b:0.114, a:0.94}}
    ]
  }];

  // Progress dots — 5 dots, active = white, inactive = white 35%
  var dotsY = H - 244;
  var dotsStartX = Math.round((W - (5*8 + 4*6)) / 2); // 5 dots × 8px + 4 gaps × 6px = 64px total
  for (var di = 0; di < 5; di++) {
    var dot = figma.createEllipse(); f.appendChild(dot);
    dot.resize(8, 8);
    dot.x = dotsStartX + di * 14;
    dot.y = dotsY;
    dot.fills = solid(P.white, di === i ? 1 : 0.35);
  }

  // Headline
  addText(f, slide.title, 28, H - 224, 26, 'Extra Bold', P.white, {w: 334, align:'CENTER', lh:34});

  // Subtext — white at 78% opacity
  var subNode = addText(f, slide.sub, 28, H - 148, 14, 'Regular', P.white, {w:334, align:'CENTER', lh:22});
  subNode.fills = solid(P.white, 0.78);

  // CTA button — white background, primary-colored label
  addButton(f, slide.cta, 28, H - 92, 334, P.white, P.primary);
});

// ════════════════════════════════════════════════════════════════════════════════
// 6. AUTH — WELCOME
// ════════════════════════════════════════════════════════════════════════════════
figma.notify('(6/11) Building Auth — Welcome…');
var awX = sx + 5 * (W + GAP);
var aw = mkFrame('Auth — Welcome', awX);
aw.fills = solid(P.bg);

addEllipse(aw, -80, -100, 380, 320, P.secondary, 0.12);
addEllipse(aw, 260, 560, 200, 200, P.primary,   0.08);
addEllipse(aw, -60, 480, 180, 180, P.secondary, 0.07);

addStatusBar(aw, false);

var iconSz = 72;
addAppIcon(aw, Math.round((W - iconSz) / 2), 68, iconSz, kbHash);

addText(aw, 'Kitchen Bandits', 28, 154, 34, 'Extra Bold', P.primary, {w:334, align:'CENTER'});
addText(aw, 'Outsmart picky eaters.\nFeed your crew.', 28, 200, 15, 'Regular', P.muted, {w:334, align:'CENTER', lh:24});

// Whisker — real image if loaded, otherwise circle placeholder
var kbHash      = IMGS['kb-icon.png']          ? IMGS['kb-icon.png'].hash          : null;
var welcomeHash = IMGS['whisker-welcome.png']  ? IMGS['whisker-welcome.png'].hash  : null;
addWhisker(aw, Math.round((W - 180) / 2), 258, 180, 'Whisker', welcomeHash);

var pills = ['📱 Import recipes', '❄️ Scan fridge', '👨‍👩‍👧 Family meals'];
var pillX = 14;
pills.forEach(function(pl) {
  var pw = pl.length * 6 + 28;
  var pg = figma.createFrame(); aw.appendChild(pg);
  pg.resize(pw, 32); pg.x = pillX; pg.y = 462;
  pg.cornerRadius = 100; pg.fills = solid(P.chip);
  pg.strokes = solid(P.secondary, 0.5); pg.strokeWeight = 1;
  var pt = figma.createText(); pg.appendChild(pt);
  pt.fontName = {family:'Inter', style:'Medium'};
  pt.fontSize = 11;
  pt.fills = solid(P.chipTx); pt.x = 14; pt.y = 9;
  pt.characters = pl;
  pillX += pw + 8;
});

addButton(aw, 'Get Started', 28, H - 168, 334, P.primary, P.white);
addButton(aw, 'Sign In', 28, H - 108, 334, P.primary, P.primary, true);
addText(aw, 'By continuing you agree to our Terms of Service', 28, H - 46, 11, 'Regular', P.muted, {w:334, align:'CENTER'});

// ════════════════════════════════════════════════════════════════════════════════
// 7. AUTH — SIGN IN
// ════════════════════════════════════════════════════════════════════════════════
figma.notify('(7/11) Building Auth — Sign In…');
var asi = mkFrame('Auth — Sign In', sx + 6 * (W + GAP));
asi.fills = solid(P.bg);

var asiBand = figma.createRectangle(); asi.appendChild(asiBand);
asiBand.resize(W, 72); asiBand.x = 0; asiBand.y = 0;
asiBand.fills = [{type:'GRADIENT_LINEAR', gradientTransform:[[0,1,0],[-1,0,1]], gradientStops:[{position:0,color:rgbA(P.secondary,0.22)},{position:1,color:rgbA(P.secondary,0)}]}];
addEllipse(asi, W-100, -30, 160, 160, P.secondary, 0.1);

addStatusBar(asi, false);
addText(asi, '← Back', 28, 52, 13, 'Semi Bold', P.primary);
addText(asi, 'Welcome back 👋', 28, 86, 28, 'Extra Bold', P.text, {w:334, lh:34});
addText(asi, 'Sign in to Kitchen Bandits', 28, 154, 13, 'Regular', P.muted, {w:334});

addInput(asi, 'Email', 'your@email.com', 28, 188, 334);
addInput(asi, 'Password', 'Enter your password', 28, 256, 334);

addText(asi, 'Forgot password?', 28, 324, 12, 'Semi Bold', P.primary, {w:334, align:'RIGHT'});

addButton(asi, 'Sign In', 28, 356, 334, P.primary, P.white);
addDivider(asi, 418, false);
addButton(asi, 'Continue with Apple', 28, 436, 334, P.border, P.text, true);
addText(asi, 'No account? Sign up free', 28, 504, 13, 'Regular', P.muted, {w:334, align:'CENTER'});

// ════════════════════════════════════════════════════════════════════════════════
// 8. ONBOARDING — COMPLETE
// ════════════════════════════════════════════════════════════════════════════════
figma.notify('(8/11) Building Onboarding — Complete…');
var oc = mkFrame('Onboarding — Complete', sx + 7 * (W + GAP));
oc.fills = topToBottomGrad('#EDE7F6', '#C8B8E0');

addEllipse(oc, 260, -60, 200, 200, P.secondary, 0.14);
addEllipse(oc, -40, 640, 170, 170, P.primary,   0.10);
addEllipse(oc, -20, -40, 140, 140, P.secondary, 0.08);

addStatusBar(oc, false);

// Whisker confident pose (arms crossed, on cloud) — Onboarding Complete
var confidentHash = IMGS['whisker-confident.png'] ? IMGS['whisker-confident.png'].hash : null;
addWhisker(oc, Math.round((W - 190) / 2), 80, 190, 'Whisker', confidentHash);

addText(oc, "You're all set, Will!", 28, 292, 28, 'Extra Bold', P.text, {w:334, align:'CENTER', lh:36});
addText(oc, 'Your kitchen is ready. Every recipe, grocery\nrun, and mealtime standoff — handled.', 28, 340, 14, 'Regular', P.muted, {w:334, align:'CENTER', lh:22});

var pill1 = figma.createFrame(); oc.appendChild(pill1);
pill1.resize(140, 36); pill1.x = Math.round(W/2) - 148; pill1.y = 404;
pill1.cornerRadius = 100; pill1.fills = solid(P.white, 0.82);
pill1.strokes = solid(P.secondary, 0.6); pill1.strokeWeight = 1;
var p1t = figma.createText(); pill1.appendChild(p1t);
p1t.fontName = {family:'Inter', style:'Semi Bold'}; p1t.fontSize = 12;
p1t.fills = solid(P.text); p1t.x = 18; p1t.y = 10;
p1t.characters = '👥  2 members';

var pill2 = figma.createFrame(); oc.appendChild(pill2);
pill2.resize(164, 36); pill2.x = Math.round(W/2) + 8; pill2.y = 404;
pill2.cornerRadius = 100; pill2.fills = solid(P.white, 0.82);
pill2.strokes = solid(P.secondary, 0.6); pill2.strokeWeight = 1;
var p2t = figma.createText(); pill2.appendChild(p2t);
p2t.fontName = {family:'Inter', style:'Semi Bold'}; p2t.fontSize = 12;
p2t.fills = solid(P.text); p2t.x = 16; p2t.y = 10;
p2t.characters = '🥗  No restrictions';

addButton(oc, "Let's get cooking →", 28, 464, 334, P.primary, P.white);
addButton(oc, '← Edit household',    28, 524, 334, P.primary, P.primary, true);

// ════════════════════════════════════════════════════════════════════════════════
// 9. HOME — DARK
// ════════════════════════════════════════════════════════════════════════════════
figma.notify('(9/11) Building Home — Dark…');
var hd = mkFrame('Home — Dark', sx + 8 * (W + GAP));
hd.fills = solid(P.dbg);

addStatusBar(hd, true);

addAppIcon(hd, 20, 56, 32, kbHash);
addText(hd, 'KITCHEN BANDITS', 60, 60, 10, 'Bold', P.dprimary, {ls:5});
addText(hd, "What's cooking, Will?", 60, 74, 20, 'Extra Bold', P.dtext);
addEllipse(hd, 330, 56, 40, 40, P.dprimary, 0.35);

var featCard = figma.createRectangle(); hd.appendChild(featCard);
featCard.resize(350, 200); featCard.x = 20; featCard.y = 106;
featCard.cornerRadius = 20;
featCard.fills = diagonalGrad('#4A3580', '#8060A8');
featCard.effects = dropShadow(12, 32, 0.3);

var featScrim = figma.createRectangle(); hd.appendChild(featScrim);
featScrim.resize(350, 100); featScrim.x = 20; featScrim.y = 206;
featScrim.cornerRadius = 20;
featScrim.fills = [{
  type:'GRADIENT_LINEAR',
  gradientTransform:[[0,1,0],[-1,0,1]],
  gradientStops:[{position:0,color:{r:0,g:0,b:0,a:0}},{position:1,color:{r:0,g:0,b:0,a:0.6}}]
}];

var featBadge = figma.createFrame(); hd.appendChild(featBadge);
featBadge.resize(132, 24); featBadge.x = 36; featBadge.y = 122;
featBadge.cornerRadius = 100; featBadge.fills = solid(P.white, 0.2);
var fbt = figma.createText(); featBadge.appendChild(fbt);
fbt.fontName = {family:'Inter', style:'Bold'}; fbt.fontSize = 9;
fbt.letterSpacing = {value:4, unit:'PERCENT'};
fbt.fills = solid(P.white);
fbt.characters = 'FEATURED TODAY';
fbt.x = 12; fbt.y = 7;

var ratBadge = figma.createFrame(); hd.appendChild(ratBadge);
ratBadge.resize(44, 24); ratBadge.x = 326; ratBadge.y = 122;
ratBadge.cornerRadius = 100; ratBadge.fills = solid('#000000', 0.35);
var rbt = figma.createText(); ratBadge.appendChild(rbt);
rbt.fontName = {family:'Inter', style:'Bold'}; rbt.fontSize = 10;
rbt.characters = '4.9'; rbt.fills = solid(P.accent);
rbt.x = 10; rbt.y = 6;

addText(hd, 'Creamy Tuscan Salmon', 36, 254, 21, 'Extra Bold', P.white, {w:300});
addText(hd, '28 min  .  4 servings  .  Medium', 36, 281, 11, 'Regular', P.white, {w:300});

addFilterChips(hd, ['All','Quick','Vegetarian','High Protein','Budget'], 0, 20, 322, true);

addSectionHeader(hd, 'Your Recipes', 20, 366, 200, true);
addText(hd, 'See all', 314, 368, 12, 'Semi Bold', P.dprimary);

var darkRecs = [
  {title:'Avocado Toast', time:'12 min', color:'#4A3580'},
  {title:'Thai Curry',    time:'35 min', color:'#5A4898'},
  {title:'Birria Tacos',  time:'3 hr',   color:'#8060A8'}
];
darkRecs.forEach(function(r, i) {
  addRecipeCard(hd, 20 + i * 120, 390, 110, 100, r.title, r.time, r.color, null, null);
});

addSectionHeader(hd, 'Trending on Social', 20, 518, 220, true);

var socialRecs = [
  {title:'Baked Feta Pasta',    time:'30 min', color:'#A888CC', tag:'TikTok'},
  {title:'Dubai Chocolate',     time:'45 min', color:'#261850', tag:'Instagram'},
  {title:'Viral Smash Burgers', time:'20 min', color:'#6050A0', tag:'TikTok'}
];
socialRecs.forEach(function(r, i) {
  addRecipeCard(hd, 20 + i * 120, 540, 110, 110, r.title, r.time, r.color, r.tag, null);
});

var wBanBg = figma.createRectangle(); hd.appendChild(wBanBg);
wBanBg.resize(350, 58); wBanBg.x = 20; wBanBg.y = 670;
wBanBg.cornerRadius = 14; wBanBg.fills = solid(P.dcard);
wBanBg.strokes = solid(P.dprimary, 0.45); wBanBg.strokeWeight = 1.5;
addText(hd, 'What Can I Make?', 38, 682, 13, 'Bold', P.dtext);
addText(hd, 'Scan your fridge to find out', 38, 700, 11, 'Regular', P.dmuted);

var scanBtn = figma.createFrame(); hd.appendChild(scanBtn);
scanBtn.resize(66, 32); scanBtn.x = 304; scanBtn.y = 679;
scanBtn.cornerRadius = 100; scanBtn.fills = solid(P.dprimary);
var sbt = figma.createText(); scanBtn.appendChild(sbt);
sbt.fontName = {family:'Inter', style:'Bold'}; sbt.fontSize = 11;
sbt.characters = 'Scan'; sbt.fills = solid(P.white);
sbt.x = 16; sbt.y = 10;

addNavBar(hd, 0, true);

// ════════════════════════════════════════════════════════════════════════════════
// 10. SEARCH
// ════════════════════════════════════════════════════════════════════════════════
figma.notify('(10/11) Building Search…');
var searchScr = mkFrame('Search', sx + 9 * (W + GAP));
searchScr.fills = solid(P.bg);

addStatusBar(searchScr, false);
addText(searchScr, 'Discover', 20, 56, 24, 'Extra Bold', P.text);

var sbBg = figma.createRectangle(); searchScr.appendChild(sbBg);
sbBg.resize(350, 48); sbBg.x = 20; sbBg.y = 92;
sbBg.cornerRadius = 14; sbBg.fills = solid(P.card);
sbBg.strokes = solid(P.border); sbBg.strokeWeight = 1.5;
sbBg.effects = dropShadow(2, 8, 0.07);
addText(searchScr, 'Search recipes, ingredients...', 44, 105, 13, 'Regular', P.muted);

addText(searchScr, 'RECENT SEARCHES', 20, 156, 10, 'Bold', P.muted, {ls:5});
var recentQ = ['Pasta recipes', 'Chicken thighs', 'Vegan desserts', '30-min meals'];
var qx = 20, qy = 174;
recentQ.forEach(function(q) {
  var qw = q.length * 6.5 + 28;
  if (qx + qw > 370) { qx = 20; qy += 40; }
  var qg = figma.createFrame(); searchScr.appendChild(qg);
  qg.resize(qw, 30); qg.x = qx; qg.y = qy;
  qg.cornerRadius = 100; qg.fills = solid(P.chip);
  qg.strokes = solid(P.secondary, 0.4); qg.strokeWeight = 1;
  var qt = figma.createText(); qg.appendChild(qt);
  qt.fontName = {family:'Inter', style:'Regular'}; qt.fontSize = 11;
  qt.characters = q; qt.fills = solid(P.chipTx);
  qt.x = 14; qt.y = 8;
  qx += qw + 8;
});
qy += 48;

addSectionHeader(searchScr, 'Browse by Cuisine', 20, qy, 300, false);
qy += 30;

var cats = [
  {label:'Italian',  color:'#E86040'}, {label:'Asian',   color:'#9070C0'},
  {label:'Mexican',  color:'#40A888'}, {label:'Healthy',  color:'#50A850'},
  {label:'Quick',    color:'#7060C4'}, {label:'Comfort',  color:'#C47840'},
  {label:'Baking',   color:'#C44880'}, {label:'Grilling', color:'#4878B8'}
];
var catW = 80, catH = 68, catGap = 9;
cats.forEach(function(cat, ci) {
  var col = ci % 4, row = Math.floor(ci / 4);
  var cg = figma.createFrame(); searchScr.appendChild(cg);
  cg.resize(catW, catH);
  cg.x = 20 + col * (catW + catGap);
  cg.y = qy + row * (catH + catGap);
  cg.cornerRadius = 12;
  cg.fills = solid(cat.color, 0.15);
  cg.strokes = solid(cat.color, 0.4); cg.strokeWeight = 1;
  var clt = figma.createText(); cg.appendChild(clt);
  clt.fontName = {family:'Inter', style:'Semi Bold'}; clt.fontSize = 11;
  clt.textAlignHorizontal = 'CENTER'; clt.textAutoResize = 'HEIGHT';
  clt.resize(catW - 8, 10);
  clt.fills = solid(P.text);
  clt.characters = cat.label;
  clt.x = 4; clt.y = 44;
});
qy += 2 * (catH + catGap) + 18;

addSectionHeader(searchScr, 'Trending This Week', 20, qy, 280, false);
qy += 30;

var trendRecs = [
  {title:'Cucumber Salad',        time:'10 min', color:'#5A4898'},
  {title:'Marry Me Chicken',      time:'32 min', color:'#B898D8'},
  {title:'Brown Butter Rigatoni', time:'25 min', color:'#9070C0'},
  {title:'Street Corn Dip',       time:'15 min', color:'#C0A8E0'}
];
var tcW = 165, tcH = 100;
trendRecs.forEach(function(r, i) {
  var col = i % 2, row = Math.floor(i / 2);
  addRecipeCard(searchScr, 20 + col * (tcW + 10), qy + row * (tcH + 38), tcW, tcH, r.title, r.time, r.color, null, null);
});

addNavBar(searchScr, 1, false);

// ════════════════════════════════════════════════════════════════════════════════
// 11. LIBRARY
// ════════════════════════════════════════════════════════════════════════════════
figma.notify('(11/11) Building Library…');
var libScr = mkFrame('Library', sx + 10 * (W + GAP));
libScr.fills = solid(P.bg);

addStatusBar(libScr, false);
addText(libScr, 'My Recipes', 20, 56, 24, 'Extra Bold', P.text);
addText(libScr, '14 saved', 298, 64, 12, 'Regular', P.muted);

addFilterChips(libScr, ['All','Quick','Vegan','Baking','TikTok'], 0, 20, 90, false);

var libRecs = [
  {title:'Creamy Tuscan Salmon',     time:'28 min', rating:'4.9', tag:'Saved',     color:'#B898D8'},
  {title:'Avocado Toast',            time:'12 min', rating:'4.7', tag:'Quick',      color:'#4A3580'},
  {title:'Birria Tacos',             time:'3 hr',   rating:'4.8', tag:'TikTok',     color:'#9070C0'},
  {title:'Thai Green Curry',         time:'35 min', rating:'4.6', tag:'Vegetarian', color:'#5A4898'},
  {title:'Miso Glazed Eggplant',     time:'22 min', rating:'4.5', tag:'Vegan',      color:'#3A2860'},
  {title:'Dubai Chocolate Brownies', time:'45 min', rating:'4.9', tag:'Instagram',  color:'#261850'},
  {title:'Marry Me Chicken',         time:'32 min', rating:'4.9', tag:'',           color:'#A888CC'},
  {title:'Homemade Sourdough',       time:'4 hr',   rating:'4.6', tag:'Baking',     color:'#8060B0'}
];
var lrW = 165, lrH = 120;
libRecs.forEach(function(r, i) {
  var col = i % 2, row = Math.floor(i / 2);
  addRecipeCard(libScr, 20 + col * (lrW + 10), 130 + row * (lrH + 36),
    lrW, lrH, r.title, r.time, r.color, r.tag || null, r.rating);
});

addNavBar(libScr, 2, false);

// ─── FINISH ───────────────────────────────────────────────────────────────────
figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
figma.closePlugin('Done! 11 screens added/updated.');

} catch (err) {
  var msg = err && err.message ? err.message : String(err);
  figma.notify('Plugin error: ' + msg, { timeout: 30000 });
  figma.closePlugin('KB plugin crashed: ' + msg);
}

})();
