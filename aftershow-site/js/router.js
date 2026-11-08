// Hash router (works on static hosting with no rewrite rules). Each route renders into a fresh container;
// a render token makes sure a slow view can never paint over the screen the user has since moved to.
import { app, skeleton, errorState } from './ui.js';
import { friendlyError, esc } from './util.js';

let token = 0;
const compile = (pattern) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  return { re, keys };
};

export function currentPath() {
  const h = location.hash.replace(/^#/, '') || '/shows';
  const [path, qs] = h.split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(qs || '')) };
}
export const go = (hash) => { if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = hash; };

export function startRouter({ root, routes, gate, onRoute }) {
  const compiled = routes.map((r) => ({ ...r, ...compile(r.path) }));

  async function run() {
    const my = ++token;
    const { path, query } = currentPath();
    if (gate) { const redirect = gate(path); if (redirect) { location.replace('#' + redirect); return; } }
    let match = null, params = {};
    for (const r of compiled) {
      const m = path.match(r.re);
      if (m) { match = r; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]))); break; }
    }
    const view = document.createElement('div');
    view.className = 'view' + (match?.narrow ? ' narrow' : '') + (match?.classic ? ' classic' + (match.classic === 'rail' ? ' classic-rail' : '') : '');
    root.replaceChildren(view);
    onRoute?.(match, path);
    const alive = () => my === token;
    const ctx = {
      params, query, view, path,
      alive,
      setHTML(html) { if (alive()) view.innerHTML = html; },
      // run an async loader; show friendly error + retry instead of a blank screen
      async guard(fn) {
        try { const v = await fn(); return alive() ? v : null; }
        catch (e) {
          console.error(e);
          if (alive()) { e.friendly = friendlyError(e); view.innerHTML = errorState(e); }
          return null;
        }
      },
      on(evt, sel, handler) {
        view.addEventListener(evt, (ev) => { const t = ev.target.closest(sel); if (t && view.contains(t)) handler(ev, t); });
      },
      rerun: () => run()
    };
    ctx.on('click', '[data-action=retry]', () => run());
    if (!match) {
      view.innerHTML = `<div class="card"><div class="eyebrow">404</div><h1 class="title" tabindex="-1">Nothing here.</h1><p class="sub">That page doesn’t exist. <a href="#/shows">Back to your shows</a>.</p></div>`;
      document.title = 'Not found · Aftershow';
    } else {
      document.title = (match.title || 'Aftershow') + ' · Aftershow';
      view.innerHTML = skeleton(3);
      try { await match.view(ctx); }
      catch (e) { console.error(e); e.friendly = friendlyError(e); if (alive()) view.innerHTML = errorState(e); }
    }
    if (alive()) {
      const h = view.querySelector('h1');
      window.scrollTo(0, 0);
      if (h && !location.hash.includes('noscroll')) h.focus({ preventScroll: true });
      const live = document.getElementById('route-announcer'); if (live) live.textContent = document.title;
    }
  }
  window.addEventListener('hashchange', run);
  run();
  return { run };
}
