import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const readProjectFile = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

async function loadLevels() {
  const source = await readProjectFile("public/play/levels.js");
  const browserGlobal = {
    console,
    structuredClone,
    setTimeout,
    clearTimeout,
  };
  browserGlobal.window = browserGlobal;
  browserGlobal.globalThis = browserGlobal;
  vm.runInNewContext(source, browserGlobal, {
    filename: "public/play/levels.js",
    timeout: 1_000,
  });

  const bundle = browserGlobal.StarSproutLevels;
  assert.ok(bundle, "levels.js must publish window.StarSproutLevels");
  if (Array.isArray(bundle)) return bundle;
  if (Array.isArray(bundle.levels)) return bundle.levels;
  if (Array.isArray(bundle.list)) return bundle.list;
  if (typeof bundle.createLevels === "function") return bundle.createLevels();
  if (typeof bundle.getLevels === "function") return bundle.getLevels();
  assert.fail("StarSproutLevels does not expose its campaign levels");
}

function createNoopCanvasContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => ({}),
  }, {
    get(target, property) {
      if (property in target) return target[property];
      return () => {};
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
}

function createFakeElement(id = "", context = createNoopCanvasContext()) {
  const classes = new Set();
  const writes = { innerHTML: 0 };
  let innerHTML = "";
  const fake = {
    id,
    width: id === "game" ? 1280 : 0,
    height: id === "game" ? 720 : 0,
    hidden: false,
    dataset: {},
    style: { setProperty() {} },
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      toggle(name, force) {
        if (force === true) classes.add(name);
        else if (force === false) classes.delete(name);
        else if (classes.has(name)) classes.delete(name);
        else classes.add(name);
        return classes.has(name);
      },
      contains: (name) => classes.has(name),
    },
    addEventListener() {},
    setAttribute() {},
    getContext: () => context,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture: () => false,
    requestFullscreen() {},
    closest: () => null,
  };
  Object.defineProperties(fake, {
    innerHTML: {
      get: () => innerHTML,
      set(value) {
        innerHTML = String(value);
        writes.innerHTML += 1;
      },
    },
    __writes: { value: writes },
  });
  return fake;
}

async function loadGameQaHook(options = {}) {
  const [levelsSource, trialsSource, artSource, gameSource] = await Promise.all([
    readProjectFile("public/play/levels.js"),
    readProjectFile("public/play/trials.js"),
    readProjectFile("public/play/art-assets.js"),
    readProjectFile("public/play/game.js"),
  ]);
  const canvasContext = createNoopCanvasContext();
  const elements = new Map();
  const documentListeners = new Map();
  const animationFrames = new Map();
  let nextAnimationFrameId = 1;
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, createFakeElement(id, canvasContext));
    return elements.get(id);
  };
  const storage = new Map();
  const imageSources = [];
  if (options.save !== undefined) {
    storage.set("starsprout-save-v2", JSON.stringify(options.save));
  }
  const document = {
    hidden: false,
    fullscreenElement: null,
    querySelector(selector) {
      if (selector === "#game") return element("game");
      return element(selector.startsWith("#") ? selector.slice(1) : selector);
    },
    querySelectorAll: () => [],
    createElement: (tagName) => createFakeElement(tagName === "canvas" ? "canvas" : tagName, canvasContext),
    addEventListener(type, listener) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(listener);
    },
    exitFullscreen() {},
  };
  class FakeImage {
    complete = false;
    naturalWidth = 0;
    naturalHeight = 0;
    listeners = new Map();
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(listener);
    }
    set src(value) {
      this.currentSrc = value;
      imageSources.push(value);
      this.complete = true;
      this.naturalWidth = 1024;
      this.naturalHeight = 512;
      const listeners = this.listeners.get("load") || [];
      this.listeners.delete("load");
      listeners.forEach((listener) => listener());
    }
  }
  const browserGlobal = {
    console,
    document,
    Image: FakeImage,
    URLSearchParams,
    structuredClone,
    performance: { now: () => 0 },
    location: { search: options.locationSearch || "" },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
    },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame(callback) {
      const id = nextAnimationFrameId;
      nextAnimationFrameId += 1;
      animationFrames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => animationFrames.delete(id),
    requestIdleCallback: () => 0,
    cancelIdleCallback() {},
    setTimeout: () => 0,
    clearTimeout() {},
  };
  browserGlobal.window = browserGlobal;
  browserGlobal.globalThis = browserGlobal;
  const context = vm.createContext(browserGlobal);
  vm.runInContext(levelsSource, context, {
    filename: "public/play/levels.js",
    timeout: 1_000,
  });
  options.mutateLevels?.(browserGlobal.StarSproutLevels);
  vm.runInContext(trialsSource, context, {
    filename: "public/play/trials.js",
    timeout: 1_000,
  });
  options.mutateTrials?.(browserGlobal.StarSproutTrials);
  vm.runInContext(artSource, context, {
    filename: "public/play/art-assets.js",
    timeout: 1_000,
  });
  vm.runInContext(gameSource, context, {
    filename: "public/play/game.js",
    timeout: 3_000,
  });
  assert.ok(browserGlobal.__STARSPROUT_TEST__, "game.js must expose the existing QA hook");
  Object.defineProperties(browserGlobal.__STARSPROUT_TEST__, {
    __elements: { value: elements },
    __storage: { value: storage },
    __imageSources: { value: imageSources },
    __animationFrames: { value: animationFrames },
    __clickAction: {
      value(action) {
        const target = {
          dataset: { action },
          closest: (selector) => selector === "[data-action]" ? target : null,
        };
        documentListeners.get("click")?.forEach((listener) => listener({ target }));
      },
    },
    __clickLevel: {
      value(id) {
        const target = {
          disabled: false,
          dataset: { level: String(id) },
          closest: (selector) => selector === "[data-level]" ? target : null,
        };
        documentListeners.get("click")?.forEach((listener) => listener({ target }));
      },
    },
    __beginBriefing: {
      value() {
        const target = { closest: () => null };
        documentListeners.get("click")?.forEach((listener) => listener({ target }));
      },
    },
  });
  return browserGlobal.__STARSPROUT_TEST__;
}

test("startup and stage entry only request core plus current-level art", async () => {
  const qa = await loadGameQaHook();

  assert.deepEqual(
    Array.from(new Set(qa.__imageSources)).sort(),
    ["./assets/art-v2/hero-sprites.webp", "./assets/art-v2/paper-texture.webp"],
    "the menu should only warm the core hero and paper assets",
  );

  qa.startLevel(1);
  const stageOneSources = new Set(qa.__imageSources);
  assert.equal(stageOneSources.has("./assets/art-v2/environments-a.webp"), true,
    "stage 1 should warm its own environment atlas");
  assert.equal(stageOneSources.has("./assets/art-v2/environments-b.webp"), false,
    "stage 1 must not warm a later act environment atlas");
  assert.equal(stageOneSources.has("./assets/art-v3/environments-c.webp"), false,
    "stage 1 must not warm the final act environment atlas");
  assert.equal(stageOneSources.has("./assets/art-v3/boss-weaver.webp"), false,
    "stage 1 must not warm the final boss atlas");

  const act7Cases = [
    { id: 25, boss: false },
    { id: 26, boss: false },
    { id: 27, boss: false },
    { id: 28, boss: true },
  ];
  for (const { id, boss } of act7Cases) {
    const stage = await loadGameQaHook({ save: { unlocked: 28, completed: [] } });
    stage.startLevel(id);
    const sources = new Set(stage.__imageSources);
    assert.equal(sources.has("./assets/art-v11/environments-g.webp"), true,
      `stage ${id} should warm the act 7 environment atlas`);
    assert.equal(sources.has("./assets/art-v11/enemy-atlas-d.webp"), true,
      `stage ${id} should warm the act 7 creature atlas`);
    assert.equal(sources.has("./assets/art-v11/mechanism-atlas-b.webp"), true,
      `stage ${id} should warm the act 7 mechanism atlas`);
    assert.equal(sources.has("./assets/art-v11/boss-scorewing-maestro.webp"), boss,
      `stage ${id} should ${boss ? "" : "not "}warm the finale boss atlas`);
    assert.equal(sources.has("./assets/art-v10/environments-f.webp"), false,
      `stage ${id} must not retain the previous act environment atlas`);
  }
});

test("unchanged HUD state does not rewrite health or boss markup every frame", async () => {
  const qa = await loadGameQaHook();
  qa.startLevel(1);

  const health = qa.__elements.get("health");
  const healthWrites = health.__writes.innerHTML;
  qa.step(8);
  assert.equal(
    health.__writes.innerHTML,
    healthWrites,
    "stable health must not rebuild its DOM during each simulation frame",
  );

  qa.startLevel(12);
  qa.enterBossArena();
  const bossHealth = qa.__elements.get("boss-health");
  const bossWrites = bossHealth.__writes.innerHTML;
  qa.step(3);
  assert.equal(
    bossHealth.__writes.innerHTML,
    bossWrites,
    "stable boss health must not rebuild its DOM during each simulation frame",
  );
});

test("animation loop suspends while paused or hidden and resumes through one scheduler", async () => {
  const source = await readProjectFile("public/play/game.js");
  const loop = namedFunction(source, "loop");
  const togglePause = namedFunction(source, "togglePause");

  assert.match(source, /function\s+(?:animationLoopSuspended|shouldSuspendAnimation)\s*\([^)]*\)[\s\S]{0,220}?document\.hidden[\s\S]{0,120}?scene\s*!==\s*["']playing["']/,
    "one suspension predicate must reserve rAF ownership for visible gameplay");
  assert.match(loop, /(?:animationLoopSuspended|shouldSuspendAnimation)\s*\(/,
    "the rAF callback must stop before updating or rendering a suspended game");
  assert.match(source, /function\s+scheduleAnimationLoop\s*\(/,
    "rAF ownership must be centralized so resume cannot create duplicate loops");
  assert.match(togglePause, /resumeAnimationLoop\s*\(/,
    "resuming play must reset the frame clock and restart the single scheduler");
  assert.doesNotMatch(loop, /requestAnimationFrame\s*\(\s*loop\s*\)/,
    "loop() must not recursively bypass the single-loop scheduler");
});

test("restart, level-map, and home routes restore exactly one gameplay loop", async () => {
  const restart = await loadGameQaHook();
  assert.equal(restart.__animationFrames.size, 0, "the menu must not own a background rAF");
  restart.startLevel(1);
  assert.equal(restart.__animationFrames.size, 1, "autostart gameplay must own one rAF");
  restart.__clickAction("pause");
  assert.equal(restart.__animationFrames.size, 0, "pause must cancel the gameplay rAF");
  restart.__clickAction("restart");
  assert.equal(restart.snapshot().scene, "briefing");
  assert.equal(restart.__animationFrames.size, 0, "the restart briefing must stay still");
  restart.__beginBriefing();
  assert.equal(restart.snapshot().scene, "playing");
  assert.equal(restart.__animationFrames.size, 1, "leaving the restart briefing must restore one rAF");

  const levels = await loadGameQaHook();
  levels.startLevel(1);
  levels.__clickAction("pause");
  levels.__clickAction("levels");
  assert.equal(levels.snapshot().scene, "levels");
  assert.equal(levels.__animationFrames.size, 0, "the level map must not own a background rAF");
  levels.__clickLevel(2);
  assert.equal(levels.snapshot().scene, "briefing");
  assert.equal(levels.__animationFrames.size, 0);
  levels.__beginBriefing();
  assert.equal(levels.snapshot().scene, "playing");
  assert.equal(levels.__animationFrames.size, 1, "selecting a new level must restore one rAF");

  const home = await loadGameQaHook();
  home.startLevel(1);
  home.__clickAction("pause");
  home.__clickAction("home");
  assert.equal(home.snapshot().scene, "menu");
  assert.equal(home.__animationFrames.size, 0, "returning home must not restart the rAF");
  home.__clickAction("continue");
  assert.equal(home.snapshot().scene, "briefing");
  assert.equal(home.__animationFrames.size, 0);
  home.__beginBriefing();
  assert.equal(home.snapshot().scene, "playing");
  assert.equal(home.__animationFrames.size, 1, "continuing from home must restore one rAF");
});

// Returns a balanced JS object/function/array block while ignoring braces in
// strings and comments. This keeps the assertions local to an implementation
// marker without pinning them to whitespace or line layout.
function balancedBlock(source, openIndex) {
  const opening = source[openIndex];
  const closing = opening === "{" ? "}" : opening === "[" ? "]" : null;
  assert.ok(closing, `expected a block at source offset ${openIndex}`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === opening) depth += 1;
    if (char === closing) {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex, index + 1);
    }
  }
  assert.fail(`unterminated ${opening}${closing} block at source offset ${openIndex}`);
}

function namedFunction(source, name) {
  const declaration = new RegExp(`\\bfunction\\s+${name}\\s*\\(`).exec(source);
  const arrow = new RegExp(`\\b(?:const|let)\\s+${name}\\s*=.*?=>\\s*\\{`, "s").exec(source);
  const match = declaration || arrow;
  assert.ok(match, `missing explicit ${name}() implementation marker`);
  const openIndex = source.indexOf("{", match.index);
  return balancedBlock(source, openIndex);
}

function declaredFunctions(source) {
  const functions = [];
  const patterns = [
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g,
    /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const openIndex = source.indexOf("{", match.index + match[0].length - 1);
      functions.push({ name: match[1], body: balancedBlock(source, openIndex) });
    }
  }
  return functions;
}

