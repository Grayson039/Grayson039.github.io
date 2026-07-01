SceneOne app-flow storyboard: real screens, connected by every navigation path, on a pannable/zoomable canvas.

Generated files (`screens/*.png`, `storyboard.html`) aren't checked in — they're
regenerated on demand so the repo doesn't carry megabytes of screenshots that
go stale the moment a screen changes.

```bash
# from the repo root
NODE_PATH="$(npm root -g)" node .claude/skills/storyboard/scripts/capture-screens.js sceneone/storyboard/flow.json
node .claude/skills/storyboard/scripts/render-storyboard.js sceneone/storyboard/flow.json
```

Then open `sceneone/storyboard/storyboard.html` in a browser. See
`.claude/skills/storyboard/SKILL.md` for how the graph is defined and how to
build one for another app/area.
