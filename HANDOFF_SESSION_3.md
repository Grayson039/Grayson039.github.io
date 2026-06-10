# SceneOne — Claude Code Session Handoff
**Date:** June 8, 2026
**Session:** 4 (continuation of Session 3)
**From:** Claude Code
**To:** Claude Code (next session)
**Owner:** Will Grayson — willgraysondesign.com | @GraysonWorks01 | GitHub: Grayson039

---

## Urgency Context

**This is now time-sensitive.** Will has active job applications in motion:

- **Runway ML** — Applied before camping trip. Sent a LinkedIn message directly to CEO Cristobal Valenzuela. No response yet. Runway is an AI video/creative tools company — SceneOne as a portfolio piece is highly relevant.
- **Vertex** — Received email confirmation they'll respond "in a few days." Response imminent.
- **LinkedIn** — Already getting impressions and profile views from applications.

**sceneone.net needs to be functional before any of these leads check his portfolio.** The site is live but currently just a case study + prototype mockup. No real upload or grading yet.

---

## What Was Completed This Session

| Item | Status |
|---|---|
| New GitHub repo `Grayson039/SceneOne` created | ✅ Done |
| `index.html` (case study) + `landing.html` (prototype) pushed | ✅ Done |
| GitHub Pages enabled on `main` branch | ✅ Done |
| Custom domain `sceneone.net` set | ✅ Done |
| DNS verified (Cloudflare A records + CNAME already in place) | ✅ Done |
| HTTPS enforced | ✅ Done |
| `CNAME` file added to repo (domain persists across deploys) | ✅ Done |
| Portfolio card links updated → now point to `https://sceneone.net` | ✅ Done |
| Supabase project `sceneone` created (project ID: `zzsjgaijrngxkaqakplm`) | ✅ Done |
| Email routing (hello@sceneone.net → Gmail) | ✅ Already done in Session 2 |

**sceneone.net is live and fully deployed. willgraysondesign.com links to it correctly.**

---

## The Build — What Needs to Happen Next

The site is currently static HTML. To make it functional (real script upload → real AI grades), we need:

### Architecture
- **Frontend:** GitHub Pages (already live at sceneone.net) — static HTML/CSS/JS
- **Backend:** Supabase Edge Functions — handles the Anthropic API call securely
- **Database:** Supabase Postgres — stores submissions + results
- **AI:** Anthropic Claude API — reads script, returns structured grades

### Build Steps (in order)

**Step 1 — Anthropic API Key**
Will needs to go to console.anthropic.com and create an API key.
Save it — it gets added to Supabase as an environment secret, never hardcoded.

**Step 2 — Supabase Database Schema**
Create a `submissions` table:
```sql
create table submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp default now(),
  email text,
  script_text text,
  scores jsonb,
  fix_it_notes jsonb,
  status text default 'pending'
);
```

**Step 3 — Supabase Edge Function**
Create a function called `grade-script` that:
1. Receives the raw script text
2. Calls Claude API with the Master Prompt v4 grading system
3. Returns structured JSON scores across 5 dimensions
4. Saves result to `submissions` table

**Step 4 — Upload UI on sceneone.net**
Replace the current static landing with a real upload form:
- PDF file input
- Client-side PDF text extraction (using pdf.js — no server needed for this part)
- Calls the Supabase Edge Function with extracted text
- Shows a loading state ("Grading your script...")
- Redirects to results page

**Step 5 — Results Page**
Display:
- Overall Craft Score
- 5 dimension scores (Act Proportion, The Engine, Escalation, The Pivot, The Payoff)
- Fix-It Notes per weak dimension
- Scene-level value reversal + cause/effect notes

---

## Supabase Project Details
- **Project name:** sceneone
- **Project ID:** zzsjgaijrngxkaqakplm
- **API URL:** https://zzsjgaijrngxkaqakplm.supabase.co
- **Organization:** GraysonResourceSolutions (Free plan — 2 projects max, both slots now used)
- **Region:** West US (North California) — us-west-1

