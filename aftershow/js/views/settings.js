// Settings: profile, appearance, privacy, notifications, data export, account.
import { app, pageHeader, sectionHead, tabs, avatar, toast, confirmDialog } from '../ui.js';
import { esc, friendlyError, downloadFile } from '../util.js';
import { applyTheme } from '../theme.js';

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export async function settings(ctx) {
  const p = app.profile; const s = p.settings || {};
  const demo = app.mode === 'demo';
  const user = await ctx.guard(() => app.api.getMyProfile());
  if (!user) return;
  const toggle = (id, label, hint, on) => `<label class="switch-row" for="${id}"><span><span class="user-name">${label}</span><span class="user-meta">${hint}</span></span><input type="checkbox" role="switch" id="${id}" ${on ? 'checked' : ''}></label>`;
  ctx.setHTML(`${pageHeader('Settings', 'Preferences.', 'Profile, privacy, appearance and your data.')}
    ${sectionHead('Profile')}
    <form class="card" id="profileForm">
      <div class="avatar-edit">${avatar(p.avatarUrl, p.username, 64)}<div><label class="btn" for="avatarFile">Change photo</label><input id="avatarFile" type="file" accept="image/*" class="sr-only"><p class="sub" id="avatarStatus" role="status"></p></div></div>
      <div class="field"><label for="sUser">Username</label><input id="sUser" value="${esc(p.username)}" autocomplete="username" pattern="[A-Za-z0-9_.\\-]{3,24}" aria-describedby="sUserHint"><p class="sub" id="sUserHint">3–24 letters, numbers, _ . -</p></div>
      <div class="field"><label for="sName">Display name</label><input id="sName" value="${esc(p.displayName)}" maxlength="40"></div>
      <div class="field"><label for="sBio">Bio</label><textarea id="sBio" rows="3" maxlength="200">${esc(p.bio)}</textarea></div>
      <div class="err form-err" id="profileErr" role="alert"></div>
      <button class="btn-block" type="submit">Save profile</button>
    </form>
    ${sectionHead('Appearance')}
    <div class="card"><div class="toggle-row" role="radiogroup" aria-label="Theme">
      <button type="button" class="toggle-opt ${app.theme === 'dark' ? 'active' : ''}" role="radio" aria-checked="${app.theme === 'dark'}" data-theme-pick="dark">Marshall Dark</button>
      <button type="button" class="toggle-opt ${app.theme === 'light' ? 'active' : ''}" role="radio" aria-checked="${app.theme === 'light'}" data-theme-pick="light">Orange Vintage</button></div></div>
    ${sectionHead('Privacy & notifications')}
    <div class="card list-card">
      ${toggle('sPrivate', 'Private mode', 'Only you and your followers see your logs. Your posters use only your own photos, and you sit out the cover vote.', s.private)}
      ${toggle('sNotifFollow', 'New followers', 'Preference saved; email delivery ships with launch.', s.notifyFollowers !== false)}
      ${toggle('sNotifLike', 'Likes on your logs', 'Preference saved; email delivery ships with launch.', s.notifyLikes !== false)}
    </div>
    ${sectionHead('Friends')}
    <div class="card"><p class="sub">Browsers can’t read your contacts, so we don’t pretend to. Find people by username, or send them your invite link.</p>
      <div class="detail-actions"><a class="btn" href="#/search">Find people</a><button class="btn" type="button" data-action="copy-invite">Copy invite link</button></div></div>
    ${sectionHead('Your data')}
    <div class="card"><p class="sub">Your archive is yours. Export anytime, or bring your history in from another tracker.</p>
      <div class="detail-actions"><a class="btn primary" href="#/import">Import CSV</a><button class="btn" type="button" data-action="export-csv">Export CSV</button><button class="btn" type="button" data-action="export-json">Export JSON</button></div></div>
    ${sectionHead('Account')}
    <div class="card">${demo ? '<p class="sub">You’re in <strong>demo mode</strong>: everything is stored in this browser only.</p>' : ''}
      <div class="detail-actions"><button class="btn" type="button" data-action="signout">Sign out</button>
      <button class="btn danger" type="button" data-action="delete-account">${demo ? 'Delete account (resets demo)' : 'Delete account'}</button>
      ${demo ? '<button class="btn" type="button" data-action="reset-demo">Reset demo data</button><button class="btn" type="button" data-action="exit-demo">Exit demo mode</button>' : ''}</div></div>`);

  ctx.on('click', '[data-theme-pick]', (_, b) => {
    applyTheme(b.dataset.themePick);
    ctx.view.querySelectorAll('[data-theme-pick]').forEach((x) => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-checked', on); });
    app.api.updateMyProfile({ theme: app.theme }).catch(() => {});
  });
  const savePref = async (patch) => { try { app.profile = { ...app.profile, ...(await app.api.updateMyProfile({ settings: patch })) }; toast('Saved'); } catch (e) { toast(friendlyError(e), 'error'); } };
  ctx.on('change', '#sPrivate', (_, el) => savePref({ private: el.checked }));
  ctx.on('change', '#sNotifFollow', (_, el) => savePref({ notifyFollowers: el.checked }));
  ctx.on('change', '#sNotifLike', (_, el) => savePref({ notifyLikes: el.checked }));
  ctx.on('submit', '#profileForm', async (ev, form) => {
    ev.preventDefault();
    const err = form.querySelector('#profileErr'); err.textContent = '';
    const username = form.querySelector('#sUser').value.trim();
    if (!/^[A-Za-z0-9_.\-]{3,24}$/.test(username)) { err.textContent = 'Username must be 3–24 letters, numbers, _ . or -'; form.querySelector('#sUser').focus(); return; }
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      app.profile = { ...app.profile, ...(await app.api.updateMyProfile({ username, displayName: form.querySelector('#sName').value.trim(), bio: form.querySelector('#sBio').value.trim() })) };
      document.dispatchEvent(new CustomEvent('profile-changed')); toast('Profile saved');
    } catch (e) { err.textContent = friendlyError(e); }
    btn.disabled = false;
  });
  ctx.on('change', '#avatarFile', async (_, input) => {
    const f = input.files[0]; if (!f) return; const st = ctx.view.querySelector('#avatarStatus'); st.textContent = 'Uploading…';
    try {
      const url = await app.api.uploadAvatar(f);
      app.profile = { ...app.profile, ...(await app.api.updateMyProfile({ avatarUrl: url })) };
      document.dispatchEvent(new CustomEvent('profile-changed')); toast('Photo updated'); ctx.rerun();
    } catch (e) { st.textContent = friendlyError(e); st.style.color = 'var(--live)'; }
  });
  ctx.on('click', '[data-action=copy-invite]', async () => {
    const link = location.origin + location.pathname.replace(/[^/]*$/, '') + 'app.html';
    try { await navigator.clipboard.writeText(link); toast('Invite link copied'); } catch { toast(link); }
  });
  const exportData = async (kind) => {
    try {
      const rows = await app.api.listEntries({ userId: app.profile.id });
      if (kind === 'json') {
        const mine = (await app.api.listPhotos({}).catch(() => [])).filter((p) => p.uploaderId === app.profile.id).map((p) => ({ url: p.url, showId: p.showId, votes: p.votes }));
        const { username, displayName, bio, settings } = app.profile;
        downloadFile('aftershow-export.json', JSON.stringify({ exportedAt: new Date().toISOString(), profile: { username, displayName, bio, settings }, shows: rows.map(({ photos, likedByMe, cover, ...r }) => r), photos: mine }, null, 2), 'application/json');
      }
      else downloadFile('aftershow-export.csv', ['Date,Artist,Venue,City,Rating,Notes,Setlist,From Memory', ...rows.map((e) => [e.date, e.artistName, e.venueName, e.city, e.rating ?? '', e.note, e.setlist.join('; '), e.fromMemory ? 'yes' : 'no'].map(csvCell).join(','))].join('\n'), 'text/csv');
      toast(`Exported ${rows.length} shows`);
    } catch (e) { toast(friendlyError(e), 'error'); }
  };
  ctx.on('click', '[data-action=export-csv]', () => exportData('csv'));
  ctx.on('click', '[data-action=export-json]', () => exportData('json'));
  ctx.on('click', '[data-action=signout]', async () => { await app.api.signOut(); });
  ctx.on('click', '[data-action=delete-account]', async () => {
    if (!(await confirmDialog('Delete your account?', demo ? 'This restores the sample data and signs you out.' : 'This permanently removes your profile, shows, photos, comments and votes. Export your data first if you want a copy.', demo ? 'Reset and sign out' : 'Continue'))) return;
    if (!demo && !(await confirmDialog('Last check', 'This cannot be undone. Delete everything now?', 'Delete forever'))) return;
    try { await app.api.deleteAccount(); toast(demo ? 'Demo reset' : 'Account deleted'); } catch (e) { toast(friendlyError(e), 'error'); }
  });
  ctx.on('click', '[data-action=reset-demo]', async () => { if (await confirmDialog('Reset demo data?', 'This restores the sample archive and removes anything you added.', 'Reset')) { await app.api.resetDemo(); toast('Demo data reset'); } });
  ctx.on('click', '[data-action=exit-demo]', () => { localStorage.setItem('aftershow-mode', 'live'); location.href = location.pathname; });
}
