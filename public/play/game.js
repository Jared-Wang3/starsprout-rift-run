(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const VIEW_W = canvas.width;
  const VIEW_H = canvas.height;
  const STEP = 1 / 60;
  const SAVE_KEY = "starsprout-save-v2";
  const api = window.StarSproutLevels;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const mod = (value, length) => ((value % length) + length) % length;
  const deepClone = (value) => JSON.parse(JSON.stringify(value));
  const cssColor = (value, fallback) => typeof value === "string" && value ? value : fallback;
  const pad = (value) => String(value).padStart(2, "0");

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

  function loadSave() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      return {
        unlocked: clamp(Number(parsed.unlocked) || 1, 1, 8),
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
        seeds: Number(parsed.seeds) || 0,
        deaths: Number(parsed.deaths) || 0,
        muted: Boolean(parsed.muted),
      };
    } catch {
      return { unlocked: 1, completed: [], seeds: 0, deaths: 0, muted: false };
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
      skyTop: cssColor(source.skyTop || source.sky?.[0] || source.background, fallback.skyTop),
      skyBottom: cssColor(source.skyBottom || source.sky?.[1], fallback.skyBottom),
      far: cssColor(source.far || source.back || source.backgroundFar, fallback.far),
      mid: cssColor(source.mid || source.middle || source.backgroundMid, fallback.mid),
      ground: cssColor(source.ground || source.platform || source.groundDark, fallback.ground),
      edge: cssColor(source.edge || source.highlight || source.accent2 || source.accentSecondary, fallback.edge),
      accent: cssColor(source.accent || source.primary, fallback.accent),
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
      goal: { x: Number(goal.x) || 3400, y: Number(goal.y) || 470, w: Number(goal.w) || 72, h: Number(goal.h) || 130 },
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
        platforms.push({ id: `fallback-${x}`, x, y: 610, w: 360, h: 110, type: "ground", originX: x, originY: 610, dx: 0, dy: 0 });
      }
    }

    const hazards = level.hazards.map((hazard, index) => ({
      id: hazard.id || `h-${index}`,
      x: Number(hazard.x) || 0,
      y: Number(hazard.y) || 0,
      w: Number(hazard.w || hazard.width) || 80,
      h: Number(hazard.h || hazard.height) || 30,
      type: hazard.type || hazard.kind || "spikes",
    }));

    const enemies = level.enemies.map((enemy, index) => ({
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

    const collectibles = level.collectibles.map((item, index) => ({
      id: item.id || `c-${index}`,
      x: Number(item.x) || 0,
      y: Number(item.y) || 0,
      w: 26,
      h: 26,
      type: item.type || "seed",
      value: Number(item.value) || 1,
      collected: false,
      t: index * 0.9,
    }));

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

  function announce(message) {
    $("#announcer").textContent = message;
  }

  function updateHud() {
    if (!player || !currentLevel) return;
    $("#health").innerHTML = Array.from({ length: player.maxHealth }, (_, i) => `<i class="${i < player.health ? "is-full" : ""}"></i>`).join("");
    $("#hud-stage").textContent = `STAGE ${pad(currentLevel.id)}`;
    $("#hud-name").textContent = currentLevel.name;
    $("#dash-fill").style.transform = `scaleX(${clamp(1 - player.dashCooldown / 0.8, 0, 1)})`;
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

  function pressAction(action) {
    if (!input.held[action]) input.pressed.add(action);
    input.held[action] = true;
    if (scene === "briefing") beginBriefing();
  }

  function releaseAction(action) {
    input.held[action] = false;
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
      pressAction(action);
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
      releaseAction(action);
    }
  });

  window.addEventListener("blur", () => {
    Object.keys(input.held).forEach((key) => { input.held[key] = false; });
    if (scene === "playing") togglePause();
  });

  $$('[data-touch]').forEach((button) => {
    const action = button.dataset.touch;
    const down = (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("is-pressed");
      pressAction(action);
    };
    const up = (event) => {
      event.preventDefault();
      button.classList.remove("is-pressed");
      releaseAction(action);
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("pointerleave", up);
  });

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
      if (platform.hidden && platform.enabledBy && !runtime.enabled[platform.enabledBy]) return false;
      if (platform.hidden && !platform.enabledBy && !(runtime.hiddenRevealed || runtime.crystals.some((crystal) => crystal.active))) return false;
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
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
    player.coyote = player.onGround ? 0.11 : Math.max(0, player.coyote - dt);
    if (input.pressed.has("jump")) player.jumpBuffer = 0.13;
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    const move = Number(input.held.right) - Number(input.held.left);
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
      player.shootCooldown = 0.28;
      runtime.projectiles.push({
        x: player.x + player.w / 2 + player.facing * 22,
        y: player.y + 18,
        w: 18,
        h: 18,
        vx: player.facing * 560,
        vy: 0,
        life: 1.45,
      });
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
      const acceleration = player.inWater ? 780 : (player.onGround ? 1900 : 1150);
      const target = move * (player.inWater ? 245 : 350);
      player.vx = move ? moveToward(player.vx, target, acceleration * dt) : moveToward(player.vx, 0, acceleration * 0.78 * dt);
      let gravity = player.inWater ? 420 : 1880;
      if (input.held.jump && player.vy < 0) gravity *= 0.58;
      player.vy = Math.min(player.inWater ? 330 : 980, player.vy + gravity * dt);
      if (player.inWater && input.pressed.has("jump")) {
        player.vy = -340;
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
      if (!item.collected && overlap(body, item)) {
        item.collected = true;
        if (item.type === "memory-seed" || item.type === "seed") {
          save.seeds += Number(item.value) || 1;
          persist();
          toast(`记忆种子 +1 · 共 ${save.seeds} 枚`, 1.25);
        } else if (item.type === "heart") {
          player.health = Math.min(player.maxHealth, player.health + 2);
          toast("星芽恢复了两格生命", 1.15);
        } else {
          runtime.inventory.add(item.type);
          const itemNames = {
            "crystal-crown": "晶冠已共鸣 · 终点封印解除",
            "tide-rune": `潮汐符文 ${[...runtime.inventory].filter((key) => key.startsWith("tide-rune")).length} / 3`,
            "forge-seal": "熔炉印记已取得 · 出口开启",
            "quench-bell": "淬火钟鸣响 · 熔潮大幅退却",
            "wind-feather": "风羽加护 · 冲刺重新充能",
          };
          if (item.type === "tide-rune") {
            const count = runtime.collectibles.filter((entry) => entry.collected && entry.type === "tide-rune").length;
            runtime.inventory.add(`tide-rune-${count}`);
            toast(`潮汐符文 ${count} / 3`, 1.25);
          } else {
            toast(itemNames[item.type] || "发现一件裂界遗物", 1.25);
          }
          if (item.type === "quench-bell") runtime.lavaY = Math.min(720, runtime.lavaY + 150);
          if (item.type === "wind-feather") player.dashCooldown = 0;
        }
        playTone("seed");
        burst(item.x + 13, item.y + 13, currentLevel.theme.edge, 14, 220);
      }
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
    runtime.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      enemy.t += dt;
      enemy.cooldown -= dt;
      if (isFlyingEnemy(enemy.type)) {
        enemy.x += enemy.vx * dt;
        enemy.y += Math.sin(enemy.t * 3.2) * 48 * dt;
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
        enemy.x += enemy.vx * dt;
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
        if (!enemy.alive || !overlap(projectile, enemy)) continue;
        enemy.hp -= 1;
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
          valve.active = true;
          valve.timer = 5.5;
          consumed = true;
          toast(`冷却阀 ${valve.index + 1} 开启 · ${runtime.valves.filter((entry) => entry.active).length}/${runtime.valves.length}`, 1.2);
          playTone("switch");
        }
      });

      runtime.mirrors.forEach((mirror) => {
        if (overlap(projectile, mirror)) {
          mirror.active = true;
          mirror.timer = 5.8;
          consumed = true;
          toast(`日光镜 ${mirror.index + 1} 对准核心`, 1.2);
          playTone("switch");
        }
      });

      if (runtime.boss && overlap(projectile, runtime.boss)) {
        consumed = true;
        if (runtime.boss.vulnerable > 0) damageBoss();
        else {
          burst(projectile.x, projectile.y, currentLevel.theme.paper, 6, 150);
          toast(currentLevel.id === 4 ? "装甲弹开了脉冲——先开冷却阀，再诱导冲锋" : "暗核吞掉了脉冲——让两面日光镜同时共鸣", 1.3);
        }
      }

      if (consumed) projectile.life = 0;
    });
    runtime.projectiles = projectiles.filter((projectile) => projectile.life > 0 && projectile.x > -100 && projectile.x < currentLevel.worldWidth + 100);

    runtime.enemyShots.forEach((shot) => {
      shot.life -= dt;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
    });
    runtime.enemyShots = runtime.enemyShots.filter((shot) => shot.life > 0);

    runtime.shockwaves.forEach((wave) => {
      wave.life -= dt;
      wave.x += wave.vx * dt;
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

  function damageBoss() {
    const boss = runtime.boss;
    if (!boss || boss.hitFlash > 0 || boss.vulnerable <= 0) return;
    boss.hp -= 1;
    boss.hitFlash = 0.35;
    boss.vulnerable = 0;
    boss.phase = boss.maxHp - boss.hp + 1;
    shake = 18;
    flash = 0.45;
    playTone("boss");
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, currentLevel.theme.accent, 30, 430);
    if (boss.hp <= 0) {
      boss.state = "defeated";
      runtime.enemyShots.length = 0;
      runtime.shockwaves.length = 0;
      setTimeout(() => completeLevel(), 650);
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
    runtime.particles = runtime.particles.filter((particle) => particle.life > 0);
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
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    gradient.addColorStop(0, "#163e50");
    gradient.addColorStop(0.58, "#32786f");
    gradient.addColorStop(1, "#e2b96d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawSun(1040, 152, 98, "#f6c453", 0.88);
    drawMenuRifts(theme);
    drawParallaxHills(theme, menuTime * 16, 0);
    drawWindmill(885, 280, 1.45, theme, menuTime);
    drawPaperCloud(720 + Math.sin(menuTime * 0.25) * 25, 105, 1.25, theme.paper, 0.58);
    drawPaperCloud(1080 + Math.sin(menuTime * 0.18) * 36, 280, 0.85, theme.paper, 0.42);
    ctx.fillStyle = theme.ground;
    paperPolygon([[520, 610], [630, 542], [775, 570], [930, 512], [1090, 545], [1280, 474], [1280, 720], [500, 720]], theme.ground, theme.ink, 5);
    drawHero(1000, 468 + Math.sin(menuTime * 2.2) * 5, 1.8, 1, 0, theme, menuTime);
    for (let i = 0; i < 12; i += 1) {
      const x = 600 + mod(i * 117 + menuTime * (18 + i), 760);
      const y = 340 + Math.sin(i * 2.2 + menuTime) * 70;
      drawLeaf(x, y, 10 + (i % 3) * 4, theme.edge, menuTime + i);
    }
  }

  function drawMenuRifts(theme) {
    const colors = ["#71c7d4", "#d78cff", "#f05d4e", "#5fe0c2"];
    for (let i = 0; i < 4; i += 1) {
      const x = 660 + i * 165;
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
    ctx.save();
    ctx.translate(-cameraX, 0);
    renderWindZones(theme);
    renderGoal(theme);
    renderPlatforms(theme);
    renderHazards(theme);
    renderDevices(theme);
    renderCollectibles(theme);
    renderCheckpoints(theme);
    runtime.enemies.forEach((enemy) => { if (enemy.alive) drawEnemy(enemy, theme); });
    runtime.enemyShots.forEach((shot) => drawOrb(shot.x + shot.w / 2, shot.y + shot.h / 2, shot.w * 0.7, theme.accent, theme.ink));
    runtime.shockwaves.forEach((wave) => drawShockwave(wave, theme));
    runtime.projectiles.forEach((shot) => drawOrb(shot.x + shot.w / 2, shot.y + shot.h / 2, 11, theme.edge, theme.paper));
    if (runtime.boss && runtime.boss.hp > 0) drawBoss(runtime.boss, theme);
    if (player) drawHero(player.x + player.w / 2, player.y + player.h, 1, player.facing, player.vx, theme, player.anim, player);
    runtime.particles.forEach(drawParticle);
    renderWaterAndLava(theme);
    ctx.restore();
    renderForeground(theme);
    renderDarkness(theme);
  }

  function renderBackground(theme) {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    gradient.addColorStop(0, theme.skyTop);
    gradient.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

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

    drawLandmark(theme);
    drawParallaxHills(theme, cameraX, currentLevel.id);
    drawPaperCloud(210 - cameraX * 0.08, 118, 0.85, theme.paper, 0.28);
    drawPaperCloud(850 - cameraX * 0.05, 210, 1.1, theme.paper, 0.22);
  }

  function drawLandmark(theme) {
    const px = VIEW_W * 0.7 - cameraX * 0.12;
    const id = currentLevel.id;
    ctx.save();
    ctx.globalAlpha = 0.78;
    if (id === 1) drawWindmill(px, 245, 1.2, theme, runtime.time);
    if (id === 2) drawCrystalCathedral(px, 180, theme);
    if (id === 3) drawGreenhouseClock(px, 215, theme, runtime.time);
    if (id === 4) drawBeetleRelief(px, 205, theme);
    if (id === 5) drawTideColossus(px, 205, theme);
    if (id === 6) drawSkyFreighter(px - 90, 168 + Math.sin(runtime.time * 0.4) * 8, theme);
    if (id === 7) drawForgeDragon(px, 230, theme);
    if (id === 8) drawEclipseTemple(px, 215, theme);
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
      const type = platform.type;
      const fill = type === "glass" ? theme.far : type === "metal" || type === "conveyor" ? theme.ink : theme.ground;
      ctx.save();
      if (platform.fragile && platform.breakTimer > 0) ctx.translate((Math.random() - 0.5) * 4, 0);
      ctx.fillStyle = theme.ink;
      ctx.fillRect(platform.x + 6, platform.y + 7, platform.w, platform.h);
      ctx.fillStyle = fill;
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = type === "hidden" ? theme.accent : theme.edge;
      ctx.fillRect(platform.x, platform.y, platform.w, Math.min(7, platform.h));
      if (type === "conveyor" || platform.conveyor) {
        ctx.fillStyle = theme.paper;
        ctx.globalAlpha = 0.55;
        for (let x = platform.x + 15; x < platform.x + platform.w - 10; x += 42) {
          ctx.beginPath();
          ctx.moveTo(x, platform.y + 13);
          ctx.lineTo(x + Math.sign(platform.conveyor || 1) * 12, platform.y + 19);
          ctx.lineTo(x, platform.y + 25);
          ctx.closePath();
          ctx.fill();
        }
      } else if (platform.fragile) {
        ctx.strokeStyle = theme.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(platform.x + platform.w * 0.22, platform.y + 4);
        ctx.lineTo(platform.x + platform.w * 0.44, platform.y + platform.h * 0.7);
        ctx.lineTo(platform.x + platform.w * 0.67, platform.y + 9);
        ctx.stroke();
      } else if (currentLevel.id === 2) {
        ctx.fillStyle = theme.paper;
        ctx.globalAlpha = 0.08;
        for (let x = platform.x + 20; x < platform.x + platform.w; x += 54) ctx.fillRect(x, platform.y + 16, 13, platform.h - 20);
      } else if (currentLevel.id === 3) {
        ctx.strokeStyle = theme.edge;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 2;
        for (let x = platform.x + 24; x < platform.x + platform.w; x += 48) {
          ctx.beginPath(); ctx.arc(x, platform.y + platform.h / 2, 11, 0, Math.PI * 2); ctx.stroke();
        }
      } else {
        ctx.fillStyle = theme.paper;
        ctx.globalAlpha = 0.08;
        for (let x = platform.x + 18; x < platform.x + platform.w; x += 68) ctx.fillRect(x, platform.y + 20 + (index % 2) * 8, 30, 4);
      }
      ctx.restore();
    });
  }

  function renderHazards(theme) {
    runtime.hazards.forEach((hazard) => {
      if (hazard.type === "fire" || hazard.type === "lava") {
        for (let x = hazard.x; x < hazard.x + hazard.w; x += 26) drawFlame(x + 13, hazard.y + hazard.h, 24, theme.accent, theme.edge);
      } else {
        ctx.fillStyle = theme.accent;
        ctx.strokeStyle = theme.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hazard.x, hazard.y + hazard.h);
        for (let x = hazard.x; x < hazard.x + hazard.w; x += 26) {
          ctx.lineTo(x + 13, hazard.y);
          ctx.lineTo(x + 26, hazard.y + hazard.h);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  function renderDevices(theme) {
    runtime.crystals.forEach((crystal) => drawCrystal(crystal.x + crystal.w / 2, crystal.y + crystal.h, crystal.active ? theme.edge : theme.far, crystal.active));
    runtime.switches.forEach((device) => drawGear(device.x + device.w / 2, device.y + device.h / 2, 25, device.active ? theme.edge : theme.paper, runtime.time * (device.active ? 3 : 0.4)));
    runtime.gates.filter(isGateActive).forEach((gate) => {
      ctx.fillStyle = theme.ink;
      ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
      ctx.fillStyle = theme.edge;
      for (let y = gate.y + 12; y < gate.y + gate.h; y += 34) ctx.fillRect(gate.x + 6, y, gate.w - 12, 8);
    });
    runtime.valves.forEach((valve) => drawValve(valve, theme));
    runtime.mirrors.forEach((mirror) => drawMirror(mirror, theme));
    runtime.coolants.forEach((coolant) => { if (coolant.active) drawSeed(coolant.x + 20, coolant.y + 20, theme.accent, runtime.time + coolant.index); });

    if (runtime.devices.vent) {
      const vent = runtime.devices.vent;
      const active = runtime.valves.length > 0 && runtime.valves.every((valve) => valve.active);
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
    if (currentLevel.id === 8 && runtime.mirrors.every((mirror) => mirror.active)) drawMirrorBeam(theme);
  }

  function renderCollectibles(theme) {
    runtime.collectibles.forEach((item) => {
      if (!item.collected) drawSeed(item.x + 13, item.y + 13 + Math.sin(runtime.time * 3 + item.t) * 7, theme.edge, runtime.time + item.t);
    });
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
    ctx.save();
    ctx.translate(goal.x + goal.w / 2, goal.y + goal.h / 2);
    ctx.rotate(Math.sin(runtime.time * 0.7) * 0.035);
    ctx.fillStyle = theme.ink;
    ctx.fillRect(-goal.w / 2, -goal.h / 2, goal.w, goal.h);
    ctx.fillStyle = theme.edge;
    ctx.fillRect(-goal.w / 2 + 8, -goal.h / 2 + 8, goal.w - 16, goal.h - 16);
    ctx.fillStyle = theme.mid;
    ctx.beginPath();
    ctx.ellipse(0, 4, goal.w * 0.27, goal.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = theme.paper;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, 16); ctx.quadraticCurveTo(0, -28, 18, 16); ctx.stroke();
    ctx.restore();
  }

  function renderWaterAndLava(theme) {
    if (runtime.devices.water) {
      ctx.save();
      ctx.globalAlpha = 0.58;
      ctx.fillStyle = theme.skyTop;
      ctx.beginPath();
      ctx.moveTo(cameraX, runtime.waterY);
      for (let x = cameraX; x < cameraX + VIEW_W + 80; x += 40) ctx.lineTo(x, runtime.waterY + Math.sin(x * 0.035 + runtime.time * 3) * 9);
      ctx.lineTo(cameraX + VIEW_W + 80, VIEW_H + 60); ctx.lineTo(cameraX, VIEW_H + 60); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = theme.edge; ctx.lineWidth = 5; ctx.globalAlpha = 0.75; ctx.stroke();
      ctx.restore();
    }
    if (runtime.devices.lava) {
      ctx.save();
      ctx.fillStyle = theme.accent;
      ctx.beginPath(); ctx.moveTo(cameraX, runtime.lavaY);
      for (let x = cameraX; x < cameraX + VIEW_W + 100; x += 32) ctx.lineTo(x, runtime.lavaY + Math.sin(x * 0.05 + runtime.time * 5) * 8);
      ctx.lineTo(cameraX + VIEW_W + 100, VIEW_H + 80); ctx.lineTo(cameraX, VIEW_H + 80); ctx.closePath(); ctx.fill();
      ctx.fillStyle = theme.edge; ctx.globalAlpha = 0.7;
      for (let x = cameraX + 20; x < cameraX + VIEW_W; x += 80) ctx.beginPath(), ctx.arc(x, runtime.lavaY + Math.sin(x + runtime.time) * 12, 6, 0, Math.PI * 2), ctx.fill();
      ctx.restore();
    }
  }

  function renderForeground(theme) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = theme.ink;
    for (let i = 0; i < 10; i += 1) {
      const x = mod(i * 171 - cameraX * 0.52, VIEW_W + 180) - 90;
      const height = 40 + (i % 4) * 27;
      ctx.beginPath();
      ctx.moveTo(x - 16, VIEW_H);
      ctx.quadraticCurveTo(x - 5, VIEW_H - height, x, VIEW_H - height - 22);
      ctx.quadraticCurveTo(x + 7, VIEW_H - height, x + 20, VIEW_H);
      ctx.fill();
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
    ctx.save();
    ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
    if (boss.state === "telegraph") ctx.translate((Math.random() - 0.5) * 7, 0);
    if (boss.hitFlash > 0) ctx.globalAlpha = 0.45 + Math.sin(boss.hitFlash * 70) * 0.35;
    if (currentLevel.id === 4) {
      ctx.scale(boss.vx < 0 ? -1 : 1, 1);
      ctx.fillStyle = theme.ink;
      ctx.beginPath(); ctx.ellipse(0, 0, boss.w * 0.52, boss.h * 0.52, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = boss.vulnerable > 0 ? theme.paper : theme.accent;
      ctx.beginPath(); ctx.ellipse(-5, 0, boss.w * 0.42, boss.h * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = theme.ink; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(0, 45); ctx.stroke();
      ctx.fillStyle = boss.vulnerable > 0 ? theme.edge : theme.ink;
      ctx.beginPath(); ctx.arc(8, 4, 19, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = theme.ink; ctx.lineWidth = 12; ctx.lineCap = "round";
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath(); ctx.moveTo(-35, i * 28); ctx.lineTo(-65, i * 34 + 11); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(35, i * 28); ctx.lineTo(65, i * 34 + 11); ctx.stroke();
      }
      ctx.fillStyle = theme.edge;
      ctx.beginPath(); ctx.moveTo(-48, -30); ctx.lineTo(-83, -54); ctx.lineTo(-59, -8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-52, 20); ctx.lineTo(-90, 43); ctx.lineTo(-55, 47); ctx.closePath(); ctx.fill();
    } else {
      const pulse = 1 + Math.sin(runtime.time * 4) * 0.05;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = theme.ink;
      ctx.beginPath(); ctx.ellipse(0, 0, boss.w * 0.5, boss.h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = theme.edge; ctx.lineWidth = 8; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(0, 0, boss.w * 0.58, -1.1, 1.8); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, boss.w * 0.68, 2.1, 4.8); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = boss.vulnerable > 0 ? theme.edge : theme.accent;
      ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(29, 8); ctx.lineTo(0, 40); ctx.lineTo(-29, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = theme.paper;
      ctx.beginPath(); ctx.ellipse(-17, -12, 5, 9, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(17, -12, 5, 9, -0.3, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 5; i += 1) drawLeaf(Math.cos(i * 1.26 + runtime.time) * 82, Math.sin(i * 1.26 + runtime.time) * 88, 11, theme.accent, i);
    }
    ctx.restore();
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
    ctx.fillStyle = particle.color;
    if (particle.shape === "leaf") {
      ctx.beginPath(); ctx.ellipse(0, 0, particle.size, particle.size * 0.38, 0.4, 0, Math.PI * 2); ctx.fill();
    } else if (particle.shape === "dash") {
      ctx.fillRect(-particle.size * 2, -1.5, particle.size * 4, 3);
    } else {
      ctx.beginPath(); ctx.arc(0, 0, particle.size, 0, Math.PI * 2); ctx.fill();
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
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = radius * 1.8; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x - radius * 0.22, y - radius * 0.22, radius * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.restore();
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

  function init() {
    $("#mute-icon").textContent = muted ? "静音" : "声音";
    renderLevelGrid();
    openMenu();
    const params = new URLSearchParams(location.search);
    const requested = Number(params.get("level"));
    if (requested >= 1 && requested <= 8) startLevel(requested, params.get("autostart") === "1" || params.get("capture") === "1");
    requestAnimationFrame(loop);
  }

  window.__STARSPROUT_TEST__ = {
    startLevel: (id) => startLevel(id, true),
    step: (frames = 1) => { for (let i = 0; i < frames; i += 1) update(STEP); render(); },
    snapshot: () => ({
      scene,
      level: currentLevel?.id || null,
      player: player ? { x: player.x, y: player.y, health: player.health } : null,
      boss: runtime?.boss ? { hp: runtime.boss.hp, state: runtime.boss.state, vulnerable: runtime.boss.vulnerable } : null,
      cameraX,
      unlocked: save.unlocked,
      seeds: save.seeds,
    }),
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
