(function exposeStarSproutArt() {
  const assets = {
    paper: { src: "./assets/art-v2/paper-texture.webp" },
    hero: { src: "./assets/art-v2/hero-sprites.png", cols: 4, rows: 2 },
    enemiesA: { src: "./assets/art-v2/enemy-atlas-a.png", cols: 4, rows: 2 },
    enemiesB: { src: "./assets/art-v2/enemy-atlas-b.png", cols: 4, rows: 2 },
    boss: { src: "./assets/art-v2/boss-sprites.png", cols: 4, rows: 2 },
    collectibles: { src: "./assets/art-v2/collectibles.png", cols: 4, rows: 2 },
    environmentsA: { src: "./assets/art-v2/environments-a.webp", cols: 2, rows: 2 },
    environmentsB: { src: "./assets/art-v2/environments-b.webp", cols: 2, rows: 2 },
  };

  const heroFrames = {
    idle: { sheet: "hero", col: 0, row: 0 },
    runContact: { sheet: "hero", col: 1, row: 0 },
    runPassing: { sheet: "hero", col: 2, row: 0 },
    rising: { sheet: "hero", col: 3, row: 0 },
    falling: { sheet: "hero", col: 0, row: 1 },
    dash: { sheet: "hero", col: 1, row: 1 },
    downstrike: { sheet: "hero", col: 2, row: 1 },
    hurt: { sheet: "hero", col: 3, row: 1 },
  };

  Object.assign(heroFrames, {
    run1: heroFrames.runContact,
    run2: heroFrames.runPassing,
    jump: heroFrames.rising,
    fall: heroFrames.falling,
    jumpRise: heroFrames.rising,
    jumpFall: heroFrames.falling,
    downStrike: heroFrames.downstrike,
  });

  const enemyFrames = {
    "seed-hopper": { sheet: "enemiesA", col: 0, row: 0 },
    "kite-mite": { sheet: "enemiesA", col: 1, row: 0 },
    "shard-crawler": { sheet: "enemiesA", col: 2, row: 0 },
    "echo-bat": { sheet: "enemiesA", col: 3, row: 0 },
    "tin-snail": { sheet: "enemiesA", col: 0, row: 1 },
    "pollen-drone": { sheet: "enemiesA", col: 1, row: 1 },
    "steam-tick": { sheet: "enemiesA", col: 2, row: 1 },
    "reef-crab": { sheet: "enemiesA", col: 3, row: 1 },
    "paper-jelly": { sheet: "enemiesB", col: 0, row: 0 },
    "cargo-bot": { sheet: "enemiesB", col: 1, row: 0 },
    "propeller-wasp": { sheet: "enemiesB", col: 2, row: 0 },
    "coal-golem": { sheet: "enemiesB", col: 3, row: 0 },
    "cinder-bat": { sheet: "enemiesB", col: 0, row: 1 },
    "orbit-eye": { sheet: "enemiesB", col: 1, row: 1 },
    "shadow-sprout": { sheet: "enemiesB", col: 2, row: 1 },
    "eclipse-core-drone": { sheet: "enemiesB", col: 3, row: 1 },
  };

  const bossFrames = {
    boilerNormal: { sheet: "boss", col: 0, row: 0 },
    boilerCharge: { sheet: "boss", col: 1, row: 0 },
    boilerCoreOpen: { sheet: "boss", col: 2, row: 0 },
    boilerFrozenHit: { sheet: "boss", col: 3, row: 0 },
    eclipseNormal: { sheet: "boss", col: 0, row: 1 },
    eclipseBeamCharge: { sheet: "boss", col: 1, row: 1 },
    eclipseShieldBreak: { sheet: "boss", col: 2, row: 1 },
    eclipseCoreExposed: { sheet: "boss", col: 3, row: 1 },
  };

  const collectibleFrames = {
    "memory-seed": { sheet: "collectibles", col: 0, row: 0 },
    heart: { sheet: "collectibles", col: 0, row: 0 },
    "wind-feather": { sheet: "collectibles", col: 1, row: 0 },
    "resonance-orb": { sheet: "collectibles", col: 2, row: 0 },
    "crystal-crown": { sheet: "collectibles", col: 3, row: 0 },
    "clock-spring": { sheet: "collectibles", col: 3, row: 0 },
    "coolant-charge": { sheet: "collectibles", col: 0, row: 1 },
    "guardian-core": { sheet: "collectibles", col: 3, row: 1 },
    "tide-rune": { sheet: "collectibles", col: 0, row: 1 },
    "air-pearl": { sheet: "collectibles", col: 1, row: 1 },
    "parcel-wings": { sheet: "collectibles", col: 1, row: 1 },
    "coolant-pod": { sheet: "collectibles", col: 0, row: 1 },
    "quench-bell": { sheet: "collectibles", col: 2, row: 1 },
    "forge-seal": { sheet: "collectibles", col: 2, row: 1 },
    "star-charge": { sheet: "collectibles", col: 2, row: 1 },
    "world-core-seed": { sheet: "collectibles", col: 3, row: 1 },
  };

  const environmentAtlases = {
    environmentsA: { asset: "environmentsA", cols: 2, rows: 2, levels: [1, 2, 3, 4] },
    environmentsB: { asset: "environmentsB", cols: 2, rows: 2, levels: [5, 6, 7, 8] },
  };

  const levelBackgroundFrames = {
    1: { sheet: "environmentsA", col: 0, row: 0 },
    2: { sheet: "environmentsA", col: 1, row: 0 },
    3: { sheet: "environmentsA", col: 0, row: 1 },
    4: { sheet: "environmentsA", col: 1, row: 1 },
    5: { sheet: "environmentsB", col: 0, row: 0 },
    6: { sheet: "environmentsB", col: 1, row: 0 },
    7: { sheet: "environmentsB", col: 0, row: 1 },
    8: { sheet: "environmentsB", col: 1, row: 1 },
  };

  window.StarSproutArt = Object.freeze({
    version: "2.0.0",
    assets,
    heroFrames,
    enemyFrames,
    bossFrames,
    collectibleFrames,
    environmentAtlases,
    levelBackgroundFrames,
  });
})();
