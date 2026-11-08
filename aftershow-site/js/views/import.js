// CSV import: Concert Archives export first, any spreadsheet second. Map columns → preview → import with progress.
import { app, pageHeader, toast } from '../ui.js';
import { esc, downloadFile, friendlyError } from '../util.js';
import { parseCSV, FIELDS, guessMapping, mapRows, SAMPLE_CSV } from '../csv.js';

export async function importCsv(ctx) {
  const st = { headers: [], rows: [], map: {}, fileName: '' };
  const fromWelcome = ctx.query.from === 'welcome';

  const paintPick = () => ctx.setHTML(`${pageHeader('Import', 'Bring your history.', 'Import from Concert Archives or any spreadsheet. Imported shows are tagged “from memory”, and ratings out of 5 are doubled to fit the 10-point dial.')}
    <div class="card">
      <h2 class="serif">Coming from Concert Archives?</h2>
      <ol class="steps-list"><li>On Concert Archives, hover your avatar and choose <strong>Export to Spreadsheet</strong> (in the app: Menu → Settings).</li><li>They email you the file. Save it as <strong>.csv</strong> (open in Excel or Sheets → Save as CSV if it arrived as .xlsx).</li><li>Plug it in below — we’ll auto-detect the columns and let you fix any we get wrong.</li></ol>
<label class="dropzone jack" for="csvFile" id="drop">
        <svg class="jack-art" viewBox="0 0 360 96" aria-hidden="true">
          <path class="wire" d="M0 74 C60 74 70 28 128 48" fill="none" stroke-width="5" stroke-linecap="round"/>
          <g class="plug"><rect class="sleeve" x="56" y="36" width="130" height="24" rx="5"/><rect class="ring-band" x="150" y="36" width="8" height="24"/><rect class="tip" x="186" y="43" width="42" height="10" rx="3"/></g>
          <circle class="nut" cx="300" cy="48" r="32"/><circle class="hole" cx="300" cy="48" r="19"/>
        </svg>
        <span class="serif">Plug in your history</span><span class="sub">Drop a CSV here, or click to choose a file</span><input id="csvFile" type="file" accept=".csv,.tsv,.txt,text/csv" class="sr-only"></label>
      <details class="bulk"><summary>Or paste CSV text</summary><textarea id="csvText" rows="6" placeholder="Date,Artist,Venue,City&#10;2019-06-14,Tool,Pinnacle Bank Arena,Lincoln"></textarea><button class="btn" type="button" data-action="paste-go">Read pasted text</button></details>
      <p class="sub">Any CSV with artist, date and venue columns works. <button class="btn" type="button" data-action="sample">Download a sample file</button></p>
      <div class="err" id="pickErr" role="alert"></div>
    </div>${fromWelcome ? '<p class="center"><a href="#/welcome?step=3">Skip for now →</a></p>' : ''}`);

  const paintMap = () => {
    const { valid, skipped } = mapRows(st.rows, st.map);
    const missing = FIELDS.filter((f) => f.required && st.map[f.key] == null);
    const opts = (sel) => `<option value="">— none —</option>${st.headers.map((h, i) => `<option value="${i}" ${sel === i ? 'selected' : ''}>${esc(h || 'Column ' + (i + 1))}</option>`).join('')}`;
    ctx.setHTML(`${pageHeader('Import', 'Check the columns.', `${esc(st.fileName)} · ${st.rows.length} rows found`)}
      <div class="card"><h2 class="serif">Column mapping</h2>
        <div class="map-grid">${FIELDS.map((f) => `<div class="field"><label for="map_${f.key}">${f.label}${f.required ? ' <span class="req">required</span>' : ''}</label><select id="map_${f.key}" data-field="${f.key}">${opts(st.map[f.key])}</select></div>`).join('')}</div>
        ${missing.length ? `<div class="err" role="alert">Map a column for: ${missing.map((m) => m.label).join(', ')}.</div>` : ''}
      </div>
      <div class="card"><h2 class="serif">Preview</h2>
        <p class="sub"><strong>${valid.length}</strong> shows ready · <strong>${skipped.length}</strong> skipped${skipped.length ? ' (see below)' : ''}</p>
        ${valid.length ? `<div class="table-wrap"><table class="preview"><thead><tr><th>Date</th><th>Artist</th><th>Venue</th><th>City</th><th>Rating</th></tr></thead><tbody>${valid.slice(0, 6).map((v) => `<tr><td>${esc(v.date)}</td><td>${esc(v.artistName)}</td><td>${esc(v.venueName)}</td><td>${esc(v.city)}</td><td>${v.rating ?? ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${skipped.length ? `<details class="bulk"><summary>${skipped.length} skipped rows</summary><ul class="skip-list">${skipped.slice(0, 50).map((s) => `<li>Row ${s.row}: ${esc(s.reason)}</li>`).join('')}</ul></details>` : ''}
        <div class="progress" id="prog" hidden role="progressbar" aria-label="Import progress" aria-valuemin="0" aria-valuemax="100"><span style="width:0"></span></div>
        <div class="detail-actions"><button class="btn-block inline" type="button" data-action="go" ${missing.length || !valid.length ? 'disabled' : ''}>Import ${valid.length} shows</button><button class="btn" type="button" data-action="restart">Choose another file</button></div>
        <div class="err" id="goErr" role="alert"></div></div>`);
  };

  const load = (text, name) => {
    ctx.view.querySelector('#drop')?.classList.add('plugged');
    const { headers, rows } = parseCSV(text);
    const err = ctx.view.querySelector('#pickErr');
    if (headers.length < 2 || !rows.length) { err.textContent = 'That doesn’t look like a CSV with a header row and at least one show.'; return; }
    Object.assign(st, { headers, rows, fileName: name, map: guessMapping(headers) });
    paintMap();
  };
  paintPick();
  ctx.on('change', '#csvFile', async (_, el) => { const f = el.files[0]; if (!f) return; if (f.size > 5 * 1048576) { ctx.view.querySelector('#pickErr').textContent = 'File is over 5MB.'; return; } load(await f.text(), f.name); });
  ctx.view.addEventListener('dragover', (e) => { if (e.target.closest('#drop')) { e.preventDefault(); ctx.view.querySelector('#drop').classList.add('over'); } });
  ctx.view.addEventListener('dragleave', () => ctx.view.querySelector('#drop')?.classList.remove('over'));
  ctx.view.addEventListener('drop', async (e) => { if (!e.target.closest('#drop')) return; e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) load(await f.text(), f.name); });
  ctx.on('click', '[data-action=paste-go]', () => load(ctx.view.querySelector('#csvText').value, 'Pasted text'));
  ctx.on('click', '[data-action=sample]', () => downloadFile('aftershow-sample.csv', SAMPLE_CSV, 'text/csv'));
  ctx.on('change', '[data-field]', (_, el) => { if (el.value === '') delete st.map[el.dataset.field]; else st.map[el.dataset.field] = +el.value; paintMap(); });
  ctx.on('click', '[data-action=restart]', paintPick);
  ctx.on('click', '[data-action=go]', async (_, btn) => {
    const { valid } = mapRows(st.rows, st.map);
    btn.disabled = true; btn.textContent = 'Importing…';
    const prog = ctx.view.querySelector('#prog'); prog.hidden = false;
    try {
      const res = await app.api.createMany(valid, (done, total) => { const p = Math.round((done / total) * 100); prog.firstElementChild.style.width = p + '%'; prog.setAttribute('aria-valuenow', p); });
      if (!app.profile.onboarded) { app.profile.onboarded = true; app.api.updateMyProfile({ onboarded: true }).catch(() => {}); }
      toast(`Imported ${res.added} shows`);
      ctx.setHTML(`${pageHeader('Import', 'Done.', `${res.added} shows added${res.dupes ? `, ${res.dupes} already in your archive` : ''}.`)}
        <div class="card"><div class="detail-actions"><a class="btn-block inline" href="#/shows">See my archive</a><a class="btn" href="#/stats">View stats</a><a class="btn" href="#/import">Import another</a></div></div>`);
    } catch (e) {
      ctx.view.querySelector('#goErr').textContent = friendlyError(e);
      btn.disabled = false; btn.textContent = `Import ${valid.length} shows`;
    }
  });
}
