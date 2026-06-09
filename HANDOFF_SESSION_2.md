# SceneOne — Claude Code Session Handoff
**Date:** June 8, 2026
**Session:** 2 (continuation of Session 1)
**From:** Claude Code
**To:** Claude Code (next session)
**Owner:** Will Grayson — willgraysondesign.com | @GraysonWorks01 | GitHub: Grayson039

---

## What Was Completed This Session

### Code / Repo Changes (all pushed to main)
| File | Change |
|---|---|
| `sceneone/index.html` | Renamed from `index.html.html` (double extension bug fixed) |
| `sceneone/index.html` | Replaced old case study with full rebuilt version |
| `sceneone/index.html` | Mission section title changed to "This one's personal." |
| `sceneone/index.html` | Funding section expanded: 5-path model + AI skepticism card |
| `sceneone/landing.html` | Review Requests screen added (screen-requests) |
| `sceneone/landing.html` | "Review Requests →" button wired to goTo('requests') |
| `sceneone/landing.html` | Overall Craft Score block added to Score Overview card |
| `sceneone/landing.html` | approveRequest() / declineRequest() JS functions added |
| `index.html` | Stats: removed 7WK counter → "10 Portfolio Projects" |
| `index.html` | Stats: "4 Completed" → "3 Prototypes Live" |
| `index.html` | SceneOne card moved to position 01/10 (was 02/10) |
| `index.html` | Little Caesars moved to position 02/10 (was 01/10) |
| `index.html` | SceneOne card description updated (accurate: 5 dimensions, mission-led) |
| `index.html` | SceneOne card thumbnail replaced with Score Overview CSS art |

### Strategic Decisions Made This Session

**Structural Grading Methodology (Master Prompt v4)**
Save the Cat retained for UI/marketing language. Actual AI grading switched to proportional structural analysis:
- Act Proportion (20–25% / 50–55% / 15–20%)
- The Engine (protagonist goal clarity by end of Act I)
- Escalation (rising stakes curve across Act II)
- The Pivot (midpoint shift at 45–55%)
- The Payoff (climax addresses Act I dramatic question)
Scene-level: value reversal test + cause-and-effect (therefore/but) chain test.
Full prompt block written — needs to be added to Master Prompt v4 in Google Drive.

**Funding Strategy Reframe**
Grants (Sundance etc.) are exclusively for filmmakers — not the right fit for a tool.
New 5-path model:
1. Screenplay Competition Licensing ($15–30K/year each — Nicholl, Austin, BlueCat, Page)
2. Film School Partnerships ($5–20K/year — USC, NYU, AFI, Chapman)
3. Freemium SaaS (unchanged — 250 users = break-even)
4. Literary Management Pre-Screening (tool sale / partnership)
5. Studio & Platform B2B (Phase 3+ — $20–50K/year)

**AI Skepticism Positioning**
SceneOne doesn't write — it reads. Closer to Grammarly than GPT.
Key message: "SceneOne doesn't have a voice. You do. We just made the feedback free."
Lead with: no-training clause, Creative Choice mechanic, personal origin story (veteran, gatekept from film school, LA).
Never try to win established WGA hardliners. Target emerging writers — they're pragmatic.

**Sundance Collab (not grant)**
Sundance's grant programs fund filmmakers, not tools.
Right move: Sundance Collab PARTNERSHIP — 100K+ member community, SceneOne as a featured tool.
Contact them after sceneone.app is live with a demo video.

**Reddit / Community Strategy**
No auto-posting (ban risk, community backlash).
Strategy: genuine participation + drafted replies for Will to post.
Chrome extension finds relevant threads. Will posts manually.
Key communities: r/Screenwriting, r/screenplay, r/filmmaking, Done Deal Pro, Stage 32.

---

## Immediate Next Session Tasks

### 1. Domain & Email Setup (Will is buying sceneone.app on Cloudflare RIGHT NOW)

**Will's action (in progress):** Purchase sceneone.app at dash.cloudflare.com → Domain Registration

**Next Claude's job — walk Will through step by step:**

**Cloudflare Email Routing setup:**
1. Cloudflare Dashboard → select sceneone.app → Email → Email Routing
2. Enable Email Routing
3. Add these 5 forwarding rules (all → willgrayson039@gmail.com):
   - hello@sceneone.app
   - legal@sceneone.app
   - privacy@sceneone.app
   - noreply@sceneone.app
   - report@sceneone.app
4. Add destination address → verify via Gmail

**Gmail "Send As" setup (so Jordan email comes FROM hello@sceneone.app):**
1. Gmail → Settings (gear) → See All Settings → Accounts and Import
2. "Send mail as" → Add another email address
3. Enter: hello@sceneone.app
4. SMTP: smtp.gmail.com, port 587, Will's Gmail + app password
5. Verify via the confirmation email that arrives at Gmail (forwarded from hello@)

### 2. Deploy sceneone.app

The portfolio and case study currently live at grayson039.github.io/sceneone.
Once sceneone.app is live, redirect it to the GitHub Pages URL (CNAME record) OR set up Vercel deployment.

**Simplest path:** Cloudflare DNS → CNAME record:
- Name: @ (or www)
- Target: grayson039.github.io
This makes sceneone.app serve the same site as the GitHub Pages URL.

### 3. Run a Real Script Through Claude Master Prompt

