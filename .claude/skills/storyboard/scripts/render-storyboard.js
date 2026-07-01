#!/usr/bin/env node
/**
 * Renders a flow.json (+ optional screenshots/screens/<id>.png) into a single
 * self-contained, pannable/zoomable HTML storyboard: real screens as nodes,
 * arrows for every navigation path between them.
 *
 * Usage:
 *   node render-storyboard.js <path/to/flow.json> [out.html] [screensDir]
 *
 * Falls back to a labeled placeholder box for any node without a screenshot,
 * so this works even before capture-screens.js has been run.
 */
const fs = require('fs');
const path = require('path');

const NODE_W = 300;
const NODE_H = 190;
const LEVEL_GAP_X = 480;
const COL_GAP_Y = 300;

function autoLayout(nodes, edges) {
  // Fallback layering for graphs that didn't specify level/col: BFS from
  // whatever node has the lowest in-degree, breaking cycles as we go.
  const indeg = {};
  nodes.forEach((n) => (indeg[n.id] = 0));
  edges.forEach((e) => (indeg[e.to] = (indeg[e.to] || 0) + 1));
  const roots = nodes.filter((n) => indeg[n.id] === (Math.min(...Object.values(indeg))));
  const level = {};
  const queue = roots.length ? roots.map((n) => n.id) : [nodes[0].id];
  queue.forEach((id) => (level[id] = 0));
  const adj = {};
  edges.forEach((e) => {
    (adj[e.from] = adj[e.from] || []).push(e.to);
  });
  let i = 0;
  while (i < queue.length) {
    const cur = queue[i++];
    for (const next of adj[cur] || []) {
      if (level[next] === undefined || level[next] < level[cur] + 1) {
        if (level[next] === undefined) queue.push(next);
        level[next] = Math.max(level[next] || 0, level[cur] + 1);
      }
    }
  }
  const byLevel = {};
  nodes.forEach((n) => {
    n.level = level[n.id] || 0;
    byLevel[n.level] = byLevel[n.level] || [];
    n.col = byLevel[n.level].length;
    byLevel[n.level].push(n.id);
  });
}