API keys are at: https://supabase.com/dashboard/project/zzsjgaijrngxkaqakplm/settings/api-keys

---

## SceneOne Grading System (Master Prompt v4 — Structural)

The grading is NOT Save the Cat page-exact. It uses proportional structural analysis:

**5 Dimensions:**
1. **Act Proportion** (20%) — Acts should be 20-25% / 50-55% / 15-20% of total pages
2. **The Engine** (20%) — Protagonist goal clarity by end of Act I
3. **Escalation** (20%) — Rising stakes curve across Act II
4. **The Pivot** (20%) — Midpoint shift at 45-55% mark
5. **The Payoff** (20%) — Climax addresses Act I dramatic question

**Scene-level checks:**
- Value reversal test (does something change emotionally/dramatically?)
- Cause-and-effect chain test (therefore/but — not "and then")

---

## Outreach — NOT Ready Yet

Jordan Monsanto, Marc Bernardin, Kevin Smith outreach is ON HOLD until:
1. SceneOne is actually functional (real upload + real grades)
2. At least 3-5 real writers have tested it
3. Will's X account has 2+ more weeks of consistent posts

**Framing when ready:** Never say "AI." Say "structural analysis" or "automated feedback." Lead with the human origin story — priced out of film school, built the tool he needed.

**Sundance Collab** (not a grant — a partnership) — approach after sceneone.app is live with a demo video.

---

## Twitter Content Calendar (@GraysonWorks01)

| Post | Topic | Status |
|---|---|---|
| Post 1 | Origin story | PUBLISHED ✅ |
| Post 2 | Design hot take | PUBLISHED ✅ |
| Post 3 | SceneOne emotional design / Creative Choice mechanic | PENDING |
| Post 4 | Kevin Smith quote + mission | PENDING |
| Post 5 | The $100 problem | PENDING |
| Post 6 | Tag @marcbernardin | PENDING (after account established) |
| Post 7 | Tag @ThatKevinSmith | PENDING (after account established) |

Next Claude should draft Posts 3, 4, 5 if Will asks.

---

## Reddit Strategy
- Username: **Novaturient01** (new account created this session)
- Zapier Reddit → Slack alert: NOT viable (Reddit API requires pre-approval, not free)
- Strategy: manual participation in r/Screenwriting, r/screenplay, r/filmmaking
- Don't post until SceneOne is functional — need something real to point to

---

## Files in Repos

**Portfolio repo** (`Grayson039/Grayson039.github.io` → `willgraysondesign.com`):
- `index.html` — SceneOne card now links to https://sceneone.net ✅

**SceneOne repo** (`Grayson039/SceneOne` → `sceneone.net`):
- `index.html` — Case study
- `landing.html` — Prototype (7 screens + Review Requests)
- `CNAME` — Contains `sceneone.net`

**Local working directory:** `C:\Users\Will\AppData\Local\Temp\sceneone-work\`

---

## Context on Will

Product/UX designer and filmmaker in Los Angeles. U.S. Army Reserve veteran. Help Desk Specialist at Zenith Insurance Company. Building portfolio to transition into AI product design roles.

**Active job targets:**
- Runway ML (AI video/creative tools) — applied, messaged CEO Cristobal on LinkedIn
- Vertex — email received, response coming "in a few days"
- Generally targeting intersection of product design + AI/entertainment/gaming/combat sports

Needs step-by-step guidance on technical setup. No assumptions. Prefers I do as much as possible directly.

**Collaborators:**
- Sako — mentor/advisor/developer (interested in SceneOne, will share thoughts)
- KC — iOS developer

**The Kevin Smith Philosophy (the spine of everything):**
"The truth about some people is that they are filmmakers who haven't made their films yet."
SceneOne exists because Will is one of those people. That's not marketing. That's the product.
