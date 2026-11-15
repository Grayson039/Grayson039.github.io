// Onboarding: pick your amp -> plug in your history -> log your first show (with a live poster).
// Archive first; the feed unlocks after one log.
import { app, knobInput, bindKnob, coverStyle, coverClass, posterWall, toast, avatar } from '../ui.js';
import { invalidateCovers } from '../covers.js';
import { applyTheme } from '../theme.js';
import { esc, todayISO, friendlyError, formatDate, ratingDial, norm, splitCity, joinCity, stateOptions, LIMITS } from '../util.js';
import { validatePhoto } from '../photo.js';
import { GENRES, GENRE_GROUPS, KIND_CAPTION, kindOf, sceneSvg, thumbSvg } from './stageScene.js';

const STEPS = ['Pick your amp', 'Plug in your history', 'Your night', 'Your profile', 'Near you', 'First show'];
const LAST = STEPS.length;
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

const amp = (k, name, desc) => `<button type="button" class="amp ${k} ${app.theme === k ? 'on' : ''}" role="radio" aria-checked="${app.theme === k}" data-theme-pick="${k}">
  <span class="amp-top"><span class="amp-plate">aftershow</span><i class="pilot ${app.theme === k ? 'on' : 'off'} amp-lamp" aria-hidden="true"></i></span>
  <span class="amp-knobs" aria-hidden="true">${[0, 1, 2, 3, 4].map((i) => `<i style="--r:${-130 + i * 58 + (k === 'dark' ? 0 : 14)}deg"></i>`).join('')}</span>
  <span class="amp-name">${name}</span><span class="amp-desc">${desc}</span></button>`;

