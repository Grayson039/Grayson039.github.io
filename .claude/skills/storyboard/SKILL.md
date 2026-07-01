---
name: storyboard
description: Generate a visual storyboard/wireframe of an app's screens with arrows showing how they connect, from real rendered screenshots. Use when the user wants to visualize a flow, troubleshoot navigation/UX issues, or "see the whole app at once" before discussing changes to it (e.g. sceneone).
---

# Storyboard wireframe tool

Renders an app's screens as real screenshots laid out on a pannable/zoomable
canvas, connected by labeled arrows showing every navigation path between
them (which button/action moves the user from screen A to screen B). This is
a local, self-contained equivalent of the "visual plan" storyboard idea —
no external service or account required, everything stays in this repo.

Use this when:
- Troubleshooting a multi-screen flow (e.g. sceneone) and you need to see the
  whole picture instead of one file at a time.
- The user wants to explain a UX/navigation change visually instead of in
  prose ("this screen should connect to that one instead").
- Onboarding a new area of the app you haven't touched before.

## How it works

1. **`flow.json`** describes the graph: each screen (`nodes`, with a CSS
   `selector` for its container) and each transition between screens
   (`edges`, with a `label` describing the trigger, e.g. "Analyze Script").
2. **`scripts/capture-screens.js`** loads the real app in headless Chromium
   (via Playwright), drives it through each screen's activation call (e.g.
   `goTo('upload')`), and screenshots the actual rendered UI.
3. **`scripts/render-storyboard.js`** lays the screenshots out on a canvas by
   `level`/`col` (or auto-layers them if not specified) and draws SVG arrows
   for every edge, producing one self-contained `storyboard.html`.

## Building a flow.json for a new app/area

1. Find the screen containers: grep for the CSS class/pattern the app uses
   to show/hide views (e.g. `class="screen"` + `id="screen-x"`), or route
   definitions for a router-based app.
2. Find the transition calls: grep for the function that switches screens
   (e.g. `goTo('x')`, `navigate('/x')`, `setView('x')`) and note which
   screen's markup or handler each call site lives in — that's an edge.
3. Write `flow.json` with one node per screen and one edge per transition.
   Give each edge a short `label` describing the trigger (button text or
   the user action), and mark error/fallback transitions with
   `"style": "error"` so they render as a dashed red line instead of a solid
   one.
4. Optionally set `level` (horizontal stage in the journey) and `col`
   (vertical position within that stage) per node for a clean left-to-right
   layout. If omitted, the renderer auto-layers via BFS from the
   lowest-in-degree node — fine for simple/acyclic flows, less clean for
   flows with lots of back-buttons.
5. Set `activateFn` (a template like `"goTo('{id}')"`) if every screen uses
   the same activation call, or set `activate` per-node for anything
   irregular (multi-step setup, filling fake data first, etc.).

See `sceneone/storyboard/flow.json` for a complete real example (13 screens,
25 edges, reverse-engineered from `sceneone/app.js`'s `goTo()` calls).

## Running it

```bash
# 1. Capture real screenshots of every screen (needs Playwright; it's
#    pre-installed globally in Claude Code sandboxes but not as a local
#    package, so point NODE_PATH at the global install):
NODE_PATH="$(npm root -g)" node .claude/skills/storyboard/scripts/capture-screens.js sceneone/storyboard/flow.json

# 2. Render the storyboard HTML (no dependencies, pure Node):
node .claude/skills/storyboard/scripts/render-storyboard.js sceneone/storyboard/flow.json
```

This produces `sceneone/storyboard/storyboard.html` — open it in a browser.
Step 2 works even without step 1 (falls back to labeled placeholder boxes),
so you can iterate on the graph shape before spending time on screenshots.

Re-run both scripts whenever screens or navigation change, so the storyboard
stays trustworthy as a reference during troubleshooting.
