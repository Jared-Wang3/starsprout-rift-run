import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectFile = (relativePath) =>
  new URL(`../${relativePath}`, import.meta.url);

const readProjectFile = (relativePath) =>
  readFile(projectFile(relativePath), "utf8");

test("game shell exposes every required screen and HUD surface", async () => {
  const html = await readProjectFile("public/play/index.html");

  assert.match(html, /<html\b[^>]*\blang=["']zh-CN["']/i);
  assert.doesNotMatch(html, /\uFFFD/, "HTML contains a Unicode replacement character");
  assert.match(html, /<canvas\b(?=[^>]*\bid=["']game["'])(?=[^>]*\bwidth=["']1280["'])(?=[^>]*\bheight=["']720["'])[^>]*>/i);

  const ids = Array.from(html.matchAll(/\bid=["']([^"']+)["']/gi), (match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML ids must be unique");

  for (const id of [
    "start-screen",
    "level-screen",
    "help-screen",
    "briefing",
    "pause-screen",
    "complete-screen",
    "victory-screen",
    "hud",
    "boss-hud",
    "toast",
    "touch-controls",
    "announcer",
  ]) {
    assert.match(html, new RegExp(`\\bid=["']${id}["']`), `missing #${id}`);
  }

  for (const action of [
    "continue",
    "levels",
    "help",
    "back",
    "resume",
    "restart",
    "next",
    "home",
    "mute",
    "fullscreen",
    "pause",
  ]) {
    assert.match(
      html,
      new RegExp(`\\bdata-action=["']${action}["']`),
      `missing data-action=${action}`,
    );
  }

  for (const touch of ["left", "right", "jump", "down", "shoot", "dash"]) {
    assert.match(
      html,
      new RegExp(`\\bdata-touch=["']${touch}["']`),
      `missing touch control: ${touch}`,
    );
  }

  assert.match(html, /\baria-live=["']polite["']/i);
  assert.match(html, /\baria-live=["']assertive["']/i);
  assert.match(html, /<script\s+src=["']\.\/levels\.js["']><\/script>/i);
  assert.match(html, /<script\s+src=["']\.\/game\.js["']><\/script>/i);
  assert.doesNotMatch(
    html,
    /<(?:script|link)\b[^>]*(?:src|href)=["']https?:\/\//i,
    "the offline build must not depend on a remote runtime asset",
  );
});

test("expedition shell exposes the hero profile and three unlockable sprout modules", async () => {
  const html = await readProjectFile("public/play/index.html");

  assert.match(html, /\bid=["']profile-screen["']/i, "missing the hero profile screen");
  assert.match(html, /\bdata-action=["']profile["']/i, "the expedition shell needs a profile entrance");

  for (const moduleId of ["echo", "wind", "root"]) {
    assert.match(
      html,
      new RegExp(`\\bdata-module=["']${moduleId}["']`, "i"),
      `missing the ${moduleId} sprout module button`,
    );
  }

  assert.match(
    html,
    /\bdata-module=["'](?:none|echo|wind|root)["'][^>]*\baria-pressed=|\baria-pressed=[^>]*\bdata-module=/i,
    "module buttons must expose their equipped state with aria-pressed",
  );
});

test("route renderer groups the campaign into three acts with mode tags and thumbnails", async () => {
  const source = await readProjectFile("public/play/game.js");

  assert.match(source, /function\s+renderLevelGrid\s*\(/, "missing renderLevelGrid()");
  assert.match(
    source,
    /data-act=["']?\$\{|data-act=["'][^"']*\$\{/,
    "renderLevelGrid() must emit a semantic data-act marker for each act group",
  );
  assert.match(
    source,
    /(?:level|route|mode)[-_]tag|class=["'][^"']*tag/i,
    "route cards must render their gameplay mode tags",
  );
  assert.match(
    source,
    /(?:level|route|card)[-_](?:thumb|thumbnail)|thumbnail/i,
    "route cards must render a visual thumbnail surface",
  );
});

test("touch UI supports portrait play without a blocking rotate notice", async () => {
  const html = await readProjectFile("public/play/index.html");
  const css = await readProjectFile("public/play/game.css");

  assert.doesNotMatch(html, /portrait-notice/i);
  assert.doesNotMatch(html, /请横屏游玩/);
  assert.match(css, /\.touch-controls\s*\{[^}]*\bdisplay:\s*none\s*;/s);
  assert.match(
    css,
    /@media\s*\([^)]*(?:pointer:\s*coarse|max-width:\s*900px)[^)]*\)[^{]*\{[\s\S]*?\.touch-controls\.is-visible\s*\{[^}]*\bdisplay:\s*flex\s*;/i,
  );
  assert.match(css, /\.touch-controls\s+button\s*\{[^}]*(?:\bwidth:\s*(?:4(?:\.\d+)?rem|[5-9]\dpx)|\bmin-width:\s*44px)[^}]*/s);
  assert.match(css, /@media\s*\(orientation:\s*portrait\)\s+and\s+\(max-width:\s*760px\)/i);
  assert.match(css, /\.touch-actions\s+\.touch-down\s*\{/i);
  assert.doesNotMatch(css, /\.portrait-notice\s*\{/i);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
});

test("campaign copy and level selection scale to twelve stages", async () => {
  const [html, css, source] = await Promise.all([
    readProjectFile("public/play/index.html"),
    readProjectFile("public/play/game.css"),
    readProjectFile("public/play/game.js"),
  ]);

  assert.match(html, />\s*12\s*个关卡\s*</);
  assert.match(html, />\s*3\s*场\s*BOSS\s*</i);
  assert.match(html, /12\s*\/\s*12\s*关/);
  assert.doesNotMatch(html, />\s*8\s*个关卡\s*</);
  assert.doesNotMatch(html, />\s*2\s*场\s*BOSS\s*</i);
  assert.doesNotMatch(html, /8\s*\/\s*8\s*关/);

  assert.match(css, /\.panel-screen\s*\{[^}]*\boverflow-y:\s*auto\s*;/s,
    "the twelve-card route screen must remain vertically scrollable");
  assert.match(css, /\.level-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,/s,
    "desktop route selection should fit twelve cards in three rows");
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.level-grid\s*\{[^}]*repeat\(2,/i,
    "mobile route selection should use two columns and scroll");
  assert.match(source, /level-card[^`\n]*\$\{[^}]*\.isBoss[^}]*is-boss/,
    "boss card styling must be driven by level semantics");
  assert.doesNotMatch(css, /\.level-card\[data-level=["'](?:4|8|12)["']\]/,
    "boss card styling must not be tied to fixed stage ids");
});

test("game engine parses and exposes a deterministic QA hook", async () => {
  const gameUrl = projectFile("public/play/game.js");
  const gamePath = fileURLToPath(gameUrl);
  const source = await readFile(gameUrl, "utf8");
  const syntax = spawnSync(process.execPath, ["--check", gamePath], {
    encoding: "utf8",
    windowsHide: true,
  });

  assert.equal(
    syntax.status,
    0,
    `game.js syntax error:\n${syntax.stderr || syntax.stdout}`,
  );
  assert.match(source, /(?:window|globalThis)\.__STARSPROUT_TEST__\s*=/);
  assert.match(source, /PORTRAIT_VIEW_W\s*=\s*960/);
  assert.match(source, /window\.addEventListener\(["']resize["'],\s*syncCanvasViewport/);

  for (const api of ["snapshot", "startLevel", "step", "captureReady", "unlockAll"]) {
    assert.match(
      source,
      new RegExp(`\\b${api}\\b`),
      `QA hook is missing ${api}()`,
    );
  }
});

test("Electron keeps the same offline play tree inside ASAR", async () => {
  const [packageSource, mainSource] = await Promise.all([
    readProjectFile("package.json"),
    readProjectFile("electron/main.cjs"),
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.equal(packageJson.main, "electron/main.cjs");
  assert.equal(packageJson.build?.asar, true);
  assert.ok(packageJson.build?.files?.includes("public/play/**/*"),
    "Electron must package every current and future campaign asset under public/play");
  assert.ok(packageJson.build?.files?.includes("electron/assets/**/*"),
    "Electron must package the runtime window icon referenced by main.cjs");
  assert.match(mainSource, /loadFile\(GAME_FILE\)/);
  assert.match(mainSource, /path\.join\(__dirname,\s*["']assets["'],\s*["']icon\.png["']\)/);
  assert.match(mainSource, /nodeIntegration:\s*false/);
  assert.match(mainSource, /contextIsolation:\s*true/);
  assert.match(mainSource, /sandbox:\s*true/);
  assert.match(mainSource, /setWindowOpenHandler\(\(\)\s*=>\s*\(\{\s*action:\s*["']deny["']/);
  assert.match(mainSource, /will-navigate[\s\S]*?preventDefault\(\)/);
});
