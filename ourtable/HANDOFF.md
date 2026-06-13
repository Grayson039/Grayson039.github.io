# Kitchen Bandits — Claude Session Handoff

## Project overview
Recipe app called **Kitchen Bandits**. Raccoon chef mascot named **Whisker**. Purple/lavender palette with honey gold accent. Interactive HTML prototypes + Figma frames. No framework — vanilla JS, no build step.

**Branch:** `claude/ladle-design-tokens`
**PR:** #4 (draft, open)
**Repo:** `grayson039/grayson039.github.io`
**Working dir:** `/home/user/Grayson039.github.io/`

---

## Architecture

### Design system
`ourtable/our-table-design-system.js` — single JS file, global `OT` object. Every screen imports this via `<script src="../our-table-design-system.js">`.

Key exports:
- `OT.L` / `OT.D` — light/dark theme token objects
- `OT.T` — typography (font, sizes, weights)
- `OT.S` — spacing constants
- `OT.R` — border radius constants
- `OT.c.*` — component functions (statusBar, navBar, btn, field, appIcon, mascotWhisker, etc.)
- `OT.nav(screens, startId, containerId, opts)` — wires JS navigation between screens

### Color tokens (OT.L light / OT.D dark)
```
primary:   #6B4FA8 / #A685D4   (purple — CTAs, active nav)
secondary: #C3B1E1 / #C3B1E1   (lavender — section headers, accents)
bg:        #F5F1EB / #1E1525
card:      #FFFFFF / #2A1F33
text:      #1E1A2E / #F0ECFA
muted:     #9A8A78 / #A090B0
border:    #E2DCF0 / rgba(195,177,225,0.18)
chip:      #EDE7F6 / #2E2040
accent:    #F6C45C / #F6C45C   (honey gold — ratings, badges)
```

### Screen files (`ourtable/screens/`)
| File | Content |
|------|---------|
| `00-onboarding-illustrated.html` | 5-slide illustrated onboarding, swipeable, JS slide track |
| `01-auth-onboarding.html` | Welcome → Sign In → Create Account → Household Setup → Complete |
| `02-home-search-library.html` | Home, Search, Search Results, Library (light + dark) |
| `03-recipe-detail.html` | Recipe detail |
| `04-add-recipe.html` | Add recipe (URL import / manual) |
| `05-fridge-pantry.html` | Fridge scan / pantry |
| `06-grocery-list.html` | Grocery list |
| `08-recipe-book.html` | Recipe book / collections |

### Assets (`ourtable/`)
```
kb-icon.png           — App icon (white K+raccoon on transparent, place on #6B4FA8 bg)
whisker-wave.png      — pose 0: waving on cloud (welcome/home header)
whisker-cook.png      — pose 1: cooking with pot (onboarding complete)
whisker-jump.png      — pose 2: jumping with ladle (search header)
whisker-pour.png      — pose 3: pouring sauce (available/unused)
whisker-cool.png      — pose 4: arms crossed (library header)
ob-1.png – ob-5.png   — Gemini-generated full-bleed onboarding illustrations (704×1520px)
```

`c.mascotWhisker(size, pose)` renders the correct PNG by pose index (0–4).
`c.appIcon(size)` renders the KB icon on a purple rounded square.

---

## Figma situation

**File key:** `Vs0zU1mofREJsOzzmMT65t` (account: triageaisupport@gmail.com)
**Figma MCP:** Connected but on Starter plan — rate limit resets every ~4–5 days. Don't use MCP write tools until limit resets.

**Workaround:** Local Figma plugin on Will's Windows machine at `C:\Users\Will\Documents\kb-figma-plugin\code.js`. Plugin source is `ourtable/figma-plugin-v2.js` in the repo. To update plugin: edit the repo file, push, Will runs `Invoke-WebRequest` to download it, then runs it in Figma Desktop → Plugins → Development → KB Add Screens. Takes 3–5 min to run (~500 nodes).

### Figma frames currently in file
- **Onboarding page:** Slides 1–5 (full-bleed illustrated, proper)
- **Home & App page:** Home — Light, Auth — Welcome, Auth — Sign In, Onboarding — Complete, Home — Dark, Search, Library
  - Note: plugin-generated frames use Inter font (not Nunito) and placeholder circles for Whisker. Structural layout is correct, not pixel-perfect.
- **Design Tokens page:** 18 color styles, 9 text styles

### Screens NOT yet in Figma
Recipe Detail, Add Recipe, Fridge/Pantry, Grocery List, Profile/Settings

---

## What was just worked on (this session)

1. **Gemini onboarding illustrations** (`ob-1.png` – `ob-5.png`) — cherry-picked from main branch, renamed, committed
2. **`00-onboarding-illustrated.html`** — built 5-slide illustrated onboarding screen; compact bottom panel (175px) so Whisker + cloud stay visible above it
3. **Panel height fix** — used PIL pixel analysis to find cloud base at 78.5% image height (661px on 844pt screen); panel starts at 669px
4. **Figma frames** — used MCP to push Onboarding slides, Home Light, Design Tokens, then hit rate limit
5. **Figma plugin v1** — local Claude on Will's machine generated the plugin; added Auth Welcome, Sign In, Onboarding Complete via Figma Desktop
6. **Figma plugin v2** — rewrote plugin in this session; adds 6 polished screens replacing the sparse auth frames + adding Home Dark, Search, Library; fixed spread operator syntax error (Figma uses old JS engine, no `{...spread}` in object literals — use explicit `rgbA(hex, alpha)` helper instead)
7. **HANDOFF.md** — this file

---

## Known issues / gotchas

- **Figma plugin spread syntax** — Figma's plugin JS sandbox doesn't support `{...obj}` spread inside object literals. Use explicit property assignment or a helper like `rgbA(hex, a)` that returns `{r, g, b, a}`.
- **Onboarding image aspect ratio** — `ob-*.png` images are 704×1520px (ratio 2.159). On a 390×844pt phone screen they map exactly with no cropping, so `object-position` has no effect. Panel must be ≤183px tall to avoid covering cloud base.
- **No `ob-0.png`** — files are numbered 1–5, not 0–4. Slide 1 = `ob-1.png`.
- **Figma MCP rate limit** — account-level, not session-level. Hitting it in any Claude session affects all sessions on that Figma account for 4–5 days.
- **Plugin run time** — ~3–5 minutes for 6 screens (~500 nodes). Must not close Figma mid-run.

---

## Immediate next steps

1. **Confirm plugin v2 ran successfully** — Will was running it when session ended; check if Home Dark, Search, Library appeared in Figma
2. **Apply Nunito + real Whisker PNGs** — Sako's job: swap Inter for Nunito in Figma text layers, replace placeholder circles with actual Whisker PNGs
3. **Remaining screens in Figma** — when MCP resets OR extend plugin to add Recipe Detail, Fridge, Grocery List, Profile
4. **Recipe detail screen** — `03-recipe-detail.html` exists as HTML prototype; needs Figma frame

---

## How to run locally
```bash
npx serve . -p 4444
# then open http://localhost:4444/ourtable/screens/00-onboarding-illustrated.html
```
No build step. No npm install needed. Pure HTML/CSS/JS.