function literalPattern(value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`["']${escaped}["']`);
}

test("level normalization preserves goal type and requirement metadata", async () => {
  const source = await readProjectFile("public/play/game.js");
  const normalizeBody = namedFunction(source, "normalizeLevel");
  const goalProperty = /\bgoal\s*:\s*\{([^{}]*)\}/s.exec(normalizeBody);

  assert.ok(goalProperty, "normalizeLevel() must construct a normalized goal");
  const normalizedGoal = goalProperty[1];
  const spreadsGoal = /\.\.\.\s*goal\b/.test(normalizedGoal);
  for (const field of ["requires", "type"]) {
    assert.ok(
      spreadsGoal || new RegExp(`\\b${field}\\s*:\\s*goal(?:\\?\\.)?\\.${field}\\b`).test(normalizedGoal),
      `normalizeLevel() drops goal.${field}; goal gameplay metadata must survive normalization`,
    );
  }
});

test("campaign limits drive unlock-all and direct stage 28 URLs", async () => {
  const qa = await loadGameQaHook();
  qa.unlockAll();

  assert.equal(qa.snapshot().unlocked, 28, "unlockAll() must use the campaign maximum, not a literal 24");
  const grid = qa.__elements.get("level-grid").innerHTML;
  const cardIds = Array.from(grid.matchAll(/\bdata-level=["'](\d+)["']/g), (match) => Number(match[1]));
  assert.deepEqual(cardIds, Array.from({ length: 28 }, (_, index) => index + 1));

  const direct = await loadGameQaHook({ locationSearch: "?level=28&autostart=1" });
  assert.equal(direct.snapshot().level, 28, "?level=28 must open the final stage");
  assert.equal(direct.snapshot().scene, "playing");
});

test("an old completed-eight save migrates forward without losing progress", async () => {
  const completed = Array.from({ length: 8 }, (_, index) => index + 1);
  const qa = await loadGameQaHook({
    save: {
      unlocked: 8,
      completed,
      seeds: 17,
      collectedSeeds: ["1:w-seed-01", "8:e-seed-01"],
      deaths: 4,
      muted: true,
    },
  });
  const snapshot = qa.snapshot();

  assert.equal(snapshot.unlocked, 9, "players who cleared the old finale must receive stage 9");
  assert.deepEqual(Array.from(snapshot.completed), completed);
  assert.equal(snapshot.seeds, 17);
  assert.equal(qa.__elements.get("continue-label").textContent, "继续第 9 关");
});

test("an old completed-twenty save unlocks act 6 without losing progress", async () => {
  const completed = Array.from({ length: 20 }, (_, index) => index + 1);
  const qa = await loadGameQaHook({
    save: {
      unlocked: 20,
      completed,
      seeds: 41,
      collectedSeeds: ["20:tp-seed-01"],
      deaths: 7,
      heroModule: "root",
    },
  });
  const snapshot = qa.snapshot();

  assert.equal(snapshot.unlocked, 21, "players who cleared the former finale must receive stage 21");
  assert.deepEqual(Array.from(snapshot.completed), completed);
  assert.equal(snapshot.seeds, 41);
  assert.equal(snapshot.heroModule, "root");
  assert.equal(qa.__elements.get("continue-label").textContent, "继续第 21 关");
});

test("an old completed-twenty-four save unlocks act 7 without losing progress", async () => {
  const completed = Array.from({ length: 24 }, (_, index) => index + 1);
  const qa = await loadGameQaHook({
    save: {
      unlocked: 24,
      completed,
      seeds: 58,
      collectedSeeds: ["24:sp-seed-01"],
      deaths: 9,
      heroModule: "root",
    },
  });
  const snapshot = qa.snapshot();

  assert.equal(snapshot.unlocked, 25, "players who cleared the former finale must receive stage 25");
  assert.deepEqual(Array.from(snapshot.completed), completed);
  assert.equal(snapshot.seeds, 58);
  assert.equal(snapshot.heroModule, "root");
  assert.equal(qa.__elements.get("continue-label").textContent, "继续第 25 关");
});

test("act bosses complete normally while only stage 28 completes the campaign", async () => {
  const makeReachable = (id, finale) => (bundle) => {
    const level = bundle.get(id);
    level.kind = "stage";
    level.boss = null;
    level.finale = finale;
    delete level.isBoss;
    level.hazards = [];
    level.enemies = [];
    level.goal = { x: 220, y: 470, w: 100, h: 160, requires: "reach" };
  };

  const qa8 = await loadGameQaHook({
    save: { unlocked: 8, completed: [1, 2, 3, 4, 5, 6, 7] },
    mutateLevels: makeReachable(8, false),
  });
  qa8.startLevel(8);
  qa8.teleport(230, 500);
  qa8.step(1);
  assert.equal(qa8.snapshot().scene, "complete", "stage 8 must use the ordinary act-complete screen");
  assert.equal(qa8.snapshot().unlocked, 9, "clearing stage 8 must unlock stage 9");

  const qa20 = await loadGameQaHook({
    save: { unlocked: 20, completed: Array.from({ length: 19 }, (_, index) => index + 1) },
    mutateLevels: makeReachable(20, false),
  });
  qa20.startLevel(20);
  qa20.teleport(230, 500);
  qa20.step(1);
  assert.equal(qa20.snapshot().scene, "complete", "stage 20 must now use the ordinary act-complete screen");
  assert.equal(qa20.snapshot().unlocked, 21, "clearing the former finale must unlock act 6");

  const qa24 = await loadGameQaHook({
    save: { unlocked: 24, completed: Array.from({ length: 23 }, (_, index) => index + 1) },
    mutateLevels: makeReachable(24, false),
  });
  qa24.startLevel(24);
  qa24.teleport(230, 500);
  qa24.step(1);
  assert.equal(qa24.snapshot().scene, "complete", "the former finale must now use the ordinary act-complete screen");
  assert.equal(qa24.snapshot().unlocked, 25, "clearing stage 24 must unlock act 7");

  const qa28 = await loadGameQaHook({
    save: { unlocked: 28, completed: Array.from({ length: 27 }, (_, index) => index + 1) },
    mutateLevels: makeReachable(28, true),
  });
  qa28.startLevel(28);
  qa28.teleport(230, 500);
  qa28.step(1);
  assert.equal(qa28.snapshot().scene, "victory", "only the campaign's final stage should open the victory screen");
  assert.match(qa28.__elements.get("victory-stats").textContent, /^28\s*\/\s*28\s*关/);
});

test("unknown goal requirements fail closed instead of silently opening the exit", async () => {
  const qa = await loadGameQaHook({
    mutateLevels(bundle) {
      const level = bundle.get(1);
      level.goal = {
        x: 220,
        y: 470,
        w: 100,
        h: 160,
        requires: { type: "misspelled-requirement", label: "broken fixture" },
      };
      level.hazards = [];
      level.enemies = [];
    },
  });
  qa.startLevel(1);
  qa.teleport(230, 500);
  qa.step(1);

  assert.equal(qa.snapshot().scene, "playing", "an unsupported requirement must keep the goal locked");
  assert.equal(qa.snapshot().goalReady, false);
});

test("object collection goals remain locked until all three act 3 quest items are collected", async () => {
  const levels = await loadLevels();
  const level = levels.find((entry) => entry.id === 9);
  const questItems = level.collectibles.filter((item) => item.type === "lumen-spore");
  const qa = await loadGameQaHook();
  qa.startLevel(9);

  qa.teleport(level.goal.x, level.goal.y);
  qa.step(1);
  assert.equal(qa.snapshot().scene, "playing", "the exit must be locked before collecting lumen spores");
  assert.equal(qa.snapshot().goalReady, false);

  for (const item of questItems) {
    qa.teleport(item.x, item.y);
    qa.step(1);
  }
  assert.match(qa.snapshot().pickupStatus, /3\s*\/\s*3/, "HUD must keep the completed quest count visible");
  assert.equal(qa.snapshot().goalReady, true);

  qa.teleport(level.goal.x, level.goal.y);
  qa.step(1);
  assert.equal(qa.snapshot().scene, "complete");
});

test("crossed checkpoints do not retrigger after a later checkpoint becomes active", async () => {
  const levels = await loadLevels();
  const level9 = levels.find((entry) => entry.id === 9);
  const [firstCheckpoint, secondCheckpoint] = level9.checkpoints;
  assert.ok(firstCheckpoint && secondCheckpoint, "stage 9 needs two checkpoints for this regression");

  const qa = await loadGameQaHook({
    mutateLevels(bundle) {
      const level = bundle.get(9);
      level.platforms = [{ id: "qa-ground", x: 0, y: 620, w: level.worldWidth, h: 100 }];
      level.hazards = [];
      level.enemies = [];
      level.collectibles = [];
    },
  });
  qa.startLevel(9);

  qa.teleport(firstCheckpoint.x + 10, 500);
  qa.step(1);
  const toast = qa.__elements.get("toast");
  assert.equal(toast.classList.contains("is-visible"), true, "the first checkpoint should announce once");
  qa.step(100);
  assert.equal(toast.classList.contains("is-visible"), false, "the first checkpoint must not announce again while crossed");

  qa.teleport(secondCheckpoint.x + 10, 500);
  qa.step(1);
  assert.equal(toast.classList.contains("is-visible"), true, "the second checkpoint should announce once");
  qa.step(100);
  assert.equal(
    toast.classList.contains("is-visible"),
    false,
    "crossing checkpoint two must not reactivate checkpoint one every frame",
  );
  const checkpointState = qa.snapshot().checkpoints;
  const firstState = checkpointState.find((point) => point.id === firstCheckpoint.id);
  const secondState = checkpointState.find((point) => point.id === secondCheckpoint.id);
  assert.equal(firstState.reached, true);
  assert.equal(firstState.active, false, "the earlier checkpoint must stay reached without becoming active again");
  assert.equal(secondState.reached, true);
  assert.equal(secondState.active, true, "the latest checkpoint must remain the active respawn point");

  qa.teleport(secondCheckpoint.x + 100, 2_000);
  qa.step(1);
  assert.equal(qa.snapshot().player.x, secondCheckpoint.respawn.x, "respawn should remain at the latest checkpoint");
});

test("spring, polarity, and timed-relay metadata survive normalization and drive play", async () => {
  const levels = await loadLevels();

  const level9 = levels.find((entry) => entry.id === 9);
  const springData = level9.platforms.find((platform) => Number(platform.bounceY) < 0);
  const qa9 = await loadGameQaHook();
  qa9.startLevel(9);
  const springRuntime = qa9.snapshot().platforms.find((platform) => platform.id === springData.id);
  assert.equal(springRuntime.bounceY, springData.bounceY, "makeRuntime() must retain platform.bounceY");
  assert.equal(springRuntime.enabled, true);
  qa9.teleport(springData.x + springData.w / 2 - 18, springData.y - 62);
  qa9.step(10);
  assert.ok(qa9.snapshot().player.vy < -100, `landing on a spring must launch upward; vy=${qa9.snapshot().player.vy}`);

  const level10 = levels.find((entry) => entry.id === 10);
  const toggle = level10.mechanics.switches.find((device) => device.mode === "toggle-polarity");
  const qa10 = await loadGameQaHook();
  qa10.startLevel(10);
  const beforePolarity = qa10.snapshot();
  assert.equal(beforePolarity.polarity, level10.mechanics.polarity.initial);
  const polarPlatformsBefore = beforePolarity.platforms.filter((platform) => platform.polarity);
  assert.ok(polarPlatformsBefore.some((platform) => platform.enabled));
  assert.ok(polarPlatformsBefore.some((platform) => !platform.enabled));
  qa10.teleport(toggle.x - 90, toggle.y - 18);
  qa10.press("shoot");
  qa10.step(1);
  qa10.release("shoot");
  qa10.step(30);
  const afterPolarity = qa10.snapshot();
  assert.notEqual(afterPolarity.polarity, beforePolarity.polarity, "shooting the toggle must swap sun/moon polarity");
  for (const platform of afterPolarity.platforms.filter((entry) => entry.polarity)) {
    assert.equal(platform.enabled, platform.polarity === afterPolarity.polarity,
      `${platform.id} enabled state must follow the live polarity`);
  }

  const level11 = levels.find((entry) => entry.id === 11);
  const relayData = level11.mechanics.switches.find((device) => Number(device.duration) > 0);
  const qa11 = await loadGameQaHook();
  qa11.startLevel(11);
  qa11.teleport(relayData.x - 90, relayData.y - 18);
  qa11.press("shoot");
  qa11.step(1);
  qa11.release("shoot");
  qa11.step(12);
  const activeRelay = qa11.snapshot().switches.find((device) => device.id === relayData.id);
  assert.equal(activeRelay.active, true, "shooting a timed relay must activate it");
  assert.ok(activeRelay.timer > 0 && activeRelay.timer <= relayData.duration);
  qa11.step(Math.ceil(relayData.duration * 60) + 5);
  const expiredRelay = qa11.snapshot().switches.find((device) => device.id === relayData.id);
  assert.equal(expiredRelay.active, false, "timed relay must turn off after its duration");
  assert.equal(expiredRelay.timer, 0);
});

test("stage 12 preserves max health and dispatches an explicit third boss archetype", async () => {
  const [source, qa] = await Promise.all([
    readProjectFile("public/play/game.js"),
    loadGameQaHook(),
  ]);
  qa.startLevel(12);
  const snapshot = qa.snapshot();

  assert.equal(snapshot.boss.maxHp, 6, "runtime boss health must come from level boss maxHealth/hp data");
  assert.equal(snapshot.boss.archetype, "rift-weaver");
  assert.equal(snapshot.boss.phase, 1);

  const weaverHandler = declaredFunctions(source).find(({ name, body }) =>
    /(?:storm|kite|weaver)/i.test(name)
      && /requiredRelays|relay/i.test(body)
      && /vulnerable/i.test(body),
  );
  assert.ok(weaverHandler, "stage 12 needs a dedicated rift-weaver boss update handler");
  assert.match(weaverHandler.body, /boss\.phase|phaseConfig|currentPhase/,
    `${weaverHandler.name}() must vary its relay requirement by boss phase`);

  const updateBoss = namedFunction(source, "updateBoss");
  assert.match(updateBoss, /archetype|rift-weaver/,
    "updateBoss() must dispatch by archetype instead of treating every non-stage-4 boss as eclipse");
});

test("act 4 mechanics execute as gravity, time, echo, and anchor systems", async () => {
  const levels = await loadLevels();

  const gravity = await loadGameQaHook({ save: { unlocked: 16, completed: [] } });
  gravity.startLevel(13);
  const orbitId = levels.find((level) => level.id === 13).platforms.find((platform) => platform.motion?.type === "orbit").id;
  const beforeOrbit = gravity.snapshot().platforms.find((platform) => platform.id === orbitId);
  gravity.step(30);
  const afterOrbit = gravity.snapshot().platforms.find((platform) => platform.id === orbitId);
  assert.notDeepEqual([afterOrbit.x, afterOrbit.y], [beforeOrbit.x, beforeOrbit.y], "stage 13 orbit platforms must move on both axes");

  const timeLevel = levels.find((level) => level.id === 14);
  const timeAnchor = timeLevel.mechanics.timeAnchors[0];
  const time = await loadGameQaHook({ save: { unlocked: 16, completed: [] } });
  time.startLevel(14);
  time.teleport(timeAnchor.x - 90, timeAnchor.y + 8);
  time.press("shoot");
  time.step(12);
  time.release("shoot");
  const frozen = time.snapshot().timeAnchors.find((anchor) => anchor.id === timeAnchor.id);
  assert.equal(frozen.active, true, "shooting a time flower must open a local freeze window");
  assert.ok(frozen.timer > 0 && frozen.timer <= timeAnchor.duration);

  const echo = await loadGameQaHook({ save: { unlocked: 16, completed: [] } });
  echo.startLevel(15);
  echo.press("right");
  echo.step(125);
  echo.release("right");
  assert.ok(echo.snapshot().echoClone, "stage 15 must materialize the player's delayed paper echo");

  const whale = await loadGameQaHook({ save: { unlocked: 16, completed: [] } });
  whale.startLevel(16);
  whale.enterBossArena();
  whale.step(2);
  const whaleState = whale.snapshot();
  assert.equal(whaleState.boss.archetype, "star-whale");
  assert.equal(whaleState.gravityAnchors.length, 3);
  assert.ok(whaleState.gravityAnchors.every((anchor) => anchor.x > 0 && anchor.y > 0), "star-whale anchors must orbit in world space");
});

test("act 5 mechanics execute as folding, tethering, reversing, and downstrike trapping", async () => {
  const levels = await loadLevels();

  const foldLevel = levels.find((level) => level.id === 17);
  const foldPanel = foldLevel.mechanics.foldPanels[0];
  const fold = await loadGameQaHook({ save: { unlocked: 20, completed: [] } });
  fold.startLevel(17);
  fold.teleport(foldPanel.x - 80, foldPanel.y + 8);
  fold.press("shoot");
  fold.step(1);
  fold.release("shoot");
  fold.step(12);
  const folded = fold.snapshot().foldPanels.find((panel) => panel.id === foldPanel.id);
  assert.equal(folded.state, 1, "shooting a crease must change the collision topology state");
  const activeFoldBridge = fold.snapshot().platforms.find((platform) => platform.id === "fc-bridge-a");
  assert.equal(activeFoldBridge.enabled, true, "folded bridge collision must become active");

  const kiteLevel = levels.find((level) => level.id === 18);
  const kiteAnchor = kiteLevel.mechanics.kiteAnchors[0];
  const kite = await loadGameQaHook({ save: { unlocked: 20, completed: [] } });
  kite.startLevel(18);
  kite.teleport(kiteAnchor.x - 80, kiteAnchor.y + 20);
  kite.press("shoot");
  kite.step(1);
  kite.release("shoot");
  kite.step(12);
  assert.equal(kite.snapshot().kiteTether.anchorId, kiteAnchor.id, "pulse must connect the player to a kite anchor");
  assert.equal(kite.snapshot().kiteAnchors.find((anchor) => anchor.id === kiteAnchor.id).visited, true);

  const returnLevel = levels.find((level) => level.id === 19);
  const returnSeed = returnLevel.collectibles.find((item) => item.type === "return-seed");
  const page = await loadGameQaHook({ save: { unlocked: 20, completed: [] } });
  page.startLevel(19);
  page.teleport(returnSeed.x, returnSeed.y);
  page.step(1);
  const turned = page.snapshot();
  assert.equal(turned.pageTurn.active, true, "collecting the far-end seed must reverse the route");
  const outbound = turned.platforms.find((platform) => platform.id === "tp-out-01");
  const returning = turned.platforms.find((platform) => platform.id === "tp-back-01");
  assert.equal(outbound.enabled, false, "outbound paper must fold away after the page turn");
  assert.equal(returning.enabled, true, "return-only paper must unfold after the page turn");
  page.step(60);
  assert.ok(page.snapshot().pageTurn.inkX < turned.pageTurn.inkX, "ink tide must advance from right to left");

  const wardenLevel = levels.find((level) => level.id === 20);
  const warden = await loadGameQaHook({ save: { unlocked: 20, completed: [] } });
  warden.startLevel(20);
  warden.enterBossArena();
  warden.step(84);
  const telegraph = warden.snapshot();
  assert.equal(telegraph.boss.archetype, "fold-warden");
  assert.equal(telegraph.boss.state, "fold-telegraph", "warden must announce a target crease before diving");
  const target = wardenLevel.mechanics.foldTraps.find((trap) => trap.id === telegraph.boss.targetTrapId);
  assert.ok(target, "telegraph must point at a real arena fold trap");
  warden.teleport(target.x + target.w / 2 - 19, target.y - 110);
  warden.step(1);
  warden.press("down");
  warden.step(1);
  warden.release("down");
  warden.step(90);
  assert.ok(warden.snapshot().boss.vulnerable > 0, "a correctly timed downstrike fold must trap the diving boss");
});

test("act 6 mechanics execute as weight seating, seam crossing, trajectory stitching, and dragon climbing", async () => {
  const levels = await loadLevels();

  const balance = await loadGameQaHook({ save: { unlocked: 24, completed: [] } });
  balance.startLevel(21);
  const balanceStart = balance.snapshot();
  assert.equal(balanceStart.weightBlocks.length, 7);
  assert.equal(balanceStart.weightSlots.length, 6);
  assert.equal(balanceStart.scaleBridges.length, 3);
  const seating = [
    ["wc-weight-a1", "wc-slot-a-left"],
    ["wc-weight-a2", "wc-slot-a-right"],
    ["wc-weight-b2", "wc-slot-b-left"],
    ["wc-weight-b1", "wc-slot-b-right"],
    ["wc-weight-c3", "wc-slot-c-left"],
    ["wc-weight-c1", "wc-slot-c-right"],
    ["wc-weight-c2", "wc-slot-c-right"],
  ];
  for (const [weightId, slotId] of seating) {
    assert.equal(balance.seatWeight(weightId, slotId), true, `${weightId} must seat in ${slotId}`);
  }
  const balanced = balance.snapshot();
  assert.equal(balanced.weightBlocks.length, balanceStart.weightBlocks.length);
  assert.ok(balanced.weightBlocks.every((weight) => weight.id && Number.isFinite(weight.mass)));
  assert.equal(balanced.weightSlots.length, 6);
  assert.ok(balanced.weightSlots.every((slot) => slot.id && ["left", "right"].includes(slot.side)));
  for (const [weightId, slotId] of seating) {
    assert.equal(
      balanced.weightBlocks.find((weight) => weight.id === weightId)?.seatedSlotId,
      slotId,
      `${weightId} must retain its seated slot`,
    );
  }
  assert.ok(balanced.scaleBridges.every((bridge) => bridge.balanced === true),
    "all three scale bridges must report a balanced collision state");
  assert.ok(balanced.scaleBridges.every((bridge) => Number.isFinite(bridge.y)),
    "scale bridge snapshots must expose the collision height used by rendering and QA");
  assert.equal(balanced.goalReady, true, "balancing all three bridges must open the stage 21 exit");

  const lanes = await loadGameQaHook({ save: { unlocked: 24, completed: [] } });
  lanes.startLevel(22);
  const laneStart = lanes.snapshot();
  assert.equal(laneStart.silhouetteLane, "foreground");
  const firstSeam = laneStart.seams.find((seam) => seam.from === laneStart.silhouetteLane);
  assert.ok(firstSeam, "stage 22 needs a seam leading out of the initial lane");
  assert.equal(lanes.crossSeam(firstSeam.id), true);
  const crossed = lanes.snapshot();
  assert.equal(crossed.silhouetteLane, firstSeam.to);
  assert.equal(crossed.seams.find((seam) => seam.id === firstSeam.id).crossed, true);

  const weaveLevel = levels.find((level) => level.id === 23);
  const weave = await loadGameQaHook({ save: { unlocked: 24, completed: [] } });
  weave.startLevel(23);
  for (const loom of weaveLevel.mechanics.looms) {
    const zone = loom.bridgeZone;
    const points = [
      { x: zone.x + 30, y: zone.y + zone.h * 0.65 },
      { x: zone.x + zone.w * 0.38, y: zone.y + zone.h * 0.38 },
      { x: zone.x + zone.w * 0.7, y: zone.y + zone.h * 0.44 },
      { x: zone.x + zone.w - 30, y: zone.y + zone.h * 0.62 },
    ];
    assert.equal(weave.setTrajectory(points), true, `${loom.id} must accept a recorded jump trajectory`);
    assert.deepEqual(
      Array.from(weave.snapshot().trajectory, (point) => ({ x: point.x, y: point.y })),
      points,
    );
    assert.equal(weave.solidifyTrajectory(), true, `${loom.id} trajectory must solidify into paper collision`);
  }
  const stitched = weave.snapshot();
  assert.equal(stitched.stitchBridges.length, 3);
  assert.ok(stitched.stitchBridges.every((bridge) => bridge.id && bridge.life > 0 && bridge.segments.length > 0));
  assert.ok(stitched.looms.every((loom) => loom.completed === true));
  assert.equal(stitched.goalReady, true, "three temporary trajectory bridges must open the stage 23 exit");

  const dragon = await loadGameQaHook({ save: { unlocked: 24, completed: [] } });
  dragon.startLevel(24);
  dragon.enterBossArena();
  const dragonStart = dragon.snapshot();
  assert.equal(dragonStart.boss.archetype, "sky-paper-dragon");
  assert.equal(dragonStart.dragonKnots.length, 3);
  assert.ok(dragonStart.dragonBodyPlatforms.length >= 7);
  const bodyBefore = dragonStart.dragonBodyPlatforms.map((platform) => [platform.id, platform.x, platform.y]);
  dragon.step(30);
  const bodyAfter = dragon.snapshot().dragonBodyPlatforms.map((platform) => [platform.id, platform.x, platform.y]);
  assert.notDeepEqual(bodyAfter, bodyBefore, "the dragon body must move as a traversable platform route");
  for (const knot of dragon.snapshot().dragonKnots) {
    assert.equal(dragon.strikeDragonKnot(knot.id), true, `${knot.id} must accept its downstrike`);
  }
  const opened = dragon.snapshot();
  assert.ok(opened.dragonKnots.every((knot) => knot.active === true));
  assert.ok(Number.isInteger(opened.dragonCycle.index) && opened.dragonCycle.index >= 0);
  assert.equal(opened.dragonCycle.coreOpen, true, "three struck knot scales must flip open the crown route");
  assert.ok(opened.boss.vulnerable > 0, "the sky-dragon core must be vulnerable for one bounded attack window");
});

test("act 7 QA controls expose growth, rail, shadow, and crown-volley state", async () => {
  const levels = await loadLevels();

  const growthLevel = levels.find((level) => level.id === 25);
  const growth = await loadGameQaHook({ save: { unlocked: 28, completed: [] } });
  growth.startLevel(25);
  assert.equal(growth.snapshot().growthForm, growthLevel.mechanics.initialForm);
  assert.ok(Array.isArray(growth.snapshot().growthBroken), "growthBroken must identify broken wax seals");
  assert.equal(growth.setGrowthForm("small"), true);
  assert.equal(growth.snapshot().growthForm, "small");
  assert.equal(growth.setGrowthForm("giant"), true);
  assert.equal(growth.snapshot().growthForm, "giant");

  const railLevel = levels.find((level) => level.id === 26);
  const rail = await loadGameQaHook({ save: { unlocked: 28, completed: [] } });
  rail.startLevel(26);
  assert.equal(rail.snapshot().railCarts.length, railLevel.mechanics.carts.length);
  assert.equal(rail.snapshot().railStations.length, railLevel.mechanics.stations.length);
  rail.step(1_450);
  assert.equal(
    rail.snapshot().railCarts.find((cart) => cart.id === "cr-cart-a")?.railId,
    "cr-rail-start",
    "the opening rail cart must return through the network instead of being stranded at the east terminus",
  );
  const junction = railLevel.mechanics.junctions[0];
  const branch = junction.options.at(-1).rail;
  assert.equal(rail.setRailJunction(junction.id, branch), true);
  for (const station of railLevel.mechanics.stations) {
    assert.equal(rail.visitRailStation(station.id), true, `${station.id} must be visitable through QA`);
  }
  assert.ok(rail.snapshot().railStations.every((station) => station.visited === true));
  assert.equal(rail.snapshot().goalReady, true, "visiting all three stations must open the rail depot");

  const shadowLevel = levels.find((level) => level.id === 27);
  const shadow = await loadGameQaHook({ save: { unlocked: 28, completed: [] } });
  shadow.startLevel(27);
  const centralStep = shadowLevel.platforms.find((platform) => platform.id === "ls-central-step-west");
  const centralBalcony = shadowLevel.platforms.find((platform) => platform.id === "ls-central-balcony");
  const centralGround = shadowLevel.platforms.find((platform) => platform.id === "ls-central-ground");
  assert.ok(centralStep && centralBalcony && centralGround, "the central shadow key needs a deliberate two-jump route");
  assert.ok(centralGround.y - centralStep.y <= 210, "the first central ascent must fit the normal jump envelope");
  assert.ok(centralStep.y - centralBalcony.y <= 210, "the balcony ascent must fit the normal jump envelope");
  shadow.step(1);
  assert.equal(shadow.snapshot().checkpoints.find((point) => point.id === "ls-check-center")?.active, true,
    "the central checkpoint must own the initial bidirectional route");
  shadow.teleport(1_190, 536);
  shadow.step(1);
  assert.equal(shadow.snapshot().checkpoints.find((point) => point.id === "ls-check-west")?.active, true,
    "walking west must activate the west checkpoint by proximity");
  shadow.teleport(2_440, 536);
  shadow.step(1);
  assert.equal(shadow.snapshot().checkpoints.find((point) => point.id === "ls-check-center")?.active, true,
    "returning to the sanctuary must reactivate the central checkpoint");
  assert.ok(Number.isFinite(shadow.snapshot().shadowExposure));
  assert.equal(shadow.snapshot().shadowKeys, 0);
  const screen = shadowLevel.mechanics.screens[0];
  assert.equal(shadow.moveShadowScreen(screen.id, 1), true);
  assert.equal(shadow.setShadowExposure(0.75), 0.75);
  assert.equal(shadow.snapshot().shadowExposure, 0.75);

  const crown = await loadGameQaHook({ save: { unlocked: 28, completed: [] } });
  crown.startLevel(28);
  crown.enterBossArena();
  const capturedBefore = crown.snapshot().capturedCrownShards;
  assert.equal(crown.captureCrownShard(), true);
  assert.equal(crown.snapshot().capturedCrownShards, capturedBefore + 1);
  const volleysBefore = crown.snapshot().volleyShots.length;
  assert.equal(crown.launchCrownVolley(), true);
  assert.ok(crown.snapshot().volleyShots.length > volleysBefore, "a full first-phase store must launch a volley");
});

test("scorewing finale advances only through complete one-two-three shard volleys", async () => {
  const crown = await loadGameQaHook({ save: { unlocked: 28, completed: [] } });
  crown.startLevel(28);
  crown.enterBossArena();

  assert.equal(crown.snapshot().boss.hp, 3);
  assert.equal(crown.captureCrownShard(), true);
  assert.equal(crown.launchCrownVolley(), true);
  crown.step(90);
  assert.equal(crown.snapshot().boss.hp, 2, "the one-shard opening volley must remove exactly one phase");

  assert.equal(crown.captureCrownShard(), true);
  assert.equal(crown.launchCrownVolley(), false, "phase two must retain an incomplete one-shard store");
  assert.equal(crown.snapshot().capturedCrownShards, 1);
  assert.equal(crown.captureCrownShard(), true);
  assert.equal(crown.launchCrownVolley(), true);
  crown.step(90);
  assert.equal(crown.snapshot().boss.hp, 1, "the complete two-shard volley must advance to phase three");

  assert.equal(crown.captureCrownShard(), true);
  assert.equal(crown.captureCrownShard(), true);
  assert.equal(crown.launchCrownVolley(), false, "phase three must not fire before all three shards are stored");
  assert.equal(crown.captureCrownShard(), true);
  assert.equal(crown.launchCrownVolley(), true);
  crown.step(90);
  assert.equal(crown.snapshot().boss.hp, 0, "the three-shard final volley must defeat the maestro");
  assert.equal(crown.snapshot().capturedCrownShards, 0);
});

test("stage 23 only solidifies trajectories that actually span the configured gap", async () => {
  const levels = await loadLevels();
  const level = levels.find((entry) => entry.id === 23);
  const loom = level.mechanics.looms[0];
  const zone = loom.bridgeZone;
  const qa = await loadGameQaHook({ save: { unlocked: 24, completed: [] } });
  qa.startLevel(23);

  const tooShort = [
    { x: zone.x + 24, y: zone.y + zone.h * 0.7 },
    { x: zone.x + 40, y: zone.y + zone.h * 0.68 },
  ];
  assert.equal(qa.setTrajectory(tooShort), true, "QA must accept the short recorded sample for validation");
  assert.equal(qa.solidifyTrajectory(), false, "a tiny movement must not become a paper bridge");
  assert.equal(qa.snapshot().stitchBridges.length, 0);
  assert.equal(qa.snapshot().looms.find((entry) => entry.id === loom.id).completed, false);

  const longButNotCrossing = [
    { x: zone.x + 30, y: zone.y + zone.h * 0.72 },
    { x: zone.x + zone.w * 0.44, y: zone.y + zone.h * 0.2 },
    { x: zone.x + 45, y: zone.y + zone.h * 0.28 },
    { x: zone.x + zone.w * 0.48, y: zone.y + zone.h * 0.66 },
  ];
  assert.equal(qa.setTrajectory(longButNotCrossing), true,
    "QA must accept a long route that stays on the near side for validation");
  assert.equal(qa.solidifyTrajectory(), false,
    "distance alone must not pass when the route never reaches across the gap");
  assert.equal(qa.snapshot().stitchBridges.length, 0);
  assert.equal(qa.snapshot().looms.find((entry) => entry.id === loom.id).completed, false);

  const crossing = [
    { x: zone.x + 30, y: zone.y + zone.h * 0.65 },
    { x: zone.x + zone.w * 0.38, y: zone.y + zone.h * 0.38 },
    { x: zone.x + zone.w * 0.7, y: zone.y + zone.h * 0.44 },
    { x: zone.x + zone.w - 30, y: zone.y + zone.h * 0.62 },
  ];
  assert.equal(qa.setTrajectory(crossing), true);
  assert.equal(qa.solidifyTrajectory(), true, "a route spanning the loom gap must still solidify");
  const stitched = qa.snapshot();
  assert.equal(stitched.stitchBridges.length, 1);
  assert.equal(stitched.looms.find((entry) => entry.id === loom.id).completed, true);
});

test("rift-weaver relays cannot be preloaded for a future phase or during core exposure", async () => {
  const levels = await loadLevels();
  const level12 = levels.find((entry) => entry.id === 12);
  const relays = level12.mechanics.switches.filter((device) => device.role === "boss-relay");
  const [relayA, relayB] = relays;
  assert.ok(relayA && relayB, "stage 12 needs current- and future-phase relay fixtures");

  const qa = await loadGameQaHook();
  qa.startLevel(12);
  qa.enterBossArena();

  qa.teleport(relayB.x - 90, relayB.y - 18);
  qa.press("shoot");
  qa.step(1);
  qa.release("shoot");
  qa.step(20);
  assert.equal(
    qa.snapshot().switches.find((device) => device.id === relayB.id).active,
    false,
    "phase 1 must reject a phase 2 relay instead of carrying it across the health threshold",
  );

  qa.teleport(relayA.x - 90, relayA.y - 18);
  qa.press("shoot");
  qa.step(1);
  qa.release("shoot");
  qa.step(20);
  assert.ok(qa.snapshot().boss.vulnerable > 0, "the phase 1 relay should expose the core");
  assert.equal(qa.snapshot().switches.find((device) => device.id === relayA.id).active, false,
    "the relay that opened the core should reset immediately");

  qa.press("shoot");
  qa.step(1);
  qa.release("shoot");
  qa.step(12);
  assert.equal(
    qa.snapshot().switches.find((device) => device.id === relayA.id).active,
    false,
    "a relay must not be re-armed while the core is already exposed",
  );
});

test("touch direction taps are buffered and pointer-capture failures cannot swallow presses", async () => {
  const source = await readProjectFile("public/play/game.js");
  const functions = declaredFunctions(source);
  const touchStart = source.search(/\$\$\([^\n]*\[data-touch\]/);
  const touchEnd = source.indexOf("document.addEventListener(\"click\"", touchStart);
  assert.ok(touchStart >= 0 && touchEnd > touchStart, "missing touch-control binding block");
  const touchBindings = source.slice(touchStart, touchEnd);

  assert.doesNotMatch(
    touchBindings,
    /addEventListener\(["']pointerleave["']\s*,/,
    "pointerleave must not release a captured direction press before pointerup/pointercancel",
  );
  assert.match(touchBindings, /addEventListener\(["']pointermove["']\s*,\s*handleTouchPointerMove\)/,
    "the movement pad must support sliding from left to right without lifting the thumb");
  const moveHandler = namedFunction(source, "handleTouchPointerMove");
  assert.match(moveHandler, /rect\.left\s*\+\s*rect\.width\s*\/\s*2/,
    "slide steering must use the movement pad midpoint rather than tiny button hit targets");
  assert.match(moveHandler, /releaseAction[\s\S]*pressAction/,
    "crossing the movement pad must atomically release the old direction and press the new one");

  const holdConstant = Array.from(
    source.matchAll(/\b(?:const|let)\s+([A-Z][A-Z0-9_]*)\s*=\s*(\d+(?:\.\d+)?)\b/g),
  ).find((match) =>
    /(?:TOUCH|TAP)/.test(match[1])
      && /(?:MIN|HOLD|PRESS)/.test(match[1])
      && Number(match[2]) >= 50
      && Number(match[2]) <= 250,
  );
  assert.ok(
    holdConstant,
    "touch controls need an explicit 50-250ms minimum-hold constant for quick direction taps",
  );

  const [constantName, milliseconds] = [holdConstant[1], Number(holdConstant[2])];
  const bufferedRelease = functions.find(({ body }) =>
    body.includes(constantName) && /tapBuffer|directionBuffer|moveBuffer/i.test(body),
  );
  assert.ok(
    bufferedRelease,
    `${constantName} (${milliseconds}ms) must drive a direction input buffer`,
  );
  assert.ok(
    /\b(?:left|right|direction|move)\b/i.test(`${constantName} ${bufferedRelease.name} ${bufferedRelease.body}`),
    "the minimum-hold buffer must explicitly apply to left/right direction input",
  );
  assert.ok(
    functions.some(({ body }) => /tapBuffer|directionBuffer|moveBuffer/i.test(body) && /Math\.max\s*\(\s*0\s*,/.test(body)),
    "the direction tap buffer must count down in simulation time",
  );
  assert.ok(
    functions.some(({ body }) => /tapBuffer|directionBuffer|moveBuffer/i.test(body) && /input\.held/.test(body)),
    "movement intent must read either a physical hold or the quick-tap buffer",
  );

  const downHandler = functions.find(({ name, body }) =>
    /down/i.test(name) && /setPointerCapture/.test(body) && /pressAction\s*\(/.test(body),
  );
  assert.ok(downHandler, "touch pointerdown needs an explicit press handler");
  assert.match(
    downHandler.body,
    /try\s*\{[\s\S]*?setPointerCapture[\s\S]*?\}\s*catch\s*(?:\([^)]*\))?\s*\{/,
    "setPointerCapture() can throw on mobile and must be isolated by try/catch",
  );
  assert.match(
    downHandler.body,
    /\bpressAction\s*\(/,
    "pointer capture is optional, but the gameplay press must always be recorded",
  );
  assert.ok(
    downHandler.body.indexOf("pressAction") < downHandler.body.indexOf("setPointerCapture"),
    "the gameplay press must be recorded before optional pointer capture is attempted",
  );
  assert.match(source, /\bpointers\s*:\s*new\s+Map\s*\(/, "multi-touch state must be tracked by pointerId");
  assert.match(touchBindings, /lostpointercapture/, "lost pointer capture must release the matching touch source");
  const resetInput = namedFunction(source, "resetInput");
  assert.match(resetInput, /pointers\.clear\s*\(/, "resetInput() must clear tracked pointers");
  assert.match(source, /visibilitychange[\s\S]{0,180}?resetInput|pagehide[\s\S]{0,80}?resetInput/);
});

test("quick right-to-left handoff reverses on the first frame without a 50ms rightward slide", async () => {
  const qa = await loadGameQaHook();
  qa.startLevel(1);

  // Let the player settle on the opening ground, then build a representative
  // held-right running speed before a release + quick left tap handoff.
  qa.step(15);
  qa.press("right");
  qa.step(18);
  qa.release("right");
  const beforeSwitch = qa.snapshot();
  assert.ok(beforeSwitch.player.vx >= 300, `precondition: expected a rightward run, got vx=${beforeSwitch.player.vx}`);

  qa.press("left");
  qa.release("left");
  const switchX = beforeSwitch.player.x;
  qa.step(1);
  const firstFrame = qa.snapshot();
  qa.step(2);
  const after50ms = qa.snapshot();
  const rightwardDrift = after50ms.player.x - switchX;

  assert.ok(
    firstFrame.player.vx < 0,
    `left handoff must reverse velocity on the first 16.7ms frame; got vx=${firstFrame.player.vx.toFixed(2)}, `
      + `x drift after 50ms=${rightwardDrift.toFixed(2)}px`,
  );
  assert.ok(
    rightwardDrift <= 1,
    `left handoff must not visibly continue right during the first 50ms; drift=${rightwardDrift.toFixed(2)}px`,
  );
  assert.equal(after50ms.input.held.left, false, "the regression scenario must remain a quick tap, not a held input");
  assert.ok(after50ms.input.tapBuffer.left > 0, "the existing QA hook must observe the buffered left tap");
});

test("the newest direction wins during overlap and while airborne", async () => {
  const qa = await loadGameQaHook();
  qa.startLevel(1);
  qa.step(15);
  qa.press("right");
  qa.step(18);

  // Mobile pointer events can overlap for one or more frames when the player
  // puts the next finger down before the previous direction is released.
  qa.press("left");
  qa.step(1);
  const overlap = qa.snapshot();
  assert.equal(overlap.input.held.right, true);
  assert.equal(overlap.input.held.left, true);
  assert.equal(overlap.input.lastDirection, "left");
  assert.ok(overlap.player.vx < 0, `newest overlapping direction must win immediately; vx=${overlap.player.vx}`);

  // A second pointer on an already-held direction is still a fresh intent.
  // This guards three-finger/mixed keyboard+touch handoffs without turning
  // auto-repeated keydown events into repeated action edges.
  qa.press("right", "qa-right-2");
  qa.step(18);
  assert.ok(qa.snapshot().player.vx >= 300, "precondition: second right source must regain rightward speed");
  qa.press("left", "qa-left-2");
  qa.step(1);
  assert.ok(qa.snapshot().player.vx < 0, "a fresh source on an already-held left direction must reverse immediately");
  qa.release("left", "qa-left-2");
  qa.release("right", "qa-right-2");

  qa.release("left");
  qa.release("right");
  qa.startLevel(1);
  qa.step(15);
  qa.press("right");
  qa.step(18);
  qa.press("jump");
  qa.step(1);
  qa.release("jump");
  qa.release("right");
  assert.ok(qa.snapshot().player.vy < 0, "precondition: player must be airborne for the reversal check");

  qa.press("left");
  qa.release("left");
  qa.step(1);
  const airborne = qa.snapshot();
  assert.ok(airborne.player.vx < 0, `airborne quick tap must reverse on its first frame; vx=${airborne.player.vx}`);
});

test("every campaign collectible maps to an explicit non-generic effect handler", async () => {
  const [source, levels] = await Promise.all([
    readProjectFile("public/play/game.js"),
    loadLevels(),
  ]);
  const collectibleTypes = Array.from(
    new Set(levels.flatMap((level) => level.collectibles.map((item) => item.type))),
  ).sort();

  const registryDeclaration = /\b(?:const|let)\s+(COLLECTIBLE_(?:EFFECTS|HANDLERS)|collectible(?:Effect|Pickup)(?:Effects|Handlers))\s*=/.exec(source);
  assert.ok(
    registryDeclaration,
    "declare an explicit COLLECTIBLE_EFFECTS/COLLECTIBLE_HANDLERS registry instead of a generic pickup no-op",
  );
  const registryName = registryDeclaration[1];
  const objectIndex = source.indexOf("{", registryDeclaration.index + registryDeclaration[0].length);
  const arrayIndex = source.indexOf("[", registryDeclaration.index + registryDeclaration[0].length);
  const openIndex = objectIndex >= 0 && (arrayIndex < 0 || objectIndex < arrayIndex) ? objectIndex : arrayIndex;
  assert.ok(openIndex >= 0, `${registryName} must be an object or Map-style entry list`);
  const registry = balancedBlock(source, openIndex);

  for (const type of collectibleTypes) {
    const registryKey = /^[A-Za-z_$][\w$]*$/.test(type)
      ? new RegExp(`(?:["']${type}["']|\\b${type}\\s*:)`)
      : literalPattern(type);
    assert.match(
      registry,
      registryKey,
      `${type} is used by level data but has no explicit pickup effect entry`,
    );
  }
  assert.doesNotMatch(
    registry,
    /=>\s*\{\s*\}|function\s*\([^)]*\)\s*\{\s*\}/,
    "collectible effect entries must not contain empty no-op handlers",
  );
  assert.match(
    source,
    new RegExp(`\\b${registryName}\\b\\s*(?:\\[|\\.get\\s*\\()`),
    `${registryName} must be dispatched when a pickup is collected`,
  );

  const collectItem = namedFunction(source, "collectItem");
  const registeredModes = Array.from(registry.matchAll(/\bmode\s*:\s*["']([^"']+)["']/g), (match) => match[1]);
  const modeState = {
    memory: /collectedSeeds|save\.seeds/,
    health: /player\.health/,
    timed: /activeEffects/,
    charges: /runtime\.charges/,
    rune: /tide-rune|inventory/,
    quest: /inventory/,
    coolant: /lavaY|runtime\.enabled/,
    quench: /lavaY/,
    "boss-core": /completeLevel/,
  };
  for (const mode of new Set(registeredModes)) {
    assert.match(collectItem, literalPattern(mode), `collectItem() does not dispatch registered mode ${mode}`);
    assert.match(collectItem, modeState[mode] || /./, `${mode} is registered but does not mutate its promised gameplay state`);
  }
  assert.match(source, /collectedSeeds[\s\S]{0,180}?persistentKey|persistentKey[\s\S]{0,180}?collectedSeeds/,
    "memory seeds need a persistent ID so restarting a stage cannot farm the same pickup");
});

test("mobile HUD keeps a persistent pickup status after the toast disappears", async () => {
  const [html, css, source] = await Promise.all([
    readProjectFile("public/play/index.html"),
    readProjectFile("public/play/game.css"),
    readProjectFile("public/play/game.js"),
  ]);

  assert.match(html, /\bid=["']pickup-status["']/i, "HUD needs a persistent #pickup-status surface");
  assert.match(html, /\bid=["']pickup-status["'][^>]*\baria-live=["']polite["']|\baria-live=["']polite["'][^>]*\bid=["']pickup-status["']/i);
  assert.match(css, /(?:#pickup-status|\.pickup-status)\s*\{/i, "pickup status needs a visible HUD style");
  assert.match(
    source,
    /(?:\$\(["']#pickup-status["']\)|getElementById\(["']pickup-status["']\))[\s\S]{0,320}?\.textContent\s*=/,
    "updateHud() must keep #pickup-status synchronized with the lasting pickup effect",
  );
});

test("boss phase and defeat spawn metadata gates runtime interaction and rendering", async () => {
  const source = await readProjectFile("public/play/game.js");
  const functions = declaredFunctions(source);
  const spawnGate = functions.find(({ body }) =>
    /spawnOnBossPhase/.test(body) && /spawnOnBossDefeat/.test(body),
  );

  assert.ok(
    spawnGate,
    "add one explicit spawn-availability function covering spawnOnBossPhase and spawnOnBossDefeat",
  );
  assert.match(
    spawnGate.body,
    /boss(?:\?\.)?\.phase|boss\?\.phase/,
    `${spawnGate.name}() must compare spawnOnBossPhase with the live boss phase`,
  );
  assert.match(
    spawnGate.body,
    /boss(?:\?\.)?\.(?:hp|state)|boss\?\.(?:hp|state)|goalOpen|completed/,
    `${spawnGate.name}() must gate spawnOnBossDefeat using live defeat state`,
  );

  const makeRuntime = namedFunction(source, "makeRuntime");
  assert.ok(
    /\.\.\.\s*enemy\b/.test(makeRuntime)
      || (/spawnOnBossPhase/.test(makeRuntime) && /spawnOnBossDefeat/.test(makeRuntime)),
    "runtime enemy records must retain their boss spawn metadata",
  );

  const escapedName = spawnGate.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const gateCall = new RegExp(`\\b${escapedName}\\s*\\(`);
  for (const functionName of ["updateEnemies", "handlePlayerWorld", "renderWorld", "renderCollectibles"]) {
    assert.match(
      namedFunction(source, functionName),
      gateCall,
      `${functionName}() must honor ${spawnGate.name}() so locked entities neither act, collect, nor render`,
    );
  }
});

function moduleMetric(snapshot, names) {
  const containers = [
    snapshot.moduleState,
    snapshot.ability,
    snapshot.module,
    snapshot.effects,
  ].filter((entry) => entry && typeof entry === "object");
  for (const container of containers) {
    for (const name of names) {
      if (name in container) return container[name];
    }
  }
  return undefined;
}

function objectiveSnapshot(snapshot) {
  return snapshot.objective || snapshot.objectives?.[0] || null;
}

function repairZoneSnapshot(snapshot) {
  return snapshot.repairZones || objectiveSnapshot(snapshot)?.zones || [];
}

function reactorSnapshot(snapshot) {
  return snapshot.reactors || objectiveSnapshot(snapshot)?.reactors || [];
}

test("old saves gain a backward-compatible unequipped hero module", async () => {
  const qa = await loadGameQaHook({
    save: {
      unlocked: 3,
      completed: [1, 2],
      seeds: 5,
      deaths: 1,
    },
  });
  const snapshot = qa.snapshot();

  assert.equal(snapshot.heroModule, "none", "a save without heroModule must migrate to none");
  assert.deepEqual(Array.from(snapshot.unlockedModules), ["none"], "no boss clear means no boss module unlock");
});

test("boss clears unlock echo/wind/root while locked modules cannot be equipped", async () => {
  const fresh = await loadGameQaHook({ save: { unlocked: 1, completed: [] } });
  assert.equal(typeof fresh.equipModule, "function", "QA needs equipModule(id) for module behavior regression tests");
  assert.equal(fresh.equipModule("echo"), false, "echo must remain locked before boss 4 is cleared");
  assert.equal(fresh.snapshot().heroModule, "none");

  const echo = await loadGameQaHook({ save: { unlocked: 5, completed: [1, 2, 3, 4] } });
  assert.deepEqual(Array.from(echo.snapshot().unlockedModules), ["none", "echo"]);
  assert.equal(echo.equipModule("echo"), true);
  assert.equal(echo.snapshot().heroModule, "echo");

  const wind = await loadGameQaHook({ save: { unlocked: 9, completed: Array.from({ length: 8 }, (_, i) => i + 1) } });
  assert.deepEqual(Array.from(wind.snapshot().unlockedModules), ["none", "echo", "wind"]);

  const root = await loadGameQaHook({ save: { unlocked: 12, completed: Array.from({ length: 12 }, (_, i) => i + 1) } });
  assert.deepEqual(Array.from(root.snapshot().unlockedModules), ["none", "echo", "wind", "root"]);
  assert.equal(root.equipModule("root"), true);
  assert.equal(root.snapshot().heroModule, "root");
});

test("echo, wind, and root augment the existing shoot/dash/down controls", async () => {
  const echo = await loadGameQaHook({ save: { unlocked: 5, completed: [1, 2, 3, 4] } });
  echo.equipModule("echo");
  echo.startLevel(1);
  const echoBefore = echo.snapshot();
  echo.press("shoot");
  echo.step(1);
  echo.release("shoot");
  const echoAfter = echo.snapshot();
  assert.notDeepEqual(
    moduleMetric(echoAfter, ["echoPulse", "pulse", "echoCharge", "charge"]),
    moduleMetric(echoBefore, ["echoPulse", "pulse", "echoCharge", "charge"]),
    "echo shoot must activate its pulse/charge state",
  );

  const wind = await loadGameQaHook({ save: { unlocked: 9, completed: Array.from({ length: 8 }, (_, i) => i + 1) } });
  wind.equipModule("wind");
  wind.startLevel(1);
  wind.step(15);
  wind.press("jump");
  wind.step(1);
  wind.release("jump");
  wind.step(2);
  const windBefore = wind.snapshot();
  assert.ok(windBefore.player.vy < 0, "fixture must be airborne before the wind dash");
  wind.press("dash");
  wind.step(1);
  wind.release("dash");
  wind.press("jump");
  wind.step(1);
  wind.release("jump");
  const windAfter = wind.snapshot();
  assert.ok(
    Number(moduleMetric(windAfter, ["windLift", "airDash", "lift", "windBurst"])) > 0
      || windAfter.player.vy < windBefore.player.vy,
    "wind dash must create observable aerial lift",
  );

  const root = await loadGameQaHook({
    save: { unlocked: 12, completed: Array.from({ length: 12 }, (_, i) => i + 1) },
    mutateLevels(bundle) {
      const level = bundle.get(1);
      level.hazards = [];
      level.enemies = [{ id: "qa-root-shot", type: "storm-cannon", x: 140, y: 536, hp: 99, speed: 0 }];
    },
  });
  root.equipModule("root");
  root.startLevel(1);
  root.step(15);
  root.press("down");
  root.step(1);
  root.release("down");
  const guarded = root.snapshot();
  assert.ok(
    Number(moduleMetric(guarded, ["rootShield", "shield", "guard", "rooted"])) > 0,
    "root down must open a shield/guard state",
  );
  root.step(30);
  const rootAfter = root.snapshot();
  assert.ok(
    Number(moduleMetric(rootAfter, ["rootShockwave", "shockwave", "quake"])) > 0,
    "root down must emit an observable shockwave",
  );
});

test("stage 5 completes any two repair zones only after returning to the sanctuary", async () => {
  const qa = await loadGameQaHook({ save: { unlocked: 5, completed: [1, 2, 3, 4] } });
  qa.startLevel(5);
  const start = qa.snapshot();
  const objective = objectiveSnapshot(start);
  const zones = repairZoneSnapshot(start);

  assert.equal(objective?.type, "repair-zones");
  assert.equal(Number(objective?.required ?? objective?.count), 2);
  assert.ok(zones.length >= 3, "stage 5 needs at least three route choices");

  for (const zone of zones.slice(0, 2)) {
    // Pulse from just outside the fixture.  This mirrors real play and avoids
    // spawning the player inside a solid repair prop/platform.
    qa.teleport(Math.max(0, zone.x - 70), zone.y + Math.max(0, ((zone.h || 54) - 54) / 2));
    qa.press("shoot");
    qa.step(1);
    qa.release("shoot");
    qa.step(24);
  }
  const repaired = qa.snapshot();
  assert.ok(Number(objectiveSnapshot(repaired)?.progress) >= 2, "any two visited zones must be repaired");
  assert.equal(repaired.scene, "playing", "repairing two zones away from sanctuary must not auto-complete");

  const level5 = (await loadLevels()).find((level) => level.id === 5);
  const sanctuary = level5.mechanics?.sanctuary || level5.goal;
  qa.teleport(sanctuary.x + sanctuary.w / 2, sanctuary.y + sanctuary.h / 2);
  qa.step(1);
  assert.equal(qa.snapshot().scene, "complete", "the repaired route must be submitted at the central sanctuary");
});

test("stage 11 reactors accept normal pulse fallback and cannot soft-lock the exit", async () => {
  const qa = await loadGameQaHook({ save: { unlocked: 11, completed: Array.from({ length: 10 }, (_, i) => i + 1) } });
  qa.startLevel(11);
  const start = qa.snapshot();
  const objective = objectiveSnapshot(start);
  const reactors = reactorSnapshot(start);
  assert.equal(objective?.type, "reflect-reactor");
  assert.ok(reactors.length >= 2, "stage 11 needs at least two reactors");

  for (const reactor of reactors) {
    const required = Math.max(1, Number(reactor.required ?? reactor.requiredCharge) || 1);
    for (let shot = 0; shot < required + 2; shot += 1) {
      qa.teleport(reactor.x - 80, reactor.y);
      qa.press("shoot");
      qa.step(1);
      qa.release("shoot");
      qa.step(18);
    }
  }

  const charged = qa.snapshot();
  assert.ok(
    reactorSnapshot(charged).every((reactor) => reactor.charged === true || Number(reactor.charge) >= Number(reactor.required ?? reactor.requiredCharge)),
    "ordinary pulses must eventually charge every reactor when no reflected shot is available",
  );
  assert.equal(charged.goalReady, true, "a fully charged reactor route must open the exit");
});

test("stage 11 storm cells add two charge to the nearest unpowered reactor", async () => {
  const levels = await loadLevels();
  const level11 = levels.find((level) => level.id === 11);
  const cells = level11.collectibles.filter((item) => item.type === "storm-cell");
  const reactors = level11.objectives.find((objective) => objective.type === "reflect-reactor")?.reactors || [];
  assert.ok(cells.length > 0 && reactors.length >= 2, "stage 11 needs storm cells and two reactor fixtures");

  // Use the campaign's eastern cell: it is safely collectible without crossing
  // a relay gate and is closest to the eastern reactor in the shipped layout.
  const cell = cells.reduce((rightmost, item) => item.x > rightmost.x ? item : rightmost);
  const nearest = reactors.reduce((best, reactor) =>
    Math.abs(reactor.x - cell.x) < Math.abs(best.x - cell.x) ? reactor : best);
  const qa = await loadGameQaHook({
    save: { unlocked: 11, completed: Array.from({ length: 10 }, (_, i) => i + 1) },
  });
  qa.startLevel(11);
  const before = new Map(reactorSnapshot(qa.snapshot()).map((reactor) => [reactor.id, reactor.charge]));

  qa.teleport(cell.x, cell.y);
  qa.step(1);

  const after = reactorSnapshot(qa.snapshot());
  const charged = after.find((reactor) => reactor.id === nearest.id);
  assert.equal(charged.charge, before.get(nearest.id) + 2, "the nearest unpowered reactor must gain exactly two charge");
  for (const reactor of after.filter((entry) => entry.id !== nearest.id)) {
    assert.equal(reactor.charge, before.get(reactor.id), `${reactor.id} must not receive the cell's charge`);
  }
});

test("stage 11 echo-reflected enemy shots add three reactor charge", async () => {
  const qa = await loadGameQaHook({
    save: { unlocked: 11, completed: Array.from({ length: 10 }, (_, i) => i + 1), heroModule: "echo" },
    mutateLevels(bundle) {
      const level = bundle.get(11);
      level.platforms = [{ id: "qa-ground", x: 0, y: 620, w: 2_000, h: 100 }];
      level.hazards = [];
      level.collectibles = [];
      level.enemies = [{ id: "qa-echo-cannon", type: "storm-cannon", x: 800, y: 536, hp: 99, speed: 0 }];
      const objective = level.objectives.find((entry) => entry.type === "reflect-reactor");
      objective.reactors = [
        { id: "qa-reactor", x: 1_200, y: 530, w: 74, h: 60, requiredCharge: 6 },
        { id: "qa-spare-reactor", x: 1_700, y: 530, w: 74, h: 60, requiredCharge: 6 },
      ];
    },
  });
  qa.startLevel(11);
  assert.equal(qa.snapshot().heroModule, "echo");
  qa.teleport(1_100, 536);

  // The cannon's first shot spawns after its real half-second cooldown. The
  // echo pulse then reflects that live hostile projectile toward the reactor.
  qa.step(60);
  qa.press("shoot");
  qa.step(1);
  qa.release("shoot");
  assert.equal(qa.snapshot().moduleState.echoReflections, 1, "the pulse must reflect the cannon shot");
  qa.step(30);

  const snapshot = qa.snapshot();
  const reactor = reactorSnapshot(snapshot).find((entry) => entry.id === "qa-reactor");
  assert.equal(snapshot.moduleState.echoCharge, 3, "the reflected projectile itself must contribute exactly three charge");
  assert.equal(reactor.charge, 4, "the reflected +3 and the ordinary fallback +1 should both reach the reactor");
});

test("damage keeps its protection window without trapping held movement in knockback", async () => {
  const qa = await loadGameQaHook({
    mutateLevels(bundle) {
      const level = bundle.get(1);
      level.platforms = [{ id: "qa-ground", x: 0, y: 620, w: 1_600, h: 100 }];
      level.hazards = [{ id: "qa-contact-hazard", x: 520, y: 540, w: 80, h: 80 }];
      level.enemies = [];
    },
  });
  qa.startLevel(1);
  qa.teleport(525, 566);
  qa.press("right");
  qa.step(1);

  const impact = qa.snapshot().player;
  assert.equal(impact.health, 4, "first contact must deal exactly one point of damage");
  assert.ok(impact.vx < 0, "the initial impact must still knock the player away from its source");
  assert.ok(impact.hurtTime > 0 && impact.hurtTime <= 0.17, "the visible hurt reaction must be brief");
  assert.ok(impact.invulnerable >= 1, "damage protection must outlast the short hurt reaction");

  // Keep the original direction held: recovery must not require a release and
  // second press after the knockback changed horizontal velocity.
  qa.step(11);
  const recovered = qa.snapshot().player;
  assert.equal(recovered.hurtTime, 0, "the hurt pose must end after roughly 0.16 seconds");
  assert.ok(recovered.invulnerable > 0, "the player must remain protected after control returns");
  assert.ok(recovered.vx > 0, `held movement must retake control quickly; vx=${recovered.vx}`);
  assert.equal(recovered.health, 4, "overlap during invulnerability must not apply another hit");

  qa.step(35);
  assert.equal(qa.snapshot().player.health, 4, "the same contact cannot chain damage during recovery");
  qa.release("right");
});

test("rift night patrol changes actions across six tides, events, and risk choices", async () => {
  const qa = await loadGameQaHook({
    mutateTrials(bundle) {
      bundle.trials.find((entry) => entry.id === "night-watch").coreHealth = 999;
    },
  });
  qa.startTrial("night-watch");
  const start = qa.snapshot();
  assert.equal(start.mode, "trial");
  assert.equal(start.level, 101);
  assert.equal(start.scene, "playing");
  assert.equal(start.trial.coreHp, 999);
  assert.equal(start.trial.phaseIndex, 0);
  assert.equal(start.trial.phaseTask, "relay");
  assert.equal(start.trial.arenaMotion, "still");
  assert.equal(start.trial.route.length, 3, "the opening must teach a three-action anchor route");

  for (let step = 0; step < 4 && qa.snapshot().trial.circuits === 0; step += 1) {
    const state = qa.snapshot();
    const expectedId = state.trial.route[state.trial.routeProgress];
    const anchor = state.trial.anchors.find((entry) => entry.id === expectedId);
    assert.ok(anchor, `missing active relay anchor ${expectedId}`);
    assert.ok(["touch", "dash", "downstrike"].includes(anchor.requiredAction));
    assert.equal(qa.activateTrialAnchorBy(anchor.id, anchor.requiredAction), true);
  }
  const relayed = qa.snapshot();
  assert.equal(relayed.trial.circuits, 1, "touching the ordered anchors must close one constellation circuit");
  assert.equal(relayed.trial.combo, 1, "circuit completion, not ordinary kills, must build the relay chain");
  assert.ok(relayed.trial.score >= 400, "a completed route must be the primary scoring event");
  assert.equal(qa.triggerTrialEvent("red-comet-wager", "pursue"), true);
  assert.deepEqual(
    { id: qa.snapshot().trial.activeEvent.id, choiceId: qa.snapshot().trial.activeEvent.choiceId },
    { id: "red-comet-wager", choiceId: "pursue" },
  );

  qa.setTrialElapsed(60.1);
  assert.equal(qa.snapshot().scene, "trial-upgrade", "the escort tide must pause for a mutation choice");
  assert.equal(qa.snapshot().trial.phaseIndex, 1);
  assert.equal(qa.snapshot().trial.phaseTask, "escort");
  assert.equal(qa.snapshot().trial.arenaMotion, "lift");
  assert.equal(qa.chooseTrialUpgrade("seed-shell"), true);
  assert.equal(qa.chooseTrialRoute("risky"), true);
  const upgraded = qa.snapshot();
  assert.equal(upgraded.scene, "playing");
  assert.deepEqual(Array.from(upgraded.trial.upgrades), ["seed-shell"]);
  assert.equal(upgraded.trial.upgradeRanks["seed-shell"], 1);
  assert.equal(upgraded.trial.route.length, 0, "escort must replace relay routing rather than reskin it");
  assert.equal(upgraded.trial.escort.routeId, "risky");
  assert.ok(upgraded.trial.escort.riskMultiplier > 1, "the risky escort branch must expose its score multiplier");

  for (let second = 0; second < 8 && qa.snapshot().trial.escort.deliveries === 0; second += 1) {
    const escort = qa.snapshot().trial.escort;
    qa.teleport(escort.x, escort.y);
    qa.step(60);
  }
  assert.ok(qa.snapshot().trial.escort.deliveries >= 1, "staying near the moving star seed must escort it to an anchor");

  qa.setTrialElapsed(120.1);
  assert.equal(qa.snapshot().scene, "trial-upgrade", "the salvage tide must offer the second mutation choice");
  assert.equal(qa.snapshot().trial.phaseIndex, 2);
  assert.equal(qa.snapshot().trial.phaseTask, "salvage");
  assert.equal(qa.snapshot().trial.arenaMotion, "drift");
  assert.equal(qa.chooseTrialUpgrade("seed-vacuum"), true);
  const salvageBefore = qa.snapshot().trial.salvage.delivered;
  assert.equal(qa.spawnTrialSeed(640), true);
  assert.ok(qa.snapshot().trial.salvage.seeds.some((seed) => seed.state === "falling" || seed.state === "grounded"));
  qa.teleport(640, 552);
  qa.step(2);
  assert.ok(qa.snapshot().trial.salvage.carrying > 0, "touching a fallen seed must pick it up");
  assert.equal(qa.depositTrialSeed(), true);
  assert.equal(qa.snapshot().trial.salvage.delivered, salvageBefore + 1);

  qa.setTrialElapsed(180.1);
  assert.equal(qa.snapshot().scene, "trial-upgrade", "the repair tide must offer the third mutation choice");
  assert.equal(qa.snapshot().trial.phaseIndex, 3);
  assert.equal(qa.snapshot().trial.phaseTask, "repair");
  assert.equal(qa.snapshot().trial.arenaMotion, "split");
  assert.equal(qa.chooseTrialUpgrade("root-burst"), true);
  for (const node of qa.snapshot().trial.repairNodes) {
    assert.ok(["pulse", "dash", "downstrike"].includes(node.requiredAction));
    for (let charge = 0; charge < node.required + 1; charge += 1) {
      const current = qa.snapshot().trial.repairNodes.find((entry) => entry.id === node.id);
      if (current.charged || current.charge >= current.required) break;
      assert.equal(qa.chargeTrialNodeBy(node.id, node.requiredAction), true);
    }
    const charged = qa.snapshot().trial.repairNodes.find((entry) => entry.id === node.id);
    assert.ok(charged.charged || charged.charge >= charged.required, `${node.id} must accept its assigned action`);
  }
  assert.equal(qa.snapshot().trial.repairedSets, 1, "charging all three nodes must complete one repair set");

  qa.setTrialElapsed(240.1);
  assert.equal(qa.snapshot().scene, "trial-upgrade", "the counter tide must offer the fourth mutation choice");
  assert.equal(qa.snapshot().trial.phaseIndex, 4);
  assert.equal(qa.snapshot().trial.phaseTask, "counter");
  assert.equal(qa.snapshot().trial.arenaMotion, "storm");
  assert.equal(qa.chooseTrialUpgrade("meteor-mirror"), true);
  for (let step = 0; step < 3 && !qa.snapshot().trial.rift.armed; step += 1) {
    const state = qa.snapshot();
    const expectedId = state.trial.route[state.trial.routeProgress];
    const anchor = state.trial.anchors.find((entry) => entry.id === expectedId);
    assert.ok(anchor, `missing counter-charge anchor ${expectedId}`);
    assert.equal(qa.activateTrialAnchorBy(anchor.id, anchor.requiredAction || "touch"), true);
  }
  const armed = qa.snapshot();
  assert.equal(armed.trial.rift.armed, true, "completing the counter route must arm the rift mirror");
  assert.equal(qa.spawnTrialMeteor("heavy", 640), true);
  let heavy = qa.snapshot().trial.meteors.find((meteor) => meteor.type === "heavy");
  assert.equal(heavy.actionIndex, 0);
  assert.equal(qa.actOnTrialMeteor(640, "pulse"), true);
  heavy = qa.snapshot().trial.meteors.find((meteor) => meteor.type === "heavy");
  assert.equal(heavy.actionIndex, 1);
  assert.equal(qa.actOnTrialMeteor(640, "pulse"), true);
  heavy = qa.snapshot().trial.meteors.find((meteor) => meteor.type === "heavy");
  assert.equal(heavy.actionIndex, 2);
  assert.equal(qa.actOnTrialMeteor(640, "downstrike"), true);
  const reflected = qa.snapshot();
  assert.equal(reflected.trial.reflections, 1);
  assert.equal(reflected.trial.rift.hp, reflected.trial.rift.maxHp - 2,
    "a correctly sequenced heavy meteor must deal two rift damage");

  qa.setTrialElapsed(300.1);
  assert.equal(qa.snapshot().scene, "trial-upgrade", "the siege tide must offer the fifth mutation choice");
  assert.equal(qa.snapshot().trial.phaseIndex, 5);
  assert.equal(qa.snapshot().trial.phaseTask, "siege");
  assert.equal(qa.snapshot().trial.arenaMotion, "dawn");
  assert.equal(qa.chooseTrialUpgrade("dawn-oath"), true);
  const eliteStartHp = qa.snapshot().trial.siege.elite.hp;
  const eliteActions = ["pulse", "dash", "downstrike"];
  for (let hit = 0; hit < 24 && !qa.snapshot().trial.siege.elite.defeated; hit += 1) {
    assert.equal(qa.damageTrialElite(eliteActions[hit % eliteActions.length]), true);
  }
  const siege = qa.snapshot();
  assert.ok(siege.trial.siege.elite.hp < eliteStartHp);
  assert.equal(siege.trial.siege.elite.defeated, true, "cycling all three actions must defeat the dawn elite");
  assert.deepEqual(
    Object.fromEntries(["seed-shell", "seed-vacuum", "root-burst", "meteor-mirror", "dawn-oath"]
      .map((id) => [id, siege.trial.upgradeRanks[id]])),
    { "seed-shell": 1, "seed-vacuum": 1, "root-burst": 1, "meteor-mirror": 1, "dawn-oath": 1 },
  );
});

test("night rush storm phase automatically spawns meteors that downstrike can resolve", async () => {
  const qa = await loadGameQaHook({
    mutateTrials(bundle) {
      const trial = bundle.trials.find((entry) => entry.id === "night-rush");
      trial.coreHealth = 999;
      trial.upgradeRounds = [];
      trial.upgradeAt = [];
      trial.waves.baseInterval = 99;
    },
  });
  assert.equal(qa.startTrial("night-rush"), true);
  assert.equal(qa.setTrialElapsed(60.1), true);
  const storm = qa.snapshot();
  assert.equal(storm.trial.phaseIndex, 2, "sixty seconds must enter the rush's third phase");
  assert.equal(storm.trial.phaseTask, "relay", "meteors must coexist with the rush relay objective");

  qa.step(110);
  const spawned = qa.snapshot();
  const meteor = spawned.trial.meteors.find((entry) => !entry.struck);
  assert.ok(meteor, "the third rush phase must generate its configured meteor without a QA-only spawn");
  const reflectionsBefore = spawned.trial.reflections;
  assert.equal(qa.actOnTrialMeteor(meteor.x, "downstrike"), true,
    "downstrike must be accepted while the rush keeps its relay task");
  const reflected = qa.snapshot();
  assert.equal(reflected.trial.reflections, reflectionsBefore + 1);
  assert.equal(reflected.trial.meteors.find((entry) => entry.x === meteor.x)?.reflected, true);
});

test("a final objective penalty that drains the core to zero cannot count as a patrol clear", async () => {
  const qa = await loadGameQaHook({
    mutateTrials(bundle) {
      const trial = bundle.trials.find((entry) => entry.id === "night-watch");
      trial.duration = 1;
      trial.coreHealth = 1;
      trial.upgradeRounds = [];
      trial.upgradeAt = [];
      trial.circuit.phases = [{ ...trial.circuit.phases[0], objectiveRequired: 1 }];
      trial.waves.baseInterval = 99;
    },
  });
  assert.equal(qa.startTrial("night-watch"), true);
  qa.step(65);

  const result = qa.snapshot();
  assert.equal(result.scene, "trial-result");
  assert.equal(result.trial.coreHp, 0, "the missed final objective must exhaust the one-point core");
  assert.equal(qa.__elements.get("trial-result-title").textContent, "芽核失守",
    "zero core at the timer boundary must use the loss result");
  const stored = JSON.parse(qa.__storage.get("starsprout-save-v2"));
  assert.equal(stored.trialRecords?.["night-watch"]?.cleared, false,
    "a timer-boundary core loss must not unlock endless mode");
});

test("finishing the patrol unlocks endless while the ninety-second rush remains selectable", async () => {
  const locked = await loadGameQaHook();
  assert.equal(locked.startTrial("night-endless"), false, "endless must start locked on a fresh save");

  const rush = await loadGameQaHook();
  assert.equal(rush.startTrial("night-rush"), true);
  assert.equal(rush.snapshot().trial.timeLeft, 90);
  assert.equal(rush.snapshot().trial.phaseTask, "relay");

  const short = await loadGameQaHook({
    mutateTrials(bundle) {
      const trial = bundle.trials.find((entry) => entry.id === "night-watch");
      trial.duration = 1;
      trial.upgradeRounds = [];
      trial.upgradeAt = [];
      trial.circuit.phases = [{ ...trial.circuit.phases[0], objectiveRequired: 0 }];
      trial.waves.baseInterval = 10;
    },
  });
  short.startTrial("night-watch");
  short.step(65);
  assert.equal(short.snapshot().scene, "trial-result", "surviving the timer must enter a branch-only result screen");
  const stored = JSON.parse(short.__storage.get("starsprout-save-v2"));
  assert.ok(stored.trialRecords?.["night-watch"], "night watch must save its record outside campaign completion");
  assert.equal(stored.trialRecords["night-watch"].cleared, true, "a completed patrol must persist the endless unlock");
  assert.deepEqual(stored.completed, [], "branch results must not unlock or complete campaign stages");

  const endless = await loadGameQaHook({ save: stored });
  assert.equal(endless.startTrial("night-endless"), true);
  assert.equal(endless.snapshot().trial.endless, true);
  assert.equal(endless.snapshot().trial.timeLeft, Infinity);
});

test("endless night watch keeps offering upgrades after the original three choices", async () => {
  const qa = await loadGameQaHook({
    save: {
      unlocked: 1,
      completed: [],
      trialRecords: { "night-watch": { cleared: true, score: 1, combo: 1 } },
    },
  });
  assert.equal(qa.startTrial("night-endless"), true);

  const offers = [
    [50.1, "seed-shell"],
    [110.1, "seed-vacuum"],
    [170.1, "root-burst"],
    [230.1, "meteor-mirror"],
    [290.1, "dawn-oath"],
    [350.1, "seed-shell"],
  ];
  for (const [elapsed, upgrade] of offers) {
    assert.equal(qa.setTrialElapsed(elapsed), true);
    assert.equal(qa.snapshot().scene, "trial-upgrade", `endless must offer an upgrade at ${elapsed} seconds`);
    assert.equal(qa.chooseTrialUpgrade(upgrade), true, `${upgrade} must be selectable in its repeating round`);
  }

  const ranked = qa.snapshot();
  assert.equal(ranked.trial.upgradeRanks["seed-shell"], 2,
    "a repeated endless upgrade must rank up instead of silently stopping or duplicating a no-op");
  assert.equal(ranked.trial.upgradeRanks["dawn-oath"], 1);
  assert.ok(ranked.trial.coreMaxHp > 20,
    "ranking an upgrade after the fifth round must apply the configured persistent core growth");
  qa.setTrialElapsed(360.1);
  assert.ok(qa.snapshot().trial.cycle >= 1, "all six tasks must roll into another endless cycle");
});

test("the bestiary starts empty, unlocks on sight, and never reveals unseen creatures", async () => {
  const qa = await loadGameQaHook({
    mutateLevels(bundle) {
      const level = bundle.get(1);
      level.enemies = [{ id: "qa-drummer", type: "thunder-drummer", x: 360, y: 566, speed: 48, hp: 3 }];
    },
  });
  assert.deepEqual(Array.from(qa.snapshot().discoveries), [], "a fresh save must not contain pre-revealed creatures");

  qa.startLevel(1);
  qa.step(1);
  assert.deepEqual(Array.from(qa.snapshot().discoveries), ["enemy:thunder-drummer"]);
  qa.openBestiary();
  const grid = qa.__elements.get("bestiary-grid").innerHTML;
  assert.match(grid, /雷鼓兽/);
  assert.match(grid, /地面震波/);
  assert.doesNotMatch(grid, /织线蛛|时砂蛭|镜像芽|折页甲虫|星噬萤/,
    "the bestiary must omit every creature that has not actually appeared");

  const migrated = await loadGameQaHook({ save: { unlocked: 10, completed: [9] } });
  assert.ok(migrated.snapshot().discoveries.includes("enemy:thunder-drummer"),
    "old saves should infer discoveries only from stages they already completed");
  assert.equal(migrated.snapshot().discoveries.includes("enemy:thread-spinner"), false);
});

test("new late-game creatures create telegraphed jump, dash, and slow-field decisions", async () => {
  const makeArena = (type) => (bundle) => {
    const level = bundle.get(9);
    level.platforms = [{ id: "qa-ground", x: 0, y: 620, w: 1_600, h: 100 }];
    level.hazards = [];
    level.enemies = [{ id: `qa-${type}`, type, x: 520, y: 566, speed: 54, hp: 4, patrol: { minX: 480, maxX: 620 } }];
  };

  const drummer = await loadGameQaHook({ save: { unlocked: 20, completed: [] }, mutateLevels: makeArena("thunder-drummer") });
  drummer.startLevel(9);
  drummer.teleport(220, 566);
  drummer.step(82);
  assert.ok(drummer.snapshot().shockwaves.some((wave) => Math.abs(wave.vx) > 0),
    "the drummer must finish its warning with two moving ground waves");

  const spinner = await loadGameQaHook({ save: { unlocked: 20, completed: [] }, mutateLevels: makeArena("thread-spinner") });
  spinner.startLevel(9);
  spinner.teleport(300, 566);
  spinner.step(38);
  assert.ok(spinner.snapshot().enemyWebs.length >= 1, "the spinner must lay a persistent slowing web near the player");
  spinner.press("dash");
  spinner.step(1);
  spinner.release("dash");
  assert.equal(spinner.snapshot().enemyWebs.length, 0, "a dash through the web must tear it apart immediately");

  const mimic = await loadGameQaHook({ save: { unlocked: 20, completed: [] }, mutateLevels: makeArena("mirror-mimic") });
  mimic.startLevel(9);
  mimic.teleport(300, 566);
  mimic.press("dash");
  mimic.step(1);
  mimic.release("dash");
  mimic.step(31);
  const mirror = mimic.snapshot().enemies.find((enemy) => enemy.type === "mirror-mimic");
  assert.equal(mirror.state, "mimic-telegraph", "the mimic must first announce the copied dash direction");
  mimic.step(36);
  assert.equal(mimic.snapshot().enemies.find((enemy) => enemy.type === "mirror-mimic").state, "mimic-dash");
});
