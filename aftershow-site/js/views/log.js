// Tab 3: Log a Show (and edit) — Live Now and From Memory modes, setlist editor, rating, photo.
import { app, pageHeader, knobInput, bindKnob, toast, tile } from '../ui.js';
import { esc, todayISO, friendlyError, splitCity, joinCity, stateOptions, LIMITS } from '../util.js';
import { photoFieldHtml, bindPhotoField, photoProblem, uploadSelected } from './photoField.js';

export async function logShow(ctx) {
  const editId = ctx.params.id;
  const init = await ctx.guard(async () => {
    const [sugg, existing] = await Promise.all([app.api.suggestions().catch(() => ({ artists: [], venues: [] })), editId ? app.api.getEntry(editId) : null]);
    return { sugg, existing };
  });
  if (!init) return;
  const { sugg, existing } = init;
  if (editId && (!existing || existing.userId !== app.profile.id)) {
    ctx.setHTML(`<div class="card"><h1 class="title" tabindex="-1">Can’t edit that show.</h1><p class="sub"><a href="#/shows">Back to your shows</a></p></div>`);
    return;
  }
  const st = {
    mode: existing ? (existing.fromMemory ? 'memory' : 'live') : (ctx.query.mode === 'live' ? 'live' : 'memory'),
    songs: [...(existing?.setlist || [])]
  };
  const pre = { artist: existing?.artistName || ctx.query.artist || '', venue: existing?.venueName || ctx.query.venue || '', city: splitCity(existing?.city || '').city, state: splitCity(existing?.city || '').state, date: existing?.date || '', rating: existing?.rating || 0, note: existing?.note || '' };

  const songsHtml = () => st.songs.length
    ? `<ol class="song-edit">${st.songs.map((s, i) => `<li><span class="song-no">${i + 1}.</span><span class="song-name">${esc(s)}</span>
        <span class="song-tools"><button type="button" class="icon-btn" data-action="song-up" data-i="${i}" aria-label="Move ${esc(s)} up" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" class="icon-btn" data-action="song-down" data-i="${i}" aria-label="Move ${esc(s)} down" ${i === st.songs.length - 1 ? 'disabled' : ''}>↓</button><button type="button" class="icon-btn" data-action="song-del" data-i="${i}" aria-label="Remove ${esc(s)}">✕</button></span></li>`).join('')}</ol>`
    : '<p class="sub">No songs yet. Add what you remember — partial is fine.</p>';

  ctx.setHTML(`
    ${pageHeader(existing ? 'Edit show' : 'Log a Show', existing ? 'Edit Show.' : 'Add a Show.', 'Live or from memory. No ticket, no proof, no location check.')}
    <div class="log-layout"><form class="card" id="logForm" novalidate>
      ${existing ? '' : `<div class="toggle-row" role="radiogroup" aria-label="Logging mode">
        <button type="button" class="toggle-opt" role="radio" data-mode="live">● Live now</button>
        <button type="button" class="toggle-opt" role="radio" data-mode="memory">From memory</button></div>`}
      <p class="sub" id="modeHint"></p>
      <div class="field"><label for="fArtist">Artist <span class="req">required</span></label><input id="fArtist" list="artistList" autocomplete="off" maxlength="${LIMITS.artist}" value="${esc(pre.artist)}" placeholder="e.g. Paramore" aria-describedby="eArtist"><datalist id="artistList">${sugg.artists.map((a) => `<option value="${esc(a)}">`).join('')}</datalist><div class="err" id="eArtist" role="alert"></div></div>
      <div class="field"><label for="fVenue">Venue <span class="req">required</span></label><input id="fVenue" list="venueList" autocomplete="off" maxlength="${LIMITS.venue}" value="${esc(pre.venue)}" placeholder="e.g. Thalia Hall" aria-describedby="eVenue"><datalist id="venueList">${[...new Set(sugg.venues.map((v) => v.name))].map((v) => `<option value="${esc(v)}">`).join('')}</datalist><div class="err" id="eVenue" role="alert"></div></div>
      <div class="field-pair">
        <div class="field"><label for="fCity">City</label><input id="fCity" name="show-city" value="${esc(pre.city)}" maxlength="${LIMITS.city}" placeholder="Chicago" autocomplete="off" autocorrect="off" data-lpignore="true"></div>
        <div class="field"><label for="fState">State</label><select id="fState" name="show-state" autocomplete="off">${stateOptions(pre.state)}</select></div>
      </div>
      <div class="field" id="dateField"><label for="fDate">Date <span class="req">required</span></label><input id="fDate" type="date" max="${todayISO()}" value="${esc(pre.date)}" aria-describedby="eDate"><div class="err" id="eDate" role="alert"></div><p class="sub">Not sure of the exact day? Pick your best guess — nobody’s checking.</p></div>
      <div class="field"><label id="ratingLabel">Rating</label>${knobInput('rating', pre.rating)}</div>
      <fieldset class="field setlist-field"><legend>Setlist</legend>
        <div class="song-add"><input id="songInput" placeholder="Add a song, press Enter" aria-label="Add a song" autocomplete="off"><button type="button" class="btn primary" data-action="song-add">Add</button></div>
        <div id="songs" aria-live="polite">${songsHtml()}</div>
        <details class="bulk"><summary>Paste a whole setlist</summary><textarea id="bulk" rows="5" placeholder="One song per line (numbers are stripped)"></textarea><button type="button" class="btn" data-action="bulk-add">Add all</button></details>
      </fieldset>
      <div class="field"><label for="fNote">Notes</label><textarea id="fNote" rows="3" placeholder="How was it? Who were you with?">${esc(pre.note)}</textarea></div>
      ${existing ? '' : photoFieldHtml()}
      <div class="err form-err" id="formErr" role="alert"></div>
      <button class="btn-block" type="submit" id="saveBtn">Save show</button>
    </form><aside class="log-preview" aria-hidden="true"><div id="logPreview"></div><p>How it will look in your archive.</p></aside></div>`);

  const $ = (s) => ctx.view.querySelector(s);
  const paintMode = () => {
    ctx.view.querySelectorAll('[data-mode]').forEach((b) => { const on = b.dataset.mode === st.mode; b.classList.toggle('active', on); b.setAttribute('aria-checked', on); });
    const live = st.mode === 'live' && !existing;
    $('#dateField').hidden = live;
    $('#modeHint').textContent = existing ? '' : live ? 'Live now: logged for tonight and shown in the Tonight feed. Add songs as the night goes — you can edit afterwards.' : 'From memory: any show you’ve ever been to, with whatever you remember.';
    $('#saveBtn').textContent = live ? 'Post to Tonight' : existing ? 'Save changes' : 'Save show';
  };
  const paintSongs = () => { $('#songs').innerHTML = songsHtml(); };
  const addSong = (txt) => {
    txt.split(/\r?\n/).map((l) => l.replace(/^\s*\d+[.)\-:]\s*/, '').trim()).filter(Boolean).forEach((s) => st.songs.push(s));
    paintSongs();
  };
  paintMode();
  const prev = () => {
    const live = st.mode === 'live' && !existing;
    $('#logPreview').innerHTML = tile({ id: 'x', artistName: $('#fArtist').value.trim() || 'Artist', venueName: $('#fVenue').value.trim() || 'Venue', date: live ? todayISO() : ($('#fDate').value || todayISO()), rating: +(ctx.view.querySelector('[name=rating]')?.value || 0) || 0, fromMemory: st.mode === 'memory', photos: [] });
  };
  prev();
  const formEl = ctx.view.querySelector('#logForm');
  formEl.addEventListener('input', prev); formEl.addEventListener('change', prev); formEl.addEventListener('click', () => setTimeout(prev, 0));
  ctx.on('click', '[data-mode]', (_, b) => { st.mode = b.dataset.mode; paintMode(); });
  ctx.on('click', '[data-action=song-add]', () => { const i = $('#songInput'); if (i.value.trim()) { addSong(i.value); i.value = ''; } i.focus(); });
  ctx.on('keydown', '#songInput', (ev, i) => { if (ev.key === 'Enter') { ev.preventDefault(); if (i.value.trim()) { addSong(i.value); i.value = ''; } } });
  ctx.on('click', '[data-action=bulk-add]', () => { addSong($('#bulk').value); $('#bulk').value = ''; $('.bulk').open = false; });
  ctx.on('click', '[data-action=song-del]', (_, b) => { st.songs.splice(+b.dataset.i, 1); paintSongs(); });
  ctx.on('click', '[data-action=song-up]', (_, b) => { const i = +b.dataset.i; [st.songs[i - 1], st.songs[i]] = [st.songs[i], st.songs[i - 1]]; paintSongs(); ctx.view.querySelector(`[data-action=song-up][data-i="${i - 1}"]`)?.focus(); });
  ctx.on('click', '[data-action=song-down]', (_, b) => { const i = +b.dataset.i; [st.songs[i + 1], st.songs[i]] = [st.songs[i], st.songs[i + 1]]; paintSongs(); ctx.view.querySelector(`[data-action=song-down][data-i="${i + 1}"]`)?.focus(); });
  ctx.on('change', '#fVenue', (_, el) => { const v = sugg.venues.find((x) => x.name.toLowerCase() === el.value.trim().toLowerCase()); if (v?.city && !$('#fCity').value) { const sc = splitCity(v.city); $('#fCity').value = sc.city; $('#fState').value = sc.state; } });
  bindPhotoField(ctx);
  bindKnob(ctx);

  ctx.on('submit', '#logForm', async (ev) => {
    ev.preventDefault();
    const live = st.mode === 'live' && !existing;
    const artistName = $('#fArtist').value.trim(), venueName = $('#fVenue').value.trim();
    const date = live ? todayISO() : $('#fDate').value;
    ['eArtist', 'eVenue', 'eDate', 'formErr'].forEach((id) => ($('#' + id).textContent = ''));
    ctx.view.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    const bad = [];
    if (!artistName) bad.push(['fArtist', 'eArtist', 'Who did you see?']);
    if (!venueName) bad.push(['fVenue', 'eVenue', 'Where was it? A best guess is fine.']);
    if (!date) bad.push(['fDate', 'eDate', 'Pick a date — best guess is fine.']);
    else if (date > todayISO()) bad.push(['fDate', 'eDate', 'That date is in the future.']);
    if (bad.length) { bad.forEach(([f, e, m]) => { $('#' + e).textContent = m; $('#' + f).setAttribute('aria-invalid', 'true'); }); $('#' + bad[0][0]).focus(); return; }
    const consentProblem = photoProblem(ctx);
    if (consentProblem) { $('#formErr').textContent = consentProblem; return; }
    const btn = $('#saveBtn'); btn.disabled = true; const label = btn.textContent; btn.textContent = 'Saving…';
    const payload = {
      artistName, venueName, city: joinCity($('#fCity').value, $('#fState').value), date, rating: +(ctx.view.querySelector('[name=rating]')?.value || 0) || null,
      note: $('#fNote').value.trim(), setlist: st.songs, fromMemory: st.mode === 'memory', isLive: live
    };
    let entry;
    try { entry = existing ? await app.api.updateEntry(existing.id, payload) : await app.api.createEntry(payload); }
    catch (e) { $('#formErr').textContent = friendlyError(e); btn.disabled = false; btn.textContent = label; return; }
    if (!app.profile.onboarded) { app.profile.onboarded = true; app.api.updateMyProfile({ onboarded: true }).catch(() => {}); }
    if (!existing) {
      try { await uploadSelected(ctx, entry.showId, (t) => (btn.textContent = t)); }
      catch (e) { toast('Show saved, but the photo failed: ' + friendlyError(e), 'error'); }
    }
    toast(existing ? 'Changes saved' : live ? 'Posted to Tonight' : 'Show logged');
    location.hash = '#/entry/' + entry.id;
  });
}
