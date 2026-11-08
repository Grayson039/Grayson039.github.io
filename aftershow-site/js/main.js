// Aftershow app bootstrap: pick backend (live Supabase or local demo), auth gate, shell, router.
import { app, avatar, toast, coverStyle, posterWall, passwordDialog } from './ui.js';
import { esc, friendlyError } from './util.js';
import { startRouter, currentPath } from './router.js';
import { initialTheme, applyTheme, toggleTheme } from './theme.js';
import { myShows, stats } from './views/archive.js';
import { entryDetail } from './views/entry.js';
import { feed } from './views/feed.js';
import { logShow } from './views/log.js';
import { search, artistPage, showPage, venuePage } from './views/discover.js';
import { profile, follows, meRedirect } from './views/profile.js';
import { settings } from './views/settings.js';
import { onboarding } from './views/onboarding.js';
import { importCsv } from './views/import.js';
import { activity } from './views/activity.js';
import { installCovers } from './covers.js';
import { vote } from './views/vote.js';
import { refreshBadge } from './activity.js';

window.__asLoaded = true; // tells the inline guard in app.html that the bundle executed
const $ = (s) => document.querySelector(s);
const qs = new URLSearchParams(location.search);
const TOUR = qs.has('tour'); // landing-page product tour: demo data, auto sign-in, mode is not persisted
if (qs.has('demo')) localStorage.setItem('aftershow-mode', 'demo');
if (qs.get('live') === '1') localStorage.setItem('aftershow-mode', 'live');
app.mode = TOUR || localStorage.getItem('aftershow-mode') === 'demo' ? 'demo' : 'live';
if (TOUR) document.body.classList.add('tour');
applyTheme(initialTheme());

