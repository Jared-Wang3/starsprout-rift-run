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

async function loadTrialBundle() {
  const source = await readFile(new URL("../public/play/trials.js", import.meta.url), "utf8");
  const browserGlobal = { console };
  browserGlobal.window = browserGlobal;
  browserGlobal.globalThis = browserGlobal;
  vm.runInNewContext(source, browserGlobal, {
    filename: "public/play/trials.js",
    timeout: 1_000,
  });
  assert.ok(browserGlobal.StarSproutTrials, "trials.js must publish window.StarSproutTrials");
  return browserGlobal.StarSproutTrials;
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

test("level bundle defines a stable twenty-eight-stage campaign schema", async () => {
  const bundle = await loadLevelBundle();
  const levels = extractLevels(bundle);

  assert.equal(typeof bundle.get, "function", "bundle must expose get(id)");
  assert.equal(typeof bundle.clone, "function", "bundle must expose clone(id)");
  assert.ok(Array.isArray(bundle.list), "bundle must expose a list array");
  assert.equal(levels.length, 28, "campaign must contain exactly twenty-eight stages");
  assert.deepEqual(
    Array.from(levels, (level) => level.id),
    Array.from({ length: 28 }, (_, index) => index + 1),
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

  assert.deepEqual(bossIds, [4, 8, 12, 16, 20, 24, 28]);
  assert.deepEqual(
    Array.from(bundle.schema?.bossLevels ?? []),
    bossIds,
    "schema.bossLevels must match the actual boss stages",
  );

  for (let act = 1; act <= 7; act += 1) {
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

test("only stage 28 is the campaign finale", async () => {
  const levels = extractLevels(await loadLevelBundle());
  const finaleIds = Array.from(
    levels.filter((level) => level.finale === true),
    (level) => level.id,
  );

  assert.deepEqual(finaleIds, [28]);
  for (const id of [4, 8, 12, 16, 20, 24]) {
    assert.notEqual(levels[id - 1].finale, true, `stage ${id} is an act boss, not the campaign finale`);
  }
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

test("act 4 uses four distinct traversal and puzzle loops", async () => {
  const levels = extractLevels(await loadLevelBundle());
  const level13 = levels.find((level) => level.id === 13);
  const level14 = levels.find((level) => level.id === 14);
  const level15 = levels.find((level) => level.id === 15);
  const level16 = levels.find((level) => level.id === 16);

  assert.equal(level13.mechanics.type, "gravity-wells");
  assert.ok(level13.mechanics.gravityZones.length >= 3, "stage 13 needs multiple low-gravity route zones");
  assert.ok(level13.platforms.filter((platform) => platform.motion?.type === "orbit").length >= 4,
    "stage 13 needs orbiting platforms rather than a normal run-right route");

  assert.equal(level14.mechanics.type, "local-time-freeze");
  assert.ok(level14.mechanics.timeAnchors.length >= 4, "stage 14 needs several local time anchors");
  assert.ok(level14.mechanics.timeAnchors.every((anchor) => anchor.radius > 0 && anchor.duration > 0));

  assert.equal(level15.mechanics.type, "delayed-echo");
  assert.ok(level15.mechanics.echoDelay >= 1, "stage 15 needs an observable delayed clone");
  assert.deepEqual([...new Set(level15.mechanics.echoPads.map((pad) => pad.group))].sort(), ["a", "b"]);
  assert.equal(level15.goal.requires.type, "echo-pairs");

  assert.equal(level16.boss.archetype, "star-whale");
  assert.deepEqual(Array.from(level16.boss.phases, (phase) => phase.requiredAnchors), [1, 2, 3]);
  assert.equal(level16.mechanics.gravityAnchors.length, 3);
  assert.ok(level16.collectibles.some((item) => item.type === "starwhale-core" && item.spawnOnBossDefeat));
});

test("act 5 changes topology, traversal physics, route direction, and boss counterplay", async () => {
  const levels = extractLevels(await loadLevelBundle());
  const level17 = levels.find((level) => level.id === 17);
  const level18 = levels.find((level) => level.id === 18);
  const level19 = levels.find((level) => level.id === 19);
  const level20 = levels.find((level) => level.id === 20);

  assert.equal(level17.mechanics.type, "world-fold");
  assert.equal(level17.goal.requires.type, "fold-pattern");
  assert.ok(level17.mechanics.foldPanels.length >= 3);
  assert.ok(level17.platforms.some((platform) => platform.foldGroup && Number(platform.foldState) === 0));
  assert.ok(level17.platforms.some((platform) => platform.foldGroup && Number(platform.foldState) === 1));

  assert.equal(level18.mechanics.type, "kite-tether");
  assert.equal(level18.goal.requires.type, "kite-chain");
  assert.ok(level18.mechanics.kiteAnchors.length >= 5);
  assert.ok(level18.mechanics.kiteAnchors.every((anchor) => anchor.duration > 0 && anchor.pull > 0));

  assert.equal(level19.mechanics.type, "page-return");
  assert.equal(level19.goal.requires.type, "return-seed");
  assert.ok(level19.collectibles.some((item) => item.type === "return-seed"));
  assert.ok(level19.platforms.some((platform) => platform.pagePhase === "outbound"));
  assert.ok(level19.platforms.some((platform) => platform.pagePhase === "return"));
  assert.ok(level19.goal.x < level19.spawn.x, "stage 19 must return to an exit behind the starting point");

  assert.equal(level20.boss.archetype, "fold-warden");
  assert.equal(level20.boss.mechanism.exposeBy, "downstrike-fold-trap");
  assert.ok(level20.mechanics.foldTraps.length >= 3);
  assert.ok(level20.collectibles.some((item) => item.type === "page-core-seed" && item.spawnOnBossDefeat));
});

test("act 6 balances weights, switches silhouette lanes, weaves trajectories, and climbs the sky dragon", async () => {
  const bundle = await loadLevelBundle();
  const levels = extractLevels(bundle);
  const level21 = levels.find((level) => level.id === 21);
  const level22 = levels.find((level) => level.id === 22);
  const level23 = levels.find((level) => level.id === 23);
  const level24 = levels.find((level) => level.id === 24);

  assert.equal(bundle.version, 7);
  assert.ok(Array.from(bundle.schema?.act6Mechanics ?? []).length >= 4,
    "schema.act6Mechanics must document all four new gameplay loops");

  assert.equal(level21.mechanics.type, "starweight-balance");
  assert.deepEqual(
    { type: level21.goal.requires.type, count: level21.goal.requires.count },
    { type: "balanced-bridges", count: 3 },
  );
  assert.ok(level21.mechanics.weightBlocks.length >= 6, "stage 21 needs enough movable weights for three puzzles");
  assert.equal(level21.mechanics.weightSlots.length, 6, "stage 21 needs left/right slots for three balances");
  assert.equal(level21.mechanics.scaleBridges.length, 3, "stage 21 must raise three independently balanced bridges");
  assert.ok(level21.mechanics.weightBlocks.every((weight) => weight.pushBy === "pulse" && weight.seatBy === "downstrike"));
  assert.ok(level21.mechanics.scaleBridges.every((bridge) => bridge.minY < bridge.maxY && bridge.leftSlot && bridge.rightSlot));

  assert.equal(level22.mechanics.type, "silhouette-lanes");
  assert.equal(level22.goal.requires, "reach");
  assert.deepEqual(Array.from(level22.mechanics.lanes, (lane) => lane.id).sort(), ["background", "foreground"]);
  assert.ok(level22.mechanics.lanes.some((lane) => lane.id === level22.mechanics.initialLane));
  assert.ok(level22.mechanics.seams.length >= 4, "stage 22 needs repeated dash seams across the route");
  assert.ok(level22.mechanics.seams.every((seam) => seam.trigger === "dash" && seam.from !== seam.to));
  const laneRecords = [...level22.platforms, ...level22.hazards, ...level22.enemies, ...level22.collectibles]
    .filter((entry) => entry.lane && entry.lane !== "both");
  assert.deepEqual([...new Set(laneRecords.map((entry) => entry.lane))].sort(), ["background", "foreground"]);

  assert.equal(level23.mechanics.type, "trajectory-weave");
  assert.deepEqual(
    { type: level23.goal.requires.type, count: level23.goal.requires.count },
    { type: "woven-routes", count: 3 },
  );
  assert.equal(level23.mechanics.looms.length, 3, "stage 23 needs one loom for each gap");
  assert.equal(level23.mechanics.weaveRules.solidifyBy, "pulse");
  assert.equal(level23.mechanics.weaveRules.maxActiveBridges, 3);
  assert.ok(level23.mechanics.weaveRules.recordSeconds > 0 && level23.mechanics.weaveRules.lifetime > 0);
  assert.ok(level23.mechanics.looms.every((loom) => loom.bridgeZone?.w > 0 && loom.bridgeZone?.h > 0));

  assert.equal(level24.mechanics.type, "sky-paper-dragon");
  assert.equal(level24.boss.archetype, "sky-paper-dragon");
  assert.equal(level24.mechanics.exposureCycles, 3);
  assert.equal(level24.mechanics.knotScales.length, 3);
  assert.ok(level24.mechanics.knotScales.every((knot) => knot.activation === "downstrike"));
  assert.deepEqual(Array.from(level24.mechanics.knotScales, (knot) => knot.order), [1, 2, 3]);
  assert.ok(level24.mechanics.bodyPlatforms.length >= 7, "the dragon body must form a traversable moving route");
  assert.deepEqual(Array.from(level24.boss.phases, (phase) => phase.requiredKnots), [3, 3, 3]);
  assert.equal(level24.boss.mechanism.exposeBy, "three-knot-scales");
  assert.equal(level24.boss.mechanism.bodyIsPlatform, true);
  assert.equal(level24.boss.mechanism.exposureCycles, 3);
  assert.ok(level24.collectibles.some((item) => item.type === "sky-dragon-core" && item.spawnOnBossDefeat));
});

test("act 7 changes avatar scale, branches rail travel, uses same-world shadows, and volleys captured shards", async () => {
  const bundle = await loadLevelBundle();
  const levels = extractLevels(bundle);
  const level25 = levels.find((level) => level.id === 25);
  const level26 = levels.find((level) => level.id === 26);
  const level27 = levels.find((level) => level.id === 27);
  const level28 = levels.find((level) => level.id === 28);

  assert.equal(bundle.version, 7);
  assert.match(String(bundle.schema?.goalRequirement ?? ""), /rail-stations/,
    "the public goal schema must document the stage 26 rail-stations requirement");
  assert.deepEqual(
    Array.from(bundle.schema?.act7Mechanics ?? []),
    [
      "player scale lenses",
      "branching comet rail carts",
      "single-world lantern exposure and occlusion",
      "captured shard dash volley",
    ],
  );

  assert.equal(level25.mechanics.type, "scale-lenses");
  assert.equal(level25.mechanics.initialForm, "giant");
  assert.deepEqual(Object.keys(level25.mechanics.forms).sort(), ["giant", "small"]);
  assert.ok(level25.mechanics.forms.small.scale < 1, "small form must be visibly smaller than the base hero");
  assert.ok(level25.mechanics.forms.giant.scale > 1, "giant form must be visibly larger than the base hero");
  assert.ok(level25.mechanics.lenses.length >= 4, "stage 25 needs repeated form changes across the route");
  assert.ok(level25.mechanics.lenses.every((lens) => lens.activation === "pulse"
    && [lens.x, lens.y, lens.w, lens.h].every(Number.isFinite)));
  assert.ok(level25.mechanics.narrowPassages.length >= 3);
  assert.ok(level25.mechanics.narrowPassages.every((passage) => passage.requiredForm === "small"));
  assert.ok(level25.mechanics.waxSeals.length >= 3);
  assert.ok(level25.mechanics.waxSeals.every((seal) => seal.requiredForm === "giant"
    && seal.activation === "downstrike" && seal.hp > 0));
  assert.ok(level25.enemies.some((enemy) => enemy.type === "lens-beetle"));

  assert.equal(level26.mechanics.type, "comet-rails");
  assert.deepEqual(
    { type: level26.goal.requires.type, count: level26.goal.requires.count },
    { type: "rail-stations", count: 3 },
  );
  assert.equal(level26.mechanics.stations.length, 3, "stage 26 needs exactly three required stops");
  const stationIds = Array.from(level26.mechanics.stations, (station) => station.id);
  assert.equal(new Set(stationIds).size, stationIds.length, "rail station ids must be stable and unique");
  assert.ok(level26.mechanics.stations.every((station) => station.required === true
    && [station.x, station.y, station.w, station.h].every(Number.isFinite)));
  assert.ok(level26.mechanics.rails.length >= 5, "the switchyard needs multiple branches and a recovery loop");
  const railIds = new Set(level26.mechanics.rails.map((rail) => rail.id));
  assert.ok(level26.mechanics.rails.every((rail) => rail.points.length >= 2
    && rail.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))));
  assert.ok(level26.mechanics.carts.length >= 3);
  assert.ok(level26.mechanics.carts.every((cart) => railIds.has(cart.rail)
    && cart.speed > 0 && cart.w > 0 && cart.h > 0));
  assert.ok(level26.mechanics.junctions.length >= 2);
  assert.ok(level26.mechanics.junctions.every((junction) => junction.options.length >= 2
    && junction.options.every((option) => railIds.has(option.rail))));
  assert.ok(level26.enemies.some((enemy) => enemy.type === "rail-wisp"));

  assert.equal(level27.mechanics.type, "lantern-shadow");
  assert.equal(level27.mechanics.collisionWorld, "single",
    "stage 27 shadows must not reuse the foreground/background lane mechanic");
  assert.deepEqual(
    {
      type: level27.goal.requires.type,
      itemType: level27.goal.requires.itemType,
      count: level27.goal.requires.count,
      submit: level27.goal.requires.submit,
    },
    { type: "collect", itemType: "shadow-key", count: 3, submit: true },
  );
  assert.ok(level27.goal.x < level27.spawn.x,
    "the shadow-key route must return to the central gate rather than finish at the far right");
  const shadowKeys = level27.collectibles.filter((item) => item.type === "shadow-key");
  assert.equal(shadowKeys.length, 3);
  assert.ok(shadowKeys.every((item) => item.quest === true));
  assert.deepEqual(
    Array.from(level27.mechanics.shadowKeys).sort(),
    Array.from(shadowKeys, (item) => item.id).sort(),
  );
  assert.ok(level27.mechanics.exposure.grace >= 1,
    "searchlight exposure needs a forgiving mobile-readable grace window");
  assert.ok(level27.mechanics.searchlights.length >= 3);
  assert.ok(level27.mechanics.searchlights.every((light) => light.warning >= 0.55
    && light.radius > 0 && light.sweepPeriod > 0));
  assert.ok(level27.mechanics.screens.length >= 3);
  assert.ok(level27.mechanics.screens.every((screen) => screen.occludes === true
    && screen.activation === "pulse"
    && [screen.x, screen.y, screen.w, screen.h].every(Number.isFinite)));
  assert.ok(level27.enemies.some((enemy) => enemy.type === "lantern-heron"));

  assert.equal(level28.mechanics.type, "scorewing-maestro");
  assert.equal(level28.boss.archetype, "scorewing-maestro");
  assert.equal(level28.finale, true);
  assert.equal(level28.boss.maxHealth, 3);
  assert.equal(level28.boss.hp, 3);
  assert.equal(level28.mechanics.shardRules.captureBy, "pulse");
  assert.equal(level28.mechanics.shardRules.releaseBy, "dash");
  assert.equal(level28.mechanics.shardRules.releaseMode, "stored-volley");
  assert.deepEqual(Array.from(level28.mechanics.shardRules.requiredByPhase), [1, 2, 3]);
  assert.deepEqual(Array.from(level28.boss.phases, (phase) => phase.captureRequired), [1, 2, 3]);
  assert.equal(level28.boss.mechanism.counterBy, "capture-store-dash-volley");
  assert.deepEqual(Array.from(level28.boss.mechanism.requiredByPhase), [1, 2, 3]);
  assert.ok(level28.collectibles.some((item) => item.type === "scorewing-core" && item.spawnOnBossDefeat));
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

test("night watch offers six distinct tides, scheduled events, and an endlessly growing cycle", async () => {
  const bundle = await loadTrialBundle();
  const patrol = bundle.trials.find((entry) => entry.id === "night-watch");
  const rush = bundle.trials.find((entry) => entry.id === "night-rush");
  const endless = bundle.trials.find((entry) => entry.id === "night-endless");

  assert.ok(patrol, "night-watch patrol must exist");
  assert.ok(rush, "night-rush trial must exist");
  assert.ok(endless, "night-endless trial must exist");
  assert.equal(patrol.duration, 360);
  assert.equal(patrol.level.kind, "trial");
  assert.doesNotMatch(patrol.level.mechanic, /九十秒/, "the main patrol must not inherit the rush timer copy");
  assert.equal(patrol.level.worldWidth, 1280, "night watch must use a fixed arena rather than a scrolling route");
  assert.deepEqual(
    Array.from(patrol.circuit.phases, (phase) => phase.task),
    ["relay", "escort", "salvage", "repair", "counter", "siege"],
  );
  assert.deepEqual(Array.from(patrol.circuit.phases, (phase) => phase.startsAt), [0, 60, 120, 180, 240, 300]);
  assert.deepEqual(
    Array.from(patrol.circuit.phases, (phase) => phase.arenaMotion),
    ["still", "lift", "drift", "split", "storm", "dawn"],
  );
  assert.ok(patrol.circuit.phases.every((phase) => phase.objectiveRequired > 0));
  const [relay, escort, salvage, repair, counter, siege] = patrol.circuit.phases;
  assert.ok(relay.actionPatterns.length >= 3);
  assert.deepEqual(
    [...new Set(relay.actionPatterns.flat().map((step) => step.action))].sort(),
    ["dash", "downstrike", "touch"],
  );
  assert.equal(escort.routeChoice.defaultRoute, "safe");
  assert.deepEqual(Array.from(escort.routes, (route) => route.id), ["safe", "risky"]);
  assert.ok(escort.routes.find((route) => route.id === "risky").scoreMultiplier > 1,
    "the short escort branch must trade safety for score");
  assert.equal(salvage.salvage.seedType, "fallen-star-seed");
  assert.ok(salvage.salvage.thiefTypes.length >= 3 && salvage.salvage.stolenRescueWindow > 0);
  assert.deepEqual(
    Object.fromEntries(Object.entries(repair.nodeActions)),
    { west: "pulse", crown: "dash", east: "downstrike" },
  );
  assert.ok(repair.nodeCharge >= 3, "repair tide needs charged repair nodes");
  assert.ok(counter.meteorInterval > 0 && counter.riftHp >= 3);
  assert.deepEqual(Array.from(counter.meteorTypes, (meteor) => meteor.id), ["normal", "splitter", "heavy"]);
  assert.deepEqual(
    Array.from(counter.meteorTypes, (meteor) => Array.from(meteor.actionSequence)),
    [["downstrike"], ["pulse", "downstrike"], ["pulse", "pulse", "downstrike"]],
  );
  assert.deepEqual(Array.from(siege.siege.objectives, (objective) => objective.task), ["relay", "salvage", "repair", "counter"]);
  assert.deepEqual(Array.from(siege.siege.elite.shieldActions), ["pulse", "dash", "downstrike"]);
  assert.equal(siege.siege.completion, "elite-defeated");

  assert.deepEqual(Array.from(patrol.upgradeAt), [50, 110, 170, 230, 290]);
  assert.deepEqual(Array.from(patrol.upgradeRounds, (round) => round.length), [3, 3, 3, 3, 3]);
  assert.deepEqual(
    Array.from(patrol.upgradeRounds, (round) => Array.from(round)),
    [
      ["seed-shell", "star-magnet", "branch-compass"],
      ["seed-vacuum", "rescue-bloom", "core-bloom"],
      ["root-burst", "resonant-tools", "time-pollen"],
      ["meteor-mirror", "split-lens", "quick-dash"],
      ["dawn-oath", "constellation-bonus", "pulse-bloom"],
    ],
    "each mutation round must appear before the tide where its effect is useful",
  );
  for (const id of patrol.upgradeRounds.flat()) {
    assert.ok(bundle.upgrades[id], `missing mutation definition ${id}`);
  }

  const eventIds = [
    "tailwind-lane",
    "red-comet-wager",
    "seed-rain",
    "ink-eclipse",
    "mirror-bloom",
    "dawn-wager",
  ];
  assert.equal(patrol.eventPlan.mode, "scheduled");
  assert.deepEqual(Array.from(patrol.eventPlan.schedule, (event) => event.at), [30, 90, 150, 210, 270, 330]);
  assert.deepEqual(Array.from(patrol.eventPlan.schedule, (event) => event.event), eventIds);
  for (const id of eventIds) {
    assert.ok(bundle.events[id], `missing night-watch event ${id}`);
    assert.ok(bundle.events[id].duration > 0);
    assert.match(String(bundle.events[id].announcement ?? ""), /\S/);
  }
  assert.ok(bundle.events["red-comet-wager"].choices.length >= 2);
  assert.ok(bundle.events["dawn-wager"].choices.length >= 2);

  assert.equal(rush.duration, 90);
  assert.deepEqual(Array.from(rush.circuit.phases, (phase) => phase.routeLength), [2, 3, 4]);
  assert.equal(endless.endless, true);
  assert.equal(endless.duration, 0);
  assert.equal(endless.cycleDuration, 60);
  assert.deepEqual(Array.from(endless.circuit.phases, (phase) => phase.task),
    ["relay", "escort", "salvage", "repair", "counter", "siege"]);
  assert.equal(endless.eventPlan.mode, "seeded-random");
  assert.deepEqual(Array.from(endless.eventPlan.pool, (entry) => entry.event), eventIds);
  assert.ok(Array.isArray(endless.eventPlan.interval) && endless.eventPlan.interval[0] > 0);
  assert.equal(endless.upgradeCadence.firstAt, 50);
  assert.equal(endless.upgradeCadence.interval, 60);
  assert.equal(endless.upgradeCadence.repeatRounds, true);
  assert.equal(endless.upgradeCadence.duplicatePolicy, "rank");
  assert.ok(endless.upgradeCadence.rankReward.coreMax > 0);
});

test("six mechanically distinct creatures enter the campaign gradually after stage eight", async () => {
  const levels = extractLevels(await loadLevelBundle());
  const newcomers = [
    "thunder-drummer",
    "thread-spinner",
    "chrono-leech",
    "mirror-mimic",
    "fold-beetle",
    "star-siphon",
  ];
  const earlyTypes = new Set(levels.filter((level) => level.id <= 8).flatMap((level) => level.enemies.map((enemy) => enemy.type)));
  const lateTypes = new Set(levels.filter((level) => level.id >= 9).flatMap((level) => level.enemies.map((enemy) => enemy.type)));

  for (const type of newcomers) {
    assert.equal(earlyTypes.has(type), false, `${type} must not appear before the late-game onboarding`);
    assert.equal(lateTypes.has(type), true, `${type} must appear in stages 9-28`);
  }
  assert.ok(levels.find((level) => level.id === 9).enemies.some((enemy) => enemy.type === "thunder-drummer"));
  assert.ok(levels.find((level) => level.id === 10).enemies.some((enemy) => enemy.type === "thread-spinner"));
});
