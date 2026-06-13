# Kitchen Bandits — Design Handoff
**Branch:** `claude/ladle-design-tokens`
**Figma file:** Kitchen Bandits — App Screens (triageaisupport@gmail.com account)
**Prototype:** `/ourtable/screens/` — open any `.html` file in a browser to interact

---

## What exists right now

### Figma frames (static, editable)
| Frame | Page | Status |
|---|---|---|
| Onboarding — Slides 1–5 | Onboarding | Done |
| Home — Light | Home & App | Done |
| Auth — Welcome | Home & App | Done (plugin v2) |
| Auth — Sign In | Home & App | Done (plugin v2) |
| Onboarding — Complete | Home & App | Done (plugin v2) |
| Home — Dark | Home & App | Done (plugin v2) |
| Search | Home & App | Done (plugin v2) |
| Library | Home & App | Done (plugin v2) |
| Design Tokens | Design Tokens | Done — 18 color styles, 9 text styles |

> The Figma frames are **wireframe-quality** — correct layout, hierarchy, colors, and copy. They are not pixel-perfect comps. Sako should use them as structural reference and apply the design system on top.

### HTML interactive prototypes (click/tap to navigate)
| File | What it covers |
|---|---|
| `00-onboarding-illustrated.html` | 5-slide illustrated onboarding with Whisker |
| `01-auth-onboarding.html` | Full auth flow: Welcome → Sign In → Create Account → Household Setup → Complete |
| `02-home-search-library.html` | Home, Search, Search Results, Library (light + dark) |
| `03-recipe-detail.html` | Recipe detail view |
| `04-add-recipe.html` | Add recipe via URL or manual entry |
| `05-fridge-pantry.html` | Fridge / pantry scan screen |
| `06-grocery-list.html` | Grocery list |
| `08-recipe-book.html` | Recipe book / collection view |

To view: serve the repo locally (`npx serve . -p 4444`) or open the HTML files directly in a browser.

---

## Design system — single source of truth

**File:** `ourtable/our-table-design-system.js`

All colors, typography, spacing, and reusable components live here. Every screen imports it. Change a token here and all screens update.

### Color tokens
```
Light theme (OT.L)          Dark theme (OT.D)
─────────────────────       ──────────────────
bg:        #F5F1EB          bg:      #1E1525
card:      #FFFFFF          card:    #2A1F33
primary:   #6B4FA8          primary: #A685D4
secondary: #C3B1E1          secondary:#C3B1E1
text:      #1E1A2E          text:    #F0ECFA
muted:     #9A8A78          muted:   #A090B0
accent:    #F6C45C          accent:  #F6C45C  (gold — ratings/badges)
```

### Typography
- **Font:** Nunito (loaded from Google Fonts in all screens)
- **Weights used:** 400 (body), 600 (semi), 700 (bold), 800 (extra bold), 900 (black)
- Figma frames use **Inter** (always available in Figma) as a stand-in

### Spacing / radius constants
```
Spacing: xs=4 sm=8 md=12 lg=16 xl=20 section=24
Radius:  sm=8 md=12 lg=16 xl=20 pill=100
```

---

## Brand assets

| Asset | Path | Notes |
|---|---|---|
| App icon | `ourtable/kb-icon.png` | White "K + raccoon" on transparent bg — place on #6B4FA8 rounded square |
| Whisker wave | `ourtable/whisker-wave.png` | Onboarding welcome, home header |
| Whisker cook | `ourtable/whisker-cook.png` | Onboarding complete |
| Whisker jump | `ourtable/whisker-jump.png` | Search screen header |
| Whisker pour | `ourtable/whisker-pour.png` | Available for fridge/pantry screen |
| Whisker cool | `ourtable/whisker-cool.png` | Library screen header |
| Onboarding illustrations | `ourtable/ob-1.png` – `ob-5.png` | AI-generated (Gemini), 704×1520px each, used in `00-onboarding-illustrated.html` |

---

## Mascot usage rules
- Whisker appears at: **onboarding slides**, **onboarding complete**, **auth welcome**, **empty states**, and **header icons** (small, 32–38px)
- Do NOT put Whisker on every screen — he loses impact
- The 5 illustrations (`ob-1` through `ob-5`) are full-bleed phone backgrounds — they're not for reuse in individual cards

---

## What Sako should do next

### Priority 1 — Polish existing Figma frames
The plugin-generated frames are structural scaffolding. Key things to improve:
- Replace the "Whisker" placeholder circles with the actual PNG illustrations
- Apply Nunito font to all text layers (plugin used Inter as fallback)
- Add real Pexels food photos to recipe cards (IDs are in `02-home-search-library.html` SAMPLE DATA section)
- Refine the Home — Dark frame to match the light version quality

### Priority 2 — Missing screens (not yet in Figma)
These exist as HTML prototypes but haven't been pushed to Figma:
- Recipe Detail
- Add Recipe (URL import + manual)
- Fridge / Pantry scan
- Grocery List
- Profile / Settings

### Priority 3 — Component library
The design tokens page has colors and type styles. Still needed:
- Recipe card component (small, large, list variants)
- Button component (primary, secondary, ghost)
- Input field component
- Nav bar component
- Filter chip component

---

## How to add more screens to Figma (without waiting on rate limits)

A local Figma plugin handles all frame creation:

1. **Plugin location (Will's machine):** `C:\Users\Will\Documents\kb-figma-plugin\`
2. **To update plugin code:** edit `code.js`, or download latest from repo at `ourtable/figma-plugin-v2.js`
3. **To run:** Figma Desktop → Plugins → Development → KB Add Screens
4. **Important:** Plugin takes 3–5 min to run. Don't close Figma. Wait for the "Done!" toast.

To add a new screen, add a new `mkFrame()` block to `figma-plugin-v2.js` following the same pattern as existing screens.

---

## Repo structure
```
ourtable/
├── our-table-design-system.js   ← ALL tokens + components — edit this first
├── screens/
│   ├── 00-onboarding-illustrated.html
│   ├── 01-auth-onboarding.html
│   ├── 02-home-search-library.html
│   ├── 03-recipe-detail.html
│   ├── 04-add-recipe.html
│   ├── 05-fridge-pantry.html
│   ├── 06-grocery-list.html
│   └── 08-recipe-book.html
├── figma-plugin-v2.js           ← plugin source to copy into kb-figma-plugin/code.js
├── kb-icon.png
├── whisker-wave.png
├── whisker-cook.png
├── whisker-jump.png
├── whisker-pour.png
├── whisker-cool.png
└── ob-1.png – ob-5.png          ← onboarding illustrations
```

---

## Key decisions already made (don't change these)

| Decision | Rationale |
|---|---|
| App name: **Kitchen Bandits** | Raccoon chef = bandit. "OurTable" / "Ladle" retired. |
| Palette: purple/lavender + gold | All warmth orange variants removed — brand is purple only |
| Mascot: **Whisker** the raccoon chef | Toque hat, oversized ladle, 3D chibi style |
| Onboarding: full-bleed illustrated slides | Matches Nudge sibling app style |
| Font: **Nunito** | Rounded, friendly, readable at small sizes |
| Recipe card borders: `primary` at 50% opacity | Unifies card grid without harsh contrast |

---

*Last updated: June 2026 — branch `claude/ladle-design-tokens` / PR #4*
