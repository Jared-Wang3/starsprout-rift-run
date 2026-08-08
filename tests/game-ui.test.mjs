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

  for (const touch of ["left", "right", "jump", "shoot", "dash"]) {
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

test("touch UI is hidden by default and enabled for touch/small screens", async () => {
  const css = await readProjectFile("public/play/game.css");

  assert.match(css, /\.touch-controls\s*\{[^}]*\bdisplay:\s*none\s*;/s);
  assert.match(
    css,
    /@media\s*\([^)]*(?:pointer:\s*coarse|max-width:\s*900px)[^)]*\)[^{]*\{[\s\S]*?\.touch-controls\.is-visible\s*\{[^}]*\bdisplay:\s*flex\s*;/i,
  );
  assert.match(css, /\.touch-controls\s+button\s*\{[^}]*(?:\bwidth:\s*(?:4(?:\.\d+)?rem|[5-9]\dpx)|\bmin-width:\s*44px)[^}]*/s);
  assert.match(css, /@media\s*\(orientation:\s*portrait\)[\s\S]*?\.portrait-notice\s*\{[^}]*\bdisplay:\s*flex\s*;/i);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
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

  for (const api of ["snapshot", "startLevel", "step", "captureReady"]) {
    assert.match(
      source,
      new RegExp(`\\b${api}\\b`),
      `QA hook is missing ${api}()`,
    );
  }
});
