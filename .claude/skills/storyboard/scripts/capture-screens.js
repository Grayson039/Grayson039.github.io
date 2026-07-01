#!/usr/bin/env node
/**
 * Captures a real screenshot of every screen listed in a storyboard flow.json,
 * by loading the app once and driving it through each screen's activation call
 * (e.g. goTo('welcome')) rather than screenshotting static markup.
 *
 * Usage:
 *   NODE_PATH="$(npm root -g)" node capture-screens.js <path/to/flow.json> [outDir]
 *
 * flow.json shape: see sceneone/storyboard/flow.json for a real example.
 */
const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (e) {
    // Fall back to a globally installed copy (pre-installed in Claude Code sandboxes).
    const { execSync } = require('child_process');
    const globalRoot = execSync('npm root -g').toString().trim();
    return require(path.join(globalRoot, 'playwright'));
  }
}

async function main() {
  const flowPath = process.argv[2];
  if (!flowPath) {
    console.error('Usage: node capture-screens.js <path/to/flow.json> [outDir]');
    process.exit(1);
  }

  const flowAbs = path.resolve(flowPath);
  const flowDir = path.dirname(flowAbs);
  const flow = JSON.parse(fs.readFileSync(flowAbs, 'utf8'));
  const outDir = path.resolve(process.argv[3] || path.join(flowDir, 'screens'));
  fs.mkdirSync(outDir, { recursive: true });

  const sourcePath = path.resolve(flowDir, flow.source);
  const sourceUrl = 'file://' + sourcePath;
  const viewport = flow.viewport || { width: 1440, height: 900 };
  const activateTemplate = flow.activateFn || null;

  const { chromium } = loadPlaywright();
  const launchOpts = {};
  if (fs.existsSync('/opt/pw-browsers/chromium')) {
    launchOpts.executablePath = '/opt/pw-browsers/chromium';
  }

  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({ viewport });

  console.log(`Loading ${sourceUrl}`);
  await page.goto(sourceUrl, { waitUntil: 'load' });
  await page.waitForTimeout(400);

  for (const node of flow.nodes) {
    try {
      const activate = node.activate || (activateTemplate ? activateTemplate.replace('{id}', node.id) : null);
      if (activate) {
        await page.evaluate((code) => {
          // eslint-disable-next-line no-eval
          window.eval(code);
        }, activate);
      }
      if (node.selector) {
        await page.waitForSelector(node.selector, { state: 'visible', timeout: 5000 }).catch(() => {});
      }
      await page.waitForTimeout(250);

      const outFile = path.join(outDir, `${node.id}.png`);
      await page.screenshot({ path: outFile });
      console.log(`  captured ${node.id} -> ${path.relative(process.cwd(), outFile)}`);
    } catch (err) {
      console.warn(`  failed to capture "${node.id}": ${err.message}`);
    }
  }

  await browser.close();
  console.log(`Done. Screenshots in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
