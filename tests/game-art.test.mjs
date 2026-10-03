import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const projectFile = (relativePath) =>
  new URL(`../${relativePath}`, import.meta.url);

const readProjectFile = (relativePath) =>
  readFile(projectFile(relativePath), "utf8");

async function loadBrowserBundle(relativePath, exportName) {
  const source = await readProjectFile(relativePath);
  const browserGlobal = { console, setTimeout, clearTimeout };
  browserGlobal.window = browserGlobal;
  browserGlobal.globalThis = browserGlobal;

  vm.runInNewContext(source, browserGlobal, {
    filename: relativePath,
    timeout: 1_000,
  });

  assert.ok(
    browserGlobal[exportName],
    `${relativePath} must publish window.${exportName}`,
  );
  return browserGlobal[exportName];
}

function extractLevels(bundle) {
  if (Array.isArray(bundle)) return bundle;
  if (Array.isArray(bundle.levels)) return bundle.levels;
  if (Array.isArray(bundle.list)) return bundle.list;
  if (typeof bundle.createLevels === "function") return bundle.createLevels();
  if (typeof bundle.getLevels === "function") return bundle.getLevels();
  assert.fail("StarSproutLevels does not expose its campaign levels");
}

function assetConfig(value) {
  return typeof value === "string" ? { src: value } : value;
}

function frameConfig(value) {
  if (Array.isArray(value)) {
    return { sheet: value[0], col: Number(value[1]), row: Number(value[2]) };
  }
  return value;
}

function assertFrameCoverage(manifest, groupName, expectedNames) {
  const group = manifest[groupName];
  assert.equal(typeof group, "object", `manifest.${groupName} must be an object`);

  for (const name of expectedNames) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(group, name),
      `manifest.${groupName} is missing ${name}`,
    );
    const frame = frameConfig(group[name]);
    assert.match(String(frame?.sheet ?? ""), /\S/, `${groupName}.${name} needs a sheet`);

    const sheet = assetConfig(manifest.assets[frame.sheet]);
    assert.ok(sheet, `${groupName}.${name} references unknown sheet ${frame.sheet}`);
    const cols = Number(frame.cols ?? sheet.cols);
    const rows = Number(frame.rows ?? sheet.rows);
    assert.ok(Number.isInteger(cols) && cols > 0, `${frame.sheet} needs a positive cols count`);
    assert.ok(Number.isInteger(rows) && rows > 0, `${frame.sheet} needs a positive rows count`);
    assert.ok(Number.isInteger(frame.col) && frame.col >= 0 && frame.col < cols, `${groupName}.${name} has an invalid col`);
    assert.ok(Number.isInteger(frame.row) && frame.row >= 0 && frame.row < rows, `${groupName}.${name} has an invalid row`);
  }
}

async function walkFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(target));
    else files.push(target);
  }
  return files;
}

test("game shell loads the local art manifest between level data and the renderer", async () => {
  const html = await readProjectFile("public/play/index.html");
  const scripts = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi),
    (match) => match[1],
  );

  const levelsIndex = scripts.indexOf("./levels.js");
  const artIndex = scripts.indexOf("./art-assets.js");
  const gameIndex = scripts.indexOf("./game.js");
  assert.notEqual(levelsIndex, -1, "index.html must load ./levels.js");
  assert.notEqual(artIndex, -1, "index.html must load ./art-assets.js");
  assert.notEqual(gameIndex, -1, "index.html must load ./game.js");
  assert.ok(levelsIndex < artIndex, "art-assets.js must load after levels.js");
  assert.ok(artIndex < gameIndex, "art-assets.js must load before game.js");
});