const NAV = [
  { id: 'shows', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7z"/><path d="M14.5 7v10" stroke-dasharray="2 2"/></svg>', label: 'My Shows', href: '#/shows' },
  { id: 'feed', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h3l2.5-7 4 14 3-9 1.5 2H21"/></svg>', label: 'Feed', href: '#/feed/friends' },
  { id: 'log', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>', label: 'Log a Show', href: '#/log', cta: true },
  { id: 'discover', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4"/></svg>', label: 'Discover', href: '#/search' },
  { id: 'vote', side: true, icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>', label: 'Vote', href: '#/vote' },
  { id: 'activity', side: true, icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>', label: 'Activity', href: '#/activity' },
  { id: 'me', bottomOnly: true, icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/></svg>', label: 'Me', href: '#/me' }
];
function navGroup(path) {
  if (/^\/(shows|stats|entry)/.test(path)) return 'shows';
  if (/^\/feed/.test(path)) return 'feed';
  if (/^\/log/.test(path)) return 'log';
  if (/^\/activity/.test(path)) return 'activity';
  if (/^\/vote/.test(path)) return 'vote';
  if (/^\/(search|artist|show|venue)/.test(path)) return 'discover';
  const m = path.match(/^\/u\/([^/]+)/);
  if (m) return decodeURIComponent(m[1]).toLowerCase() === app.profile?.username.toLowerCase() ? 'me' : 'discover';
  return 'me';
}
function paintNav(path) {
  const active = navGroup(path);
  $('#sidenav').innerHTML = NAV.filter((n) => !n.cta && !n.bottomOnly).map((n) => `<a class="nav-item ${n.id === active ? 'active' : ''}" href="${n.href}" ${n.id === active ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${n.icon}</span><span>${n.label}</span>${n.id === 'activity' ? '<i class="nav-dot" hidden></i>' : ''}</a>`).join('');
  paintBadge();
  const chip = $('#userChip'); chip.classList.toggle('active', active === 'me'); if (active === 'me') chip.setAttribute('aria-current', 'page'); else chip.removeAttribute('aria-current');
  $('#navCta').innerHTML = '<a class="btn-accent wide" href="#/log">+ Log a show</a>';
  $('#bottomNav').innerHTML = NAV.filter((n) => !n.side).map((n) => n.cta
    ? `<a class="bnav-item" href="${n.href}" aria-label="${n.label}"><span class="bnav-log" aria-hidden="true">${n.icon}</span></a>`
    : `<a class="bnav-item ${n.id === active ? 'active' : ''}" href="${n.href}" ${n.id === active ? 'aria-current="page"' : ''}><span class="bnav-icon" aria-hidden="true">${n.icon}</span><span class="bnav-label">${n.label}</span></a>`).join('');
}
function paintBadge() {
  const n = app.unread || 0;
  document.querySelectorAll('.nav-dot, .bell-dot').forEach((d) => { d.hidden = !n; d.textContent = n > 9 ? '9+' : String(n); });
}
document.addEventListener('badge-changed', paintBadge);
function paintUser() {
  const p = app.profile; if (!p) return;
  $('#userChip').innerHTML = `${avatar(p.avatarUrl, p.username, 30)}<span class="user-info"><span class="user-name">${esc(p.username)}</span>${app.mode === 'demo' ? '<span class="user-meta">Demo mode</span>' : ''}</span>`;
  $('#userChip').href = '#/me';
  $('#modeBanner').hidden = app.mode !== 'demo';
}
document.addEventListener('profile-changed', paintUser);
document.addEventListener('password-recovery', async () => { const pw = await passwordDialog(); if (!pw) return; try { await app.api.updatePassword(pw); toast('Password updated'); } catch (e) { toast(friendlyError(e), 'error'); } });
document.addEventListener('click', (e) => { if (e.target.closest('#signOutBtn')) app.api?.signOut?.(); });

const ROUTES = [
  { path: '/shows', title: 'My Shows', view: myShows, classic: 'rail' }, { path: '/stats', title: 'Stats', view: stats, classic: true },
  { path: '/entry/:id', title: 'Show', view: entryDetail },
  { path: '/feed', title: 'Feed', view: (c) => { c.params.tab = 'friends'; return feed(c); } }, { path: '/feed/:tab', title: 'Feed', view: feed },
  { path: '/log', title: 'Log a Show', view: logShow }, { path: '/log/:id', title: 'Edit Show', view: logShow },
  { path: '/search', title: 'Discover', view: search }, { path: '/artist/:id', title: 'Artist', view: artistPage },
  { path: '/show/:id', title: 'Show', view: showPage }, { path: '/venue/:id', title: 'Venue', view: venuePage },
  { path: '/me', title: 'Me', view: async () => meRedirect() },
  { path: '/u/:username', title: 'Profile', view: profile }, { path: '/u/:username/:kind', title: 'Social', view: follows },
  { path: '/settings', title: 'Settings', view: settings, narrow: true }, { path: '/activity', title: 'Activity', view: activity }, { path: '/vote', title: 'Vote on photos', view: vote },
  { path: '/welcome', title: 'Welcome', view: onboarding }, { path: '/import', title: 'Import', view: importCsv, narrow: true }
];
let routerStarted = false, badgeTimer = null;
function startApp() {
  $('#gate').hidden = true; $('#app').hidden = false;
  paintUser();
  refreshBadge(); clearInterval(badgeTimer); badgeTimer = setInterval(refreshBadge, 90000);
  if (!routerStarted) {
    routerStarted = true;
    if (!location.hash) location.replace('#/shows');
    startRouter({
      root: $('#main'), routes: ROUTES,
      gate: (path) => (!app.profile.onboarded && !['/welcome', '/import', '/log', '/settings'].includes(path) ? '/welcome' : null),
      onRoute: (_, path) => paintNav(path)
    });
  } else { location.hash = '#/shows'; window.dispatchEvent(new HashChangeEvent('hashchange')); }
}

/* ---------- auth gate ---------- */
const gateState = { signup: false };
function paintGate(message = '', kind = 'error') {
  $('#app').hidden = true; $('#gate').hidden = false;
  const demo = app.mode === 'demo';
  const su = gateState.signup;
  const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  $('#gate').innerHTML = `<div class="gate-split">
    <aside class="gate-brand">
      ${posterWall()}
      <a class="gate-logo serif" href="index.html" aria-label="Aftershow home">aftershow<span>.</span></a>
      <div class="gate-pitch">
        <h1 class="gate-h1">Your whole life,<br>in setlists.</h1>
        <p class="gate-lede">Log any show you’ve ever been to. No ticket, no proof. Just the night, as well as you remember it.</p>
        <ul class="gate-points">
          <li>${check}Log live, or from memory</li>
          <li>${check}Import your Concert Archives history</li>
          <li>${check}Stats, setlists and photos that last</li>
        </ul>
      </div>
      <p class="gate-stats">Setlists · Photos · Posters · <b>One</b> place for the whole night</p>
      <p class="gate-foot">The show never really ends.</p>
    </aside>
    <section class="gate-form">
      <div class="gate-strip" aria-hidden="true">${['Tool.jpg', 'BrunoMarsSuit.jpg', 'NineInchNailsArms.jpg', 'Deftones.jpg', 'PhoebeBridgers.jpg', 'MoeShop.jpg'].map((f) => `<span style="--photo:url('${f}')"></span>`).join('')}</div>
      <header class="gate-top"><a class="back" href="index.html">← Back to Aftershow</a>
        <button class="theme-toggle compact" type="button" data-theme-toggle id="gateTheme" aria-label="Toggle theme"><span class="knob" aria-hidden="true"><i></i></span></button></header>
      <main class="auth-card" aria-labelledby="gateTitle">
        <h2 class="gate-title serif" id="gateTitle">${su ? 'Start your archive.' : 'Welcome back.'}</h2>
        <p class="sub">${demo ? 'Demo mode: sample data, stored only in this browser.' : su ? 'Free to join. Your first show unlocks everything.' : 'Sign in to see your shows.'}</p>
        ${demo ? '<button class="demo-hero" type="button" data-gate="demo-login"><span class="pilot on" aria-hidden="true"></span><span><b>Continue as Grayson039</b><small>A full sample archive with friends, photos and setlists</small></span><i aria-hidden="true">→</i></button><div class="or"><span>or use your own account</span></div>' : ''}
        <div class="toggle-row" role="radiogroup" aria-label="Sign in or sign up">
          <button type="button" class="toggle-opt ${su ? '' : 'active'}" role="radio" aria-checked="${!su}" data-gate="signin">Sign in</button>
          <button type="button" class="toggle-opt ${su ? 'active' : ''}" role="radio" aria-checked="${su}" data-gate="signup">Sign up</button></div>
        <form id="authForm" novalidate>
          ${su ? '<div class="field"><label for="aUser">Username</label><input id="aUser" autocomplete="username" required placeholder="e.g. Grayson039"></div>' : ''}
          <div class="field"><label for="aEmail">Email</label><input id="aEmail" type="email" autocomplete="email" required placeholder="you@example.com"></div>
          <div class="field"><label for="aPass">Password</label><input id="aPass" type="password" autocomplete="${su ? 'new-password' : 'current-password'}" required minlength="6" placeholder="At least 6 characters"></div>
          ${!su && !demo ? '<p class="gate-forgot"><button type="button" class="link-btn" data-gate="forgot">Forgot password?</button><button type="button" class="link-btn" data-gate="link">Email me a sign-in link</button></p>' : ''}
          ${su ? '<label class="agree"><input type="checkbox" id="aAge" required><span>I’m 13 or older and agree to the <a href="terms.html" target="_blank" rel="noopener">Terms</a> and <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>' : ''}
          <div class="auth-msg ${kind}" id="authMsg" role="alert">${esc(message)}</div>
          <button class="btn-block" type="submit" id="authBtn">${su ? 'Create account' : 'Sign in'}</button>
        </form>
        <p class="gate-trust">13 and older · Your shows stay yours · Export anytime</p>
        <div class="gate-alt">${demo
          ? '<button class="btn" type="button" data-gate="live">Use a real account instead</button>'
          : '<button class="btn" type="button" data-gate="demo">Explore in demo mode first</button>'}</div>
      </main>
      <p class="gate-legal"><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="photo-ugc-license.html">Photo &amp; UGC License</a></p>
    </section>
  </div>`;
  const e = $('#aEmail'); if (e && !demo) e.focus();
  $('#gateTheme').onclick = toggleTheme;
}

document.addEventListener('click', async (ev) => {
  const g = ev.target.closest('[data-gate]'); if (!g) return;
  const act = g.dataset.gate;
  if (act === 'signin' || act === 'signup') { gateState.signup = act === 'signup'; paintGate(); }
  if (act === 'demo') { localStorage.setItem('aftershow-mode', 'demo'); location.reload(); }
  if (act === 'live') { localStorage.setItem('aftershow-mode', 'live'); location.reload(); }
  if (act === 'forgot' || act === 'link') {
    const email = $('#aEmail').value.trim(), msg = $('#authMsg');
    if (!email) { msg.className = 'auth-msg error'; msg.textContent = 'Enter your email above first.'; return; }
    try {
      if (act === 'forgot') await app.api.resetPassword(email); else await app.api.signInWithLink(email);
      msg.className = 'auth-msg ok'; msg.textContent = act === 'forgot' ? 'If that email has an account, a reset link is on its way.' : 'Check your email for a sign-in link.';
    } catch (e) { msg.className = 'auth-msg error'; msg.textContent = friendlyError(e); }
  }
  if (act === 'demo-login') { try { const { DEMO_LOGIN } = await import('./backends/demo.js'); await app.api.signIn(DEMO_LOGIN.email, DEMO_LOGIN.password); } catch (e) { paintGate(friendlyError(e)); } }
});
document.addEventListener('submit', async (ev) => {
  if (ev.target.id !== 'authForm') return;
  ev.preventDefault();
  const email = $('#aEmail').value.trim(), password = $('#aPass').value, username = $('#aUser')?.value.trim();
  const msg = $('#authMsg'), btn = $('#authBtn'); msg.textContent = ''; msg.className = 'auth-msg error';
  if (!email || !password) { msg.textContent = 'Enter your email and password.'; return; }
  if (gateState.signup && !document.querySelector('#aAge')?.checked) { msg.textContent = 'Please confirm you are 13 or older and agree to the Terms and Privacy Policy.'; return; }
  if (gateState.signup && !/^[A-Za-z0-9_.\-]{3,24}$/.test(username || '')) { msg.textContent = 'Pick a username: 3–24 letters, numbers, _ . or -'; return; }
  if (password.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return; }
  btn.disabled = true;
  try {
    if (gateState.signup) { localStorage.setItem('aftershow-pending-consent', JSON.stringify({ ageConfirmedAt: new Date().toISOString(), termsVersion: '2026-11-05' })); const r = await app.api.signUp(email, password, username); if (r.needsConfirm) { msg.className = 'auth-msg ok'; msg.textContent = 'Account created — check your email to confirm, then sign in.'; gateState.signup = false; } }
    else await app.api.signIn(email, password);
  } catch (e) { msg.textContent = friendlyError(e); }
  btn.disabled = false;
});

/* ---------- boot ---------- */
async function onUser(user) {
  if (user && app.profile && app.profile.id === user.id) return; // token refresh / duplicate INITIAL_SESSION
  if (!user) { app.profile = null; if (location.hash) history.replaceState(null, '', location.pathname + location.search); paintGate(); return; }
  try {
    app.profile = await app.api.getMyProfile();
    const pending = localStorage.getItem('aftershow-pending-consent'); // record when the 13+ and terms box was ticked
    if (pending) { try { app.profile = { ...app.profile, ...(await app.api.updateMyProfile({ settings: JSON.parse(pending) })) }; localStorage.removeItem('aftershow-pending-consent'); } catch { /* retried next sign-in */ } }
    if (app.profile.theme && !localStorage.getItem('aftershow-theme')) applyTheme(app.profile.theme);
    startApp();
  } catch (e) { console.error(e); paintGate(friendlyError(e)); }
}
function bootHelp() {
  const b = $('#boot'); if (!b) return;
  b.innerHTML = `<div class="boot-logo">aftershow<span>.</span></div><p class="sub" style="max-width:34ch;text-align:center">This is taking longer than usual. Check your connection, or skip the server and use sample data.</p>
    <div class="empty-actions"><button class="btn primary" type="button" id="bootReload">Reload</button><button class="btn" type="button" id="bootDemo">Use demo mode</button><button class="btn" type="button" id="bootReset">Reset saved data</button></div>`;
  $('#bootReload').onclick = () => location.reload();
  $('#bootDemo').onclick = () => { localStorage.setItem('aftershow-mode', 'demo'); location.href = location.pathname; };
  $('#bootReset').onclick = () => { Object.keys(localStorage).filter((k) => k.startsWith('aftershow')).forEach((k) => localStorage.removeItem(k)); location.href = location.pathname; };
}
async function boot() {
  const watchdog = setTimeout(bootHelp, 7000);
  $('#themeToggle').onclick = $('#themeToggleMobile').onclick = toggleTheme;
  window.addEventListener('storage', (e) => { if (e.key === 'aftershow-theme' && (e.newValue === 'dark' || e.newValue === 'light')) applyTheme(e.newValue); });
  window.addEventListener('offline', () => { $('#offline').hidden = false; });
  window.addEventListener('online', () => { $('#offline').hidden = true; toast('Back online'); });
  try {
    const mod = await import(app.mode === 'demo' ? './backends/demo.js' : './backends/supabase.js');
    app.api = mod.api;
    installCovers(app.api);
    const user = await app.api.init();
    app.api.onAuth(onUser);
    clearTimeout(watchdog); $('#boot').remove();
    if (TOUR && !user) { await app.api.signIn(mod.DEMO_LOGIN.email, mod.DEMO_LOGIN.password); return; }
    await onUser(user);
  } catch (e) {
    console.error(e);
    clearTimeout(watchdog); $('#boot')?.remove();
    app.api = app.api || { mode: 'live' };
    paintGate(friendlyError(e));
  }
}
boot();

/* ---------- keyboard shortcuts (ignored while typing) ---------- */
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || !app.profile) return;
  if (e.target.closest?.('input,textarea,select,[contenteditable],dialog,[role=slider]')) return;
  if (document.querySelector('.ob-stage')) return;
  if (e.key === 'n') location.hash = '#/log';
  else if (e.key === 'v') location.hash = '#/vote';
  else if (e.key === 'g') location.hash = '#/shows';
  else if (e.key === '/') { e.preventDefault(); location.hash = '#/search'; setTimeout(() => document.querySelector('#q')?.focus(), 450); }
  else if (e.key === '?') toast('Shortcuts: N new show · V vote · G my shows · / search');
});
/* pause the drifting poster wall when the tab is hidden */
document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('is-hidden', document.hidden));
