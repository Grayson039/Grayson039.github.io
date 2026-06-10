# SceneOne — Deploy Tonight Checklist

Everything is built. You just need to wire up credentials and push.
Estimated time: 20–30 minutes.

---

## Step 1 — Get Your Anthropic API Key (5 min)
1. Go to console.anthropic.com
2. API Keys → Create Key → copy it
3. Store it somewhere safe (you'll paste it into Supabase in Step 3)

---

## Step 2 — Run the Database Schema (2 min)
1. Go to app.supabase.com → your project (zzsjgaijrngxkaqakplm)
2. Left sidebar → SQL Editor → New query
3. Paste the contents of `supabase/migrations/001_init.sql`
4. Run it → confirm "submissions" table appears in Table Editor

---

## Step 3 — Deploy the Edge Function (10 min)

Install Supabase CLI if you don't have it:
```
npm install -g supabase
```

Login and link your project:
```
supabase login
supabase link --project-ref zzsjgaijrngxkaqakplm
```

Set your Anthropic API key as a secret:
```
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Deploy the edge function:
```
supabase functions deploy grade-script
```

Test it worked (replace with your anon key from Project Settings → API):
```
curl -X POST https://zzsjgaijrngxkaqakplm.supabase.co/functions/v1/grade-script \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"script_text": "INT. COFFEE SHOP - DAY\nSARAH sits alone.", "title": "Test"}'
```
You should get JSON back with scores.

---

## Step 4 — Wire Up the Frontend (5 min)

Open `sceneone/landing.html` and find these two lines near the top of the `<script>` block:

```javascript
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your real values from app.supabase.com → Project Settings → API:
- SUPABASE_URL: `https://zzsjgaijrngxkaqakplm.supabase.co`
- SUPABASE_ANON_KEY: the `anon public` key (safe to expose in frontend)

---

## Step 5 — Push to GitHub → Cloudflare (3 min)

From the sceneone-work directory (or wherever your repo lives):
```
git add -A
git commit -m "feat: wire real Claude API analysis via Supabase edge function"
git push
```

Cloudflare Pages will auto-deploy from your GitHub repo.

---

## Step 6 — Test It Live (5 min)
1. Go to sceneone.net
2. Upload a real PDF script (or use the sample)
3. Watch the cinematic loader
4. Confirm the report shows real scores from Claude

---

## How It Works Now

**Real script uploaded:**
- PDF text is extracted in the browser (pdf.js)
- Text is sent to Supabase Edge Function
- Edge Function calls Claude Sonnet with the full script
- Claude returns structured JSON (scores, notes, logline, DNA, pacing)
- Report is populated with real data

**"Try with Sample Script" button:**
- Still uses the hardcoded demo data (no API call)
- Perfect for showing the product without burning API credits

**If Supabase isn't configured yet:**
- Falls back to demo data gracefully — nothing breaks

---

## Files Created This Session
- `supabase/migrations/001_init.sql` — database schema
- `supabase/functions/grade-script/index.ts` — Claude API edge function
- `sceneone/landing.html` — updated with real PDF extraction + API wiring

---

## Costs
- Claude Sonnet: ~$0.003/1K input tokens + $0.015/1K output
- A 100-page script ≈ 25K tokens in + 1.5K tokens out ≈ $0.10/analysis
- Far cheaper than the original $1.65 estimate — Sonnet pricing dropped
