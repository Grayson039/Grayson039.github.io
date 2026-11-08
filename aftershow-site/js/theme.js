// Theme handling: "dark" = Marshall Dark, "light" = Orange Vintage. Stored per-browser and mirrored to the profile.
import { app } from './ui.js';

const KEY = 'aftershow-theme';
export function initialTheme() {
  try { const t = localStorage.getItem(KEY); if (t === 'dark' || t === 'light') return t; } catch { /* storage blocked */ }
  return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
export function applyTheme(t) {
  app.theme = t;
  document.documentElement.dataset.theme = t;
  document.body.dataset.theme = t;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#0C0C0C' : '#EDE6D3');
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} theme`));
}
export const toggleTheme = () => { applyTheme(app.theme === 'dark' ? 'light' : 'dark'); app.api?.updateMyProfile?.({ theme: app.theme }).catch(() => {}); };
