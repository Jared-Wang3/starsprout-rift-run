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

async function loadGameQaHook() {
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
    location: { search: "" },
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
  vm.runInContext(gameSource, context, {
    filename: "public/play/game.js",
    timeout: 3_000,
  });
  assert.ok(browserGlobal.__STARSPROUT_TEST__, "game.js must expose the existing QA hook");
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
