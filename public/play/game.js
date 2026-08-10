(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const WIDE_VIEW_W = canvas.width;
  const PORTRAIT_VIEW_W = 960;
  let VIEW_W = WIDE_VIEW_W;
  const VIEW_H = canvas.height;
  const STEP = 1 / 60;
  const SAVE_KEY = "starsprout-save-v2";
  const TOUCH_MIN_HOLD_MS = 85;
  const api = window.StarSproutLevels;

  const DEFAULT_ART_ASSETS = {
    paper: { src: "./assets/art-v2/paper-texture.webp" },
    hero: { src: "./assets/art-v2/hero-sprites.png", cols: 4, rows: 2 },
    enemiesA: { src: "./assets/art-v2/enemy-atlas-a.png", cols: 4, rows: 2 },
    enemiesB: { src: "./assets/art-v2/enemy-atlas-b.png", cols: 4, rows: 2 },
    boss: { src: "./assets/art-v2/boss-sprites.png", cols: 4, rows: 2 },
    collectibles: { src: "./assets/art-v2/collectibles.png", cols: 4, rows: 2 },
    environmentsA: { src: "./assets/art-v2/environments-a.webp", cols: 2, rows: 2, gutter: 0 },
    environmentsB: { src: "./assets/art-v2/environments-b.webp", cols: 2, rows: 2, gutter: 0 },
  };
  const DEFAULT_HERO_FRAMES = {
    idle: { sheet: "hero", col: 0, row: 0 },
    runContact: { sheet: "hero", col: 1, row: 0 },
    runPassing: { sheet: "hero", col: 2, row: 0 },
    jump: { sheet: "hero", col: 3, row: 0 },
    fall: { sheet: "hero", col: 0, row: 1 },
    dash: { sheet: "hero", col: 1, row: 1 },
    downstrike: { sheet: "hero", col: 2, row: 1 },
    hurt: { sheet: "hero", col: 3, row: 1 },
  };
  const DEFAULT_ENEMY_FRAMES = {
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
  };
  const DEFAULT_BOSS_FRAMES = {
    boilerNormal: { sheet: "boss", col: 0, row: 0 },
    boilerCharge: { sheet: "boss", col: 1, row: 0 },
    boilerCoreOpen: { sheet: "boss", col: 2, row: 0 },
    boilerFrozenHit: { sheet: "boss", col: 3, row: 0 },
    eclipseNormal: { sheet: "boss", col: 0, row: 1 },
    eclipseBeamCharge: { sheet: "boss", col: 1, row: 1 },
    eclipseShieldBreak: { sheet: "boss", col: 2, row: 1 },
    eclipseCoreExposed: { sheet: "boss", col: 3, row: 1 },
  };
  const DEFAULT_COLLECTIBLE_FRAMES = {
    "memory-seed": { sheet: "collectibles", col: 0, row: 0 },
    heart: { sheet: "collectibles", col: 0, row: 0 },
    "wind-feather": { sheet: "collectibles", col: 1, row: 0 },
    "resonance-orb": { sheet: "collectibles", col: 2, row: 0 },
    "crystal-crown": { sheet: "collectibles", col: 3, row: 0 },
    "clock-spring": { sheet: "collectibles", col: 3, row: 0 },
    "coolant-charge": { sheet: "collectibles", col: 0, row: 1 },
    "coolant-pod": { sheet: "collectibles", col: 0, row: 1 },
    "tide-rune": { sheet: "collectibles", col: 0, row: 1 },
    "air-pearl": { sheet: "collectibles", col: 1, row: 1 },
    "parcel-wings": { sheet: "collectibles", col: 1, row: 1 },
    "star-charge": { sheet: "collectibles", col: 2, row: 1 },
    "quench-bell": { sheet: "collectibles", col: 2, row: 1 },
    "forge-seal": { sheet: "collectibles", col: 2, row: 1 },
    "guardian-core": { sheet: "collectibles", col: 3, row: 1 },
    "world-core-seed": { sheet: "collectibles", col: 3, row: 1 },
  };
  const COLLECTIBLE_EFFECTS = Object.freeze({
    "memory-seed": { label: "记忆种子", badge: "种", mode: "memory", description: "永久计入探索收藏" },
    heart: { label: "星芽之心", badge: "心", mode: "health", description: "恢复两格生命" },
    "wind-feather": { label: "风羽", badge: "风", mode: "timed", duration: 8, description: "冲刺快速充能" },
    "resonance-orb": { label: "共鸣球", badge: "鸣", mode: "timed", duration: 10, description: "强化脉冲并显现隐藏纸桥" },
    "crystal-crown": { label: "回声晶冠", badge: "冠", mode: "quest", description: "解除本关出口封印" },
    "clock-spring": { label: "慢时发条", badge: "时", mode: "timed", duration: 9, description: "敌人与敌方弹幕减速" },
    "coolant-charge": { label: "冷却充能", badge: "冷", mode: "charges", charges: 3, description: "延长三次冷却阀持续时间" },
    "guardian-core": { label: "守门核心", badge: "核", mode: "boss-core", description: "带走核心并完成守门挑战" },
    "tide-rune": { label: "潮汐符文", badge: "潮", mode: "rune", description: "集齐三枚开启潮门" },
    "air-pearl": { label: "空气珍珠", badge: "珠", mode: "timed", duration: 12, description: "水中移动与上浮能力增强" },
    "parcel-wings": { label: "货运羽翼", badge: "翼", mode: "timed", duration: 9, description: "空中长按跳跃可以滑翔" },
    "coolant-pod": { label: "冷凝种子", badge: "凝", mode: "coolant", description: "熔潮退却并生成临时落脚点" },
    "quench-bell": { label: "淬火钟", badge: "钟", mode: "quench", description: "让熔潮大幅退却" },
    "forge-seal": { label: "锻炉印记", badge: "印", mode: "quest", description: "开启锻炉出口" },
    "star-charge": { label: "星能充能", badge: "星", mode: "charges", charges: 2, description: "获得两发强化脉冲" },
    "world-core-seed": { label: "世界核心种", badge: "界", mode: "boss-core", description: "带走核心并完成最终挑战" },
  });
  const PROCEDURAL_COLLECTIBLE_TYPES = new Set([
    "memory-seed", "clock-spring", "tide-rune", "parcel-wings", "quench-bell", "forge-seal",
  ]);
  const ART_ALIASES = {
    paper: ["paper", "paperTexture", "paper-texture"],
    hero: ["hero", "heroSprites", "hero-sprites"],
    enemiesA: ["enemiesA", "enemyAtlasA", "enemy-atlas-a"],
    enemiesB: ["enemiesB", "enemyAtlasB", "enemy-atlas-b"],
    boss: ["boss", "bossSprites", "boss-sprites"],
    collectibles: ["collectibles", "collectibleSprites", "collectible-sprites"],
    environmentsA: ["environmentsA", "environmentAtlasA", "environment-atlas-a"],
    environmentsB: ["environmentsB", "environmentAtlasB", "environment-atlas-b"],
  };
  const artImageCache = new Map();
  let paperPattern = null;
  let paperPatternSource = null;
  let environmentBackdropCache = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const mod = (value, length) => ((value % length) + length) % length;
  const deepClone = (value) => JSON.parse(JSON.stringify(value));
  const cssColor = (value, fallback) => typeof value === "string" && value ? value : fallback;
  const pad = (value) => String(value).padStart(2, "0");

  function artManifest() {
    return window.StarSproutArt || {};
  }

  function artAssetConfig(name) {
    const assets = artManifest().assets || artManifest().images || {};
    const aliases = ART_ALIASES[name] || [name];
    let configured;
    for (const alias of aliases) {
      if (assets[alias]) {
        configured = assets[alias];
        break;
      }
    }
    const fallback = DEFAULT_ART_ASSETS[name] || {};
    if (typeof configured === "string") return { ...fallback, src: configured };
    return { ...fallback, ...(configured || {}) };
  }

  function artImage(name) {
    const config = artAssetConfig(name);
    if (!config.src) return null;
    const key = `${name}:${config.src}`;
    let cached = artImageCache.get(key);
    if (!cached) {
      const image = new Image();
      cached = { image, config, ready: false, failed: false };
      image.decoding = "async";
      image.addEventListener("load", () => { cached.ready = true; }, { once: true });
      image.addEventListener("error", () => { cached.failed = true; }, { once: true });
      image.src = config.src;
      artImageCache.set(key, cached);
    }
    cached.config = config;
    if (!cached.ready && cached.image.complete && cached.image.naturalWidth > 0) cached.ready = true;
    return cached.ready && !cached.failed ? cached : null;
  }

  function frameSpec(group, name, fallback) {
    const configured = artManifest()[group]?.[name];
    const source = configured || fallback;
    if (Array.isArray(source)) return { sheet: source[0], col: Number(source[1]) || 0, row: Number(source[2]) || 0 };
    return source ? { ...source } : null;
  }

  function drawAtlasFrame(frame, x, y, width, height, options = {}) {
    if (!frame?.sheet) return false;
    const record = artImage(frame.sheet);
    if (!record) return false;
    const cols = Number(frame.cols || record.config.cols) || 4;
    const rows = Number(frame.rows || record.config.rows) || 2;
    const cellW = record.image.naturalWidth / cols;
    const cellH = record.image.naturalHeight / rows;
    const gutter = Math.max(0, Number(frame.gutter ?? record.config.gutter) || 0);
    const col = clamp(Number(frame.col) || 0, 0, cols - 1);
    const row = clamp(Number(frame.row) || 0, 0, rows - 1);
    const anchorX = Number(options.anchorX ?? frame.anchorX ?? 0.5);
    const anchorY = Number(options.anchorY ?? frame.anchorY ?? 0.9);
    const flipX = options.flipX ? -1 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX, 1);
    ctx.drawImage(
      record.image,
      col * cellW + gutter,
      row * cellH + gutter,
      Math.max(1, cellW - gutter * 2),
      Math.max(1, cellH - gutter * 2),
      -width * anchorX,
      -height * anchorY,
      width,
      height,
    );
    ctx.restore();
    return true;
  }

  function inCamera(x, width = 0, margin = 140) {
    return x + width >= cameraX - margin && x <= cameraX + VIEW_W + margin;
  }

  function stableWave(seed, amount = 1) {
    return (Math.sin(seed * 12.9898) * 0.5 + Math.cos(seed * 4.1414) * 0.5) * amount;
  }

  const DEFAULT_THEMES = [
    { skyTop: "#79cbd0", skyBottom: "#e7d7a6", far: "#5a8f79", mid: "#34634e", ground: "#22463d", edge: "#f6c453", accent: "#f05d4e", paper: "#f4edda", ink: "#071c27" },
    { skyTop: "#142940", skyBottom: "#315a70", far: "#273b61", mid: "#254d56", ground: "#122d35", edge: "#71c7d4", accent: "#d78cff", paper: "#edf7e8", ink: "#07141f" },
    { skyTop: "#b7d8bd", skyBottom: "#edd9a8", far: "#719277", mid: "#476a57", ground: "#29483d", edge: "#f6c453", accent: "#e06f4f", paper: "#f5efdc", ink: "#102720" },
    { skyTop: "#3a2833", skyBottom: "#a4473f", far: "#62363b", mid: "#473039", ground: "#241f29", edge: "#f6c453", accent: "#f05d4e", paper: "#f4edda", ink: "#0e1118" },
    { skyTop: "#19526b", skyBottom: "#efb96d", far: "#3a7780", mid: "#245d68", ground: "#163e49", edge: "#7ee0d1", accent: "#f6c453", paper: "#f5f0dd", ink: "#071c27" },
    { skyTop: "#79bbd8", skyBottom: "#f2d4a4", far: "#6386a0", mid: "#435f79", ground: "#293e54", edge: "#f6c453", accent: "#f05d4e", paper: "#f5efdd", ink: "#0c1b2a" },
    { skyTop: "#2c1722", skyBottom: "#b24634", far: "#5b2d35", mid: "#3f252c", ground: "#221b22", edge: "#ff9d43", accent: "#5fe0c2", paper: "#f4e4c8", ink: "#120e13" },
    { skyTop: "#090e22", skyBottom: "#3f284f", far: "#242747", mid: "#171a36", ground: "#0d1228", edge: "#a7e7e1", accent: "#f05d4e", paper: "#f4edda", ink: "#050811" },
  ];

  const input = {
    held: { left: false, right: false, jump: false, down: false, dash: false, shoot: false },
    pressed: new Set(),
    sources: Object.fromEntries(["left", "right", "jump", "down", "dash", "shoot"].map((action) => [action, new Set()])),
    tapBuffer: { left: 0, right: 0 },
    pointers: new Map(),
    lastDirection: null,
  };

  let save = loadSave();
  let scene = "menu";
  let currentLevel = null;
  let runtime = null;
  let player = null;
  let cameraX = 0;
  let autoCameraX = 0;
  let elapsed = 0;
  let menuTime = 0;
  let accumulator = 0;
  let previousTime = performance.now();
  let shake = 0;
  let flash = 0;
  let toastTimer = 0;
  let muted = save.muted || false;
  let audioContext = null;
  let captureReady = false;

  function usesPortraitViewport() {
    return window.matchMedia("(orientation: portrait) and (max-width: 760px)").matches;
  }

  function syncCanvasViewport() {
    const nextWidth = usesPortraitViewport() ? PORTRAIT_VIEW_W : WIDE_VIEW_W;
    if (nextWidth === VIEW_W) return;

    const previousWidth = VIEW_W;
    const previousFocus = player
      ? player.x + player.w / 2
      : cameraX + previousWidth / 2;

    VIEW_W = nextWidth;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (currentLevel) {
      const maxCamera = Math.max(0, currentLevel.worldWidth - VIEW_W);
      cameraX = clamp(previousFocus - VIEW_W * 0.34, 0, maxCamera);
      autoCameraX = clamp(autoCameraX, 0, maxCamera);
    }
  }

  function loadSave() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      const collectedSeeds = Array.isArray(parsed.collectedSeeds)
        ? [...new Set(parsed.collectedSeeds.filter((key) => typeof key === "string"))]
        : [];
      return {
        unlocked: clamp(Number(parsed.unlocked) || 1, 1, 8),
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
        // Older v2 saves counted repeat pickups. Preserve that historical total
        // while collectedSeeds prevents any new duplicate farming.
        seeds: Math.max(0, Number(parsed.seeds) || 0, collectedSeeds.length),
        collectedSeeds,
        deaths: Number(parsed.deaths) || 0,
        muted: Boolean(parsed.muted),
      };
    } catch {
      return { unlocked: 1, completed: [], seeds: 0, collectedSeeds: [], deaths: 0, muted: false };
    }
  }

  function persist() {
    save.muted = muted;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }

  function listLevels() {
    if (!api) return [];
    if (Array.isArray(api.levels)) return api.levels;
    if (Array.isArray(api.list)) return api.list;
    if (typeof api.list === "function") return api.list();
    return [];
  }

  function rawLevel(id) {
    if (!api) throw new Error("关卡数据尚未载入");
    if (typeof api.clone === "function") return api.clone(id);
    if (typeof api.get === "function") return deepClone(api.get(id));
    const level = listLevels().find((entry) => Number(entry.id) === Number(id));
    return deepClone(level);
  }

  function normalizeTheme(theme, id) {
    const fallback = DEFAULT_THEMES[id - 1] || DEFAULT_THEMES[0];
    const source = theme?.palette || theme || {};
    return {
      id: theme?.id || `theme-${id}`,
      material: theme?.material || "layered-paper",
      ambient: theme?.ambient ? deepClone(theme.ambient) : null,
      landmark: theme?.landmark ? deepClone(theme.landmark) : null,
      skyTop: cssColor(source.skyTop || source.sky?.[0] || source.background, fallback.skyTop),
      skyBottom: cssColor(source.skyBottom || source.sky?.[1], fallback.skyBottom),
      far: cssColor(source.far || source.back || source.backgroundFar, fallback.far),
      mid: cssColor(source.mid || source.middle || source.backgroundMid, fallback.mid),
      ground: cssColor(source.ground || source.platform || source.groundDark, fallback.ground),
      edge: cssColor(source.edge || source.highlight || source.accent2 || source.accentSecondary, fallback.edge),
      accent: cssColor(source.accent || source.primary, fallback.accent),
      accent2: cssColor(source.accent2 || source.accentSecondary, fallback.edge),
      danger: cssColor(source.danger, fallback.accent),
      fog: cssColor(source.fog, fallback.far),
      paper: cssColor(source.paper || source.light, fallback.paper),
      ink: cssColor(source.ink || source.dark, fallback.ink),
    };
  }

  function normalizeLevel(raw) {
    const id = Number(raw.id) || 1;
    const spawn = Array.isArray(raw.spawn) ? { x: raw.spawn[0], y: raw.spawn[1] } : (raw.spawn || { x: 96, y: 480 });
    const goal = raw.goal || { x: (raw.worldWidth || raw.width || 3500) - 180, y: 470, w: 70, h: 130 };
    const mechanics = raw.mechanics || {};
    return {
      ...raw,
      id,
      name: raw.name || `未知裂界 ${id}`,
      subtitle: raw.briefing?.subtitle || raw.subtitle || raw.tagline || "让星芽穿过新的生态裂界",
      mechanic: raw.briefing?.mechanic || raw.mechanic || raw.hint || mechanics.hint || "观察环境，再决定路线",
      theme: normalizeTheme(raw.theme, id),
      worldWidth: Math.max(VIEW_W, Number(raw.worldWidth || raw.width) || (id === 4 || id === 8 ? 1600 : 3900)),
      worldHeight: Number(raw.worldHeight || raw.height) || VIEW_H,
      spawn: { x: Number(spawn.x) || 96, y: Number(spawn.y) || 480 },
      goal: { ...goal, x: Number(goal.x) || 3400, y: Number(goal.y) || 470, w: Number(goal.w) || 72, h: Number(goal.h) || 130 },
      platforms: Array.isArray(raw.platforms) ? raw.platforms : [],
      hazards: Array.isArray(raw.hazards) ? raw.hazards : [],
      enemies: Array.isArray(raw.enemies) ? raw.enemies : [],
      collectibles: Array.isArray(raw.collectibles) ? raw.collectibles : [],
      checkpoints: Array.isArray(raw.checkpoints) ? raw.checkpoints : [],
      mechanics,
      isBoss: Boolean(raw.isBoss || raw.kind === "boss" || raw.boss || id === 4 || id === 8),
    };
  }

  function defaultDevices(level) {
    const id = level.id;
    if (id === 1) return {
      windZones: [
        { x: 620, y: 260, w: 620, h: 360, forceX: 410, forceY: -35 },
        { x: 1800, y: 150, w: 520, h: 470, forceX: -260, forceY: -120 },
        { x: 2860, y: 190, w: 560, h: 430, forceX: 360, forceY: -55 },
      ],
    };
    if (id === 2) return {
      crystals: [{ x: 610, y: 460 }, { x: 1570, y: 330 }, { x: 2680, y: 410 }],
      darkness: true,
    };
    if (id === 3) return {
      switches: [{ x: 760, y: 520 }, { x: 2150, y: 350 }],
      gates: [{ x: 1110, y: 350, w: 42, h: 260, switchIndex: 0 }, { x: 2640, y: 330, w: 42, h: 280, switchIndex: 1 }],
    };
    if (id === 4) return {
      valves: [{ x: 260, y: 490 }, { x: 1260, y: 490 }],
      vent: { x: 690, y: 555, w: 220, h: 55 },
    };
    if (id === 5) return { water: { baseY: 515, amplitude: 62, speed: 0.72 } };
    if (id === 6) return { autoScroll: { speed: 105 }, fans: [{ x: 1420, y: 370 }, { x: 2860, y: 320 }] };
    if (id === 7) return { lava: { startY: 705, minY: 500, riseSpeed: 5.8 }, coolants: [{ x: 750, y: 390 }, { x: 1780, y: 300 }, { x: 2920, y: 370 }] };
    if (id === 8) return { mirrors: [{ x: 285, y: 410 }, { x: 1255, y: 410 }], altar: { x: 700, y: 565, w: 200, h: 45 } };
    return {};
  }

  function mergedDevices(level) {
    const fallback = defaultDevices(level);
    const mechanics = level.mechanics || {};
    const merged = { ...fallback, ...mechanics };
    if (Array.isArray(mechanics.coolantValves)) merged.valves = mechanics.coolantValves;
    if (mechanics.frostVent) merged.vent = mechanics.frostVent;
    if (mechanics.scroll) merged.autoScroll = { speed: mechanics.scroll.baseSpeed || mechanics.scroll.speed || 105, ...mechanics.scroll };
    if (Array.isArray(mechanics.windFans)) merged.fans = mechanics.windFans;
    if (Array.isArray(mechanics.coolantPods)) merged.coolants = mechanics.coolantPods;
    if (mechanics.water && !mechanics.water.baseY) {
      const low = Number(mechanics.water.lowY) || 675;
      const high = Number(mechanics.water.highY) || 445;
      merged.water = {
        ...mechanics.water,
        baseY: (low + high) / 2,
        amplitude: Math.abs(low - high) / 2,
        speed: (Math.PI * 2) / (Number(mechanics.water.period) || 10),
      };
    }
    for (const key of ["windZones", "crystals", "switches", "gates", "valves", "fans", "coolants", "mirrors"]) {
      if (!Array.isArray(merged[key]) && Array.isArray(level[key])) merged[key] = level[key];
    }
    return merged;
  }

  function makeRuntime(level) {
    const devices = mergedDevices(level);
    const platforms = level.platforms.map((platform, index) => {
      const p = {
        id: platform.id || `p-${index}`,
        x: Number(platform.x) || 0,
        y: Number(platform.y) || 0,
        w: Number(platform.w || platform.width) || 160,
        h: Number(platform.h || platform.height) || 28,
        type: platform.type || platform.kind || "ground",
        material: platform.material || level.theme.material || "layered-paper",
        motion: platform.motion || null,
        conveyor: Number(platform.conveyor?.speed ?? platform.conveyor ?? platform.speedX) || 0,
        fragile: platform.type === "fragile" || platform.kind === "fragile" || Boolean(platform.fragile),
        hidden: platform.type === "hidden" || platform.kind === "hidden" || platform.kind === "resonant" || platform.kind === "temporary" || Boolean(platform.hidden) || Boolean(platform.enabledBy),
        enabledBy: platform.enabledBy || null,
        phase: Number(platform.phase) || index * 0.7,
        originX: Number(platform.x) || 0,
        originY: Number(platform.y) || 0,
        breakTimer: 0,
        brokenTimer: 0,
        dx: 0,
        dy: 0,
      };
      return p;
    });

    if (!platforms.length) {
      for (let x = 0; x < level.worldWidth; x += 480) {
        platforms.push({ id: `fallback-${x}`, x, y: 610, w: 360, h: 110, type: "ground", material: level.theme.material, originX: x, originY: 610, dx: 0, dy: 0 });
      }
    }

    const hazards = level.hazards.map((hazard, index) => ({
      ...hazard,
      id: hazard.id || `h-${index}`,
      x: Number(hazard.x) || 0,
      y: Number(hazard.y) || 0,
      w: Number(hazard.w || hazard.width) || 80,
      h: Number(hazard.h || hazard.height) || 30,
      type: hazard.type || hazard.kind || "spikes",
    }));

    const enemies = level.enemies.map((enemy, index) => ({
      ...enemy,
      id: enemy.id || `e-${index}`,
      x: Number(enemy.x) || 0,
      y: Number(enemy.y) || 500,
      w: Number(enemy.w || enemy.width) || 46,
      h: Number(enemy.h || enemy.height) || 42,
      type: enemy.type || (index % 3 === 1 ? "flyer" : "walker"),
      vx: Number(enemy.vx || enemy.speed) * (index % 2 ? -1 : 1) || (index % 2 ? -70 : 70),
      vy: 0,
      originX: enemy.patrol ? (Number(enemy.patrol.minX) + Number(enemy.patrol.maxX)) / 2 : (Number(enemy.x) || 0),
      range: enemy.patrol ? Math.max(30, (Number(enemy.patrol.maxX) - Number(enemy.patrol.minX)) / 2) : (Number(enemy.range) || 180),
      hp: Number(enemy.hp) || 1,
      alive: true,
      t: index * 0.63,
      cooldown: 0.5 + index * 0.22,
    }));

    const collectibles = level.collectibles.map((item, index) => {
      const id = item.id || `c-${index}`;
      const type = item.type || "seed";
      const persistentKey = `${level.id}:${id}`;
      const alreadyCollected = (type === "memory-seed" || type === "seed") && save.collectedSeeds.includes(persistentKey);
      return {
        ...item,
        id,
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        w: 26,
        h: 26,
        type,
        value: Number(item.value) || 1,
        collected: alreadyCollected,
        persistentKey,
        t: index * 0.9,
      };
    });

    const checkpoints = level.checkpoints.map((point, index) => ({
      id: point.id || `cp-${index}`,
      x: Number(point.x) || 0,
      y: Number(point.y) || 500,
      respawn: point.respawn || null,
      active: false,
    }));

    const rt = {
      time: 0,
      platforms,
      hazards,
      enemies,
      collectibles,
      checkpoints,
      particles: [],
      projectiles: [],
      enemyShots: [],
      shockwaves: [],
      devices,
      enabled: {},
      inventory: new Set(),
      activeEffects: {},
      charges: {},
      seedTotal: collectibles.filter((item) => item.type === "memory-seed" || item.type === "seed").length,
      goalToastCooldown: 0,
      crystals: (devices.crystals || []).map((d, i) => ({ ...d, w: d.w || 44, h: d.h || 72, active: false, index: i })),
      switches: (devices.switches || []).map((d, i) => ({ ...d, w: d.w || 54, h: d.h || 54, active: false, index: i })),
      gates: (devices.gates || []).map((d, i) => ({ ...d, w: d.w || 42, h: d.h || 250, index: i })),
      valves: (devices.valves || []).map((d, i) => ({ ...d, w: d.w || 54, h: d.h || 76, active: false, timer: 0, index: i })),
      mirrors: (devices.mirrors || []).map((d, i) => ({ ...d, w: d.w || 66, h: d.h || 96, active: false, timer: 0, index: i })),
      coolants: (devices.coolants || []).map((d, i) => ({ ...d, w: d.w || 40, h: d.h || 40, active: true, respawn: 0, index: i })),
      waterY: devices.water?.baseY || 900,
      lavaY: devices.lava?.startY || 900,
      hiddenRevealed: false,
      boss: null,
      goalOpen: !level.isBoss,
      completed: false,
    };

    if (level.isBoss) {
      const bossData = level.boss || {};
      const arena = bossData.arena || { x: 80, y: 180, w: level.worldWidth - 160, h: 430 };
      const body = bossData.body || {};
      rt.boss = {
        name: bossData.name || (level.id === 4 ? "沸压甲虫 · 赫克斯" : "日蚀守门者 · 诺克斯"),
        x: Number(bossData.x || bossData.spawn?.x || arena.x + arena.w * 0.7),
        y: Number(bossData.y) || (level.id === 4 ? 458 : Number(bossData.spawn?.y) || 300),
        w: Number(bossData.w || body.w) || (level.id === 4 ? 142 : 128),
        h: Number(bossData.h || body.h) || (level.id === 4 ? 118 : 168),
        vx: -80,
        vy: 0,
        hp: Number(bossData.hp) || 3,
        maxHp: Number(bossData.hp) || 3,
        state: "watching",
        timer: 1.4,
        vulnerable: 0,
        hitFlash: 0,
        arena,
        phase: 1,
        beamTimer: 0,
        active: false,
      };
    }
    return rt;
  }

  function makePlayer(level) {
    return {
      x: level.spawn.x,
      y: level.spawn.y,
      w: 38,
      h: 54,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      ground: null,
      coyote: 0,
      jumpBuffer: 0,
      dashCooldown: 0,
      dashTime: 0,
      shootCooldown: 0,
      invulnerable: 0,
      health: 5,
      maxHealth: 5,
      respawnX: level.spawn.x,
      respawnY: level.spawn.y,
      downstrike: false,
      inWater: false,
      anim: 0,
      trailTimer: 0,
    };
  }

  function showOnly(id) {
    $$(".screen").forEach((screen) => {
      const visible = screen.id === id;
      screen.classList.toggle("is-visible", visible);
      screen.setAttribute("aria-hidden", visible ? "false" : "true");
    });
  }

  function setGameUi(visible) {
    if (!visible) resetInput();
    $("#hud").classList.toggle("is-visible", visible);
    $("#hud").setAttribute("aria-hidden", visible ? "false" : "true");
    $("#touch-controls").classList.toggle("is-visible", visible);
  }

  function openMenu() {
    scene = "menu";
    currentLevel = null;
    runtime = null;
    player = null;
    cameraX = 0;
    setGameUi(false);
    showOnly("start-screen");
    $("#continue-label").textContent = save.unlocked > 1 ? `继续第 ${save.unlocked} 关` : "开始远征";
  }

  function openLevels() {
    scene = "levels";
    setGameUi(false);
    renderLevelGrid();
    showOnly("level-screen");
  }

  function openHelp() {
    scene = "help";
    setGameUi(false);
    showOnly("help-screen");
  }

  function startLevel(id, skipBriefing = false) {
    resetInput();
    currentLevel = normalizeLevel(rawLevel(id));
    runtime = makeRuntime(currentLevel);
    player = makePlayer(currentLevel);
    cameraX = clamp(currentLevel.spawn.x - 180, 0, Math.max(0, currentLevel.worldWidth - VIEW_W));
    autoCameraX = cameraX;
    elapsed = 0;
    shake = 0;
    flash = 0;
    captureReady = false;
    updateHud();

    if (skipBriefing) {
      scene = "playing";
      showOnly(null);
      setGameUi(true);
      setTimeout(() => { captureReady = true; }, 180);
    } else {
      scene = "briefing";
      setGameUi(false);
      $("#briefing-number").textContent = `STAGE ${pad(currentLevel.id)}${currentLevel.isBoss ? " · BOSS" : ""}`;
      $("#briefing-title").textContent = currentLevel.name;
      $("#briefing-subtitle").textContent = currentLevel.subtitle;
      $("#briefing-mechanic").textContent = currentLevel.mechanic;
      showOnly("briefing");
    }
  }

  function beginBriefing() {
    if (scene !== "briefing") return;
    scene = "playing";
    showOnly(null);
    setGameUi(true);
    playTone("start");
    toast(currentLevel.mechanic, 2.6);
  }

  function togglePause(forceResume = false) {
    if (forceResume && scene === "paused") {
      scene = "playing";
      showOnly(null);
      setGameUi(true);
      return;
    }
    if (scene === "playing") {
      scene = "paused";
      setGameUi(false);
      showOnly("pause-screen");
    } else if (scene === "paused") {
      scene = "playing";
      showOnly(null);
      setGameUi(true);
    }
  }

  function renderLevelGrid() {
    const levels = listLevels();
    $("#level-grid").innerHTML = levels.map((entry) => {
      const level = normalizeLevel(deepClone(entry));
      const unlocked = level.id <= save.unlocked;
      const cleared = save.completed.includes(level.id);
      return `<button class="level-card" data-level="${level.id}" ${unlocked ? "" : "disabled"} style="--card-bg:${level.theme.mid};--card-accent:${level.theme.edge}">
        <span class="card-number">${level.isBoss ? "BOSS" : "STAGE"} ${pad(level.id)} ${cleared ? "· 已修复" : unlocked ? "· 可进入" : "· 未解锁"}</span>
        <strong>${level.name}</strong>
        <small>${level.mechanic}</small>
      </button>`;
    }).join("");
  }

  function completeLevel() {
    if (!runtime || runtime.completed) return;
    runtime.completed = true;
    scene = currentLevel.id === 8 ? "victory" : "complete";
    setGameUi(false);
    save.completed = [...new Set([...save.completed, currentLevel.id])].sort((a, b) => a - b);
    save.unlocked = Math.max(save.unlocked, Math.min(8, currentLevel.id + 1));
    persist();
    burst(player.x + player.w / 2, player.y + player.h / 2, currentLevel.theme.edge, 42, 420);
    playTone("complete");
    if (currentLevel.id === 8) {
      $("#victory-stats").textContent = `${save.completed.length} / 8 关 · ${save.seeds} 枚记忆种子 · ${save.deaths} 次重整`;
      showOnly("victory-screen");
    } else {
      $("#complete-title").textContent = `${currentLevel.name} · 修复完成`;
      $("#complete-detail").textContent = currentLevel.isBoss ? "守门者的核心已恢复平静，下一片生态正在回应。" : "裂界重新长出颜色，新的航线已经开放。";
      showOnly("complete-screen");
    }
  }

  function toast(message, duration = 1.8) {
    const node = $("#toast");
    node.textContent = message;
    node.classList.add("is-visible");
    toastTimer = duration;
  }

  function effectActive(type) {
    return Number(runtime?.activeEffects?.[type]) > 0;
  }

  function isBossSpawnAvailable(entity) {
    if (!entity?.spawnOnBossPhase && !entity?.spawnOnBossDefeat) return true;
    const boss = runtime?.boss;
    if (!boss) return false;
    if (entity.spawnOnBossDefeat) return boss.hp <= 0 || boss.state === "defeated";
    return boss.active && boss.phase >= Number(entity.spawnOnBossPhase);
  }

  function pickupStatusText() {
    if (!runtime || !currentLevel) return "";
    const parts = [];
    if (runtime.seedTotal > 0) {
      const found = runtime.collectibles.filter((item) => (item.type === "memory-seed" || item.type === "seed") && item.collected).length;
      parts.push(`种子 ${found}/${runtime.seedTotal} · 总计 ${save.seeds}`);
    }

    const requirement = currentLevel.goal?.requires;
    if (requirement === "crystal-crown") parts.push(runtime.inventory.has("crystal-crown") ? "晶冠 ✓" : "任务：寻找晶冠");
    if (requirement === "all-gear-doors") parts.push(`齿轮 ${runtime.switches.filter((device) => device.active).length}/${runtime.switches.length}`);
    if (requirement === "three-tide-runes") {
      const count = runtime.collectibles.filter((item) => item.type === "tide-rune" && item.collected).length;
      parts.push(`潮汐符文 ${count}/3`);
    }
    if (requirement === "forge-seal") parts.push(runtime.inventory.has("forge-seal") ? "锻炉印记 ✓" : "任务：寻找锻炉印记");
    if (currentLevel.isBoss && runtime.boss?.hp <= 0) {
      const core = runtime.collectibles.find((item) => item.spawnOnBossDefeat && !item.collected);
      if (core) parts.push("任务：拾取守门核心");
    }

    const active = Object.entries(runtime.activeEffects)
      .filter(([, remaining]) => remaining > 0)
      .sort((a, b) => b[1] - a[1])[0];
    if (active) parts.push(`${COLLECTIBLE_EFFECTS[active[0]]?.label || "增益"} ${Math.ceil(active[1])}秒`);
    const charge = Object.entries(runtime.charges).find(([, count]) => count > 0);
    if (charge) parts.push(`${COLLECTIBLE_EFFECTS[charge[0]]?.label || "充能"} ×${charge[1]}`);
    return parts.slice(0, 3).join(" · ");
  }

  function announce(message) {
    $("#announcer").textContent = message;
  }

  function updateHud() {
    if (!player || !currentLevel) return;
    $("#health").innerHTML = Array.from({ length: player.maxHealth }, (_, i) => `<i class="${i < player.health ? "is-full" : ""}"></i>`).join("");
    $("#hud-stage").textContent = `STAGE ${pad(currentLevel.id)}`;
    $("#hud-name").textContent = currentLevel.name;
    $("#dash-fill").style.transform = `scaleX(${clamp(1 - player.dashCooldown / 0.8, 0, 1)})`;
    const pickupNode = $("#pickup-status");
    if (pickupNode) {
      pickupNode.textContent = pickupStatusText();
      pickupNode.title = pickupNode.textContent;
    }
    const bossHud = $("#boss-hud");
    if (runtime?.boss?.active) {
      bossHud.hidden = false;
      $("#boss-name").textContent = runtime.boss.name;
      $("#boss-health").innerHTML = Array.from({ length: runtime.boss.maxHp }, (_, i) => `<i class="${i < runtime.boss.hp ? "is-full" : ""}"></i>`).join("");
      $("#boss-status").textContent = bossStatus();
    } else {
      bossHud.hidden = true;
    }
  }

  function bossStatus() {
    if (!runtime?.boss) return "";
    const boss = runtime.boss;
    if (boss.vulnerable > 0) return "核心暴露 · 现在攻击！";
    if (currentLevel.id === 4) {
      const active = runtime.valves.filter((valve) => valve.active).length;
      return active === runtime.valves.length && active > 0 ? "冷凝喷口已启动 · 引诱冲锋" : `冷却阀 ${active} / ${runtime.valves.length}`;
    }
    const active = runtime.mirrors.filter((mirror) => mirror.active).length;
    return active === runtime.mirrors.length && active > 0 ? "双镜共鸣 · 等待折射" : `日光镜 ${active} / ${runtime.mirrors.length}`;
  }

  function createAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext = new AudioCtx();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
  }

  function playTone(kind) {
    if (muted) return;
    createAudio();
    if (!audioContext) return;
    const notes = {
      jump: [392, 0.08, "triangle"],
      dash: [164, 0.13, "sawtooth"],
      shoot: [659, 0.07, "square"],
      seed: [880, 0.12, "sine"],
      switch: [523, 0.18, "triangle"],
      hurt: [105, 0.24, "sawtooth"],
      boss: [82, 0.34, "square"],
      start: [440, 0.18, "triangle"],
      complete: [784, 0.5, "triangle"],
    };
    const [frequency, duration, type] = notes[kind] || notes.seed;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * (kind === "hurt" ? 0.55 : 1.28)), audioContext.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.075, audioContext.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + 0.02);
  }

  function pressAction(action, source = `manual:${action}`) {
    const sources = input.sources[action];
    if (!sources) return;
    const isNewSource = !sources.has(source);
    const isDirection = action === "left" || action === "right";
    const wasHeld = sources.size > 0;
    sources.add(source);
    input.held[action] = true;
    if (isNewSource && isDirection) {
      input.lastDirection = action;
      const opposite = action === "left" ? "right" : "left";
      input.tapBuffer[opposite] = 0;
    }
    if (!wasHeld || (isDirection && isNewSource)) {
      input.pressed.add(action);
    }
    if (!wasHeld && isDirection) input.tapBuffer[action] = TOUCH_MIN_HOLD_MS / 1000;
    if (scene === "briefing") beginBriefing();
  }

  function releaseAction(action, source = `manual:${action}`) {
    const sources = input.sources[action];
    if (!sources) return;
    sources.delete(source);
    input.held[action] = sources.size > 0;
  }

  function updateTapBuffers(dt) {
    input.tapBuffer.left = Math.max(0, input.tapBuffer.left - dt);
    input.tapBuffer.right = Math.max(0, input.tapBuffer.right - dt);
  }

  function directionHeld(action) {
    return Boolean(input.held[action] || input.tapBuffer[action] > 0);
  }

  function movementAxis() {
    const left = directionHeld("left");
    const right = directionHeld("right");
    if (left && right) {
      if (input.lastDirection === "left") return -1;
      if (input.lastDirection === "right") return 1;
      return 0;
    }
    return Number(right) - Number(left);
  }

  function resetInput() {
    Object.keys(input.held).forEach((action) => {
      input.held[action] = false;
      input.sources[action].clear();
    });
    input.pressed.clear();
    input.tapBuffer.left = 0;
    input.tapBuffer.right = 0;
    input.pointers.clear();
    input.lastDirection = null;
    $$("[data-touch].is-pressed").forEach((button) => button.classList.remove("is-pressed"));
  }

  const keyMap = {
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
    ArrowUp: "jump", KeyW: "jump", Space: "jump",
    ArrowDown: "down", KeyS: "down",
    ShiftLeft: "dash", ShiftRight: "dash", KeyK: "dash",
    KeyJ: "shoot", KeyX: "shoot",
  };

  window.addEventListener("keydown", (event) => {
    const action = keyMap[event.code];
    if (action) {
      event.preventDefault();
      pressAction(action, `key:${event.code}`);
    }
    if (event.code === "Escape") {
      event.preventDefault();
      togglePause();
    }
    if (event.code === "Enter" && scene === "briefing") beginBriefing();
  });

  window.addEventListener("keyup", (event) => {
    const action = keyMap[event.code];
    if (action) {
      event.preventDefault();
      releaseAction(action, `key:${event.code}`);
    }
  });

  window.addEventListener("blur", () => {
    resetInput();
    if (scene === "playing") togglePause();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    resetInput();
    if (scene === "playing") togglePause();
  });
  window.addEventListener("pagehide", resetInput);

  function releaseTouchPointer(pointerId, event) {
    const active = input.pointers.get(pointerId);
    if (!active) return;
    event?.preventDefault?.();
    input.pointers.delete(pointerId);
    releaseAction(active.action, active.source);
    const stillPressed = [...input.pointers.values()].some((entry) => entry.button === active.button);
    active.button.classList.toggle("is-pressed", stillPressed);
  }

  function handleTouchPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    releaseTouchPointer(event.pointerId);
    const button = event.currentTarget;
    const action = button.dataset.touch;
    const source = `pointer:${event.pointerId}`;
    input.pointers.set(event.pointerId, { action, button, source });
    button.classList.add("is-pressed");
    pressAction(action, source);
    try {
      button.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is optional in older embedded mobile browsers.
    }
  }

  $$('[data-touch]').forEach((button) => {
    button.addEventListener("pointerdown", handleTouchPointerDown);
    button.addEventListener("pointerup", (event) => releaseTouchPointer(event.pointerId, event));
    button.addEventListener("pointercancel", (event) => releaseTouchPointer(event.pointerId, event));
    button.addEventListener("lostpointercapture", (event) => releaseTouchPointer(event.pointerId, event));
  });
  window.addEventListener("pointerup", (event) => releaseTouchPointer(event.pointerId, event), true);
  window.addEventListener("pointercancel", (event) => releaseTouchPointer(event.pointerId, event), true);

  document.addEventListener("click", (event) => {
    const levelButton = event.target.closest("[data-level]");
    if (levelButton && !levelButton.disabled) {
      startLevel(Number(levelButton.dataset.level));
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) {
      if (scene === "briefing") beginBriefing();
      return;
    }
    const action = button.dataset.action;
    createAudio();
    if (action === "continue") startLevel(save.unlocked);
    if (action === "levels") openLevels();
    if (action === "help") openHelp();
    if (action === "back" || action === "home") openMenu();
    if (action === "resume") togglePause(true);
    if (action === "pause") togglePause();
    if (action === "restart" && currentLevel) startLevel(currentLevel.id);
    if (action === "next") startLevel(Math.min(8, currentLevel.id + 1));
    if (action === "mute") {
      muted = !muted;
      $("#mute-icon").textContent = muted ? "静音" : "声音";
      persist();
    }
    if (action === "fullscreen") {
      if (!document.fullscreenElement) $("#app").requestFullscreen?.();
      else document.exitFullscreen?.();
    }
  });

  function update(dt) {
    menuTime += dt;
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) $("#toast").classList.remove("is-visible");
    }
    flash = Math.max(0, flash - dt * 2.7);
    shake = Math.max(0, shake - dt * 22);
    updateTapBuffers(dt);
    if (scene !== "playing" || !currentLevel || !runtime || !player) {
      input.pressed.clear();
      return;
    }

    elapsed += dt;
    runtime.time += dt;
    updatePlatforms(dt);
    updateDevices(dt);
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateBoss(dt);
    updateParticles(dt);
    updateCamera(dt);
    updateHud();
    input.pressed.clear();
  }

  function updatePlatforms(dt) {
    runtime.platforms.forEach((platform) => {
      const oldX = platform.x;
      const oldY = platform.y;
      const motion = platform.motion;
      if (motion) {
        const axis = motion.axis || (motion.y ? "y" : "x");
        const distance = Number(motion.distance || motion.range || (axis === "x" ? motion.x : motion.y)) || 120;
        const speed = Number(motion.speed) || 1.2;
        const value = Math.sin(runtime.time * speed + platform.phase) * distance;
        if (axis === "x") platform.x = platform.originX + value;
        else platform.y = platform.originY + value;
      }
      platform.dx = platform.x - oldX;
      platform.dy = platform.y - oldY;
      if (platform.fragile) {
        if (platform.breakTimer > 0) {
          platform.breakTimer -= dt;
          if (platform.breakTimer <= 0) platform.brokenTimer = 2.8;
        }
        if (platform.brokenTimer > 0) {
          platform.brokenTimer -= dt;
          if (platform.brokenTimer <= 0) platform.breakTimer = 0;
        }
      }
    });
  }

  function updateDevices(dt) {
    runtime.goalToastCooldown = Math.max(0, runtime.goalToastCooldown - dt);
    Object.keys(runtime.activeEffects).forEach((type) => {
      runtime.activeEffects[type] = Math.max(0, runtime.activeEffects[type] - dt);
      if (runtime.activeEffects[type] <= 0) delete runtime.activeEffects[type];
    });
    Object.keys(runtime.enabled).forEach((key) => {
      if (runtime.enabled[key] === true) return;
      runtime.enabled[key] -= dt;
      if (runtime.enabled[key] <= 0) delete runtime.enabled[key];
    });
    runtime.valves.forEach((valve) => {
      if (valve.active) {
        valve.timer -= dt;
        if (valve.timer <= 0) valve.active = false;
      }
    });
    runtime.mirrors.forEach((mirror) => {
      if (mirror.active) {
        mirror.timer -= dt;
        if (mirror.timer <= 0) mirror.active = false;
      }
    });
    runtime.coolants.forEach((coolant) => {
      if (!coolant.active) {
        coolant.respawn -= dt;
        if (coolant.respawn <= 0) coolant.active = true;
      }
    });
    const water = runtime.devices.water;
    if (water) runtime.waterY = water.baseY + Math.sin(runtime.time * (water.speed || 0.7)) * (water.amplitude || 55);
    const lava = runtime.devices.lava;
    if (lava) {
      runtime.lavaY = Math.max(lava.minY || 500, runtime.lavaY - (lava.riseSpeed || 5.5) * dt);
    }
  }

  function activePlatforms() {
    return runtime.platforms.filter((platform) => {
      if (platform.brokenTimer > 0) return false;
      if (platform.hidden && platform.enabledBy && !runtime.enabled[platform.enabledBy] && !effectActive("resonance-orb")) return false;
      if (platform.hidden && !platform.enabledBy && !(runtime.hiddenRevealed || effectActive("resonance-orb") || runtime.crystals.some((crystal) => crystal.active))) return false;
      return true;
    });
  }

  function isGateActive(gate) {
    if (gate.openBy) return !runtime.switches.find((device) => device.id === gate.openBy)?.active;
    const index = Number(gate.switchIndex ?? gate.switch ?? gate.index);
    return !runtime.switches[index]?.active;
  }

  function solids() {
    return [
      ...activePlatforms(),
      ...runtime.gates.filter(isGateActive).map((gate) => ({ ...gate, type: "gate" })),
    ];
  }

  function updatePlayer(dt) {
    player.anim += dt;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt * (effectActive("wind-feather") ? 3.5 : 1));
    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
    player.coyote = player.onGround ? 0.11 : Math.max(0, player.coyote - dt);
    if (input.pressed.has("jump")) player.jumpBuffer = 0.13;
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    const move = movementAxis();
    if (move) player.facing = move;
    player.inWater = Boolean(runtime.devices.water && player.y + player.h * 0.65 > runtime.waterY);

    if (input.pressed.has("dash") && player.dashCooldown <= 0) {
      player.dashTime = 0.15;
      player.dashCooldown = 0.8;
      player.vx = player.facing * 720;
      player.vy = 0;
      player.trailTimer = 0;
      playTone("dash");
      burst(player.x + player.w / 2, player.y + player.h / 2, currentLevel.theme.paper, 8, 190);
    }

    if (input.pressed.has("shoot") && player.shootCooldown <= 0) {
      const resonanceBoost = effectActive("resonance-orb");
      const starCharged = Number(runtime.charges["star-charge"]) > 0;
      if (starCharged) runtime.charges["star-charge"] -= 1;
      player.shootCooldown = resonanceBoost || starCharged ? 0.2 : 0.28;
      runtime.projectiles.push({
        x: player.x + player.w / 2 + player.facing * 22,
        y: player.y + 18,
        w: starCharged ? 34 : resonanceBoost ? 28 : 18,
        h: starCharged ? 34 : resonanceBoost ? 28 : 18,
        vx: player.facing * (starCharged ? 680 : resonanceBoost ? 620 : 560),
        vy: 0,
        life: resonanceBoost ? 1.85 : 1.45,
        power: starCharged ? 2 : 1,
        starCharged,
      });
      if (starCharged) toast(`星能脉冲已装填 · 剩余 ${runtime.charges["star-charge"]}`, 0.9);
      playTone("shoot");
    }

    if (!player.onGround && input.pressed.has("down")) {
      player.downstrike = true;
      player.vy = 840;
    }

    if (player.dashTime > 0) {
      player.dashTime -= dt;
      player.vx = player.facing * 720;
      player.vy = 0;
      player.trailTimer -= dt;
      if (player.trailTimer <= 0) {
        runtime.particles.push({ x: player.x, y: player.y + player.h / 2, vx: -player.facing * 80, vy: 0, life: 0.25, maxLife: 0.25, size: 24, color: currentLevel.theme.paper, shape: "leaf" });
        player.trailTimer = 0.035;
      }
    } else {
      const pearlBoost = effectActive("air-pearl");
      const acceleration = player.inWater ? (pearlBoost ? 980 : 780) : (player.onGround ? 2100 : 1250);
      const target = move * (player.inWater ? (pearlBoost ? 300 : 245) : 350);
      const reversing = move !== 0 && player.vx !== 0 && Math.sign(player.vx) !== move;
      const directionPressed = move < 0 ? input.pressed.has("left") : move > 0 && input.pressed.has("right");
      const turnAcceleration = player.inWater ? 3200 : player.onGround ? 6400 : 3400;
      const braking = player.inWater ? 1450 : player.onGround ? 3600 : 980;
      if (reversing && directionPressed) player.vx = 0;
      player.vx = move
        ? moveToward(player.vx, target, (reversing ? turnAcceleration : acceleration) * dt)
        : moveToward(player.vx, 0, braking * dt);
      let gravity = player.inWater ? (pearlBoost ? 300 : 420) : 1880;
      if (input.held.jump && player.vy < 0) gravity *= 0.58;
      if (!player.inWater && effectActive("parcel-wings") && input.held.jump && player.vy > 0) gravity *= 0.28;
      const maxFall = player.inWater ? (pearlBoost ? 250 : 330) : effectActive("parcel-wings") && input.held.jump ? 360 : 980;
      player.vy = Math.min(maxFall, player.vy + gravity * dt);
      if (player.inWater && input.pressed.has("jump")) {
        player.vy = pearlBoost ? -430 : -340;
        player.jumpBuffer = 0;
        playTone("jump");
        burst(player.x + player.w / 2, player.y + player.h, currentLevel.theme.edge, 5, 90);
      }
    }

    if (player.jumpBuffer > 0 && player.coyote > 0 && player.dashTime <= 0) {
      player.vy = -670;
      player.jumpBuffer = 0;
      player.coyote = 0;
      player.onGround = false;
      playTone("jump");
      burst(player.x + player.w / 2, player.y + player.h, currentLevel.theme.paper, 5, 100);
    }

    applyWind(dt);
    movePlayerX(dt);
    movePlayerY(dt);
    handlePlayerWorld();
  }

  function moveToward(value, target, amount) {
    if (value < target) return Math.min(target, value + amount);
    if (value > target) return Math.max(target, value - amount);
    return target;
  }

  function applyWind(dt) {
    const zones = runtime.devices.windZones || [];
    zones.forEach((zone) => {
      if (overlap(player, { x: zone.x, y: zone.y, w: zone.w, h: zone.h })) {
        player.vx += (zone.forceX || zone.xForce || 0) * dt;
        player.vy += (zone.forceY || zone.yForce || 0) * dt;
        if (Math.random() < 0.12) runtime.particles.push({ x: zone.x + Math.random() * zone.w, y: zone.y + Math.random() * zone.h, vx: zone.forceX * 0.4, vy: zone.forceY * 0.4, life: 0.8, maxLife: 0.8, size: 8, color: currentLevel.theme.paper, shape: "dash" });
      }
    });
  }

  function movePlayerX(dt) {
    player.x += player.vx * dt;
    for (const solid of solids()) {
      if (!overlap(player, solid)) continue;
      if (player.vx > 0) player.x = solid.x - player.w;
      else if (player.vx < 0) player.x = solid.x + solid.w;
      player.vx = 0;
      if (player.dashTime > 0) {
        player.dashTime = 0;
        shake = Math.max(shake, 5);
      }
    }
    player.x = clamp(player.x, 0, currentLevel.worldWidth - player.w);
  }

  function movePlayerY(dt) {
    const previousBottom = player.y + player.h;
    player.y += player.vy * dt;
    player.onGround = false;
    player.ground = null;
    for (const solid of solids()) {
      if (!overlap(player, solid)) continue;
      if (player.vy >= 0 && previousBottom <= solid.y + Math.max(10, Math.abs(solid.dy || 0) + 5)) {
        player.y = solid.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.ground = solid;
        player.downstrike = false;
        if (solid.conveyor) player.x += solid.conveyor * dt;
        if (solid.fragile && solid.breakTimer <= 0) solid.breakTimer = 0.55;
      } else if (player.vy < 0 && player.y >= solid.y + solid.h - 22) {
        player.y = solid.y + solid.h;
        player.vy = 30;
      }
    }
    if (player.ground) {
      player.x += player.ground.dx || 0;
      player.y += player.ground.dy || 0;
    }
  }

  function collectItem(item) {
    const effect = COLLECTIBLE_EFFECTS[item.type];
    if (!effect) return false;
    if (effect.mode === "health" && player.health >= player.maxHealth) {
      if (!item.fullHealthNotified) toast("生命已满 · 星芽之心会留在这里", 1.1);
      item.fullHealthNotified = true;
      return false;
    }

    item.collected = true;
    if (effect.mode === "memory") {
      if (!save.collectedSeeds.includes(item.persistentKey)) {
        const previousTotal = save.seeds;
        save.collectedSeeds.push(item.persistentKey);
        save.seeds = Math.max(save.seeds, save.collectedSeeds.length);
        persist();
        toast(save.seeds > previousTotal
          ? `记忆种子 +1 · 永久收藏共 ${save.seeds} 枚`
          : `记忆种子已登记 · 永久收藏仍为 ${save.seeds} 枚`, 1.45);
      } else {
        toast(`这枚记忆种子已收藏 · 永久收藏共 ${save.seeds} 枚`, 1.25);
      }
    } else if (effect.mode === "health") {
      player.health = Math.min(player.maxHealth, player.health + 2);
      toast("星芽之心：恢复两格生命", 1.25);
    } else if (effect.mode === "timed") {
      const duration = Number(item.duration) || effect.duration;
      runtime.activeEffects[item.type] = Math.max(Number(runtime.activeEffects[item.type]) || 0, duration);
      runtime.inventory.add(item.type);
      if (item.type === "wind-feather") player.dashCooldown = 0;
      toast(`${effect.label}：${effect.description} · ${duration} 秒`, 1.8);
    } else if (effect.mode === "charges") {
      const charges = Number(item.charges) || effect.charges;
      runtime.charges[item.type] = (Number(runtime.charges[item.type]) || 0) + charges;
      runtime.inventory.add(item.type);
      toast(`${effect.label}：${effect.description} · 当前 ×${runtime.charges[item.type]}`, 1.8);
    } else if (effect.mode === "rune") {
      runtime.inventory.add(`tide-rune-${item.order || item.id}`);
      const count = runtime.collectibles.filter((entry) => entry.collected && entry.type === "tide-rune").length;
      toast(`潮汐符文 ${count} / 3 · 集齐后开启潮门`, 1.55);
    } else if (effect.mode === "quest") {
      runtime.inventory.add(item.type);
      toast(`${effect.label}已取得 · ${effect.description}`, 1.7);
    } else if (effect.mode === "coolant") {
      const coolant = runtime.coolants.find((entry) => entry.id === item.mechanismId || entry.id === item.id);
      if (coolant) {
        coolant.active = false;
        coolant.respawn = 7;
        if (coolant.id) runtime.enabled[coolant.id] = Number(coolant.duration) || 8;
      }
      runtime.lavaY = Math.min(720, runtime.lavaY + 95);
      player.dashCooldown = 0;
      toast("冷凝种子：熔潮退却、临时平台生成、冲刺充能", 1.85);
    } else if (effect.mode === "quench") {
      runtime.lavaY = Math.min(720, runtime.lavaY + (Number(item.dropAmount) || 150));
      toast("淬火钟鸣响：熔潮大幅退却", 1.6);
    } else if (effect.mode === "boss-core") {
      runtime.inventory.add(item.type);
      toast(`${effect.label}已回收 · 守门挑战完成`, 1.6);
      const collectedRuntime = runtime;
      const collectedLevelId = currentLevel.id;
      setTimeout(() => {
        if (runtime === collectedRuntime && currentLevel?.id === collectedLevelId && item.collected) completeLevel();
      }, 420);
    }

    playTone(effect.mode === "coolant" || effect.mode === "quench" ? "switch" : "seed");
    burst(item.x + item.w / 2, item.y + item.h / 2, currentLevel.theme.edge, 14, 220);
    updateHud();
    return true;
  }

  function handlePlayerWorld() {
    const body = player;
    runtime.hazards.forEach((hazard) => {
      if (overlap(body, hazard)) hurtPlayer(hazard.x + hazard.w / 2);
    });
    runtime.enemyShots.forEach((shot) => {
      if (shot.life > 0 && overlap(body, shot)) {
        shot.life = 0;
        hurtPlayer(shot.x);
      }
    });
    runtime.shockwaves.forEach((wave) => {
      if (wave.life > 0 && overlap(body, wave)) hurtPlayer(wave.x);
    });

    runtime.collectibles.forEach((item) => {
      if (!item.collected && isBossSpawnAvailable(item) && overlap(body, item)) collectItem(item);
    });

    runtime.checkpoints.forEach((point) => {
      if (!point.active && player.x + player.w > point.x) {
        runtime.checkpoints.forEach((other) => { other.active = false; });
        point.active = true;
        player.respawnX = Number(point.respawn?.x) || point.x + 30;
        player.respawnY = (Number(point.respawn?.y) || point.y) - player.h;
        toast("星芽标记已点亮 · 进度保存", 1.55);
        announce("检查点已激活");
        playTone("switch");
      }
    });

    runtime.coolants.forEach((coolant) => {
      if (coolant.active && overlap(body, coolant)) {
        coolant.active = false;
        coolant.respawn = 7;
        runtime.lavaY = Math.min(720, runtime.lavaY + 95);
        if (coolant.id) runtime.enabled[coolant.id] = Number(coolant.duration) || 8;
        player.dashCooldown = 0;
        toast("冷凝种子：熔潮暂时退却，冲刺已充能", 1.7);
        burst(coolant.x + 20, coolant.y + 20, currentLevel.theme.accent, 18, 250);
        playTone("switch");
      }
    });

    if (runtime.devices.lava && player.y + player.h > runtime.lavaY) hurtPlayer(player.x, true);
    if (runtime.devices.water && player.y > VIEW_H + 220) respawnPlayer();
    if (player.y > Math.max(VIEW_H + 240, currentLevel.worldHeight + 200)) respawnPlayer();
    if (runtime.devices.autoScroll && player.x + player.w < autoCameraX + 14) respawnPlayer();

    if (!currentLevel.isBoss && overlap(body, currentLevel.goal)) {
      if (goalRequirementMet()) completeLevel();
      else if (runtime.goalToastCooldown <= 0) {
        runtime.goalToastCooldown = 1.6;
        toast(goalRequirementHint(), 1.45);
      }
    }
  }

  function goalRequirementMet() {
    const requirement = currentLevel.goal?.requires;
    if (!requirement || requirement === "reach") return true;
    if (requirement === "crystal-crown") return runtime.inventory.has("crystal-crown");
    if (requirement === "all-gear-doors") return runtime.switches.length === 0 || runtime.switches.every((device) => device.active);
    if (requirement === "three-tide-runes") return runtime.collectibles.filter((item) => item.collected && item.type === "tide-rune").length >= 3;
    if (requirement === "forge-seal") return runtime.inventory.has("forge-seal");
    return true;
  }

  function goalRequirementHint() {
    const requirement = currentLevel.goal?.requires;
    if (requirement === "crystal-crown") return "出口还在沉睡 · 找到晶洞深处的回声晶冠";
    if (requirement === "all-gear-doors") return "温室主轴尚未同步 · 还有齿轮开关未咬合";
    if (requirement === "three-tide-runes") return "潮门需要三枚符文同时共鸣";
    if (requirement === "forge-seal") return "熔炉出口需要锻炉印记";
    return "出口条件尚未满足";
  }

  function hurtPlayer(sourceX, severe = false) {
    if (player.invulnerable > 0 || player.dashTime > 0 || scene !== "playing") return;
    player.health -= severe ? 2 : 1;
    player.invulnerable = 1.05;
    player.vx = player.x + player.w / 2 < sourceX ? -360 : 360;
    player.vy = -430;
    flash = 0.55;
    shake = 11;
    playTone("hurt");
    burst(player.x + player.w / 2, player.y + player.h / 2, currentLevel.theme.accent, 13, 280);
    if (player.health <= 0) respawnPlayer();
    updateHud();
  }

  function respawnPlayer() {
    save.deaths += 1;
    persist();
    player.health = player.maxHealth;
    player.x = player.respawnX;
    player.y = player.respawnY;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 1.2;
    runtime.enemyShots.length = 0;
    runtime.shockwaves.length = 0;
    runtime.valves.forEach((valve) => { valve.active = false; valve.timer = 0; });
    runtime.mirrors.forEach((mirror) => { mirror.active = false; mirror.timer = 0; });
    if (runtime.boss) {
      runtime.boss.vulnerable = 0;
      runtime.boss.state = "watching";
      runtime.boss.timer = 1.2;
    }
    const safeCamera = clamp(player.respawnX - 180, 0, Math.max(0, currentLevel.worldWidth - VIEW_W));
    cameraX = safeCamera;
    autoCameraX = safeCamera;
    toast("星芽在最近的标记处重新聚合", 1.55);
  }

  function updateEnemies(dt) {
    const enemyDt = dt * (effectActive("clock-spring") ? 0.55 : 1);
    runtime.enemies.forEach((enemy) => {
      if (!enemy.alive || !isBossSpawnAvailable(enemy)) return;
      enemy.t += enemyDt;
      enemy.cooldown -= enemyDt;
      if (isFlyingEnemy(enemy.type)) {
        enemy.x += enemy.vx * enemyDt;
        enemy.y += Math.sin(enemy.t * 3.2) * 48 * enemyDt;
        if (Math.abs(enemy.x - enemy.originX) > enemy.range) enemy.vx *= -1;
      } else if (isTurretEnemy(enemy.type)) {
        if (enemy.cooldown <= 0 && Math.abs(player.x - enemy.x) < 620) {
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const length = Math.hypot(dx, dy) || 1;
          runtime.enemyShots.push({ x: enemy.x + enemy.w / 2, y: enemy.y + 12, w: 16, h: 16, vx: dx / length * 270, vy: dy / length * 270, life: 3.1 });
          enemy.cooldown = 2.25;
        }
      } else {
        enemy.x += enemy.vx * enemyDt;
        if (Math.abs(enemy.x - enemy.originX) > enemy.range) enemy.vx *= -1;
      }

      if (overlap(player, enemy)) {
        const stomped = player.vy > 180 && player.y + player.h - enemy.y < 26;
        if (stomped || player.dashTime > 0 || player.downstrike) {
          enemy.hp -= 1;
          player.vy = -390;
          player.downstrike = false;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, currentLevel.theme.edge, 12, 230);
          }
        } else {
          hurtPlayer(enemy.x + enemy.w / 2);
        }
      }
    });
  }

  function isFlyingEnemy(type) {
    return ["flyer", "moth", "bat", "wasp", "drone"].some((token) => String(type).includes(token));
  }

  function isTurretEnemy(type) {
    return ["turret", "spitter", "cannon", "caster"].some((token) => String(type).includes(token));
  }

  function updateProjectiles(dt) {
    const projectiles = runtime.projectiles;
    projectiles.forEach((projectile) => {
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      let consumed = false;

      for (const enemy of runtime.enemies) {
        if (!enemy.alive || !isBossSpawnAvailable(enemy) || !overlap(projectile, enemy)) continue;
        enemy.hp -= Number(projectile.power) || 1;
        consumed = true;
        if (enemy.hp <= 0) {
          enemy.alive = false;
          burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, currentLevel.theme.edge, 10, 210);
        }
        break;
      }

      runtime.crystals.forEach((crystal) => {
        if (!crystal.active && overlap(projectile, crystal)) {
          crystal.active = true;
          runtime.enabled[crystal.id] = true;
          consumed = true;
          runtime.hiddenRevealed = true;
          toast("回声晶体亮起：隐匿的纸桥显形了", 1.65);
          playTone("switch");
          burst(crystal.x + crystal.w / 2, crystal.y + crystal.h / 2, currentLevel.theme.edge, 18, 270);
        }
      });

      runtime.switches.forEach((device) => {
        if (!device.active && overlap(projectile, device)) {
          device.active = true;
          runtime.enabled[device.id] = true;
          consumed = true;
          toast(`传动齿轮 ${device.index + 1} 已咬合`, 1.35);
          playTone("switch");
          burst(device.x + device.w / 2, device.y + device.h / 2, currentLevel.theme.edge, 16, 240);
        }
      });

      runtime.valves.forEach((valve) => {
        if (overlap(projectile, valve)) {
          const boosted = Number(runtime.charges["coolant-charge"]) > 0 && valve.timer < 8;
          if (boosted) runtime.charges["coolant-charge"] -= 1;
          valve.active = true;
          valve.timer = Math.max(valve.timer, boosted ? 10 : 5.5);
          consumed = true;
          toast(`冷却阀 ${valve.index + 1} 开启${boosted ? " · 充能延长至 10 秒" : ""} · ${runtime.valves.filter((entry) => entry.active).length}/${runtime.valves.length}`, 1.35);
          playTone("switch");
        }
      });

      runtime.mirrors.forEach((mirror) => {
        if (overlap(projectile, mirror)) {
          mirror.active = true;
          mirror.timer = Math.max(mirror.timer, projectile.starCharged ? 9.5 : 5.8);
          consumed = true;
          toast(`日光镜 ${mirror.index + 1} 对准核心`, 1.2);
          playTone("switch");
        }
      });

      if (runtime.boss && overlap(projectile, runtime.boss)) {
        consumed = true;
        if (runtime.boss.vulnerable > 0) damageBoss(Number(projectile.power) || 1);
        else {
          burst(projectile.x, projectile.y, currentLevel.theme.paper, 6, 150);
          toast(currentLevel.id === 4 ? "装甲弹开了脉冲——先开冷却阀，再诱导冲锋" : "暗核吞掉了脉冲——让两面日光镜同时共鸣", 1.3);
        }
      }

      if (consumed) projectile.life = 0;
    });
    runtime.projectiles = projectiles.filter((projectile) => projectile.life > 0 && projectile.x > -100 && projectile.x < currentLevel.worldWidth + 100);

    const hostileDt = dt * (effectActive("clock-spring") ? 0.55 : 1);
    runtime.enemyShots.forEach((shot) => {
      shot.life -= hostileDt;
      shot.x += shot.vx * hostileDt;
      shot.y += shot.vy * hostileDt;
    });
    runtime.enemyShots = runtime.enemyShots.filter((shot) => shot.life > 0);

    runtime.shockwaves.forEach((wave) => {
      wave.life -= hostileDt;
      wave.x += wave.vx * hostileDt;
    });
    runtime.shockwaves = runtime.shockwaves.filter((wave) => wave.life > 0);
  }

  function updateBoss(dt) {
    const boss = runtime.boss;
    if (!boss || boss.hp <= 0) return;
    if (!boss.active) {
      if (player.x + player.w >= boss.arena.x - 40) {
        boss.active = true;
        boss.timer = 1.35;
        toast(`${boss.name} 苏醒 · 观察场地机关`, 2.1);
        announce("守门者战斗开始");
        playTone("boss");
        updateHud();
      } else {
        return;
      }
    }
    boss.timer -= dt;
    boss.vulnerable = Math.max(0, boss.vulnerable - dt);
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);
    boss.beamTimer = Math.max(0, boss.beamTimer - dt);
    const arena = boss.arena;

    if (currentLevel.id === 4) updateBeetleBoss(boss, arena, dt);
    else updateEclipseBoss(boss, arena, dt);

    if (overlap(player, boss) && boss.vulnerable <= 0) hurtPlayer(boss.x + boss.w / 2);
  }

  function updateBeetleBoss(boss, arena, dt) {
    const allValves = runtime.valves.length > 0 && runtime.valves.every((valve) => valve.active);
    const vent = runtime.devices.vent || { x: arena.x + arena.w / 2 - 110, y: 555, w: 220, h: 55 };

    if (boss.vulnerable > 0) {
      boss.state = "stunned";
      boss.vx = moveToward(boss.vx, 0, 900 * dt);
      return;
    }
    if (boss.state === "stunned") {
      boss.state = "watching";
      boss.timer = 1.6;
    }

    if (boss.state === "watching") {
      boss.vx = moveToward(boss.vx, 0, 500 * dt);
      if (boss.timer <= 0) {
        boss.state = "telegraph";
        boss.timer = 0.85;
        boss.vx = 0;
        toast("甲虫锁定了星芽——把它引向冷凝喷口！", 1.15);
      }
    } else if (boss.state === "telegraph") {
      if (boss.timer <= 0) {
        boss.state = "charge";
        boss.timer = 1.45;
        boss.vx = (player.x < boss.x ? -1 : 1) * (boss.phase > 1 ? 650 : 560);
        playTone("boss");
      }
    } else if (boss.state === "charge") {
      boss.x += boss.vx * dt;
      const onVent = boss.x + boss.w > vent.x && boss.x < vent.x + vent.w;
      if (allValves && onVent) {
        boss.vulnerable = 3.2;
        boss.state = "stunned";
        boss.vx = 0;
        runtime.valves.forEach((valve) => { valve.active = false; valve.timer = 0; });
        shake = 15;
        toast("装甲骤冷开裂 · 攻击发光核心！", 2);
        burst(boss.x + boss.w / 2, boss.y + boss.h / 2, currentLevel.theme.edge, 32, 390);
      } else if (boss.timer <= 0 || boss.x <= arena.x || boss.x + boss.w >= arena.x + arena.w) {
        boss.x = clamp(boss.x, arena.x, arena.x + arena.w - boss.w);
        boss.state = "recover";
        boss.timer = 1.1;
        boss.vx = 0;
        shake = 10;
        runtime.shockwaves.push({ x: boss.x, y: 583, w: 56, h: 24, vx: -330, life: 2.4 }, { x: boss.x + boss.w, y: 583, w: 56, h: 24, vx: 330, life: 2.4 });
      }
    } else if (boss.state === "recover" && boss.timer <= 0) {
      boss.state = "watching";
      boss.timer = 1.5;
    }
  }

  function updateEclipseBoss(boss, arena, dt) {
    const allMirrors = runtime.mirrors.length > 0 && runtime.mirrors.every((mirror) => mirror.active);
    if (allMirrors && boss.vulnerable <= 0 && boss.beamTimer <= 0) {
      boss.beamTimer = 1.05;
      boss.state = "beam-stun";
      toast("双镜折光汇聚——暗核正在崩解！", 1.4);
    }
    if (boss.state === "beam-stun") {
      if (boss.beamTimer <= 0) {
        boss.vulnerable = 3.1;
        boss.state = "stunned";
        runtime.mirrors.forEach((mirror) => { mirror.active = false; mirror.timer = 0; });
        shake = 14;
        burst(boss.x + boss.w / 2, boss.y + boss.h / 2, currentLevel.theme.edge, 34, 370);
        toast("日蚀核心暴露 · 现在攻击！", 1.8);
      }
      return;
    }
    if (boss.vulnerable > 0) return;
    if (boss.state === "stunned") {
      boss.state = "watching";
      boss.timer = 1.2;
    }
    boss.y = 300 + Math.sin(runtime.time * 1.7) * 68;
    boss.x = clamp(boss.x + Math.sin(runtime.time * 0.8) * 22 * dt, arena.x + 380, arena.x + arena.w - boss.w - 240);

    if (boss.timer <= 0) {
      const phase = Math.floor(runtime.time / 2.6) % 3;
      if (phase === 0) {
        for (let i = -2; i <= 2; i += 1) {
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + i * 0.22;
          runtime.enemyShots.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h / 2, w: 18, h: 18, vx: Math.cos(angle) * 300, vy: Math.sin(angle) * 300, life: 4 });
        }
        toast("暗星散射 · 找到弹幕缝隙", 1);
      } else if (phase === 1) {
        runtime.shockwaves.push({ x: arena.x, y: 565, w: arena.w, h: 24, vx: 0, life: 0.72, telegraph: 0.38 });
        toast("低位日蚀波 · 跳跃躲避", 1);
      } else {
        for (let i = 0; i < 5; i += 1) {
          runtime.enemyShots.push({ x: arena.x + 180 + i * 250, y: 120, w: 24, h: 24, vx: 0, vy: 360 + i * 18, life: 2.1 });
        }
      }
      boss.timer = boss.hp === 1 ? 1.45 : 2.15;
      playTone("boss");
    }
  }

  function damageBoss(amount = 1) {
    const boss = runtime.boss;
    if (!boss || boss.hitFlash > 0 || boss.vulnerable <= 0) return;
    boss.hp = Math.max(0, boss.hp - Math.max(1, Number(amount) || 1));
    boss.hitFlash = 0.35;
    boss.vulnerable = 0;
    boss.phase = boss.maxHp - boss.hp + 1;
    shake = 18;
    flash = 0.45;
    playTone("boss");
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, currentLevel.theme.accent, 30, 430);
    if (boss.hp <= 0) {
      boss.state = "defeated";
      runtime.goalOpen = true;
      runtime.enemyShots.length = 0;
      runtime.shockwaves.length = 0;
      const hasCoreReward = runtime.collectibles.some((item) => item.spawnOnBossDefeat && !item.collected);
      if (hasCoreReward) toast("守门核心已经显现 · 拾取它完成挑战", 2.2);
      else setTimeout(() => completeLevel(), 650);
    } else {
      toast(`核心受损 · 还剩 ${boss.hp} 层`, 1.6);
      boss.state = "watching";
      boss.timer = 1.15;
    }
  }

  function burst(x, y, color, count = 10, speed = 180) {
    if (!runtime) return;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.35 + Math.random() * 0.65);
      runtime.particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8,
        size: 3 + Math.random() * 9,
        color,
        shape: Math.random() > 0.55 ? "leaf" : "circle",
      });
    }
  }

  function updateParticles(dt) {
    runtime.particles.forEach((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 420 * dt;
      particle.vx *= 0.985;
    });
    runtime.particles = runtime.particles.filter((particle) => particle.life > 0).slice(-180);
  }

  function updateCamera(dt) {
    const maxCamera = Math.max(0, currentLevel.worldWidth - VIEW_W);
    let target = clamp(player.x - VIEW_W * 0.34, 0, maxCamera);
    if (runtime.boss?.active && runtime.boss.hp > 0) {
      const playerCenter = player.x + player.w / 2;
      const bossCenter = runtime.boss.x + runtime.boss.w / 2;
      const duelTarget = (playerCenter + bossCenter) / 2 - VIEW_W / 2;
      target = clamp(lerp(target, duelTarget, 0.72), 0, maxCamera);
    }
    const auto = runtime.devices.autoScroll;
    if (auto) {
      autoCameraX = clamp(autoCameraX + (auto.speed || 105) * dt, 0, maxCamera);
      target = Math.max(target, autoCameraX);
    }
    if (currentLevel.isBoss && currentLevel.worldWidth <= VIEW_W + 500) target = maxCamera * 0.5;
    cameraX = lerp(cameraX, target, 1 - Math.pow(0.001, dt));
  }

  function render() {
    ctx.save();
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;
    ctx.translate(sx, sy);
    if (!currentLevel || scene === "menu" || scene === "levels" || scene === "help") renderMenuWorld();
    else renderWorld();
    ctx.restore();
    if (flash > 0) {
      ctx.fillStyle = `rgba(244,237,218,${flash * 0.32})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  function renderMenuWorld() {
    const theme = DEFAULT_THEMES[0];
    const menuX = (value) => value * VIEW_W / WIDE_VIEW_W;
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    gradient.addColorStop(0, "#163e50");
    gradient.addColorStop(0.58, "#32786f");
    gradient.addColorStop(1, "#e2b96d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawSun(menuX(1040), 152, 98, "#f6c453", 0.88);
    drawMenuRifts(theme);
    drawParallaxHills(theme, menuTime * 16, 0);
    drawWindmill(menuX(885), 280, 1.45, theme, menuTime);
    drawPaperCloud(menuX(720) + Math.sin(menuTime * 0.25) * 25, 105, 1.25, theme.paper, 0.58);
    drawPaperCloud(menuX(1080) + Math.sin(menuTime * 0.18) * 36, 280, 0.85, theme.paper, 0.42);
    ctx.fillStyle = theme.ground;
    paperPolygon([[menuX(520), 610], [menuX(630), 542], [menuX(775), 570], [menuX(930), 512], [menuX(1090), 545], [VIEW_W, 474], [VIEW_W, 720], [menuX(500), 720]], theme.ground, theme.ink, 5);
    drawHero(menuX(1000), 468 + Math.sin(menuTime * 2.2) * 5, 1.8, 1, 0, theme, menuTime);
    for (let i = 0; i < 12; i += 1) {
      const x = menuX(600) + mod(i * menuX(117) + menuTime * (18 + i), menuX(760));
      const y = 340 + Math.sin(i * 2.2 + menuTime) * 70;
      drawLeaf(x, y, 10 + (i % 3) * 4, theme.edge, menuTime + i);
    }
  }

  function drawMenuRifts(theme) {
    const colors = ["#71c7d4", "#d78cff", "#f05d4e", "#5fe0c2"];
    for (let i = 0; i < 4; i += 1) {
      const x = (660 + i * 165) * VIEW_W / WIDE_VIEW_W;
      const y = 198 + Math.sin(menuTime * 0.7 + i) * 25;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.22 + i * 0.12);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 7;
      ctx.globalAlpha = 0.62;
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.bezierCurveTo(-45, -20, 35, 10, -10, 72);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 24;
      ctx.stroke();
      ctx.restore();
    }
  }

  function renderWorld() {
    const theme = currentLevel.theme;
    renderBackground(theme);
    // Keep the cavern atmosphere in the backdrop while leaving hazards,
    // enemies and pickups readable on small screens.
    renderDarkness(theme);
    ctx.save();
    ctx.translate(-cameraX, 0);
    renderWindZones(theme);
    renderGoal(theme);
    renderPlatforms(theme);
    renderHazards(theme);
    renderDevices(theme);
    renderCollectibles(theme);
    renderCheckpoints(theme);
    runtime.enemies.forEach((enemy) => { if (enemy.alive && isBossSpawnAvailable(enemy) && inCamera(enemy.x, enemy.w)) drawEnemy(enemy, theme); });
    runtime.enemyShots.forEach((shot) => { if (inCamera(shot.x, shot.w, 80)) drawOrb(shot.x + shot.w / 2, shot.y + shot.h / 2, shot.w * 0.7, theme.accent, theme.ink); });
    runtime.shockwaves.forEach((wave) => { if (inCamera(wave.x, wave.w, 80)) drawShockwave(wave, theme); });
    runtime.projectiles.forEach((shot) => {
      if (inCamera(shot.x, shot.w, 80)) drawOrb(shot.x + shot.w / 2, shot.y + shot.h / 2, Math.max(11, shot.w * 0.48), shot.starCharged ? theme.accent : theme.edge, theme.paper);
    });
    if (runtime.boss && runtime.boss.hp > 0) drawBoss(runtime.boss, theme);
    if (player) drawHero(player.x + player.w / 2, player.y + player.h, 1, player.facing, player.vx, theme, player.anim, player);
    runtime.particles.forEach((particle) => { if (inCamera(particle.x, particle.size * 2, 80)) drawParticle(particle); });
    renderWaterAndLava(theme);
    ctx.restore();
    renderForeground(theme);
  }

  function renderBackground(theme) {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    gradient.addColorStop(0, theme.skyTop);
    gradient.addColorStop(0.62, theme.skyBottom);
    gradient.addColorStop(1, theme.fog);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const illustrated = drawEnvironmentBackdrop(theme);

    ctx.fillStyle = theme.paper;
    ctx.globalAlpha = 0.055;
    ctx.fillRect(0, 315, VIEW_W, 170);
    ctx.globalAlpha = 1;

    if (!illustrated) {
      if (currentLevel.id === 8) {
        drawSun(1010 - cameraX * 0.03, 150, 118, theme.ink, 1);
        ctx.strokeStyle = theme.edge;
        ctx.lineWidth = 18;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(1010 - cameraX * 0.03, 150, 128, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (currentLevel.id === 2 || currentLevel.id === 4 || currentLevel.id === 7) {
        drawSun(1080 - cameraX * 0.02, 120, 70, theme.accent, 0.35);
      } else {
        drawSun(1040 - cameraX * 0.025, 125, 76, theme.edge, 0.72);
      }

      renderThemeSkyCuts(theme);
      drawLandmark(theme);
      drawParallaxHills(theme, cameraX, currentLevel.id);
      if (![2, 4, 7, 8].includes(currentLevel.id)) {
        drawPaperCloud(210 - cameraX * 0.08, 118, 0.85, theme.paper, 0.28);
        drawPaperCloud(850 - cameraX * 0.05, 210, 1.1, theme.paper, 0.22);
      }
    } else {
      ctx.save();
      ctx.globalAlpha = 0.1;
      drawParallaxHills(theme, cameraX, currentLevel.id);
      ctx.restore();
    }
    renderPaperSurface(theme);
  }

  function drawEnvironmentBackdrop(theme) {
    const fallback = currentLevel.id <= 4
      ? { sheet: "environmentsA", col: (currentLevel.id - 1) & 1, row: Math.floor((currentLevel.id - 1) / 2) }
      : { sheet: "environmentsB", col: (currentLevel.id - 5) & 1, row: Math.floor((currentLevel.id - 5) / 2) };
    const frame = frameSpec("levelBackgroundFrames", String(currentLevel.id), fallback);
    if (!frame?.sheet) return false;
    const record = artImage(frame.sheet);
    if (!record) return false;
    const cols = Number(frame.cols || record.config.cols) || 2;
    const rows = Number(frame.rows || record.config.rows) || 2;
    const cellW = record.image.naturalWidth / cols;
    const cellH = record.image.naturalHeight / rows;
    const gutter = Math.max(0, Number(frame.gutter ?? record.config.gutter) || 0);
    const sourceW = Math.max(1, cellW - gutter * 2);
    const sourceH = Math.max(1, cellH - gutter * 2);
    const sx = (Number(frame.col) || 0) * cellW + gutter;
    const sy = (Number(frame.row) || 0) * cellH + gutter;
    // Cover the logical viewport with one continuous crop. The earlier
    // contain + stretched underlay treatment exposed two vertical seams on
    // wide screens and made the illustration look pasted onto the scene.
    const scale = Math.max(VIEW_W / sourceW, VIEW_H / sourceH);
    const dw = sourceW * scale;
    const dh = sourceH * scale;
    const dx = (VIEW_W - dw) * 0.5;
    const dy = (VIEW_H - dh) * 0.5;
    const cacheKey = [record.config.src, frame.col, frame.row, gutter, VIEW_W, VIEW_H, theme.id].join(":");
    if (environmentBackdropCache?.key !== cacheKey) {
      const layer = document.createElement("canvas");
      layer.width = VIEW_W;
      layer.height = VIEW_H;
      const layerCtx = layer.getContext("2d");
      layerCtx.imageSmoothingEnabled = true;
      layerCtx.imageSmoothingQuality = "high";
      layerCtx.globalAlpha = 0.82;
      layerCtx.drawImage(record.image, sx, sy, sourceW, sourceH, dx, dy, dw, dh);
      const wash = layerCtx.createLinearGradient(0, 0, 0, VIEW_H);
      wash.addColorStop(0, "rgba(255,255,255,0.03)");
      wash.addColorStop(0.72, theme.mid);
      wash.addColorStop(1, theme.ground);
      layerCtx.globalCompositeOperation = "soft-light";
      layerCtx.globalAlpha = 0.24;
      layerCtx.fillStyle = wash;
      layerCtx.fillRect(0, 0, VIEW_W, VIEW_H);
      environmentBackdropCache = { key: cacheKey, layer };
    }
    ctx.drawImage(environmentBackdropCache.layer, 0, 0);
    return true;
  }

  function renderThemeSkyCuts(theme) {
    const id = currentLevel.id;
    const t = runtime?.time || menuTime;
    ctx.save();
    if (id === 1) {
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 6; i += 1) {
        const y = 88 + i * 58;
        const drift = mod(t * (18 + i * 3) - cameraX * 0.05 + i * 173, VIEW_W + 420) - 210;
        ctx.beginPath();
        ctx.moveTo(drift - 150, y);
        ctx.bezierCurveTo(drift - 60, y - 26, drift + 20, y + 24, drift + 132, y - 5);
        ctx.stroke();
        drawLeaf(drift + 145, y - 8, 9 + i % 3, theme.edge, 0.3 + i * 0.8);
      }
    } else if (id === 2) {
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 15; i += 1) {
        const x = mod(i * 137 - cameraX * 0.035, VIEW_W + 120) - 60;
        const y = 55 + mod(i * 89, 330);
        const size = 4 + i % 4;
        paperPolygon([[x, y - size * 2], [x + size, y], [x, y + size * 2], [x - size, y]], i % 3 ? theme.edge : theme.accent2, null);
      }
      ctx.globalAlpha = 0.13;
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i += 1) {
        const x = 90 + i * 190 - mod(cameraX * 0.04, 190);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 45, 345); ctx.stroke();
      }
    } else if (id === 3) {
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 6;
      ctx.globalAlpha = 0.12;
      for (let x = -120 - mod(cameraX * 0.05, 240); x < VIEW_W + 200; x += 240) {
        ctx.beginPath(); ctx.arc(x + 120, 330, 156, Math.PI, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 120, 174); ctx.lineTo(x + 120, 445); ctx.stroke();
      }
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 7; i += 1) drawGear(92 + i * 184 - mod(cameraX * 0.025, 184), 90 + (i % 2) * 72, 18 + (i % 3) * 5, i % 2 ? theme.edge : theme.accent, t * (i % 2 ? 0.14 : -0.1));
    } else if (id === 4) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = theme.ink;
      for (let i = 0; i < 5; i += 1) {
        const x = 70 + i * 260 - mod(cameraX * 0.035, 260);
        ctx.fillRect(x, 72, 54, 340);
        ctx.fillStyle = theme.edge;
        ctx.fillRect(x + 8, 102 + (i % 3) * 42, 38, 8);
        ctx.fillStyle = theme.ink;
      }
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 10;
      ctx.globalAlpha = 0.12;
      ctx.beginPath(); ctx.moveTo(0, 180); ctx.bezierCurveTo(VIEW_W * 0.3, 115, VIEW_W * 0.62, 245, VIEW_W, 150); ctx.stroke();
      for (let i = 0; i < 5; i += 1) drawPaperCloud(110 + i * 290 - mod(cameraX * 0.025, 290), 115 + Math.sin(t * 0.35 + i) * 15, 0.48 + i % 2 * 0.2, theme.paper, 0.1);
    } else if (id === 5) {
      ctx.strokeStyle = theme.paper;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 4;
      for (let y = 105; y < 390; y += 68) {
        ctx.beginPath();
        for (let x = -40; x <= VIEW_W + 40; x += 40) {
          const yy = y + Math.sin(x * 0.018 + t * 0.5 + y) * 8;
          if (x === -40) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.fillStyle = theme.edge;
      for (let i = 0; i < 11; i += 1) {
        const x = mod(i * 119 - cameraX * 0.04, VIEW_W + 80) - 40;
        const y = 60 + mod(i * 67, 300);
        ctx.globalAlpha = 0.08 + (i % 3) * 0.035;
        ctx.beginPath(); ctx.arc(x, y, 4 + i % 5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (id === 6) {
      ctx.strokeStyle = theme.paper;
      ctx.globalAlpha = 0.13;
      ctx.lineWidth = 5;
      for (let i = 0; i < 8; i += 1) {
        const y = 52 + i * 52;
        const offset = mod(t * (22 + i * 3) + i * 143 - cameraX * 0.08, VIEW_W + 260) - 130;
        ctx.beginPath(); ctx.moveTo(offset - 90, y); ctx.lineTo(offset + 100, y - 18); ctx.stroke();
      }
      ctx.strokeStyle = theme.ink;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 3;
      for (let x = 120 - mod(cameraX * 0.04, 230); x < VIEW_W + 100; x += 230) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 45, 370); ctx.stroke();
      }
    } else if (id === 7) {
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.22;
      for (let i = 0; i < 6; i += 1) drawPaperCloud(40 + i * 240 - mod(cameraX * 0.025, 240), 95 + (i % 3) * 42, 0.75 + (i % 2) * 0.25, theme.ink, 0.16);
      for (let i = 0; i < 20; i += 1) {
        const x = mod(i * 83 - cameraX * 0.035, VIEW_W + 100) - 50;
        const y = 50 + mod(i * 109 - t * (12 + i % 5), 390);
        ctx.globalAlpha = 0.2 + (i % 4) * 0.08;
        ctx.fillStyle = i % 3 ? theme.edge : theme.accent;
        ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2); ctx.fill();
      }
    } else if (id === 8) {
      ctx.fillStyle = theme.paper;
      for (let i = 0; i < 34; i += 1) {
        const x = mod(i * 97 - cameraX * 0.018, VIEW_W + 40) - 20;
        const y = 28 + mod(i * 53, 390);
        ctx.globalAlpha = 0.18 + (i % 5) * 0.09;
        const r = 1.4 + i % 3;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = theme.edge;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath(); ctx.ellipse(VIEW_W * 0.58 - cameraX * 0.018, 175, 185 + i * 44, 54 + i * 18, -0.2, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function renderPaperSurface(theme) {
    const record = artImage("paper");
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    if (record) {
      if (paperPatternSource !== record.image) {
        paperPattern = ctx.createPattern(record.image, "repeat");
        paperPatternSource = record.image;
      }
      if (paperPattern) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = paperPattern;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    } else {
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.045;
      for (let i = 0; i < 42; i += 1) {
        const x = mod(i * 97, VIEW_W + 80) - 40;
        const y = mod(i * 61, VIEW_H);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 32 + (i % 4) * 11, y + stableWave(i, 7)); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawLandmark(theme) {
    const px = VIEW_W * 0.7 - cameraX * 0.12;
    const id = currentLevel.id;
    const kind = theme.landmark?.type || "";
    ctx.save();
    ctx.globalAlpha = 0.78;
    if (kind.includes("windmill") || id === 1) drawWindmill(px, 245, 1.2, theme, runtime.time);
    else if (kind.includes("crystal") || id === 2) drawCrystalCathedral(px, 180, theme);
    else if (kind.includes("clock") || id === 3) drawGreenhouseClock(px, 215, theme, runtime.time);
    else if (kind.includes("gauge") || id === 4) drawBeetleRelief(px, 205, theme);
    else if (kind.includes("astrolabe") || id === 5) drawTideColossus(px, 205, theme);
    else if (kind.includes("crane") || id === 6) drawSkyFreighter(px - 90, 168 + Math.sin(runtime.time * 0.4) * 8, theme);
    else if (kind.includes("hammer") || id === 7) drawForgeDragon(px, 230, theme);
    else if (kind.includes("sun") || id === 8) drawEclipseTemple(px, 215, theme);
    ctx.restore();
  }

  function drawParallaxHills(theme, scroll, variant) {
    const shiftFar = -mod(scroll * 0.12, 900);
    ctx.fillStyle = theme.far;
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    for (let x = shiftFar - 900; x < VIEW_W + 900; x += 180) {
      const base = 445 + Math.sin((x + variant * 91) * 0.006) * 30;
      ctx.lineTo(x, base);
      ctx.lineTo(x + 90, base - 105 - (variant % 3) * 18);
      ctx.lineTo(x + 180, base + 10);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.closePath();
    ctx.fill();
    const shiftMid = -mod(scroll * 0.24, 720);
    ctx.fillStyle = theme.mid;
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    for (let x = shiftMid - 720; x < VIEW_W + 720; x += 240) {
      const base = 535 + Math.sin((x + variant * 67) * 0.008) * 18;
      ctx.lineTo(x, base);
      ctx.quadraticCurveTo(x + 110, base - 92 - (variant % 2) * 45, x + 240, base + 8);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }

  function renderWindZones(theme) {
    (runtime.devices.windZones || []).forEach((zone) => {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = theme.paper;
      for (let y = zone.y + 30; y < zone.y + zone.h; y += 56) {
        const direction = Math.sign(zone.forceX || 1);
        ctx.beginPath();
        ctx.roundRect(zone.x + 16, y, zone.w - 32, 3, 2);
        ctx.fill();
        for (let x = zone.x + 70; x < zone.x + zone.w - 30; x += 150) {
          ctx.beginPath();
          ctx.moveTo(x, y - 7);
          ctx.lineTo(x + direction * 16, y);
          ctx.lineTo(x, y + 7);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    });
  }

  function renderPlatforms(theme) {
    activePlatforms().forEach((platform, index) => {
      if (!inCamera(platform.x, platform.w)) return;
      ctx.save();
      if (platform.fragile && platform.breakTimer > 0) {
        ctx.translate(Math.sin(runtime.time * 52 + platform.phase) * 2.2, 0);
      }
      drawPlatformMaterial(platform, theme, index);
      ctx.restore();
    });
  }

  function platformFamily(platform) {
    const value = `${platform.material || ""} ${platform.type || ""}`.toLowerCase();
    if (value.includes("cloud")) return "cloud";
    if (["kite", "cloth", "red-cargo"].some((token) => value.includes(token))) return "cloth";
    if (["crystal", "mica", "glass", "ghost"].some((token) => value.includes(token))) return "crystal";
    if (["grass", "soil", "pressed"].some((token) => value.includes(token))) return "grass";
    if (["brass", "gear", "belt", "star-", "mirror", "orbit"].some((token) => value.includes(token))) return "brass";
    if (["wood", "crate", "pallet", "reed", "raft"].some((token) => value.includes(token))) return "wood";
    if (["obsidian", "basalt", "slag", "charcoal"].some((token) => value.includes(token))) return "volcanic";
    if (["metal", "steel", "iron", "cargo-train", "engine", "boiler", "rust", "grate", "pipe", "anvil", "chain", "forge", "lift"].some((token) => value.includes(token))) return "metal";
    return "stone";
  }

  function drawPlatformMaterial(platform, theme, index) {
    const family = platformFamily(platform);
    const x = platform.x;
    const y = platform.y;
    const w = platform.w;
    const h = platform.h;
    const capH = Math.min(12, Math.max(6, h * 0.22));
    const palette = {
      grass: [theme.ground, theme.mid, theme.edge],
      cloud: [theme.paper, theme.fog, theme.edge],
      cloth: [theme.accent, theme.paper, theme.edge],
      crystal: [theme.far, theme.mid, theme.accent2],
      brass: [theme.accent, theme.ground, theme.edge],
      wood: [theme.ground, theme.mid, theme.paper],
      volcanic: [theme.ink, theme.ground, theme.accent],
      metal: [theme.ink, theme.far, theme.edge],
      stone: [theme.ground, theme.mid, theme.edge],
    }[family];

    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = 0.42;
    ctx.fillRect(x + 7, y + 9, w, h);
    ctx.globalAlpha = platform.hidden && !runtime.hiddenRevealed ? 0.48 : 1;
    ctx.fillStyle = palette[0];
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = palette[1];
    ctx.fillRect(x + 4, y + capH, Math.max(0, w - 8), Math.max(0, h - capH - 4));
    ctx.fillStyle = platform.hidden ? theme.accent : palette[2];
    ctx.fillRect(x, y, w, capH);

    // Carry the same paper stock through the playable geometry so the
    // platforms feel cut from the illustrated world instead of overlaid UI.
    if (paperPattern && h > 14) {
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = paperPattern;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }

    if (family === "grass") {
      ctx.fillStyle = palette[2];
      for (let px = x + 8; px < x + w - 4; px += 16) {
        const tuft = 5 + mod(Math.floor(px / 16) + index, 4);
        ctx.beginPath();
        ctx.moveTo(px - 5, y + 2);
        ctx.lineTo(px, y - tuft);
        ctx.lineTo(px + 2, y + 2);
        ctx.lineTo(px + 7, y - tuft * 0.65);
        ctx.lineTo(px + 8, y + capH);
        ctx.closePath();
        ctx.fill();
      }
      if (h > 28) {
        ctx.strokeStyle = theme.paper;
        ctx.globalAlpha *= 0.13;
        ctx.lineWidth = 2;
        for (let px = x + 22; px < x + w; px += 56) {
          ctx.beginPath(); ctx.moveTo(px, y + 20); ctx.quadraticCurveTo(px + 13, y + h * 0.5, px - 2, y + h - 8); ctx.stroke();
        }
      }
    } else if (family === "cloud") {
      ctx.fillStyle = theme.paper;
      for (let px = x + 12; px < x + w; px += 28) {
        ctx.beginPath(); ctx.arc(px, y + capH * 0.55, Math.min(13, capH + 4), Math.PI, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = theme.ink;
      ctx.globalAlpha *= 0.18;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 8, y + h - 5); ctx.quadraticCurveTo(x + w * 0.5, y + h + 4, x + w - 8, y + h - 5); ctx.stroke();
    } else if (family === "cloth") {
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 2;
      ctx.globalAlpha *= 0.36;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(x + 7, y + 6, Math.max(0, w - 14), Math.max(0, h - 12));
      ctx.setLineDash([]);
      for (let px = x + 18; px < x + w - 6; px += 36) {
        ctx.beginPath(); ctx.moveTo(px, y + capH + 2); ctx.lineTo(px + 18, y + h - 5); ctx.lineTo(px + 36, y + capH + 2); ctx.stroke();
      }
    } else if (family === "crystal") {
      ctx.fillStyle = theme.paper;
      ctx.globalAlpha *= 0.12;
      for (let px = x + 8; px < x + w - 4; px += 38) {
        const shardW = Math.min(26, x + w - px);
        paperPolygon([[px, y + capH], [px + shardW * 0.45, y + h - 3], [px + shardW, y + capH], [px + shardW * 0.62, y + 4]], theme.paper, null);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = theme.accent2;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + 4, y + capH); ctx.lineTo(x + w - 4, y + capH); ctx.stroke();
    } else if (family === "brass" || family === "metal") {
      const spacing = family === "brass" ? 34 : 42;
      ctx.fillStyle = family === "brass" ? theme.ink : theme.paper;
      ctx.globalAlpha *= family === "brass" ? 0.5 : 0.34;
      for (let px = x + 12; px < x + w - 6; px += spacing) {
        ctx.beginPath(); ctx.arc(px, y + Math.min(h - 6, capH + 8), 3.2, 0, Math.PI * 2); ctx.fill();
      }
      if (h > 34) {
        ctx.strokeStyle = family === "brass" ? theme.ink : theme.edge;
        ctx.lineWidth = 3;
        for (let px = x + 28; px < x + w; px += 86) {
          ctx.beginPath(); ctx.moveTo(px, y + capH + 5); ctx.lineTo(px, y + h - 6); ctx.stroke();
        }
      }
    } else if (family === "wood") {
      ctx.strokeStyle = theme.ink;
      ctx.globalAlpha *= 0.28;
      ctx.lineWidth = 3;
      for (let px = x + 45; px < x + w; px += 55) {
        ctx.beginPath(); ctx.moveTo(px, y + capH); ctx.lineTo(px - 4, y + h); ctx.stroke();
      }
      if (h > 36) {
        ctx.beginPath(); ctx.moveTo(x + 8, y + h * 0.55); ctx.lineTo(x + w - 8, y + h * 0.45); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = family === "volcanic" ? theme.accent : theme.paper;
      ctx.globalAlpha *= family === "volcanic" ? 0.42 : 0.12;
      ctx.lineWidth = 3;
      for (let px = x + 24; px < x + w - 12; px += 58) {
        const top = y + capH + 5 + mod(index + Math.floor(px / 20), 12);
        ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px + 12, Math.min(y + h - 5, top + 18)); ctx.lineTo(px + 3, Math.min(y + h - 3, top + 35)); ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    if (platform.type === "conveyor" || platform.conveyor) {
      ctx.fillStyle = theme.paper;
      ctx.globalAlpha = 0.62;
      for (let px = x + 15; px < x + w - 10; px += 42) {
        ctx.beginPath();
        ctx.moveTo(px, y + 13);
        ctx.lineTo(px + Math.sign(platform.conveyor || 1) * 12, y + 19);
        ctx.lineTo(px, y + 25);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (platform.fragile) {
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.22, y + 4);
      ctx.lineTo(x + w * 0.44, y + h * 0.7);
      ctx.lineTo(x + w * 0.67, y + 9);
      ctx.stroke();
    }
  }

  function renderHazards(theme) {
    runtime.hazards.forEach((hazard) => {
      if (!inCamera(hazard.x, hazard.w)) return;
      const type = String(hazard.type || "spikes").toLowerCase();
      if (type === "fall" || type.includes("star-void")) drawVoidHazard(hazard, theme, type.includes("star"));
      else if (type.includes("strong-current")) drawCurrentHazard(hazard, theme);
      else if (type.includes("thorn")) drawThornHazard(hazard, theme);
      else if (type.includes("crystal-spike")) drawSpikeHazard(hazard, theme, "crystal");
      else if (type.includes("stalactite")) drawStalactiteHazard(hazard, theme);
      else if (type.includes("saw") || type.includes("gear")) drawSawHazard(hazard, theme);
      else if (type.includes("steam")) drawSteamHazard(hazard, theme);
      else if (type.includes("urchin")) drawUrchinHazard(hazard, theme);
      else if (type.includes("electric")) drawElectricHazard(hazard, theme);
      else if (type.includes("lava") || type.includes("flame") || type === "fire") drawFireHazard(hazard, theme);
      else if (type.includes("void-rift")) drawRiftHazard(hazard, theme);
      else if (type.includes("falling-star")) drawFallingStarHazard(hazard, theme);
      else if (type.includes("slag")) drawSpikeHazard(hazard, theme, "slag");
      else drawSpikeHazard(hazard, theme, "paper");
    });
  }

  function drawVoidHazard(hazard, theme, stellar = false) {
    ctx.save();
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(hazard.x, hazard.y + hazard.h);
    for (let x = hazard.x; x <= hazard.x + hazard.w; x += 24) {
      ctx.lineTo(x, hazard.y + 7 + stableWave(x * 0.07, 6));
    }
    ctx.lineTo(hazard.x + hazard.w, hazard.y + hazard.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = stellar ? theme.edge : theme.accent;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.58;
    ctx.beginPath();
    ctx.moveTo(hazard.x, hazard.y + 8);
    for (let x = hazard.x; x <= hazard.x + hazard.w; x += 24) ctx.lineTo(x, hazard.y + 7 + stableWave(x * 0.07, 6));
    ctx.stroke();
    if (stellar) {
      ctx.fillStyle = theme.paper;
      for (let i = 0; i < Math.max(3, Math.floor(hazard.w / 60)); i += 1) {
        const px = hazard.x + 22 + mod(i * 61, Math.max(24, hazard.w - 30));
        const py = hazard.y + 16 + mod(i * 19, Math.max(12, hazard.h - 20));
        ctx.globalAlpha = 0.26;
        ctx.beginPath(); ctx.arc(px, py, 2 + i % 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawCurrentHazard(hazard, theme) {
    ctx.save();
    ctx.fillStyle = theme.accent2;
    ctx.globalAlpha = 0.08;
    ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
    const direction = Math.sign(Number(hazard.forceX) || 1);
    ctx.strokeStyle = theme.paper;
    ctx.fillStyle = theme.paper;
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = 3;
    for (let y = hazard.y + 28; y < hazard.y + hazard.h; y += 48) {
      const drift = mod(runtime.time * 40 + y, 90);
      for (let x = hazard.x - 60 + drift; x < hazard.x + hazard.w; x += 90) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + direction * 46, y + Math.sin(x * 0.04) * 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + direction * 46, y); ctx.lineTo(x + direction * 32, y - 8); ctx.lineTo(x + direction * 32, y + 8); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawThornHazard(hazard, theme) {
    ctx.save();
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hazard.x, hazard.y + hazard.h);
    for (let x = hazard.x; x <= hazard.x + hazard.w; x += 16) {
      ctx.lineTo(x, hazard.y + hazard.h * 0.64 + Math.sin(x * 0.08) * 6);
    }
    ctx.stroke();
    ctx.fillStyle = theme.danger;
    for (let x = hazard.x + 6; x < hazard.x + hazard.w; x += 18) {
      const tipY = hazard.y + 1 + mod(Math.floor(x), 7);
      paperPolygon([[x - 7, hazard.y + hazard.h * 0.68], [x, tipY], [x + 7, hazard.y + hazard.h * 0.68]], theme.danger, theme.ink, 2);
    }
    ctx.restore();
  }

  function drawSpikeHazard(hazard, theme, style) {
    const fill = style === "crystal" ? theme.accent2 : style === "slag" ? theme.ink : theme.danger;
    const inner = style === "crystal" ? theme.paper : style === "slag" ? theme.accent : theme.edge;
    ctx.save();
    for (let x = hazard.x; x < hazard.x + hazard.w; x += 26) {
      const right = Math.min(x + 26, hazard.x + hazard.w);
      const center = (x + right) / 2;
      paperPolygon([[x, hazard.y + hazard.h], [center, hazard.y], [right, hazard.y + hazard.h]], fill, theme.ink, 2.5);
      ctx.fillStyle = inner;
      ctx.globalAlpha = 0.34;
      ctx.beginPath(); ctx.moveTo(center, hazard.y + 4); ctx.lineTo(center, hazard.y + hazard.h - 4); ctx.lineTo(x + 4, hazard.y + hazard.h - 3); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawStalactiteHazard(hazard, theme) {
    ctx.save();
    paperPolygon([
      [hazard.x, hazard.y],
      [hazard.x + hazard.w, hazard.y],
      [hazard.x + hazard.w * 0.62, hazard.y + hazard.h * 0.76],
      [hazard.x + hazard.w * 0.5, hazard.y + hazard.h],
      [hazard.x + hazard.w * 0.34, hazard.y + hazard.h * 0.7],
    ], theme.far, theme.ink, 4);
    ctx.fillStyle = theme.paper;
    ctx.globalAlpha = 0.22;
    ctx.beginPath(); ctx.moveTo(hazard.x + hazard.w * 0.2, hazard.y + 8); ctx.lineTo(hazard.x + hazard.w * 0.49, hazard.y + hazard.h * 0.88); ctx.lineTo(hazard.x + hazard.w * 0.42, hazard.y + 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawSawHazard(hazard, theme) {
    const radius = Math.min(Number(hazard.radius) || 34, Math.max(hazard.w, hazard.h) * 0.5);
    const spin = runtime.time * (Number(hazard.angularSpeed) || 2.2);
    ctx.save();
    ctx.translate(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2);
    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.arc(0, 7, radius + 5, 0, Math.PI * 2); ctx.fill();
    drawGear(0, 0, radius, theme.edge, spin);
    ctx.fillStyle = theme.paper;
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawSteamHazard(hazard, theme) {
    const pulse = 0.72 + Math.sin(runtime.time * 5 + Number(hazard.phase || 0) * 3) * 0.16;
    ctx.save();
    ctx.fillStyle = theme.ink;
    ctx.fillRect(hazard.x + 5, hazard.y + hazard.h - 18, hazard.w - 10, 18);
    ctx.fillStyle = theme.edge;
    ctx.fillRect(hazard.x + 12, hazard.y + hazard.h - 13, hazard.w - 24, 5);
    ctx.globalAlpha = pulse;
    for (let y = hazard.y + hazard.h - 28, i = 0; y > hazard.y - 6; y -= 24, i += 1) {
      const px = hazard.x + hazard.w / 2 + Math.sin(runtime.time * 3 + i) * 8;
      drawPaperCloud(px, y, 0.2 + (i % 3) * 0.035, theme.paper, Math.max(0.12, pulse - i * 0.06));
    }
    ctx.restore();
  }

  function drawUrchinHazard(hazard, theme) {
    const radius = Math.min(hazard.w, hazard.h * 2) * 0.35;
    ctx.save();
    ctx.translate(hazard.x + hazard.w / 2, hazard.y + hazard.h * 0.72);
    ctx.fillStyle = theme.ink;
    for (let i = 0; i < 14; i += 1) {
      ctx.rotate(Math.PI * 2 / 14);
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(0, -radius * 1.45); ctx.lineTo(4, 0); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = theme.accent2;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.ink;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath(); ctx.arc(Math.cos(i * 2.1) * radius * 0.55, Math.sin(i * 2.1) * radius * 0.55, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawElectricHazard(hazard, theme) {
    ctx.save();
    ctx.fillStyle = theme.ink;
    ctx.fillRect(hazard.x, hazard.y + hazard.h - 12, hazard.w, 12);
    ctx.strokeStyle = theme.edge;
    ctx.lineWidth = 5;
    for (let x = hazard.x + 12; x < hazard.x + hazard.w; x += 22) {
      ctx.beginPath(); ctx.arc(x, hazard.y + hazard.h * 0.57, 9, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = theme.paper;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(hazard.x + 5, hazard.y + hazard.h * 0.42);
    for (let x = hazard.x + 12; x < hazard.x + hazard.w; x += 12) {
      ctx.lineTo(x, hazard.y + hazard.h * 0.42 + (Math.floor(x / 12) % 2 ? 11 : -10));
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawFireHazard(hazard, theme) {
    const lavaPool = String(hazard.type).toLowerCase() === "lava";
    const tall = !lavaPool && hazard.h > 80;
    ctx.save();
    if (lavaPool) {
      ctx.fillStyle = theme.danger;
      ctx.fillRect(hazard.x, hazard.y + 9, hazard.w, Math.max(0, hazard.h - 9));
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.34;
      for (let x = hazard.x + 24; x < hazard.x + hazard.w; x += 72) {
        ctx.beginPath(); ctx.ellipse(x, hazard.y + hazard.h * 0.58 + stableWave(x, 7), 22, 5, -0.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (let x = hazard.x; x < hazard.x + hazard.w; x += 28) {
        drawFlame(x + 14, hazard.y + 13, 19 + Math.sin(runtime.time * 5 + x) * 3, theme.danger, theme.edge);
      }
    } else if (tall) {
      ctx.fillStyle = theme.ink;
      ctx.fillRect(hazard.x + 6, hazard.y + hazard.h - 17, hazard.w - 12, 17);
      for (let y = hazard.y + hazard.h - 9, i = 0; y > hazard.y; y -= 28, i += 1) {
        drawFlame(hazard.x + hazard.w / 2 + Math.sin(runtime.time * 5 + i) * 6, y, 20 + i % 2 * 4, theme.danger, theme.edge);
      }
    } else {
      for (let x = hazard.x; x < hazard.x + hazard.w; x += 26) {
        drawFlame(x + 13, hazard.y + hazard.h, 24 + Math.sin(runtime.time * 5 + x) * 3, theme.danger, theme.edge);
      }
    }
    ctx.restore();
  }

  function drawRiftHazard(hazard, theme) {
    ctx.save();
    ctx.translate(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2);
    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.ellipse(0, 0, hazard.w * 0.5, hazard.h * 0.48, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = theme.accent2;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.72;
    ctx.beginPath(); ctx.ellipse(0, 0, hazard.w * 0.42, hazard.h * 0.31, Math.sin(runtime.time) * 0.12, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawFallingStarHazard(hazard, theme) {
    ctx.save();
    ctx.translate(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2);
    ctx.rotate(runtime.time * 1.2 + Number(hazard.phase || 0));
    drawStarShape(0, 0, Math.min(hazard.w, hazard.h) * 0.48, theme.edge, theme.ink);
    ctx.restore();
  }

  function renderDevices(theme) {
    runtime.crystals.forEach((crystal) => { if (inCamera(crystal.x, crystal.w)) drawCrystal(crystal.x + crystal.w / 2, crystal.y + crystal.h, crystal.active ? theme.edge : theme.far, crystal.active); });
    runtime.switches.forEach((device) => {
      if (!inCamera(device.x, device.w)) return;
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.beginPath(); ctx.roundRect(device.x - 4, device.y + device.h * 0.42, device.w + 8, device.h * 0.62, 7); ctx.fill();
      drawGear(device.x + device.w / 2, device.y + device.h / 2, 25, device.active ? theme.edge : theme.paper, runtime.time * (device.active ? 3 : 0.4));
      ctx.restore();
    });
    runtime.gates.filter(isGateActive).forEach((gate) => {
      if (!inCamera(gate.x, gate.w)) return;
      ctx.fillStyle = theme.ink;
      ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
      ctx.fillStyle = theme.edge;
      for (let y = gate.y + 12; y < gate.y + gate.h; y += 34) ctx.fillRect(gate.x + 6, y, gate.w - 12, 8);
      ctx.fillStyle = theme.paper;
      for (let y = gate.y + 18; y < gate.y + gate.h; y += 68) {
        ctx.beginPath(); ctx.arc(gate.x + gate.w / 2, y, 3, 0, Math.PI * 2); ctx.fill();
      }
    });
    runtime.valves.forEach((valve) => { if (inCamera(valve.x, valve.w)) drawValve(valve, theme); });
    runtime.mirrors.forEach((mirror) => { if (inCamera(mirror.x, mirror.w)) drawMirror(mirror, theme); });
    runtime.coolants.forEach((coolant) => { if (coolant.active && inCamera(coolant.x, coolant.w)) drawCoolantDevice(coolant, theme); });
    (runtime.devices.fans || []).forEach((fan, index) => { if (inCamera(Number(fan.x) || 0, Number(fan.w) || 90)) drawFanDevice(fan, theme, index); });

    if (runtime.devices.vent) {
      const vent = runtime.devices.vent;
      const active = runtime.valves.length > 0 && runtime.valves.every((valve) => valve.active);
      if (inCamera(vent.x, vent.w)) {
      ctx.fillStyle = theme.ink;
      ctx.fillRect(vent.x, vent.y, vent.w, vent.h);
      for (let x = vent.x + 18; x < vent.x + vent.w; x += 30) {
        ctx.fillStyle = active ? theme.edge : theme.far;
        ctx.fillRect(x, vent.y + 9, 10, vent.h - 18);
        if (active) {
          ctx.globalAlpha = 0.35 + Math.sin(runtime.time * 8 + x) * 0.12;
          ctx.fillRect(x - 6, vent.y - 80, 22, 82);
          ctx.globalAlpha = 1;
        }
      }
      }
    }
    if (runtime.devices.altar && inCamera(runtime.devices.altar.x, runtime.devices.altar.w || 200)) {
      const altar = runtime.devices.altar;
      ctx.fillStyle = theme.ink;
      ctx.fillRect(altar.x + 8, altar.y + 9, altar.w || 200, altar.h || 45);
      ctx.fillStyle = theme.ground;
      ctx.fillRect(altar.x, altar.y, altar.w || 200, altar.h || 45);
      ctx.strokeStyle = theme.edge;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(altar.x + (altar.w || 200) / 2, altar.y + 5, 28, Math.PI, Math.PI * 2); ctx.stroke();
    }
    if (currentLevel.id === 8 && runtime.mirrors.every((mirror) => mirror.active)) drawMirrorBeam(theme);
  }

  function drawCoolantDevice(coolant, theme) {
    const x = coolant.x + coolant.w / 2;
    const y = coolant.y + coolant.h / 2 + Math.sin(runtime.time * 3 + coolant.index) * 4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.18);
    paperPolygon([[-10, -19], [10, -19], [14, -11], [14, 12], [8, 19], [-8, 19], [-14, 12], [-14, -11]], theme.accent2, theme.ink, 3);
    ctx.fillStyle = theme.paper;
    ctx.globalAlpha = 0.68;
    ctx.fillRect(-7, -11, 5, 22);
    ctx.fillStyle = theme.edge;
    ctx.fillRect(-9, -23, 18, 6);
    ctx.restore();
  }

  function drawFanDevice(fan, theme, index) {
    const x = Number(fan.x) || 0;
    const y = Number(fan.y) || 0;
    const size = Number(fan.size || fan.radius) || 42;
    ctx.save();
    ctx.translate(x + size, y + size);
    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.arc(0, 0, size + 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.ground;
    ctx.beginPath(); ctx.arc(0, 0, size + 2, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(runtime.time * (4 + index * 0.25));
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = i % 2 ? theme.edge : theme.paper;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.quadraticCurveTo(size * 0.62, -size * 0.46, size * 0.78, -5);
      ctx.quadraticCurveTo(size * 0.56, size * 0.18, 7, 6);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = theme.accent;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function renderCollectibles(theme) {
    runtime.collectibles.forEach((item) => {
      if (!item.collected && isBossSpawnAvailable(item) && inCamera(item.x, item.w, 80)) {
        drawCollectible(item, theme);
      }
    });
  }

  function drawCollectibleBadge(type, theme) {
    const effect = COLLECTIBLE_EFFECTS[type];
    if (!effect?.badge) return;
    const fill = effect.mode === "health" ? theme.danger
      : effect.mode === "quest" || effect.mode === "boss-core" || effect.mode === "rune" ? theme.edge
        : effect.mode === "timed" ? theme.accent2
          : effect.mode === "charges" ? theme.accent
            : theme.paper;
    ctx.save();
    ctx.translate(21, -24);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = fill;
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 2;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeRect(-10, -10, 20, 20);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = effect.mode === "memory" ? theme.ink : theme.paper;
    ctx.font = '900 11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(effect.badge, 0, 0.5);
    ctx.restore();
  }

  function drawCollectible(item, theme) {
    const type = String(item.type || "memory-seed").toLowerCase();
    const x = item.x + item.w / 2;
    const y = item.y + item.h / 2 + Math.sin(runtime.time * 3 + item.t) * 7;
    const pulse = 1 + Math.sin(runtime.time * 4 + item.t) * 0.06;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = theme.paper;
    ctx.globalAlpha = 0.1;
    ctx.beginPath(); ctx.arc(0, 1, 23, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    const spriteFrame = PROCEDURAL_COLLECTIBLE_TYPES.has(type) ? null : frameSpec("collectibleFrames", type, DEFAULT_COLLECTIBLE_FRAMES[type]);
    if (spriteFrame) {
      const spriteW = Number(spriteFrame.drawW) || 64;
      const spriteH = Number(spriteFrame.drawH) || 80;
      if (drawAtlasFrame(spriteFrame, 0, 0, spriteW, spriteH, { anchorX: 0.5, anchorY: Number(spriteFrame.anchorY ?? 0.5) })) {
        drawCollectibleBadge(type, theme);
        ctx.restore();
        return;
      }
    }

    if (type.includes("memory-seed") || type === "seed") {
      drawSeed(0, 0, theme.edge, runtime.time + item.t);
    } else if (type === "heart") {
      drawHeartShape(0, 1, 15, theme.danger, theme.ink);
      ctx.fillStyle = theme.paper;
      ctx.globalAlpha = 0.48;
      ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI * 2); ctx.fill();
    } else if (type.includes("feather")) {
      ctx.rotate(-0.55 + Math.sin(runtime.time * 2 + item.t) * 0.08);
      ctx.fillStyle = theme.paper;
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-2, 18);
      ctx.quadraticCurveTo(-19, -1, 5, -20);
      ctx.quadraticCurveTo(23, -4, -2, 18);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = theme.accent2;
      ctx.beginPath(); ctx.moveTo(-4, 17); ctx.lineTo(8, -15); ctx.stroke();
    } else if (type.includes("resonance-orb")) {
      drawOrb(0, 0, 15, theme.accent2, theme.paper);
      ctx.strokeStyle = theme.edge;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.65;
      ctx.beginPath(); ctx.arc(0, 0, 21, runtime.time, runtime.time + Math.PI * 1.35); ctx.stroke();
    } else if (type.includes("crystal-crown")) {
      paperPolygon([[-17, 11], [-15, -10], [-6, 0], [0, -17], [7, 0], [17, -11], [15, 11]], theme.accent2, theme.ink, 3);
      ctx.fillStyle = theme.paper;
      ctx.fillRect(-11, 5, 22, 4);
    } else if (type.includes("spring")) {
      drawGear(0, 0, 16, theme.edge, runtime.time * 1.4);
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 1.7); ctx.stroke();
    } else if (type.includes("coolant")) {
      ctx.rotate(0.22);
      paperPolygon([[-9, -18], [9, -18], [13, -11], [13, 12], [7, 18], [-7, 18], [-13, 12], [-13, -11]], theme.accent2, theme.ink, 3);
      ctx.fillStyle = theme.paper;
      ctx.globalAlpha = 0.72;
      ctx.fillRect(-7, -10, 5, 21);
      ctx.fillStyle = theme.edge;
      ctx.fillRect(-8, -22, 16, 6);
    } else if (type.includes("core")) {
      ctx.strokeStyle = theme.edge;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(0, 0, 20, runtime.time, runtime.time + Math.PI * 1.55); ctx.stroke();
      ctx.globalAlpha = 1;
      paperPolygon([[0, -15], [13, -3], [8, 14], [-8, 14], [-13, -3]], theme.accent, theme.ink, 3);
      ctx.fillStyle = theme.paper;
      ctx.beginPath(); ctx.arc(-3, -4, 4, 0, Math.PI * 2); ctx.fill();
    } else if (type.includes("tide-rune")) {
      paperPolygon([[0, -18], [17, 0], [0, 18], [-17, 0]], theme.accent2, theme.ink, 3);
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 2, 9, Math.PI * 0.15, Math.PI * 1.35); ctx.stroke();
    } else if (type.includes("pearl")) {
      ctx.fillStyle = theme.paper;
      ctx.strokeStyle = theme.accent2;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = theme.edge;
      ctx.globalAlpha = 0.46;
      ctx.beginPath(); ctx.arc(-5, -5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(16, -15, 3, 0, Math.PI * 2); ctx.fill();
    } else if (type.includes("wings")) {
      ctx.fillStyle = theme.paper;
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(-14, -1, 13, 7, -0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(14, -1, 13, 7, 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = theme.accent;
      ctx.fillRect(-9, -8, 18, 19);
      ctx.strokeStyle = theme.ink;
      ctx.strokeRect(-9, -8, 18, 19);
    } else if (type.includes("bell")) {
      ctx.fillStyle = theme.edge;
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-14, 10); ctx.quadraticCurveTo(-8, -17, 0, -18); ctx.quadraticCurveTo(9, -17, 14, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = theme.ink;
      ctx.beginPath(); ctx.arc(0, 13, 4, 0, Math.PI * 2); ctx.fill();
    } else if (type.includes("seal")) {
      const points = [];
      for (let i = 0; i < 6; i += 1) points.push([Math.cos(i * Math.PI / 3) * 17, Math.sin(i * Math.PI / 3) * 17]);
      paperPolygon(points, theme.danger, theme.ink, 3);
      drawStarShape(0, 0, 8, theme.edge, null, 5);
    } else if (type.includes("star")) {
      drawStarShape(0, 0, 18, theme.edge, theme.ink, 5);
      ctx.fillStyle = theme.paper;
      ctx.beginPath(); ctx.arc(-3, -3, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      drawSeed(0, 0, theme.edge, runtime.time + item.t);
    }
    drawCollectibleBadge(type, theme);
    ctx.restore();
  }

  function drawHeartShape(x, y, size, fill, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.bezierCurveTo(-size * 1.25, size * 0.28, -size * 1.05, -size * 0.75, -size * 0.43, -size * 0.72);
    ctx.bezierCurveTo(-size * 0.12, -size * 0.7, 0, -size * 0.42, 0, -size * 0.18);
    ctx.bezierCurveTo(0, -size * 0.42, size * 0.12, -size * 0.7, size * 0.43, -size * 0.72);
    ctx.bezierCurveTo(size * 1.05, -size * 0.75, size * 1.25, size * 0.28, 0, size);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  }

  function drawStarShape(x, y, radius, fill, stroke, points = 6) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const r = i % 2 ? radius * 0.43 : radius;
      const angle = -Math.PI / 2 + i * Math.PI / points;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  }

  function renderCheckpoints(theme) {
    runtime.checkpoints.forEach((point) => {
      ctx.fillStyle = theme.ink;
      ctx.fillRect(point.x, point.y - 94, 8, 94);
      ctx.fillStyle = point.active ? theme.edge : theme.paper;
      paperPolygon([[point.x + 8, point.y - 92], [point.x + 62, point.y - 72], [point.x + 8, point.y - 52]], point.active ? theme.edge : theme.paper, theme.ink, 3);
      if (point.active) drawOrb(point.x + 8, point.y - 74, 8 + Math.sin(runtime.time * 4) * 2, theme.edge, theme.paper);
    });
  }

  function renderGoal(theme) {
    if (currentLevel.isBoss) return;
    const goal = currentLevel.goal;
    if (!inCamera(goal.x, goal.w, 100)) return;
    ctx.save();
    ctx.translate(goal.x + goal.w / 2, goal.y + goal.h / 2);
    ctx.rotate(Math.sin(runtime.time * 0.7) * 0.035);
    ctx.fillStyle = theme.ink;
    ctx.beginPath();
    ctx.roundRect(-goal.w / 2 - 6, -goal.h / 2 + 5, goal.w + 12, goal.h + 8, 12);
    ctx.fill();
    ctx.fillStyle = theme.edge;
    ctx.beginPath();
    ctx.roundRect(-goal.w / 2 + 4, -goal.h / 2 + 8, goal.w - 8, goal.h - 12, 9);
    ctx.fill();
    const portal = ctx.createRadialGradient(0, 4, 4, 0, 4, goal.w * 0.42);
    portal.addColorStop(0, theme.paper);
    portal.addColorStop(0.34, theme.accent2);
    portal.addColorStop(1, theme.mid);
    ctx.fillStyle = portal;
    ctx.beginPath();
    ctx.ellipse(0, 4, goal.w * 0.31, goal.h * 0.37, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = theme.paper;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 4, goal.w * 0.23, goal.h * 0.3, Math.sin(runtime.time) * 0.08, runtime.time * 0.22, runtime.time * 0.22 + Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = theme.ink;
    for (let i = 0; i < 6; i += 1) {
      const angle = i / 6 * Math.PI * 2 + runtime.time * 0.08;
      const px = Math.cos(angle) * goal.w * 0.39;
      const py = Math.sin(angle) * goal.h * 0.43;
      ctx.save(); ctx.translate(px, py); ctx.rotate(angle); ctx.fillRect(-3, -7, 6, 14); ctx.restore();
    }
    ctx.restore();
  }

  function renderWaterAndLava(theme) {
    if (runtime.devices.water) {
      ctx.save();
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = theme.skyTop;
      ctx.beginPath();
      ctx.moveTo(cameraX, runtime.waterY);
      for (let x = cameraX; x < cameraX + VIEW_W + 80; x += 40) ctx.lineTo(x, runtime.waterY + Math.sin(x * 0.035 + runtime.time * 3) * 9);
      ctx.lineTo(cameraX + VIEW_W + 80, VIEW_H + 60); ctx.lineTo(cameraX, VIEW_H + 60); ctx.closePath(); ctx.fill();
      if (paperPattern) {
        ctx.save();
        ctx.globalCompositeOperation = "soft-light";
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = paperPattern;
        ctx.fillRect(cameraX, runtime.waterY, VIEW_W + 80, VIEW_H - runtime.waterY + 60);
        ctx.restore();
      }
      ctx.strokeStyle = theme.edge; ctx.lineWidth = 5; ctx.globalAlpha = 0.86; ctx.stroke();
      ctx.strokeStyle = theme.paper; ctx.lineWidth = 2; ctx.globalAlpha = 0.42; ctx.translate(0, -5); ctx.stroke();
      ctx.restore();
    }
    if (runtime.devices.lava) {
      ctx.save();
      ctx.fillStyle = theme.accent;
      ctx.beginPath(); ctx.moveTo(cameraX, runtime.lavaY);
      for (let x = cameraX; x < cameraX + VIEW_W + 100; x += 32) ctx.lineTo(x, runtime.lavaY + Math.sin(x * 0.05 + runtime.time * 5) * 8);
      ctx.lineTo(cameraX + VIEW_W + 100, VIEW_H + 80); ctx.lineTo(cameraX, VIEW_H + 80); ctx.closePath(); ctx.fill();
      if (paperPattern) {
        ctx.save();
        ctx.globalCompositeOperation = "soft-light";
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = paperPattern;
        ctx.fillRect(cameraX, runtime.lavaY, VIEW_W + 100, VIEW_H - runtime.lavaY + 80);
        ctx.restore();
      }
      ctx.fillStyle = theme.edge; ctx.globalAlpha = 0.7;
      for (let x = cameraX + 20; x < cameraX + VIEW_W; x += 80) ctx.beginPath(), ctx.arc(x, runtime.lavaY + Math.sin(x + runtime.time) * 12, 6, 0, Math.PI * 2), ctx.fill();
      ctx.restore();
    }
  }

  function renderForeground(theme) {
    ctx.save();
    const id = currentLevel.id;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = theme.ink;
    if (id === 1 || id === 3) {
      for (let i = 0; i < 12; i += 1) {
        const x = mod(i * 151 - cameraX * 0.52, VIEW_W + 180) - 90;
        const height = 38 + (i % 5) * 24;
        ctx.beginPath();
        ctx.moveTo(x - 16, VIEW_H);
        ctx.quadraticCurveTo(x - 7, VIEW_H - height, x + Math.sin(runtime.time + i) * 5, VIEW_H - height - 24);
        ctx.quadraticCurveTo(x + 8, VIEW_H - height, x + 22, VIEW_H);
        ctx.fill();
        if (id === 3 && i % 3 === 0) {
          ctx.globalAlpha = 0.16;
          drawGear(x + 4, VIEW_H - height, 14, theme.edge, runtime.time * 0.2 + i);
          ctx.globalAlpha = 0.22;
        }
      }
    } else if (id === 2) {
      for (let i = 0; i < 10; i += 1) {
        const x = mod(i * 177 - cameraX * 0.5, VIEW_W + 160) - 80;
        const h = 50 + (i % 4) * 32;
        paperPolygon([[x - 22, VIEW_H], [x, VIEW_H - h], [x + 18, VIEW_H]], i % 2 ? theme.ink : theme.far, null);
        ctx.fillStyle = theme.ink;
      }
    } else if (id === 4 || id === 6) {
      ctx.lineWidth = id === 4 ? 18 : 7;
      ctx.strokeStyle = theme.ink;
      for (let i = 0; i < 7; i += 1) {
        const x = mod(i * 235 - cameraX * 0.55, VIEW_W + 220) - 110;
        const h = 45 + (i % 3) * 42;
        ctx.beginPath(); ctx.moveTo(x, VIEW_H + 10); ctx.lineTo(x, VIEW_H - h); ctx.lineTo(x + 45, VIEW_H - h - 20); ctx.stroke();
        if (id === 4) {
          ctx.fillStyle = theme.edge;
          ctx.beginPath(); ctx.arc(x, VIEW_H - h, 8, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (id === 5) {
      for (let i = 0; i < 13; i += 1) {
        const x = mod(i * 127 - cameraX * 0.52, VIEW_W + 140) - 70;
        const h = 44 + (i % 5) * 18;
        ctx.beginPath(); ctx.moveTo(x - 8, VIEW_H); ctx.quadraticCurveTo(x + 12, VIEW_H - h * 0.6, x, VIEW_H - h); ctx.quadraticCurveTo(x - 12, VIEW_H - h * 0.55, x + 13, VIEW_H); ctx.fill();
        ctx.fillStyle = i % 3 ? theme.ink : theme.accent2;
      }
    } else if (id === 7) {
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 9;
      for (let i = 0; i < 8; i += 1) {
        const x = mod(i * 190 - cameraX * 0.53, VIEW_W + 170) - 85;
        ctx.beginPath();
        for (let y = VIEW_H - 120 - (i % 3) * 35; y < VIEW_H + 20; y += 18) ctx.arc(x + Math.sin(y * 0.12) * 4, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 13;
      for (let i = 0; i < 6; i += 1) {
        const x = mod(i * 260 - cameraX * 0.48, VIEW_W + 240) - 120;
        ctx.beginPath(); ctx.moveTo(x - 50, VIEW_H); ctx.lineTo(x - 50, VIEW_H - 95); ctx.quadraticCurveTo(x, VIEW_H - 158, x + 50, VIEW_H - 95); ctx.lineTo(x + 50, VIEW_H); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function renderDarkness(theme) {
    if (!runtime.devices.darkness || !player) return;
    const px = player.x - cameraX + player.w / 2;
    const py = player.y + player.h / 2;
    const gradient = ctx.createRadialGradient(px, py, 105, px, py, 335);
    gradient.addColorStop(0, "rgba(3,10,20,0)");
    gradient.addColorStop(0.58, "rgba(3,10,20,0.28)");
    gradient.addColorStop(1, "rgba(3,10,20,0.84)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    runtime.crystals.filter((crystal) => crystal.active).forEach((crystal) => {
      const x = crystal.x - cameraX + crystal.w / 2;
      const y = crystal.y + crystal.h / 2;
      const glow = ctx.createRadialGradient(x, y, 10, x, y, 120);
      glow.addColorStop(0, "rgba(113,199,212,0.2)");
      glow.addColorStop(1, "rgba(113,199,212,0)");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = glow;
      ctx.fillRect(x - 130, y - 130, 260, 260);
      ctx.globalCompositeOperation = "source-over";
    });
  }

  function drawHero(x, feetY, scale, facing, vx, theme, time, state = {}) {
    if (state.invulnerable > 0 && Math.floor(state.invulnerable * 16) % 2 === 0) return;
    const running = Math.min(1, Math.abs(vx || 0) / 260);
    const bob = Math.sin(time * (running ? 13 : 3)) * (running ? 3 : 1.8);
    const stretch = state.dashTime > 0 ? 1.18 : 1;
    const squash = state.onGround === false && state.vy > 350 ? 0.92 : 1;
    let action = "idle";
    if (state.invulnerable > 0) action = "hurt";
    else if (state.dashTime > 0) action = "dash";
    else if (state.downstrike) action = "downstrike";
    else if (state.onGround === false && Number(state.vy) < 0) action = "jump";
    else if (state.onGround === false && Number(state.vy) >= 0) action = "fall";
    else if (running > 0.08) action = Math.floor(time * 10) % 2 ? "runContact" : "runPassing";

    const frame = frameSpec("heroFrames", action, DEFAULT_HERO_FRAMES[action]);
    if (frame) {
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = state.onGround === false ? 0.08 : 0.2;
      ctx.beginPath(); ctx.ellipse(x, feetY + 2, 26 * scale, 7 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const width = (Number(frame.drawW) || 126) * scale * stretch;
      const height = (Number(frame.drawH) || 168) * scale * squash;
      if (drawAtlasFrame(frame, x, feetY + bob, width, height, { flipX: facing < 0, anchorX: 0.5, anchorY: Number(frame.anchorY ?? 0.9) })) return;
    }

    drawFallbackHero(x, feetY, scale, facing, vx, theme, time, state, running, bob, stretch, squash);
  }

  function drawFallbackHero(x, feetY, scale, facing, vx, theme, time, state, running, bob, stretch, squash) {
    ctx.save();
    ctx.translate(x, feetY + bob);
    ctx.scale(facing * scale * stretch, scale * squash);
    if (state.downstrike) ctx.rotate(-0.15 * facing);
    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.ellipse(-4, -22, 23, 28, -0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.accent;
    ctx.beginPath(); ctx.moveTo(-16, -28); ctx.quadraticCurveTo(-39, -7, -23, 9); ctx.lineTo(5, -7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = theme.paper;
    ctx.beginPath(); ctx.ellipse(2, -29, 18, 21, 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.ellipse(9, -31, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.edge;
    ctx.beginPath(); ctx.ellipse(-5, -51, 8, 18, -0.65, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, -54, 7, 17, 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -45); ctx.quadraticCurveTo(1, -58, 0, -66); ctx.stroke();
    const leg = Math.sin(time * 13) * running * 8;
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-10 + leg, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(7 - leg, 2); ctx.stroke();
    ctx.restore();
  }

  function drawEnemy(enemy, theme) {
    const type = String(enemy.type || "");
    const frame = frameSpec("enemyFrames", type, DEFAULT_ENEMY_FRAMES[type]);
    if (frame) {
      const scale = clamp(Math.max(enemy.w / 46, enemy.h / 42), 0.82, 1.55);
      const flying = isFlyingEnemy(type) || ["kite-mite", "paper-jelly", "orbit-eye"].includes(type);
      const bob = flying ? Math.sin(enemy.t * 6.5) * 5 : Math.sin(enemy.t * 8) * 1.4;
      const width = (Number(frame.drawW) || 126) * scale;
      const height = (Number(frame.drawH) || 164) * scale;
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = flying ? 0.08 : 0.18;
      ctx.beginPath(); ctx.ellipse(enemy.x + enemy.w / 2, enemy.y + enemy.h + 3, 22 * scale, 6 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (drawAtlasFrame(frame, enemy.x + enemy.w / 2, enemy.y + enemy.h + bob, width, height, { flipX: enemy.vx < 0, anchorX: 0.5, anchorY: Number(frame.anchorY ?? 0.85) })) return;
    }

    drawFallbackEnemy(enemy, theme);
  }

  function drawFallbackEnemy(enemy, theme) {
    ctx.save();
    ctx.translate(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    if (isFlyingEnemy(enemy.type)) {
      const flap = Math.sin(enemy.t * 13) * 0.4;
      ctx.fillStyle = theme.paper;
      ctx.beginPath(); ctx.ellipse(-19, 0, 19, 11, flap, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(19, 0, 19, 11, -flap, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.ellipse(0, 1, 12, 18, 0, 0, Math.PI * 2); ctx.fill();
    } else if (isTurretEnemy(enemy.type)) {
      drawGear(0, 0, 21, theme.accent, enemy.t);
      ctx.fillStyle = theme.ink; ctx.fillRect(-5, -31, 26, 12);
    } else {
      ctx.fillStyle = theme.ink;
      ctx.beginPath(); ctx.ellipse(0, 4, enemy.w * 0.48, enemy.h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = theme.accent;
      ctx.beginPath(); ctx.ellipse(0, 0, enemy.w * 0.39, enemy.h * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = theme.paper;
      ctx.beginPath(); ctx.arc(enemy.vx > 0 ? 8 : -8, -3, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = theme.ink;
      ctx.beginPath(); ctx.arc(enemy.vx > 0 ? 9 : -9, -3, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = theme.ink; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-12, 16); ctx.lineTo(-16, 23); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, 16); ctx.lineTo(16, 23); ctx.stroke();
    }
    ctx.restore();
  }

  function drawBoss(boss, theme) {
    let frameName;
    if (currentLevel.id === 4) {
      if (boss.hitFlash > 0) frameName = "boilerFrozenHit";
      else if (boss.vulnerable > 0) frameName = "boilerCoreOpen";
      else if (boss.state === "telegraph" || boss.state === "charge") frameName = "boilerCharge";
      else frameName = "boilerNormal";
    } else {
      if (boss.vulnerable > 0) frameName = "eclipseCoreExposed";
      else if (boss.hitFlash > 0) frameName = "eclipseShieldBreak";
      else if (boss.state === "beam-stun") frameName = "eclipseBeamCharge";
      else frameName = "eclipseNormal";
    }
    const frame = frameSpec("bossFrames", frameName, DEFAULT_BOSS_FRAMES[frameName]);
    if (frame) {
      const centerX = boss.x + boss.w / 2;
      const feetY = boss.y + boss.h;
      const width = Number(frame.drawW) || (currentLevel.id === 4 ? 250 : 260);
      const height = Number(frame.drawH) || (currentLevel.id === 4 ? 315 : 340);
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.ellipse(centerX, feetY + 5, boss.w * 0.66, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const jitter = boss.state === "telegraph" ? Math.sin(runtime.time * 48) * 4 : 0;
      if (drawAtlasFrame(frame, centerX + jitter, feetY, width, height, { flipX: currentLevel.id === 4 && boss.vx < 0, anchorX: 0.5, anchorY: Number(frame.anchorY ?? 0.9) })) return;
    }

    ctx.save();
    ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
    if (boss.state === "telegraph") ctx.translate(Math.sin(runtime.time * 48) * 4, 0);
    if (boss.hitFlash > 0) ctx.globalAlpha = 0.45 + Math.sin(boss.hitFlash * 70) * 0.35;
    if (currentLevel.id === 4) {
      drawBoilerBossFallback(boss, theme);
    } else {
      drawEclipseBossFallback(boss, theme);
    }
    ctx.restore();
  }

  function drawBoilerBossFallback(boss, theme) {
    ctx.scale(boss.vx < 0 ? -1 : 1, 1);
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha *= 0.32;
    ctx.beginPath(); ctx.ellipse(8, boss.h * 0.48, boss.w * 0.58, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    for (let i = -1; i <= 1; i += 1) {
      const y = i * 27;
      ctx.beginPath(); ctx.moveTo(-39, y); ctx.lineTo(-67, y + 10); ctx.lineTo(-82, y + 28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(39, y); ctx.lineTo(68, y + 9); ctx.lineTo(82, y + 27); ctx.stroke();
      ctx.fillStyle = theme.edge;
      ctx.beginPath(); ctx.arc(-67, y + 10, 5, 0, Math.PI * 2); ctx.arc(68, y + 9, 5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.ellipse(0, 0, boss.w * 0.56, boss.h * 0.54, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.ground;
    ctx.beginPath(); ctx.ellipse(-7, -1, boss.w * 0.46, boss.h * 0.43, -0.05, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.accent;
    ctx.beginPath(); ctx.ellipse(-18, -5, boss.w * 0.32, boss.h * 0.36, -0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = 0.28;
    ctx.beginPath(); ctx.ellipse(-24, 7, boss.w * 0.22, boss.h * 0.22, -0.12, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(1, -46); ctx.lineTo(1, 45); ctx.stroke();
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillStyle = theme.paper;
      ctx.beginPath(); ctx.arc(-25, i * 23, 4.2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.strokeStyle = theme.accent2;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(18, 2, 27, -1.25, 1.28); ctx.stroke();
    ctx.fillStyle = boss.vulnerable > 0 ? theme.edge : theme.danger;
    ctx.beginPath(); ctx.arc(17, 3, 19 + (boss.vulnerable > 0 ? Math.sin(runtime.time * 8) * 3 : 0), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.paper;
    ctx.beginPath(); ctx.arc(12, -3, 6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.moveTo(-45, -28); ctx.lineTo(-84, -58); ctx.lineTo(-61, -7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = theme.edge;
    ctx.beginPath(); ctx.moveTo(-48, 18); ctx.lineTo(-88, 43); ctx.lineTo(-54, 49); ctx.closePath(); ctx.fill();
    ctx.fillStyle = theme.paper;
    for (let i = 0; i < 7; i += 1) {
      const angle = i / 7 * Math.PI * 2;
      ctx.beginPath(); ctx.arc(Math.cos(angle) * 49, Math.sin(angle) * 39, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawEclipseBossFallback(boss, theme) {
    const pulse = 1 + Math.sin(runtime.time * 4) * 0.045;
    ctx.scale(pulse, pulse);
    ctx.save();
    ctx.rotate(runtime.time * 0.28);
    ctx.strokeStyle = theme.edge;
    ctx.lineWidth = 7;
    ctx.globalAlpha = 0.74;
    ctx.beginPath(); ctx.ellipse(0, 0, boss.w * 0.78, boss.h * 0.48, -0.25, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = theme.accent2;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, 0, boss.w * 0.61, boss.h * 0.64, 0.52, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const angle = i / 6 * Math.PI * 2;
      ctx.save();
      ctx.translate(Math.cos(angle) * boss.w * 0.75, Math.sin(angle) * boss.h * 0.47);
      ctx.rotate(-runtime.time * 0.28 - angle);
      paperPolygon([[-10, 0], [0, -16], [10, 0], [0, 16]], i % 2 ? theme.edge : theme.accent2, theme.ink, 2);
      ctx.restore();
    }
    ctx.restore();

    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.ellipse(0, 0, boss.w * 0.54, boss.h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = theme.ground;
    ctx.lineWidth = 11;
    ctx.beginPath(); ctx.arc(0, 0, boss.w * 0.43, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = theme.edge;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.72;
    ctx.beginPath(); ctx.arc(0, 0, boss.w * 0.34, -1.1, 1.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, boss.w * 0.34, 2.05, 4.9); ctx.stroke();
    ctx.globalAlpha = 1;

    const coreColor = boss.vulnerable > 0 ? theme.edge : theme.accent2;
    paperPolygon([[0, -42], [31, -2], [22, 37], [0, 50], [-22, 37], [-31, -2]], coreColor, theme.ink, 5);
    ctx.fillStyle = theme.paper;
    ctx.beginPath(); ctx.ellipse(-13, -12, 6, 11, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(13, -12, 6, 11, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.arc(-11, -10, 2.6, 0, Math.PI * 2); ctx.arc(11, -10, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = theme.paper;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.42;
    ctx.beginPath(); ctx.arc(0, 10, 16, 0.15, Math.PI - 0.15); ctx.stroke();
  }

  function drawValve(valve, theme) {
    ctx.save(); ctx.translate(valve.x + valve.w / 2, valve.y + valve.h / 2);
    ctx.fillStyle = theme.ink; ctx.fillRect(-20, -15, 40, 48);
    drawGear(0, -15, 24, valve.active ? theme.edge : theme.paper, runtime.time * (valve.active ? 4 : 0));
    if (valve.active) { ctx.fillStyle = theme.edge; ctx.globalAlpha = 0.28; ctx.fillRect(-12, -80, 24, 65); }
    ctx.restore();
  }

  function drawMirror(mirror, theme) {
    ctx.save(); ctx.translate(mirror.x + mirror.w / 2, mirror.y + mirror.h / 2);
    ctx.rotate(mirror.index ? -0.25 : 0.25);
    ctx.fillStyle = theme.ink; ctx.fillRect(-28, -44, 56, 88);
    ctx.fillStyle = mirror.active ? theme.edge : theme.paper; ctx.fillRect(-20, -36, 40, 66);
    ctx.strokeStyle = theme.accent; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-14, 18); ctx.lineTo(12, -23); ctx.stroke();
    ctx.restore();
  }

  function drawMirrorBeam(theme) {
    if (!runtime.boss) return;
    const left = runtime.mirrors[0];
    const right = runtime.mirrors[1];
    const bx = runtime.boss.x + runtime.boss.w / 2;
    const by = runtime.boss.y + runtime.boss.h / 2;
    ctx.save();
    ctx.strokeStyle = theme.edge; ctx.lineWidth = 7; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(left.x + left.w / 2, 40); ctx.lineTo(left.x + left.w / 2, left.y + 15); ctx.lineTo(bx, by); ctx.lineTo(right.x + right.w / 2, right.y + 15); ctx.lineTo(right.x + right.w / 2, 40); ctx.stroke();
    ctx.strokeStyle = theme.paper; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function drawShockwave(wave, theme) {
    ctx.save();
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = wave.telegraph && wave.life > wave.telegraph ? 0.2 : 0.82;
    ctx.fillRect(wave.x, wave.y, wave.w, wave.h);
    ctx.fillStyle = theme.edge;
    for (let x = wave.x; x < wave.x + wave.w; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, wave.y); ctx.lineTo(x + 12, wave.y - 18); ctx.lineTo(x + 24, wave.y); ctx.fill();
    }
    ctx.restore();
  }

  function drawParticle(particle) {
    ctx.save();
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.life * 7);
    if (particle.shape === "leaf") {
      ctx.fillStyle = currentLevel?.theme?.ink || "#071c27";
      ctx.beginPath(); ctx.ellipse(1.5, 1.5, particle.size + 1, particle.size * 0.42 + 1, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.ellipse(0, 0, particle.size, particle.size * 0.38, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = currentLevel?.theme?.paper || "#f4edda";
      ctx.lineWidth = 1.2;
      ctx.globalAlpha *= 0.55;
      ctx.beginPath(); ctx.moveTo(-particle.size * 0.65, particle.size * 0.18); ctx.lineTo(particle.size * 0.62, -particle.size * 0.17); ctx.stroke();
    } else if (particle.shape === "dash") {
      ctx.fillStyle = particle.color;
      paperPolygon([[-particle.size * 2.4, -1], [particle.size * 2.1, -2.8], [particle.size * 2.5, 0], [particle.size * 2.1, 2.8], [-particle.size * 2.4, 1]], particle.color, null);
    } else if (particle.shape === "shard") {
      paperPolygon([[0, -particle.size], [particle.size * 0.48, 0], [0, particle.size], [-particle.size * 0.38, 0]], particle.color, currentLevel?.theme?.ink, 1.5);
    } else if (particle.shape === "star") {
      drawStarShape(0, 0, particle.size, particle.color, null, 5);
    } else {
      const ink = currentLevel?.theme?.ink || "#071c27";
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.arc(1.5, 1.5, particle.size + 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.arc(0, 0, particle.size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = currentLevel?.theme?.paper || "#f4edda";
      ctx.globalAlpha *= 0.45;
      ctx.beginPath(); ctx.arc(-particle.size * 0.28, -particle.size * 0.28, Math.max(1, particle.size * 0.24), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawSun(x, y, radius, color, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawPaperCloud(x, y, scale, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(-36, 5, 42, 20, 0, 0, Math.PI * 2); ctx.ellipse(0, -6, 48, 30, 0, 0, Math.PI * 2); ctx.ellipse(45, 7, 39, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawWindmill(x, y, scale, theme, time) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = theme.ink; ctx.beginPath(); ctx.moveTo(-36, 220); ctx.lineTo(-20, 12); ctx.lineTo(20, 12); ctx.lineTo(42, 220); ctx.closePath(); ctx.fill();
    ctx.fillStyle = theme.paper; ctx.fillRect(-11, 52, 22, 88);
    ctx.rotate(time * 0.38);
    for (let i = 0; i < 4; i += 1) { ctx.rotate(Math.PI / 2); paperPolygon([[7, 0], [32, -10], [118, -30], [126, 6], [31, 13]], theme.edge, theme.ink, 4); }
    ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawCrystalCathedral(x, y, theme) {
    ctx.save(); ctx.translate(x, y);
    for (let i = -3; i <= 3; i += 1) {
      const height = 100 + (3 - Math.abs(i)) * 62;
      paperPolygon([[i * 55 - 28, 250], [i * 55, 250 - height], [i * 55 + 28, 250]], i % 2 ? theme.far : theme.edge, theme.ink, 5);
    }
    ctx.fillStyle = theme.paper; ctx.globalAlpha = 0.18; ctx.fillRect(-210, 250, 420, 24); ctx.restore();
  }

  function drawGreenhouseClock(x, y, theme, time) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = theme.paper; ctx.lineWidth = 12; ctx.globalAlpha = 0.36; ctx.beginPath(); ctx.arc(0, 90, 190, Math.PI, 0); ctx.lineTo(190, 260); ctx.moveTo(-190, 90); ctx.lineTo(-190, 260); ctx.stroke();
    ctx.globalAlpha = 0.72; drawGear(-70, 115, 72, theme.edge, time * 0.4); drawGear(68, 145, 52, theme.accent, -time * 0.6);
    ctx.strokeStyle = theme.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 93); ctx.lineTo(0, 27); ctx.moveTo(0, 93); ctx.lineTo(55, 117); ctx.stroke(); ctx.restore();
  }

  function drawBeetleRelief(x, y, theme) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = theme.ink; ctx.beginPath(); ctx.ellipse(0, 110, 145, 120, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = theme.accent; ctx.globalAlpha = 0.46; ctx.beginPath(); ctx.ellipse(0, 110, 115, 92, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = theme.edge; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(0, 25); ctx.lineTo(0, 202); ctx.stroke(); ctx.restore();
  }

  function drawTideColossus(x, y, theme) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = theme.far; ctx.beginPath(); ctx.moveTo(-120, 270); ctx.quadraticCurveTo(-100, 40, -25, 25); ctx.quadraticCurveTo(95, 55, 112, 270); ctx.closePath(); ctx.fill(); ctx.fillStyle = theme.edge; ctx.beginPath(); ctx.arc(-28, 94, 11, 0, Math.PI * 2); ctx.arc(33, 94, 11, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = theme.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 124, 42, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.restore();
  }

  function drawSkyFreighter(x, y, theme) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = theme.paper; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(0, 0, 230, 68, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = theme.ink; ctx.beginPath(); ctx.moveTo(-165, 24); ctx.lineTo(180, 24); ctx.lineTo(104, 112); ctx.lineTo(-112, 112); ctx.closePath(); ctx.fill(); ctx.fillStyle = theme.accent; ctx.fillRect(-80, 55, 160, 32); for (let i = -1; i <= 1; i += 1) drawGear(i * 105, 104, 28, theme.edge, runtime?.time || menuTime); ctx.restore();
  }

  function drawForgeDragon(x, y, theme) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = theme.ink; ctx.beginPath(); ctx.moveTo(-190, 245); ctx.lineTo(-130, 70); ctx.lineTo(-68, 116); ctx.lineTo(-14, 22); ctx.lineTo(35, 107); ctx.lineTo(104, 58); ctx.lineTo(172, 245); ctx.closePath(); ctx.fill(); ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.moveTo(-55, 125); ctx.quadraticCurveTo(0, 55, 58, 125); ctx.quadraticCurveTo(0, 190, -55, 125); ctx.fill(); ctx.fillStyle = theme.edge; ctx.beginPath(); ctx.arc(0, 130, 15, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawEclipseTemple(x, y, theme) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = theme.ink; ctx.fillRect(-180, 190, 360, 70); ctx.fillRect(-125, 35, 52, 185); ctx.fillRect(73, 35, 52, 185); ctx.strokeStyle = theme.edge; ctx.globalAlpha = 0.52; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, 92, 93, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-180, 190); ctx.lineTo(0, 38); ctx.lineTo(180, 190); ctx.stroke(); ctx.restore();
  }

  function drawGear(x, y, radius, color, rotation) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.fillStyle = color; ctx.strokeStyle = "rgba(3,16,23,0.8)"; ctx.lineWidth = Math.max(2, radius * 0.12); ctx.beginPath();
    const teeth = 10;
    for (let i = 0; i < teeth * 2; i += 1) {
      const r = i % 2 ? radius * 0.8 : radius;
      const angle = i / (teeth * 2) * Math.PI * 2;
      const px = Math.cos(angle) * r, py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(3,16,23,0.75)"; ctx.beginPath(); ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawCrystal(x, feetY, color, active) {
    ctx.save(); ctx.translate(x, feetY); if (active) { ctx.shadowColor = color; ctx.shadowBlur = 28; }
    paperPolygon([[0, -76], [23, -39], [14, 0], [-17, 0], [-27, -38]], color, "#071c27", 4);
    ctx.fillStyle = "rgba(255,255,255,0.36)"; ctx.beginPath(); ctx.moveTo(0, -68); ctx.lineTo(5, -14); ctx.lineTo(-11, -4); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawSeed(x, y, color, time) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(time * 2) * 0.2); ctx.fillStyle = color; ctx.strokeStyle = "#071c27"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(21, -2, 0, 18); ctx.quadraticCurveTo(-21, -2, 0, -16); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#071c27"; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 9); ctx.stroke(); ctx.restore();
  }

  function drawOrb(x, y, radius, color, core) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.16;
    ctx.beginPath(); ctx.arc(x, y, radius * 1.52, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.38;
    ctx.beginPath(); ctx.arc(x + radius * 0.16, y + radius * 0.18, radius * 1.08, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(x - radius * 0.24, y - radius * 0.26, radius * 0.34, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawLeaf(x, y, size, color, rotation) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, size, size * 0.38, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawFlame(x, y, size, outer, inner) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = outer; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-size, -size * 0.5, -2, -size * 1.35); ctx.quadraticCurveTo(size * 0.85, -size * 0.58, 0, 0); ctx.fill(); ctx.fillStyle = inner; ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(-size * 0.34, -size * 0.42, 1, -size * 0.78); ctx.quadraticCurveTo(size * 0.28, -size * 0.35, 0, -2); ctx.fill(); ctx.restore();
  }

  function paperPolygon(points, fill, stroke, lineWidth = 3) {
    if (!points.length) return;
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function loop(now) {
    const frame = Math.min(0.1, (now - previousTime) / 1000);
    previousTime = now;
    accumulator += frame;
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
    render();
    requestAnimationFrame(loop);
  }

  function preloadArtAssets() {
    Object.keys(DEFAULT_ART_ASSETS).forEach((name) => artImage(name));
  }

  function init() {
    syncCanvasViewport();
    $("#mute-icon").textContent = muted ? "静音" : "声音";
    renderLevelGrid();
    openMenu();
    const params = new URLSearchParams(location.search);
    const requested = Number(params.get("level"));
    if (requested >= 1 && requested <= 8) startLevel(requested, params.get("autostart") === "1" || params.get("capture") === "1");
    artImage("hero");
    artImage("paper");
    if ("requestIdleCallback" in window) window.requestIdleCallback(preloadArtAssets, { timeout: 1200 });
    else setTimeout(preloadArtAssets, 180);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", syncCanvasViewport, { passive: true });

  window.__STARSPROUT_TEST__ = {
    startLevel: (id) => startLevel(id, true),
    step: (frames = 1) => { for (let i = 0; i < frames; i += 1) update(STEP); render(); },
    snapshot: () => ({
      scene,
      level: currentLevel?.id || null,
      player: player ? { x: player.x, y: player.y, vx: player.vx, vy: player.vy, health: player.health } : null,
      boss: runtime?.boss ? { hp: runtime.boss.hp, state: runtime.boss.state, vulnerable: runtime.boss.vulnerable } : null,
      cameraX,
      viewport: { width: VIEW_W, height: VIEW_H },
      unlocked: save.unlocked,
      seeds: save.seeds,
      input: { held: { ...input.held }, tapBuffer: { ...input.tapBuffer }, pointers: input.pointers.size, lastDirection: input.lastDirection },
      effects: runtime ? { ...runtime.activeEffects } : {},
      charges: runtime ? { ...runtime.charges } : {},
      pickupStatus: runtime ? pickupStatusText() : "",
    }),
    press: (action, source = "qa") => pressAction(action, source),
    release: (action, source = "qa") => releaseAction(action, source),
    captureReady: () => captureReady || scene === "menu",
    unlockAll: () => { save.unlocked = 8; persist(); renderLevelGrid(); },
    teleport: (x, y = 420) => {
      if (!player || !currentLevel) return false;
      player.x = clamp(Number(x) || 0, 0, currentLevel.worldWidth - player.w);
      player.y = Number(y) || 420;
      player.vx = 0;
      player.vy = 0;
      cameraX = clamp(player.x - VIEW_W * 0.34, 0, Math.max(0, currentLevel.worldWidth - VIEW_W));
      autoCameraX = cameraX;
      return true;
    },
    enterBossArena: () => {
      if (!player || !runtime?.boss) return false;
      player.x = runtime.boss.arena.x + 350;
      player.y = 430;
      player.vx = 0;
      player.vy = 0;
      cameraX = clamp(runtime.boss.arena.x + 140, 0, Math.max(0, currentLevel.worldWidth - VIEW_W));
      autoCameraX = cameraX;
      updateBoss(STEP);
      return true;
    },
  };

  init();
})();
