// Photo picker with size validation, preview, and the one-time UGC license consent.
import { app } from '../ui.js';
import { validatePhoto } from '../photo.js';
import { esc } from '../util.js';

export function photoFieldHtml(id = 'photoFile') {
  return `<div class="field photo-field">
    <label for="${id}">Photo (optional)</label>
    <input id="${id}" type="file" accept="image/*" aria-describedby="${id}Status">
    <div class="photo-preview" id="${id}Preview" hidden></div>
    <p class="sub" id="${id}Status" role="status"></p>
    <label class="check" id="${id}Consent" hidden><input type="checkbox" id="${id}Agree"> <span>I own this photo and agree to the <a href="photo-ugc-license.html" target="_blank" rel="noopener">Photo &amp; UGC License</a>.</span></label>
  </div>`;
}

export function bindPhotoField(ctx, id = 'photoFile') {
  const input = ctx.view.querySelector('#' + id);
  if (!input) return;
  const status = ctx.view.querySelector(`#${id}Status`), consent = ctx.view.querySelector(`#${id}Consent`), preview = ctx.view.querySelector(`#${id}Preview`);
  input.addEventListener('change', () => {
    const file = input.files[0];
    preview.hidden = true; preview.innerHTML = ''; status.style.color = '';
    if (!file) { consent.hidden = true; status.textContent = ''; return; }
    const problem = validatePhoto(file);
    if (problem) { status.textContent = problem; status.style.color = 'var(--live)'; input.value = ''; consent.hidden = true; return; }
    status.textContent = `${file.name} — ${(file.size / 1048576).toFixed(1)}MB, will be resized and compressed before upload.`;
    preview.innerHTML = `<img src="${esc(URL.createObjectURL(file))}" alt="Selected photo preview">`; preview.hidden = false;
    consent.hidden = !!app.profile.agreedToUgc;
  });
}

// Returns an error string if the photo can't be submitted yet (consent missing), else null.
export function photoProblem(ctx, id = 'photoFile') {
  const file = ctx.view.querySelector('#' + id)?.files?.[0];
  if (!file) return null;
  if (!app.profile.agreedToUgc && !ctx.view.querySelector(`#${id}Agree`)?.checked) return 'Please confirm you own this photo and agree to the Photo & UGC License.';
  return null;
}

export async function uploadSelected(ctx, showId, onStage, id = 'photoFile') {
  const file = ctx.view.querySelector('#' + id)?.files?.[0];
  if (!file) return null;
  if (!app.profile.agreedToUgc) { await app.api.acceptUgcLicense(); app.profile.agreedToUgc = true; }
  const labels = { loading: 'Loading photo…', resizing: 'Resizing…', compressing: 'Compressing…', uploading: 'Uploading…' };
  return app.api.uploadPhoto(showId, file, (s) => onStage?.(labels[s] || 'Saving…'));
}
