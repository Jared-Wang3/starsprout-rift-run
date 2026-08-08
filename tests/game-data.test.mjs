import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadLevelBundle() {
  const source = await readFile(
    new URL("../public/play/levels.js", import.meta.url),
    "utf8",
  );
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

  assert.ok(
    browserGlobal.StarSproutLevels,
    "levels.js must publish window.StarSproutLevels",
  );
  return browserGlobal.StarSproutLevels;
}

function extractLevels(bundle) {
  if (Array.isArray(bundle)) return bundle;
  if (Array.isArray(bundle.levels)) return bundle.levels;
  if (Array.isArray(bundle.list)) return bundle.list;
  if (typeof bundle.createLevels === "function") return bundle.createLevels();
  if (typeof bundle.getLevels === "function") return bundle.getLevels();
  assert.fail(
    "StarSproutLevels must be an array or expose levels/createLevels()/getLevels()",
  );
}

function levelWorld(level) {
  const theme = level.world ?? level.theme ?? level.biome;
  if (typeof theme === "string") return theme;
  return theme?.id ?? theme?.key ?? theme?.name;
}

function isBoss(level) {
  return Boolean(level.boss) || level.type === "boss" || level.kind === "boss";
}

test("level bundle defines a stable eight-stage campaign schema", async () => {
  const bundle = await loadLevelBundle();
  const levels = extractLevels(bundle);

  assert.equal(typeof bundle.get, "function", "bundle must expose get(id)");
  assert.equal(typeof bundle.clone, "function", "bundle must expose clone(id)");
  assert.ok(Array.isArray(bundle.list), "bundle must expose a list array");
  assert.equal(levels.length, 8, "campaign must contain exactly eight stages");
  assert.deepEqual(
    Array.from(levels, (level) => level.id),
    [1, 2, 3, 4, 5, 6, 7, 8],
    "stage ids must be sequential and one-based",
  );

  levels.forEach((level, index) => {
    const label = `stage ${index + 1}`;
    assert.equal(typeof level, "object", `${label} must be an object`);
    assert.match(String(level.key ?? ""), /\S/, `${label} needs a stable key`);
    assert.ok(["stage", "boss"].includes(level.kind), `${label} has an invalid kind`);
    assert.ok(Number.isFinite(level.worldWidth) && level.worldWidth > 1280, `${label} needs a scrollable world`);
    assert.ok(Number.isFinite(level.worldHeight) && level.worldHeight > 0, `${label} needs a world height`);
    assert.ok(Number.isFinite(level.spawn?.x) && Number.isFinite(level.spawn?.y), `${label} needs a spawn point`);
    assert.ok(Number.isFinite(level.goal?.x) && Number.isFinite(level.goal?.y), `${label} needs a goal point`);
    assert.match(String(levelWorld(level) ?? ""), /\S/, `${label} needs a world/theme/biome id`);
    for (const field of [
      "platforms",
      "hazards",
      "enemies",
      "collectibles",
      "checkpoints",
    ]) {
      assert.ok(Array.isArray(level[field]), `${label}.${field} must be an array`);
    }
    assert.equal(typeof level.mechanics, "object", `${label}.mechanics must be a data object`);
  });

  assert.equal(bundle.get(4), levels[3], "get(id) should return canonical level data");
  assert.equal(bundle.get(99), null, "get(id) should return null for an unknown stage");
});

test("boss cadence is every fourth stage and only stages 4 and 8 are bosses", async () => {
  const levels = extractLevels(await loadLevelBundle());
  const bossIds = Array.from(levels).filter(isBoss).map((level) => level.id);

  assert.deepEqual(bossIds, [4, 8]);

  for (const level of levels) {
    if (level.id !== 4 && level.id !== 8) {
      assert.equal(level.boss, null, `stage ${level.id} must not contain boss data`);
      continue;
    }

    assert.equal(typeof level.boss, "object", `stage ${level.id} needs boss data`);
    assert.match(String(level.boss.name ?? ""), /\S/, `stage ${level.id} boss needs a name`);
    assert.ok(level.boss.maxHealth > 0, `stage ${level.id} boss needs health`);
    assert.ok(Array.isArray(level.boss.phases) && level.boss.phases.length > 0, `stage ${level.id} boss needs phases`);
    assert.match(String(level.boss.mechanism ?? ""), /\S/, `stage ${level.id} boss needs a counter mechanic`);
  }
});

test("all stages have distinct worlds instead of palette-swapped repetition", async () => {
  const levels = extractLevels(await loadLevelBundle());
  const worlds = Array.from(levels, levelWorld);

  assert.equal(new Set(worlds).size, levels.length, `world ids must be unique: ${worlds.join(", ")}`);
});

test("level factory returns isolated mutable data for restart and replay", async () => {
  const bundle = await loadLevelBundle();
  assert.equal(typeof bundle.clone, "function", "bundle must expose clone(id)");

  const first = bundle.clone(1);
  const second = bundle.clone(1);
  assert.notEqual(first, second, "clone(id) must return a fresh level object");
  assert.notEqual(first.spawn, second.spawn, "clone(id) must deep-clone nested data");
  assert.notEqual(first.platforms, second.platforms, "clone(id) must deep-clone arrays");

  const originalX = second.spawn.x;
  first.spawn.x += 999;
  assert.equal(second.spawn.x, originalX);
});