test("art manifest is offline-only and every declared raster asset is packaged", async () => {
  const manifestSource = await readProjectFile("public/play/art-assets.js");
  const manifest = await loadBrowserBundle("public/play/art-assets.js", "StarSproutArt");
  assert.equal(typeof manifest.assets, "object", "manifest.assets must be an object");
  assert.equal(manifest.version, "10.0.0", "act 7 art must publish manifest version 10.0.0");
  assert.doesNotMatch(manifestSource, /https?:\/\//i, "art manifest must not use remote URLs");

  const requiredSheets = [
    "paper",
    "hero",
    "enemiesA",
    "enemiesB",
    "enemiesC",
    "enemiesD",
    "mechanisms",
    "mechanismsB",
    "boss",
    "collectibles",
    "environmentsA",
    "environmentsB",
    "environmentsC",
    "environmentsD",
    "environmentsE",
    "environmentsF",
    "environmentsG",
    "trialsArena",
    "bossWeaver",
    "bossStarWhale",
    "bossFoldWarden",
    "bossSkyPaperDragon",
    "bossScorewingMaestro",
    "act3Collectibles",
  ];
  const declaredUrls = new Set();
  for (const sheetName of requiredSheets) {
    const config = assetConfig(manifest.assets[sheetName]);
    assert.ok(config, `manifest.assets is missing ${sheetName}`);
    assert.match(
      String(config.src ?? ""),
      /^\.\/assets\/art-v(?:[2-9]|1[01])\/[a-z0-9][a-z0-9._-]*$/i,
      `${sheetName} must use a packaged versioned art path`,
    );
  }

  for (const [sheetName, value] of Object.entries(manifest.assets)) {
    const config = assetConfig(value);
    assert.match(String(config?.src ?? ""), /^\.\/assets\/art-v(?:[2-9]|1[01])\/[a-z0-9][a-z0-9._-]*$/i,
      `${sheetName} must use a packaged versioned art path`);
    declaredUrls.add(config.src);
  }

  let totalBytes = 0;
  for (const src of declaredUrls) {
    const url = projectFile(`public/play/${src.slice(2)}`);
    const info = await stat(url);
    assert.ok(info.isFile(), `${src} must resolve to a file`);
    assert.ok(info.size >= 16 * 1024, `${src} is implausibly small (${info.size} bytes)`);
    assert.ok(info.size <= 6 * 1024 * 1024, `${src} is too large for a mobile game (${info.size} bytes)`);
    totalBytes += info.size;

    const bytes = await readFile(url);
    const isPng = bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
    const isWebp = bytes.subarray(0, 4).toString("ascii") === "RIFF"
      && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    assert.ok(isPng || isWebp, `${src} is not a valid PNG/WebP package asset`);
  }
  assert.ok(totalBytes <= 16 * 1024 * 1024, `art package is too large (${totalBytes} bytes)`);

  for (const sheetName of [
    "hero",
    "enemiesA",
    "enemiesB",
    "enemiesD",
    "boss",
    "collectibles",
    "bossWeaver",
    "bossStarWhale",
    "bossSkyPaperDragon",
    "bossScorewingMaestro",
    "mechanismsB",
    "act3Collectibles",
  ]) {
    assert.match(
      String(assetConfig(manifest.assets[sheetName])?.src || ""),
      /\.webp$/,
      `${sheetName} must keep its mobile-sized WebP atlas`,
    );
  }

  const runtimeAssetRoot = fileURLToPath(projectFile("public/play/assets"));
  const runtimeFiles = await walkFiles(runtimeAssetRoot);
  const chromaFiles = runtimeFiles.filter((file) => /chroma/i.test(path.basename(file)));
  assert.deepEqual(chromaFiles, [], "runtime assets must not include chroma-key intermediates");
});

test("sprite and background maps cover the complete twenty-eight-stage campaign", async () => {
  const [manifest, levelBundle, gameSource] = await Promise.all([
    loadBrowserBundle("public/play/art-assets.js", "StarSproutArt"),
    loadBrowserBundle("public/play/levels.js", "StarSproutLevels"),
    readProjectFile("public/play/game.js"),
  ]);
  const levels = extractLevels(levelBundle);

  assertFrameCoverage(manifest, "heroFrames", [
    "idle",
    "runContact",
    "runPassing",
    "jump",
    "fall",
    "dash",
    "downstrike",
    "hurt",
  ]);

  const enemyTypes = new Set(levels.flatMap((level) => level.enemies.map((enemy) => enemy.type)));
  assert.ok(enemyTypes.size >= 15, "campaign should exercise the full enemy roster");
  assertFrameCoverage(manifest, "enemyFrames", enemyTypes);
  assertFrameCoverage(manifest, "enemyFrames", [
    "thunder-drummer",
    "thread-spinner",
    "chrono-leech",
    "mirror-mimic",
    "fold-beetle",
    "star-siphon",
    "lens-beetle",
    "lens-beetle-small",
    "rail-wisp",
    "rail-wisp-charge",
    "lantern-heron",
    "lantern-heron-alert",
  ]);
  const actSevenEnemyCells = {
    "lens-beetle": [0, 0],
    "rail-wisp": [1, 0],
    "lantern-heron": [2, 0],
    "lens-beetle-small": [0, 1],
    "rail-wisp-charge": [1, 1],
    "lantern-heron-alert": [2, 1],
  };
  for (const [name, [col, row]] of Object.entries(actSevenEnemyCells)) {
    assert.equal(manifest.enemyFrames[name].sheet, "enemiesD", `${name} must use the Act VII enemy atlas`);
    assert.equal(manifest.enemyFrames[name].col, col, `${name} must use atlas column ${col}`);
    assert.equal(manifest.enemyFrames[name].row, row, `${name} must use atlas row ${row}`);
  }
  assert.ok(manifest.assets.environmentsG.gutter >= 5,
    "the Act VII environment atlas must crop out its bright separator band");
  assertFrameCoverage(manifest, "deviceFrames", [
    "tideRepair",
    "auroraReactor",
    "sunRelay",
    "moonRelay",
    "echoPad",
    "constellationAnchor",
    "foldTrap",
    "polarityDial",
    "dewLens",
    "fiberIris",
    "railJunction",
    "railStation",
    "lanternScreen",
    "shadowKeyAltar",
    "crownShard",
    "crownReceptor",
  ]);

  assertFrameCoverage(manifest, "bossFrames", [
    "boilerNormal",
    "boilerCharge",
    "boilerCoreOpen",
    "boilerFrozenHit",
    "eclipseNormal",
    "eclipseBeamCharge",
    "eclipseShieldBreak",
    "eclipseCoreExposed",
  ]);
  const weaverFrames = Object.entries(manifest.bossFrames)
    .filter(([, value]) => frameConfig(value)?.sheet === "bossWeaver");
  assert.equal(weaverFrames.length, 8, "bossWeaver needs a complete 4x2 animation set");
  const weaverNames = weaverFrames.map(([name]) => name.toLowerCase());
  for (const state of ["idle", "charge", "dash", "cocoon", "beam", "stun", "core", "defeat"]) {
    assert.ok(
      weaverNames.some((name) => name.includes(state)),
      `bossWeaver is missing a ${state} frame`,
    );
  }
  assertFrameCoverage(manifest, "bossFrames", weaverFrames.map(([name]) => name));
  const weaverCells = new Set(weaverFrames.map(([, value]) => {
    const frame = frameConfig(value);
    return `${frame.sheet}:${frame.col}:${frame.row}`;
  }));
  assert.equal(weaverCells.size, 8, "bossWeaver animation states must use eight distinct cells");
  const whaleFrames = Object.entries(manifest.bossFrames)
    .filter(([, value]) => frameConfig(value)?.sheet === "bossStarWhale");
  assert.equal(whaleFrames.length, 8, "bossStarWhale needs a complete 4x2 animation set");
  assertFrameCoverage(manifest, "bossFrames", whaleFrames.map(([name]) => name));
  const foldWardenFrames = Object.entries(manifest.bossFrames)
    .filter(([, value]) => frameConfig(value)?.sheet === "bossFoldWarden");
  assert.equal(foldWardenFrames.length, 8, "bossFoldWarden needs a complete 4x2 animation set");
  assertFrameCoverage(manifest, "bossFrames", foldWardenFrames.map(([name]) => name));
  const skyDragonFrames = Object.entries(manifest.bossFrames)
    .filter(([, value]) => frameConfig(value)?.sheet === "bossSkyPaperDragon");
  assert.equal(skyDragonFrames.length, 8, "bossSkyPaperDragon needs a complete 4x2 animation set");
  assertFrameCoverage(manifest, "bossFrames", skyDragonFrames.map(([name]) => name));
  const skyDragonCells = new Set(skyDragonFrames.map(([, value]) => {
    const frame = frameConfig(value);
    return `${frame.sheet}:${frame.col}:${frame.row}`;
  }));
  assert.equal(skyDragonCells.size, 8, "sky-paper-dragon animation states must use eight distinct cells");
  const scorewingFrames = Object.entries(manifest.bossFrames)
    .filter(([, value]) => frameConfig(value)?.sheet === "bossScorewingMaestro");
  assert.equal(scorewingFrames.length, 8, "bossScorewingMaestro needs a complete 4x2 animation set");
  assertFrameCoverage(manifest, "bossFrames", [
    "scorewingIdle",
    "scorewingCharge",
    "scorewingShardCast",
    "scorewingVolleyGuard",
    "scorewingStunned",
    "scorewingCoreOpen",
    "scorewingEnraged",
    "scorewingDefeated",
  ]);
  const scorewingCells = new Set(scorewingFrames.map(([, value]) => {
    const frame = frameConfig(value);
    return `${frame.sheet}:${frame.col}:${frame.row}`;
  }));
  assert.equal(scorewingCells.size, 8, "scorewing-maestro animation states must use eight distinct cells");

  const collectibleTypes = new Set([
    "heart",
    ...levels.flatMap((level) => level.collectibles.map((item) => item.type)),
  ]);
  assert.ok(collectibleTypes.size >= 16, "campaign should exercise the full collectible roster");
  const proceduralCollectibles = [...collectibleTypes]
    .filter((type) => !Object.prototype.hasOwnProperty.call(manifest.collectibleFrames, type));
  assertFrameCoverage(manifest, "collectibleFrames", [...collectibleTypes]
    .filter((type) => !proceduralCollectibles.includes(type)));
  for (const type of proceduralCollectibles) {
    assert.match(
      gameSource,
      new RegExp(`PROCEDURAL_COLLECTIBLE_TYPES[\\s\\S]{0,900}?["']${type}["']`),
      `${type} must use either a dedicated manifest frame or an explicit procedural-art registry`,
    );
  }
  assert.deepEqual(
    { ...frameConfig(manifest.collectibleFrames["forge-seal"]) },
    { sheet: "collectibles", col: 2, row: 1 },
    "forge seal should use the starlight-and-bell cell, not the clockwork crown cell",
  );

  const stageIds = Array.from(levels, (level) => String(level.id));
  assert.deepEqual(stageIds, Array.from({ length: 28 }, (_, index) => String(index + 1)));
  assertFrameCoverage(manifest, "levelBackgroundFrames", stageIds);
  const backgroundCells = new Set(stageIds.map((id) => {
    const frame = frameConfig(manifest.levelBackgroundFrames[id]);
    return `${frame.sheet}:${frame.col}:${frame.row}`;
  }));
  assert.equal(backgroundCells.size, 28, "all twenty-eight stages need distinct background cells");
  for (const id of stageIds.slice(0, 4)) {
    assert.equal(frameConfig(manifest.levelBackgroundFrames[id]).sheet, "environmentsA");
  }
  for (const id of stageIds.slice(4)) {
    if (Number(id) <= 8) assert.equal(frameConfig(manifest.levelBackgroundFrames[id]).sheet, "environmentsB");
  }
  for (const id of stageIds.slice(8, 12)) {
    assert.equal(frameConfig(manifest.levelBackgroundFrames[id]).sheet, "environmentsC");
  }
  for (const id of stageIds.slice(12, 16)) {
    assert.equal(frameConfig(manifest.levelBackgroundFrames[id]).sheet, "environmentsD");
  }
  for (const id of stageIds.slice(16, 20)) {
    assert.equal(frameConfig(manifest.levelBackgroundFrames[id]).sheet, "environmentsE");
  }
  for (const id of stageIds.slice(20, 24)) {
    assert.equal(frameConfig(manifest.levelBackgroundFrames[id]).sheet, "environmentsF");
  }
  for (const id of stageIds.slice(24, 28)) {
    assert.equal(frameConfig(manifest.levelBackgroundFrames[id]).sheet, "environmentsG");
  }
  assert.equal(frameConfig(manifest.levelBackgroundFrames[101]).sheet, "trialsArena");
  assert.match(String(manifest.assets.trialsArena?.src || ""), /art-v7\/trials-nightwatch\.webp$/);
  assert.match(String(manifest.assets.environmentsF?.src || ""), /art-v10\/environments-f\.webp$/);
  assert.match(String(manifest.assets.bossSkyPaperDragon?.src || ""), /art-v10\/boss-sky-paper-dragon\.webp$/);
  assert.match(String(manifest.assets.environmentsG?.src || ""), /art-v11\/environments-g\.webp$/);
  assert.match(String(manifest.assets.enemiesD?.src || ""), /art-v11\/enemy-atlas-d\.webp$/);
  assert.match(String(manifest.assets.mechanismsB?.src || ""), /art-v11\/mechanism-atlas-b\.webp$/);
  assert.match(String(manifest.assets.bossScorewingMaestro?.src || ""), /art-v11\/boss-scorewing-maestro\.webp$/);
});

test("renderer falls back to procedural art and never fetches runtime images", async () => {
  const source = await readProjectFile("public/play/game.js");

  assert.doesNotMatch(source, /\bfetch\s*\(/, "offline renderer must not fetch art at runtime");
  assert.doesNotMatch(source, /https?:\/\//i, "offline renderer must not reference remote art");
  assert.match(source, /window\.StarSproutArt\s*\|\|\s*\{\}/);
  assert.match(source, /addEventListener\(["']error["'][\s\S]{0,80}?finish\s*\(\s*false\s*\)/);
  assert.match(source, /function\s+drawAtlasFrame\b[\s\S]*?if\s*\(!record\)\s*return false/);

  for (const symbol of [
    "DEFAULT_ART_ASSETS",
    "DEFAULT_HERO_FRAMES",
    "DEFAULT_ENEMY_FRAMES",
    "DEFAULT_BOSS_FRAMES",
    "DEFAULT_COLLECTIBLE_FRAMES",
    "DEFAULT_DEVICE_FRAMES",
    "drawFallbackHero",
    "drawFallbackEnemy",
    "drawMechanismFrame",
    "drawBoilerBossFallback",
    "drawEclipseBossFallback",
    "bossWeaver",
    "drawSkyPaperDragonBossFallback",
    "drawScorewingBossFallback",
  ]) {
    assert.match(source, new RegExp(`\\b${symbol}\\b`), `renderer is missing ${symbol}`);
  }

  assert.match(source, /function\s+drawHero\b[\s\S]*?drawFallbackHero\(/);
  assert.match(source, /function\s+drawEnemy\b[\s\S]*?drawFallbackEnemy\(/);
  assert.match(source, /function\s+drawBoss\b[\s\S]*?drawBoilerBossFallback\([\s\S]*?drawEclipseBossFallback\(/);
  assert.match(
    source,
    /function\s+drawBoss\b[\s\S]*?draw(?:(?:Rift)?Weaver|StormKite)BossFallback\(/,
    "drawBoss() must have an explicit procedural fallback for the third boss",
  );
  assert.match(
    source,
    /function\s+drawBoss\b[\s\S]*?drawSkyPaperDragonBossFallback\(/,
    "drawBoss() must have an explicit procedural fallback for the sixth boss",
  );
  assert.match(
    source,
    /function\s+drawBoss\b[\s\S]*?drawScorewingBossFallback\(/,
    "drawBoss() must have an explicit procedural fallback for the seventh boss",
  );
  assert.match(source, /function\s+drawCollectible\b[\s\S]*?drawAtlasFrame\([\s\S]*?drawSeed\(/);
  assert.match(source, /function\s+renderBackground\b[\s\S]*?drawEnvironmentBackdrop\([\s\S]*?if\s*\(!illustrated\)/);
  assert.match(source, /function\s+drawEnvironmentBackdrop\b[\s\S]*?if\s*\(!record\)\s*return false/);
});

test("startup keeps art loading scoped to the selected stage", async () => {
  const source = await readProjectFile("public/play/game.js");

  assert.doesNotMatch(
    source,
    /Object\.keys\(DEFAULT_ART_ASSETS\)[\s\S]{0,160}?artImage\s*\(/,
    "startup must not eagerly load every campaign art sheet",
  );
  assert.match(source, /function\s+levelArtAssetNames\s*\(level\)/,
    "the renderer needs an explicit current-level asset selector");
  assert.match(source, /function\s+preloadLevelArt\s*\(level\)/,
    "the renderer needs a stage-scoped preload entry point");
  assert.match(source, /function\s+loadCurrentLevelArt\s*\([\s\S]*?preloadLevelArt\s*\(level\)/,
    "the briefing loader must preload only the selected stage");
  assert.match(source, /\b(?:promise|loadPromise)\b[\s\S]{0,220}?artImageCache|artImageCache[\s\S]{0,220}?\b(?:promise|loadPromise)\b/i,
    "art cache entries must share one in-flight Promise per image");
  assert.match(source, /typeof\s+image\.decode\s*===\s*["']function["'][\s\S]{0,80}?await\s+image\.decode\s*\(\)/,
    "loaded atlases must finish browser decoding before the briefing reports ready");
  assert.match(source, /function\s+evictArtAssetsExcept\s*\([\s\S]{0,280}?artImageCache\.delete\s*\(/,
    "decoded atlases outside the core, current stage, and warm stage must be evicted");
  assert.match(source, /function\s+scheduleLevelArtWarmup\s*\([\s\S]{0,1000}?requestIdleCallback\s*\(/,
    "the next stage must only warm during a browser idle window");
  assert.match(source, /function\s+completeLevel\s*\([\s\S]{0,480}?scheduleLevelArtWarmup\s*\(\s*nextCampaignArtLevel/,
    "campaign completion should warm only the next stage");
});

test("briefing blocks play until selected-stage art is ready and supports retry", async () => {
  const source = await readProjectFile("public/play/game.js");

  assert.match(source, /let\s+levelArtState\s*=\s*["']idle["']/,
    "the renderer needs an explicit level-art loading state");
  assert.match(source, /function\s+loadCurrentLevelArt\s*\(/,
    "stage loading needs one guarded async entry point");
  assert.match(source, /levelArtState\s*!==\s*["']ready["'][\s\S]{0,80}?return/,
    "briefing input must not start play before art is ready");
  assert.match(source, /function\s+retryCurrentLevelArt\s*\(/,
    "failed packaged art needs an explicit retry path");
  assert.match(source, /artImageCache\.delete\s*\(/,
    "retry must discard failed image cache entries");
});
