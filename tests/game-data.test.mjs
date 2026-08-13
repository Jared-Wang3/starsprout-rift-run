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

test("level bundle defines a stable twelve-stage campaign schema", async () => {
  const bundle = await loadLevelBundle();
  const levels = extractLevels(bundle);

  assert.equal(typeof bundle.get, "function", "bundle must expose get(id)");
  assert.equal(typeof bundle.clone, "function", "bundle must expose clone(id)");
  assert.ok(Array.isArray(bundle.list), "bundle must expose a list array");
  assert.equal(levels.length, 12, "campaign must contain exactly twelve stages");
  assert.deepEqual(
    Array.from(levels, (level) => level.id),
    Array.from({ length: 12 }, (_, index) => index + 1),
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

test("each act contains three stages and a fourth-stage boss", async () => {
  const bundle = await loadLevelBundle();
  const levels = extractLevels(bundle);
  const bossIds = Array.from(levels).filter(isBoss).map((level) => level.id);

  assert.deepEqual(bossIds, [4, 8, 12]);
  assert.deepEqual(
    Array.from(bundle.schema?.bossLevels ?? []),
    bossIds,
    "schema.bossLevels must match the actual boss stages",
  );

  for (let act = 1; act <= 3; act += 1) {
    const actLevels = levels.filter((level) => level.act === act);
    assert.deepEqual(
      Array.from(actLevels, (level) => level.id),
      [act * 4 - 3, act * 4 - 2, act * 4 - 1, act * 4],
      `act ${act} must contain four sequential stages`,
    );
    assert.deepEqual(
      Array.from(actLevels, (level) => level.kind),
      ["stage", "stage", "stage", "boss"],
      `act ${act} must contain three regular stages followed by one boss`,
    );
  }

  for (const level of levels) {
    if (!bossIds.includes(level.id)) {
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

test("only stage 12 is the campaign finale", async () => {
  const levels = extractLevels(await loadLevelBundle());
  const finaleIds = Array.from(
    levels.filter((level) => level.finale === true),
    (level) => level.id,
  );

  assert.deepEqual(finaleIds, [12]);
  assert.equal(levels[7].id, 8);
  assert.notEqual(levels[7].finale, true, "stage 8 is an act boss, not the campaign finale");
});

test("act 3 quest pickups remain explicit while stage 11 uses reactor completion", async () => {
  const levels = extractLevels(await loadLevelBundle());
  const expectedGoals = new Map([
    [9, "lumen-spore"],
    [10, "time-shard"],
  ]);

  for (const [levelId, itemType] of expectedGoals) {
    const level = levels.find((entry) => entry.id === levelId);
    assert.ok(level, `stage ${levelId} must exist`);
    assert.equal(typeof level.goal?.requires, "object", `stage ${levelId} needs an object goal requirement`);
    assert.deepEqual(
      {
        type: level.goal.requires.type,
        itemType: level.goal.requires.itemType,
        count: level.goal.requires.count,
      },
      { type: "collect", itemType, count: 3 },
    );
    assert.match(String(level.goal.requires.label ?? ""), /\S/, `stage ${levelId} goal needs a player-facing label`);

    const questItems = level.collectibles.filter((item) => item.type === itemType);
    assert.equal(questItems.length, 3, `stage ${levelId} must place exactly three ${itemType} pickups`);
    assert.ok(questItems.every((item) => item.quest === true), `${itemType} pickups must be marked as quest items`);
  }

  const level11 = levels.find((entry) => entry.id === 11);
  assert.ok(level11, "stage 11 must exist");
  assert.deepEqual(
    {
      type: level11.goal?.requires?.type,
      count: level11.goal?.requires?.count,
    },
    { type: "reflect-reactor", count: 2 },
    "stage 11 must open its exit by powering both reactors",
  );
  const cells = level11.collectibles.filter((item) => item.type === "storm-cell");
  assert.equal(cells.length, 3, "stage 11 still needs three warm-light cells as reactor route resources");
  assert.ok(cells.every((item) => item.quest === true), "warm-light cells must remain marked as quest resources");
});

test("act 3 mechanic data is complete enough for runtime behavior", async () => {
  const levels = extractLevels(await loadLevelBundle());
  const level9 = levels.find((level) => level.id === 9);
  const level10 = levels.find((level) => level.id === 10);
  const level11 = levels.find((level) => level.id === 11);
  const level12 = levels.find((level) => level.id === 12);

  const springs = level9.platforms.filter((platform) => Number(platform.bounceY) < 0);
  assert.ok(springs.length >= 3, "stage 9 needs multiple upward spring platforms");

  assert.ok(["sun", "moon"].includes(level10.mechanics?.polarity?.initial), "stage 10 needs an initial sun/moon polarity");
  const polarities = new Set(level10.platforms.map((platform) => platform.polarity).filter(Boolean));
  assert.deepEqual([...polarities].sort(), ["moon", "sun"]);
  assert.ok(
    (level10.mechanics?.switches ?? []).some((device) => device.mode === "toggle-polarity"),
    "stage 10 needs a polarity toggle switch",
  );

  const relays = level11.mechanics?.switches ?? [];
  assert.ok(relays.length >= 3, "stage 11 needs at least three timed relays");
  assert.ok(relays.every((relay) => Number(relay.duration) > 0), "every timed relay needs a positive duration");

  assert.equal(level12.boss?.archetype, "rift-weaver");
  assert.equal(level12.boss?.maxHealth, 6);
  assert.equal(level12.boss?.hp, 6);
  assert.deepEqual(
    Array.from(level12.boss?.phases ?? [], (phase) => phase.atHealth),
    [6, 4, 2],
    "rift-weaver phases must start at 6/4/2 health",
  );
  assert.deepEqual(
    Array.from(level12.boss?.phases ?? [], (phase) => phase.requiredRelays?.length),
    [1, 2, 3],
    "rift-weaver phases must require one, two, then three timed relays",
  );
  assert.ok(
    level12.collectibles.some((item) => item.type === "rift-core-seed" && item.spawnOnBossDefeat === true),
    "stage 12 must spawn rift-core-seed only after the boss is defeated",
  );
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
