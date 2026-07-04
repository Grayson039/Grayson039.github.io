var CM = (function () {
  'use strict';

  /* ── THEMES ─────────────────────────────────────────────── */
  var D = {
    _name: 'dark',
    bg: '#0A0A0A', card: '#141414', card2: '#1C1C1C',
    primary: '#E8272A', gold: '#D4A853',
    text: '#F2F2F2', sub: '#CCCCCC', muted: '#9A9A9A',
    border: '#242424', chip: '#1A1A1A', chipTx: '#999999',
    overlay: 'rgba(0,0,0,0.8)', live: '#22C55E', win: '#22C55E', loss: '#E8272A', draw: '#F59E0B'
  };
  var L = {
    _name: 'light',
    bg: '#F4F4F4', card: '#FFFFFF', card2: '#F0F0F0',
    primary: '#DC2626', gold: '#A67C00',
    text: '#0F0F0F', sub: '#333333', muted: '#666666',
    border: '#E5E5E5', chip: '#EEEEEE', chipTx: '#555555',
    overlay: 'rgba(0,0,0,0.5)', live: '#16A34A', win: '#16A34A', loss: '#DC2626', draw: '#D97706'
  };

  /* ── TOKENS ──────────────────────────────────────────────── */
  var T = {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    sz: { '2xs': '8px', xs: '9px', sm: '10px', base: '11px', md: '13px', lg: '15px', xl: '18px', '2xl': '24px', '3xl': '32px' },
    wt: { reg: '400', med: '500', semi: '600', bold: '700', heavy: '800', black: '900' }
  };
  var R = { sm: '6px', md: '10px', lg: '14px', xl: '18px', pill: '100px' };
  var S = { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '16px', section: '24px' };
  var HEX = "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2228%22 height=%2249%22%3E%3Cpath d=%22M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.49L26 15v14.98L13 37.48 0 30z%22 fill=%22none%22 stroke=%22%23E8272A%22 stroke-opacity=%220.1%22 stroke-width=%221%22/%3E%3C/svg%3E')";

  /* ── COMPONENTS ──────────────────────────────────────────── */
  var c = {};

  c.statusBar = function (th) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;' +
      'padding:14px 20px 4px;background:' + th.bg + ';font-size:12px;font-weight:600;' +
      'color:' + th.text + ';font-family:' + T.sans + ';flex-shrink:0">' +
      '<span>9:41</span>' +
      '<div style="display:flex;gap:5px;align-items:center">' +
        '<svg width="16" height="12" viewBox="0 0 16 12" fill="' + th.text + '">' +
          '<rect x="0" y="4" width="3" height="8" rx="1" opacity="0.3"/>' +
          '<rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.5"/>' +
          '<rect x="9" y="0.5" width="3" height="11.5" rx="1" opacity="0.7"/>' +
          '<rect x="13.5" y="0" width="2.5" height="12" rx="1"/>' +
        '</svg>' +
        '<svg width="25" height="12" viewBox="0 0 25 12" fill="none">' +
          '<rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="' + th.text + '" stroke-opacity="0.35"/>' +
          '<rect x="22" y="3.5" width="2.5" height="5" rx="1" fill="' + th.text + '" opacity="0.35"/>' +
          '<rect x="2" y="2" width="15" height="8" rx="2" fill="' + th.primary + '"/>' +
        '</svg>' +
      '</div>' +
    '</div>';
  };

  c.notch = function () {
    return '<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);' +
      'width:126px;height:36px;background:#0D0D0D;border-radius:0 0 22px 22px;z-index:10;pointer-events:none"></div>';
  };

  c.navBar = function (th, activeIdx) {
    var items = [
      ['Home',    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
      ['Cards',   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
      ['Fighters','M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
      ['News',    'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6'],
      ['Me',      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z']
    ];
    var ids = ['home', 'cards', 'fighters', 'news', 'me'];
    return '<div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-around;' +
      'align-items:center;padding:10px 0 18px;background:' + th.bg + ';' +
      'border-top:1px solid ' + th.border + ';z-index:20">' +
      items.map(function (item, i) {
        var active = i === activeIdx;
        return '<div onclick="cmGo(\'' + ids[i] + '\')" style="display:flex;flex-direction:column;' +
          'align-items:center;gap:3px;cursor:pointer;color:' + (active ? th.text : th.muted) + ';min-width:44px">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
            'stroke-width="' + (active ? '2.2' : '1.7') + '" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="' + item[1] + '"/></svg>' +
          '<span style="font-size:9px;font-weight:' + (active ? T.wt.semi : T.wt.med) + ';font-family:' + T.sans + '">' + item[0] + '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  };

  c.backBtn = function (th, label, fn) {
    return '<div onclick="' + (fn || 'cmBack()') + '" style="display:inline-flex;align-items:center;' +
      'gap:4px;cursor:pointer;color:' + th.text + ';font-size:13px;font-weight:' + T.wt.semi + ';font-family:' + T.sans + '">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>' +
      (label !== undefined ? label : '') +
    '</div>';
  };

  c.promoBadge = function (promo, bg) {
    bg = bg || '#333333';
    var hex = bg.replace('#', '');
    var r = parseInt(hex.substr(0,2),16) || 0, g = parseInt(hex.substr(2,2),16) || 0, b = parseInt(hex.substr(4,2),16) || 0;
    var luma = 0.299*r + 0.587*g + 0.114*b;
    var textColor = luma > 150 ? '#1A1400' : '#FFFFFF';
    return '<span style="font-size:9px;font-weight:800;letter-spacing:0.08em;padding:2px 8px;border-radius:4px;' +
      'background:' + bg + ';color:' + textColor + '">' + promo + '</span>';
  };

  c.liveBadge = function () {
    return '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;' +
      'background:rgba(34,197,94,0.12);border:1px solid #22C55E;color:#22C55E;' +
      'display:inline-flex;align-items:center;gap:4px;flex-shrink:0">' +
      '<span style="width:5px;height:5px;border-radius:50%;background:#22C55E"></span>LIVE' +
    '</span>';
  };

  c.chip = function (th, label, active, fn) {
    return '<div onclick="' + (fn || '') + '" style="flex-shrink:0;padding:6px 14px;' +
      'border-radius:' + R.pill + ';font-size:11px;font-family:' + T.sans + ';' +
      'font-weight:' + (active ? T.wt.semi : T.wt.med) + ';cursor:pointer;' +
      'background:' + (active ? th.primary : th.chip) + ';' +
      'color:' + (active ? '#FFF' : th.chipTx) + ';' +
      'border:1px solid ' + (active ? th.primary : th.border) + '">' + label + '</div>';
  };

  c.sectionHeader = function (th, title, action, fn) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;' +
      'padding:0 ' + S.xl + ';margin-bottom:10px">' +
      '<div style="font-size:16px;font-weight:' + T.wt.bold + ';color:' + th.text + ';font-family:' + T.sans + '">' + title + '</div>' +
      (action ? '<div onclick="' + (fn || '') + '" style="font-size:11px;color:' + th.sub + ';font-weight:' + T.wt.med + ';cursor:pointer">' + action + '</div>' : '') +
    '</div>';
  };

  c.fightRow = function (th, fight) {
    var isTitle   = !!fight.title;
    var isMain    = !!fight.main;
    var isTBD     = !fight.b || fight.b === 'TBD';
    var isCanceled = !!fight.canceled;
    var aIsChamp  = fight.aRank && fight.aRank.toLowerCase().indexOf('champion') >= 0;
    var bIsChamp  = !isTBD && fight.bRank && fight.bRank.toLowerCase().indexOf('champion') >= 0;
    var sameGym   = fight.aGym && fight.bGym && fight.aGym === fight.bGym;
    var hasOdds   = !isTBD && (fight.aOdds !== undefined && fight.bOdds !== undefined);

    function oddsDisplay(odds) {
      if (odds === undefined) return null;
      return {
        formatted: odds > 0 ? '+' + odds : String(odds),
        color: odds < 0 ? th.muted : th.live
      };
    }
    var aO = oddsDisplay(fight.aOdds);
    var bO = oddsDisplay(fight.bOdds);

    return '<div onclick="cmGo(\'fighter\')" style="padding:12px ' + S.xl + ';border-bottom:1px solid ' + th.border + ';cursor:pointer;' +
      'background:' + (isTitle ? (th._name === 'dark' ? 'rgba(212,168,83,0.06)' : 'rgba(212,168,83,0.07)') : 'transparent') + ';' +
      (isCanceled ? 'opacity:0.4;' : '') + '">' +

      /* Weight class row */
      '<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">' +
        (isTitle
          ? '<span style="font-size:9px;color:' + th.gold + ';font-weight:700;letter-spacing:0.05em">🏆 ' + fight.weightClass.toUpperCase() + ' CHAMPIONSHIP</span>'
          : '<span style="font-size:9px;color:' + th.muted + ';font-weight:500;letter-spacing:0.07em;text-transform:uppercase">' + fight.weightClass + '</span>') +
        '<span style="font-size:9px;color:' + th.muted + ';font-weight:500">· ' + (fight.rounds || 3) + ' Rds</span>' +
        (sameGym
          ? '<span style="margin-left:auto;font-size:8px;font-weight:700;padding:2px 7px;border-radius:4px;' +
            'background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.4);color:#F59E0B;letter-spacing:0.04em">⚠ SAME GYM</span>'
          : '') +
        (isCanceled
          ? '<span style="margin-left:auto;font-size:8px;font-weight:700;padding:2px 7px;border-radius:4px;' +
            'background:rgba(155,155,155,0.1);border:1px solid rgba(155,155,155,0.25);color:' + th.muted + ';letter-spacing:0.06em">CANCELED</span>'
          : '') +
      '</div>' +

      /* Fighters row */
      '<div style="display:flex;align-items:center">' +

        /* Fighter A */
        '<div style="flex:1">' +
          '<div style="font-size:' + (isMain ? '15px' : '13px') + ';font-weight:' + T.wt.heavy + ';color:' + (aIsChamp ? th.gold : th.text) + ';line-height:1.2;font-family:' + T.sans + '">' + fight.a + '</div>' +
          (fight.aRank ? '<div style="font-size:9px;color:' + th.muted + ';font-weight:500;margin-top:2px">' + fight.aRank + '</div>' : '') +
        '</div>' +

        /* VS + inline odds pill */
        '<div style="padding:0 12px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:5px">' +
          '<div style="font-size:10px;font-weight:800;color:' + th.muted + ';letter-spacing:0.05em">VS</div>' +
          (hasOdds && aO && bO
            ? '<div style="background:rgba(255,255,255,0.04);border:1px solid ' + th.border + ';border-radius:100px;' +
              'padding:2px 8px;display:flex;align-items:center;gap:4px;white-space:nowrap">' +
                '<span style="font-size:9px;font-weight:700;color:' + aO.color + ';font-variant-numeric:tabular-nums">' + aO.formatted + '</span>' +
                '<span style="font-size:8px;color:rgba(255,255,255,0.2)">|</span>' +
                '<span style="font-size:9px;font-weight:700;color:' + bO.color + ';font-variant-numeric:tabular-nums">' + bO.formatted + '</span>' +
              '</div>'
            : '') +
        '</div>' +

        /* Fighter B */
        '<div style="flex:1;text-align:right">' +
          (isTBD
            ? '<div style="font-size:' + (isMain ? '15px' : '13px') + ';font-weight:' + T.wt.heavy + ';color:' + th.muted + ';line-height:1.2;font-family:' + T.sans + ';font-style:italic">TBD</div>'
            : '<div style="font-size:' + (isMain ? '15px' : '13px') + ';font-weight:' + T.wt.heavy + ';color:' + (bIsChamp ? th.gold : th.text) + ';line-height:1.2;font-family:' + T.sans + '">' + fight.b + '</div>') +
          (!isTBD && fight.bRank ? '<div style="font-size:9px;color:' + th.muted + ';font-weight:500;margin-top:2px">' + fight.bRank + '</div>' : '') +
        '</div>' +

      '</div>' +

    '</div>';
  };

  c.resultRow = function (th, fight) {
    var resultColor = fight.result === 'W' ? th.win : fight.result === 'L' ? th.loss : th.draw;
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px ' + S.xl + ';border-bottom:1px solid ' + th.border + '">' +
      '<div style="width:24px;height:24px;border-radius:6px;background:' + resultColor + '20;' +
        'border:1.5px solid ' + resultColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
        '<span style="font-size:10px;font-weight:800;color:' + resultColor + '">' + fight.result + '</span>' +
      '</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:12px;font-weight:' + T.wt.bold + ';color:' + th.text + '">' + fight.opponent + '</div>' +
        '<div style="font-size:10px;color:' + th.muted + ';margin-top:1px">' + fight.method + ' · ' + fight.event + '</div>' +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0">' +
        '<div style="font-size:10px;color:' + th.muted + '">' + fight.date + '</div>' +
      '</div>' +
    '</div>';
  };

  /* ── NAVIGATION ──────────────────────────────────────────── */
  function nav(screens, start, containerId, opts) {
    var state = { cur: start, dark: true, history: [] };
    if (opts && opts.state) { Object.keys(opts.state).forEach(function (k) { state[k] = opts.state[k]; }); }

    function render() {
      var th = state.dark ? D : L;
      var el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = screens[state.cur] ? screens[state.cur](th, state) : '<div style="color:red;padding:20px">Screen not found: ' + state.cur + '</div>';
      el.style.backgroundColor = th.bg;
      el.style.backgroundImage = '';
      el.style.backgroundSize = '';
      if (opts && opts.onRender) opts.onRender(state, th);
    }

    window.cmGo = function (id) { if (!screens[id]) return; state.history.push(state.cur); state.cur = id; render(); };
    window.cmBack = function () { if (state.history.length) { state.cur = state.history.pop(); render(); } };
    window.cmSetState = function (k, v) { state[k] = v; render(); };
    window.cmToggleState = function (k) { state[k] = !state[k]; render(); };
    window.cmToggleTheme = function () {
      state.dark = !state.dark; render();
      var btn = document.getElementById('theme-btn');
      if (btn) btn.textContent = state.dark ? '☀ Light' : '☾ Dark';
    };
    window.cmState = state;
    window.cmRender = render;

    render();
  }

  return { D: D, L: L, T: T, R: R, S: S, HEX: HEX, c: c, nav: nav };
})();
