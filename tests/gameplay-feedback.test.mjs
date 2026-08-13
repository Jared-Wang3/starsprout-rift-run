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
  return {
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
}

async function loadGameQaHook(options = {}) {
  const [levelsSource, gameSource] = await Promise.all([
    readProjectFile("public/play/levels.js"),
    readProjectFile("public/play/game.js"),
  ]);
  const canvasContext = createNoopCanvasContext();
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, createFakeElement(id, canvasContext));
    return elements.get(id);
  };
  const storage = new Map();
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
    addEventListener() {},
    exitFullscreen() {},
  };
  class FakeImage {
    complete = false;
    naturalWidth = 0;
    naturalHeight = 0;
    addEventListener() {}
    set src(value) { this.currentSrc = value; }
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
    requestAnimationFrame: () => 0,
    cancelAnimationFrame() {},
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
  vm.runInContext(gameSource, context, {
    filename: "public/play/game.js",
    timeout: 3_000,
  });
  assert.ok(browserGlobal.__STARSPROUT_TEST__, "game.js must expose the existing QA hook");
  Object.defineProperties(browserGlobal.__STARSPROUT_TEST__, {
    __elements: { value: elements },
    __storage: { value: storage },
  });
  return browserGlobal.__STARSPROUT_TEST__;
}

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

test("campaign limits drive unlock-all and direct stage 12 URLs", async () => {
  const qa = await loadGameQaHook();
  qa.unlockAll();

  assert.equal(qa.snapshot().unlocked, 12, "unlockAll() must use the campaign maximum, not a literal 8");
  const grid = qa.__elements.get("level-grid").innerHTML;
  const cardIds = Array.from(grid.matchAll(/\bdata-level=["'](\d+)["']/g), (match) => Number(match[1]));
  assert.deepEqual(cardIds, Array.from({ length: 12 }, (_, index) => index + 1));

  const direct = await loadGameQaHook({ locationSearch: "?level=12&autostart=1" });
  assert.equal(direct.snapshot().level, 12, "?level=12 must open the new final stage");
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

test("stage 8 completes its act while only stage 12 completes the campaign", async () => {
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

  const qa12 = await loadGameQaHook({
    save: { unlocked: 12, completed: Array.from({ length: 11 }, (_, index) => index + 1) },
    mutateLevels: makeReachable(12, true),
  });
  qa12.startLevel(12);
  qa12.teleport(230, 500);
  qa12.step(1);
  assert.equal(qa12.snapshot().scene, "victory", "only the campaign's final stage should open the victory screen");
  assert.match(qa12.__elements.get("victory-stats").textContent, /^12\s*\/\s*12\s*关/);
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
    /(?:\$\(["']#pickup-status["']\)|getElementById\(["']pickup-status["']\))[\s\S]{0,160}?\.textContent\s*=/,
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