function rectEdgeIntersection(cx, cy, w, h, tx, ty) {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const hw = w / 2;
  const hh = h / 2;
  const scaleX = dx !== 0 ? hw / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? hh / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return [cx + dx * scale, cy + dy * scale];
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function main() {
  const flowPath = process.argv[2];
  if (!flowPath) {
    console.error('Usage: node render-storyboard.js <path/to/flow.json> [out.html] [screensDir]');
    process.exit(1);
  }
  const flowAbs = path.resolve(flowPath);
  const flowDir = path.dirname(flowAbs);
  const flow = JSON.parse(fs.readFileSync(flowAbs, 'utf8'));
  const outPath = path.resolve(process.argv[3] || path.join(flowDir, 'storyboard.html'));
  const screensDir = path.resolve(process.argv[4] || path.join(flowDir, 'screens'));

  const nodes = flow.nodes.map((n) => ({ ...n }));
  const hasLayout = nodes.every((n) => typeof n.level === 'number' && typeof n.col === 'number');
  if (!hasLayout) autoLayout(nodes, flow.edges);

  const byId = {};
  nodes.forEach((n) => (byId[n.id] = n));

  const minCol = Math.min(...nodes.map((n) => n.col));
  nodes.forEach((n) => {
    n.x = 80 + n.level * LEVEL_GAP_X;
    n.y = 80 + (n.col - minCol) * COL_GAP_Y;
  });

  const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_W + 120;
  const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_H + 120;

  const nodeHtml = nodes
    .map((n) => {
      const imgPath = path.join(screensDir, `${n.id}.png`);
      let imgTag;
      if (fs.existsSync(imgPath)) {
        const b64 = fs.readFileSync(imgPath).toString('base64');
        imgTag = `<img src="data:image/png;base64,${b64}" alt="${esc(n.label)}" />`;
      } else {
        imgTag = `<div class="placeholder">No screenshot yet<br/>run capture-screens.js</div>`;
      }
      return `
      <div class="node" style="left:${n.x}px; top:${n.y}px;" data-id="${esc(n.id)}" onclick="selectNode('${esc(n.id)}')">
        <div class="node-thumb">${imgTag}</div>
        <div class="node-caption">
          <span class="node-label">${esc(n.label)}</span>
          ${n.tag ? `<span class="node-tag">${esc(n.tag)}</span>` : ''}
        </div>
      </div>`;
    })
    .join('\n');

  const edgesData = flow.edges.map((e) => {
    const a = byId[e.from];
    const b = byId[e.to];
    if (!a || !b) return null;
    const acx = a.x + NODE_W / 2;
    const acy = a.y + NODE_H / 2;
    const bcx = b.x + NODE_W / 2;
    const bcy = b.y + NODE_H / 2;
    const [x1, y1] = rectEdgeIntersection(acx, acy, NODE_W, NODE_H, bcx, bcy);
    const [x2, y2] = rectEdgeIntersection(bcx, bcy, NODE_W, NODE_H, acx, acy);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return { ...e, x1, y1, x2, y2, mx, my };
  }).filter(Boolean);

  const edgeSvg = edgesData
    .map((e) => {
      const cls = e.style === 'error' ? 'edge error' : 'edge';
      return `<line class="${cls}" x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" marker-end="url(#arrow${e.style === 'error' ? '-error' : ''})" />`;
    })
    .join('\n');

  const edgeLabels = edgesData
    .map((e) => {
      if (!e.label) return '';
      return `<div class="edge-label ${e.style === 'error' ? 'error' : ''}" style="left:${e.mx}px; top:${e.my}px;">${esc(e.label)}</div>`;
    })
    .join('\n');

  const notesJson = JSON.stringify(
    nodes.reduce((acc, n) => {
      acc[n.id] = { label: n.label, tag: n.tag || '', note: n.note || '' };
      return acc;
    }, {})
  );

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(flow.title || 'Storyboard')}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0b0d12; color: #e7e9ee; overflow: hidden; }
  #topbar { position: fixed; top: 0; left: 0; right: 0; height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 18px; background: #12141b; border-bottom: 1px solid #23262f; z-index: 10; }
  #topbar h1 { font-size: 15px; margin: 0; font-weight: 700; }
  #topbar .sub { font-size: 12px; color: #8a8f9c; }
  #zoomctl { position: fixed; bottom: 18px; left: 18px; background: #12141b; border: 1px solid #23262f; border-radius: 10px; padding: 6px 10px; display: flex; align-items: center; gap: 8px; z-index: 10; font-size: 13px; }
  #zoomctl button { background: #1c1f28; border: 1px solid #2a2e3a; color: #e7e9ee; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; }
  #viewport { position: absolute; top: 56px; left: 0; right: 0; bottom: 0; overflow: hidden; cursor: grab; }
  #viewport.grabbing { cursor: grabbing; }
  #canvas { position: absolute; transform-origin: 0 0; }
  .node { position: absolute; width: ${NODE_W}px; background: #12141b; border: 1px solid #262a35; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,.35); cursor: pointer; transition: border-color .15s; }
  .node:hover, .node.selected { border-color: #3eede7; }
  .node-thumb { width: 100%; height: ${NODE_H}px; background: #060708; display: flex; align-items: center; justify-content: center; }
  .node-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
  .placeholder { color: #565b68; font-size: 11px; text-align: center; padding: 8px; }
  .node-caption { padding: 8px 10px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .node-label { font-size: 12.5px; font-weight: 600; }
  .node-tag { font-size: 9.5px; color: #3eede7; background: rgba(62,237,231,.1); border: 1px solid rgba(62,237,231,.25); border-radius: 100px; padding: 2px 7px; white-space: nowrap; }
  svg#edges { position: absolute; top: 0; left: 0; overflow: visible; pointer-events: none; }
  .edge { stroke: #4a5468; stroke-width: 2; }
  .edge.error { stroke: #e5637a; stroke-dasharray: 5 4; }
  .edge-label { position: absolute; transform: translate(-50%, -50%); background: #171a22; border: 1px solid #262a35; border-radius: 100px; padding: 3px 9px; font-size: 10.5px; color: #b8bcc8; white-space: nowrap; }
  .edge-label.error { color: #e5637a; border-color: rgba(229,99,122,.3); }
  #panel { position: fixed; top: 56px; right: 0; bottom: 0; width: 320px; background: #12141b; border-left: 1px solid #23262f; padding: 20px; transform: translateX(100%); transition: transform .2s; z-index: 10; overflow-y: auto; }
  #panel.open { transform: translateX(0); }
  #panel h2 { font-size: 16px; margin: 0 0 4px; }
  #panel .tag { display: inline-block; font-size: 10px; color: #3eede7; margin-bottom: 12px; }
  #panel p { font-size: 13px; line-height: 1.6; color: #c3c7d1; }
  #panel .close { position: absolute; top: 16px; right: 16px; cursor: pointer; color: #8a8f9c; background: none; border: none; font-size: 16px; }
</style>
</head>
<body>
  <div id="topbar">
    <h1>${esc(flow.title || 'Storyboard')}</h1>
    <span class="sub">${nodes.length} screens · ${flow.edges.length} paths · drag to pan, scroll to zoom, click a screen for notes</span>
  </div>
  <div id="viewport">
    <div id="canvas">
      <svg id="edges" width="${maxX}" height="${maxY}">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#4a5468" />
          </marker>
          <marker id="arrow-error" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#e5637a" />
          </marker>
        </defs>
        ${edgeSvg}
      </svg>
      ${edgeLabels}
      ${nodeHtml}
    </div>
  </div>
  <div id="zoomctl">
    <button onclick="zoomBy(-0.1)">−</button>
    <span id="zoomlabel">100%</span>
    <button onclick="zoomBy(0.1)">+</button>
    <button onclick="resetView()" style="width:auto;padding:0 8px;">reset</button>
  </div>
  <div id="panel">
    <button class="close" onclick="closePanel()">✕</button>
    <span class="tag" id="panel-tag"></span>
    <h2 id="panel-title"></h2>
    <p id="panel-note"></p>
  </div>
<script>
  const notes = ${notesJson};
  const viewport = document.getElementById('viewport');
  const canvas = document.getElementById('canvas');
  let scale = 0.75, panX = 40, panY = 20, dragging = false, lastX = 0, lastY = 0;

  function apply() {
    canvas.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
    document.getElementById('zoomlabel').textContent = Math.round(scale * 100) + '%';
  }
  function zoomBy(d) { scale = Math.min(2, Math.max(0.15, scale + d)); apply(); }
  function resetView() { scale = 0.75; panX = 40; panY = 20; apply(); }

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.08 : -0.08);
  }, { passive: false });

  viewport.addEventListener('mousedown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; viewport.classList.add('grabbing');
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    panX += e.clientX - lastX; panY += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY; apply();
  });
  window.addEventListener('mouseup', () => { dragging = false; viewport.classList.remove('grabbing'); });

  function selectNode(id) {
    document.querySelectorAll('.node').forEach((n) => n.classList.toggle('selected', n.dataset.id === id));
    const info = notes[id];
    if (!info) return;
    document.getElementById('panel-tag').textContent = info.tag;
    document.getElementById('panel-title').textContent = info.label;
    document.getElementById('panel-note').textContent = info.note;
    document.getElementById('panel').classList.add('open');
  }
  function closePanel() {
    document.getElementById('panel').classList.remove('open');
    document.querySelectorAll('.node').forEach((n) => n.classList.remove('selected'));
  }
  apply();
</script>
</body>
</html>
`;

  fs.writeFileSync(outPath, html);
  console.log(`Storyboard written to ${outPath}`);
}

main();