const PUBLIC_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17"/></svg>';
const pvIcon = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`;
const PV_POINTS = {
  private: [['M5 7h14M5 12h14M5 17h9', 'Log shows and setlists'], ['M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z', 'Only you and your followers see them'], ['M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7', 'Add your own photos'], ['M12 19V5M6 11l6-6 6 6', 'You can still vote on every show’s best photo']],
  public: [['M12 19V5M6 11l6-6 6 6', 'Vote on the best photo of every show'], ['M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7z', 'The top photo becomes the band’s cover'], ['M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4', 'No photo of your own? You still get a great poster']],
};
const PV_CAPTION = { private: 'Your archive. Only you and your followers.', public: 'Your shows join the community. The top photo becomes the band’s cover.' };
const pvPoints = (m) => PV_POINTS[m].map(([p, txt]) => `<li>${pvIcon(p)}<span>${txt}</span></li>`).join('');

export async function onboarding(ctx) {
  const st = { step: Math.min(LAST, Math.max(1, Number(ctx.query.step) || 1)), go: ctx.query.go === '1', loc: { city: splitCity(app.profile.settings?.location).city, state: splitCity(app.profile.settings?.location).state }, privacy: app.profile.settings?.private ? 'private' : 'public', genre: app.profile.settings?.genre || '', demo: { votes: [212, 140, 96], mine: -1, photoOn: false }, photo: '', done: false, ownPhoto: '', file: null, form: { artist: '', venue: '', city: '', date: '', note: '', rating: 0 } };
  const sugg = await app.api.suggestions().catch(() => ({ artists: [], venues: [] }));
  const serial = () => String([...(st.form.artist || 'first')].reduce((a, c) => a + c.charCodeAt(0) * 7, 1) % 10000).padStart(4, '0');

  const posterHtml = () => {
    const f = st.form, name = f.artist.trim(), where = [f.venue.trim(), f.city.trim()].filter(Boolean).join(', ');
    const url = st.ownPhoto || st.photo;
    const add = st.ownPhoto
      ? '<button type="button" class="ob-add on" data-action="remove-photo" aria-label="Remove your photo"><b aria-hidden="true">×</b><span>Remove</span></button>'
      : '<button type="button" class="ob-add" data-action="add-photo" aria-label="Add your own concert photo"><b aria-hidden="true">+</b><span>Add photo</span></button>';
    return `<div class="ob-poster entry-media poster ${coverClass(url)}" id="obPoster" style="${coverStyle(name || 'Your first show', url)}">
      <div class="poster-top">${add}<span>From memory</span></div>
      <div class="poster-body"><div class="cover-name">${esc(name || 'Your first show')}</div><div class="poster-rule"></div>
        <div class="venue">${esc(where || 'Venue, City')}</div><div class="poster-date">${esc(f.date ? formatDate(f.date) : 'Pick a date')}</div></div>
      <div class="stub"><b>Admit one</b><span class="no">No. ${serial()}</span>${ratingDial(f.rating)}</div></div>`;
  };

  const body = () => {
    if (st.done) {
      return `<div class="ob-done"><div class="ob-done-poster">${posterHtml()}</div>
        <div class="ob-done-copy"><h2 class="serif">You’re on.</h2><p class="sub">Your first poster is up and the feed is unlocked. Every show you add from here builds the wall.</p>
        <div class="detail-actions"><a class="btn-block inline" href="#/shows" data-action="finish-link">Open my archive</a><a class="btn" href="#/log">Log another</a></div></div></div>`;
    }
    if (st.step === 1) {
      return `<h2 class="serif">Pick your amp.</h2><p class="sub">Both looks are first-class. Pick one, or turn the dial. The whole site changes live.</p>
        <div class="amps" role="radiogroup" aria-label="Theme">${amp('dark', 'Marshall Dark', 'Black tolex, gold piping.')}${amp('light', 'Orange Vintage', 'Cream baffle cloth, ink black.')}</div>
        <button type="button" class="ob-dial" data-action="flip"><span class="knob" aria-hidden="true"><i></i></span><span>Turn the dial</span></button>
        <p class="ob-foot">You can change your look any time from the menu or in Settings.</p>`;
    }
    if (st.step === 2) {
      return `<h2 class="serif">Plug in your history.</h2><p class="sub">Already tracking shows somewhere else? Import a CSV from Concert Archives or any spreadsheet and skip the re-typing.</p>
        <a class="dropzone jack" href="#/import?from=welcome"><svg class="jack-art" viewBox="0 0 360 96" aria-hidden="true"><path class="wire" d="M0 74 C60 74 70 28 128 48" fill="none" stroke-width="5" stroke-linecap="round"/><g class="plug"><rect class="sleeve" x="56" y="36" width="130" height="24" rx="5"/><rect class="ring-band" x="150" y="36" width="8" height="24"/><rect class="tip" x="186" y="43" width="42" height="10" rx="3"/></g><circle class="nut" cx="300" cy="48" r="32"/><circle class="hole" cx="300" cy="48" r="19"/></svg>
        <span class="serif">Choose a file</span><span class="sub">Plug it in, check the columns, done.</span></a>
        <p class="ob-skip-line"><button class="link-btn" type="button" data-action="next">Skip. I’ll add shows by hand.</button></p>`;
    }
    if (st.step === 3) {
      return `<h2 class="serif">What’s your kind of night?</h2><p class="sub">Pick the shows you go to most. It sets the scene on the next screen. You can skip this.</p>
        <div class="gn-pick"><label class="sr-only" for="genreSel">Genre</label>
          <select id="genreSel" class="gn-select" name="genre" autocomplete="off"><option value="">Choose a genre</option>${GENRE_GROUPS.map((g) => `<optgroup label="${esc(g.label)}">${GENRES.filter((x) => x.group === g.label).map((x) => `<option value="${x.id}" ${st.genre === x.id ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</optgroup>`).join('')}</select>
          <figure class="gn-preview">${thumbSvg(st.genre)}<figcaption id="gnCaption" aria-live="polite">${esc(st.genre ? KIND_CAPTION[kindOf(st.genre)] : 'Pick a genre to change the scene.')}</figcaption></figure></div>`;
    }
    if (st.step === 4) {
      const m = st.privacy;
      return `<h2 class="serif">Who gets to see your shows?</h2><p class="sub">Pick how you want to use Aftershow. Public is selected to start, so anyone can see what you log. You can change this any time in Settings.</p>
        <div class="pv-one" data-mode="${m}">
          <div class="toggle-row pv-toggle" role="radiogroup" aria-label="Profile visibility">
            <button type="button" class="toggle-opt ${m === 'private' ? 'active' : ''}" role="radio" aria-checked="${m === 'private'}" data-privacy="private">${LOCK}Private</button>
            <button type="button" class="toggle-opt ${m === 'public' ? 'active' : ''}" role="radio" aria-checked="${m === 'public'}" data-privacy="public">${PUBLIC_ICON}Public</button>
          </div>
          <figure class="pv-scene">${sceneSvg(st.genre)}<figcaption class="pv-caption" aria-live="polite">${PV_CAPTION[m]}</figcaption></figure>
          <ul class="pv-points" aria-live="polite">${pvPoints(m)}</ul>
        </div>
        <p class="pv-summary">Public gets you community posters and a say in every cover. Private keeps it all yours.</p>`;
    }
    if (st.step === 5) {
      return `<h2 class="serif">Shows near you.</h2><p class="sub">Add your city and we can point you to venues and shows close to home as the community grows. Only your city is stored. Never an address, and you can clear it in Settings.</p>
        <form id="locForm" class="ob-loc" novalidate><div class="ob-two"><div class="field"><label for="lCity">City</label><input id="lCity" name="home-city" autocomplete="off" autocorrect="off" data-lpignore="true" maxlength="${LIMITS.city}" value="${esc(st.loc.city)}" placeholder="e.g. Minneapolis"></div>
          <div class="field"><label for="lState">State</label><select id="lState" name="home-state" autocomplete="off">${stateOptions(st.loc.state)}</select></div></div></form>
        <p class="ob-skip-line"><button class="link-btn" type="button" data-action="next">Skip for now</button></p>`;
    }
    if (!st.go) {
      return `<div class="ob-ready"><h2 class="serif">You’re up next.</h2><p class="sub">Log your first show. It can be from last night or from 2009, with no ticket and no proof. It takes about a minute, and your poster builds as you type.</p>
        <div class="detail-actions"><button class="btn-block inline" type="button" data-action="go-log">Go on stage</button><button class="btn" type="button" data-action="go-profile">Not yet, take me to my profile</button></div></div>`;
    }
    const f = st.form;
    return `<h2 class="serif">Log your first show.</h2><p class="sub">Any show, from last night or from 2009. No ticket, no proof. Watch the poster build as you type.</p>
      <div class="ob-log"><form id="obForm" novalidate>
        <div class="field"><label for="oArtist">Who did you see?</label><input id="oArtist" list="oArtists" autocomplete="off" maxlength="${LIMITS.artist}" value="${esc(f.artist)}" placeholder="e.g. Tool"><datalist id="oArtists">${sugg.artists.map((a) => `<option value="${esc(a)}">`).join('')}</datalist></div>
        <div class="field"><label for="oVenue">Venue</label><input id="oVenue" list="oVenues" autocomplete="off" maxlength="${LIMITS.venue}" value="${esc(f.venue)}" placeholder="e.g. Xcel Energy Center"><datalist id="oVenues">${sugg.venues.map((v) => `<option value="${esc(v.name)}">`).join('')}</datalist></div>
        <div class="ob-two"><div class="field"><label for="oCity">City</label><input id="oCity" name="show-city" autocomplete="off" autocorrect="off" data-lpignore="true" maxlength="${LIMITS.city}" value="${esc(splitCity(f.city).city)}" placeholder="St. Paul"></div>
          <div class="field"><label for="oState">State</label><select id="oState" name="show-state" autocomplete="off">${stateOptions(splitCity(f.city).state)}</select></div></div>
        <div class="field"><label for="oDate">Date</label><input id="oDate" type="date" max="${todayISO()}" value="${esc(f.date)}"></div>
        <div class="field"><label id="ratingLabel">How was it?</label>${knobInput('rating', f.rating)}</div>
        <div class="auth-msg error" id="obErr" role="alert"></div>
        <button class="btn-block" type="submit" id="obSave">Save my first show</button></form>
        <div class="ob-preview" aria-label="Live poster preview">${posterHtml()}
          <input id="oPhoto" type="file" accept="image/*" class="sr-only" tabindex="-1">
          <p class="sub ob-photo-note" id="oPhotoNote" role="status"></p>
          <label class="check ob-consent" id="oConsent" ${st.file && !app.profile.agreedToUgc ? '' : 'hidden'}><input type="checkbox" id="oAgree"> <span>I own this photo and agree to the <a href="photo-ugc-license.html" target="_blank" rel="noopener">Photo &amp; UGC License</a>.</span></label></div></div>`;
  };

  const lamps = () => `<ol class="ob-lamps" aria-label="Setup progress">${STEPS.map((s, i) => {
    const n = i + 1, on = st.done || n <= st.step;
    return `<li class="${n === st.step && !st.done ? 'now' : ''}" ${n === st.step && !st.done ? 'aria-current="step"' : ''}><i class="pilot ${on ? 'on' : 'off'}" aria-hidden="true"></i><span>${s}</span></li>`;
  }).join('')}</ol>`;

  // Phones: the five labelled steps do not fit, so the setup becomes a countdown to going on stage.
  const countdown = () => {
    const left = st.done ? 0 : LAST - st.step + 1;
    const title = st.done ? 'You’re on.' : STEPS[st.step - 1];
    const sub = st.done ? 'The stage is yours.' : left === 1 ? 'Last step, then you’re on.' : `${left} steps until you’re on stage`;
    return `<div class="ob-count" role="group" aria-label="Setup progress: ${esc(title)}. ${esc(sub)}"><span class="ob-count-n" aria-hidden="true">${left || '★'}</span>
      <span class="ob-count-txt"><b>${esc(title)}</b><small>${esc(sub)}</small></span>
      <span class="ob-count-bulbs" aria-hidden="true">${STEPS.map((_, i) => `<i class="pilot ${st.done || i + 1 <= st.step ? 'on' : 'off'}"></i>`).join('')}</span></div>`;
  };

  const nav = () => st.done ? '' : `<div class="step-nav">${st.step > 1 ? '<button class="btn" type="button" data-action="back-step">Back</button>' : '<span></span>'}${st.step < LAST ? '<button class="btn primary" type="button" data-action="next">Next</button>' : '<span></span>'}</div>`;

  const paint = () => {
    ctx.setHTML(`<div class="ob-stage">${posterWall()}
      <div class="ob-panel"><header class="ob-head"><span class="ob-brand">aftershow<span>.</span></span><span class="ob-hello">Welcome, ${esc(app.profile.username)}.</span><button type="button" class="link-btn" data-action="finish">${st.done ? 'Close' : 'Skip setup'}</button></header>
        ${lamps()}${countdown()}<section class="ob-body" aria-live="polite">${body()}</section>${nav()}</div></div>`);
  };
  const repaintPoster = () => { const p = ctx.view.querySelector('#obPoster'); if (p) p.outerHTML = posterHtml(); };

  paint();
  bindKnob(ctx);
  const setTheme = (k) => { applyTheme(k); app.api.updateMyProfile({ theme: app.theme }).catch(() => {}); paint(); };
  ctx.on('click', '[data-theme-pick]', (_, b) => setTheme(b.dataset.themePick));
  ctx.on('click', '[data-action=flip]', () => setTheme(app.theme === 'dark' ? 'light' : 'dark'));
  const savePrivacy = async () => {
    const priv = st.privacy === 'private';
    if (!!app.profile.settings?.private === priv && app.profile.settings?.private !== undefined) return;
    try { app.profile = { ...app.profile, ...(await app.api.updateMyProfile({ settings: { private: priv } })) }; invalidateCovers(); } catch (e) { toast(friendlyError(e), 'error'); }
  };
  ctx.on('change', '#genreSel', (_, sel) => {
    st.genre = sel.value;
    const fig = ctx.view.querySelector('.gn-preview');
    fig.querySelector('svg').outerHTML = thumbSvg(st.genre);
    fig.querySelector('#gnCaption').textContent = st.genre ? KIND_CAPTION[kindOf(st.genre)] : 'Pick a genre to change the scene.';
    app.api.updateMyProfile({ settings: { genre: st.genre } }).then((p) => { app.profile = { ...app.profile, ...p }; }).catch(() => {});
  });
  ctx.on('click', '[data-privacy]', (_, b) => {
    st.privacy = b.dataset.privacy;
    const root = ctx.view.querySelector('.pv-one'); if (!root) return;
    root.dataset.mode = st.privacy;
    root.querySelectorAll('[data-privacy]').forEach((x) => { const on = x.dataset.privacy === st.privacy; x.classList.toggle('active', on); x.setAttribute('aria-checked', on); });
    root.querySelector('.pv-points').innerHTML = pvPoints(st.privacy);
    root.querySelector('.pv-caption').textContent = PV_CAPTION[st.privacy];
  });
  const saveLoc = async () => {
    const city = ctx.view.querySelector('#lCity')?.value ?? st.loc.city, state = ctx.view.querySelector('#lState')?.value ?? st.loc.state;
    st.loc = { city, state };
    try { app.profile = { ...app.profile, ...(await app.api.updateMyProfile({ settings: { location: joinCity(city, state) } })) }; } catch (e) { toast(friendlyError(e), 'error'); }
  };
  ctx.on('click', '[data-action=next]', async () => { if (st.step === 4) await savePrivacy(); if (st.step === 5) await saveLoc(); st.step = Math.min(LAST, st.step + 1); paint(); });
  ctx.on('click', '[data-action=go-log]', () => { st.go = true; paint(); ctx.view.querySelector('#oArtist')?.focus(); });
  ctx.on('click', '[data-action=go-profile]', async () => { app.profile.onboarded = true; await app.api.updateMyProfile({ onboarded: true }).catch(() => {}); location.hash = '#/me'; });
  ctx.on('click', '[data-action=back-step]', () => { if (st.step === LAST && st.go) st.go = false; else st.step = Math.max(1, st.step - 1); paint(); });
  const finish = async () => { app.profile.onboarded = true; await app.api.updateMyProfile({ onboarded: true }).catch(() => {}); location.hash = '#/shows'; };
  ctx.on('click', '[data-action=finish]', finish);
  ctx.on('click', '[data-action=finish-link]', () => { app.profile.onboarded = true; });

  // live poster
  let lookup;
  const read = () => {
    const v = (id) => ctx.view.querySelector(id)?.value ?? '';
    Object.assign(st.form, { artist: v('#oArtist'), venue: v('#oVenue'), city: joinCity(v('#oCity'), v('#oState')), date: v('#oDate'), rating: +(ctx.view.querySelector('[name=rating]')?.value || 0) });
  };
  const onChange = (e) => {
    if (!e.target.closest?.('#obForm')) return;
    read(); repaintPoster();
    if (e.target.id === 'oArtist') {
      clearTimeout(lookup);
      lookup = setTimeout(async () => {
        const name = st.form.artist.trim(); if (!name) { st.photo = ''; return repaintPoster(); }
        const hit = (await app.api.search(name, 'artist').catch(() => [])).find((r) => norm(r.name) === norm(name));
        st.photo = (!app.profile.settings?.private && hit?.photo?.url) || ''; repaintPoster();
      }, 250);
    }
  };
  ctx.view.addEventListener('input', onChange);
  ctx.view.addEventListener('change', onChange);
  ctx.on('change', '#oVenue', (_, el) => { const v = sugg.venues.find((x) => x.name.toLowerCase() === el.value.trim().toLowerCase()); const c = ctx.view.querySelector('#oCity'); if (v?.city && c && !c.value) { const sc = splitCity(v.city); c.value = sc.city; const s = ctx.view.querySelector('#oState'); if (s) s.value = sc.state; read(); repaintPoster(); } });

  const note = (t, bad) => { const n = ctx.view.querySelector('#oPhotoNote'); if (n) { n.textContent = t; n.style.color = bad ? 'var(--live-text)' : ''; } };
  ctx.on('click', '[data-action=add-photo]', () => ctx.view.querySelector('#oPhoto')?.click());
  ctx.on('click', '[data-action=remove-photo]', () => { if (st.ownPhoto) URL.revokeObjectURL(st.ownPhoto); st.ownPhoto = ''; st.file = null; const i = ctx.view.querySelector('#oPhoto'); if (i) i.value = ''; ctx.view.querySelector('#oConsent').hidden = true; note(''); repaintPoster(); });
  ctx.on('change', '#oPhoto', (_, input) => {
    const file = input.files[0]; if (!file) return;
    const problem = validatePhoto(file);
    if (problem) { note(problem, true); input.value = ''; return; }
    if (st.ownPhoto) URL.revokeObjectURL(st.ownPhoto);
    st.file = file; st.ownPhoto = URL.createObjectURL(file);
    note('Your photo will be resized before upload. It becomes this show’s cover.');
    ctx.view.querySelector('#oConsent').hidden = !!app.profile.agreedToUgc;
    repaintPoster();
  });

  ctx.on('submit', '#obForm', async (ev) => {
    ev.preventDefault(); read();
    const f = st.form, err = ctx.view.querySelector('#obErr'); err.textContent = '';
    if (!f.artist.trim()) { err.textContent = 'Who did you see?'; ctx.view.querySelector('#oArtist').focus(); return; }
    if (!f.venue.trim()) { err.textContent = 'Where was it? A best guess is fine.'; ctx.view.querySelector('#oVenue').focus(); return; }
    if (!f.date) { err.textContent = 'Pick a date. A best guess is fine.'; ctx.view.querySelector('#oDate').focus(); return; }
    if (f.date > todayISO()) { err.textContent = 'That date is in the future.'; return; }
    if (st.file && !app.profile.agreedToUgc && !ctx.view.querySelector('#oAgree')?.checked) { err.textContent = 'Please confirm you own this photo and agree to the Photo & UGC License.'; return; }
    const btn = ctx.view.querySelector('#obSave'); btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const entry = await app.api.createEntry({ artistName: f.artist.trim(), venueName: f.venue.trim(), city: f.city.trim(), date: f.date, rating: f.rating || null, note: '', setlist: [], fromMemory: true, isLive: false });
      app.profile.onboarded = true; app.api.updateMyProfile({ onboarded: true }).catch(() => {});
      if (st.file) {
        try {
          if (!app.profile.agreedToUgc) { await app.api.acceptUgcLicense(); app.profile.agreedToUgc = true; }
          btn.textContent = 'Uploading photo…';
          await app.api.uploadPhoto(entry.showId, st.file, () => {});
        } catch (e) { toast('Show saved, but the photo failed: ' + friendlyError(e), 'error'); }
      }
      st.done = true; paint();
    } catch (e) { err.textContent = friendlyError(e); btn.disabled = false; btn.textContent = 'Save my first show'; }
  });
}
