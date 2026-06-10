# SceneOne — Claude Code Session Handoff
**Date:** June 8, 2026
**Session:** 4 (continuation of Session 3)
**From:** Claude Code
**To:** Claude Code (next session)
**Owner:** Will Grayson — willgraysondesign.com | @GraysonWorks01 | GitHub: Grayson039

---

## Urgency Context

**Time-sensitive.** Active job applications in motion:
- **Runway ML** — Applied, messaged CEO Cristobal Valenzuela on LinkedIn. No response yet.
- **Vertex** — Email received: "we'll get back to you in a few days." Response imminent.
- **LinkedIn** — Already getting impressions and profile views.

**sceneone.net must be functional before these leads check his portfolio.**

---

## What Is Done — Everything Completed So Far

| Item | Status |
|---|---|
| `sceneone.net` live on GitHub Pages | ✅ |
| HTTPS enforced, DNS verified, CNAME in repo | ✅ |
| Portfolio card on willgraysondesign.com links to sceneone.net | ✅ |
| Supabase project `sceneone` created (ID: `zzsjgaijrngxkaqakplm`) | ✅ |
| `submissions` table created in Supabase | ✅ |
| Row level security enabled on submissions | ✅ |
| Insert + Select policies created | ✅ |
| Anthropic API key created, saved in Bitwarden ("SceneOne") | ✅ |
| Bitwarden set up with Chrome extension + Chrome passwords imported | ✅ |
| Email routing hello@sceneone.net → Gmail | ✅ |
| Reddit account Novaturient01 created | ✅ |

---

## What To Build Next Session (In Order)

### Step 1 — Supabase Edge Function: `grade-script`
This is the backend brain. It:
1. Receives raw script text + title + email
2. Calls Claude API (model: `claude-sonnet-4-6`) with the grading prompt
3. Returns structured JSON with scores + fix-it notes
4. Saves result to `submissions` table

**Anthropic API key** is saved in Will's Bitwarden under "SceneOne". He needs to add it as a Supabase secret:
- Supabase dashboard → Settings → Edge Functions → Add secret: `ANTHROPIC_API_KEY`

**Edge Function location:** `supabase/functions/grade-script/index.ts`

### Step 2 — PDF Upload UI on sceneone.net
Replace the current `index.html` hero section with a real upload form:
- PDF file input (drag + drop)
- Client-side PDF text extraction using **pdf.js** (no server needed)
- Sends extracted text to the Edge Function
- Loading state: "Grading your script... (~30 seconds)"
- On success: redirect to results page with score data in URL params or localStorage

### Step 3 — Results Page
Create `results.html` on sceneone.net showing:
- Overall Craft Score (0-100)
- 5 dimension scores with visual bars
- Fix-It Notes for weak dimensions
- Scene-level notes

---

## Grading System (Master Prompt v4 — Structural)

**5 Dimensions (20% each):**
1. **Act Proportion** — Acts should be 20-25% / 50-55% / 15-20% of total pages
2. **The Engine** — Protagonist goal clarity by end of Act I
3. **Escalation** — Rising stakes curve across Act II
4. **The Pivot** — Midpoint shift at 45-55% mark
5. **The Payoff** — Climax addresses Act I dramatic question

**Scene-level:** value reversal test + therefore/but cause-effect test

**AI framing rule:** Never say "AI." Say "structural analysis" or "automated feedback."

---

## Key Credentials & IDs

| Thing | Value |
|---|---|
| Supabase Project ID | `zzsjgaijrngxkaqakplm` |
| Supabase URL | `https://zzsjgaijrngxkaqakplm.supabase.co` |
| Supabase API keys | dashboard.supabase.com → project → Settings → API Keys |
| Anthropic API key | Saved in Bitwarden as "SceneOne" |
| Anthropic credits | $4.99 remaining |
| Local working dir | `C:\Users\Will\AppData\Local\Temp\sceneone-work\` |
| SceneOne repo | `github.com/Grayson039/SceneOne` |
| Portfolio repo | `github.com/Grayson039/Grayson039.github.io` |

---

## Outreach — Still ON HOLD

Jordan Monsanto, Marc Bernardin, Kevin Smith outreach waits until:
1. SceneOne is functional (real upload + real grades)
2. 3-5 real writers have tested it
3. @GraysonWorks01 has 2+ more weeks of consistent posts

**Twitter posts 3, 4, 5 still need to be drafted** (ask Claude next session if Will wants them).

---

## Context on Will

Product/UX designer in LA. Army Reserve veteran. Help Desk at Zenith Insurance. Transitioning into AI product design. Owns this project fully — Sako (developer friend) is interested but not a dependency.

Needs step-by-step guidance. Prefers Claude does as much as possible directly. No assumptions.

**The Kevin Smith spine:** "The truth about some people is that they are filmmakers who haven't made their films yet." SceneOne exists because Will is one of those people.
