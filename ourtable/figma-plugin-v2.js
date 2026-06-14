// Kitchen Bandits — Figma Plugin v3
// 37 frames: 5 onboarding slides + 8 app screens x 4 themes (Light / Dark / Navy / Amber)
// manifest.json must include: "networkAccess": { "allowedDomains": ["https://raw.githubusercontent.com"] }

(async function () {
try {

// ─── THEMES ───────────────────────────────────────────────────────────────────
var THEMES = {
  light: {
    name:'Light',
    bg:'#F5F1EB', card:'#FFFFFF', primary:'#6B4FA8', secondary:'#C3B1E1',
    text:'#1E1A2E', muted:'#9A8A78', border:'#E2DCF0',
    chip:'#EDE7F6', chipTx:'#7A6090', accent:'#F6C45C',
    input:'#F0EBF6', surface:'#EDE7F6',
    featGrad1:'#4A3580', featGrad2:'#8060A8',
    textOnPrimary:'#FFFFFF', white:'#FFFFFF'
  },
  dark: {
    name:'Dark',
    bg:'#1E1525', card:'#2A1F33', primary:'#A685D4', secondary:'#C3B1E1',
    text:'#F0ECFA', muted:'#A090B0', border:'#3A2E48',
    chip:'#2E2040', chipTx:'#C3B1E1', accent:'#F6C45C',
    input:'#251A2E', surface:'#221830',
    featGrad1:'#3D2870', featGrad2:'#6040A0',
    textOnPrimary:'#FFFFFF', white:'#FFFFFF'
  },
  navy: {
    name:'Navy',
    bg:'#0D1B2E', card:'#152236', primary:'#F6C45C', secondary:'#8BC4E8',
    text:'#F0EDFF', muted:'#7A8FA8', border:'#1E3044',
    chip:'#1A2D42', chipTx:'#8BC4E8', accent:'#F6C45C',
    input:'#122030', surface:'#0F1E30',
    featGrad1:'#1A3A5C', featGrad2:'#0D2848',
    textOnPrimary:'#0D1B2E', white:'#FFFFFF'
  },
  amber: {
    name:'Amber',
    bg:'#FFF8F0', card:'#FFFFFF', primary:'#C1613A', secondary:'#E8A84A',
    text:'#2A1808', muted:'#8A6850', border:'#F0D8B8',
    chip:'#FFF0E0', chipTx:'#8A4820', accent:'#E8A84A',
    input:'#FFF0E0', surface:'#FFF4E8',
    featGrad1:'#8A2808', featGrad2:'#C05018',
    textOnPrimary:'#FFFFFF', white:'#FFFFFF'
  }
};
var TH = THEMES.light; // global current theme — swapped before each group

// ─── COLOR UTILITIES ──────────────────────────────────────────────────────────
function rgb(h) {
  h = h.replace('#','');
  return {r:parseInt(h.slice(0,2),16)/255, g:parseInt(h.slice(2,4),16)/255, b:parseInt(h.slice(4,6),16)/255};
}
function solid(hex, a) {
  return [{type:'SOLID', color:rgb(hex), opacity: a===undefined ? 1 : a}];
}
function rgbA(hex, a) {
  var c = rgb(hex); return {r:c.r, g:c.g, b:c.b, a: a===undefined ? 1 : a};
}
function topToBottomGrad(h1, h2, stops) {
  var gs = stops || [{position:0,color:rgbA(h1)},{position:1,color:rgbA(h2)}];
  return [{type:'GRADIENT_LINEAR', gradientTransform:[[0,1,0],[-1,0,1]], gradientStops:gs}];
}
function dropShadow(yOff, blur, alpha) {
  return [{type:'DROP_SHADOW', visible:true, blendMode:'NORMAL',
    color:{r:0,g:0,b:0,a:alpha||0.15}, offset:{x:0,y:yOff||4}, radius:blur||12, spread:0}];
}

// ─── SHAPE PRIMITIVES ─────────────────────────────────────────────────────────
function addRect(par, x, y, w, h, hex, radius, alpha) {
  var n = figma.createRectangle(); par.appendChild(n);
  n.x=x; n.y=y; n.resize(w,h); n.fills=solid(hex,alpha);
  if (radius) n.cornerRadius=radius;
  return n;
}
function addEllipse(par, x, y, w, h, hex, alpha) {
  var n = figma.createEllipse(); par.appendChild(n);
  n.x=x; n.y=y; n.resize(w,h); n.fills=solid(hex,alpha);
  return n;
}

// IMPORTANT: all layout props set BEFORE .characters to avoid Figma hang
function addText(par, str, x, y, sz, style, hex, opts) {
  var t = figma.createText(); par.appendChild(t);
  t.fontName = {family:'Inter', style:style||'Regular'};
  t.fontSize = sz || 14;
  if (opts && opts.w)     { t.textAutoResize='HEIGHT'; t.resize(opts.w,40); }
  if (opts && opts.align) t.textAlignHorizontal = opts.align;
  if (opts && opts.lh)    t.lineHeight = {value:opts.lh, unit:'PIXELS'};
  if (opts && opts.ls)    t.letterSpacing = {value:opts.ls, unit:'PERCENT'};
  t.fills = solid(hex || TH.text);
  t.characters = str;
  t.x=x; t.y=y;
  return t;
}

// ─── FRAME / COMPONENT HELPERS ────────────────────────────────────────────────
var W=390, H=844;

function mkFrame(name, x, y) {
  var f = figma.createFrame(); figma.currentPage.appendChild(f);
  f.name=name; f.resize(W,H); f.x=x||0; f.y=y||0; f.clipsContent=true;
  return f;
}

function addButton(par, label, x, y, w, bgHex, txHex, outlined) {
  var g = figma.createFrame(); par.appendChild(g);
  g.name='btn-'+label; g.resize(w,50); g.x=x; g.y=y;
  g.cornerRadius=14; g.clipsContent=false;
  if (outlined) {
    g.fills=[]; g.strokes=solid(bgHex); g.strokeWeight=1.5; g.strokeAlign='INSIDE';
  } else {
    g.fills=solid(bgHex); g.effects=dropShadow(6,18,0.2);
  }
  var t=figma.createText(); g.appendChild(t);
  t.fontName={family:'Inter',style:'Bold'}; t.fontSize=15;
  t.textAlignHorizontal='CENTER'; t.textAutoResize='HEIGHT'; t.resize(w-32,40);
  t.fills=solid(txHex||TH.textOnPrimary);
  t.characters=label; t.x=16; t.y=17;
  return g;
}

function addInput(par, labelTxt, placeholder, x, y, w) {
  var g=figma.createFrame(); par.appendChild(g);
  g.name='input-'+labelTxt; g.resize(w,56); g.x=x; g.y=y;
  g.cornerRadius=12; g.clipsContent=false;
  g.fills=solid(TH.input); g.strokes=solid(TH.border); g.strokeWeight=1.5; g.strokeAlign='INSIDE';
  var lbl=figma.createText(); g.appendChild(lbl);
  lbl.fontName={family:'Inter',style:'Semi Bold'}; lbl.fontSize=10;
  lbl.letterSpacing={value:4,unit:'PERCENT'};
  lbl.fills=solid(TH.muted); lbl.characters=labelTxt.toUpperCase(); lbl.x=14; lbl.y=10;
  var ph=figma.createText(); g.appendChild(ph);
  ph.fontName={family:'Inter',style:'Regular'}; ph.fontSize=13;
  ph.fills=solid(TH.muted,0.65); ph.characters=placeholder; ph.x=14; ph.y=30;
  return g;
}

function addStatusBar(par) {
  var bar=figma.createFrame(); par.appendChild(bar);
  bar.name='Status Bar'; bar.resize(W,44); bar.x=0; bar.y=0;
  bar.fills=[]; bar.clipsContent=false;
  var t1=figma.createText(); bar.appendChild(t1);
  t1.fontName={family:'Inter',style:'Bold'}; t1.fontSize=15;
  t1.fills=solid(TH.text); t1.characters='9:41'; t1.x=28; t1.y=14;
  var t2=figma.createText(); bar.appendChild(t2);
  t2.fontName={family:'Inter',style:'Medium'}; t2.fontSize=11;
  t2.textAlignHorizontal='RIGHT'; t2.textAutoResize='HEIGHT'; t2.resize(120,10);
  t2.fills=solid(TH.text,0.6); t2.characters='LTE  100%'; t2.x=242; t2.y=15;
}

function addAppIcon(par, x, y, sz, imgHash) {
  sz=sz||56;
  var g=figma.createFrame(); par.appendChild(g);
  g.name='App Icon'; g.resize(sz,sz); g.x=x; g.y=y;
  g.cornerRadius=Math.round(sz*0.22); g.fills=solid(TH.primary);
  g.effects=dropShadow(4,14,0.22);
  if (imgHash) {
    var pad=Math.round(sz*0.12);
    var icon=figma.createRectangle(); g.appendChild(icon);
    icon.resize(sz-pad*2,sz-pad*2); icon.x=pad; icon.y=pad;
    icon.fills=[{type:'IMAGE',scaleMode:'FIT',imageHash:imgHash}];
  } else {
    var t=figma.createText(); g.appendChild(t);
    t.fontName={family:'Inter',style:'Extra Bold'};
    t.fontSize=Math.round(sz*0.3);
    t.textAlignHorizontal='CENTER'; t.textAutoResize='HEIGHT'; t.resize(sz-8,10);
    t.fills=solid(TH.textOnPrimary); t.characters='KB'; t.x=4; t.y=Math.round(sz*0.34);
  }
  return g;
}

function addWhisker(par, x, y, sz, label, imgHash) {
  sz=sz||100;
  if (imgHash) {
    var img=figma.createRectangle(); par.appendChild(img);
    img.name='Whisker'; img.resize(sz,sz); img.x=x; img.y=y;
    img.fills=[{type:'IMAGE',scaleMode:'FIT',imageHash:imgHash}];
    return img;
  }
  var g=figma.createFrame(); par.appendChild(g);
  g.name='Whisker'; g.resize(sz,sz); g.x=x; g.y=y; g.cornerRadius=sz/2;
  g.fills=topToBottomGrad(TH.secondary,TH.primary);
  g.strokes=solid(TH.secondary,0.4); g.strokeWeight=2;
  var t=figma.createText(); g.appendChild(t);
  t.fontName={family:'Inter',style:'Semi Bold'}; t.fontSize=11;
  t.textAlignHorizontal='CENTER'; t.textAutoResize='HEIGHT'; t.resize(sz-16,10);
  t.fills=solid(TH.white,0.85); t.characters=label||'Whisker';
  t.x=8; t.y=Math.round(sz/2-8);
  return g;
}

function addNavBar(par, activeIdx) {
  var barH=83;
  var bar=figma.createFrame(); par.appendChild(bar);
  bar.name='Nav Bar'; bar.resize(W,barH); bar.x=0; bar.y=H-barH;
  bar.fills=solid(TH.card); bar.clipsContent=false;
  addRect(bar,0,0,W,1,TH.border);
  var ind=figma.createRectangle(); bar.appendChild(ind);
  ind.resize(24,3); ind.cornerRadius=2; ind.fills=solid(TH.primary);
  ind.x=Math.round(W/4*activeIdx+W/8-12); ind.y=0;
  var tabs=['Home','Search','Library','Profile'], icons=['H','S','L','P'];
  tabs.forEach(function(label,i) {
    var col=i===activeIdx ? TH.primary : TH.muted;
    var cx=Math.round(W/4*i+W/8);
    var ic=figma.createEllipse(); bar.appendChild(ic);
    ic.resize(22,22); ic.x=cx-11; ic.y=10;
    ic.fills=solid(i===activeIdx ? TH.primary : TH.border, i===activeIdx ? 0.15 : 0.4);
    var iconTxt=figma.createText(); bar.appendChild(iconTxt);
    iconTxt.fontName={family:'Inter',style:'Bold'}; iconTxt.fontSize=9;
    iconTxt.textAlignHorizontal='CENTER'; iconTxt.textAutoResize='HEIGHT'; iconTxt.resize(22,10);
    iconTxt.fills=solid(col); iconTxt.characters=icons[i]; iconTxt.x=cx-11; iconTxt.y=15;
    var lbl=figma.createText(); bar.appendChild(lbl);
    lbl.fontName={family:'Inter',style:i===activeIdx?'Semi Bold':'Regular'}; lbl.fontSize=10;
    lbl.textAlignHorizontal='CENTER'; lbl.textAutoResize='HEIGHT'; lbl.resize(60,10);
    lbl.fills=solid(col); lbl.characters=label; lbl.x=cx-30; lbl.y=36;
  });
}

function addRecipeCard(par, x, y, w, h, title, time, color, tag, rating) {
  var card=figma.createRectangle(); par.appendChild(card);
  card.resize(w,h); card.x=x; card.y=y; card.cornerRadius=14;
  card.fills=solid(color); card.effects=dropShadow(3,12,0.18);
  var scrim=figma.createRectangle(); par.appendChild(scrim);
  scrim.resize(w,Math.round(h*0.5)); scrim.x=x; scrim.y=y+h-Math.round(h*0.5);
  scrim.cornerRadius=14;
  scrim.fills=topToBottomGrad('#000000','#000000',[
    {position:0,color:{r:0,g:0,b:0,a:0}},{position:1,color:{r:0,g:0,b:0,a:0.62}}]);
  var tw=Math.min(time.length*6+16, w-20);
  var timeBg=figma.createFrame(); par.appendChild(timeBg);
  timeBg.resize(tw,20); timeBg.x=x+8; timeBg.y=y+h-28;
  timeBg.cornerRadius=100; timeBg.fills=solid('#000000',0.45);
  var tt=figma.createText(); timeBg.appendChild(tt);
  tt.fontName={family:'Inter',style:'Regular'}; tt.fontSize=9;
  tt.characters=time; tt.fills=solid('#FFFFFF'); tt.x=8; tt.y=5;
  if (rating) {
    var ratBg=figma.createFrame(); par.appendChild(ratBg);
    ratBg.resize(40,20); ratBg.x=x+w-48; ratBg.y=y+h-28;
    ratBg.cornerRadius=100; ratBg.fills=solid('#000000',0.45);
    var rt=figma.createText(); ratBg.appendChild(rt);
    rt.fontName={family:'Inter',style:'Bold'}; rt.fontSize=9;
    rt.characters=rating; rt.fills=solid(TH.accent); rt.x=6; rt.y=5;
  }
  if (tag) {
    var tgw=Math.min(tag.length*6.5+16,w-16);
    var tagBg=figma.createFrame(); par.appendChild(tagBg);
    tagBg.resize(tgw,20); tagBg.x=x+8; tagBg.y=y+8;
    tagBg.cornerRadius=100; tagBg.fills=solid('#000000',0.5);
    var tgt=figma.createText(); tagBg.appendChild(tgt);
    tgt.fontName={family:'Inter',style:'Bold'}; tgt.fontSize=9;
    tgt.characters=tag; tgt.fills=solid('#FFFFFF'); tgt.x=8; tgt.y=5;
  }
  var titleTxt=figma.createText(); par.appendChild(titleTxt);
  titleTxt.fontName={family:'Inter',style:'Semi Bold'}; titleTxt.fontSize=11;
  titleTxt.textAutoResize='HEIGHT'; titleTxt.resize(w,10);
  titleTxt.fills=solid(TH.text); titleTxt.characters=title;
  titleTxt.x=x; titleTxt.y=y+h+6;
}

function addSectionHeader(par, title, x, y, w) {
  addText(par, title, x, y, 15, 'Bold', TH.secondary, {w:w});
}

function addDivider(par, y) {
  addRect(par,28,y,130,1,TH.border);
  addText(par,'or',176,y-9,12,'Regular',TH.muted,{w:40,align:'CENTER'});
  addRect(par,224,y,138,1,TH.border);
}

function addFilterChips(par, chips, activeIdx, x, y) {
  var cx=x;
  chips.forEach(function(chip,i) {
    var isActive=i===activeIdx;
    var cw=chip.length*7+28;
    var g=figma.createFrame(); par.appendChild(g);
    g.resize(cw,30); g.x=cx; g.y=y; g.cornerRadius=100;
    g.fills=solid(isActive ? TH.primary : TH.chip);
    if (!isActive) { g.strokes=solid(TH.border); g.strokeWeight=1; g.strokeAlign='INSIDE'; }
    var t=figma.createText(); g.appendChild(t);
    t.fontName={family:'Inter',style:isActive?'Semi Bold':'Regular'}; t.fontSize=11;
    t.characters=chip; t.fills=solid(isActive ? TH.textOnPrimary : TH.chipTx);
    t.x=14; t.y=8;
    cx+=cw+8;
  });
}

// ─── LOAD FONTS ───────────────────────────────────────────────────────────────
figma.notify('Loading Inter fonts…');
var fontStyles=['Regular','Medium','Semi Bold','Bold','Extra Bold'];
for (var fi=0; fi<fontStyles.length; fi++) {
  try {
    await figma.loadFontAsync({family:'Inter', style:fontStyles[fi]});
  } catch(fontErr) {
    figma.closePlugin('Font load failed — Inter '+fontStyles[fi]+': '+fontErr.toString());
    return;
  }
}

// ─── LOAD IMAGES WITH 20s TIMEOUT ─────────────────────────────────────────────
function imgWithTimeout(url, ms) {
  return Promise.race([
    figma.createImageAsync(url),
    new Promise(function(_,rej) {
      setTimeout(function() { rej(new Error('timeout')); }, ms||20000);
    })
  ]);
}

var BRANCH='claude/ladle-design-tokens';
var BASE_URL='https://raw.githubusercontent.com/grayson039/grayson039.github.io/'+BRANCH+'/ourtable/';
var IMG_NAMES=['ob-1.png','ob-2.png','ob-3.png','ob-4.png','ob-5.png',
               'whisker-welcome.png.png','whisker-confident.png.png','kb-icon.png'];
var IMGS={};

for (var ii=0; ii<IMG_NAMES.length; ii++) {
  var imgName=IMG_NAMES[ii];
  figma.notify('Image '+( ii+1)+'/'+IMG_NAMES.length+': '+imgName+'…');
  await new Promise(function(r){setTimeout(r,40);});
  try {
    IMGS[imgName]=await imgWithTimeout(BASE_URL+imgName, 20000);
  } catch(imgErr) {
    IMGS[imgName]=null;
    figma.notify('Skipped '+imgName+': '+(imgErr.message||imgErr), {timeout:3000});
    await new Promise(function(r){setTimeout(r,40);});
  }
}

// ─── CLEAN UP OLD FRAMES ──────────────────────────────────────────────────────
figma.notify('Cleaning old frames…');
var OLD_NAMES=[
  'Slide 1','Slide 2','Slide 3','Slide 4','Slide 5',
  'Onboarding — Slide 1','Onboarding — Slide 2','Onboarding — Slide 3',
  'Onboarding — Slide 4','Onboarding — Slide 5',
  'Auth — Welcome','Auth — Sign In','Onboarding — Complete',
  'Home — Dark','Search','Library',
  'Auth Welcome — Light','Auth Welcome — Dark','Auth Welcome — Navy','Auth Welcome — Amber',
  'Auth Sign In — Light','Auth Sign In — Dark','Auth Sign In — Navy','Auth Sign In — Amber',
  'Onboarding Complete — Light','Onboarding Complete — Dark',
  'Onboarding Complete — Navy','Onboarding Complete — Amber',
  'Home — Light','Home — Navy','Home — Amber',
  'Search — Light','Search — Dark','Search — Navy','Search — Amber',
  'Library — Light','Library — Dark','Library — Navy','Library — Amber',
  'Recipe Detail — Light','Recipe Detail — Dark','Recipe Detail — Navy','Recipe Detail — Amber',
  'Grocery List — Light','Grocery List — Dark','Grocery List — Navy','Grocery List — Amber'
];
figma.currentPage.children.slice().forEach(function(n){
  if (OLD_NAMES.indexOf(n.name)>=0) n.remove();
});

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
var maxRight=0;
figma.currentPage.children.forEach(function(n){
  if (n.x+n.width>maxRight) maxRight=n.x+n.width;
});
var BX=maxRight>0 ? maxRight+60 : 0;
var GAP=40, ROW_GAP=80;
var ROW0=0;
var ROW1=H+ROW_GAP;
var ROW2=2*(H+ROW_GAP);
var ROW3=3*(H+ROW_GAP);
var ROW4=4*(H+ROW_GAP);

// App screen x slots (same for all theme rows)
var AX={
  authWelcome:     BX+0*(W+GAP),
  authSignIn:      BX+1*(W+GAP),
  onboardComplete: BX+2*(W+GAP),
  home:            BX+3*(W+GAP),
  search:          BX+4*(W+GAP),
  library:         BX+5*(W+GAP),
  recipeDetail:    BX+6*(W+GAP),
  groceryList:     BX+7*(W+GAP)
};

var kbHash        = IMGS['kb-icon.png']             ? IMGS['kb-icon.png'].hash             : null;
var whiskerHash   = IMGS['whisker-welcome.png.png'] ? IMGS['whisker-welcome.png.png'].hash : null;
var confidentHash = IMGS['whisker-confident.png.png']? IMGS['whisker-confident.png.png'].hash: null;

var totalFrames=37, builtCount=0;

// ─── SCREEN BUILDER FUNCTIONS (use global TH) ─────────────────────────────────

function buildAuthWelcome(x, y, kbH, wkH) {
  var f=mkFrame('Auth Welcome — '+TH.name, x, y);
  f.fills=solid(TH.bg);
  addEllipse(f,-80,-100,380,320,TH.secondary,0.1);
  addEllipse(f,260,560,200,200,TH.primary,0.07);
  addEllipse(f,-60,480,180,180,TH.secondary,0.06);
  addStatusBar(f);
  var iconSz=72;
  addAppIcon(f, Math.round((W-iconSz)/2), 68, iconSz, kbH);
  addText(f,'Kitchen Bandits',28,154,34,'Extra Bold',TH.primary,{w:334,align:'CENTER'});
  addText(f,'Outsmart picky eaters.\nFeed your crew.',28,202,15,'Regular',TH.muted,{w:334,align:'CENTER',lh:24});
  addWhisker(f, Math.round((W-180)/2), 258, 180, 'Whisker', wkH);
  var pills=['Import recipes','Scan fridge','Family meals'];
  var pillX=22;
  pills.forEach(function(pl) {
    var pw=pl.length*6.5+28;
    var pg=figma.createFrame(); f.appendChild(pg);
    pg.resize(pw,32); pg.x=pillX; pg.y=462;
    pg.cornerRadius=100; pg.fills=solid(TH.chip);
    pg.strokes=solid(TH.secondary,0.5); pg.strokeWeight=1;
    var pt=figma.createText(); pg.appendChild(pt);
    pt.fontName={family:'Inter',style:'Medium'}; pt.fontSize=11;
    pt.fills=solid(TH.chipTx); pt.x=14; pt.y=9; pt.characters=pl;
    pillX+=pw+8;
  });
  addButton(f,'Get Started',28,H-168,334,TH.primary,TH.textOnPrimary);
  addButton(f,'Sign In',28,H-108,334,TH.primary,TH.primary,true);
  addText(f,'By continuing you agree to our Terms of Service',28,H-46,11,'Regular',TH.muted,{w:334,align:'CENTER'});
}

function buildAuthSignIn(x, y) {
  var f=mkFrame('Auth Sign In — '+TH.name, x, y);
  f.fills=solid(TH.bg);
  var band=figma.createRectangle(); f.appendChild(band);
  band.resize(W,72); band.x=0; band.y=0;
  band.fills=topToBottomGrad(TH.secondary,TH.secondary,[
    {position:0,color:rgbA(TH.secondary,0.2)},{position:1,color:rgbA(TH.secondary,0)}]);
  addEllipse(f,W-100,-30,160,160,TH.secondary,0.1);
  addStatusBar(f);
  addText(f,'< Back',28,52,13,'Semi Bold',TH.primary);
  addText(f,'Welcome back',28,86,28,'Extra Bold',TH.text,{w:334,lh:36});
  addText(f,'Sign in to Kitchen Bandits',28,134,13,'Regular',TH.muted,{w:334});
  addInput(f,'Email','your@email.com',28,168,334);
  addInput(f,'Password','Enter your password',28,234,334);
  addText(f,'Forgot password?',28,300,12,'Semi Bold',TH.primary,{w:334,align:'RIGHT'});
  addButton(f,'Sign In',28,330,334,TH.primary,TH.textOnPrimary);
  addDivider(f,396);
  addButton(f,'Continue with Apple',28,412,334,TH.border,TH.text,true);
  addText(f,'No account? Sign up free',28,480,13,'Regular',TH.muted,{w:334,align:'CENTER'});
}

function buildOnboardingComplete(x, y, confH) {
  var f=mkFrame('Onboarding Complete — '+TH.name, x, y);
  if (TH.name==='Dark'||TH.name==='Navy') {
    f.fills=topToBottomGrad(TH.card,TH.bg);
  } else {
    f.fills=topToBottomGrad(TH.chip,TH.secondary);
  }
  addEllipse(f,260,-60,200,200,TH.secondary,0.14);
  addEllipse(f,-40,620,170,170,TH.primary,0.1);
  addStatusBar(f);
  addWhisker(f, Math.round((W-190)/2), 80, 190, 'Whisker', confH);
  addText(f,"You're all set!",28,290,28,'Extra Bold',TH.text,{w:334,align:'CENTER',lh:36});
  addText(f,'Your kitchen is ready. Every recipe,\ngrocery run, and mealtime standoff\n— handled.',28,338,14,'Regular',TH.muted,{w:334,align:'CENTER',lh:22});
  var pill1=figma.createFrame(); f.appendChild(pill1);
  pill1.resize(140,36); pill1.x=Math.round(W/2)-148; pill1.y=422;
  pill1.cornerRadius=100; pill1.fills=solid(TH.card,0.82);
  pill1.strokes=solid(TH.secondary,0.6); pill1.strokeWeight=1;
  var p1t=figma.createText(); pill1.appendChild(p1t);
  p1t.fontName={family:'Inter',style:'Semi Bold'}; p1t.fontSize=12;
  p1t.fills=solid(TH.text); p1t.x=16; p1t.y=10; p1t.characters='2 members';
  var pill2=figma.createFrame(); f.appendChild(pill2);
  pill2.resize(162,36); pill2.x=Math.round(W/2)+8; pill2.y=422;
  pill2.cornerRadius=100; pill2.fills=solid(TH.card,0.82);
  pill2.strokes=solid(TH.secondary,0.6); pill2.strokeWeight=1;
  var p2t=figma.createText(); pill2.appendChild(p2t);
  p2t.fontName={family:'Inter',style:'Semi Bold'}; p2t.fontSize=12;
  p2t.fills=solid(TH.text); p2t.x=14; p2t.y=10; p2t.characters='No restrictions';
  addButton(f,"Let's get cooking",28,476,334,TH.primary,TH.textOnPrimary);
  addButton(f,'Edit household',28,536,334,TH.primary,TH.primary,true);
}

function buildHome(x, y, kbH) {
  var f=mkFrame('Home — '+TH.name, x, y);
  f.fills=solid(TH.bg);
  addStatusBar(f);
  addAppIcon(f,20,56,32,kbH);
  addText(f,'KITCHEN BANDITS',60,60,10,'Bold',TH.primary,{ls:5});
  addText(f,"What's cooking, Will?",60,74,20,'Extra Bold',TH.text);
  var avBg=figma.createFrame(); f.appendChild(avBg);
  avBg.resize(36,36); avBg.x=334; avBg.y=54; avBg.cornerRadius=100;
  avBg.fills=solid(TH.primary,0.18);
  var avT=figma.createText(); avBg.appendChild(avT);
  avT.fontName={family:'Inter',style:'Bold'}; avT.fontSize=13;
  avT.textAlignHorizontal='CENTER'; avT.textAutoResize='HEIGHT'; avT.resize(36,10);
  avT.fills=solid(TH.primary); avT.characters='W'; avT.x=0; avT.y=12;
  // Featured card
  var feat=figma.createRectangle(); f.appendChild(feat);
  feat.resize(350,204); feat.x=20; feat.y=108; feat.cornerRadius=20;
  feat.fills=topToBottomGrad(TH.featGrad1,TH.featGrad2);
  feat.effects=dropShadow(10,28,0.28);
  var featScrim=figma.createRectangle(); f.appendChild(featScrim);
  featScrim.resize(350,104); featScrim.x=20; featScrim.y=208; featScrim.cornerRadius=20;
  featScrim.fills=topToBottomGrad('#000000','#000000',[
    {position:0,color:{r:0,g:0,b:0,a:0}},{position:1,color:{r:0,g:0,b:0,a:0.62}}]);
  var fBadge=figma.createFrame(); f.appendChild(fBadge);
  fBadge.resize(128,22); fBadge.x=36; fBadge.y=124; fBadge.cornerRadius=100;
  fBadge.fills=solid('#FFFFFF',0.18);
  var fbt=figma.createText(); fBadge.appendChild(fbt);
  fbt.fontName={family:'Inter',style:'Bold'}; fbt.fontSize=9;
  fbt.letterSpacing={value:4,unit:'PERCENT'};
  fbt.fills=solid('#FFFFFF'); fbt.characters='FEATURED TODAY'; fbt.x=12; fbt.y=6;
  var rBadge=figma.createFrame(); f.appendChild(rBadge);
  rBadge.resize(44,22); rBadge.x=326; rBadge.y=124; rBadge.cornerRadius=100;
  rBadge.fills=solid('#000000',0.35);
  var rbt=figma.createText(); rBadge.appendChild(rbt);
  rbt.fontName={family:'Inter',style:'Bold'}; rbt.fontSize=10;
  rbt.characters='4.9'; rbt.fills=solid(TH.accent); rbt.x=10; rbt.y=5;
  addText(f,'Creamy Tuscan Salmon',36,258,20,'Extra Bold','#FFFFFF',{w:300});
  addText(f,'28 min  .  4 servings  .  Medium',36,284,11,'Regular','#FFFFFF',{w:300});
  addFilterChips(f,['All','Quick','Vegetarian','High Protein'],0,20,326);
  addSectionHeader(f,'Your Recipes',20,370,200);
  addText(f,'See all',316,372,12,'Semi Bold',TH.primary);
  var recs=[
    {title:'Avocado Toast',time:'12 min',color:'#4A3580'},
    {title:'Thai Green Curry',time:'35 min',color:'#5A4898'},
    {title:'Birria Tacos',time:'3 hr',color:'#8060A8'}
  ];
  recs.forEach(function(r,i){addRecipeCard(f,20+i*120,394,110,100,r.title,r.time,r.color,null,null);});
  addSectionHeader(f,'Trending on Social',20,520,220);
  var sRecs=[
    {title:'Baked Feta Pasta',time:'30 min',color:'#A888CC',tag:'TikTok'},
    {title:'Dubai Chocolate',time:'45 min',color:'#261850',tag:'Instagram'},
    {title:'Viral Smash Burgers',time:'20 min',color:'#6050A0',tag:'TikTok'}
  ];
  sRecs.forEach(function(r,i){addRecipeCard(f,20+i*120,542,110,110,r.title,r.time,r.color,r.tag,null);});
  var banBg=figma.createRectangle(); f.appendChild(banBg);
  banBg.resize(350,58); banBg.x=20; banBg.y=672; banBg.cornerRadius=14;
  banBg.fills=solid(TH.card); banBg.strokes=solid(TH.primary,0.4); banBg.strokeWeight=1.5;
  addText(f,'What Can I Make?',38,684,13,'Bold',TH.text);
  addText(f,'Scan your fridge to find out',38,702,11,'Regular',TH.muted);
  var scanBtn=figma.createFrame(); f.appendChild(scanBtn);
  scanBtn.resize(68,32); scanBtn.x=302; scanBtn.y=679; scanBtn.cornerRadius=100;
  scanBtn.fills=solid(TH.primary);
  var sbt=figma.createText(); scanBtn.appendChild(sbt);
  sbt.fontName={family:'Inter',style:'Bold'}; sbt.fontSize=11;
  sbt.characters='Scan'; sbt.fills=solid(TH.textOnPrimary); sbt.x=14; sbt.y=10;
  addNavBar(f,0);
}

function buildSearch(x, y) {
  var f=mkFrame('Search — '+TH.name, x, y);
  f.fills=solid(TH.bg);
  addStatusBar(f);
  addText(f,'Discover',20,56,24,'Extra Bold',TH.text);
  var sbBg=figma.createRectangle(); f.appendChild(sbBg);
  sbBg.resize(350,48); sbBg.x=20; sbBg.y=92; sbBg.cornerRadius=14;
  sbBg.fills=solid(TH.card); sbBg.strokes=solid(TH.border); sbBg.strokeWeight=1.5;
  sbBg.effects=dropShadow(2,8,0.07);
  addText(f,'Search recipes, ingredients...',44,105,13,'Regular',TH.muted);
  addText(f,'RECENT SEARCHES',20,156,10,'Bold',TH.muted,{ls:5});
  var recentQ=['Pasta recipes','Chicken thighs','Vegan desserts','30-min meals'];
  var qx=20, qy=174;
  recentQ.forEach(function(q){
    var qw=q.length*6.5+28;
    if (qx+qw>370){qx=20;qy+=40;}
    var qg=figma.createFrame(); f.appendChild(qg);
    qg.resize(qw,30); qg.x=qx; qg.y=qy; qg.cornerRadius=100; qg.fills=solid(TH.chip);
    qg.strokes=solid(TH.secondary,0.4); qg.strokeWeight=1;
    var qt=figma.createText(); qg.appendChild(qt);
    qt.fontName={family:'Inter',style:'Regular'}; qt.fontSize=11;
    qt.characters=q; qt.fills=solid(TH.chipTx); qt.x=14; qt.y=8;
    qx+=qw+8;
  });
  qy+=48;
  addSectionHeader(f,'Browse by Cuisine',20,qy,300); qy+=32;
  var cats=[
    {label:'Italian',color:'#E86040'},{label:'Asian',color:'#9070C0'},
    {label:'Mexican',color:'#40A888'},{label:'Healthy',color:'#50A850'},
    {label:'Quick',color:'#7060C4'},{label:'Comfort',color:'#C47840'},
    {label:'Baking',color:'#C44880'},{label:'Grilling',color:'#4878B8'}
  ];
  var catW=80,catH=68,catGap=9;
  cats.forEach(function(cat,ci){
    var col=ci%4, row=Math.floor(ci/4);
    var cg=figma.createFrame(); f.appendChild(cg);
    cg.resize(catW,catH); cg.x=20+col*(catW+catGap); cg.y=qy+row*(catH+catGap);
    cg.cornerRadius=12; cg.fills=solid(cat.color,0.15);
    cg.strokes=solid(cat.color,0.4); cg.strokeWeight=1;
    var clt=figma.createText(); cg.appendChild(clt);
    clt.fontName={family:'Inter',style:'Semi Bold'}; clt.fontSize=11;
    clt.textAlignHorizontal='CENTER'; clt.textAutoResize='HEIGHT'; clt.resize(catW-8,10);
    clt.fills=solid(TH.text); clt.characters=cat.label; clt.x=4; clt.y=44;
  });
  qy+=2*(catH+catGap)+16;
  addSectionHeader(f,'Trending This Week',20,qy,280); qy+=32;
  var tRecs=[
    {title:'Cucumber Salad',time:'10 min',color:'#5A4898'},
    {title:'Marry Me Chicken',time:'32 min',color:'#B898D8'},
    {title:'Brown Butter Rigatoni',time:'25 min',color:'#9070C0'},
    {title:'Street Corn Dip',time:'15 min',color:'#C0A8E0'}
  ];
  tRecs.forEach(function(r,i){
    addRecipeCard(f,20+(i%2)*175,qy+Math.floor(i/2)*138,165,100,r.title,r.time,r.color,null,null);
  });
  addNavBar(f,1);
}

function buildLibrary(x, y) {
  var f=mkFrame('Library — '+TH.name, x, y);
  f.fills=solid(TH.bg);
  addStatusBar(f);
  addText(f,'My Recipes',20,56,24,'Extra Bold',TH.text);
  addText(f,'14 saved',292,64,12,'Regular',TH.muted);
  addFilterChips(f,['All','Quick','Vegan','Baking','TikTok'],0,20,90);
  var libRecs=[
    {title:'Creamy Tuscan Salmon',time:'28 min',rating:'4.9',tag:'Saved',color:'#B898D8'},
    {title:'Avocado Toast',time:'12 min',rating:'4.7',tag:'Quick',color:'#4A3580'},
    {title:'Birria Tacos',time:'3 hr',rating:'4.8',tag:'TikTok',color:'#9070C0'},
    {title:'Thai Green Curry',time:'35 min',rating:'4.6',tag:'Vegetarian',color:'#5A4898'},
    {title:'Miso Glazed Eggplant',time:'22 min',rating:'4.5',tag:'Vegan',color:'#3A2860'},
    {title:'Dubai Chocolate',time:'45 min',rating:'4.9',tag:'Instagram',color:'#261850'},
    {title:'Marry Me Chicken',time:'32 min',rating:'4.9',tag:'',color:'#A888CC'},
    {title:'Homemade Sourdough',time:'4 hr',rating:'4.6',tag:'Baking',color:'#8060B0'}
  ];
  libRecs.forEach(function(r,i){
    addRecipeCard(f,20+(i%2)*175,128+Math.floor(i/2)*158,165,120,r.title,r.time,r.color,r.tag||null,r.rating);
  });
  addNavBar(f,2);
}

function buildRecipeDetail(x, y) {
  var f=mkFrame('Recipe Detail — '+TH.name, x, y);
  f.fills=solid(TH.bg);
  // Hero image area
  var hero=figma.createRectangle(); f.appendChild(hero);
  hero.resize(W,280); hero.x=0; hero.y=0;
  hero.fills=topToBottomGrad(TH.featGrad1,TH.featGrad2);
  var hScrim=figma.createRectangle(); f.appendChild(hScrim);
  hScrim.resize(W,120); hScrim.x=0; hScrim.y=160;
  hScrim.fills=topToBottomGrad('#000000','#000000',[
    {position:0,color:{r:0,g:0,b:0,a:0}},{position:1,color:{r:0,g:0,b:0,a:0.52}}]);
  // Back button
  var backBg=figma.createFrame(); f.appendChild(backBg);
  backBg.resize(36,36); backBg.x=16; backBg.y=52; backBg.cornerRadius=100;
  backBg.fills=solid('#000000',0.3);
  var backT=figma.createText(); backBg.appendChild(backT);
  backT.fontName={family:'Inter',style:'Bold'}; backT.fontSize=14;
  backT.fills=solid('#FFFFFF'); backT.characters='<'; backT.x=11; backT.y=10;
  // Save button
  var saveBg=figma.createFrame(); f.appendChild(saveBg);
  saveBg.resize(36,36); saveBg.x=W-52; saveBg.y=52; saveBg.cornerRadius=100;
  saveBg.fills=solid('#000000',0.3);
  var saveT=figma.createText(); saveBg.appendChild(saveT);
  saveT.fontName={family:'Inter',style:'Regular'}; saveT.fontSize=18;
  saveT.fills=solid('#FFFFFF'); saveT.characters='♥'; saveT.x=8; saveT.y=9;
  // Rating on hero
  var ratBg=figma.createFrame(); f.appendChild(ratBg);
  ratBg.resize(72,24); ratBg.x=20; ratBg.y=244; ratBg.cornerRadius=100;
  ratBg.fills=solid('#000000',0.4);
  var rbt=figma.createText(); ratBg.appendChild(rbt);
  rbt.fontName={family:'Inter',style:'Bold'}; rbt.fontSize=10;
  rbt.fills=solid(TH.accent); rbt.characters='4.9  (284)'; rbt.x=10; rbt.y=6;
  // Title
  addText(f,'Creamy Tuscan Salmon',20,292,22,'Extra Bold',TH.text,{w:310,lh:28});
  // Cuisine badge
  var cuisBg=figma.createFrame(); f.appendChild(cuisBg);
  cuisBg.resize(66,22); cuisBg.x=20; cuisBg.y=326; cuisBg.cornerRadius=100;
  cuisBg.fills=solid(TH.primary,0.12); cuisBg.strokes=solid(TH.primary,0.4); cuisBg.strokeWeight=1;
  var cuisT=figma.createText(); cuisBg.appendChild(cuisT);
  cuisT.fontName={family:'Inter',style:'Semi Bold'}; cuisT.fontSize=10;
  cuisT.fills=solid(TH.primary); cuisT.characters='Italian'; cuisT.x=14; cuisT.y=5;
  // Quick stats
  var stats=[
    {icon:'T',label:'28 min'},{icon:'S',label:'4 serves'},
    {icon:'C',label:'420 cal'},{icon:'D',label:'Medium'}
  ];
  var stX=20;
  stats.forEach(function(st){
    var stw=st.label.length*6+36;
    var stg=figma.createFrame(); f.appendChild(stg);
    stg.resize(stw,40); stg.x=stX; stg.y=358; stg.cornerRadius=10;
    stg.fills=solid(TH.card); stg.strokes=solid(TH.border); stg.strokeWeight=1;
    var stI=figma.createText(); stg.appendChild(stI);
    stI.fontName={family:'Inter',style:'Bold'}; stI.fontSize=10;
    stI.fills=solid(TH.primary); stI.characters=st.icon; stI.x=10; stI.y=6;
    var stL=figma.createText(); stg.appendChild(stL);
    stL.fontName={family:'Inter',style:'Semi Bold'}; stL.fontSize=10;
    stL.fills=solid(TH.text); stL.characters=st.label; stL.x=22; stL.y=14;
    stX+=stw+8;
  });
  // Tabs
  var tabNames=['Ingredients','Instructions','Notes'];
  tabNames.forEach(function(tab,ti){
    var isActive=ti===0;
    var tx2=figma.createText(); f.appendChild(tx2);
    tx2.fontName={family:'Inter',style:isActive?'Bold':'Regular'}; tx2.fontSize=14;
    tx2.fills=solid(isActive ? TH.primary : TH.muted);
    tx2.characters=tab; tx2.x=20+ti*112; tx2.y=412;
    if (isActive){
      var tLine=figma.createRectangle(); f.appendChild(tLine);
      tLine.resize(tab.length*7,3); tLine.x=20; tLine.y=432;
      tLine.cornerRadius=2; tLine.fills=solid(TH.primary);
    }
  });
  addRect(f,0,438,W,1,TH.border);
  // Ingredients
  var ings=[
    '4 salmon fillets (6 oz each)',
    '1 cup heavy cream',
    '1/2 cup sun-dried tomatoes',
    '3 cloves garlic, minced',
    '2 cups fresh spinach',
    '1/4 cup Parmesan, grated'
  ];
  ings.forEach(function(ing,ii){
    var iy=448+ii*40;
    var cb=figma.createRectangle(); f.appendChild(cb);
    cb.resize(20,20); cb.x=20; cb.y=iy; cb.cornerRadius=6;
    cb.fills=solid(TH.chip); cb.strokes=solid(TH.border); cb.strokeWeight=1.5;
    addText(f,ing,50,iy+3,13,'Regular',TH.text,{w:300});
    if (ii<ings.length-1) addRect(f,50,iy+34,310,1,TH.border,0,0.4);
  });
  // Add to list banner
  var gbg=figma.createRectangle(); f.appendChild(gbg);
  gbg.resize(350,48); gbg.x=20; gbg.y=710; gbg.cornerRadius=14;
  gbg.fills=solid(TH.chip); gbg.strokes=solid(TH.secondary,0.5); gbg.strokeWeight=1;
  addText(f,'+ Add all to Grocery List',36,723,13,'Semi Bold',TH.primary,{w:280});
  addButton(f,'Start Cooking',20,768,350,TH.primary,TH.textOnPrimary);
}

function buildGroceryList(x, y) {
  var f=mkFrame('Grocery List — '+TH.name, x, y);
  f.fills=solid(TH.bg);
  addStatusBar(f);
  addText(f,'Grocery List',20,56,24,'Extra Bold',TH.text);
  // Share button
  var shareBg=figma.createFrame(); f.appendChild(shareBg);
  shareBg.resize(64,28); shareBg.x=306; shareBg.y=59; shareBg.cornerRadius=100;
  shareBg.fills=solid(TH.chip); shareBg.strokes=solid(TH.primary,0.4); shareBg.strokeWeight=1;
  var shareT=figma.createText(); shareBg.appendChild(shareT);
  shareT.fontName={family:'Inter',style:'Semi Bold'}; shareT.fontSize=11;
  shareT.fills=solid(TH.primary); shareT.characters='Share'; shareT.x=12; shareT.y=7;
  addFilterChips(f,['All','Produce','Meat','Dairy','Pantry'],0,20,96);
  // Progress bar
  var progBg=figma.createRectangle(); f.appendChild(progBg);
  progBg.resize(350,6); progBg.x=20; progBg.y=138; progBg.cornerRadius=3;
  progBg.fills=solid(TH.border);
  var progFg=figma.createRectangle(); f.appendChild(progFg);
  progFg.resize(206,6); progFg.x=20; progFg.y=138; progFg.cornerRadius=3;
  progFg.fills=solid(TH.primary);
  addText(f,'9 of 23 items checked',20,152,11,'Regular',TH.muted,{w:200});
  // Grocery sections
  var sections=[
    {name:'PRODUCE', items:[
      {name:'Fresh spinach, 2 bags',checked:true},
      {name:'Garlic, 1 head',checked:true},
      {name:'Cherry tomatoes, 1 pint',checked:false},
      {name:'Lemons, 3',checked:false}
    ]},
    {name:'DAIRY & EGGS', items:[
      {name:'Heavy cream, 1 cup',checked:false},
      {name:'Parmesan cheese, block',checked:true},
      {name:'Butter, unsalted',checked:false}
    ]},
    {name:'MEAT & SEAFOOD', items:[
      {name:'Salmon fillets (4)',checked:false},
      {name:'Chicken thighs, 2 lbs',checked:false}
    ]}
  ];
  var curY=172;
  sections.forEach(function(sec){
    addText(f,sec.name,20,curY,10,'Bold',TH.muted,{ls:4}); curY+=22;
    sec.items.forEach(function(item){
      var cb=figma.createRectangle(); f.appendChild(cb);
      cb.resize(22,22); cb.x=20; cb.y=curY; cb.cornerRadius=6;
      if (item.checked) {
        cb.fills=solid(TH.primary);
      } else {
        cb.fills=solid(TH.chip); cb.strokes=solid(TH.border); cb.strokeWeight=1.5;
      }
      var itxt=addText(f,item.name,52,curY+3,13,'Regular',item.checked ? TH.muted : TH.text,{w:290});
      curY+=38;
    });
    addRect(f,20,curY,350,1,TH.border); curY+=14;
  });
  // Add item field
  var addBg=figma.createFrame(); f.appendChild(addBg);
  addBg.resize(350,44); addBg.x=20; addBg.y=curY; addBg.cornerRadius=12;
  addBg.fills=solid(TH.chip); addBg.strokes=solid(TH.border); addBg.strokeWeight=1;
  var addT=figma.createText(); addBg.appendChild(addT);
  addT.fontName={family:'Inter',style:'Regular'}; addT.fontSize=13;
  addT.fills=solid(TH.muted); addT.characters='+ Add an item...'; addT.x=16; addT.y=14;
  addButton(f,'Share List',20,H-142,350,TH.primary,TH.textOnPrimary);
  addNavBar(f,2);
}

// ─── BUILD ONBOARDING SLIDES (shared, 5 frames) ───────────────────────────────
var SLIDES=[
  {title:'Welcome to\nKitchen Bandits',sub:'Outsmart picky eaters.\nFeed your whole crew.',cta:'Get Started',img:'ob-1.png'},
  {title:'Save Recipes\nfrom Anywhere',sub:'TikTok, Reels, websites — grab any\nrecipe in one tap.',cta:'Next',img:'ob-2.png'},
  {title:"What's in\nthe Fridge?",sub:"Scan your ingredients. We'll figure\nout what's for dinner.",cta:'Next',img:'ob-3.png'},
  {title:"Everyone's\nCovered",sub:'Set dietary needs and preferences\nfor every household member.',cta:'Next',img:'ob-4.png'},
  {title:'Shop Without\nthe Stress',sub:'Auto-built grocery lists from your\nweekly meal plan.',cta:"Let's Cook!",img:'ob-5.png'}
];

for (var i=0; i<SLIDES.length; i++) {
  var slide=SLIDES[i];
  builtCount++;
  TH=THEMES.light;
  figma.notify('('+builtCount+'/'+totalFrames+') Slide '+(i+1)+' of 5…');
  await new Promise(function(r){setTimeout(r,40);});
  try {
    var f=mkFrame('Onboarding — Slide '+(i+1), BX+i*(W+GAP), ROW0);
    if (IMGS[slide.img]&&IMGS[slide.img].hash) {
      f.fills=[{type:'IMAGE',scaleMode:'FILL',imageHash:IMGS[slide.img].hash}];
    } else {
      f.fills=topToBottomGrad('#4A3080','#C3B1E1');
      addEllipse(f,Math.round((W-130)/2),230,130,130,'#C3B1E1',0.25);
    }
    var scrim=figma.createRectangle(); f.appendChild(scrim);
    scrim.resize(W,260); scrim.x=0; scrim.y=H-260;
    scrim.fills=[{type:'GRADIENT_LINEAR',gradientTransform:[[0,1,0],[-1,0,1]],gradientStops:[
      {position:0,   color:{r:0.075,g:0.051,b:0.114,a:0}},
      {position:0.28,color:{r:0.075,g:0.051,b:0.114,a:0.55}},
      {position:1,   color:{r:0.075,g:0.051,b:0.114,a:0.96}}
    ]}];
    var dotsStartX=Math.round((W-(5*8+4*6))/2);
    for (var di=0; di<5; di++) {
      var dot=figma.createEllipse(); f.appendChild(dot);
      dot.resize(8,8); dot.x=dotsStartX+di*14; dot.y=H-248;
      dot.fills=solid('#FFFFFF', di===i ? 1 : 0.35);
    }
    addText(f,slide.title,28,H-226,26,'Extra Bold','#FFFFFF',{w:334,align:'CENTER',lh:34});
    var subNode=addText(f,slide.sub,28,H-150,14,'Regular','#FFFFFF',{w:334,align:'CENTER',lh:22});
    subNode.fills=solid('#FFFFFF',0.8);
    addButton(f,slide.cta,28,H-94,334,'#FFFFFF',THEMES.light.primary);
  } catch(e) {
    figma.notify('Slide '+(i+1)+' error: '+(e.message||e),{timeout:8000});
  }
}

// ─── BUILD APP SCREENS × 4 THEMES ─────────────────────────────────────────────
var THEME_KEYS=['light','dark','navy','amber'];
var THEME_ROWS=[ROW1,ROW2,ROW3,ROW4];

for (var ti=0; ti<THEME_KEYS.length; ti++) {
  TH=THEMES[THEME_KEYS[ti]];
  var rowY=THEME_ROWS[ti];
  var thN=TH.name;

  builtCount++;
  figma.notify('('+builtCount+'/'+totalFrames+') '+thN+' — Auth Welcome…');
  await new Promise(function(r){setTimeout(r,40);});
  try { buildAuthWelcome(AX.authWelcome, rowY, kbHash, whiskerHash); }
  catch(e){ figma.notify(thN+' Auth Welcome: '+(e.message||e),{timeout:8000}); }

  builtCount++;
  figma.notify('('+builtCount+'/'+totalFrames+') '+thN+' — Auth Sign In…');
  await new Promise(function(r){setTimeout(r,40);});
  try { buildAuthSignIn(AX.authSignIn, rowY); }
  catch(e){ figma.notify(thN+' Auth Sign In: '+(e.message||e),{timeout:8000}); }

  builtCount++;
  figma.notify('('+builtCount+'/'+totalFrames+') '+thN+' — Onboarding Complete…');
  await new Promise(function(r){setTimeout(r,40);});
  try { buildOnboardingComplete(AX.onboardComplete, rowY, confidentHash); }
  catch(e){ figma.notify(thN+' Onboarding Complete: '+(e.message||e),{timeout:8000}); }

  builtCount++;
  figma.notify('('+builtCount+'/'+totalFrames+') '+thN+' — Home…');
  await new Promise(function(r){setTimeout(r,40);});
  try { buildHome(AX.home, rowY, kbHash); }
  catch(e){ figma.notify(thN+' Home: '+(e.message||e),{timeout:8000}); }

  builtCount++;
  figma.notify('('+builtCount+'/'+totalFrames+') '+thN+' — Search…');
  await new Promise(function(r){setTimeout(r,40);});
  try { buildSearch(AX.search, rowY); }
  catch(e){ figma.notify(thN+' Search: '+(e.message||e),{timeout:8000}); }

  builtCount++;
  figma.notify('('+builtCount+'/'+totalFrames+') '+thN+' — Library…');
  await new Promise(function(r){setTimeout(r,40);});
  try { buildLibrary(AX.library, rowY); }
  catch(e){ figma.notify(thN+' Library: '+(e.message||e),{timeout:8000}); }

  builtCount++;
  figma.notify('('+builtCount+'/'+totalFrames+') '+thN+' — Recipe Detail…');
  await new Promise(function(r){setTimeout(r,40);});
  try { buildRecipeDetail(AX.recipeDetail, rowY); }
  catch(e){ figma.notify(thN+' Recipe Detail: '+(e.message||e),{timeout:8000}); }

  builtCount++;
  figma.notify('('+builtCount+'/'+totalFrames+') '+thN+' — Grocery List…');
  await new Promise(function(r){setTimeout(r,40);});
  try { buildGroceryList(AX.groceryList, rowY); }
  catch(e){ figma.notify(thN+' Grocery List: '+(e.message||e),{timeout:8000}); }
}

// ─── FINISH ───────────────────────────────────────────────────────────────────
figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
figma.closePlugin('Done! '+builtCount+' of '+totalFrames+' frames built.');

} catch(err) {
  var msg=err&&err.message ? err.message : String(err);
  figma.notify('Plugin crashed: '+msg, {timeout:30000});
  figma.closePlugin('KB plugin error: '+msg);
}
})();