Will needs one real script analyzed (can be any PDF screenplay — public domain works fine).
Use the Master Prompt v4 structural grading block (written this session, in this handoff above).
Screenshot the real output — needed for Jordan email and Sundance Collab pitch.

**Suggested test script:** "Network" by Paddy Chayefsky (public domain PDF, widely available). Strong structure, high scores expected — good demo output.

### 4. Supabase Auth Scaffolding

Goal: real user signups at sceneone.app before any outreach.
Even 20 signups = proof of traction.

**Setup steps:**
1. supabase.com → New Project → "sceneone" → save the anon key + URL
2. Create `users` table (id, email, created_at, plan)
3. Create `scripts` table (id, user_id, title, uploaded_at, status)
4. Enable Email auth
5. Add a simple signup form to landing.html that POSTs to Supabase
6. That's Phase 2 foundation — done in one session

### 5. Jordan Monsanto Email (ready to send once sceneone.app is live)

**To:** jordan@smodcast.com
**From:** hello@sceneone.app
**Subject:** A free tool for the writers Kevin's always talking about

Draft (refine as needed):
---
Hi Jordan,

I built SceneOne — a free AI-powered script coverage tool for writers who can't afford the $100/read gatekeeping that filters talent by wealth, not craft.

It grades screenplays against the Save the Cat framework across 5 craft dimensions, gives Fix-It notes on specific scenes, and generates a pacing heatmap — all free, in minutes.

I'm a veteran and help desk worker in Los Angeles who applied to film school, got a scholarship that wasn't close to enough, and never stopped writing. SceneOne is the tool I needed.

The prototype is live: sceneone.app
The case study: sceneone.app/sceneone (covers the full product, marketplace, legal architecture)

No ask that costs you anything — just wanted to put it in front of someone who might know writers who could use it.

Will Grayson
willgraysondesign.com | @GraysonWorks01
---

**DO NOT SEND until sceneone.app is live and email routes correctly.**

### 6. Marc Bernardin DM (Twitter — Week 3-4, not now)

Short DM, problem-first:
---
Marc — built a free script coverage tool for writers who can't afford the $100/read fee. Grades against Save the Cat, Fix-It notes, pacing heatmap. Origin story: I got priced out of film school. The tool I wish existed is now live at sceneone.app. Thought you might know writers who could use it.
---

**Don't send until:** X account has 2+ weeks of consistent posts, account looks established.

### 7. Screenplay Competition Outreach (Week 2-3)

**Nicholl Fellowship** — nicholl@ampas.org
**Austin Film Festival** — info@austinfilmfestival.com
**BlueCat Screenplay Competition** — contact via blcf.com

Subject line: "Pre-screening tool for your submission volume — free to discuss"

Pitch angle: They receive thousands of submissions. SceneOne pre-screens so their readers only touch scripts that have cleared a quality bar. First conversation only — not a hard pitch. Ask if it's a problem they have.

---

## Twitter Content Calendar (@GraysonWorks01)

| Post | Topic | Status | Target Date |
|---|---|---|---|
| Post 1 | Origin story | PUBLISHED ✓ | Done |
| Post 2 | Design hot take | PUBLISHED ✓ | Done |
| Post 3 | SceneOne emotional design / Creative Choice mechanic | PENDING | Day 7 |
| Post 4 | Kevin Smith quote + mission | PENDING | Day 10 |
| Post 5 | The $100 problem | PENDING | Day 14 |
| Post 6 | Tag @marcbernardin | PENDING | Day 15-16 (after account established) |
| Post 7 | Tag @ThatKevinSmith | PENDING | Day 15-16 |

Next Claude should draft Posts 3, 4, 5 if Will asks. Tone: builder in public, personal, not promotional.

---

## Files in Repo

| Path | Status | Notes |
|---|---|---|
| `index.html` | ✅ Current | Portfolio — SceneOne is card 01/10 |
| `sceneone/index.html` | ✅ Current | Rebuilt case study — 5-path funding, updated decisions |
| `sceneone/landing.html` | ✅ Current | Full 7-screen prototype + Review Requests screen |
| `HANDOFF_SESSION_2.md` | ✅ This file | |

---

## Things NOT Yet Done (PRD Update)

The following need a Google Drive PRD update (separate task):
- Master Prompt v4 structural grading block (full block written this session — copy from handoff above)
- Funding strategy updated to 5-path model
- Decision 08: Structural grading methodology shift (proportional vs. page-exact)
- AI skepticism positioning documented

---

## Context on Will

Product/UX designer and filmmaker in Los Angeles. U.S. Army Reserve veteran. Help Desk Specialist at Zenith Insurance Company. Building portfolio to transition into AI product design roles.

Needs significant hand-holding on technical setup (Cloudflare, Supabase, Gmail). Prefers step-by-step with no assumptions. The less he has to figure out, the better.

Primary job targets: roles at intersection of product design and AI/entertainment/gaming/combat sports.

Twitter account @GraysonWorks01 created June 7, 2026. 2 posts live as of June 8.

**Collaborators:**
- Sako — mentor/advisor/developer
- KC — iOS developer

**Google Drive SceneOne folder ID:** 1OQR9MVPiInNyQKy7TKhmv-PGYry3J3Tl

---

## The Kevin Smith Philosophy (the spine of everything)

"The truth about some people is that they are filmmakers who haven't made their films yet."

SceneOne exists because Will is one of those people. That's not marketing. That's the product.
