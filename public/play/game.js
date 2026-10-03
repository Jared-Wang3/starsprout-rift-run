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
  const HIT_INVULNERABLE_TIME = 1.05;
  const HIT_REACTION_TIME = 0.16;
  const HIT_RECOVERY_ACCELERATION = 5200;
  const api = window.StarSproutLevels;
  const trialApi = window.StarSproutTrials || { trials: [], upgrades: {} };
  const TRIALS = Array.isArray(trialApi.trials) ? trialApi.trials : [];
  const TRIAL_UPGRADES = trialApi.upgrades || {};
  const TRIAL_EVENTS = trialApi.events || {};
  const HERO_MODULES = Object.freeze({
    none: {
      id: "none",
      name: "原生芽芯",
      unlockBoss: 0,
      description: "保持星芽原本的脉冲、冲刺与下砸能力。",
    },
    echo: {
      id: "echo",
      name: "回声芽芯",
      unlockBoss: 4,
      description: "发射脉冲时弹反近处敌弹；反射弹可快速为反应炉供能。",
    },
    wind: {
      id: "wind",
      name: "风行芽芯",
      unlockBoss: 8,
      description: "冲刺后保留一次折跃弹跳，空中也能接续跃升。",
    },
    root: {
      id: "root",
      name: "根守芽芯",
      unlockBoss: 12,
      description: "站在地面按下砸展开根盾，挡下一枚弹体并释放震波。",
    },
  });

  const DEFAULT_ART_ASSETS = {
    paper: { src: "./assets/art-v2/paper-texture.webp" },
    hero: { src: "./assets/art-v2/hero-sprites.webp", cols: 4, rows: 2 },
    enemiesA: { src: "./assets/art-v2/enemy-atlas-a.webp", cols: 4, rows: 2 },
    enemiesB: { src: "./assets/art-v2/enemy-atlas-b.webp", cols: 4, rows: 2 },
    enemiesC: { src: "./assets/art-v8/enemy-atlas-c.webp", cols: 3, rows: 2 },
    enemiesD: { src: "./assets/art-v11/enemy-atlas-d.webp", cols: 3, rows: 2 },
    mechanisms: { src: "./assets/art-v9/mechanism-atlas.webp", cols: 4, rows: 2 },
    mechanismsB: { src: "./assets/art-v11/mechanism-atlas-b.webp", cols: 4, rows: 2 },
    boss: { src: "./assets/art-v2/boss-sprites.webp", cols: 4, rows: 2 },
    collectibles: { src: "./assets/art-v2/collectibles.webp", cols: 4, rows: 2 },
    environmentsA: { src: "./assets/art-v2/environments-a.webp", cols: 2, rows: 2, gutter: 0 },
    environmentsB: { src: "./assets/art-v2/environments-b.webp", cols: 2, rows: 2, gutter: 0 },
    environmentsC: { src: "./assets/art-v3/environments-c.webp", cols: 2, rows: 2, gutter: 0 },
    environmentsD: { src: "./assets/art-v5/environments-d.webp", cols: 2, rows: 2, gutter: 0 },
    environmentsE: { src: "./assets/art-v6/environments-e.webp", cols: 2, rows: 2, gutter: 0 },
    environmentsF: { src: "./assets/art-v10/environments-f.webp", cols: 2, rows: 2, gutter: 0 },
    environmentsG: { src: "./assets/art-v11/environments-g.webp", cols: 2, rows: 2, gutter: 6 },
    trialsArena: { src: "./assets/art-v7/trials-nightwatch.webp", cols: 1, rows: 1, gutter: 0 },
    bossWeaver: { src: "./assets/art-v3/boss-weaver.webp", cols: 4, rows: 2 },
    bossStarWhale: { src: "./assets/art-v5/boss-star-whale.webp", cols: 4, rows: 2 },
    bossFoldWarden: { src: "./assets/art-v6/boss-fold-warden.png", cols: 4, rows: 2 },
    bossSkyPaperDragon: { src: "./assets/art-v10/boss-sky-paper-dragon.webp", cols: 4, rows: 2 },
    bossScorewingMaestro: { src: "./assets/art-v11/boss-scorewing-maestro.webp", cols: 4, rows: 2 },
    act3Collectibles: { src: "./assets/art-v3/act3-collectibles.webp", cols: 2, rows: 2 },
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
    "storm-cannon": { sheet: "enemiesB", col: 3, row: 1 },
    "thunder-drummer": { sheet: "enemiesC", col: 0, row: 0, drawW: 92, drawH: 82 },
    "thread-spinner": { sheet: "enemiesC", col: 1, row: 0, drawW: 92, drawH: 82 },
    "chrono-leech": { sheet: "enemiesC", col: 2, row: 0, drawW: 88, drawH: 86 },
    "mirror-mimic": { sheet: "enemiesC", col: 0, row: 1, drawW: 78, drawH: 92 },
    "fold-beetle": { sheet: "enemiesC", col: 1, row: 1, drawW: 106, drawH: 88 },
    "star-siphon": { sheet: "enemiesC", col: 2, row: 1, drawW: 88, drawH: 82 },
    "lens-beetle": { sheet: "enemiesD", col: 0, row: 0, drawW: 128, drawH: 112 },
    "rail-wisp": { sheet: "enemiesD", col: 1, row: 0, drawW: 118, drawH: 104 },
    "lantern-heron": { sheet: "enemiesD", col: 2, row: 0, drawW: 112, drawH: 150 },
    "lens-beetle-small": { sheet: "enemiesD", col: 0, row: 1, drawW: 92, drawH: 80 },
    "rail-wisp-charge": { sheet: "enemiesD", col: 1, row: 1, drawW: 138, drawH: 100 },
    "lantern-heron-alert": { sheet: "enemiesD", col: 2, row: 1, drawW: 126, drawH: 158 },
  };
  const DISCOVERY_CATALOG = Object.freeze([
    { id: "seed-hopper", name: "种跃兽", habitat: "风铃草丘", trait: "贴地巡游，靠近时会突然跃起。", counter: "等它落下后用脉冲或下砸反击。" },
    { id: "kite-mite", name: "风筝螨", habitat: "风铃草丘", trait: "借风漂浮，从斜上方逼近。", counter: "先拉开高度差，再用脉冲截停。" },
    { id: "shard-crawler", name: "晶屑爬兽", habitat: "回声晶洞", trait: "披着晶壳的低矮巡猎者。", counter: "保持距离，连续脉冲击碎晶壳。" },
    { id: "echo-bat", name: "回声蝠", habitat: "回声晶洞", trait: "沿不规则的回声轨迹飞行。", counter: "观察上下摆动后从空隙穿过。" },
    { id: "tin-snail", name: "锡壳蜗", habitat: "齿轮温室", trait: "缓慢但耐打的机械软体。", counter: "不要贴身磨血，用下砸快速破壳。" },
    { id: "pollen-drone", name: "花粉巡蜂", habitat: "齿轮温室", trait: "在半空巡逻并干扰机关路线。", counter: "优先用脉冲击落，避免它持续逼近。" },
    { id: "steam-tick", name: "蒸汽蜱", habitat: "沸压虫巢", trait: "体型小、接近速度快。", counter: "用短跳骗它越过，再从背后处理。" },
    { id: "reef-crab", name: "纸礁蟹", habitat: "潮汐遗迹", trait: "守在低处平台的重甲生物。", counter: "从上方下砸比正面接触更安全。" },
    { id: "paper-jelly", name: "纸海月", habitat: "潮汐遗迹", trait: "随潮上下漂移，封锁跳跃路线。", counter: "等它抬升后从下方快速穿过。" },
    { id: "cargo-bot", name: "货运箱机", habitat: "天际货运线", trait: "沿运输带反复巡查。", counter: "借传送带拉开距离后射击。" },
    { id: "propeller-wasp", name: "螺旋胡蜂", habitat: "天际货运线", trait: "高速空中巡航单位。", counter: "不要追着瞄，等它进入前方射线。" },
    { id: "coal-golem", name: "煤芯魔像", habitat: "余烬熔炉", trait: "高生命的重型熔岩生物。", counter: "分段输出，保留冲刺用于脱离。" },
    { id: "cinder-bat", name: "烬翼蝠", habitat: "余烬熔炉", trait: "从熔光里贴近玩家。", counter: "在它下降时用脉冲抢先命中。" },
    { id: "orbit-eye", name: "环轨之眼", habitat: "日蚀天文台", trait: "悬浮巡查高处通道。", counter: "利用平台遮挡并从侧面突破。" },
    { id: "shadow-sprout", name: "影芽", habitat: "日蚀天文台", trait: "速度快、轮廓容易融入暗处。", counter: "看准眼部高光，避免在狭窄处缠斗。" },
    { id: "storm-cannon", name: "风暴炮眼", habitat: "极光冰晶花园", trait: "固定瞄准并发射直线弹体。", counter: "诱导开火后移动，或用回声芽芯弹反。" },
    { id: "thunder-drummer", name: "雷鼓兽", habitat: "暴雨铜钟塔", trait: "敲响双鼓后向两侧释放地面震波。", counter: "看见蓄雷就起跳，落地后再反击。" },
    { id: "thread-spinner", name: "织线蛛", habitat: "折纸梦境图书馆", trait: "在通路铺下会拖慢移动的星丝。", counter: "冲刺能撕开蛛丝，优先清理它。" },
    { id: "chrono-leech", name: "时砂蛭", habitat: "时砂回廊", trait: "受击后会退回先前停留的位置。", counter: "逼到路线边缘，再连续攻击压缩回溯空间。" },
    { id: "mirror-mimic", name: "镜像芽", habitat: "双影镜城", trait: "记住星芽的冲刺，并在预警后复刻。", counter: "故意留下错误方向，再从反向绕开。" },
    { id: "fold-beetle", name: "折页甲虫", habitat: "折纸峡谷", trait: "正面书页盾会弹开普通脉冲。", counter: "绕到背后射击，或直接从上方下砸。" },
    { id: "star-siphon", name: "星噬萤", habitat: "星噬鲸庭 / 星芽守夜", trait: "吸附星标并侵蚀路线时间。", counter: "它会直奔目标星标，必须优先击落。" },
    { id: "lens-beetle", name: "露镜甲", habitat: "露珠缩景园", trait: "会借露镜压缩身形，再从纤维缝隙突袭。", counter: "小形态时先避开冲撞，变为巨芽后从上方下砸。" },
    { id: "rail-wisp", name: "彗线灵", habitat: "彗线换轨站", trait: "沿轨势蓄能，短暂预警后高速横切。", counter: "看见彗尾拉直就换轨或跳离轨车。" },
    { id: "lantern-heron", name: "提灯鹭", habitat: "藏灯剪影城", trait: "巡游时用灯眼扫过街道，发现星芽后会锁定光锥。", counter: "推动纸屏制造影区，再从它背后的暗面穿过。" },
  ]);
  const DISCOVERY_BY_ID = Object.freeze(Object.fromEntries(DISCOVERY_CATALOG.map((entry) => [entry.id, entry])));
  const DEFAULT_BOSS_FRAMES = {
    boilerNormal: { sheet: "boss", col: 0, row: 0 },
    boilerCharge: { sheet: "boss", col: 1, row: 0 },
    boilerCoreOpen: { sheet: "boss", col: 2, row: 0 },
    boilerFrozenHit: { sheet: "boss", col: 3, row: 0 },
    eclipseNormal: { sheet: "boss", col: 0, row: 1 },
    eclipseBeamCharge: { sheet: "boss", col: 1, row: 1 },
    eclipseShieldBreak: { sheet: "boss", col: 2, row: 1 },
    eclipseCoreExposed: { sheet: "boss", col: 3, row: 1 },
    weaverIdle: { sheet: "bossWeaver", col: 0, row: 0 },
    weaverThreadCharge: { sheet: "bossWeaver", col: 1, row: 0 },
    weaverThreadDash: { sheet: "bossWeaver", col: 2, row: 0 },
    weaverCocoon: { sheet: "bossWeaver", col: 3, row: 0 },
    weaverBeam: { sheet: "bossWeaver", col: 0, row: 1 },
    weaverStunned: { sheet: "bossWeaver", col: 1, row: 1 },
    weaverCoreOpen: { sheet: "bossWeaver", col: 2, row: 1 },
    weaverDefeated: { sheet: "bossWeaver", col: 3, row: 1 },
    whaleIdle: { sheet: "bossStarWhale", col: 0, row: 0 },
    whaleCharge: { sheet: "bossStarWhale", col: 1, row: 0 },
    whaleDive: { sheet: "bossStarWhale", col: 2, row: 0 },
    whaleShield: { sheet: "bossStarWhale", col: 3, row: 0 },
    whaleBeam: { sheet: "bossStarWhale", col: 0, row: 1 },
    whaleStunned: { sheet: "bossStarWhale", col: 1, row: 1 },
    whaleCoreOpen: { sheet: "bossStarWhale", col: 2, row: 1 },
    whaleDefeated: { sheet: "bossStarWhale", col: 3, row: 1 },
    foldWardenIdle: { sheet: "bossFoldWarden", col: 0, row: 0 },
    foldWardenTelegraph: { sheet: "bossFoldWarden", col: 1, row: 0 },
    foldWardenDive: { sheet: "bossFoldWarden", col: 2, row: 0 },
    foldWardenShield: { sheet: "bossFoldWarden", col: 3, row: 0 },
    foldWardenTrapped: { sheet: "bossFoldWarden", col: 0, row: 1 },
    foldWardenStunned: { sheet: "bossFoldWarden", col: 1, row: 1 },
    foldWardenCoreOpen: { sheet: "bossFoldWarden", col: 2, row: 1 },
    foldWardenDefeated: { sheet: "bossFoldWarden", col: 3, row: 1 },
    dragonIdle: { sheet: "bossSkyPaperDragon", col: 0, row: 0 },
    dragonBridge: { sheet: "bossSkyPaperDragon", col: 1, row: 0 },
    dragonCharge: { sheet: "bossSkyPaperDragon", col: 2, row: 0 },
    dragonDive: { sheet: "bossSkyPaperDragon", col: 3, row: 0 },
    dragonShield: { sheet: "bossSkyPaperDragon", col: 0, row: 1 },
    dragonStunned: { sheet: "bossSkyPaperDragon", col: 1, row: 1 },
    dragonCoreOpen: { sheet: "bossSkyPaperDragon", col: 2, row: 1 },
    dragonDefeated: { sheet: "bossSkyPaperDragon", col: 3, row: 1 },
    scorewingIdle: { sheet: "bossScorewingMaestro", col: 0, row: 0 },
    scorewingCharge: { sheet: "bossScorewingMaestro", col: 1, row: 0 },
    scorewingShardCast: { sheet: "bossScorewingMaestro", col: 2, row: 0 },
    scorewingVolleyGuard: { sheet: "bossScorewingMaestro", col: 3, row: 0 },
    scorewingStunned: { sheet: "bossScorewingMaestro", col: 0, row: 1 },
    scorewingCoreOpen: { sheet: "bossScorewingMaestro", col: 1, row: 1 },
    scorewingEnraged: { sheet: "bossScorewingMaestro", col: 2, row: 1 },
    scorewingDefeated: { sheet: "bossScorewingMaestro", col: 3, row: 1 },
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
    "lumen-spore": { sheet: "act3Collectibles", col: 0, row: 0 },
    "time-shard": { sheet: "act3Collectibles", col: 1, row: 0 },
    "storm-cell": { sheet: "act3Collectibles", col: 0, row: 1 },
    "rift-core-seed": { sheet: "act3Collectibles", col: 1, row: 1 },
    "return-seed": { sheet: "act3Collectibles", col: 1, row: 0 },
    "page-core-seed": { sheet: "act3Collectibles", col: 1, row: 1 },
  };
  const DEFAULT_DEVICE_FRAMES = {
    tideRepair: { sheet: "mechanisms", col: 0, row: 0 },
    auroraReactor: { sheet: "mechanisms", col: 1, row: 0 },
    sunRelay: { sheet: "mechanisms", col: 2, row: 0 },
    moonRelay: { sheet: "mechanisms", col: 3, row: 0 },
    echoPad: { sheet: "mechanisms", col: 0, row: 1 },
    constellationAnchor: { sheet: "mechanisms", col: 1, row: 1 },
    foldTrap: { sheet: "mechanisms", col: 2, row: 1 },
    polarityDial: { sheet: "mechanisms", col: 3, row: 1 },
    dewLens: { sheet: "mechanismsB", col: 0, row: 0 },
    fiberIris: { sheet: "mechanismsB", col: 1, row: 0 },
    railJunction: { sheet: "mechanismsB", col: 2, row: 0 },
    railStation: { sheet: "mechanismsB", col: 3, row: 0 },
    lanternScreen: { sheet: "mechanismsB", col: 0, row: 1 },
    shadowKeyAltar: { sheet: "mechanismsB", col: 1, row: 1 },
    crownShard: { sheet: "mechanismsB", col: 2, row: 1 },
    crownReceptor: { sheet: "mechanismsB", col: 3, row: 1 },
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
    "world-core-seed": { label: "世界核心种", badge: "界", mode: "boss-core", description: "带走核心并完成观测站守门挑战" },
    "lumen-spore": { label: "雷光火种", badge: "雷", mode: "quest", description: "集齐三枚，解除铜钟塔出口封印" },
    "time-shard": { label: "时页碎片", badge: "页", mode: "quest", description: "集齐三枚，稳定梦境书库并开启出口" },
    "storm-cell": { label: "暖光电池", badge: "暖", mode: "quest", description: "为最近一座未满的极光反应炉补充两格能量" },
    "rift-core-seed": { label: "裂界核心种", badge: "织", mode: "boss-core", description: "带走织界核心并完成最终挑战" },
    "orbit-key": { label: "星轨钥", badge: "轨", mode: "quest", description: "集齐三枚，校准失重星环的出口" },
    "chrono-petal": { label: "时砂花瓣", badge: "砂", mode: "quest", description: "集齐三枚，稳定时砂回廊" },
    "starwhale-core": { label: "星鲸核心种", badge: "鲸", mode: "boss-core", description: "带回最后一颗被吞噬的星" },
    "return-seed": { label: "返航星种", badge: "返", mode: "page-turn", description: "翻转书页并把出口送回起点" },
    "page-core-seed": { label: "千页核心种", badge: "鸾", mode: "boss-core", description: "带回折界守门者守护的星种" },
    "sky-dragon-core": { label: "天穹龙芯", badge: "龙", mode: "boss-core", description: "带回纸龙守护的天穹星种" },
    "shadow-key": { label: "影钥", badge: "影", mode: "quest", description: "集齐三枚并返回中央灯门" },
    "scorewing-core": { label: "未写终曲", badge: "谱", mode: "boss-core", description: "带回谱翼指挥蛾守护的星冕终章" },
  });
  const PROCEDURAL_COLLECTIBLE_TYPES = new Set([
    "memory-seed", "clock-spring", "tide-rune", "parcel-wings", "quench-bell", "forge-seal",
    "sky-dragon-core", "shadow-key", "scorewing-core",
    "orbit-key", "chrono-petal", "starwhale-core",
  ]);
  const ART_ALIASES = {
    paper: ["paper", "paperTexture", "paper-texture"],
    hero: ["hero", "heroSprites", "hero-sprites"],
    enemiesA: ["enemiesA", "enemyAtlasA", "enemy-atlas-a"],
    enemiesB: ["enemiesB", "enemyAtlasB", "enemy-atlas-b"],
    enemiesC: ["enemiesC", "enemyAtlasC", "enemy-atlas-c"],
    enemiesD: ["enemiesD", "enemyAtlasD", "enemy-atlas-d"],
    mechanisms: ["mechanisms", "mechanismAtlas", "mechanism-atlas"],
    mechanismsB: ["mechanismsB", "mechanismAtlasB", "mechanism-atlas-b"],
    boss: ["boss", "bossSprites", "boss-sprites"],
    collectibles: ["collectibles", "collectibleSprites", "collectible-sprites"],
    environmentsA: ["environmentsA", "environmentAtlasA", "environment-atlas-a"],
    environmentsB: ["environmentsB", "environmentAtlasB", "environment-atlas-b"],
    environmentsC: ["environmentsC", "environmentAtlasC", "environment-atlas-c"],
    environmentsD: ["environmentsD", "environmentAtlasD", "environment-atlas-d"],
    environmentsE: ["environmentsE", "environmentAtlasE", "environment-atlas-e"],
    environmentsF: ["environmentsF", "environmentAtlasF", "environment-atlas-f"],
    environmentsG: ["environmentsG", "environmentAtlasG", "environment-atlas-g"],
    trialsArena: ["trialsArena", "trials-arena", "night-watch-arena"],
    bossWeaver: ["bossWeaver", "riftWeaverBoss", "boss-weaver", "boss-weaver-sprites"],
    bossStarWhale: ["bossStarWhale", "starWhaleBoss", "boss-star-whale", "boss-star-whale-sprites"],
    bossFoldWarden: ["bossFoldWarden", "foldWardenBoss", "boss-fold-warden", "boss-fold-warden-sprites"],
    bossSkyPaperDragon: ["bossSkyPaperDragon", "skyPaperDragonBoss", "boss-sky-paper-dragon", "boss-sky-paper-dragon-sprites"],
    bossScorewingMaestro: ["bossScorewingMaestro", "scorewingMaestroBoss", "boss-scorewing-maestro", "boss-scorewing-maestro-sprites"],
    act3Collectibles: ["act3Collectibles", "act3-collectibles", "act-three-collectibles"],
  };
  const artImageCache = new Map();
  const artImageLoadPromises = new Map();
  let artWarmupHandle = null;
  let artWarmupHandleType = null;
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

  const CAMPAIGN_LEVELS = listLevels()
    .filter((level) => Number.isFinite(Number(level?.id)))
    .slice()
    .sort((a, b) => Number(a.id) - Number(b.id));
  const CAMPAIGN_LEVEL_IDS = new Set(CAMPAIGN_LEVELS.map((level) => Number(level.id)));
  const FIRST_LEVEL_ID = Number(CAMPAIGN_LEVELS[0]?.id) || 1;
  const MAX_LEVEL_ID = Number(CAMPAIGN_LEVELS.at(-1)?.id) || FIRST_LEVEL_ID;
  const FINAL_LEVEL_ID = Number(
    CAMPAIGN_LEVELS.slice().reverse().find((level) => level.finale === true || level.isFinal === true)?.id
      || CAMPAIGN_LEVELS.at(-1)?.id,
  ) || MAX_LEVEL_ID;
  const BOSS_LEVEL_IDS = new Set(
    CAMPAIGN_LEVELS
      .filter((level) => level.kind === "boss" || level.type === "boss" || Boolean(level.boss))
      .map((level) => Number(level.id)),
  );

  function nextCampaignLevelId(id) {
    const current = Number(id);
    return Number(CAMPAIGN_LEVELS.find((level) => Number(level.id) > current)?.id) || null;
  }

  function campaignCompletedCount(completed) {
    return new Set((completed || []).map(Number).filter((id) => CAMPAIGN_LEVEL_IDS.has(id))).size;
  }

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

  function createArtImageRecord(name, config, key) {
    const image = new Image();
    const cached = { name, image, config, ready: false, failed: false };
    let settled = false;
    let resolveLoad;
    const loadPromise = new Promise((resolve) => { resolveLoad = resolve; });
    const finish = (loaded) => {
      if (settled) return;
      settled = true;
      cached.ready = loaded;
      cached.failed = !loaded;
      resolveLoad(loaded);
    };
    const decodeLoadedImage = async () => {
      if (settled) return;
      try {
        if (typeof image.decode === "function") await image.decode();
        finish(image.naturalWidth > 0);
      } catch {
        finish(image.complete && image.naturalWidth > 0);
      }
    };

    image.decoding = "async";
    image.addEventListener("load", decodeLoadedImage, { once: true });
    image.addEventListener("error", () => finish(false), { once: true });
    artImageCache.set(key, cached);
    artImageLoadPromises.set(key, loadPromise);
    image.src = config.src;
    if (image.complete && image.naturalWidth > 0) decodeLoadedImage();
    return cached;
  }

  function artImage(name) {
    const config = artAssetConfig(name);
    if (!config.src) return null;
    const key = `${name}:${config.src}`;
    let cached = artImageCache.get(key);
    if (!cached) cached = createArtImageRecord(name, config, key);
    cached.config = config;
    return cached.ready && !cached.failed ? cached : null;
  }

  function preloadArtAsset(name) {
    const config = artAssetConfig(name);
    if (!config.src) return Promise.resolve(false);
    const key = `${name}:${config.src}`;
    const ready = artImage(name);
    if (ready) return Promise.resolve(true);
    const cached = artImageCache.get(key);
    if (!cached || cached.failed) return Promise.resolve(false);

    return artImageLoadPromises.get(key) || Promise.resolve(cached.ready);
  }

  function clearFailedArtAssets(names) {
    names.forEach((name) => {
      const config = artAssetConfig(name);
      if (!config.src) return;
      const key = `${name}:${config.src}`;
      if (!artImageCache.get(key)?.failed) return;
      artImageCache.delete(key);
      artImageLoadPromises.delete(key);
    });
  }

  function frameSpec(group, name, fallback) {
    const configured = artManifest()[group]?.[name];
    const source = configured || fallback;
    if (Array.isArray(source)) return { sheet: source[0], col: Number(source[1]) || 0, row: Number(source[2]) || 0 };
    return source ? { ...source } : null;
  }

  function addFrameSheet(names, group, name, fallback) {
    const frame = frameSpec(group, name, fallback);
    if (frame?.sheet) names.add(frame.sheet);
  }

  function levelArtAssetNames(level) {
    const names = new Set(["hero", "paper"]);
    addFrameSheet(names, "levelBackgroundFrames", String(level.id), null);
    level.enemies.forEach((enemy) => {
      const type = String(enemy.type || "");
      addFrameSheet(names, "enemyFrames", type, DEFAULT_ENEMY_FRAMES[type]);
      if (type === "lens-beetle") addFrameSheet(names, "enemyFrames", "lens-beetle-small", DEFAULT_ENEMY_FRAMES["lens-beetle-small"]);
      if (type === "rail-wisp") addFrameSheet(names, "enemyFrames", "rail-wisp-charge", DEFAULT_ENEMY_FRAMES["rail-wisp-charge"]);
      if (type === "lantern-heron") addFrameSheet(names, "enemyFrames", "lantern-heron-alert", DEFAULT_ENEMY_FRAMES["lantern-heron-alert"]);
    });
    level.collectibles.forEach((item) => {
      const type = String(item.type || "memory-seed");
      if (!PROCEDURAL_COLLECTIBLE_TYPES.has(type)) {
        addFrameSheet(names, "collectibleFrames", type, DEFAULT_COLLECTIBLE_FRAMES[type]);
      }
    });
    const objectiveTypes = new Set(level.objectives.map((objective) => objective.type));
    const mechanismType = String(level.mechanics?.type || "");
    if (
      objectiveTypes.has("repair-zones")
      || objectiveTypes.has("reflect-reactor")
      || ["polarity", "thermal-relay", "rift-weaver", "delayed-echo", "fold-warden"].includes(mechanismType)
      || Number(level.id) === 101
    ) names.add("mechanisms");
    if (["scale-lenses", "comet-rails", "lantern-shadow", "scorewing-maestro"].includes(mechanismType)) names.add("mechanismsB");

    if (level.isBoss) {
      const boss = level.boss || {};
      const archetype = boss.archetype
        || (boss.id === "boiler-beetle" || level.mechanics?.type === "coolant-trap" ? "boiler-beetle" : "eclipse-observer");
      const frameNames = archetype === "boiler-beetle"
        ? ["boilerNormal", "boilerCharge", "boilerCoreOpen", "boilerFrozenHit"]
        : archetype === "rift-weaver"
          ? ["weaverIdle", "weaverThreadCharge", "weaverThreadDash", "weaverCocoon", "weaverBeam", "weaverStunned", "weaverCoreOpen", "weaverDefeated"]
          : archetype === "star-whale"
            ? ["whaleIdle", "whaleCharge", "whaleDive", "whaleShield", "whaleBeam", "whaleStunned", "whaleCoreOpen", "whaleDefeated"]
          : archetype === "fold-warden"
            ? ["foldWardenIdle", "foldWardenTelegraph", "foldWardenDive", "foldWardenShield", "foldWardenTrapped", "foldWardenStunned", "foldWardenCoreOpen", "foldWardenDefeated"]
          : archetype === "sky-paper-dragon"
            ? ["dragonIdle", "dragonBridge", "dragonCharge", "dragonDive", "dragonShield", "dragonStunned", "dragonCoreOpen", "dragonDefeated"]
          : archetype === "scorewing-maestro"
            ? ["scorewingIdle", "scorewingCharge", "scorewingShardCast", "scorewingVolleyGuard", "scorewingStunned", "scorewingCoreOpen", "scorewingEnraged", "scorewingDefeated"]
          : ["eclipseNormal", "eclipseBeamCharge", "eclipseShieldBreak", "eclipseCoreExposed"];
      frameNames.forEach((name) => addFrameSheet(names, "bossFrames", name, DEFAULT_BOSS_FRAMES[name]));
    }
    return [...names];
  }

  function preloadLevelArt(level) {
    return Promise.all(levelArtAssetNames(level).map(preloadArtAsset));
  }

  function nextCampaignArtLevel(level) {
    if (!level || currentMode !== "campaign") return null;
    const nextId = nextCampaignLevelId(level.id);
    const raw = CAMPAIGN_LEVELS.find((entry) => Number(entry.id) === Number(nextId));
    return raw ? normalizeLevel(deepClone(raw)) : null;
  }

  function cancelArtWarmup() {
    if (artWarmupHandle === null) return;
    if (artWarmupHandleType === "idle" && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(artWarmupHandle);
    else window.clearTimeout(artWarmupHandle);
    artWarmupHandle = null;
    artWarmupHandleType = null;
  }

  function evictArtAssetsExcept(names) {
    const keep = new Set(["hero", "paper", ...names]);
    for (const [key, record] of artImageCache.entries()) {
      if (keep.has(record.name)) continue;
      artImageCache.delete(key);
      artImageLoadPromises.delete(key);
    }
  }

  function retainLevelArt(level, warmLevel = null) {
    const names = new Set(level ? levelArtAssetNames(level) : []);
    if (warmLevel) levelArtAssetNames(warmLevel).forEach((name) => names.add(name));
    evictArtAssetsExcept(names);
  }

  function scheduleLevelArtWarmup(level) {
    cancelArtWarmup();
    if (!level) return;
    const connection = window.navigator?.connection;
    if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType)) return;
    const sourceLevel = currentLevel;
    const run = async () => {
      artWarmupHandle = null;
      artWarmupHandleType = null;
      const results = await preloadLevelArt(level);
      if (results.every(Boolean) && (!sourceLevel || currentLevel === sourceLevel)) retainLevelArt(sourceLevel, level);
    };
    if (typeof window.requestIdleCallback === "function") {
      artWarmupHandleType = "idle";
      artWarmupHandle = window.requestIdleCallback(run, { timeout: 5000 });
    } else {
      artWarmupHandleType = "timeout";
      artWarmupHandle = window.setTimeout(run, 1800);
    }
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
  let currentMode = "campaign";
  let currentLevel = null;
  let runtime = null;
  let player = null;
  let cameraX = 0;
  let autoCameraX = 0;
  let menuTime = 0;
  let accumulator = 0;
  let previousTime = performance.now();
  let shake = 0;
  let flash = 0;
  let toastTimer = 0;
  let muted = save.muted || false;
  let audioContext = null;
  let captureReady = false;
  let animationFrameId = null;
  let levelArtState = "idle";
  let levelArtLoadRequest = 0;
  let levelArtAutoStart = false;
  const hudRenderCache = Object.create(null);

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
      const completed = Array.isArray(parsed.completed)
        ? [...new Set(parsed.completed.map(Number).filter((id) => CAMPAIGN_LEVEL_IDS.has(id)))].sort((a, b) => a - b)
        : [];
      let unlocked = clamp(Number(parsed.unlocked) || FIRST_LEVEL_ID, FIRST_LEVEL_ID, MAX_LEVEL_ID);
      // v2 originally ended at stage 8 and therefore persisted unlocked=8 even
      // after victory. Preserve that progress while opening the first new act.
      if (completed.includes(8)) unlocked = Math.max(unlocked, nextCampaignLevelId(8) || unlocked);
      // Act V used to be the campaign finale. Completed saves should enter
      // the new celestial route without asking players to replay that boss.
      if (completed.includes(20)) unlocked = Math.max(unlocked, nextCampaignLevelId(20) || unlocked);
      // Act VI was the previous ending. A cleared paper-dragon save should
      // continue at the new theatre instead of replaying stage 24.
      if (completed.includes(24)) unlocked = Math.max(unlocked, nextCampaignLevelId(24) || unlocked);
      const unlockedModules = unlockedModulesFor(completed);
      const requestedModule = typeof parsed.heroModule === "string" ? parsed.heroModule : "none";
      const trialRecords = parsed.trialRecords && typeof parsed.trialRecords === "object"
        ? Object.fromEntries(Object.entries(parsed.trialRecords).map(([id, record]) => [id, {
          score: Math.max(0, Number(record?.score) || 0),
          combo: Math.max(0, Number(record?.combo) || 0),
          grade: typeof record?.grade === "string" ? record.grade : "—",
          tide: Math.max(0, Number(record?.tide) || 0),
          cleared: Boolean(record?.cleared),
        }]))
        : {};
      const storedDiscoveries = Array.isArray(parsed.discoveries)
        ? parsed.discoveries.filter((key) => typeof key === "string")
        : [];
      const inferredEnemyDiscoveries = CAMPAIGN_LEVELS
        .filter((level) => completed.includes(Number(level.id)))
        .flatMap((level) => (level.enemies || []).map((enemy) => `enemy:${enemy.type}`));
      const discoveries = [...new Set([...storedDiscoveries, ...inferredEnemyDiscoveries])]
        .filter((key) => {
          const [kind, id] = key.split(":");
          return kind !== "enemy" || Boolean(DISCOVERY_BY_ID[id]);
        });
      return {
        unlocked,
        completed,
        // Older v2 saves counted repeat pickups. Preserve that historical total
        // while collectedSeeds prevents any new duplicate farming.
        seeds: Math.max(0, Number(parsed.seeds) || 0, collectedSeeds.length),
        collectedSeeds,
        deaths: Number(parsed.deaths) || 0,
        muted: Boolean(parsed.muted),
        heroModule: unlockedModules.includes(requestedModule) ? requestedModule : "none",
        trialRecords,
        discoveries,
      };
    } catch {
      return { unlocked: FIRST_LEVEL_ID, completed: [], seeds: 0, collectedSeeds: [], deaths: 0, muted: false, heroModule: "none", trialRecords: {}, discoveries: [] };
    }
  }

  function discoveryKey(kind, id) {
    return `${String(kind)}:${String(id)}`;
  }

  function discoverEnemy(type, notifyPlayer = true) {
    const id = String(type || "");
    const entry = DISCOVERY_BY_ID[id];
    if (!entry) return false;
    const key = discoveryKey("enemy", id);
    if (save.discoveries.includes(key)) return false;
    save.discoveries.push(key);
    persist();
    if (notifyPlayer) toast(`裂界图鉴新增 · ${entry.name}`, 1.15);
    return true;
  }

  function discoveredEnemies() {
    const found = new Set(save.discoveries.filter((key) => key.startsWith("enemy:")));
    return DISCOVERY_CATALOG.filter((entry) => found.has(discoveryKey("enemy", entry.id)));
  }

  function unlockedModulesFor(completed = save?.completed || []) {
    const cleared = new Set((completed || []).map(Number));
    return Object.values(HERO_MODULES)
      .filter((module) => module.unlockBoss === 0 || cleared.has(module.unlockBoss))
      .map((module) => module.id);
  }

  function equipHeroModule(moduleId) {
    const next = String(moduleId || "none");
    const unlocked = unlockedModulesFor();
    if (!HERO_MODULES[next] || !unlocked.includes(next)) {
      toast("这枚芽芯仍沉睡在尚未修复的守门核心中", 1.5);
      return false;
    }
    save.heroModule = next;
    persist();
    renderProfile();
    renderLevelGrid();
    return true;
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

  function trialById(id = "night-watch") {
    return TRIALS.find((trial) => trial.id === id) || TRIALS[0] || null;
  }

  function trialGrade(score, survived) {
    if (!survived) return score >= 1800 ? "B" : score >= 850 ? "C" : "D";
    if (score >= 5200) return "S";
    if (score >= 3400) return "A";
    if (score >= 1900) return "B";
    return "C";
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
      worldWidth: Math.max(VIEW_W, Number(raw.worldWidth || raw.width) || (BOSS_LEVEL_IDS.has(id) ? 1600 : 3900)),
      worldHeight: Number(raw.worldHeight || raw.height) || VIEW_H,
      spawn: { x: Number(spawn.x) || 96, y: Number(spawn.y) || 480 },
      goal: { ...goal, x: Number(goal.x) || 3400, y: Number(goal.y) || 470, w: Number(goal.w) || 72, h: Number(goal.h) || 130 },
      platforms: Array.isArray(raw.platforms) ? raw.platforms : [],
      hazards: Array.isArray(raw.hazards) ? raw.hazards : [],
      enemies: Array.isArray(raw.enemies) ? raw.enemies : [],
      collectibles: Array.isArray(raw.collectibles) ? raw.collectibles : [],
      checkpoints: Array.isArray(raw.checkpoints) ? raw.checkpoints : [],
      objectives: Array.isArray(raw.objectives) ? deepClone(raw.objectives) : [],
      tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 4) : [],
      thumbnail: raw.thumbnail || raw.theme?.thumbnail || null,
      mechanics,
      isBoss: Boolean(raw.isBoss || raw.kind === "boss" || raw.boss || BOSS_LEVEL_IDS.has(id)),
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

  function polarityValue(value) {
    const normalized = String(value || "").toLowerCase();
    return normalized === "sun" || normalized === "moon" ? normalized : null;
  }

  function normalizeRail(raw, index) {
    const points = (Array.isArray(raw?.points) ? raw.points : [])
      .map((point) => ({ x: Number(point?.x) || 0, y: Number(point?.y) || 0 }));
    const segments = [];
    let totalLength = 0;
    for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
      const from = points[pointIndex - 1];
      const to = points[pointIndex];
      const length = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
      segments.push({ from, to, length, start: totalLength });
      totalLength += length;
    }
    return {
      ...deepClone(raw || {}),
      id: raw?.id || `rail-${index}`,
      points,
      segments,
      totalLength: Math.max(1, totalLength),
      next: Array.isArray(raw?.next) ? [...raw.next] : [],
      index,
    };
  }

  function sampleRail(rail, distance) {
    if (!rail?.segments?.length) {
      const point = rail?.points?.[0] || { x: 0, y: 0 };
      return { x: point.x, y: point.y, tx: 1, ty: 0 };
    }
    const clamped = clamp(Number(distance) || 0, 0, rail.totalLength);
    const segment = rail.segments.find((entry) => clamped <= entry.start + entry.length) || rail.segments.at(-1);
    const ratio = clamp((clamped - segment.start) / segment.length, 0, 1);
    return {
      x: lerp(segment.from.x, segment.to.x, ratio),
      y: lerp(segment.from.y, segment.to.y, ratio),
      tx: (segment.to.x - segment.from.x) / segment.length,
      ty: (segment.to.y - segment.from.y) / segment.length,
    };
  }

  function makeRuntime(level) {
    const devices = mergedDevices(level);
    const springSpecs = new Map(
      (Array.isArray(devices.springs) ? devices.springs : [])
        .filter((spring) => spring?.platform)
        .map((spring) => [spring.platform, spring]),
    );
    const platforms = level.platforms.map((platform, index) => {
      const spring = springSpecs.get(platform.id) || {};
      const p = {
        ...platform,
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
        polarity: polarityValue(platform.polarity),
        bounceY: Number(platform.bounceY ?? spring.bounceY) || 0,
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
      maxHp: Number(enemy.hp) || 1,
      alive: true,
      t: index * 0.63,
      cooldown: 0.5 + index * 0.22,
      state: "patrol",
      stateTimer: 0,
      patrolVx: Number(enemy.vx || enemy.speed) * (index % 2 ? -1 : 1) || (index % 2 ? -70 : 70),
      baseY: Number(enemy.y) || 500,
      rewindX: Number(enemy.x) || 0,
      rewindY: Number(enemy.y) || 500,
      rewindTimer: 1.2,
      rewindCooldown: 0,
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
      w: Number(point.w) || 34,
      h: Number(point.h) || 92,
      respawn: point.respawn || null,
      activation: point.activation === "proximity" ? "proximity" : "forward",
      radius: Math.max(40, Number(point.radius) || 140),
      active: false,
      reached: false,
    }));

    const rawSwitches = Array.isArray(devices.switches) ? devices.switches : [];
    const makeDevice = (device, index, defaults) => ({
      ...device,
      id: device.id || `${defaults.prefix}-${index}`,
      x: Number(device.x) || 0,
      y: Number(device.y) || 0,
      w: Number(device.w || device.width) || defaults.w,
      h: Number(device.h || device.height) || defaults.h,
      active: false,
      timer: 0,
      index,
    });
    const polaritySwitches = rawSwitches
      .filter((device) => device.mode === "toggle-polarity")
      .map((device, index) => makeDevice(device, index, { prefix: "polarity", w: 54, h: 70 }));
    const relays = rawSwitches
      .filter((device) => device.mode === "timed" || device.role === "boss-relay")
      .map((device, index) => makeDevice(device, index, { prefix: "relay", w: 54, h: 62 }));
    const switches = rawSwitches
      .filter((device) => device.mode !== "toggle-polarity" && device.mode !== "timed" && device.role !== "boss-relay")
      .map((device, index) => makeDevice(device, index, { prefix: "switch", w: 54, h: 54 }));
    const polarityConfig = devices.polarity && typeof devices.polarity === "object" ? devices.polarity : {};
    const initialPolarity = polarityValue(polarityConfig.initial) || "sun";
    const objectives = level.objectives.map((objective, objectiveIndex) => {
      const type = String(objective.type || "");
      const zones = Array.isArray(objective.zones) ? objective.zones : [];
      const reactors = Array.isArray(objective.reactors) ? objective.reactors : [];
      return {
        ...deepClone(objective),
        id: objective.id || `objective-${objectiveIndex}`,
        type,
        required: Math.max(1, Number(objective.required || objective.count) || 1),
        submitted: false,
        completed: false,
        zones: zones.map((zone, index) => ({
          ...zone,
          id: zone.id || `repair-${objectiveIndex}-${index}`,
          x: Number(zone.x) || 0,
          y: Number(zone.y) || 0,
          w: Number(zone.w) || 80,
          h: Number(zone.h) || 110,
          repaired: false,
          index,
        })),
        reactors: reactors.map((reactor, index) => ({
          ...reactor,
          id: reactor.id || `reactor-${objectiveIndex}-${index}`,
          x: Number(reactor.x) || 0,
          y: Number(reactor.y) || 0,
          w: Number(reactor.w) || 72,
          h: Number(reactor.h) || 64,
          charge: 0,
          requiredCharge: Math.max(1, Number(reactor.requiredCharge) || 6),
          powered: false,
          index,
        })),
      };
    });

    const weightBlocks = (Array.isArray(devices.weightBlocks) ? devices.weightBlocks : []).map((weight, index) => ({
      ...deepClone(weight),
      id: weight.id || `weight-${index}`,
      x: Number(weight.x) || 0,
      y: Number(weight.y) || 0,
      w: Number(weight.w) || 58,
      h: Number(weight.h) || 66,
      mass: Math.max(1, Number(weight.mass) || 1),
      vx: 0,
      seatedSlotId: null,
      weightBlock: true,
      index,
    }));
    const weightSlots = (Array.isArray(devices.weightSlots) ? devices.weightSlots : []).map((slot, index) => ({
      ...deepClone(slot),
      id: slot.id || `weight-slot-${index}`,
      x: Number(slot.x) || 0,
      y: Number(slot.y) || 0,
      w: Number(slot.w) || 86,
      h: Number(slot.h) || 35,
      capacity: Math.max(1, Number(slot.capacity) || 1),
      index,
    }));
    const scaleBridges = (Array.isArray(devices.scaleBridges) ? devices.scaleBridges : []).map((bridge, index) => ({
      ...deepClone(bridge),
      id: bridge.id || `scale-bridge-${index}`,
      platformId: bridge.platform,
      balanced: false,
      leftMass: 0,
      rightMass: 0,
      delta: 0,
      index,
    }));
    const seams = (Array.isArray(devices.seams) ? devices.seams : []).map((seam, index) => ({
      ...deepClone(seam),
      id: seam.id || `silhouette-seam-${index}`,
      x: Number(seam.x) || 0,
      y: Number(seam.y) || 0,
      w: Number(seam.w) || 74,
      h: Number(seam.h) || 360,
      crossed: false,
      cooldown: 0,
      index,
    }));
    const weaveRules = devices.weaveRules && typeof devices.weaveRules === "object" ? deepClone(devices.weaveRules) : {};
    const looms = (Array.isArray(devices.looms) ? devices.looms : []).map((loom, index) => ({
      ...deepClone(loom),
      id: loom.id || `trajectory-loom-${index}`,
      x: Number(loom.x) || 0,
      y: Number(loom.y) || 0,
      w: Number(loom.w) || 62,
      h: Number(loom.h) || 86,
      completed: false,
      active: false,
      index,
    }));
    const bodyPlatforms = (Array.isArray(devices.bodyPlatforms) ? devices.bodyPlatforms : []).map((bodyPlatform, index) => ({
      ...deepClone(bodyPlatform),
      id: bodyPlatform.platform || `dragon-body-${index}`,
      platformId: bodyPlatform.platform,
      index,
    }));
    const dragonKnots = (Array.isArray(devices.knotScales) ? devices.knotScales : []).map((knot, index) => ({
      ...deepClone(knot),
      id: knot.id || `dragon-knot-${index}`,
      platformId: knot.platform,
      x: 0,
      y: 0,
      w: Number(knot.w) || 64,
      h: Number(knot.h) || 42,
      active: false,
      index,
    }));

    const growthLenses = (Array.isArray(devices.lenses) ? devices.lenses : []).map((lens, index) => ({
      ...deepClone(lens),
      id: lens.id || `growth-lens-${index}`,
      x: Number(lens.x) || 0,
      y: Number(lens.y) || 0,
      w: Number(lens.w) || 62,
      h: Number(lens.h) || 92,
      cooldown: 0,
      index,
    }));
    const narrowPassages = (Array.isArray(devices.narrowPassages) ? devices.narrowPassages : []).map((passage, index) => ({
      ...deepClone(passage),
      id: passage.id || `narrow-passage-${index}`,
      x: Number(passage.x) || 0,
      y: Number(passage.y) || 0,
      w: Number(passage.w) || 120,
      h: Number(passage.h) || 110,
      barrierW: clamp(Number(passage.barrierW) || 38, 24, 64),
      index,
    }));
    const waxSeals = (Array.isArray(devices.waxSeals) ? devices.waxSeals : []).map((seal, index) => ({
      ...deepClone(seal),
      id: seal.id || `wax-seal-${index}`,
      x: Number(seal.x) || 0,
      y: Number(seal.y) || 0,
      w: Number(seal.w) || 56,
      h: Number(seal.h) || 170,
      hp: Math.max(1, Number(seal.hp) || 1),
      broken: false,
      waxSealId: seal.id || `wax-seal-${index}`,
      index,
    }));

    const rails = (Array.isArray(devices.rails) ? devices.rails : []).map(normalizeRail);
    const railById = new Map(rails.map((rail) => [rail.id, rail]));
    const railJunctions = (Array.isArray(devices.junctions) ? devices.junctions : []).map((junction, index) => ({
      ...deepClone(junction),
      id: junction.id || `rail-junction-${index}`,
      x: Number(junction.x) || 0,
      y: Number(junction.y) || 0,
      w: Number(junction.w) || 100,
      h: Number(junction.h) || 120,
      options: Array.isArray(junction.options) ? deepClone(junction.options) : [],
      selectedRail: junction.options?.[0]?.rail || null,
      cooldown: 0,
      index,
    }));
    const railStations = (Array.isArray(devices.stations) ? devices.stations : []).map((station, index) => ({
      ...deepClone(station),
      id: station.id || `rail-station-${index}`,
      x: Number(station.x) || 0,
      y: Number(station.y) || 0,
      w: Number(station.w) || 180,
      h: Number(station.h) || 90,
      visited: false,
      index,
    }));
    const railCarts = (Array.isArray(devices.carts) ? devices.carts : []).map((cart, index) => {
      const rail = railById.get(cart.rail) || rails[0];
      const w = Number(cart.w) || 120;
      const h = Number(cart.h) || 28;
      const distance = clamp(Number(cart.progress) || 0, 0, 1) * (rail?.totalLength || 1);
      const sample = sampleRail(rail, distance);
      const platformId = `rail-cart-platform-${cart.id || index}`;
      platforms.push({
        id: platformId,
        x: sample.x - w / 2,
        y: sample.y,
        w,
        h,
        type: "rail-cart",
        material: "rail-brass",
        originX: sample.x - w / 2,
        originY: sample.y,
        dx: 0,
        dy: 0,
        railCartId: cart.id || `rail-cart-${index}`,
        conveyor: 0,
        fragile: false,
        hidden: false,
        motion: null,
        phase: 0,
        breakTimer: 0,
        brokenTimer: 0,
      });
      return {
        ...deepClone(cart),
        id: cart.id || `rail-cart-${index}`,
        railId: rail?.id || null,
        distance,
        direction: Number(cart.direction) < 0 ? -1 : 1,
        speed: Math.max(80, Number(cart.speed) || Number(devices.rideSpeed) || 360),
        w,
        h,
        x: sample.x - w / 2,
        y: sample.y,
        tx: sample.tx,
        ty: sample.ty,
        history: [],
        platformId,
        index,
      };
    });

    const searchlights = (Array.isArray(devices.searchlights) ? devices.searchlights : []).map((light, index) => ({
      ...deepClone(light),
      id: light.id || `searchlight-${index}`,
      pivotX: Number(light.pivotX ?? light.x) || 0,
      pivotY: Number(light.pivotY ?? light.y) || 0,
      radius: Math.max(80, Number(light.radius) || 680),
      halfAngle: clamp(Number(light.halfAngle) || 0.25, 0.12, 0.62),
      currentAngle: Number(light.angleMin) || 0,
      index,
    }));
    const shadowScreens = (Array.isArray(devices.screens) ? devices.screens : []).map((screen, index) => ({
      ...deepClone(screen),
      id: screen.id || `shadow-screen-${index}`,
      x: Number(screen.x) || 0,
      y: Number(screen.y) || 0,
      w: Number(screen.w) || 86,
      h: Number(screen.h) || 270,
      originX: Number(screen.x) || 0,
      originY: Number(screen.y) || 0,
      index,
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
      enemyWebs: [],
      rootWaves: [],
      lastPlayerDash: null,
      devices,
      enabled: {},
      inventory: new Set(),
      activeEffects: {},
      charges: {},
      seedTotal: collectibles.filter((item) => item.type === "memory-seed" || item.type === "seed").length,
      goalToastCooldown: 0,
      objectives,
      moduleState: { echoPulse: 0, echoReflections: 0, echoCharge: 0, windLift: 0, rootShield: 0, rootShockwave: 0 },
      crystals: (devices.crystals || []).map((d, i) => ({ ...d, w: d.w || 44, h: d.h || 72, active: false, index: i })),
      switches,
      polaritySwitches,
      relays,
      gates: (devices.gates || []).map((d, i) => ({ ...d, w: d.w || 42, h: d.h || 250, index: i })),
      valves: (devices.valves || []).map((d, i) => ({ ...d, w: d.w || 54, h: d.h || 76, active: false, timer: 0, index: i })),
      mirrors: (devices.mirrors || []).map((d, i) => ({ ...d, w: d.w || 66, h: d.h || 96, active: false, timer: 0, index: i })),
      coolants: (devices.coolants || []).map((d, i) => ({ ...d, w: d.w || 40, h: d.h || 40, active: true, respawn: 0, index: i })),
      timeAnchors: (devices.timeAnchors || []).map((d, i) => ({ ...d, w: d.w || 54, h: d.h || 72, active: false, timer: 0, index: i })),
      echoPads: (devices.echoPads || []).map((d, i) => ({ ...d, w: d.w || 120, h: d.h || 26, active: false, index: i })),
      echoPairs: {},
      echoDelay: Math.max(0.4, Number(devices.echoDelay) || 1.8),
      echoHistory: [],
      echoClone: null,
      gravityAnchors: (devices.gravityAnchors || []).map((d, i) => ({ ...d, x: 0, y: 0, w: d.w || 52, h: d.h || 52, active: false, timer: 0, index: i })),
      foldPanels: (devices.foldPanels || []).map((d, i) => ({ ...d, w: d.w || 58, h: d.h || 82, index: i })),
      foldStates: Object.fromEntries((devices.foldPanels || []).map((d) => [String(d.group), Number(d.initialState) || 0])),
      foldPrevious: {},
      foldGrace: {},
      kiteAnchors: (devices.kiteAnchors || []).map((d, i) => ({ ...d, w: d.w || 72, h: d.h || 150, index: i })),
      kiteVisited: new Set(),
      kiteTether: { anchorId: null, timer: 0 },
      pageTurn: devices.pageTurn ? {
        ...deepClone(devices.pageTurn),
        active: false,
        inkX: level.worldWidth + (Number(devices.pageTurn.startOffset) || 180),
      } : null,
      foldTraps: (devices.foldTraps || []).map((d, i) => ({ ...d, w: d.w || 240, h: d.h || 46, armed: false, timer: 0, index: i })),
      weightBlocks,
      weightSlots,
      scaleBridges,
      silhouetteLane: String(devices.initialLane || "foreground"),
      seams,
      trajectory: {
        rules: weaveRules,
        points: [],
        sampleTimer: 0,
        activeLoomId: null,
        recording: false,
        wovenRoutes: new Set(),
      },
      stitchBridges: [],
      looms,
      dragonBodyPlatforms: bodyPlatforms,
      dragonKnots,
      dragonCycle: {
        index: 0,
        coreOpen: false,
        exposures: 0,
      },
      growthLenses,
      narrowPassages,
      waxSeals,
      growthForm: devices.initialForm === "small" ? "small" : "giant",
      growthTransition: 0,
      rails,
      railJunctions,
      railStations,
      railCarts,
      visitedRailStations: new Set(),
      searchlights,
      shadowScreens,
      shadowExposure: 0,
      shadowLit: false,
      shadowDamageCooldown: 0,
      capturedCrownShards: 0,
      crownShardSerial: 0,
      crownVolleySerial: 0,
      waterY: devices.water?.baseY || 900,
      lavaY: devices.lava?.startY || 900,
      hiddenRevealed: false,
      polarity: {
        current: initialPolarity,
        previous: null,
        grace: 0,
        graceDuration: Math.max(0, Number(polarityConfig.grace) || 0.18),
      },
      bossRelay: devices.bossRelay && typeof devices.bossRelay === "object" ? deepClone(devices.bossRelay) : {},
      boss: null,
      goalOpen: !level.isBoss,
      completed: false,
    };

    if (level.isBoss) {
      const bossData = level.boss || {};
      const arena = bossData.arena || { x: 80, y: 180, w: level.worldWidth - 160, h: 430 };
      const body = bossData.body || {};
      const archetype = bossData.archetype
        || (bossData.id === "boiler-beetle" || level.mechanics?.type === "coolant-trap" ? "boiler-beetle" : "eclipse-observer");
      const isSkyDragon = archetype === "sky-paper-dragon";
      const maxHp = Math.max(1, Number(bossData.maxHealth ?? bossData.hp) || 3);
      rt.boss = {
        id: bossData.id || `boss-${level.id}`,
        archetype,
        name: bossData.name || (level.id === 4 ? "沸压甲虫 · 赫克斯" : "日蚀守门者 · 诺克斯"),
        x: Number(bossData.x || bossData.spawn?.x || arena.x + arena.w * 0.7),
        y: Number(bossData.y) || (level.id === 4 ? 458 : Number(bossData.spawn?.y) || 300),
        w: isSkyDragon ? 240 : Number(bossData.w || body.w) || (level.id === 4 ? 142 : 128),
        h: isSkyDragon ? 205 : Number(bossData.h || body.h) || (level.id === 4 ? 118 : 168),
        vx: -80,
        vy: 0,
        hp: Math.min(maxHp, Math.max(1, Number(bossData.hp) || maxHp)),
        maxHp,
        state: "watching",
        timer: 1.4,
        vulnerable: 0,
        hitFlash: 0,
        arena,
        phase: 1,
        beamTimer: 0,
        phases: Array.isArray(bossData.phases) ? deepClone(bossData.phases) : [],
        mechanism: bossData.mechanism && typeof bossData.mechanism === "object" ? deepClone(bossData.mechanism) : {},
        weakPoint: bossData.weakPoint && typeof bossData.weakPoint === "object" ? deepClone(bossData.weakPoint) : {},
        exposureHits: 0,
        attackIndex: 0,
        targetTrapId: null,
        active: false,
      };
    }
    return rt;
  }

  function makePlayer(level) {
    const form = runtime?.devices?.forms?.[runtime?.growthForm] || {};
    const width = Math.max(20, Math.round(38 * (Number(form.widthScale) || 1)));
    const height = Math.max(30, Math.round(54 * (Number(form.heightScale) || 1)));
    return {
      x: level.spawn.x,
      y: level.spawn.y + 54 - height,
      w: width,
      h: height,
      baseW: 38,
      baseH: 54,
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
      hurtTime: 0,
      health: 5,
      maxHealth: 5,
      respawnX: level.spawn.x,
      respawnY: level.spawn.y,
      downstrike: false,
      inWater: false,
      anim: 0,
      trailTimer: 0,
      windDashJump: 0,
      rootShield: 0,
      rootShieldCharges: 0,
      rootCooldown: 0,
    };
  }

  function makeTrialState(config) {
    const maxCore = Math.max(1, Number(config.coreHealth) || 12);
    const endless = Boolean(config.endless);
    const duration = endless ? 0 : Math.max(1, Number(config.duration) || 90);
    const anchors = (config.circuit?.anchors || []).map((anchor, index) => ({
      ...deepClone(anchor),
      index,
      baseX: Number(anchor.x) || 0,
      baseY: Number(anchor.y) || 0,
      x: Number(anchor.x) || 0,
      y: Number(anchor.y) || 0,
      w: Math.max(32, Number(anchor.w) || 58),
      h: Math.max(32, Number(anchor.h) || 68),
      jammed: 0,
      playerInside: false,
    }));
    const trial = {
      id: config.id,
      name: config.name || "星芽守夜",
      endless,
      duration,
      elapsed: 0,
      timeLeft: endless ? Infinity : duration,
      score: 0,
      combo: 0,
      bestCombo: 0,
      comboTimer: 0,
      core: { x: 583, y: 500, w: 114, h: 120, hp: maxCore, maxHp: maxCore, shield: 0, hitFlash: 0 },
      spawnTimer: 1.25,
      spawnCount: 0,
      upgradeIndex: 0,
      upgrades: new Set(),
      upgradeRanks: {},
      phaseIndex: 0,
      phaseSerial: 0,
      cycle: 0,
      phaseName: config.circuit?.phases?.[0]?.name || "点灯",
      phaseTask: config.circuit?.phases?.[0]?.task || "relay",
      phaseObjectiveStart: 0,
      arenaMotion: "still",
      route: [],
      routeActions: [],
      routeProgress: 0,
      routeTimer: 0,
      routeSerial: 0,
      routeDashLinks: 0,
      circuits: 0,
      dashLinks: 0,
      anchors,
      meteors: [],
      meteorTimer: 2.4,
      meteorSerial: 0,
      escort: {
        active: false,
        x: 622,
        y: 532,
        w: 36,
        h: 36,
        hp: 5,
        maxHp: 5,
        targetId: "west",
        targetIndex: 0,
        deliveries: 0,
        routeId: null,
        routeTargets: [],
        routeSelectionTimer: 0,
        routeArmor: 0,
        riskMultiplier: 1,
        speedMultiplier: 1,
        spawnIntervalMultiplier: 1,
      },
      salvage: {
        seeds: [],
        carrying: 0,
        delivered: 0,
        spawnTimer: 0,
        serial: 0,
      },
      repairNodes: anchors.map((anchor) => ({ id: anchor.id, charge: 0, required: 3, requiredAction: null, charged: false })),
      repairResetTimer: 0,
      repairedSets: 0,
      rift: { active: false, x: 640, y: 126, hp: 3, maxHp: 3, armed: false, closures: 0, hitFlash: 0 },
      reflections: 0,
      siege: {
        active: false,
        elapsed: 0,
        rotationIndex: 0,
        objectiveTask: null,
        objectiveStart: 0,
        objectiveRequired: 0,
        objectivesCompleted: 0,
        eliteDefeated: false,
        eliteScoreMultiplier: 1,
        elite: {
          active: false,
          spawned: false,
          defeated: false,
          x: 574,
          y: 404,
          w: 132,
          h: 164,
          hp: 12,
          maxHp: 12,
          shieldAction: "pulse",
          shieldIndex: 0,
          shieldTimer: 0,
          attackTimer: 2.4,
          hitFlash: 0,
          score: 2600,
          eventBuffed: false,
        },
      },
      activeEvent: null,
      eventScheduleIndex: 0,
      eventSerial: 0,
      eventHistory: [],
      eventRng: hashTrialSeed(`${config.eventPlan?.seed || config.id}:${Date.now()}`),
      nextEventAt: Math.max(0, Number(config.eventPlan?.firstAt) || Infinity),
      knockouts: 0,
      finished: false,
      survived: false,
    };
    return trial;
  }

  function showOnly(id) {
    $$(".screen").forEach((screen) => {
      const visible = screen.id === id;
      screen.classList.toggle("is-visible", visible);
      screen.setAttribute("aria-hidden", visible ? "false" : "true");
      if (visible) {
        screen.scrollTop = 0;
        screen.scrollLeft = 0;
      }
    });
  }

  function setGameUi(visible) {
    if (!visible) resetInput();
    $("#hud").classList.toggle("is-visible", visible);
    $("#hud").setAttribute("aria-hidden", visible ? "false" : "true");
    $("#touch-controls").classList.toggle("is-visible", visible);
  }

  function setNodeText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = String(value ?? "");
  }

  function ensureProfileUi() {
    if (!document.getElementById || document.getElementById("profile-screen")) return;
    const app = document.getElementById("app");
    if (!app?.appendChild) return;
    const screen = document.createElement("section");
    screen.id = "profile-screen";
    screen.className = "screen profile-screen";
    screen.setAttribute("aria-label", "星芽档案");
    screen.innerHTML = `<header class="section-heading"><div><span class="eyebrow">SPROUT PROFILE</span><h2>星芽档案</h2></div><button class="text-action" data-action="back">返回</button></header>
      <div id="profile-progress"><strong id="profile-module-name"></strong><p id="profile-module-description"></p><p id="profile-module-status"></p><span id="profile-stage-progress"></span><i id="profile-stage-fill"></i><span id="profile-seed-count"></span><span id="profile-death-count"></span></div>
      <div id="module-grid" class="module-grid">${["echo", "wind", "root"].map((id) => `<button data-module="${id}"><strong>${HERO_MODULES[id].name}</strong><small>${HERO_MODULES[id].description}</small></button>`).join("")}</div>`;
    app.appendChild(screen);
    const menu = document.querySelector(".menu-actions");
    if (menu && !menu.querySelector?.('[data-action="profile"]')) {
      const button = document.createElement("button");
      button.dataset.action = "profile";
      button.textContent = "星芽档案";
      menu.appendChild(button);
    }
  }

  function campaignProgressPercent() {
    return Math.round(campaignCompletedCount(save.completed) / Math.max(1, CAMPAIGN_LEVELS.length) * 100);
  }

  function renderProfile() {
    const equipped = HERO_MODULES[save.heroModule] || HERO_MODULES.none;
    const unlocked = new Set(unlockedModulesFor());
    const completedCount = campaignCompletedCount(save.completed);
    setNodeText("#profile-module-name", equipped.name);
    setNodeText("#profile-module-description", equipped.description);
    setNodeText("#profile-module-status", save.heroModule === "none" ? "当前未装备额外芽芯" : `已装备 · ${equipped.name}`);
    setNodeText("#profile-stage-progress", `${completedCount} / ${CAMPAIGN_LEVELS.length} 关`);
    setNodeText("#profile-completed-count", completedCount);
    setNodeText("#profile-seed-count", `${save.seeds} 枚记忆种子`);
    setNodeText("#profile-death-count", `${save.deaths} 次重整`);
    const fill = $("#profile-stage-fill");
    if (fill) fill.style.transform = `scaleX(${campaignProgressPercent() / 100})`;
    $$('[data-module]').forEach((button) => {
      const id = String(button.dataset.module || "");
      const heroModule = HERO_MODULES[id];
      if (!heroModule) return;
      const available = unlocked.has(id);
      const active = save.heroModule === id;
      button.disabled = !available;
      button.classList.toggle("is-locked", !available);
      button.classList.toggle("is-equipped", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.dataset.unlockBoss = String(heroModule.unlockBoss);
      button.title = available ? heroModule.description : `完成第 ${heroModule.unlockBoss} 关 BOSS 后解锁`;
      const status = button.querySelector?.("i");
      if (status) status.textContent = active ? "已装备" : available ? "选择" : `BOSS ${pad(heroModule.unlockBoss)} 解锁`;
    });
  }

  function bestiarySpriteStyle(entry, index) {
    const frame = frameSpec("enemyFrames", entry.id, DEFAULT_ENEMY_FRAMES[entry.id]);
    const asset = artAssetConfig(frame?.sheet);
    const cols = Math.max(1, Number(frame?.cols || asset.cols) || 4);
    const rows = Math.max(1, Number(frame?.rows || asset.rows) || 2);
    const x = cols > 1 ? Number(frame?.col || 0) / (cols - 1) * 100 : 50;
    const y = rows > 1 ? Number(frame?.row || 0) / (rows - 1) * 100 : 50;
    const accents = ["#65e2df", "#f6c453", "#f05d6a", "#9e83ff", "#ff8c5a", "#71c7d4"];
    return {
      sprite: `--sprite-image:url("${asset.src}");--sprite-size:${cols * 100}% ${rows * 100}%;--sprite-x:${x}%;--sprite-y:${y}%`,
      accent: accents[index % accents.length],
    };
  }

  function renderBestiary() {
    const grid = $("#bestiary-grid");
    if (!grid) return;
    const entries = discoveredEnemies();
    setNodeText("#bestiary-count", entries.length ? `已记录 ${entries.length} 种裂界生命` : "尚无生态记录");
    setNodeText("#bestiary-home-count", entries.length ? `${pad(entries.length)} RECORDS` : "FIELD NOTES");
    if (!entries.length) {
      grid.innerHTML = `<div class="bestiary-empty"><div><strong>纸页仍是空白</strong><span>进入裂界，让第一种生命真正出现在星芽视野里。</span></div></div>`;
      return;
    }
    grid.innerHTML = entries.map((entry, index) => {
      const style = bestiarySpriteStyle(entry, index);
      return `<article class="bestiary-card" data-index="${pad(index + 1)}" style="--creature-accent:${style.accent}">
        <span class="bestiary-sprite" aria-hidden="true" style='${style.sprite}'></span>
        <div class="bestiary-copy">
          <small>${entry.habitat}</small>
          <h3>${entry.name}</h3>
          <p>${entry.trait}</p>
          <p><strong>应对：</strong>${entry.counter}</p>
        </div>
      </article>`;
    }).join("");
  }

  function openMenu() {
    stopAnimationLoop();
    scene = "menu";
    currentMode = "campaign";
    currentLevel = null;
    runtime = null;
    player = null;
    cameraX = 0;
    setGameUi(false);
    showOnly("start-screen");
    const continueLabel = save.unlocked > FIRST_LEVEL_ID ? `继续第 ${save.unlocked} 关` : "开始远征";
    $("#continue-label").textContent = continueLabel;
    const expedition = CAMPAIGN_LEVELS.find((level) => Number(level.id) === Number(save.unlocked)) || CAMPAIGN_LEVELS[0];
    if (expedition) scheduleLevelArtWarmup(normalizeLevel(deepClone(expedition)));
    setNodeText("#expedition-stage", `STAGE ${pad(expedition?.id || FIRST_LEVEL_ID)}`);
    setNodeText("#expedition-name", expedition?.name || "等待新的裂界");
    setNodeText("#expedition-progress", `${campaignCompletedCount(save.completed)} / ${CAMPAIGN_LEVELS.length} 已修复`);
    const riftEntry = document.querySelector?.('[data-action="continue"]');
    if (riftEntry) riftEntry.setAttribute("aria-label", `${continueLabel}：${expedition?.name || "新的裂界"}`);
    const progressFill = $("#expedition-progress-fill");
    if (progressFill) progressFill.style.transform = `scaleX(${campaignProgressPercent() / 100})`;
    const record = save.trialRecords?.["night-watch"];
    setNodeText("#trial-home-record", record?.score ? `最高记录 · ${record.score.toLocaleString("zh-CN")} 分 · ${record.grade}` : "最高记录 · 尚未守夜");
    renderProfile();
    renderBestiary();
  }

  function openLevels() {
    stopAnimationLoop();
    scene = "levels";
    setGameUi(false);
    renderLevelGrid();
    showOnly("level-screen");
  }

  function openHelp() {
    stopAnimationLoop();
    scene = "help";
    setGameUi(false);
    showOnly("help-screen");
  }

  function openProfile() {
    stopAnimationLoop();
    scene = "profile";
    setGameUi(false);
    renderProfile();
    showOnly("profile-screen");
  }

  function openBestiary() {
    stopAnimationLoop();
    scene = "bestiary";
    setGameUi(false);
    renderBestiary();
    showOnly("bestiary-screen");
  }

  function renderTrialRecords() {
    const record = save.trialRecords?.["night-watch"] || { score: 0, combo: 0, grade: "—", cleared: false };
    const rush = save.trialRecords?.["night-rush"] || { score: 0, combo: 0, grade: "—" };
    const endless = save.trialRecords?.["night-endless"] || { score: 0, tide: 0, grade: "—" };
    setNodeText("#trial-best-score", Number(record.score).toLocaleString("zh-CN"));
    setNodeText("#trial-best-grade", record.grade || "—");
    setNodeText("#trial-best-combo", `×${Number(record.combo) || 0}`);
    setNodeText("#trial-patrol-record", record.cleared ? `已完成 · ${Number(record.score).toLocaleString("zh-CN")} 分` : "未完成整夜巡逻");
    setNodeText("#trial-rush-record", rush.score ? `最高 ${Number(rush.score).toLocaleString("zh-CN")} 分 · ${rush.grade}` : "尚无急袭记录");
    setNodeText("#trial-endless-record", endless.tide ? `最高第 ${Number(endless.tide)} 潮 · ${Number(endless.score).toLocaleString("zh-CN")} 分` : "完成裂界夜巡后解锁");
    const endlessButton = document.querySelector?.('[data-trial-id="night-endless"]');
    if (endlessButton) {
      endlessButton.disabled = !record.cleared;
      endlessButton.setAttribute("aria-label", record.cleared ? "开始无尽守夜" : "无尽守夜尚未解锁，需先完成裂界夜巡");
    }
  }

  function openTrials() {
    stopAnimationLoop();
    resetInput();
    scene = "trials";
    currentMode = "trial";
    currentLevel = null;
    runtime = null;
    player = null;
    setGameUi(false);
    renderTrialRecords();
    showOnly("trial-screen");
  }

  function preparePlayableLevel(raw, mode, skipBriefing = false, config = null) {
    cancelArtWarmup();
    stopAnimationLoop();
    resetInput();
    currentMode = mode;
    currentLevel = normalizeLevel(deepClone(raw));
    runtime = makeRuntime(currentLevel);
    if (mode === "trial" && config) {
      runtime.trial = makeTrialState(config);
      applyTrialPhase(runtime.trial, config, true);
    }
    player = makePlayer(currentLevel);
    cameraX = clamp(currentLevel.spawn.x - 180, 0, Math.max(0, currentLevel.worldWidth - VIEW_W));
    autoCameraX = cameraX;
    shake = 0;
    flash = 0;
    captureReady = false;
    updateHud();
    const pauseRoute = $("#pause-mode-home");
    if (pauseRoute) {
      pauseRoute.dataset.action = mode === "trial" ? "trials" : "levels";
      pauseRoute.textContent = mode === "trial" ? "守夜档案" : "跃界航线";
    }

    scene = "briefing";
    levelArtAutoStart = skipBriefing;
    setGameUi(false);
    const briefing = config?.briefing;
    $("#briefing-number").textContent = mode === "trial" ? (briefing?.kicker || "SIDE MODE") : `STAGE ${pad(currentLevel.id)}${currentLevel.isBoss ? " · BOSS" : ""}`;
    $("#briefing-title").textContent = briefing?.title || currentLevel.name;
    $("#briefing-subtitle").textContent = briefing?.subtitle || currentLevel.subtitle;
    $("#briefing-mechanic").textContent = briefing?.mechanic || currentLevel.mechanic;
    showOnly("briefing");
    loadCurrentLevelArt();
  }

  function startLevel(id, skipBriefing = false) {
    preparePlayableLevel(rawLevel(id), "campaign", skipBriefing);
  }

  function startTrial(id = "night-watch", skipBriefing = false) {
    const config = trialById(id);
    if (!config?.level) {
      toast("守夜航线尚未展开", 1.4);
      return false;
    }
    if (id === "night-endless" && !save.trialRecords?.["night-watch"]?.cleared) {
      toast("完成一次裂界夜巡后才会开启无尽守夜", 1.7);
      return false;
    }
    preparePlayableLevel(config.level, "trial", skipBriefing, config);
    return true;
  }

  function setLevelArtState(state) {
    levelArtState = state;
    const briefing = $("#briefing");
    const status = $("#briefing-load-status");
    const retry = $("#briefing-retry");
    const prompt = $("#briefing-start-prompt");
    if (briefing) briefing.dataset.loadState = state;
    if (status) {
      status.textContent = state === "failed"
        ? "星芽与场景没有完整展开，请重新加载"
        : state === "ready"
          ? "星芽与场景已就绪"
          : "正在展开星芽与本关场景……";
    }
    if (retry) retry.hidden = state !== "failed";
    if (prompt) prompt.hidden = state !== "ready";
  }

  async function loadCurrentLevelArt(retryFailed = false) {
    if (!currentLevel || scene !== "briefing") return;
    const level = currentLevel;
    const request = ++levelArtLoadRequest;
    const assetNames = levelArtAssetNames(level);
    if (retryFailed) clearFailedArtAssets(assetNames);
    setLevelArtState("loading");
    const pending = preloadLevelArt(level);
    if (assetNames.every((name) => Boolean(artImage(name)))) {
      retainLevelArt(level);
      setLevelArtState("ready");
      if (levelArtAutoStart) beginBriefing();
      return;
    }
    const results = await pending;
    if (request !== levelArtLoadRequest || currentLevel !== level || scene !== "briefing") return;
    if (results.every(Boolean)) {
      retainLevelArt(level);
      setLevelArtState("ready");
      if (levelArtAutoStart) beginBriefing();
      return;
    }
    setLevelArtState("failed");
  }

  function retryCurrentLevelArt() {
    if (scene !== "briefing" || levelArtState !== "failed") return;
    loadCurrentLevelArt(true);
  }

  function beginBriefing() {
    if (scene !== "briefing") return;
    if (levelArtState !== "ready") return;
    resetInput();
    scene = "playing";
    showOnly(null);
    setGameUi(true);
    playTone("start");
    toast(currentLevel.mechanic, 2.6);
    resumeAnimationLoop();
  }

  function togglePause(forceResume = false) {
    if (forceResume && scene === "paused") {
      scene = "playing";
      showOnly(null);
      setGameUi(true);
      resumeAnimationLoop();
      return;
    }
    if (scene === "playing") {
      scene = "paused";
      setGameUi(false);
      showOnly("pause-screen");
      stopAnimationLoop();
    } else if (scene === "paused") {
      scene = "playing";
      showOnly(null);
      setGameUi(true);
      resumeAnimationLoop();
    }
  }

  function renderLevelGrid() {
    const levels = listLevels();
    const acts = new Map();
    levels.forEach((entry) => {
      const level = normalizeLevel(deepClone(entry));
      const act = Math.max(1, Number(level.act) || Math.ceil(level.id / 4));
      if (!acts.has(act)) acts.set(act, []);
      acts.get(act).push(level);
    });
    $("#level-grid").innerHTML = [...acts.entries()].map(([act, actLevels]) => {
      const clearedInAct = actLevels.filter((level) => save.completed.includes(level.id)).length;
      const cards = actLevels.map((level) => {
        const unlocked = level.id <= save.unlocked;
        const cleared = save.completed.includes(level.id);
        const tags = level.tags.length ? level.tags : level.isBoss ? ["守门挑战", "机关战"] : [level.mechanics?.type || "探索", "裂界修复"];
        const progress = cleared ? 100 : 0;
        const thumbnail = level.thumbnail || `linear-gradient(145deg, ${level.theme.skyTop}, ${level.theme.mid} 55%, ${level.theme.edge})`;
        const atlasIndex = Math.max(0, Math.min(6, Math.floor((level.id - 1) / 4)));
        const fallbackAtlas = [
          "./assets/art-v2/environments-a.webp",
          "./assets/art-v2/environments-b.webp",
          "./assets/art-v3/environments-c.webp",
          "./assets/art-v5/environments-d.webp",
          "./assets/art-v6/environments-e.webp",
          "./assets/art-v10/environments-f.webp",
          "./assets/art-v11/environments-g.webp",
        ][atlasIndex];
        const backgroundFrame = frameSpec("levelBackgroundFrames", String(level.id), null);
        const backgroundAsset = backgroundFrame?.sheet ? artAssetConfig(backgroundFrame.sheet) : null;
        const thumbnailArt = `url(${backgroundAsset?.src || fallbackAtlas})`;
        const frameIndex = (level.id - 1) % 4;
        const frameCols = Math.max(1, Number(backgroundFrame?.cols || backgroundAsset?.cols) || 2);
        const frameRows = Math.max(1, Number(backgroundFrame?.rows || backgroundAsset?.rows) || 2);
        const frameCol = backgroundFrame ? Number(backgroundFrame.col) || 0 : frameIndex % 2;
        const frameRow = backgroundFrame ? Number(backgroundFrame.row) || 0 : Math.floor(frameIndex / 2);
        const thumbnailPosition = `${frameCols > 1 ? frameCol / (frameCols - 1) * 100 : 50}% ${frameRows > 1 ? frameRow / (frameRows - 1) * 100 : 50}%`;
        return `<button class="level-card${level.isBoss ? " is-boss" : ""}${cleared ? " is-cleared" : ""}" data-level="${level.id}" data-act="${act}" data-progress="${progress}" data-tags="${tags.join(",")}" ${unlocked ? "" : "disabled"} style="--card-bg:${level.theme.mid};--card-accent:${level.theme.edge};--thumbnail:${thumbnail};--thumbnail-art:${thumbnailArt};--thumbnail-position:${thumbnailPosition};--level-thumbnail:${thumbnail}">
          <span class="level-thumb" aria-hidden="true"></span>
          <span class="level-card-copy"><span class="card-number">${level.isBoss ? "BOSS" : "STAGE"} ${pad(level.id)} ${cleared ? "· 已修复" : unlocked ? "· 可进入" : "· 未解锁"}</span><strong>${level.name}</strong><small>${level.mechanic}</small></span>
          <span class="level-tags">${tags.map((tag) => `<span class="level-tag">${tag}</span>`).join("")}</span>
          <span class="level-progress" style="--progress:${progress / 100}" aria-label="关卡进度 ${progress}%"><i></i></span>
        </button>`;
      }).join("");
      const actCopy = {
        1: ["风起之幕", "穿过荒野与洞窟，唤醒第一枚守门核心"],
        2: ["潮火之幕", "在潮汐、云轨与熔炉之间改变行进方式"],
        3: ["星织之幕", "驾驭菌伞、相位与极光，重连世界星线"],
        4: ["逆潮之幕", "重写重力、时间与自己的影子，夺回最后一颗星"],
        5: ["折页之幕", "折叠地形、借风飞行，再从翻转的世界中返航"],
        6: ["天衡之幕", "搬动星砝、穿过剪影，再把走过的路绣上天穹"],
        7: ["未写剧场", "变换身量、换乘彗轨、藏入灯影，把夺回的星片奏成终曲"],
      }[act] || [`裂界之幕 ${act}`, "修复散落在航线上的生态裂界"];
      return `<section class="route-act" data-act="${act}"><header class="route-act-head"><span>ACT ${pad(act)}</span><h3>${actCopy[0]}</h3><p>${clearedInAct} / ${actLevels.length} 已修复 · ${actCopy[1]}</p></header><div class="route-act-levels">${cards}</div></section>`;
    }).join("");
  }

  function completeLevel() {
    if (!runtime || runtime.completed) return;
    runtime.completed = true;
    const isFinalLevel = currentLevel.id === FINAL_LEVEL_ID;
    scene = isFinalLevel ? "victory" : "complete";
    setGameUi(false);
    save.completed = [...new Set([...save.completed, currentLevel.id])].sort((a, b) => a - b);
    const nextLevelId = nextCampaignLevelId(currentLevel.id);
    if (nextLevelId) save.unlocked = Math.max(save.unlocked, nextLevelId);
    scheduleLevelArtWarmup(nextCampaignArtLevel(currentLevel));
    persist();
    burst(player.x + player.w / 2, player.y + player.h / 2, currentLevel.theme.edge, 42, 420);
    playTone("complete");
    if (isFinalLevel) {
      $("#victory-stats").textContent = `${campaignCompletedCount(save.completed)} / ${CAMPAIGN_LEVELS.length} 关 · ${save.seeds} 枚记忆种子 · ${save.deaths} 次重整`;
      showOnly("victory-screen");
    } else {
      $("#complete-title").textContent = `${currentLevel.name} · 修复完成`;
      $("#complete-detail").textContent = currentLevel.isBoss ? "守门者的核心已恢复平静，下一片生态正在回应。" : "裂界重新长出颜色，新的航线已经开放。";
      showOnly("complete-screen");
    }
  }

  function trialUpgradeChoices() {
    const trial = runtime?.trial;
    const config = trialById(trial?.id);
    const rounds = config?.upgradeRounds || [];
    if (!rounds.length || !trial) return [];
    const repeat = Boolean(trial.endless && config?.upgradeCadence?.repeatRounds);
    const index = repeat ? trial.upgradeIndex % rounds.length : trial.upgradeIndex;
    return rounds[index] || [];
  }

  function trialUpgradeDueAt(trial, config) {
    if (!trial || !config) return Infinity;
    const schedule = Array.isArray(config.upgradeAt) ? config.upgradeAt : [];
    if (trial.endless && config.upgradeCadence) {
      const firstAt = Math.max(0, Number(config.upgradeCadence.firstAt) || Number(schedule[0]) || 30);
      const interval = Math.max(1, Number(config.upgradeCadence.interval) || 60);
      return firstAt + trial.upgradeIndex * interval;
    }
    return Number(schedule[trial.upgradeIndex] ?? ((trial.upgradeIndex + 1) * 30));
  }

  function openTrialUpgrade() {
    if (!runtime?.trial || scene !== "playing") return;
    const choices = trialUpgradeChoices();
    if (!choices.length) return;
    runtime.trial.upgradeIndex += 1;
    $("#trial-upgrade-options").innerHTML = choices.map((id) => {
      const upgrade = TRIAL_UPGRADES[id];
      if (!upgrade) return "";
      return `<button class="trial-upgrade-card" data-trial-upgrade="${upgrade.id}"><b>${upgrade.glyph}</b><span><strong>${upgrade.name}</strong><small>${upgrade.description}</small></span></button>`;
    }).join("");
    scene = "trial-upgrade";
    setGameUi(false);
    showOnly("trial-upgrade-screen");
    stopAnimationLoop();
    playTone("switch");
  }

  function chooseTrialUpgrade(id) {
    const trial = runtime?.trial;
    const config = trialById(trial?.id);
    const upgrade = TRIAL_UPGRADES[id];
    if (!trial || scene !== "trial-upgrade" || !upgrade) return false;
    const rank = (Number(trial.upgradeRanks[id]) || 0) + 1;
    trial.upgradeRanks[id] = rank;
    trial.upgrades.add(id);
    if (rank === 1 && id === "core-bloom") {
      trial.core.maxHp += 3;
      trial.core.hp += 3;
    }
    if (rank === 1 && id === "seed-shell") {
      trial.escort.maxHp += 3;
      trial.escort.hp = trial.escort.maxHp;
    }
    if (rank > 1 && config?.upgradeCadence?.duplicatePolicy === "rank") {
      const reward = config.upgradeCadence.rankReward || {};
      trial.core.maxHp += Math.max(0, Number(reward.coreMax) || 0);
      trial.core.hp = Math.min(trial.core.maxHp, trial.core.hp + Math.max(0, Number(reward.coreHeal) || 0));
      trial.score += Math.max(0, Number(reward.score) || 0);
    }
    scene = "playing";
    showOnly(null);
    setGameUi(true);
    toast(`${upgrade.name}${rank > 1 ? ` · Rank ${rank}` : ""} · 本次守夜生效`, 1.55);
    announce(`已选择守夜异变：${upgrade.name}${rank > 1 ? `，等级 ${rank}` : ""}`);
    resumeAnimationLoop();
    return true;
  }

  function hashTrialSeed(value) {
    let hash = 2166136261;
    String(value || "trial").split("").forEach((character) => {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    });
    return hash >>> 0 || 1;
  }

  function nextTrialRandom(trial) {
    let state = Number(trial?.eventRng) >>> 0;
    state = (Math.imul(state || 1, 1664525) + 1013904223) >>> 0;
    trial.eventRng = state;
    return state / 4294967296;
  }

  function trialModifier(key, fallback = 1) {
    const value = runtime?.trial?.activeEvent?.modifiers?.[key];
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function awardTrialScore(amount, multiplier = 1) {
    const trial = runtime?.trial;
    if (!trial) return 0;
    const awarded = Math.max(0, Math.round((Number(amount) || 0) * multiplier * trialModifier("scoreMultiplier", 1)));
    trial.score += awarded;
    return awarded;
  }

  function damageTrialCore(amount) {
    const trial = runtime?.trial;
    if (!trial) return 0;
    let remaining = Math.max(0, Number(amount) || 0);
    const blocked = Math.min(remaining, Math.max(0, Number(trial.core.shield) || 0));
    trial.core.shield -= blocked;
    remaining -= blocked;
    if (remaining > 0) trial.core.hp = Math.max(0, trial.core.hp - remaining);
    trial.core.hitFlash = 0.42;
    return remaining;
  }

  function trialPhases(config = trialById(runtime?.trial?.id)) {
    const phases = config?.circuit?.phases;
    return Array.isArray(phases) && phases.length ? phases : [{ id: "watch", name: "守夜", startsAt: 0, routeTime: 12, patterns: [] }];
  }

  function trialPhaseConfig(trial = runtime?.trial, config = trialById(trial?.id)) {
    const phases = trialPhases(config);
    return phases[clamp(Number(trial?.phaseIndex) || 0, 0, phases.length - 1)] || phases[0];
  }

  function trialAnchor(trial, id) {
    return trial?.anchors?.find((anchor) => anchor.id === id) || null;
  }

  function trialExpectedAnchor(trial = runtime?.trial) {
    return trialAnchor(trial, trial?.route?.[trial?.routeProgress]);
  }

  function trialActiveTask(trial = runtime?.trial) {
    if (!trial) return "relay";
    return trial.phaseTask === "siege" ? (trial.siege.objectiveTask || "relay") : trial.phaseTask;
  }

  function trialUsesRouteTask(trial = runtime?.trial) {
    const task = trialActiveTask(trial);
    return task === "relay" || task === "counter";
  }

  function trialPhaseObjectiveValue(trial = runtime?.trial) {
    if (!trial) return 0;
    if (trial.phaseTask === "siege") return trial.siege.eliteDefeated ? 1 : 0;
    if (trial.phaseTask === "escort") return trial.escort.deliveries;
    if (trial.phaseTask === "salvage") return trial.salvage.delivered;
    if (trial.phaseTask === "repair") return trial.repairedSets;
    if (trial.phaseTask === "counter") return trial.rift.closures;
    return trial.circuits;
  }

  function trialTaskValue(task, trial = runtime?.trial) {
    if (!trial) return 0;
    if (task === "escort") return trial.escort.deliveries;
    if (task === "salvage") return trial.salvage.delivered;
    if (task === "repair") return trial.repairedSets;
    if (task === "counter") return trial.rift.closures;
    return trial.circuits;
  }

  function trialPhaseObjectiveProgress(trial = runtime?.trial) {
    return Math.max(0, trialPhaseObjectiveValue(trial) - (Number(trial?.phaseObjectiveStart) || 0));
  }

  function applyTrialArenaMotion(phase) {
    if (!runtime?.trial) return;
    const motion = String(phase?.arenaMotion || "still");
    runtime.trial.arenaMotion = motion;
    runtime.platforms.forEach((platform, platformIndex) => {
      if (platform.id === "watch-ground") return;
      platform.x = platform.originX;
      platform.y = platform.originY;
      platform.motion = null;
      if (motion === "lift") {
        platform.motion = platform.id === "watch-high"
          ? { axis: "x", distance: 105, speed: 0.72 }
          : { axis: "y", distance: 42, speed: 1.05 };
      } else if (motion === "split") {
        platform.motion = platform.id === "watch-high"
          ? { axis: "y", distance: 58, speed: 0.86 }
          : { axis: "x", distance: 46, speed: 0.94 };
      } else if (motion === "storm") {
        platform.motion = platform.id === "watch-high"
          ? { axis: "x", distance: 138, speed: 1.18 }
          : { axis: "y", distance: 56, speed: 1.28 };
      } else if (motion === "drift") {
        platform.motion = platform.id === "watch-high"
          ? { axis: "y", distance: 36, speed: 0.52 }
          : { axis: "x", distance: 72, speed: 0.58 + platformIndex * 0.08 };
      } else if (motion === "dawn") {
        platform.motion = platform.id === "watch-high"
          ? { axis: "x", distance: 165, speed: 0.8 }
          : { axis: "y", distance: 66, speed: 0.92 + platformIndex * 0.12 };
      }
    });
  }

  function chooseTrialRoute(id) {
    const trial = runtime?.trial;
    const phase = trialPhaseConfig(trial);
    if (!trial || trial.phaseTask !== "escort") return false;
    const route = (phase.routes || []).find((entry) => entry.id === id);
    if (!route) return false;
    const escort = trial.escort;
    escort.routeId = route.id;
    escort.routeTargets = Array.isArray(route.targets) && route.targets.length ? [...route.targets] : ["west", "crown", "east"];
    escort.routeSelectionTimer = 0;
    escort.routeArmor = Math.max(0, Number(route.escortArmor) || 0) + (route.risk === "high" && trial.upgrades.has("branch-compass") ? 1 : 0);
    escort.riskMultiplier = Math.max(0.25, Number(route.scoreMultiplier) || 1) * (route.risk === "high" && trial.upgrades.has("branch-compass") ? 1.15 : 1);
    escort.speedMultiplier = Math.max(0.25, Number(route.speedMultiplier) || 1);
    escort.spawnIntervalMultiplier = Math.max(0.25, Number(route.enemySpawnIntervalMultiplier) || 1);
    escort.targetIndex = 0;
    resetTrialEscort(trial, phase);
    toast(`${route.name}已选 · ${route.description}`, 1.55);
    announce(`护送路线：${route.name}`);
    return true;
  }

  function resetTrialEscort(trial, phase) {
    const escort = trial.escort;
    escort.active = true;
    escort.x = trial.core.x + trial.core.w / 2 - escort.w / 2;
    escort.y = trial.core.y + 22;
    escort.hp = escort.maxHp + Math.max(0, Number(escort.routeArmor) || 0);
    const targets = escort.routeTargets.length
      ? escort.routeTargets
      : Array.isArray(phase.escortTargets) && phase.escortTargets.length ? phase.escortTargets : ["west", "crown", "east"];
    escort.targetIndex %= targets.length;
    escort.targetId = targets[escort.targetIndex];
  }

  function resolveTrialPhase(trial, config) {
    const phase = trialPhaseConfig(trial, config);
    const required = Math.max(0, Number(phase.objectiveRequired) || 0);
    if (!required) return true;
    const progress = trialPhaseObjectiveProgress(trial);
    const completed = progress >= required;
    if (completed) {
      const bonus = Math.round((800 + required * 180) * (trial.upgrades.has("constellation-bonus") ? 1.5 : 1));
      awardTrialScore(bonus);
      if (trial.upgrades.has("core-bloom") || trial.upgrades.has("constellation-bonus")) {
        trial.core.hp = Math.min(trial.core.maxHp, trial.core.hp + 1);
      }
      toast(`${phase.name}目标完成 · 阶段奖励 ${bonus.toLocaleString("zh-CN")}`, 1.45);
    } else {
      damageTrialCore(2);
      trial.combo = 0;
      trial.comboTimer = 0;
      toast(`${phase.name}目标未完成 · 芽核流失两点能量`, 1.5);
      playTone("hurt");
    }
    return completed;
  }

  function applyTrialPhase(trial, config = trialById(trial?.id), initial = false) {
    if (!trial || !config) return;
    const phase = trialPhaseConfig(trial, config);
    trial.phaseTask = phase.task || "relay";
    trial.phaseName = trial.endless ? `${phase.name} · 第 ${trial.phaseSerial + 1} 潮` : phase.name;
    trial.phaseObjectiveStart = trialPhaseObjectiveValue(trial);
    trial.cycle = Math.floor(trial.phaseSerial / Math.max(1, trialPhases(config).length));
    trial.meteorTimer = Number(phase.meteorInterval) > 0 ? 1.8 : 2.4;
    trial.meteors = [];
    trial.salvage.seeds = [];
    trial.salvage.carrying = 0;
    trial.salvage.spawnTimer = 0;
    trial.escort.active = false;
    trial.escort.routeId = null;
    trial.escort.routeTargets = [];
    trial.escort.routeSelectionTimer = 0;
    trial.rift.active = trial.phaseTask === "counter";
    trial.rift.armed = false;
    trial.rift.hitFlash = 0;
    trial.siege.active = trial.phaseTask === "siege";
    trial.anchors.forEach((anchor) => {
      anchor.playerInside = false;
      anchor.requiredAction = null;
    });
    if (trial.phaseTask === "escort") {
      trial.escort.active = true;
      trial.escort.x = trial.core.x + trial.core.w / 2 - trial.escort.w / 2;
      trial.escort.y = trial.core.y + 22;
      trial.escort.targetId = null;
      trial.escort.routeSelectionTimer = Math.max(0, Number(phase.routeChoice?.selectionSeconds) || 0);
      if (!(phase.routes || []).length) {
        trial.escort.routeTargets = Array.isArray(phase.escortTargets) ? [...phase.escortTargets] : [];
        resetTrialEscort(trial, phase);
      }
    }
    if (trial.phaseTask === "salvage") {
      trial.salvage.spawnTimer = 0.35;
    }
    if (trial.phaseTask === "repair") {
      trial.repairResetTimer = 0;
      trial.repairNodes.forEach((node) => {
        node.charge = 0;
        node.required = Math.max(2, Number(phase.nodeCharge) || 3);
        node.requiredAction = phase.nodeActions?.[node.id] || "pulse";
        node.charged = false;
      });
    }
    if (trial.phaseTask === "counter") {
      trial.rift.maxHp = Math.max(1, Number(phase.riftHp) || 3);
      trial.rift.hp = trial.rift.maxHp;
    }
    if (trial.phaseTask === "siege") initializeTrialSiege(trial, phase);
    if (trialUsesRouteTask(trial)) beginTrialRoute(trial, config);
    else {
      trial.route = [];
      trial.routeActions = [];
      trial.routeProgress = 0;
      trial.routeTimer = 0;
    }
    applyTrialArenaMotion(phase);
    if (!initial) {
      const taskLabel = { escort: "选择路线并护送星种", salvage: "救回坠落星种", repair: "用三种动作修复星柱", counter: "组合反击多相坠星", siege: "轮换战术并击退晨辉守门者" }[trial.phaseTask] || "编织动作星轨";
      toast(`${trial.phaseName}展开 · ${taskLabel}`, 1.8);
      announce(`守夜进入${trial.phaseName}`);
      playTone("switch");
    }
  }

  function beginTrialRoute(trial, config = trialById(trial?.id)) {
    const phase = trialPhaseConfig(trial, config);
    const patterns = Array.isArray(phase.patterns) && phase.patterns.length ? phase.patterns : [];
    const actionPatterns = Array.isArray(phase.actionPatterns) && phase.actionPatterns.length ? phase.actionPatterns : [];
    const fallback = trial.anchors.map((anchor) => anchor.id);
    const actionSource = actionPatterns[trial.routeSerial % Math.max(1, actionPatterns.length)] || null;
    const source = actionSource || patterns[trial.routeSerial % Math.max(1, patterns.length)] || fallback;
    const desiredLength = Math.max(1, Number(phase.routeLength) || source.length || 1);
    const steps = Array.from({ length: desiredLength }, (_, index) => source[index % Math.max(1, source.length)]);
    trial.route = steps.map((step) => typeof step === "string" ? step : step.anchor).filter((id) => trialAnchor(trial, id));
    trial.routeActions = steps.map((step) => typeof step === "string" ? null : String(step.action || "touch")).slice(0, trial.route.length);
    trial.anchors.forEach((anchor) => { anchor.requiredAction = null; });
    trial.route.forEach((id, index) => {
      const anchor = trialAnchor(trial, id);
      if (anchor) anchor.requiredAction = trial.routeActions[index] || null;
    });
    trial.routeProgress = 0;
    trial.routeTimer = Math.max(4, Number(phase.routeTime) || 12);
    trial.routeDashLinks = 0;
    trial.routeSerial += 1;
  }

  function advanceTrialPhase(trial, config, elapsed) {
    const phases = trialPhases(config);
    let nextIndex = 0;
    let nextSerial = 0;
    if (trial.endless) {
      nextSerial = Math.floor(elapsed / Math.max(20, Number(config.cycleDuration) || 60));
      nextIndex = nextSerial % phases.length;
      if (nextSerial === trial.phaseSerial) return false;
    } else {
      phases.forEach((phase, index) => {
        if (elapsed >= Math.max(0, Number(phase.startsAt) || 0)) nextIndex = index;
      });
      nextSerial = nextIndex;
      if (nextIndex === trial.phaseIndex) return false;
    }
    resolveTrialPhase(trial, config);
    trial.phaseIndex = nextIndex;
    trial.phaseSerial = nextSerial;
    applyTrialPhase(trial, config);
    return true;
  }

  function completeTrialCircuit() {
    const trial = runtime?.trial;
    const config = trialById(trial?.id);
    if (!trial || !config) return;
    const phase = trialPhaseConfig(trial, config);
    trial.circuits += 1;
    trial.combo += 1;
    trial.bestCombo = Math.max(trial.bestCombo, trial.combo);
    trial.comboTimer = Math.max(6, Number(phase.routeTime) || 12);
    const multiplier = (1 + Math.min(4, Math.floor(trial.combo / 3)) * 0.35) * (trial.upgrades.has("constellation-bonus") ? 1.35 : 1);
    const paceBonus = Math.round(trial.routeTimer * 26);
    awardTrialScore(420 + trial.phaseIndex * 220 + paceBonus + trial.routeDashLinks * 90, multiplier);
    trial.dashLinks += trial.routeDashLinks;
    if (trial.upgrades.has("core-bloom") && trial.circuits % 2 === 0) {
      trial.core.hp = Math.min(trial.core.maxHp, trial.core.hp + 1);
    }
    if (trialActiveTask(trial) === "counter") {
      trial.rift.armed = true;
      awardTrialScore(220);
      toast("星锚蓄能完成 · 对准坠星落点下砸反射", 1.25);
      announce("反潮镜面已经张开，等待坠星");
      beginTrialRoute(trial, config);
      return;
    }
    runtime.enemies.forEach((enemy) => {
      if (enemy.trialEnemy && enemy.alive) enemy.alive = false;
    });
    runtime.rootWaves.push({ x: trial.core.x + trial.core.w / 2, y: trial.core.y + trial.core.h * 0.72, life: 0.58, maxLife: 0.58, radius: 34 });
    burst(trial.core.x + trial.core.w / 2, trial.core.y + trial.core.h / 2, currentLevel.theme.edge, 34, 410);
    shake = Math.max(shake, 9);
    playTone("complete");
    toast(`星轨闭合 ×${trial.combo} · 芽核爆发清场`, 1.25);
    announce("星轨闭合，芽核释放清场脉冲");
    beginTrialRoute(trial, config);
  }

  function activateTrialAnchor(anchor, action = "touch") {
    const trial = runtime?.trial;
    if (!trial || !anchor || !trialUsesRouteTask(trial) || anchor.id !== trialExpectedAnchor(trial)?.id) return false;
    if (anchor.jammed > 0) {
      toast(`${anchor.label}已被污染 · 在附近下砸净化`, 1.05);
      return false;
    }
    const requiredAction = trial.routeActions[trial.routeProgress] || null;
    if (requiredAction && requiredAction !== action) {
      const actionLabel = { touch: "触碰", dash: "冲刺", downstrike: "下砸" }[requiredAction] || requiredAction;
      toast(`${anchor.label}需要${actionLabel}接入`, 0.8);
      return false;
    }
    if (action === "dash") {
      trial.routeDashLinks += 1;
      trial.routeTimer += trial.upgrades.has("quick-dash") ? 1.5 : 0.75;
      player.dashCooldown = Math.min(player.dashCooldown, 0.18);
    }
    trial.routeProgress += 1;
    awardTrialScore(action === "downstrike" ? 90 : action === "dash" ? 70 : 45);
    playTone("switch");
    burst(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2, currentLevel.theme.edge, action === "downstrike" ? 18 : 12, 220);
    if (trial.routeProgress >= trial.route.length) completeTrialCircuit();
    else toast(`${anchor.label}接入 · 下一枚 ${trialExpectedAnchor(trial)?.label || "星锚"}`, 0.8);
    return true;
  }

  function strikeTrialAnchorAt(x, y) {
    const trial = runtime?.trial;
    if (!trial) return false;
    if (actOnTrialMeteorAt(x, "downstrike")) return true;
    if (trial.phaseTask === "siege" && trial.siege.elite.active
      && Math.abs(trial.siege.elite.x + trial.siege.elite.w / 2 - x) <= 155) {
      return damageTrialElite("downstrike");
    }
    const nearby = trial.anchors
      .map((anchor) => ({ anchor, distance: Math.hypot(anchor.x + anchor.w / 2 - x, anchor.y + anchor.h / 2 - y) }))
      .filter((entry) => entry.distance <= 155)
      .sort((a, b) => a.distance - b.distance)[0]?.anchor;
    if (!nearby) return false;
    if (trialActiveTask(trial) === "repair") return chargeTrialRepairNode(nearby.id, trial.upgrades.has("root-burst") ? 3 : 2, "downstrike");
    if (nearby.jammed > 0) {
      nearby.jammed = 0;
      awardTrialScore(120);
      trial.routeTimer += 1.2;
      toast(`${nearby.label}净化完成 · 星轨重新接通`, 1.0);
      announce("下砸净化了受污染的星锚");
      playTone("switch");
      burst(nearby.x + nearby.w / 2, nearby.y + nearby.h / 2, currentLevel.theme.paper, 22, 270);
      return true;
    }
    return activateTrialAnchor(nearby, "downstrike");
  }

  function updateTrialAnchors(dt) {
    const trial = runtime?.trial;
    if (!trial) return;
    const phase = trialPhaseConfig(trial);
    const cleanseSpeed = trial.upgrades.has("time-pollen") ? 1.45 : 1;
    trial.anchors.forEach((anchor) => {
      anchor.jammed = Math.max(0, anchor.jammed - dt * cleanseSpeed);
      const moving = Boolean(phase.movingAnchors);
      const wave = runtime.time * (trial.phaseIndex >= 2 ? 1.35 : 0.9) * trialModifier("anchorMotionMultiplier", 1) + Number(anchor.motionPhase || anchor.index);
      anchor.x = anchor.baseX + (moving ? Math.cos(wave) * (anchor.id === "crown" ? 82 : 24) : 0);
      anchor.y = anchor.baseY + (moving ? Math.sin(wave * 0.88) * (anchor.id === "crown" ? 54 : 22) : 0);
      const magnetized = trial.upgrades.has("star-magnet")
        && Math.hypot(player.x + player.w / 2 - (anchor.x + anchor.w / 2), player.y + player.h / 2 - (anchor.y + anchor.h / 2)) < 72;
      const inside = overlap(player, anchor) || magnetized;
      if (inside && !anchor.playerInside) {
        const action = player.dashTime > 0 ? "dash" : "touch";
        if (trial.activeEvent?.pendingChoice) {
          const choiceIndex = anchor.id === "east" ? 1 : anchor.id === "west" ? 0 : -1;
          const choice = choiceIndex >= 0 ? trial.activeEvent.choices?.[choiceIndex] : null;
          if (choice) chooseTrialEvent(choice.id);
        } else if (trial.phaseTask === "escort" && !trial.escort.routeId) {
          const routes = phase.routes || [];
          const route = anchor.id === "east" ? routes[1] : anchor.id === "west" ? routes[0] : null;
          if (route) chooseTrialRoute(route.id);
        } else if (trialActiveTask(trial) === "repair" && action === "dash") {
          chargeTrialRepairNode(anchor.id, 1, "dash");
        } else if (trialUsesRouteTask(trial)) activateTrialAnchor(anchor, action);
      }
      anchor.playerInside = inside;
    });
  }

  function chargeTrialRepairNode(id, amount = 1, action = "pulse") {
    const trial = runtime?.trial;
    if (!trial || trialActiveTask(trial) !== "repair" || trial.repairResetTimer > 0) return false;
    const node = trial.repairNodes.find((entry) => entry.id === id);
    const anchor = trialAnchor(trial, id);
    if (!node || !anchor || node.charge >= node.required) return false;
    if (node.requiredAction && node.requiredAction !== action) {
      const phase = trialPhaseConfig(trial);
      node.charge = Math.max(0, node.charge - Math.max(0, Number(phase.wrongActionPenalty) || 0));
      toast(`${anchor.label}动作不合拍 · 需要${{ pulse: "脉冲", dash: "冲刺", downstrike: "下砸" }[node.requiredAction]}`, 0.85);
      return false;
    }
    let charge = Math.max(1, Number(amount) || 1);
    if (trial.upgrades.has("resonant-tools")) charge += 1;
    node.charge = Math.min(node.required, node.charge + charge);
    node.charged = node.charge >= node.required;
    awardTrialScore(70 * charge);
    playTone("switch");
    burst(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2, currentLevel.theme.edge, 14, 210);
    if (trial.repairNodes.every((entry) => entry.charge >= entry.required)) {
      trial.repairedSets += 1;
      trial.repairResetTimer = 1.25;
      awardTrialScore(520);
      trial.core.hp = Math.min(trial.core.maxHp, trial.core.hp + 1);
      runtime.enemies.forEach((enemy) => { if (enemy.trialEnemy && enemy.alive) enemy.alive = false; });
      toast(`三柱共鸣完成 ×${trial.repairedSets} · 芽核恢复一点能量`, 1.35);
      announce("三座星柱修复完成");
    } else {
      toast(`${anchor.label}修复 ${node.charge}/${node.required}`, 0.9);
    }
    return true;
  }

  function updateTrialRepair(dt) {
    const trial = runtime?.trial;
    if (!trial || trialActiveTask(trial) !== "repair" || trial.repairResetTimer <= 0) return;
    trial.repairResetTimer = Math.max(0, trial.repairResetTimer - dt);
    if (trial.repairResetTimer === 0) trial.repairNodes.forEach((node) => { node.charge = 0; node.charged = false; });
  }

  function updateTrialEscort(dt) {
    const trial = runtime?.trial;
    const config = trialById(trial?.id);
    if (!trial || !config || trial.phaseTask !== "escort") return;
    const phase = trialPhaseConfig(trial, config);
    const escort = trial.escort;
    if (!escort.routeId && (phase.routes || []).length) {
      escort.routeSelectionTimer = Math.max(0, escort.routeSelectionTimer - dt);
      if (escort.routeSelectionTimer <= 0) chooseTrialRoute(phase.routeChoice?.defaultRoute || phase.routes[0].id);
      return;
    }
    const target = trialAnchor(trial, escort.targetId);
    if (!escort.active || !target) return;
    const targetX = target.x + target.w / 2 - escort.w / 2;
    const targetY = target.y + target.h / 2 - escort.h / 2;
    const distance = Math.hypot(targetX - escort.x, targetY - escort.y);
    const playerDistance = Math.hypot(player.x + player.w / 2 - (escort.x + escort.w / 2), player.y + player.h / 2 - (escort.y + escort.h / 2));
    const leash = (Number(phase.escortLeash) || 190) + (trial.upgrades.has("star-magnet") ? 90 : 0);
    const speed = (Number(phase.escortSpeed) || 88)
      * escort.speedMultiplier
      * trialModifier("escortSpeedMultiplier", 1)
      * (playerDistance <= leash ? 1 : 0.16);
    if (distance > 4) {
      escort.x += (targetX - escort.x) / distance * speed * dt;
      escort.y += (targetY - escort.y) / distance * speed * dt;
    }
    if (distance <= 14) {
      const targets = escort.routeTargets.length
        ? escort.routeTargets
        : Array.isArray(phase.escortTargets) && phase.escortTargets.length ? phase.escortTargets : ["west", "crown", "east"];
      escort.deliveries += 1;
      escort.targetIndex = (escort.targetIndex + 1) % targets.length;
      escort.targetId = targets[escort.targetIndex];
      awardTrialScore(620, escort.riskMultiplier);
      trial.combo += 1;
      trial.bestCombo = Math.max(trial.bestCombo, trial.combo);
      burst(target.x + target.w / 2, target.y + target.h / 2, currentLevel.theme.paper, 26, 300);
      toast(`星种抵达${target.label} · 护送 ${escort.deliveries}`, 1.05);
      resetTrialEscort(trial, phase);
    }
  }

  function trialSalvageConfig(trial = runtime?.trial) {
    const phase = trialPhaseConfig(trial);
    return phase?.salvage || (trial?.phaseTask === "siege" ? { spawnInterval: 6.4, groundLifetime: 10, maxActive: 4, carryLimit: 1, pickupRadius: 54, depositRadius: 92, scorePerSeed: 280, healEvery: 3 } : null);
  }

  function spawnTrialSeed(x = null) {
    const trial = runtime?.trial;
    const config = trialSalvageConfig(trial);
    if (!trial || !config || trialActiveTask(trial) !== "salvage") return false;
    const active = trial.salvage.seeds.filter((seed) => seed.state !== "lost").length;
    if (active >= Math.max(1, Number(config.maxActive) || 4)) return false;
    const manuallyPlaced = Number.isFinite(Number(x));
    const centerX = clamp(manuallyPlaced ? Number(x) : 140 + nextTrialRandom(trial) * (currentLevel.worldWidth - 280), 70, currentLevel.worldWidth - 70);
    const startY = manuallyPlaced ? 542 : 80;
    const fallDuration = Math.max(0.4, Number(config.fallDuration) || 1.45);
    trial.salvage.seeds.push({
      id: `fallen-seed-${trial.salvage.serial += 1}`,
      x: centerX,
      y: startY,
      w: 24,
      h: 28,
      vy: manuallyPlaced ? 150 : (566 - startY) / fallDuration,
      state: "falling",
      life: Math.max(2, Number(config.groundLifetime) || 10),
      thiefId: null,
      rescueTimer: Math.max(2, Number(config.stolenRescueWindow) || 7),
    });
    return true;
  }

  function depositTrialSeed() {
    const trial = runtime?.trial;
    const config = trialSalvageConfig(trial);
    if (!trial || !config || trial.salvage.carrying <= 0) return false;
    trial.salvage.carrying -= 1;
    trial.salvage.delivered += 1;
    trial.salvage.depositCooldown = 0.18;
    awardTrialScore(Number(config.scorePerSeed) || 280);
    const healEvery = Math.max(0, Number(config.healEvery) || 0);
    if (healEvery && trial.salvage.delivered % healEvery === 0) {
      trial.core.hp = Math.min(trial.core.maxHp, trial.core.hp + 1);
    }
    burst(trial.core.x + trial.core.w / 2, trial.core.y + trial.core.h / 2, currentLevel.theme.edge, 18, 250);
    toast(`星种归巢 ${trial.salvage.delivered} · 芽核重新发亮`, 0.95);
    return true;
  }

  function updateTrialSalvage(dt) {
    const trial = runtime?.trial;
    const config = trialSalvageConfig(trial);
    if (!trial || !config || trialActiveTask(trial) !== "salvage") return;
    const salvage = trial.salvage;
    salvage.depositCooldown = Math.max(0, Number(salvage.depositCooldown) - dt || 0);
    salvage.spawnTimer -= dt;
    if (salvage.spawnTimer <= 0) {
      spawnTrialSeed();
      salvage.spawnTimer = Math.max(1.2, (Number(config.spawnInterval) || 6.4) * trialModifier("salvageSpawnIntervalMultiplier", 1));
    }
    const pickupRadius = (Number(config.pickupRadius) || 54) * (trial.upgrades.has("seed-vacuum") ? 1.65 : 1);
    const carryLimit = Math.max(1, Number(config.carryLimit) || 1) + (trial.upgrades.has("seed-vacuum") ? 1 : 0);
    const playerX = player.x + player.w / 2;
    const playerY = player.y + player.h / 2;
    salvage.seeds.forEach((seed) => {
      if (seed.state === "falling") {
        seed.y += seed.vy * dt;
        if (seed.y >= 566) {
          seed.y = 566;
          seed.state = "grounded";
        }
      } else if (seed.state === "grounded") {
        seed.life -= dt;
        const thiefTypes = new Set(config.thiefTypes || []);
        const thief = runtime.enemies.find((enemy) => enemy.alive && enemy.trialEnemy && thiefTypes.has(enemy.type)
          && Math.hypot(enemy.x + enemy.w / 2 - seed.x, enemy.y + enemy.h / 2 - seed.y) <= (Number(config.thiefGrabRadius) || 46));
        if (thief) {
          seed.state = "stolen";
          seed.thiefId = thief.id;
        } else if (salvage.carrying < carryLimit && Math.hypot(playerX - seed.x, playerY - seed.y) <= pickupRadius) {
          seed.state = "carried";
          salvage.carrying += 1;
          salvage.depositCooldown = 0.45;
          playTone("switch");
        }
      } else if (seed.state === "stolen") {
        const thief = runtime.enemies.find((enemy) => enemy.id === seed.thiefId);
        if (!thief?.alive) {
          seed.state = "grounded";
          seed.thiefId = null;
          seed.life = Math.max(seed.life, 3);
          if (trial.upgrades.has("rescue-bloom")) {
            runtime.rootWaves.push({ x: seed.x, y: seed.y, life: 0.4, maxLife: 0.4, radius: 20 });
            runtime.enemies.forEach((enemy) => {
              if (!enemy.alive || !enemy.trialEnemy || enemy.id === thief?.id) return;
              const enemyCenter = enemy.x + enemy.w / 2;
              if (Math.abs(enemyCenter - seed.x) > 210) return;
              const direction = Math.sign(enemyCenter - seed.x) || (enemy.side || 1);
              enemy.x = clamp(enemy.x + direction * 110, 0, currentLevel.worldWidth - enemy.w);
            });
          }
        } else {
          seed.x = thief.x + thief.w / 2;
          seed.y = thief.y + thief.h / 2;
          seed.rescueTimer -= dt;
          if (seed.rescueTimer <= 0) seed.state = "lost";
        }
      }
      if ((seed.state === "falling" || seed.state === "grounded")
        && salvage.carrying < carryLimit
        && Math.hypot(playerX - seed.x, playerY - seed.y) <= pickupRadius) {
        seed.state = "carried";
        salvage.carrying += 1;
        salvage.depositCooldown = 0.45;
        playTone("switch");
      }
      if (seed.life <= 0) seed.state = "lost";
    });
    salvage.seeds = salvage.seeds.filter((seed) => !["carried", "lost"].includes(seed.state));
    const depositRadius = (Number(config.depositRadius) || 92) * (trial.upgrades.has("seed-vacuum") ? 1.35 : 1);
    const coreDistance = Math.hypot(playerX - (trial.core.x + trial.core.w / 2), playerY - (trial.core.y + trial.core.h / 2));
    if (salvage.carrying > 0 && salvage.depositCooldown <= 0 && coreDistance <= depositRadius) depositTrialSeed();
  }

  function reflectTrialMeteorAt(x) {
    return actOnTrialMeteorAt(x, "downstrike");
  }

  function trialMeteorsEnabled(trial = runtime?.trial) {
    const phase = trialPhaseConfig(trial);
    return Boolean(trial && (["counter", "siege"].includes(trial.phaseTask) || Number(phase?.meteorInterval) > 0));
  }

  function actOnTrialMeteorAt(x, action = "downstrike") {
    const trial = runtime?.trial;
    if (!trialMeteorsEnabled(trial)) return false;
    const radius = trial.upgrades.has("meteor-mirror") ? 230 : 155;
    const meteor = trial.meteors
      .filter((entry) => !entry.struck && Math.abs(entry.x - x) <= radius)
      .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
    if (!meteor) return false;
    const sequence = meteor.actionSequence?.length ? meteor.actionSequence : ["downstrike"];
    const expected = sequence[meteor.actionIndex] || sequence[0];
    if (expected !== action) {
      meteor.actionIndex = 0;
      toast(`${meteor.name || "坠星"}组合中断 · 下一步需要${{ pulse: "脉冲", dash: "冲刺", downstrike: "下砸" }[sequence[0]] || sequence[0]}`, 0.85);
      return true;
    }
    meteor.actionIndex += 1;
    if (meteor.actionIndex < sequence.length) {
      playTone("switch");
      burst(meteor.x, 540 - meteor.actionIndex * 24, currentLevel.theme.edge, 9, 150);
      return true;
    }
    meteor.struck = true;
    meteor.reflected = true;
    meteor.life = 0.48;
    trial.reflections += 1;
    awardTrialScore(Number(meteor.score) || 240);
    if (trial.rift.active && trial.rift.armed) {
      trial.rift.armed = false;
      const splitBonus = trial.upgrades.has("split-lens") && meteor.type !== "normal" ? 1 : 0;
      trial.rift.hp = Math.max(0, trial.rift.hp - (Math.max(1, Number(meteor.riftDamage) || 1) + splitBonus));
      trial.rift.hitFlash = 0.45;
      awardTrialScore(420);
      if (trial.rift.hp <= 0) {
        trial.rift.closures += 1;
        trial.rift.hp = trial.rift.maxHp;
        awardTrialScore(900);
        trial.core.hp = Math.min(trial.core.maxHp, trial.core.hp + 2);
        toast(`裂隙封闭 ×${trial.rift.closures} · 芽核恢复两点`, 1.45);
      } else toast(`坠星反射命中 · 裂隙稳定度 ${trial.rift.hp}/${trial.rift.maxHp}`, 1.15);
    } else if (trial.rift.active) toast("坠星已弹开 · 先完成两枚星锚蓄能才能命中裂隙", 1.25);
    else toast("坠星已弹开 · 星屑化为额外分数", 1.0);
    playTone("complete");
    shake = Math.max(shake, 12);
    return true;
  }

  function spawnTrialMeteor(type = null, x = null) {
    const trial = runtime?.trial;
    if (!trialMeteorsEnabled(trial)) return false;
    const phase = trialPhaseConfig(trial);
    const types = Array.isArray(phase.meteorTypes) && phase.meteorTypes.length
      ? phase.meteorTypes
      : [{ id: "normal", glyph: "星", name: "普通坠星", weight: 1, actionSequence: ["downstrike"], warningTime: 1.2, riftDamage: 1, score: 240 }];
    let chosen = type === "fragment"
      ? { id: "fragment", glyph: "碎", name: "裂变星屑", weight: 1, actionSequence: ["downstrike"], warningTime: 0.78, riftDamage: 1, score: 120, fragments: 0 }
      : type ? types.find((entry) => entry.id === type) : null;
    if (!chosen) {
      const totalWeight = types.reduce((sum, entry) => sum + Math.max(1, Number(entry.weight) || 1), 0);
      let roll = (trial.meteorSerial * 7 + 3) % totalWeight;
      chosen = types.find((entry) => {
        roll -= Math.max(1, Number(entry.weight) || 1);
        return roll < 0;
      }) || types[0];
    }
    trial.meteorSerial += 1;
    const timingMultiplier = Math.max(0.5, trialModifier("meteorTimingMultiplier", 1))
      * (trial.upgrades.has("meteor-mirror") ? 1.25 : 1);
    const warningTime = Math.max(0.5, Number(chosen.warningTime) || 1.2) * timingMultiplier;
    trial.meteors.push({
      x: clamp(Number.isFinite(Number(x)) ? Number(x) : player.x + player.w / 2 + (trial.meteors.length % 2 ? -70 : 70), 90, currentLevel.worldWidth - 90),
      type: chosen.id,
      glyph: chosen.glyph || "星",
      name: chosen.name || "坠星",
      actionSequence: [...(chosen.actionSequence || ["downstrike"])],
      actionIndex: 0,
      timer: warningTime,
      warningTime,
      riftDamage: Math.max(1, Number(chosen.riftDamage) || 1),
      score: Math.max(0, Number(chosen.score) || 240),
      fragments: Math.max(0, Number(chosen.fragments) || 0),
      life: 0,
      struck: false,
      reflected: false,
    });
    return true;
  }

  function updateTrialMeteors(dt) {
    const trial = runtime?.trial;
    if (!trial) return;
    const phase = trialPhaseConfig(trial);
    const interval = Math.max(0, Number(phase.meteorInterval) || 0) * trialModifier("meteorIntervalMultiplier", 1);
    const speed = trial.upgrades.has("time-pollen") ? 0.72 : 1;
    if (interval > 0) {
      trial.meteorTimer -= dt * speed;
      if (trial.meteorTimer <= 0) {
        spawnTrialMeteor();
        trial.meteorTimer = Math.max(0.8, interval);
      }
    }
    trial.meteors.forEach((meteor) => {
      if (!meteor.struck) {
        meteor.timer -= dt * speed;
        if (meteor.timer > 0) return;
        meteor.struck = true;
        meteor.life = 0.34;
        const hitbox = { x: meteor.x - 46, y: 0, w: 92, h: 620 };
        if (overlap(player, hitbox)) {
          hurtPlayer(meteor.x);
          trial.routeProgress = 0;
          trial.combo = 0;
          trial.comboTimer = 0;
        }
        if (meteor.fragments > 0) {
          const spread = 72;
          for (let index = 0; index < meteor.fragments; index += 1) {
            const offset = (index - (meteor.fragments - 1) / 2) * spread;
            spawnTrialMeteor("fragment", meteor.x + offset);
          }
        }
        shake = Math.max(shake, 8);
        burst(meteor.x, 585, currentLevel.theme.accent, 20, 320);
        playTone("boss");
      } else {
        meteor.life = Math.max(0, meteor.life - dt);
      }
    });
    trial.meteors = trial.meteors.filter((meteor) => !meteor.struck || meteor.life > 0);
  }

  function applyTrialSiegeObjective(trial, phase, index) {
    const objectives = phase.siege?.objectives || [];
    if (!objectives.length) return;
    const objective = objectives[index % objectives.length];
    trial.siege.rotationIndex = index % objectives.length;
    trial.siege.objectiveTask = objective.task || "relay";
    trial.siege.objectiveStart = trialTaskValue(trial.siege.objectiveTask, trial);
    trial.siege.objectiveRequired = Math.max(1, Number(objective.required) || 1);
    trial.route = [];
    trial.routeActions = [];
    trial.routeProgress = 0;
    trial.routeTimer = 0;
    trial.rift.active = trial.siege.objectiveTask === "counter";
    trial.rift.armed = false;
    trial.anchors.forEach((anchor) => { anchor.requiredAction = null; });
    if (trial.siege.objectiveTask === "relay") {
      const actions = objective.actions?.length ? objective.actions : ["touch", "dash", "downstrike"];
      trial.route = trial.anchors.slice(0, actions.length).map((anchor) => anchor.id);
      trial.routeActions = [...actions];
      trial.routeTimer = 18;
      trial.route.forEach((id, routeIndex) => {
        const anchor = trialAnchor(trial, id);
        if (anchor) anchor.requiredAction = trial.routeActions[routeIndex];
      });
    } else if (trial.siege.objectiveTask === "salvage") {
      trial.salvage.seeds = [];
      trial.salvage.carrying = 0;
      trial.salvage.spawnTimer = 0.2;
    } else if (trial.siege.objectiveTask === "repair") {
      const actions = ["pulse", "dash", "downstrike"];
      trial.repairResetTimer = 0;
      trial.repairNodes.forEach((node, nodeIndex) => {
        node.charge = 0;
        node.required = 2;
        node.requiredAction = actions[nodeIndex % actions.length];
        node.charged = false;
      });
    } else if (trial.siege.objectiveTask === "counter") {
      trial.rift.maxHp = 2;
      trial.rift.hp = 2;
      trial.route = trial.anchors.slice(0, 2).map((anchor) => anchor.id);
      trial.routeActions = trial.route.map(() => null);
      trial.routeTimer = 18;
    }
  }

  function initializeTrialSiege(trial, phase) {
    const config = phase.siege || {};
    const eliteConfig = config.elite || {};
    trial.siege.active = true;
    trial.siege.elapsed = 0;
    trial.siege.rotationIndex = 0;
    trial.siege.objectivesCompleted = 0;
    trial.siege.eliteDefeated = false;
    trial.siege.eliteScoreMultiplier = 1;
    trial.siege.elite = {
      ...trial.siege.elite,
      active: false,
      spawned: false,
      defeated: false,
      x: 574,
      y: 404,
      hp: Math.max(1, Number(eliteConfig.hp) || 12),
      maxHp: Math.max(1, Number(eliteConfig.hp) || 12),
      shieldAction: eliteConfig.shieldActions?.[0] || "pulse",
      shieldIndex: 0,
      shieldTimer: Math.max(2, Number(config.rotationInterval) || 11),
      attackTimer: Math.max(0.8, Number(eliteConfig.attackInterval) || 3.2),
      hitFlash: 0,
      score: Math.max(0, Number(eliteConfig.score) || 2600),
      eventBuffed: false,
    };
    applyTrialSiegeObjective(trial, phase, 0);
  }

  function damageTrialElite(action = "pulse") {
    const trial = runtime?.trial;
    const phase = trialPhaseConfig(trial);
    const elite = trial?.siege?.elite;
    if (!trial || trial.phaseTask !== "siege" || !elite || elite.defeated) return false;
    elite.active = true;
    elite.spawned = true;
    const actions = phase.siege?.elite?.shieldActions || ["pulse", "dash", "downstrike"];
    if (action !== elite.shieldAction) {
      toast(`晨辉纸盾偏转攻击 · 需要${{ pulse: "脉冲", dash: "冲刺", downstrike: "下砸" }[elite.shieldAction]}`, 0.85);
      return false;
    }
    const damage = trial.upgrades.has("dawn-oath") ? 2 : 1;
    elite.hp = Math.max(0, elite.hp - damage);
    elite.hitFlash = 0.28;
    elite.shieldIndex = (elite.shieldIndex + 1) % actions.length;
    elite.shieldAction = actions[elite.shieldIndex];
    awardTrialScore(150);
    burst(elite.x + elite.w / 2, elite.y + elite.h / 2, currentLevel.theme.edge, 18, 260);
    if (elite.hp <= 0) {
      elite.defeated = true;
      elite.active = false;
      trial.siege.eliteDefeated = true;
      const multiplier = Math.max(1, Number(trial.siege.eliteScoreMultiplier) || 1);
      awardTrialScore(elite.score, multiplier);
      trial.core.hp = Math.min(trial.core.maxHp, trial.core.hp + 3);
      toast("晨辉守门者解体 · 破晓航线已经守住", 1.6);
      playTone("complete");
    } else {
      playTone("switch");
      toast(`破盾成功 · 下一式${{ pulse: "脉冲", dash: "冲刺", downstrike: "下砸" }[elite.shieldAction]} · ${elite.hp}/${elite.maxHp}`, 0.9);
    }
    return true;
  }

  function updateTrialSiege(dt) {
    const trial = runtime?.trial;
    if (!trial || trial.phaseTask !== "siege") return;
    const phase = trialPhaseConfig(trial);
    const siegeConfig = phase.siege || {};
    const eliteConfig = siegeConfig.elite || {};
    const siege = trial.siege;
    const elite = siege.elite;
    siege.elapsed += dt;
    elite.hitFlash = Math.max(0, elite.hitFlash - dt);
    const spawnDelay = Math.max(0, (Number(eliteConfig.spawnDelay) || 10) + trialModifier("eliteSpawnOffset", 0));
    if (!elite.spawned && siege.elapsed >= spawnDelay) {
      elite.active = true;
      elite.spawned = true;
      toast("晨辉守门者降临 · 观察纸盾动作", 1.3);
    }
    if (elite.active && !elite.defeated) {
      const targetX = player.x + player.w / 2;
      const centerX = elite.x + elite.w / 2;
      elite.x = clamp(elite.x + Math.sign(targetX - centerX) * (Number(eliteConfig.speed) || 126) * dt * 0.42, 90, currentLevel.worldWidth - elite.w - 90);
      elite.attackTimer -= dt;
      if (elite.attackTimer <= 0) {
        elite.attackTimer = Math.max(0.8, Number(eliteConfig.attackInterval) || 3.2);
        const startX = elite.x + elite.w / 2;
        const startY = elite.y + elite.h * 0.42;
        const targetX = trial.core.x + trial.core.w / 2;
        const targetY = trial.core.y + trial.core.h / 2;
        const distance = Math.max(1, Math.hypot(targetX - startX, targetY - startY));
        runtime.enemyShots.push({
          x: startX,
          y: startY,
          w: 24,
          h: 24,
          vx: (targetX - startX) / distance * 250,
          vy: (targetY - startY) / distance * 250,
          life: 3.5,
          trialCoreDamage: 1,
        });
      }
      if (player.dashTime > 0 && overlap(player, elite) && !elite.dashInside) damageTrialElite("dash");
      elite.dashInside = player.dashTime > 0 && overlap(player, elite);
    }
    const rotationInterval = Math.max(4, Number(siegeConfig.rotationInterval) || 11);
    const progress = trialTaskValue(siege.objectiveTask, trial) - siege.objectiveStart;
    if (progress >= siege.objectiveRequired || siege.elapsed >= rotationInterval) {
      if (progress >= siege.objectiveRequired) {
        siege.objectivesCompleted += 1;
        awardTrialScore(480);
        if (trial.upgrades.has("dawn-oath")) trial.core.shield += 1;
      }
      applyTrialSiegeObjective(trial, phase, siege.rotationIndex + 1);
      siege.elapsed = 0;
    }
  }

  function chooseTrialEvent(choiceId) {
    const trial = runtime?.trial;
    const active = trial?.activeEvent;
    if (!trial || !active?.pendingChoice) return false;
    const choice = active.choices.find((entry) => entry.id === choiceId);
    if (!choice) return false;
    active.choiceId = choice.id;
    active.pendingChoice = false;
    active.modifiers = { ...(active.modifiers || {}), ...(choice.effects || {}) };
    const effects = choice.effects || {};
    if (effects.coreHeal) trial.core.hp = Math.min(trial.core.maxHp, trial.core.hp + Math.max(0, Number(effects.coreHeal) || 0));
    if (effects.coreShield) trial.core.shield += Math.max(0, Number(effects.coreShield) || 0);
    if (choice.id === "challenge" && trial.siege?.elite && !trial.siege.elite.eventBuffed) {
      const elite = trial.siege.elite;
      const hpMultiplier = Math.max(1, Number(effects.eliteHpMultiplier) || 1);
      elite.maxHp = Math.max(1, Math.ceil(elite.maxHp * hpMultiplier));
      elite.hp = elite.maxHp;
      elite.active = true;
      elite.spawned = true;
      elite.defeated = false;
      elite.eventBuffed = true;
      trial.siege.eliteDefeated = false;
      trial.siege.eliteScoreMultiplier = Math.max(1, Number(effects.eliteScoreMultiplier) || 1);
    }
    toast(`${active.name} · ${choice.label}`, 1.2);
    return true;
  }

  function triggerTrialEvent(id, choiceId = null) {
    const trial = runtime?.trial;
    const event = TRIAL_EVENTS[id];
    if (!trial || !event) return false;
    trial.activeEvent = {
      id: event.id,
      glyph: event.glyph,
      name: event.name,
      announcement: event.announcement,
      timeLeft: Math.max(1, Number(event.duration) || 12),
      modifiers: { ...(event.modifiers || {}) },
      choices: (event.choices || []).map((choice) => deepClone(choice)),
      pendingChoice: Boolean(event.choices?.length),
      choiceId: null,
    };
    trial.eventSerial += 1;
    trial.eventHistory.push(event.id);
    if (trial.eventHistory.length > 8) trial.eventHistory.shift();
    toast(event.announcement || event.name, 1.5);
    if (choiceId) return chooseTrialEvent(choiceId);
    return true;
  }

  function randomTrialEventId(trial, plan) {
    const recent = trial.eventHistory.slice(-Math.max(0, Number(plan.avoidRepeat) || 0));
    const pool = (plan.pool || []).filter((entry) => !recent.includes(entry.event));
    const choices = pool.length ? pool : plan.pool || [];
    const total = choices.reduce((sum, entry) => sum + Math.max(1, Number(entry.weight) || 1), 0);
    let roll = nextTrialRandom(trial) * Math.max(1, total);
    return choices.find((entry) => {
      roll -= Math.max(1, Number(entry.weight) || 1);
      return roll <= 0;
    })?.event || choices[0]?.event || null;
  }

  function updateTrialEvents(dt, config) {
    const trial = runtime?.trial;
    if (!trial || !config?.eventPlan) return;
    if (trial.activeEvent) {
      trial.activeEvent.timeLeft -= dt;
      if (trial.activeEvent.timeLeft <= 0) trial.activeEvent = null;
    }
    const plan = config.eventPlan;
    if (plan.mode === "scheduled") {
      const schedule = plan.schedule || [];
      while (trial.eventScheduleIndex < schedule.length && trial.elapsed >= Number(schedule[trial.eventScheduleIndex].at)) {
        triggerTrialEvent(schedule[trial.eventScheduleIndex].event);
        trial.eventScheduleIndex += 1;
      }
    } else if (plan.mode === "seeded-random" && trial.elapsed >= trial.nextEventAt) {
      const id = randomTrialEventId(trial, plan);
      if (id) triggerTrialEvent(id);
      const range = Array.isArray(plan.interval) ? plan.interval : [28, 32];
      const low = Math.max(4, Number(range[0]) || 24);
      const high = Math.max(low, Number(range[1]) || low);
      trial.nextEventAt = trial.elapsed + low + nextTrialRandom(trial) * (high - low);
    }
  }

  function updateTrialTask(dt) {
    const trial = runtime?.trial;
    if (!trial) return;
    updateTrialAnchors(dt);
    const task = trialActiveTask(trial);
    if (task === "escort") updateTrialEscort(dt);
    if (task === "salvage") updateTrialSalvage(dt);
    if (task === "repair") updateTrialRepair(dt);
    if (trialMeteorsEnabled(trial)) updateTrialMeteors(dt);
    if (trial.phaseTask === "siege") updateTrialSiege(dt);
  }

  function spawnTrialEnemy() {
    const trial = runtime?.trial;
    const config = trialById(trial?.id);
    if (!trial || !config) return;
    const wave = config.waves || {};
    const phase = trialPhaseConfig(trial, config);
    const phaseTypes = Array.isArray(phase.enemyTypes) ? phase.enemyTypes : [];
    const types = phaseTypes.length
      ? phaseTypes
      : Array.isArray(wave.enemyTypes) && wave.enemyTypes.length ? wave.enemyTypes : ["seed-hopper"];
    const index = trial.spawnCount;
    const jammerEvery = Math.max(0, Math.round((Number(phase.jammerEvery) || 0) * trialModifier("jammerIntervalMultiplier", 1)));
    const jammer = jammerEvery > 0 && index > 0 && index % jammerEvery === 0;
    const type = jammer ? String(phase.jammerType || "pollen-drone") : types[index % types.length];
    const side = index % 2 === 0 ? -1 : 1;
    const flying = isFlyingEnemy(type);
    const hp = jammer ? 2 : 1 + (index >= 18 && index % 7 === 0 ? 1 : 0);
    const speed = Math.min(186, 84 + Math.floor(index / 5) * 9 + (flying ? 12 : 0));
    const w = flying ? 48 : 50;
    const h = flying ? 40 : 46;
    const x = side < 0 ? 22 : currentLevel.worldWidth - w - 22;
    const repairTarget = trialActiveTask(trial) === "repair"
      ? trial.repairNodes.slice().sort((a, b) => b.charge - a.charge)[0]?.id
      : null;
    runtime.enemies.push({
      id: `trial-${index}`,
      type,
      x,
      y: flying ? 420 + index % 3 * 34 : 574,
      w,
      h,
      vx: side < 0 ? speed : -speed,
      vy: 0,
      originX: x,
      range: currentLevel.worldWidth,
      hp,
      maxHp: hp,
      alive: true,
      t: index * 0.37,
      cooldown: 0.7,
      state: "patrol",
      stateTimer: 0,
      patrolVx: side < 0 ? speed : -speed,
      baseY: flying ? 420 + index % 3 * 34 : 574,
      rewindX: x,
      rewindY: flying ? 420 + index % 3 * 34 : 574,
      rewindTimer: 1.2,
      rewindCooldown: 0,
      trialEnemy: true,
      trialRole: jammer ? "jammer" : "raider",
      trialTargetId: jammer ? (repairTarget || trialExpectedAnchor(trial)?.id || trial.anchors[index % trial.anchors.length]?.id || null) : null,
      trialSpeed: speed,
      side,
      rewarded: false,
      breached: false,
    });
    trial.spawnCount += 1;
  }

  function updateTrial(dt) {
    const trial = runtime?.trial;
    if (!trial || trial.finished) return;
    const config = trialById(trial.id);
    const wave = config?.waves || {};
    trial.elapsed += dt;
    if (!trial.endless) trial.timeLeft = Math.max(0, trial.timeLeft - dt);
    trial.comboTimer = Math.max(0, trial.comboTimer - dt);
    trial.core.hitFlash = Math.max(0, trial.core.hitFlash - dt);
    if (trial.comboTimer <= 0) trial.combo = 0;

    const elapsed = trial.elapsed;
    advanceTrialPhase(trial, config, elapsed);
    updateTrialEvents(dt, config);
    if (trialUsesRouteTask(trial)) trial.routeTimer = Math.max(0, trial.routeTimer - dt);
    updateTrialTask(dt);
    trial.rift.hitFlash = Math.max(0, trial.rift.hitFlash - dt);
    if (trialUsesRouteTask(trial) && trial.routeTimer <= 0) {
      damageTrialCore(1);
      trial.combo = 0;
      trial.comboTimer = 0;
      shake = Math.max(shake, 7);
      playTone("hurt");
      toast("星轨熄灭 · 芽核流失一点能量", 1.05);
      if (trial.phaseTask === "siege") applyTrialSiegeObjective(trial, trialPhaseConfig(trial, config), trial.siege.rotationIndex);
      else beginTrialRoute(trial, config);
    }

    trial.spawnTimer -= dt;
    if (trial.spawnTimer <= 0) {
      spawnTrialEnemy();
      const waveIndex = Math.floor(elapsed / Math.max(1, Number(wave.waveLength) || 15));
      const interval = Math.max(Number(wave.minimumInterval) || 0.72, (Number(wave.baseInterval) || 2.25) - waveIndex * (Number(wave.intervalStep) || 0.24));
      const routeInterval = trial.phaseTask === "escort" ? trial.escort.spawnIntervalMultiplier : 1;
      trial.spawnTimer = interval * routeInterval * trialModifier("enemySpawnIntervalMultiplier", 1);
      if (trial.spawnCount % Math.max(2, Number(wave.pairEvery) || 5) === 0) {
        trial.spawnTimer *= 0.35;
      }
    }

    runtime.enemies.forEach((enemy) => {
      if (!enemy.trialEnemy || enemy.rewarded) return;
      const targetAnchor = enemy.trialRole === "jammer" ? trialAnchor(trial, enemy.trialTargetId) : null;
      if (enemy.alive && targetAnchor && overlap(enemy, targetAnchor)) {
        enemy.alive = false;
        enemy.breached = true;
        enemy.rewarded = true;
        targetAnchor.jammed = trial.upgrades.has("time-pollen") ? 3.2 : 4.8;
        if (trialActiveTask(trial) === "repair") {
          const node = trial.repairNodes.find((entry) => entry.id === targetAnchor.id);
          if (node) node.charge = Math.max(0, node.charge - 1);
        }
        trial.combo = 0;
        trial.comboTimer = 0;
        shake = Math.max(shake, 7);
        playTone("hurt");
        toast(`${targetAnchor.label}遭到污染 · 下砸可立即净化`, 1.2);
        burst(targetAnchor.x + targetAnchor.w / 2, targetAnchor.y + targetAnchor.h / 2, currentLevel.theme.accent, 18, 230);
      } else if (enemy.alive && enemy.trialRole !== "jammer" && trial.phaseTask === "escort" && overlap(enemy, trial.escort)) {
        enemy.alive = false;
        enemy.breached = true;
        enemy.rewarded = true;
        trial.escort.hp = Math.max(0, trial.escort.hp - (enemy.hp > 1 ? 2 : 1));
        shake = Math.max(shake, 8);
        burst(trial.escort.x + trial.escort.w / 2, trial.escort.y + trial.escort.h / 2, currentLevel.theme.accent, 14, 220);
        if (trial.escort.hp <= 0) {
          damageTrialCore(2);
          const phase = trialPhaseConfig(trial, config);
          if (trial.upgrades.has("seed-shell")) trial.escort.targetIndex = Math.max(0, trial.escort.targetIndex - 1);
          else trial.escort.targetIndex = 0;
          resetTrialEscort(trial, phase);
          toast("移动星种破裂 · 芽核流失两点能量", 1.35);
        } else toast(`星种受击 · 护甲 ${trial.escort.hp}/${trial.escort.maxHp}`, 0.95);
      } else if (enemy.alive && enemy.trialRole !== "jammer" && overlap(enemy, trial.core)) {
        enemy.alive = false;
        enemy.breached = true;
        enemy.rewarded = true;
        damageTrialCore(enemy.hp > 1 ? 2 : 1);
        trial.combo = 0;
        trial.comboTimer = 0;
        shake = Math.max(shake, 12);
        flash = Math.max(flash, 0.28);
        playTone("hurt");
        burst(trial.core.x + trial.core.w / 2, trial.core.y + trial.core.h / 2, currentLevel.theme.accent, 20, 270);
      } else if (!enemy.alive) {
        enemy.rewarded = true;
        awardTrialScore(enemy.trialRole === "jammer" ? 90 : enemy.maxHp > 1 ? 60 : 35);
      }
    });
    runtime.enemies = runtime.enemies.filter((enemy) => !enemy.trialEnemy || enemy.alive || !enemy.rewarded);

    const upgradeAt = trialUpgradeDueAt(trial, config);
    if (trial.core.hp <= 0) {
      completeTrial(false);
      return;
    }
    if (trialUpgradeChoices().length && elapsed >= upgradeAt) {
      openTrialUpgrade();
      return;
    }
    if (!trial.endless && trial.timeLeft <= 0) {
      resolveTrialPhase(trial, config);
      completeTrial(trial.core.hp > 0);
    }
  }

  function completeTrial(survived) {
    const trial = runtime?.trial;
    if (!trial || trial.finished) return;
    trial.finished = true;
    trial.survived = survived;
    if (survived) trial.score += Math.round(trial.core.hp * 75 + trial.bestCombo * 18);
    const grade = trialGrade(trial.score, survived);
    const tide = Math.max(1, trial.phaseSerial + 1);
    const previous = save.trialRecords?.[trial.id] || { score: 0, combo: 0, grade: "—", tide: 0, cleared: false };
    const gradeRank = { "—": 0, D: 1, C: 2, B: 3, A: 4, S: 5 };
    const isRecord = trial.score > Number(previous.score || 0);
    save.trialRecords = save.trialRecords || {};
    save.trialRecords[trial.id] = {
      score: Math.max(Number(previous.score) || 0, trial.score),
      combo: Math.max(Number(previous.combo) || 0, trial.bestCombo),
      grade: gradeRank[grade] > gradeRank[previous.grade] ? grade : previous.grade,
      tide: Math.max(Number(previous.tide) || 0, tide),
      cleared: Boolean(previous.cleared || (trial.id === "night-watch" && survived)),
    };
    persist();
    scene = "trial-result";
    setGameUi(false);
    setNodeText("#trial-result-grade", grade);
    setNodeText("#trial-result-title", trial.endless ? `守到第 ${tide} 潮` : survived ? `${trial.name}完成` : "芽核失守");
    setNodeText("#trial-result-detail", survived
      ? `星轨 ${trial.circuits} 条 · 护送 ${trial.escort.deliveries} 次 · 救回 ${trial.salvage.delivered} 枚 · 修复 ${trial.repairedSets} 轮 · 反射 ${trial.reflections} 次${trial.siege.eliteDefeated ? " · 晨辉守门者已击退" : ""}`
      : `坚持了 ${Math.ceil(trial.elapsed)} 秒 · 抵达第 ${tide} 潮 · 完成 ${trialPhaseObjectiveProgress(trial)} 项当前任务`);
    setNodeText("#trial-result-score", trial.score.toLocaleString("zh-CN"));
    setNodeText("#trial-result-record", isRecord ? "✦ 新的守夜最高记录" : `最高记录 ${save.trialRecords[trial.id].score.toLocaleString("zh-CN")} 分`);
    const retry = $("#trial-retry");
    if (retry) retry.dataset.trialId = trial.id;
    showOnly("trial-result-screen");
    playTone(survived ? "complete" : "hurt");
    stopAnimationLoop();
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
    if (runtime.trial) {
      const trial = runtime.trial;
      const phase = trialPhaseConfig(trial);
      const required = Math.max(1, Number(phase.objectiveRequired) || 1);
      const eventText = trial.activeEvent ? ` · ${trial.activeEvent.name}${trial.activeEvent.pendingChoice ? "：去西/东星锚选择" : ""}` : "";
      if (trial.phaseTask === "escort") {
        if (!trial.escort.routeId) return `${trial.phaseName} · 去西弦选稳路，或去东弦选险路${eventText}`;
        const target = trialAnchor(trial, trial.escort.targetId);
        return `${trial.phaseName} · ${trial.escort.routeId === "risky" ? "彗尾短路" : "月环长路"} · 护送至${target?.label || "星锚"}${eventText}`;
      }
      const task = trialActiveTask(trial);
      if (task === "salvage") {
        return `${trial.phaseName} · 救回 ${trial.salvage.delivered}/${required} · 携带 ${trial.salvage.carrying}，回芽核存入${eventText}`;
      }
      if (task === "repair") {
        const charged = trial.repairNodes.filter((node) => node.charge >= node.required).length;
        return `${trial.phaseName} · 星柱 ${charged}/3 · 西脉冲 / 冠冲刺 / 东下砸${eventText}`;
      }
      if (task === "counter") {
        return trial.rift.armed
          ? `${trial.phaseName} · 镜面已蓄能 · 按坠星图示依次脉冲 / 下砸${eventText}`
          : `${trial.phaseName} · 先接入两枚发光星锚 · 裂隙 ${trial.rift.hp}/${trial.rift.maxHp}`;
      }
      if (trial.phaseTask === "siege") {
        const elite = trial.siege.elite;
        return `${trial.phaseName} · 晨辉守门者 ${elite.hp}/${elite.maxHp} · 下一式${{ pulse: "脉冲", dash: "冲刺", downstrike: "下砸" }[elite.shieldAction]}${eventText}`;
      }
      const expected = trialExpectedAnchor(trial);
      const requiredAction = trial.routeActions[trial.routeProgress];
      const jammed = trial.anchors.filter((anchor) => anchor.jammed > 0);
      if (jammed.length) return `污染警报 · ${jammed.map((anchor) => anchor.label).join(" / ")} · 靠近后下砸净化`;
      return `${trial.phaseName} · 星轨 ${trialPhaseObjectiveProgress(trial)}/${required} · 下一枚 ${expected?.label || "星锚"}${requiredAction ? `（${{ touch: "触碰", dash: "冲刺", downstrike: "下砸" }[requiredAction]}）` : ""}${eventText}`;
    }
    if (runtime.growthLenses.length) {
      const formName = runtime.growthForm === "small" ? "小芽" : "巨芽";
      const broken = runtime.waxSeals.filter((seal) => seal.broken).length;
      return `${formName}形态 · 露镜脉冲切换 · 蜡壳 ${broken}/${runtime.waxSeals.length}`;
    }
    if (runtime.railStations.length) {
      return `彗线星站 ${runtime.visitedRailStations.size}/${runtime.railStations.filter((station) => station.required !== false).length} · 岔口跳跃选上轨 / 下键选下轨`;
    }
    if (runtime.searchlights.length) {
      const keys = runtime.collectibles.filter((item) => item.type === "shadow-key" && item.collected).length;
      const grace = Math.max(0.2, Number(runtime.devices.exposure?.grace) || 1.2);
      return `影钥 ${keys}/3 · 暴露 ${Math.round(runtime.shadowExposure / grace * 100)}% · 脉冲移动纸屏造影`;
    }
    if (runtime.boss?.archetype === "scorewing-maestro" && runtime.boss.hp > 0) {
      return `星片 ${runtime.capturedCrownShards}/${scorewingRequiredShards(runtime.boss)} · 脉冲捕获，蓄满后冲刺齐射`;
    }
    const parts = [];
    const primaryObjective = runtime.objectives[0];
    if (primaryObjective) {
      const progress = objectiveProgress(primaryObjective);
      const suffix = primaryObjective.type === "repair-zones" && progress.progress >= progress.required && !primaryObjective.submitted ? " · 回圣所提交" : "";
      parts.push(`${primaryObjective.label || "裂界目标"} ${progress.progress}/${progress.required}${suffix}`);
    }
    parts.push(`芽芯 ${HERO_MODULES[save.heroModule]?.name || HERO_MODULES.none.name}`);
    if (runtime.seedTotal > 0) {
      const found = runtime.collectibles.filter((item) => (item.type === "memory-seed" || item.type === "seed") && item.collected).length;
      parts.push(`种子 ${found}/${runtime.seedTotal} · 总计 ${save.seeds}`);
    }

    const requirement = currentLevel.goal?.requires;
    if (requirement && typeof requirement === "object" && requirement.type === "collect") {
      const progress = collectRequirementProgress(requirement);
      parts.push(`${requirement.label || COLLECTIBLE_EFFECTS[requirement.itemType]?.label || "任务物"} ${progress.count}/${progress.required}`);
    }
    if (requirement?.type === "fold-pattern") {
      const matched = runtime.foldPanels.filter((panel) => runtime.foldStates[panel.group] === Number(panel.targetState)).length;
      parts.push(`${requirement.label || "稳定折面"} ${matched}/${Math.max(1, Number(requirement.count) || runtime.foldPanels.length)}`);
    }
    if (requirement?.type === "kite-chain") {
      parts.push(`${requirement.label || "风筝锚"} ${runtime.kiteVisited.size}/${Math.max(1, Number(requirement.count) || 1)}`);
    }
    if (requirement?.type === "return-seed") parts.push(runtime.pageTurn?.active ? "返航：回到起点" : "任务：前往书页尽头");
    if (requirement?.type === "balanced-bridges") {
      parts.push(`${requirement.label || "衡星桥"} ${runtime.scaleBridges.filter((bridge) => bridge.balanced).length}/${Math.max(1, Number(requirement.count) || 1)}`);
    }
    if (requirement?.type === "woven-routes") {
      parts.push(`${requirement.label || "芽纹纸桥"} ${runtime.trajectory.wovenRoutes.size}/${Math.max(1, Number(requirement.count) || 1)}`);
    }
    if (runtime.seams.length) parts.push(`当前层：${runtime.silhouetteLane === "foreground" ? "前景" : "背景"}`);
    if (runtime.dragonKnots.length && runtime.boss?.hp > 0) {
      parts.push(runtime.dragonCycle.coreOpen
        ? `龙芯暴露 ${Math.ceil(runtime.boss.vulnerable)}秒`
        : `结鳞 ${runtime.dragonKnots.filter((knot) => knot.active).length}/${runtime.dragonKnots.length}`);
    }
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
    if (runtime.relays.length > 0 && !currentLevel.isBoss) {
      const activeRelays = runtime.relays.filter((relay) => relay.active);
      const countdown = activeRelays.length ? ` · ${Math.ceil(Math.min(...activeRelays.map((relay) => relay.timer)))}秒` : "";
      parts.push(`继电器 ${activeRelays.length}/${runtime.relays.length}${countdown}`);
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

  function updateHudProperty(cacheKey, node, property, value) {
    const nextValue = String(value);
    if (hudRenderCache[cacheKey] === nextValue) return;
    hudRenderCache[cacheKey] = nextValue;
    node[property] = nextValue;
  }

  function updateHud() {
    if (!player || !currentLevel) return;
    const trial = runtime?.trial;
    const trialHud = $("#trial-hud");
    if (trialHud) trialHud.hidden = !trial;
    if (trial) {
      updateHudProperty("trialTime", $("#trial-time"), "textContent", trial.endless ? `第 ${trial.phaseSerial + 1} 潮` : Math.ceil(trial.timeLeft));
      updateHudProperty("trialScore", $("#trial-score"), "textContent", trial.score.toLocaleString("zh-CN"));
      updateHudProperty("trialCombo", $("#trial-combo"), "textContent", `×${trial.combo}`);
      updateHudProperty("trialCore", $("#trial-core-text"), "textContent", `${trial.core.hp} / ${trial.core.maxHp}${trial.core.shield > 0 ? ` +${trial.core.shield}盾` : ""}`);
      updateHudProperty("trialCoreFill", $("#trial-core-fill").style, "transform", `scaleX(${clamp(trial.core.hp / trial.core.maxHp, 0, 1)})`);
      const phaseRoman = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ"][trial.phaseIndex] || String(trial.phaseIndex + 1);
      const phase = trialPhaseConfig(trial);
      const required = Math.max(1, Number(phase.objectiveRequired) || 1);
      const actionGlyph = { touch: "○", dash: "➜", downstrike: "▼" };
      let routeText = trial.route.map((id, index) => index < trial.routeProgress
        ? "✓"
        : `${actionGlyph[trial.routeActions[index]] || ""}${trialAnchor(trial, id)?.label || id}`).join(" → ");
      if (trial.phaseTask === "escort") {
        const target = trialAnchor(trial, trial.escort.targetId);
        routeText = trial.escort.routeId
          ? `护送 ${trial.escort.deliveries}/${required} → ${target?.label || "星锚"} · ${trial.escort.routeId === "risky" ? "险路" : "稳路"}`
          : "西弦：月环稳路 · 东弦：彗尾险路";
      } else if (trial.phaseTask === "salvage") {
        routeText = `归巢 ${trial.salvage.delivered}/${required} · 携带 ${trial.salvage.carrying} · 场中 ${trial.salvage.seeds.length}`;
      } else if (trial.phaseTask === "repair") {
        routeText = `三柱共鸣 ${trial.repairedSets}/${required} · ${trial.repairNodes.map((node) => `${trialAnchor(trial, node.id)?.label || node.id} ${node.charge}/${node.required}`).join(" · ")}`;
      } else if (trial.phaseTask === "counter") {
        routeText = `${trial.rift.armed ? "镜面已蓄能" : routeText} · 裂隙 ${trial.rift.hp}/${trial.rift.maxHp} · 封闭 ${trial.rift.closures}/${required}`;
      } else if (trial.phaseTask === "siege") {
        const elite = trial.siege.elite;
        routeText = `${trial.siege.objectiveTask || "relay"}轮换 · 守门者 ${elite.hp}/${elite.maxHp} · ${actionGlyph[elite.shieldAction] || ""}${{ pulse: "脉冲", dash: "冲刺", downstrike: "下砸" }[elite.shieldAction]}`;
      }
      updateHudProperty("trialPhase", $("#trial-phase"), "textContent", `${phaseRoman} · ${trial.phaseName}`);
      updateHudProperty("trialRoute", $("#trial-route"), "textContent", routeText);
      updateHudProperty("trialRouteTime", $("#trial-route-time"), "textContent", trialUsesRouteTask(trial) ? `${Math.ceil(trial.routeTimer)} 秒` : `目标 ${trialPhaseObjectiveProgress(trial)}/${required}`);
    }
    const healthMarkup = Array.from({ length: player.maxHealth }, (_, i) => `<i class="${i < player.health ? "is-full" : ""}"></i>`).join("");
    updateHudProperty("health", $("#health"), "innerHTML", healthMarkup);
    updateHudProperty("stage", $("#hud-stage"), "textContent", trial ? "SIDE MODE" : `STAGE ${pad(currentLevel.id)}`);
    updateHudProperty("name", $("#hud-name"), "textContent", currentLevel.name);
    updateHudProperty("dash", $("#dash-fill").style, "transform", `scaleX(${clamp(1 - player.dashCooldown / 0.8, 0, 1)})`);
    const pickupNode = $("#pickup-status");
    const pickupText = pickupStatusText();
    if (pickupNode && hudRenderCache.pickup !== pickupText) {
      hudRenderCache.pickup = pickupText;
      pickupNode.textContent = pickupText;
      pickupNode.title = pickupText;
    }
    const bossHud = $("#boss-hud");
    const bossVisible = Boolean(runtime?.boss?.active);
    if (hudRenderCache.bossVisible !== bossVisible) {
      hudRenderCache.bossVisible = bossVisible;
      bossHud.hidden = !bossVisible;
    }
    if (bossVisible) {
      updateHudProperty("bossName", $("#boss-name"), "textContent", runtime.boss.name);
      const bossHealthMarkup = Array.from({ length: runtime.boss.maxHp }, (_, i) => `<i class="${i < runtime.boss.hp ? "is-full" : ""}"></i>`).join("");
      updateHudProperty("bossHealth", $("#boss-health"), "innerHTML", bossHealthMarkup);
      updateHudProperty("bossStatus", $("#boss-status"), "textContent", bossStatus());
    }
  }

  function bossPhaseForHealth(boss) {
    if (!Array.isArray(boss?.phases) || boss.phases.length === 0) {
      return Math.max(1, boss?.maxHp - boss?.hp + 1 || 1);
    }
    let phase = 1;
    boss.phases.forEach((entry, index) => {
      if (boss.hp <= Number(entry.atHealth)) phase = index + 1;
    });
    return clamp(phase, 1, boss.phases.length);
  }

  function weaverRequiredRelayIds(boss = runtime?.boss) {
    const configured = runtime?.bossRelay?.requiredByPhase?.[boss?.phase];
    if (Array.isArray(configured) && configured.length) return configured;
    const phaseData = boss?.phases?.[Math.max(0, Number(boss?.phase) - 1)];
    if (Array.isArray(phaseData?.requiredRelays) && phaseData.requiredRelays.length) return phaseData.requiredRelays;
    return runtime?.relays?.filter((relay) => relay.role === "boss-relay").slice(0, Math.max(1, Number(boss?.phase) || 1)).map((relay) => relay.id) || [];
  }

  function weaverRelayProgress(boss = runtime?.boss) {
    const ids = weaverRequiredRelayIds(boss);
    const relays = ids.map((id) => runtime.relays.find((relay) => relay.id === id)).filter(Boolean);
    const active = relays.filter((relay) => relay.active && relay.timer > 0);
    const countdown = active.length ? Math.min(...active.map((relay) => relay.timer)) : 0;
    return { ids, relays, active, countdown, ready: relays.length === ids.length && ids.length > 0 && active.length === ids.length };
  }

  function starWhaleAnchorProgress(boss = runtime?.boss) {
    const phaseData = boss?.phases?.[Math.max(0, Number(boss?.phase) - 1)] || {};
    const required = Math.max(1, Number(phaseData.requiredAnchors) || Number(boss?.phase) || 1);
    const active = runtime?.gravityAnchors?.filter((anchor) => anchor.active && anchor.timer > 0) || [];
    const countdown = active.length ? Math.min(...active.map((anchor) => anchor.timer)) : 0;
    return { required, active, countdown, ready: active.length >= required };
  }

  function bossStatus() {
    if (!runtime?.boss) return "";
    const boss = runtime.boss;
    if (boss.archetype === "rift-weaver") {
      const hitsPerExposure = Math.max(1, Number(runtime.bossRelay.hitsPerExposure || boss.weakPoint.hitsPerExposure) || 2);
      if (boss.vulnerable > 0) return `织界核心暴露 · 本轮可命中 ${Math.max(0, hitsPerExposure - boss.exposureHits)} 次`;
      const relay = weaverRelayProgress(boss);
      const countdown = relay.countdown > 0 ? ` · ${Math.ceil(relay.countdown)}秒` : "";
      return `第 ${boss.phase} 相 · 继电器 ${relay.active.length}/${relay.ids.length}${countdown}`;
    }
    if (boss.archetype === "star-whale") {
      const hitsPerExposure = Math.max(1, Number(boss.weakPoint.hitsPerExposure) || 2);
      if (boss.vulnerable > 0) return `星核暴露 · 本轮可命中 ${Math.max(0, hitsPerExposure - boss.exposureHits)} 次`;
      const anchors = starWhaleAnchorProgress(boss);
      const countdown = anchors.countdown > 0 ? ` · ${Math.ceil(anchors.countdown)}秒` : "";
      return `第 ${boss.phase} 潮 · 星锚 ${anchors.active.length}/${anchors.required}${countdown}`;
    }
    if (boss.archetype === "fold-warden") {
      if (boss.vulnerable > 0) return "千页核心暴露 · 现在攻击！";
      const target = runtime.foldTraps.find((trap) => trap.id === boss.targetTrapId);
      if (boss.state === "fold-telegraph" && target) return `俯冲预警 · 下砸折痕 ${target.index + 1}`;
      if (boss.state === "fold-dive") return "守鸾正在俯冲 · 让折面保持竖起";
      return `第 ${boss.phase} 章 · 等待俯冲预警`;
    }
    if (boss.archetype === "scorewing-maestro") {
      const required = scorewingRequiredShards(boss);
      if (boss.hitFlash > 0) return `终曲反奏命中 · 进入第 ${boss.phase} 乐章`;
      return `第 ${boss.phase} 乐章 · 星片 ${runtime.capturedCrownShards}/${required} · 蓄满后冲刺齐射`;
    }
    if (boss.vulnerable > 0) return "核心暴露 · 现在攻击！";
    if (boss.archetype === "boiler-beetle") {
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
    if (document.hidden) {
      stopAnimationLoop();
      resetInput();
      if (scene === "playing") togglePause();
      return;
    }
    if (scene === "playing") resumeAnimationLoop();
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

  function handleTouchPointerMove(event) {
    const active = input.pointers.get(event.pointerId);
    if (!active || (active.action !== "left" && active.action !== "right")) return;
    event.preventDefault();
    const movePad = active.button.closest?.(".touch-move");
    const rect = movePad?.getBoundingClientRect?.();
    if (!rect || rect.width <= 0) return;
    const action = event.clientX < rect.left + rect.width / 2 ? "left" : "right";
    if (action === active.action) return;
    const nextButton = movePad.querySelector?.(`[data-touch="${action}"]`);
    if (!nextButton) return;
    releaseAction(active.action, active.source);
    const oldButton = active.button;
    active.action = action;
    active.button = nextButton;
    pressAction(action, active.source);
    oldButton.classList.toggle("is-pressed", [...input.pointers.values()].some((entry) => entry !== active && entry.button === oldButton));
    nextButton.classList.add("is-pressed");
  }

  $$('[data-touch]').forEach((button) => {
    button.addEventListener("pointerdown", handleTouchPointerDown);
    button.addEventListener("pointermove", handleTouchPointerMove);
    button.addEventListener("pointerup", (event) => releaseTouchPointer(event.pointerId, event));
    button.addEventListener("pointercancel", (event) => releaseTouchPointer(event.pointerId, event));
    button.addEventListener("lostpointercapture", (event) => releaseTouchPointer(event.pointerId, event));
  });
  window.addEventListener("pointerup", (event) => releaseTouchPointer(event.pointerId, event), true);
  window.addEventListener("pointercancel", (event) => releaseTouchPointer(event.pointerId, event), true);

  document.addEventListener("click", (event) => {
    const upgradeButton = event.target.closest("[data-trial-upgrade]");
    if (upgradeButton) {
      createAudio();
      chooseTrialUpgrade(upgradeButton.dataset.trialUpgrade);
      return;
    }
    const levelButton = event.target.closest("[data-level]");
    if (levelButton && !levelButton.disabled) {
      startLevel(Number(levelButton.dataset.level));
      return;
    }
    const moduleButton = event.target.closest("[data-module]");
    if (moduleButton) {
      createAudio();
      equipHeroModule(moduleButton.dataset.module);
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
    if (action === "trials") openTrials();
    if (action === "start-trial") startTrial(button.dataset.trialId || "night-watch");
    if (action === "trial-retry") startTrial(button.dataset.trialId || runtime?.trial?.id || "night-watch");
    if (action === "profile") openProfile();
    if (action === "bestiary") openBestiary();
    if (action === "help") openHelp();
    if (action === "back" || action === "home") openMenu();
    if (action === "resume") togglePause(true);
    if (action === "pause") togglePause();
    if (action === "restart" && currentLevel) {
      if (currentMode === "trial") startTrial(runtime?.trial?.id || "night-watch");
      else startLevel(currentLevel.id);
    }
    if (action === "next") {
      const nextLevelId = nextCampaignLevelId(currentLevel.id);
      if (nextLevelId) startLevel(nextLevelId);
      else openLevels();
    }
    if (action === "mute") {
      muted = !muted;
      $("#mute-icon").textContent = muted ? "静音" : "声音";
      persist();
    }
    if (action === "fullscreen") {
      if (!document.fullscreenElement) $("#app").requestFullscreen?.();
      else document.exitFullscreen?.();
    }
    if (action === "retry-art") retryCurrentLevelArt();
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

    runtime.time += dt;
    updatePlatforms(dt);
    updateDevices(dt);
    updatePlayer(dt);
    updateEchoClone(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateTrial(dt);
    if (scene !== "playing") {
      input.pressed.clear();
      return;
    }
    updateBoss(dt);
    updateParticles(dt);
    updateCamera(dt);
    updateHud();
    input.pressed.clear();
  }

  function isTimeFrozenAt(x, y) {
    return runtime.timeAnchors.some((anchor) => anchor.active && anchor.timer > 0
      && Math.hypot(x - (anchor.x + anchor.w / 2), y - (anchor.y + anchor.h / 2)) <= (Number(anchor.radius) || 650));
  }

  function isLaneEntityActive(entity) {
    const lane = String(entity?.lane || "both");
    return lane === "both" || !runtime?.seams?.length || lane === runtime.silhouetteLane;
  }

  function inactiveLaneFilter() {
    const opacity = clamp(Number(runtime?.devices?.inactiveLane?.opacity) || 0.28, 0.08, 0.75);
    return `opacity(${Math.round(opacity * 100)}%) saturate(55%)`;
  }

  function layoutWeightSlot(slot) {
    const occupants = runtime.weightBlocks
      .filter((weight) => weight.seatedSlotId === slot.id)
      .sort((a, b) => a.index - b.index);
    occupants.forEach((weight, index) => {
      const center = slot.x + slot.w * (index + 1) / (occupants.length + 1);
      weight.x = center - weight.w / 2;
      weight.y = slot.y - weight.h + 4;
      weight.vx = 0;
    });
  }

  function updateScaleBridges() {
    runtime.scaleBridges.forEach((bridge) => {
      const platform = runtime.platforms.find((entry) => entry.id === bridge.platformId);
      const left = runtime.weightBlocks.filter((weight) => weight.seatedSlotId === bridge.leftSlot);
      const right = runtime.weightBlocks.filter((weight) => weight.seatedSlotId === bridge.rightSlot);
      bridge.leftMass = left.reduce((sum, weight) => sum + weight.mass, 0);
      bridge.rightMass = right.reduce((sum, weight) => sum + weight.mass, 0);
      bridge.delta = bridge.leftMass - bridge.rightMass;
      const target = Number(bridge.targetDelta) || 0;
      const tolerance = Math.max(0, Number(bridge.tolerance) || 0.15);
      const loaded = bridge.leftMass + bridge.rightMass > 0;
      bridge.balanced = loaded && Math.abs(bridge.delta - target) <= tolerance;
      if (!platform) return;
      const oldY = platform.y;
      const minY = Number(bridge.minY) || platform.originY;
      const maxY = Number(bridge.maxY) || platform.originY;
      const span = Math.max(1, Math.abs(maxY - minY));
      const error = Math.abs(bridge.delta - target);
      const lift = loaded ? clamp(1 - error / 3, 0, 1) : 0;
      platform.y = bridge.balanced ? minY : maxY - span * lift * 0.72;
      platform.dy += platform.y - oldY;
    });
  }

  function growthFormConfig(form = runtime?.growthForm) {
    return runtime?.devices?.forms?.[form] || {};
  }

  function narrowBarrierRect(passage) {
    const width = Number(passage.barrierW) || 38;
    return {
      x: passage.x + passage.w / 2 - width / 2,
      y: passage.y,
      w: width,
      h: passage.h,
      type: "fiber-iris",
      narrowPassageId: passage.id,
    };
  }

  function setGrowthForm(form) {
    const next = String(form || "");
    if (!runtime || !player || !["small", "giant"].includes(next) || !runtime.devices?.forms?.[next]) return false;
    if (runtime.growthForm === next) return true;
    const config = growthFormConfig(next);
    const width = Math.max(20, Math.round((player.baseW || 38) * (Number(config.widthScale) || 1)));
    const height = Math.max(30, Math.round((player.baseH || 54) * (Number(config.heightScale) || 1)));
    const centerX = player.x + player.w / 2;
    const feetY = player.y + player.h;
    const target = { x: centerX - width / 2, y: feetY - height, w: width, h: height };
    const blockers = solids().filter((solid) => !solid.narrowPassageId);
    if (next !== "small") blockers.push(...runtime.narrowPassages.map(narrowBarrierRect));
    const blocked = blockers.some((solid) => overlap(target, solid));
    if (blocked) {
      toast("这里太窄，先移到露镜旁的开阔处再变大", 1.15);
      return false;
    }
    runtime.growthForm = next;
    runtime.growthTransition = Math.max(0.08, Number(runtime.devices.transitionFreeze) || 0.2);
    player.w = width;
    player.h = height;
    player.x = clamp(target.x, 0, currentLevel.worldWidth - width);
    player.y = target.y;
    player.vx *= next === "small" ? 1.08 : 0.72;
    burst(centerX, feetY - height * 0.5, next === "small" ? currentLevel.theme.accent2 : currentLevel.theme.edge, 18, 220);
    toast(next === "small" ? "露镜折光 · 小芽可以穿过纤维虹膜" : "露镜聚形 · 巨芽下砸可以击碎厚蜡壳", 1.35);
    playTone("switch");
    return true;
  }

  function breakWaxSealAt(x, y) {
    if (!runtime || runtime.growthForm !== "giant" || growthFormConfig("giant").canBreakWax === false) return false;
    const seal = runtime.waxSeals.find((entry) => !entry.broken
      && x >= entry.x - 28 && x <= entry.x + entry.w + 28
      && y >= entry.y - 28 && y <= entry.y + entry.h + 70);
    if (!seal) return false;
    seal.hp -= 1;
    if (seal.hp > 0) return true;
    seal.broken = true;
    shake = Math.max(shake, 10);
    burst(seal.x + seal.w / 2, seal.y + seal.h / 2, currentLevel.theme.accent, 26, 320);
    toast("巨芽下砸 · 厚蜡壳碎开了", 1.05);
    playTone("switch");
    return true;
  }

  function setRailJunction(id, option) {
    const junction = runtime?.railJunctions?.find((entry) => entry.id === String(id));
    if (!junction?.options?.length) return false;
    let selected = junction.options.find((entry) => entry.rail === option || entry.input === option);
    if (!selected && Number.isInteger(Number(option))) selected = junction.options[mod(Number(option), junction.options.length)];
    if (!selected && (option === undefined || option === null || option === "")) {
      const current = Math.max(0, junction.options.findIndex((entry) => entry.rail === junction.selectedRail));
      selected = junction.options[(current + 1) % junction.options.length];
    }
    if (!selected || !runtime.rails.some((rail) => rail.id === selected.rail)) return false;
    junction.selectedRail = selected.rail;
    junction.cooldown = 0.2;
    toast(`岔轨已拨向${selected.input === "down" ? "下行" : selected.input === "up" ? "上行" : "前行"}彗线`, 0.95);
    playTone("switch");
    burst(junction.x + junction.w / 2, junction.y + junction.h / 2, currentLevel.theme.accent2, 14, 190);
    return true;
  }

  function visitRailStation(id) {
    const station = runtime?.railStations?.find((entry) => entry.id === String(id));
    if (!station || runtime.visitedRailStations.has(station.id)) return false;
    station.visited = true;
    runtime.visitedRailStations.add(station.id);
    toast(`${station.label || `星站 ${station.index + 1}`}已停靠 · ${runtime.visitedRailStations.size}/${runtime.railStations.filter((entry) => entry.required !== false).length}`, 1.15);
    playTone("switch");
    burst(station.x + station.w / 2, station.y + station.h / 2, currentLevel.theme.edge, 20, 230);
    return true;
  }

  function updateRailCarts(dt) {
    if (!runtime.railCarts.length) return;
    const railById = new Map(runtime.rails.map((rail) => [rail.id, rail]));
    runtime.railCarts.forEach((cart) => {
      let rail = railById.get(cart.railId);
      const platform = runtime.platforms.find((entry) => entry.id === cart.platformId);
      if (!rail || !platform) return;
      let nextDistance = cart.distance + cart.direction * cart.speed * dt;
      let guard = 0;
      while ((nextDistance < 0 || nextDistance > rail.totalLength) && guard < 4) {
        guard += 1;
        if (nextDistance > rail.totalLength) {
          const overflow = nextDistance - rail.totalLength;
          const junction = runtime.railJunctions.find((entry) => entry.incoming === rail.id);
          const selectedId = junction?.selectedRail && rail.next.includes(junction.selectedRail)
            ? junction.selectedRail
            : rail.next[0];
          const selected = railById.get(selectedId);
          if (selected) {
            cart.history.push(rail.id);
            rail = selected;
            cart.railId = rail.id;
            nextDistance = overflow;
          } else {
            cart.direction = -1;
            nextDistance = rail.totalLength - overflow;
          }
        } else {
          const underflow = -nextDistance;
          const previous = railById.get(cart.history.pop());
          if (previous) {
            rail = previous;
            cart.railId = rail.id;
            nextDistance = rail.totalLength - underflow;
          } else {
            cart.direction = 1;
            nextDistance = underflow;
          }
        }
      }
      cart.distance = clamp(nextDistance, 0, rail.totalLength);
      const sample = sampleRail(rail, cart.distance);
      const oldX = platform.x;
      const oldY = platform.y;
      platform.x = sample.x - cart.w / 2;
      platform.y = sample.y;
      platform.dx = platform.x - oldX;
      platform.dy = platform.y - oldY;
      cart.x = platform.x;
      cart.y = platform.y;
      cart.tx = sample.tx * cart.direction;
      cart.ty = sample.ty * cart.direction;
    });
  }

  function updateRailStationVisits() {
    if (!runtime?.railStations?.length || !player) return;
    runtime.railStations.forEach((station) => {
      if (station.visited) return;
      const standingCart = player.ground?.railCartId
        ? runtime.railCarts.find((cart) => cart.id === player.ground.railCartId)
        : null;
      const cartPlatform = standingCart
        ? runtime.platforms.find((platform) => platform.id === standingCart.platformId)
        : null;
      if (overlap(player, station) || (cartPlatform && overlap(cartPlatform, station))) visitRailStation(station.id);
    });
  }

  function moveShadowScreen(id, direction = 1) {
    const screen = runtime?.shadowScreens?.find((entry) => entry.id === String(id));
    if (!screen) return false;
    const sign = Math.sign(Number(direction) || 1);
    const axis = screen.axis === "y" ? "y" : "x";
    const min = Number(screen.min);
    const max = Number(screen.max);
    const before = screen[axis];
    screen[axis] = clamp(before + sign * (Number(screen.step) || 120), Number.isFinite(min) ? min : before - 120, Number.isFinite(max) ? max : before + 120);
    if (screen[axis] === before) return false;
    toast("纸屏沿灯轨移开 · 新的影区出现了", 0.95);
    playTone("switch");
    burst(screen.x + screen.w / 2, screen.y + screen.h / 2, currentLevel.theme.accent2, 12, 170);
    return true;
  }

  function setShadowExposure(value) {
    if (!runtime) return 0;
    const grace = Math.max(0.1, Number(runtime.devices.exposure?.grace) || 1.2);
    runtime.shadowExposure = clamp(Number(value) || 0, 0, grace);
    return runtime.shadowExposure;
  }

  function segmentIntersectsRect(ax, ay, bx, by, rect) {
    const dx = bx - ax;
    const dy = by - ay;
    let t0 = 0;
    let t1 = 1;
    const checks = [
      [-dx, ax - rect.x], [dx, rect.x + rect.w - ax],
      [-dy, ay - rect.y], [dy, rect.y + rect.h - ay],
    ];
    for (const [p, q] of checks) {
      if (p === 0) {
        if (q < 0) return false;
        continue;
      }
      const ratio = q / p;
      if (p < 0) t0 = Math.max(t0, ratio);
      else t1 = Math.min(t1, ratio);
      if (t0 > t1) return false;
    }
    return true;
  }

  function angleDifference(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
  }

  function lightReachesPoint(light, x, y) {
    const dx = x - light.pivotX;
    const dy = y - light.pivotY;
    if (Math.hypot(dx, dy) > light.radius) return false;
    if (Math.abs(angleDifference(Math.atan2(dy, dx), light.currentAngle)) > light.halfAngle) return false;
    return !runtime.shadowScreens.some((screen) => screen.occludes !== false
      && segmentIntersectsRect(light.pivotX, light.pivotY, x, y, screen));
  }

  function updateShadowExposure(dt) {
    if (!runtime.searchlights.length || !player) return;
    const config = runtime.devices.exposure || {};
    const px = player.x + player.w / 2;
    const py = player.y + player.h * 0.45;
    const litByTower = runtime.searchlights.some((light) => lightReachesPoint(light, px, py));
    const litByHeron = runtime.enemies.some((enemy) => enemy.alive && enemy.type === "lantern-heron" && enemy.state === "alert"
      && Math.hypot(px - (enemy.x + enemy.w / 2), py - (enemy.y + enemy.h / 2)) < 520
      && !runtime.shadowScreens.some((screen) => segmentIntersectsRect(enemy.x + enemy.w / 2, enemy.y + enemy.h * 0.35, px, py, screen)));
    runtime.shadowLit = litByTower || litByHeron;
    runtime.shadowDamageCooldown = Math.max(0, runtime.shadowDamageCooldown - dt);
    if (runtime.shadowLit) runtime.shadowExposure += dt;
    else runtime.shadowExposure = Math.max(0, runtime.shadowExposure - (Number(config.decayPerSecond) || 1.8) * dt);
    const grace = Math.max(0.2, Number(config.grace) || 1.2);
    if (runtime.shadowExposure >= grace && runtime.shadowDamageCooldown <= 0) {
      runtime.shadowExposure = 0;
      runtime.shadowDamageCooldown = Math.max(0.45, Number(config.damageInterval) || 1.1);
      hurtPlayer(px);
      toast("灯锥锁定了星芽 · 躲进纸屏投下的影子", 1.15);
    }
  }

  function scorewingRequiredShards(boss = runtime?.boss) {
    if (!boss) return 1;
    const phaseData = boss.phases?.[Math.max(0, Number(boss.phase) - 1)] || {};
    const configured = runtime.devices.shardRules?.requiredByPhase?.[Math.max(0, Number(boss.phase) - 1)];
    return Math.max(1, Number(phaseData.captureRequired || configured) || Number(boss.phase) || 1);
  }

  function captureCrownShard(shotId = null) {
    const boss = runtime?.boss;
    if (!boss || boss.archetype !== "scorewing-maestro" || boss.hp <= 0) return false;
    const required = scorewingRequiredShards(boss);
    const limit = Math.max(required, Number(runtime.devices.shardRules?.storeLimitByPhase?.[Math.max(0, boss.phase - 1)]) || required);
    if (runtime.capturedCrownShards >= limit) return false;
    let shot = null;
    if (shotId !== null && shotId !== undefined) shot = runtime.enemyShots.find((entry) => entry.id === String(shotId) && entry.catchable && entry.life > 0);
    else shot = runtime.enemyShots.find((entry) => entry.catchable && entry.life > 0) || null;
    if (shotId !== null && shotId !== undefined && !shot) return false;
    if (shot) shot.life = 0;
    runtime.capturedCrownShards += 1;
    burst(shot?.x ?? player.x + player.w / 2, shot?.y ?? player.y + player.h / 2, currentLevel.theme.edge, 14, 210);
    toast(`星片已收入芽芯 · ${runtime.capturedCrownShards}/${required}`, 0.9);
    playTone("switch");
    return true;
  }

  function captureNearbyCrownShards() {
    const radius = Math.max(36, Number(runtime?.devices?.shardRules?.captureRadius) || 54) + 72;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    let captured = false;
    runtime.enemyShots.filter((shot) => shot.catchable && shot.life > 0
      && Math.hypot(shot.x + shot.w / 2 - px, shot.y + shot.h / 2 - py) <= radius)
      .forEach((shot) => { captured = captureCrownShard(shot.id) || captured; });
    return captured;
  }

  function launchCrownVolley() {
    const boss = runtime?.boss;
    if (!boss?.active || boss.archetype !== "scorewing-maestro" || boss.hp <= 0) return false;
    const required = scorewingRequiredShards(boss);
    if (runtime.capturedCrownShards < required) return false;
    const volleyId = `crown-volley-${runtime.crownVolleySerial += 1}`;
    const originX = player.x + player.w / 2;
    const originY = player.y + player.h * 0.42;
    const targetX = boss.x + boss.w / 2;
    const targetY = boss.y + boss.h / 2;
    const baseAngle = Math.atan2(targetY - originY, targetX - originX);
    const speed = Math.max(620, Number(runtime.devices.shardRules?.volleySpeed) || 920);
    for (let index = 0; index < required; index += 1) {
      const offset = (index - (required - 1) / 2) * 0.09;
      runtime.projectiles.push({
        x: originX - 13,
        y: originY - 13,
        w: 26,
        h: 26,
        vx: Math.cos(baseAngle + offset) * speed,
        vy: Math.sin(baseAngle + offset) * speed,
        life: Math.max(1, Number(runtime.devices.shardRules?.volleyWindow) || 2.8),
        power: 1,
        crownVolley: true,
        volleyId,
      });
    }
    runtime.capturedCrownShards = 0;
    boss.state = "volley-guard";
    toast(`星冕齐射 ×${required} · 终曲反奏！`, 1.05);
    announce("捕获星片已经随冲刺齐射");
    playTone("boss");
    return true;
  }

  function seatWeight(weightId, slotId) {
    const weight = runtime?.weightBlocks?.find((entry) => entry.id === String(weightId));
    const slot = runtime?.weightSlots?.find((entry) => entry.id === String(slotId));
    if (!weight || !slot || String(weight.group) !== String(slot.group)) return false;
    const occupants = runtime.weightBlocks.filter((entry) => entry.id !== weight.id && entry.seatedSlotId === slot.id);
    if (occupants.length >= slot.capacity) return false;
    const previous = runtime.weightSlots.find((entry) => entry.id === weight.seatedSlotId);
    weight.seatedSlotId = slot.id;
    weight.vx = 0;
    if (previous && previous.id !== slot.id) layoutWeightSlot(previous);
    layoutWeightSlot(slot);
    updateScaleBridges();
    return true;
  }

  function ejectWeight(weight, direction = 1) {
    const slot = runtime.weightSlots.find((entry) => entry.id === weight.seatedSlotId);
    if (!slot) return false;
    weight.seatedSlotId = null;
    weight.x = clamp(weight.x + Math.sign(direction || 1) * (slot.w * 0.55 + 22), 0, currentLevel.worldWidth - weight.w);
    weight.vx = Math.sign(direction || 1) * 390;
    layoutWeightSlot(slot);
    updateScaleBridges();
    return true;
  }

  function seatWeightNear(weight) {
    if (!weight || weight.seatedSlotId) return false;
    const center = weight.x + weight.w / 2;
    const slots = runtime.weightSlots
      .filter((slot) => String(slot.group) === String(weight.group))
      .filter((slot) => runtime.weightBlocks.filter((entry) => entry.seatedSlotId === slot.id).length < slot.capacity)
      .sort((a, b) => Math.abs(a.x + a.w / 2 - center) - Math.abs(b.x + b.w / 2 - center));
    const slot = slots[0];
    if (!slot || Math.abs(slot.x + slot.w / 2 - center) > 230) return false;
    const seated = seatWeight(weight.id, slot.id);
    if (seated) {
      toast(`星砝 ${weight.mass} 已压入${slot.side === "left" ? "左" : "右"}槽`, 1.0);
      playTone("switch");
      burst(weight.x + weight.w / 2, weight.y + weight.h, currentLevel.theme.accent, 14, 190);
    }
    return seated;
  }

  function updateWeightBlocks(dt) {
    runtime.weightBlocks.forEach((weight) => {
      if (weight.seatedSlotId) return;
      weight.x = clamp(weight.x + weight.vx * dt, 0, currentLevel.worldWidth - weight.w);
      weight.vx = moveToward(weight.vx, 0, 780 * dt);
    });
  }

  function crossSeam(seamId) {
    const seam = runtime?.seams?.find((entry) => entry.id === String(seamId));
    if (!seam || seam.cooldown > 0 || String(seam.from) !== runtime.silhouetteLane) return false;
    runtime.silhouetteLane = String(seam.to || (runtime.silhouetteLane === "foreground" ? "background" : "foreground"));
    seam.crossed = true;
    seam.cooldown = 0.35;
    toast(`剪影换岸 · ${runtime.silhouetteLane === "foreground" ? "前景港" : "背景港"}`, 1.0);
    playTone("switch");
    burst(seam.x + seam.w / 2, player.y + player.h / 2, currentLevel.theme.accent2, 18, 220);
    return true;
  }

  function crossNearbySeam() {
    if (player.dashTime <= 0) return false;
    const seam = runtime.seams.find((entry) => entry.cooldown <= 0 && overlap(player, entry));
    return seam ? crossSeam(seam.id) : false;
  }

  function setTrajectory(points) {
    if (!runtime?.looms?.length || !Array.isArray(points) || points.length < 2) return false;
    const loom = runtime.looms.find((entry) => !entry.completed) || runtime.looms[0];
    const normalized = points.map((point) => ({ x: Number(point?.x), y: Number(point?.y) }));
    if (normalized.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return false;
    runtime.looms.forEach((entry) => { entry.active = entry.id === loom.id; });
    runtime.trajectory.activeLoomId = loom.id;
    runtime.trajectory.points = normalized;
    runtime.trajectory.recording = true;
    runtime.trajectory.sampleTimer = 0;
    return true;
  }

  function beginTrajectoryRecording(loom) {
    if (!loom) return false;
    runtime.looms.forEach((entry) => { entry.active = entry.id === loom.id; });
    runtime.trajectory.activeLoomId = loom.id;
    runtime.trajectory.points = [{ x: player.x + player.w / 2, y: player.y + player.h, time: runtime.time }];
    runtime.trajectory.recording = true;
    runtime.trajectory.sampleTimer = 0;
    toast(`${loom.index + 1} 号绣架开始记路 · 落地后再次发射脉冲`, 1.35);
    playTone("switch");
    return true;
  }

  function solidifyTrajectory() {
    const trajectory = runtime?.trajectory;
    const loom = runtime?.looms?.find((entry) => entry.id === trajectory?.activeLoomId);
    if (!trajectory?.recording || !loom || trajectory.points.length < 2) return false;
    const rules = trajectory.rules || {};
    const zone = loom.bridgeZone;
    const target = runtime.platforms.find((platform) => platform.id === loom.targetPlatform);
    if (zone && target) {
      const xs = trajectory.points.map((point) => Number(point.x));
      const horizontalSpan = Math.max(...xs) - Math.min(...xs);
      const entersGap = trajectory.points.some((point) => point.x >= zone.x && point.x <= zone.x + zone.w
        && point.y >= zone.y && point.y <= zone.y + zone.h);
      const approachDistance = Math.max(160, Number(zone.w) * 0.22);
      const loomCenter = loom.x + loom.w / 2;
      const targetCenter = target.x + target.w / 2;
      const reachesFarBank = targetCenter >= loomCenter
        ? Math.max(...xs) >= target.x - approachDistance
        : Math.min(...xs) <= target.x + target.w + approachDistance;
      const minimumSpan = Math.min(420, Math.max(260, Number(zone.w) * 0.52));
      if (!entersGap || !reachesFarBank || horizontalSpan < minimumSpan) {
        toast("芽纹还没跨过缺口 · 先跑出一条抵达对岸的路线", 1.15);
        return false;
      }
    }
    const length = Math.max(24, Number(rules.segmentLength) || 54);
    const thickness = Math.max(12, Number(rules.segmentThickness) || 18);
    const segments = [];
    for (let index = 1; index < trajectory.points.length; index += 1) {
      const start = trajectory.points[index - 1];
      const end = trajectory.points[index];
      const distance = Math.hypot(end.x - start.x, end.y - start.y);
      const steps = Math.max(1, Math.ceil(distance / length));
      for (let step = 0; step < steps; step += 1) {
        const from = step / steps;
        const to = (step + 1) / steps;
        const ax = start.x + (end.x - start.x) * from;
        const ay = start.y + (end.y - start.y) * from;
        const bx = start.x + (end.x - start.x) * to;
        const by = start.y + (end.y - start.y) * to;
        segments.push({
          x: Math.min(ax, bx) - thickness / 2,
          y: (ay + by) / 2 - thickness / 2,
          w: Math.max(thickness, Math.abs(bx - ax) + thickness),
          h: thickness,
          type: "stitch-bridge",
          loomId: loom.id,
        });
      }
    }
    if (!segments.length) return false;
    runtime.stitchBridges = runtime.stitchBridges.filter((bridge) => bridge.loomId !== loom.id);
    const maxActive = Math.max(1, Number(rules.maxActiveBridges) || 3);
    while (runtime.stitchBridges.length >= maxActive) runtime.stitchBridges.shift();
    const life = Math.max(1, Number(rules.lifetime) || 9);
    runtime.stitchBridges.push({
      id: `stitch-${loom.id}-${Math.round(runtime.time * 1000)}`,
      loomId: loom.id,
      life,
      maxLife: life,
      segments,
      points: trajectory.points.map((point) => ({ x: point.x, y: point.y })),
    });
    loom.completed = true;
    loom.active = false;
    trajectory.wovenRoutes.add(loom.id);
    trajectory.recording = false;
    trajectory.activeLoomId = null;
    toast(`芽纹纸桥已固化 · ${trajectory.wovenRoutes.size}/${runtime.looms.length}`, 1.25);
    playTone("switch");
    burst(segments[0].x, segments[0].y, currentLevel.theme.accent2, 18, 230);
    return true;
  }

  function updateTrajectoryRecording(dt) {
    const trajectory = runtime.trajectory;
    if (!trajectory.recording || !trajectory.activeLoomId) return;
    trajectory.sampleTimer -= dt;
    if (trajectory.sampleTimer > 0) return;
    trajectory.sampleTimer = Math.max(0.03, Number(trajectory.rules.sampleInterval) || 0.08);
    trajectory.points.push({ x: player.x + player.w / 2, y: player.y + player.h, time: runtime.time });
    const recordSeconds = Math.max(0.5, Number(trajectory.rules.recordSeconds) || 3.4);
    while (trajectory.points.length > 2 && runtime.time - Number(trajectory.points[0].time || runtime.time) > recordSeconds) trajectory.points.shift();
  }

  function pulseTrajectoryLoom(loom) {
    if (!loom) return false;
    if (runtime.trajectory.recording && runtime.trajectory.activeLoomId === loom.id) return solidifyTrajectory();
    return beginTrajectoryRecording(loom);
  }

  function updateDragonBodyRoute() {
    if (!runtime.dragonBodyPlatforms.length) return;
    const route = runtime.devices.dragonRoute || {};
    const centerX = Number(route.centerX) || 2240;
    const centerY = Number(route.centerY) || 360;
    const speeds = Array.isArray(route.phaseSpeedByCycle) ? route.phaseSpeedByCycle : [];
    const speed = Number(speeds[runtime.dragonCycle.index] || route.speed) || 0.34;
    const orbit = runtime.time * speed;
    const driftX = Math.sin(orbit) * (Number(route.radiusX) || 520) * 0.18;
    const driftY = Math.cos(orbit * 1.17) * (Number(route.radiusY) || 135) * 0.2;
    runtime.dragonBodyPlatforms.forEach((bodyPlatform) => {
      const platform = runtime.platforms.find((entry) => entry.id === bodyPlatform.platformId);
      if (!platform) return;
      const oldX = platform.x;
      const oldY = platform.y;
      const wave = Math.sin(runtime.time * (0.9 + speed) + Number(bodyPlatform.phase || 0)) * 22;
      platform.x = centerX + Number(bodyPlatform.offsetX || 0) + driftX;
      platform.y = centerY + Number(bodyPlatform.offsetY || 0) + driftY + wave;
      platform.dx += platform.x - oldX;
      platform.dy += platform.y - oldY;
    });
    runtime.dragonKnots.forEach((knot) => {
      const platform = runtime.platforms.find((entry) => entry.id === knot.platformId);
      if (!platform) return;
      knot.x = platform.x + Number(knot.offsetX || 0);
      knot.y = platform.y + Number(knot.offsetY || 0);
    });
  }

  function openDragonCore() {
    const boss = runtime?.boss;
    if (!boss || boss.archetype !== "sky-paper-dragon" || boss.hp <= 0) return false;
    const duration = Math.max(1, Number(runtime.devices.scaleFlip?.duration || boss.weakPoint?.exposedTime) || 4.5);
    runtime.dragonCycle.coreOpen = true;
    runtime.dragonCycle.exposures += 1;
    boss.vulnerable = duration;
    boss.exposureHits = 0;
    boss.state = "dragon-core-open";
    boss.timer = duration;
    shake = Math.max(shake, 13);
    toast("三处结鳞翻开 · 沿龙脊冲向头冠核心！", 1.7);
    announce("天穹纸龙头冠核心暴露");
    playTone("boss");
    return true;
  }

  function strikeDragonKnot(knotId) {
    const knot = runtime?.dragonKnots?.find((entry) => entry.id === String(knotId));
    if (!knot || knot.active || runtime.boss?.hp <= 0) return false;
    knot.active = true;
    burst(knot.x + knot.w / 2, knot.y + knot.h / 2, currentLevel.theme.accent2, 18, 230);
    playTone("switch");
    const active = runtime.dragonKnots.filter((entry) => entry.active).length;
    toast(`结鳞已翻开 · ${active}/${runtime.dragonKnots.length}`, 0.95);
    if (active >= runtime.dragonKnots.length) openDragonCore();
    return true;
  }

  function strikeDragonKnotAt(x, y) {
    const knot = runtime.dragonKnots.find((entry) => !entry.active
      && x >= entry.x - 18 && x <= entry.x + entry.w + 18
      && Math.abs(y - (entry.y + entry.h)) <= 95);
    return knot ? strikeDragonKnot(knot.id) : false;
  }

  function resetDragonKnots() {
    runtime.dragonKnots.forEach((knot) => { knot.active = false; });
    runtime.dragonCycle.coreOpen = false;
  }

  function updatePlatforms(dt) {
    runtime.platforms.forEach((platform) => {
      const oldX = platform.x;
      const oldY = platform.y;
      const motion = platform.motion;
      if (motion && !isTimeFrozenAt(platform.x + platform.w / 2, platform.y + platform.h / 2)) {
        if (motion.type === "orbit") {
          const centerX = Number(motion.centerX) || platform.originX;
          const centerY = Number(motion.centerY) || platform.originY;
          const speed = Number(motion.speed) || 0.8;
          const angle = runtime.time * speed + (Number(motion.phase) || platform.phase);
          platform.x = centerX + Math.cos(angle) * (Number(motion.radiusX) || 150) - platform.w / 2;
          platform.y = centerY + Math.sin(angle) * (Number(motion.radiusY) || 110) - platform.h / 2;
        } else {
        const axis = motion.axis || (motion.y ? "y" : "x");
        const distance = Number(motion.distance || motion.range || (axis === "x" ? motion.x : motion.y)) || 120;
        const speed = Number(motion.speed) || 1.2;
        const value = Math.sin(runtime.time * speed + platform.phase) * distance;
        if (axis === "x") platform.x = platform.originX + value;
        else platform.y = platform.originY + value;
        }
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
    updateWeightBlocks(dt);
    updateScaleBridges();
    updateDragonBodyRoute();
    // Rail carts are also collision platforms. Move them last so their dx/dy
    // carries a standing player during this same simulation step.
    updateRailCarts(dt);
  }

  function updateDevices(dt) {
    runtime.goalToastCooldown = Math.max(0, runtime.goalToastCooldown - dt);
    runtime.moduleState.echoPulse = Math.max(0, runtime.moduleState.echoPulse - dt);
    runtime.moduleState.windLift = Math.max(0, runtime.moduleState.windLift - dt);
    runtime.moduleState.rootShield = Math.max(0, runtime.moduleState.rootShield - dt);
    runtime.moduleState.rootShockwave = Math.max(0, runtime.moduleState.rootShockwave - dt);
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
    runtime.relays.forEach((relay) => {
      if (!relay.active) return;
      relay.timer = Math.max(0, relay.timer - dt);
      if (relay.timer <= 0) relay.active = false;
    });
    runtime.timeAnchors.forEach((anchor) => {
      if (!anchor.active) return;
      anchor.timer = Math.max(0, anchor.timer - dt);
      if (anchor.timer <= 0) anchor.active = false;
    });
    runtime.gravityAnchors.forEach((anchor) => {
      if (!anchor.active) return;
      anchor.timer = Math.max(0, anchor.timer - dt);
      if (anchor.timer <= 0) anchor.active = false;
    });
    Object.keys(runtime.foldGrace).forEach((group) => {
      runtime.foldGrace[group] = Math.max(0, runtime.foldGrace[group] - dt);
      if (runtime.foldGrace[group] <= 0) delete runtime.foldGrace[group];
    });
    runtime.kiteTether.timer = Math.max(0, runtime.kiteTether.timer - dt);
    if (runtime.kiteTether.timer <= 0) runtime.kiteTether.anchorId = null;
    runtime.foldTraps.forEach((trap) => {
      trap.timer = Math.max(0, trap.timer - dt);
      if (trap.timer <= 0) trap.armed = false;
    });
    runtime.seams.forEach((seam) => { seam.cooldown = Math.max(0, seam.cooldown - dt); });
    runtime.growthTransition = Math.max(0, runtime.growthTransition - dt);
    runtime.growthLenses.forEach((lens) => { lens.cooldown = Math.max(0, lens.cooldown - dt); });
    runtime.railJunctions.forEach((junction) => { junction.cooldown = Math.max(0, junction.cooldown - dt); });
    runtime.searchlights.forEach((light) => {
      const minimum = Number(light.angleMin) || 0;
      const maximum = Number(light.angleMax) || minimum;
      const period = Math.max(1, Number(light.sweepPeriod) || 7);
      const phase = Number(light.phase) || 0;
      const sweep = (Math.sin((runtime.time / period + phase) * Math.PI * 2) + 1) / 2;
      light.currentAngle = lerp(minimum, maximum, sweep);
    });
    runtime.stitchBridges.forEach((bridge) => { bridge.life = Math.max(0, bridge.life - dt); });
    runtime.stitchBridges = runtime.stitchBridges.filter((bridge) => bridge.life > 0);
    if (runtime.pageTurn?.active) {
      runtime.pageTurn.inkX -= (Number(runtime.pageTurn.inkSpeed) || 220) * dt;
    }
    if (runtime.polarity.grace > 0) {
      runtime.polarity.grace = Math.max(0, runtime.polarity.grace - dt);
      if (runtime.polarity.grace <= 0) runtime.polarity.previous = null;
    }
    runtime.objectives.forEach((objective) => {
      if (objective.type === "repair-zones") {
        const repaired = objective.zones.filter((zone) => zone.repaired).length;
        objective.completed = repaired >= objective.required && (!objective.submitAtGoal || objective.submitted);
      } else if (objective.type === "reflect-reactor") {
        const powered = objective.reactors.filter((reactor) => reactor.powered).length;
        objective.completed = powered >= objective.required;
      }
    });
    const water = runtime.devices.water;
    if (water) runtime.waterY = water.baseY + Math.sin(runtime.time * (water.speed || 0.7)) * (water.amplitude || 55);
    const lava = runtime.devices.lava;
    if (lava) {
      runtime.lavaY = Math.max(lava.minY || 500, runtime.lavaY - (lava.riseSpeed || 5.5) * dt);
    }
  }

  function isPlatformActive(platform) {
    if (platform.brokenTimer > 0) return false;
    if (!isLaneEntityActive(platform)) return false;
    if (platform.foldGroup) {
      const group = String(platform.foldGroup);
      const state = Number(runtime.foldStates[group]) || 0;
      const previous = Number(runtime.foldPrevious[group]) || 0;
      const expected = Number(platform.foldState) || 0;
      if (expected !== state && !(runtime.foldGrace[group] > 0 && expected === previous)) return false;
    }
    if (platform.pagePhase === "outbound" && runtime.pageTurn?.active) return false;
    if (platform.pagePhase === "return" && !runtime.pageTurn?.active) return false;
    if (platform.hidden && platform.enabledBy && !runtime.enabled[platform.enabledBy] && !effectActive("resonance-orb")) return false;
    if (platform.hidden && !platform.enabledBy && !(runtime.hiddenRevealed || effectActive("resonance-orb") || runtime.crystals.some((crystal) => crystal.active))) return false;
    if (platform.polarity) {
      if (platform.polarity === runtime.polarity.current) return true;
      return runtime.polarity.grace > 0 && platform.polarity === runtime.polarity.previous;
    }
    return true;
  }

  function activePlatforms() {
    return runtime.platforms.filter(isPlatformActive);
  }

  function isGateActive(gate) {
    if (gate.openByEcho) return !runtime.echoPairs[gate.openByEcho];
    if (gate.openBy) {
      const relay = runtime.relays.find((device) => device.id === gate.openBy);
      if (relay) return !relay.active;
      return !runtime.switches.find((device) => device.id === gate.openBy)?.active;
    }
    const index = Number(gate.switchIndex ?? gate.switch ?? gate.index);
    return !runtime.switches[index]?.active;
  }

  function solids() {
    return [
      ...runtime.weightBlocks,
      ...runtime.stitchBridges.flatMap((bridge) => bridge.segments),
      ...activePlatforms(),
      ...runtime.gates.filter(isGateActive).map((gate) => ({ ...gate, type: "gate" })),
      ...runtime.waxSeals.filter((seal) => !seal.broken),
      ...(runtime.growthForm === "small" ? [] : runtime.narrowPassages.map(narrowBarrierRect)),
      ...runtime.shadowScreens.map((screen) => ({ ...screen, type: "lantern-screen", shadowScreenId: screen.id })),
    ];
  }

  function playerGravityZone() {
    return (runtime.devices.gravityZones || []).find((zone) => overlap(player, {
      x: Number(zone.x) || 0,
      y: Number(zone.y) || 0,
      w: Number(zone.w) || 0,
      h: Number(zone.h) || 0,
    })) || null;
  }

  function updatePlayer(dt) {
    player.anim += dt;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.hurtTime = Math.max(0, player.hurtTime - dt);
    const trialDashBoost = runtime.trial?.upgrades.has("quick-dash") ? 2 : 1;
    player.dashCooldown = Math.max(0, player.dashCooldown - dt * (effectActive("wind-feather") ? 3.5 : trialDashBoost));
    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
    player.windDashJump = Math.max(0, player.windDashJump - dt);
    player.rootShield = Math.max(0, player.rootShield - dt);
    player.rootCooldown = Math.max(0, player.rootCooldown - dt);
    player.coyote = player.onGround ? 0.11 : Math.max(0, player.coyote - dt);
    if (input.pressed.has("jump")) player.jumpBuffer = 0.13;
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    const move = movementAxis();
    if (move) player.facing = move;
    player.inWater = Boolean(runtime.devices.water && player.y + player.h * 0.65 > runtime.waterY);

    const nearbyJunction = runtime.railJunctions.find((junction) => junction.cooldown <= 0
      && Math.abs(player.x + player.w / 2 - (junction.x + junction.w / 2)) <= junction.w / 2 + 90
      && Math.abs(player.y + player.h / 2 - (junction.y + junction.h / 2)) <= junction.h / 2 + 90);
    if (nearbyJunction) {
      if (input.pressed.has("jump")) setRailJunction(nearbyJunction.id, "up");
      else if (input.pressed.has("down")) setRailJunction(nearbyJunction.id, "down");
    }

    if (input.pressed.has("dash") && player.dashCooldown <= 0) {
      launchCrownVolley();
      player.dashTime = 0.15;
      player.dashCooldown = 0.8;
      player.vx = player.facing * 720;
      player.vy = 0;
      player.trailTimer = 0;
      runtime.lastPlayerDash = { direction: player.facing, time: runtime.time };
      const cutWebs = runtime.enemyWebs.filter((web) => web.life > 0 && Math.hypot(web.x + web.w / 2 - (player.x + player.w / 2), web.y + web.h / 2 - (player.y + player.h / 2)) < 165);
      cutWebs.forEach((web) => { web.life = 0; burst(web.x + web.w / 2, web.y + web.h / 2, currentLevel.theme.edge, 9, 150); });
      if (cutWebs.length) toast(`冲刺撕开星丝 ×${cutWebs.length}`, 0.8);
      if (save.heroModule === "wind") player.windDashJump = 0.58;
      playTone("dash");
      burst(player.x + player.w / 2, player.y + player.h / 2, currentLevel.theme.paper, 8, 190);
    }

    if (input.pressed.has("shoot") && player.shootCooldown <= 0) {
      const resonanceBoost = effectActive("resonance-orb");
      const starCharged = Number(runtime.charges["star-charge"]) > 0;
      if (save.heroModule === "echo") reflectEchoPulse();
      captureNearbyCrownShards();
      repairNearbyObjectiveZone();
      if (runtime.trajectory.recording) solidifyTrajectory();
      if (starCharged) runtime.charges["star-charge"] -= 1;
      player.shootCooldown = resonanceBoost || starCharged ? 0.2 : 0.28;
      const trialPulse = runtime.trial?.upgrades.has("pulse-bloom");
      runtime.projectiles.push({
        x: player.x + player.w / 2 + player.facing * 22,
        y: player.y + 18,
        w: starCharged ? 34 : resonanceBoost ? 28 : trialPulse ? 30 : 18,
        h: starCharged ? 34 : resonanceBoost ? 28 : trialPulse ? 30 : 18,
        vx: player.facing * (starCharged ? 680 : resonanceBoost ? 620 : 560),
        vy: 0,
        life: resonanceBoost ? 1.85 : 1.45,
        power: starCharged || trialPulse ? 2 : 1,
        starCharged,
      });
      if (starCharged) toast(`星能脉冲已装填 · 剩余 ${runtime.charges["star-charge"]}`, 0.9);
      playTone("shoot");
    }

    if (save.heroModule === "wind" && input.pressed.has("jump") && player.windDashJump > 0) {
      player.windDashJump = 0;
      player.jumpBuffer = 0;
      player.dashTime = 0;
      player.vx = player.facing * Math.max(650, Math.abs(player.vx));
      player.vy = -610;
      player.onGround = false;
      runtime.moduleState.windLift = 0.7;
      playTone("jump");
      toast("风行折跃 · 冲刺动量转化为跃升", 0.9);
      burst(player.x + player.w / 2, player.y + player.h, currentLevel.theme.edge, 12, 230);
    }

    if (save.heroModule === "root" && player.onGround && input.pressed.has("down") && player.rootCooldown <= 0) {
      player.rootShield = 0.82;
      player.rootShieldCharges = 1;
      player.rootCooldown = 4.8;
      runtime.moduleState.rootShield = 0.82;
      player.vx *= 0.25;
      playTone("switch");
      toast("根守屏障展开 · 可挡下一枚弹体", 1.05);
      burst(player.x + player.w / 2, player.y + player.h, "#7fa96b", 10, 120);
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
      const growthSpeed = Number(growthFormConfig().moveSpeedMultiplier) || 1;
      const acceleration = player.inWater ? (pearlBoost ? 980 : 780) : (player.onGround ? 2100 : 1250);
      const webbed = runtime.enemyWebs.some((web) => web.life > 0 && isLaneEntityActive(web) && overlap(player, web));
      const trialSpeed = runtime.trial ? trialModifier("playerSpeedMultiplier", 1) : 1;
      const target = move * (player.inWater ? (pearlBoost ? 300 : 245) : 350 * growthSpeed) * (webbed ? 0.42 : 1) * trialSpeed;
      const reversing = move !== 0 && player.vx !== 0 && Math.sign(player.vx) !== move;
      const directionPressed = move < 0 ? input.pressed.has("left") : move > 0 && input.pressed.has("right");
      const recoveringFromHit = player.invulnerable > 0 && player.hurtTime <= 0;
      const turnAcceleration = player.inWater ? 3200 : player.onGround ? 6400 : 3400;
      const braking = player.inWater ? 1450 : player.onGround ? 3600 : 980;
      if (reversing && (directionPressed || recoveringFromHit)) player.vx = 0;
      player.vx = move
        ? moveToward(
          player.vx,
          target,
          Math.max(recoveringFromHit ? HIT_RECOVERY_ACCELERATION : 0, reversing ? turnAcceleration : acceleration * (webbed ? 0.55 : 1)) * dt,
        )
        : moveToward(player.vx, 0, braking * dt);
      const gravityZone = playerGravityZone();
      let gravity = player.inWater ? (pearlBoost ? 300 : 420) : 1880 * (gravityZone ? clamp(Number(gravityZone.gravityScale) || 0.25, 0.08, 1) : 1);
      if (input.held.jump && player.vy < 0) gravity *= 0.58;
      if (!player.inWater && effectActive("parcel-wings") && input.held.jump && player.vy > 0) gravity *= 0.28;
      if (gravityZone && input.held.jump && !player.downstrike) player.vy -= (Number(gravityZone.liftOnHold) || 360) * dt;
      const maxFall = player.inWater ? (pearlBoost ? 250 : 330) : gravityZone ? 430 : effectActive("parcel-wings") && input.held.jump ? 360 : 980;
      player.vy = Math.min(maxFall, player.vy + gravity * dt);
      if (player.inWater && input.pressed.has("jump")) {
        player.vy = pearlBoost ? -430 : -340;
        player.jumpBuffer = 0;
        playTone("jump");
        burst(player.x + player.w / 2, player.y + player.h, currentLevel.theme.edge, 5, 90);
      }
    }

    if (player.jumpBuffer > 0 && player.coyote > 0 && player.dashTime <= 0) {
      player.vy = -670 * (Number(growthFormConfig().jumpMultiplier) || 1);
      player.jumpBuffer = 0;
      player.coyote = 0;
      player.onGround = false;
      playTone("jump");
      burst(player.x + player.w / 2, player.y + player.h, currentLevel.theme.paper, 5, 100);
    }

    applyWind(dt);
    applyKiteTether(dt);
    applyGravityTide(dt);
    movePlayerX(dt);
    crossNearbySeam();
    movePlayerY(dt);
    updateTrajectoryRecording(dt);
    handlePlayerWorld();
    updateRailStationVisits();
    updateShadowExposure(dt);
  }

  function applyGravityTide(dt) {
    const tide = runtime.devices.gravityTide;
    const boss = runtime.boss;
    if (!tide || boss?.archetype !== "star-whale" || !boss.active || boss.hp <= 0 || boss.vulnerable > 0) return;
    const period = Math.max(1.5, Number(tide.period) || 4.8);
    const wave = Math.sin(runtime.time * Math.PI * 2 / period);
    player.vx += wave * (Number(tide.horizontalForce) || 520) * dt;
    player.vy += Math.cos(runtime.time * Math.PI * 2 / period) * (Number(tide.verticalForce) || 170) * dt;
  }

  function applyKiteTether(dt) {
    if (!runtime.kiteTether.anchorId || runtime.kiteTether.timer <= 0) return;
    const anchor = runtime.kiteAnchors.find((entry) => entry.id === runtime.kiteTether.anchorId);
    if (!anchor) return;
    const dx = anchor.x + anchor.w / 2 - (player.x + player.w / 2);
    const dy = anchor.y + anchor.h * 0.34 - (player.y + player.h / 2);
    const distance = Math.max(1, Math.hypot(dx, dy));
    const pull = Number(anchor.pull) || 1450;
    const boost = input.held.jump ? 1.18 : 1;
    player.vx += dx / distance * pull * boost * dt;
    player.vy += dy / distance * pull * boost * dt;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > 820) {
      player.vx = player.vx / speed * 820;
      player.vy = player.vy / speed * 820;
    }
  }

  function updateEchoClone() {
    if (!runtime.echoPads.length) return;
    runtime.echoHistory.push({ time: runtime.time, x: player.x, y: player.y, w: player.w, h: player.h, facing: player.facing });
    const targetTime = runtime.time - runtime.echoDelay;
    while (runtime.echoHistory.length > 2 && runtime.echoHistory[1].time <= targetTime) runtime.echoHistory.shift();
    if (runtime.echoHistory[0]?.time <= targetTime) runtime.echoClone = { ...runtime.echoHistory[0] };
    const echo = runtime.echoClone;
    runtime.echoPads.forEach((pad) => {
      pad.playerOn = overlap(player, pad);
      pad.echoOn = Boolean(echo && overlap(echo, pad));
      pad.active = pad.playerOn || pad.echoOn;
    });
    const groups = [...new Set(runtime.echoPads.map((pad) => pad.group).filter(Boolean))];
    groups.forEach((group) => {
      if (runtime.echoPairs[group]) return;
      const pads = runtime.echoPads.filter((pad) => pad.group === group);
      const paired = pads.some((pad) => pad.playerOn) && pads.some((pad) => pad.echoOn)
        && pads.some((pad) => pad.playerOn && !pad.echoOn)
        && pads.some((pad) => pad.echoOn && !pad.playerOn);
      if (!paired) return;
      runtime.echoPairs[group] = true;
      toast(`双生镜印 ${String(group).toUpperCase()} 已封合 · 镜门开启`, 1.5);
      announce("本体与延迟纸影完成双生压板");
      playTone("switch");
      burst(pads[0].x + pads[0].w / 2, pads[0].y, currentLevel.theme.accent2, 18, 210);
    });
  }

  function reflectEchoPulse() {
    const centerX = player.x + player.w / 2;
    const centerY = player.y + player.h / 2;
    let reflected = 0;
    runtime.moduleState.echoPulse = 0.28;
    runtime.enemyShots.forEach((shot) => {
      if (shot.catchable || shot.life <= 0 || Math.hypot(shot.x - centerX, shot.y - centerY) > 190) return;
      shot.life = 0;
      runtime.projectiles.push({
        x: shot.x,
        y: shot.y,
        w: Math.max(18, Number(shot.w) || 16),
        h: Math.max(18, Number(shot.h) || 16),
        vx: player.facing * 650,
        vy: clamp(Number(shot.vy) * -0.25 || 0, -180, 180),
        life: 1.8,
        power: 1,
        reflected: true,
        enemyCollisionGrace: 0.08,
      });
      reflected += 1;
      burst(shot.x, shot.y, currentLevel.theme.accent2, 7, 160);
    });
    if (reflected > 0) {
      runtime.moduleState.echoReflections += reflected;
      toast(`回声弹反 ×${reflected} · 反射弹获得供能增幅`, 0.95);
      announce("回声芽芯完成弹反");
    }
  }

  function repairNearbyObjectiveZone() {
    const objective = objectiveByType("repair-zones");
    if (!objective) return false;
    const centerX = player.x + player.w / 2;
    const centerY = player.y + player.h / 2;
    const zone = objective.zones.find((entry) => !entry.repaired && Math.hypot(entry.x + entry.w / 2 - centerX, entry.y + entry.h / 2 - centerY) <= 145);
    if (!zone) return false;
    zone.repaired = true;
    const progress = objectiveProgress(objective);
    toast(`${zone.label || `修复点 ${zone.index + 1}`}已复苏 · ${progress.progress}/${progress.required}`, 1.35);
    announce("潮汐锚点修复完成");
    playTone("switch");
    burst(zone.x + zone.w / 2, zone.y + zone.h / 2, currentLevel.theme.accent2, 18, 250);
    return true;
  }

  function releaseRootShockwave(shot) {
    const x = player.x + player.w / 2;
    const y = player.y + player.h;
    player.rootShield = 0;
    player.rootShieldCharges = 0;
    shot.life = 0;
    runtime.rootWaves.push({ x, y, life: 0.42, maxLife: 0.42, radius: 18 });
    runtime.moduleState.rootShield = 0;
    runtime.moduleState.rootShockwave = 0.42;
    runtime.enemies.forEach((enemy) => {
      if (!enemy.alive || !isBossSpawnAvailable(enemy) || Math.hypot(enemy.x + enemy.w / 2 - x, enemy.y + enemy.h / 2 - y) > 180) return;
      enemy.hp -= 1;
      if (enemy.hp <= 0) enemy.alive = false;
    });
    shake = Math.max(shake, 7);
    burst(x, y, "#8fb477", 18, 260);
    playTone("switch");
    toast("根盾格挡 · 根脉震波释放", 1.0);
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
        if (player.downstrike && solid.waxSealId && breakWaxSealAt(player.x + player.w / 2, solid.y)) {
          player.vy = Math.max(260, player.vy);
          continue;
        }
        player.y = solid.y - player.h;
        const bounceY = Number(solid.bounceY) || 0;
        if (bounceY) {
          player.vy = bounceY < 0 ? bounceY : -bounceY;
          player.onGround = false;
          player.ground = null;
          player.coyote = 0;
          playTone("jump");
          burst(player.x + player.w / 2, solid.y, currentLevel.theme.edge, 9, 180);
        } else {
          player.vy = 0;
          player.onGround = true;
          player.ground = solid;
        }
        if (player.downstrike) {
          activateFoldTrapAt(player.x + player.w / 2, solid.y);
          strikeTrialAnchorAt(player.x + player.w / 2, solid.y);
          if (solid.weightBlock) seatWeightNear(solid);
          strikeDragonKnotAt(player.x + player.w / 2, solid.y);
        }
        player.downstrike = false;
        if (!bounceY && solid.conveyor) player.x += solid.conveyor * dt;
        if (!bounceY && solid.fragile && solid.breakTimer <= 0) solid.breakTimer = 0.55;
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

  function activateFoldTrapAt(x, y) {
    const trap = runtime.foldTraps.find((entry) => x >= entry.x && x <= entry.x + entry.w && Math.abs(y - (entry.y + entry.h)) <= 70);
    if (!trap || trap.armed) return;
    trap.armed = true;
    trap.timer = Math.max(0.8, Number(trap.armTime) || 1.7);
    const isTarget = runtime.boss?.targetTrapId === trap.id && ["fold-telegraph", "fold-dive"].includes(runtime.boss?.state);
    toast(isTarget ? `折痕 ${trap.index + 1} 已竖起 · 守住时机！` : `折痕 ${trap.index + 1} 已竖起 · 等待俯冲`, 1.2);
    playTone("switch");
    burst(trap.x + trap.w / 2, trap.y, currentLevel.theme.accent, 18, 240);
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
      if (item.type === "storm-cell") {
        const objective = objectiveByType("reflect-reactor");
        const reactor = objective?.reactors
          .filter((entry) => !entry.powered)
          .sort((a, b) => Math.abs(a.x - item.x) - Math.abs(b.x - item.x))[0];
        if (reactor) {
          reactor.charge = Math.min(reactor.requiredCharge, reactor.charge + 2);
          reactor.powered = reactor.charge >= reactor.requiredCharge;
          toast(`暖光电池接入反应炉 · ${reactor.charge}/${reactor.requiredCharge}`, 1.55);
        } else toast(`${effect.label}已取得 · 所有反应炉已经饱和`, 1.45);
      } else toast(`${effect.label}已取得 · ${effect.description}`, 1.7);
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
    } else if (effect.mode === "page-turn") {
      runtime.inventory.add(item.type);
      if (runtime.pageTurn) {
        runtime.pageTurn.active = true;
        runtime.pageTurn.inkX = currentLevel.worldWidth + (Number(runtime.pageTurn.startOffset) || 180);
      }
      player.facing = -1;
      toast("书页翻转 · 出口已回到起点，快跑！", 2.1);
      announce("返航星种苏醒，路线方向已经反转");
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
      if (!isLaneEntityActive(hazard)) return;
      if (isTimeFrozenAt(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2)) return;
      if (overlap(body, hazard)) hurtPlayer(hazard.x + hazard.w / 2);
    });
    runtime.enemyShots.forEach((shot) => {
      if (!isLaneEntityActive(shot)) return;
      if (shot.life > 0 && overlap(body, shot)) {
        if (save.heroModule === "root" && player.rootShield > 0 && player.rootShieldCharges > 0) releaseRootShockwave(shot);
        else {
          shot.life = 0;
          hurtPlayer(shot.x);
          if (shot.drain) {
            player.dashCooldown = Math.max(player.dashCooldown, 0.8);
            if (runtime.trial) runtime.trial.routeTimer = Math.max(0, runtime.trial.routeTimer - 2.2);
            toast(runtime.trial ? "星噬萤抽走了星轨时间" : "星能被抽走 · 冲刺需要重新充能", 1.05);
          }
        }
      }
    });
    runtime.shockwaves.forEach((wave) => {
      if (wave.life > 0 && isLaneEntityActive(wave) && overlap(body, wave)) hurtPlayer(wave.x);
    });

    runtime.collectibles.forEach((item) => {
      if (!item.collected && isLaneEntityActive(item) && isBossSpawnAvailable(item) && overlap(body, item)) collectItem(item);
    });

    runtime.checkpoints.forEach((point) => {
      const proximity = point.activation === "proximity"
        && Math.hypot(
          player.x + player.w / 2 - (point.x + point.w / 2),
          player.y + player.h / 2 - (point.y + point.h / 2),
        ) <= point.radius;
      const forward = point.activation !== "proximity" && !point.reached && player.x + player.w > point.x;
      if (!point.active && (proximity || forward)) {
        runtime.checkpoints.forEach((other) => { other.active = false; });
        point.reached = true;
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
    if (runtime.pageTurn?.active && player.x + player.w >= runtime.pageTurn.inkX) {
      player.health = Math.max(1, player.health - 1);
      flash = 0.65;
      shake = 14;
      respawnPlayer();
      toast("墨潮卷走了这一页 · 从最近标记重新返航", 1.7);
    }
    if (runtime.devices.water && player.y > VIEW_H + 220) respawnPlayer();
    if (player.y > Math.max(VIEW_H + 240, currentLevel.worldHeight + 200)) respawnPlayer();
    if (runtime.devices.autoScroll && player.x + player.w < autoCameraX + 14) respawnPlayer();

    if (!currentLevel.isBoss && overlap(body, currentLevel.goal)) {
      const requirement = currentLevel.goal?.requires;
      if (requirement?.type === "repair-zones") {
        const objective = objectiveByType("repair-zones");
        if (objective && objective.zones.filter((zone) => zone.repaired).length >= objective.required) {
          objective.submitted = true;
          objective.completed = true;
        }
      }
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
    if (requirement && typeof requirement === "object") {
      if (requirement.type === "collect") {
        const progress = collectRequirementProgress(requirement);
        return progress.count >= progress.required;
      }
      if (requirement.type === "repair-zones") return Boolean(objectiveByType("repair-zones")?.completed);
      if (requirement.type === "reflect-reactor") return Boolean(objectiveByType("reflect-reactor")?.completed);
      if (requirement.type === "echo-pairs") return Object.keys(runtime.echoPairs).filter((group) => runtime.echoPairs[group]).length >= Math.max(1, Number(requirement.count) || 1);
      if (requirement.type === "fold-pattern") {
        const required = Math.max(1, Number(requirement.count) || runtime.foldPanels.length);
        return runtime.foldPanels.filter((panel) => runtime.foldStates[panel.group] === Number(panel.targetState)).length >= required;
      }
      if (requirement.type === "kite-chain") return runtime.kiteVisited.size >= Math.max(1, Number(requirement.count) || 1);
      if (requirement.type === "return-seed") return Boolean(runtime.pageTurn?.active && runtime.inventory.has("return-seed"));
      if (requirement.type === "balanced-bridges") return runtime.scaleBridges.filter((bridge) => bridge.balanced).length >= Math.max(1, Number(requirement.count) || 1);
      if (requirement.type === "woven-routes") return runtime.trajectory.wovenRoutes.size >= Math.max(1, Number(requirement.count) || 1);
      if (requirement.type === "rail-stations") return runtime.visitedRailStations.size >= Math.max(1, Number(requirement.count) || 1);
      return false;
    }
    if (requirement === "crystal-crown") return runtime.inventory.has("crystal-crown");
    if (requirement === "all-gear-doors") return runtime.switches.length === 0 || runtime.switches.every((device) => device.active);
    if (requirement === "three-tide-runes") return runtime.collectibles.filter((item) => item.collected && item.type === "tide-rune").length >= 3;
    if (requirement === "forge-seal") return runtime.inventory.has("forge-seal");
    if (requirement === "boss-defeated") return Boolean(runtime.boss && runtime.boss.hp <= 0);
    return false;
  }

  function collectRequirementProgress(requirement) {
    const itemType = String(requirement?.itemType || requirement?.item || "");
    const required = Math.max(1, Number(requirement?.count) || 1);
    const count = runtime.collectibles.filter((item) => item.collected && item.type === itemType).length;
    return { itemType, required, count };
  }

  function objectiveByType(type) {
    return runtime?.objectives?.find((objective) => objective.type === type) || null;
  }

  function objectiveProgress(objective) {
    if (!objective) return { required: 0, progress: 0 };
    if (objective.type === "repair-zones") {
      return { required: objective.required, progress: objective.zones.filter((zone) => zone.repaired).length };
    }
    if (objective.type === "reflect-reactor") {
      return { required: objective.required, progress: objective.reactors.filter((reactor) => reactor.powered).length };
    }
    return { required: objective.required, progress: objective.completed ? objective.required : 0 };
  }

  function goalRequirementHint() {
    const requirement = currentLevel.goal?.requires;
    if (requirement && typeof requirement === "object") {
      if (requirement.type === "collect") {
        const progress = collectRequirementProgress(requirement);
        return `${requirement.label || COLLECTIBLE_EFFECTS[progress.itemType]?.label || "任务物"}尚未集齐 · ${progress.count}/${progress.required}`;
      }
      if (requirement.type === "repair-zones") {
        const objective = objectiveByType("repair-zones");
        const progress = objectiveProgress(objective);
        return progress.progress >= progress.required
          ? "修复已达标 · 返回中央圣所提交"
          : `${requirement.label || "修复点"} ${progress.progress}/${progress.required} · 击打锚点完成修复`;
      }
      if (requirement.type === "reflect-reactor") {
        const objective = objectiveByType("reflect-reactor");
        const progress = objectiveProgress(objective);
        return `${requirement.label || "反应炉"} ${progress.progress}/${progress.required} · 普通脉冲可慢充，回声弹反充能更快`;
      }
      if (requirement.type === "echo-pairs") {
        const required = Math.max(1, Number(requirement.count) || 1);
        const complete = Object.keys(runtime.echoPairs).filter((group) => runtime.echoPairs[group]).length;
        return `${requirement.label || "双生镜印"} ${complete}/${required} · 让本体与延迟纸影分别站上同组压板`;
      }
      if (requirement.type === "fold-pattern") {
        const required = Math.max(1, Number(requirement.count) || runtime.foldPanels.length);
        const matched = runtime.foldPanels.filter((panel) => runtime.foldStates[panel.group] === Number(panel.targetState)).length;
        return `${requirement.label || "稳定折面"} ${matched}/${required} · 用脉冲把珊瑚折痕翻到发光面`;
      }
      if (requirement.type === "kite-chain") {
        const required = Math.max(1, Number(requirement.count) || 1);
        return `${requirement.label || "风筝锚"} ${runtime.kiteVisited.size}/${required} · 脉冲连接空中风筝`;
      }
      if (requirement.type === "return-seed") return runtime.pageTurn?.active
        ? "返航星种已苏醒 · 出口在书页起点"
        : "先前往书页最右端唤醒返航星种";
      if (requirement.type === "balanced-bridges") {
        const complete = runtime.scaleBridges.filter((bridge) => bridge.balanced).length;
        return `${requirement.label || "衡星桥"} ${complete}/${Math.max(1, Number(requirement.count) || 1)} · 下砸入槽，脉冲推出重排`;
      }
      if (requirement.type === "woven-routes") {
        return `${requirement.label || "芽纹纸桥"} ${runtime.trajectory.wovenRoutes.size}/${Math.max(1, Number(requirement.count) || 1)} · 点亮绣架后记录并固化轨迹`;
      }
      if (requirement.type === "rail-stations") {
        return `${requirement.label || "彗线星站"} ${runtime.visitedRailStations.size}/${Math.max(1, Number(requirement.count) || 1)} · 搭轨车停靠三座星站`;
      }
      return "未知的出口条件 · 航线保持封闭";
    }
    if (requirement === "crystal-crown") return "出口还在沉睡 · 找到晶洞深处的回声晶冠";
    if (requirement === "all-gear-doors") return "温室主轴尚未同步 · 还有齿轮开关未咬合";
    if (requirement === "three-tide-runes") return "潮门需要三枚符文同时共鸣";
    if (requirement === "forge-seal") return "熔炉出口需要锻炉印记";
    return "出口条件尚未满足";
  }

  function hurtPlayer(sourceX, severe = false) {
    if (player.invulnerable > 0 || player.dashTime > 0 || scene !== "playing") return;
    if (runtime.trajectory.recording && runtime.trajectory.rules.cancelOnDamage !== false) {
      runtime.trajectory.recording = false;
      runtime.trajectory.activeLoomId = null;
      runtime.trajectory.points = [];
      runtime.looms.forEach((loom) => { loom.active = false; });
      toast("受击打断了芽纹记录", 0.95);
    }
    player.health -= severe ? 2 : 1;
    player.invulnerable = HIT_INVULNERABLE_TIME;
    player.hurtTime = HIT_REACTION_TIME;
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
    if (runtime.trial) {
      runtime.trial.knockouts += 1;
      runtime.trial.combo = 0;
      runtime.trial.comboTimer = 0;
      runtime.trial.score = Math.max(0, runtime.trial.score - 150);
    } else {
      save.deaths += 1;
      persist();
    }
    player.health = player.maxHealth;
    player.x = player.respawnX;
    player.y = player.respawnY;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 1.2;
    player.hurtTime = 0;
    runtime.enemyShots.length = 0;
    runtime.shockwaves.length = 0;
    runtime.enemyWebs.length = 0;
    runtime.valves.forEach((valve) => { valve.active = false; valve.timer = 0; });
    runtime.mirrors.forEach((mirror) => { mirror.active = false; mirror.timer = 0; });
    runtime.relays.forEach((relay) => { relay.active = false; relay.timer = 0; });
    runtime.kiteTether.anchorId = null;
    runtime.kiteTether.timer = 0;
    runtime.shadowExposure = 0;
    runtime.shadowLit = false;
    runtime.capturedCrownShards = 0;
    runtime.foldTraps.forEach((trap) => { trap.armed = false; trap.timer = 0; });
    if (runtime.pageTurn?.active) {
      runtime.pageTurn.inkX = currentLevel.worldWidth + (Number(runtime.pageTurn.resetOffset) || 220);
    }
    if (runtime.boss) {
      runtime.boss.vulnerable = 0;
      runtime.boss.state = "watching";
      runtime.boss.timer = 1.2;
      runtime.boss.lastVolleyHitId = null;
    }
    const safeCamera = clamp(player.respawnX - 180, 0, Math.max(0, currentLevel.worldWidth - VIEW_W));
    cameraX = safeCamera;
    autoCameraX = safeCamera;
    toast(runtime.trial ? "星芽重新聚合 · 连击中断，守夜仍在继续" : "星芽在最近的标记处重新聚合", 1.55);
  }

  function enemyFacing(enemy) {
    const direction = Number(enemy.vx) || Number(enemy.patrolVx) || 1;
    return direction < 0 ? -1 : 1;
  }

  function playerIsBehind(enemy) {
    const side = player.x + player.w / 2 < enemy.x + enemy.w / 2 ? -1 : 1;
    return side !== enemyFacing(enemy);
  }

  function movePatrolEnemy(enemy, dt, speedScale = 1) {
    if (!Number.isFinite(enemy.vx) || Math.abs(enemy.vx) < 1) enemy.vx = enemy.patrolVx || 64;
    enemy.x += enemy.vx * dt * speedScale;
    if (Math.abs(enemy.x - enemy.originX) > enemy.range) {
      enemy.x = clamp(enemy.x, enemy.originX - enemy.range, enemy.originX + enemy.range);
      enemy.vx *= -1;
      enemy.patrolVx = enemy.vx;
    }
  }

  function trialEnemyTarget(enemy) {
    if (!enemy.trialEnemy || !runtime.trial) return null;
    const anchor = enemy.trialRole === "jammer" ? trialAnchor(runtime.trial, enemy.trialTargetId) : null;
    const escort = runtime.trial.phaseTask === "escort" && runtime.trial.escort.active ? runtime.trial.escort : null;
    const target = anchor || escort || runtime.trial.core;
    return {
      x: target.x + target.w / 2,
      y: target.y + target.h * 0.55,
    };
  }

  function moveTrialEnemy(enemy, dt) {
    const target = trialEnemyTarget(enemy);
    if (!target) return;
    const direction = target.x < enemy.x + enemy.w / 2 ? -1 : 1;
    enemy.vx = direction * enemy.trialSpeed;
    enemy.patrolVx = enemy.vx;
    enemy.x += enemy.vx * dt;
    if (isFlyingEnemy(enemy.type)) {
      const vertical = clamp(target.y - (enemy.y + enemy.h / 2), -95, 95);
      enemy.y += vertical * dt + Math.sin(enemy.t * 4.1) * 24 * dt;
    }
  }

  function emitThunderWave(enemy) {
    const y = enemy.y + enemy.h - 12;
    runtime.shockwaves.push(
      { x: enemy.x - 20, y, w: 52, h: 20, vx: -320, life: 1.9, lane: enemy.lane },
      { x: enemy.x + enemy.w - 32, y, w: 52, h: 20, vx: 320, life: 1.9, lane: enemy.lane },
    );
    shake = Math.max(shake, 7);
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, currentLevel.theme.accent, 12, 210);
    playTone("switch");
  }

  function updateThunderDrummer(enemy, dt) {
    if (enemy.state === "drum-telegraph") {
      enemy.vx = 0;
      if (enemy.stateTimer <= 0) {
        emitThunderWave(enemy);
        enemy.state = "drum-recover";
        enemy.stateTimer = 0.7;
      }
      return;
    }
    if (enemy.state === "drum-recover") {
      enemy.vx = 0;
      if (enemy.stateTimer <= 0) {
        enemy.state = "patrol";
        enemy.cooldown = 2.6;
        enemy.vx = enemy.patrolVx || 58;
      }
      return;
    }
    if (enemy.cooldown <= 0 && Math.abs(player.x - enemy.x) < 520) {
      enemy.state = "drum-telegraph";
      enemy.stateTimer = 0.72;
      enemy.vx = 0;
      return;
    }
    if (enemy.trialEnemy) moveTrialEnemy(enemy, dt * 0.76);
    else movePatrolEnemy(enemy, dt, 0.78);
  }

  function updateThreadSpinner(enemy, dt) {
    if (enemy.trialEnemy) moveTrialEnemy(enemy, dt * 0.82);
    else movePatrolEnemy(enemy, dt, 0.86);
    if (enemy.cooldown > 0 || Math.abs(player.x - enemy.x) > 620) return;
    runtime.enemyWebs.push({
      id: `web-${enemy.id}-${Math.round(runtime.time * 100)}`,
      x: clamp(player.x - 44, 0, currentLevel.worldWidth - 136),
      y: player.y + player.h - 18,
      w: 136,
      h: 40,
      life: 5.4,
      maxLife: 5.4,
      lane: enemy.lane,
    });
    enemy.cooldown = 3.35;
    toast("织线蛛铺下星丝 · 冲刺可以撕开", 1.05);
  }

  function updateChronoLeech(enemy, dt) {
    if (enemy.rewindTimer <= 0) {
      enemy.rewindX = enemy.x;
      enemy.rewindY = enemy.y;
      enemy.rewindTimer = 1.15;
    }
    if (enemy.state === "rewind") {
      enemy.vx = 0;
      if (enemy.stateTimer <= 0) {
        enemy.state = "patrol";
        enemy.vx = enemy.patrolVx || 68;
      }
      return;
    }
    if (enemy.trialEnemy) moveTrialEnemy(enemy, dt);
    else movePatrolEnemy(enemy, dt, 1.05);
  }

  function updateMirrorMimic(enemy, dt) {
    if (enemy.state === "mimic-telegraph") {
      enemy.vx = 0;
      if (enemy.stateTimer <= 0) {
        enemy.state = "mimic-dash";
        enemy.stateTimer = 0.42;
        enemy.vx = (enemy.mimicDirection || 1) * 430;
      }
      return;
    }
    if (enemy.state === "mimic-dash") {
      enemy.x += enemy.vx * dt;
      if (enemy.stateTimer <= 0) {
        enemy.state = "mimic-recover";
        enemy.stateTimer = 0.65;
        enemy.vx *= 0.12;
      }
      return;
    }
    if (enemy.state === "mimic-recover") {
      if (enemy.stateTimer <= 0) {
        enemy.state = "patrol";
        enemy.cooldown = 2.2;
        enemy.vx = enemy.patrolVx || 64;
      }
      return;
    }
    const recentDash = runtime.lastPlayerDash && runtime.time - runtime.lastPlayerDash.time < 4;
    if (recentDash && enemy.cooldown <= 0 && Math.abs(player.x - enemy.x) < 660) {
      enemy.state = "mimic-telegraph";
      enemy.stateTimer = 0.58;
      enemy.mimicDirection = runtime.lastPlayerDash.direction || player.facing || 1;
      enemy.vx = 0;
      toast("镜像芽记住了刚才的冲刺方向", 0.9);
      return;
    }
    if (enemy.trialEnemy) moveTrialEnemy(enemy, dt * 0.9);
    else movePatrolEnemy(enemy, dt, 0.92);
  }

  function updateStarSiphon(enemy, dt) {
    if (enemy.trialEnemy) {
      moveTrialEnemy(enemy, dt * 1.12);
      return;
    }
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h * 0.45;
    const dx = targetX - (enemy.x + enemy.w / 2);
    const dy = targetY - (enemy.y + enemy.h / 2);
    enemy.vx = clamp(dx, -120, 120);
    enemy.patrolVx = enemy.vx || enemy.patrolVx;
    enemy.x += enemy.vx * dt;
    enemy.y += clamp(dy, -80, 80) * dt + Math.sin(enemy.t * 4.6) * 18 * dt;
    if (enemy.cooldown <= 0 && Math.abs(dx) < 560) {
      const length = Math.hypot(dx, dy) || 1;
      runtime.enemyShots.push({
        x: enemy.x + enemy.w / 2,
        y: enemy.y + enemy.h / 2,
        w: 18,
        h: 18,
        vx: dx / length * 245,
        vy: dy / length * 245,
        life: 3.2,
        drain: true,
        lane: enemy.lane,
      });
      enemy.cooldown = 2.45;
    }
  }

  function updateLensBeetle(enemy, dt) {
    const smallWorld = runtime.growthForm === "small";
    const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
    enemy.state = smallWorld ? "small" : "armored";
    if (smallWorld && Math.abs(dx) < 330) {
      const direction = Math.sign(dx) || enemyFacing(enemy);
      enemy.vx = direction * Math.max(105, Math.abs(enemy.patrolVx || 70) * 1.75);
      enemy.x += enemy.vx * dt;
    } else {
      movePatrolEnemy(enemy, dt, smallWorld ? 1.35 : 0.72);
    }
  }

  function updateRailWisp(enemy, dt) {
    if (enemy.state === "rail-telegraph") {
      enemy.vx = 0;
      if (enemy.stateTimer <= 0) {
        const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
        const dy = player.y + player.h / 2 - (enemy.y + enemy.h / 2);
        const length = Math.hypot(dx, dy) || 1;
        enemy.vx = dx / length * 520;
        enemy.vy = dy / length * 520;
        enemy.state = "rail-charge";
        enemy.stateTimer = 0.66;
        playTone("dash");
      }
      return;
    }
    if (enemy.state === "rail-charge") {
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      if (enemy.stateTimer <= 0) {
        enemy.state = "rail-recover";
        enemy.stateTimer = 0.52;
        enemy.vx *= 0.12;
        enemy.vy *= 0.12;
      }
      return;
    }
    if (enemy.state === "rail-recover") {
      if (enemy.stateTimer <= 0) {
        enemy.state = "patrol";
        enemy.cooldown = 1.75;
        enemy.vx = enemy.patrolVx || 92;
      }
      return;
    }
    enemy.x += enemy.vx * dt;
    enemy.y = enemy.baseY + Math.sin(enemy.t * 3.7) * (Number(enemy.yBob) || 48);
    if (Math.abs(enemy.x - enemy.originX) > enemy.range) enemy.vx *= -1;
    if (enemy.cooldown <= 0 && Math.abs(player.x - enemy.x) < 620) {
      enemy.state = "rail-telegraph";
      enemy.stateTimer = 0.54;
      enemy.vx = 0;
      toast("彗轨游灵正在锁定一条直线 · 跳离轨车或反向换轨", 0.9);
    }
  }

  function updateLanternHeron(enemy, dt) {
    const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
    const dy = player.y + player.h / 2 - (enemy.y + enemy.h / 2);
    const distance = Math.hypot(dx, dy);
    if (enemy.state === "alert") {
      enemy.stateTimer = Math.max(enemy.stateTimer, distance < 580 ? 0.3 : 0);
      enemy.vx = Math.sign(dx || 1) * Math.min(118, Math.abs(dx) * 0.34);
      enemy.x += enemy.vx * dt;
      enemy.y += clamp(dy, -72, 72) * dt + Math.sin(enemy.t * 5.2) * 16 * dt;
      if (enemy.cooldown <= 0) {
        const length = distance || 1;
        runtime.enemyShots.push({
          x: enemy.x + enemy.w / 2,
          y: enemy.y + enemy.h * 0.44,
          w: 19,
          h: 19,
          vx: dx / length * 255,
          vy: dy / length * 255,
          life: 3.2,
          lane: enemy.lane,
        });
        enemy.cooldown = 1.35;
      }
      if (enemy.stateTimer <= 0 && distance > 580) {
        enemy.state = "patrol";
        enemy.cooldown = Math.max(enemy.cooldown, 1.1);
        enemy.vx = enemy.patrolVx || 80;
      }
      return;
    }
    enemy.x += enemy.vx * dt;
    enemy.y = enemy.baseY + Math.sin(enemy.t * 2.8) * (Number(enemy.yBob) || 44);
    if (Math.abs(enemy.x - enemy.originX) > enemy.range) enemy.vx *= -1;
    if (distance < 520 && enemy.cooldown <= 0) {
      enemy.state = "alert";
      enemy.stateTimer = 2.1;
      enemy.cooldown = 0.22;
      toast("提灯鹭张开巡光 · 躲到纸屏投下的阴影后", 1.0);
    }
  }

  function rewindChronoLeech(enemy) {
    if (enemy.type !== "chrono-leech" || enemy.hp <= 0 || enemy.rewindCooldown > 0) return false;
    enemy.x = enemy.rewindX;
    enemy.y = enemy.rewindY;
    enemy.state = "rewind";
    enemy.stateTimer = 0.28;
    enemy.rewindCooldown = 2.7;
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, currentLevel.theme.accent2, 13, 180);
    toast("时砂蛭回到了先前的位置", 0.85);
    return true;
  }

  function updateEnemies(dt) {
    const trialSlow = runtime.trial?.upgrades.has("time-pollen") ? 0.72 : 1;
    const enemyDt = dt * (effectActive("clock-spring") ? 0.55 : trialSlow);
    runtime.enemyWebs.forEach((web) => { web.life -= enemyDt; });
    runtime.enemyWebs = runtime.enemyWebs.filter((web) => web.life > 0);
    runtime.enemies.forEach((enemy) => {
      if (!enemy.alive || !isBossSpawnAvailable(enemy)) return;
      if (!isLaneEntityActive(enemy)) return;
      if (inCamera(enemy.x, enemy.w, 0)) discoverEnemy(enemy.type);
      if (isTimeFrozenAt(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2)) return;
      enemy.t += enemyDt;
      enemy.cooldown -= enemyDt;
      enemy.stateTimer = Math.max(0, Number(enemy.stateTimer) - enemyDt || 0);
      enemy.rewindTimer = Math.max(0, Number(enemy.rewindTimer) - enemyDt || 0);
      enemy.rewindCooldown = Math.max(0, Number(enemy.rewindCooldown) - enemyDt || 0);
      if (enemy.type === "thunder-drummer") {
        updateThunderDrummer(enemy, enemyDt);
      } else if (enemy.type === "thread-spinner") {
        updateThreadSpinner(enemy, enemyDt);
      } else if (enemy.type === "chrono-leech") {
        updateChronoLeech(enemy, enemyDt);
      } else if (enemy.type === "mirror-mimic") {
        updateMirrorMimic(enemy, enemyDt);
      } else if (enemy.type === "star-siphon") {
        updateStarSiphon(enemy, enemyDt);
      } else if (enemy.type === "lens-beetle") {
        updateLensBeetle(enemy, enemyDt);
      } else if (enemy.type === "rail-wisp") {
        updateRailWisp(enemy, enemyDt);
      } else if (enemy.type === "lantern-heron") {
        updateLanternHeron(enemy, enemyDt);
      } else if (enemy.trialEnemy) {
        moveTrialEnemy(enemy, enemyDt);
      } else if (isFlyingEnemy(enemy.type)) {
        enemy.x += enemy.vx * enemyDt;
        enemy.y += Math.sin(enemy.t * 3.2) * 48 * enemyDt;
        if (Math.abs(enemy.x - enemy.originX) > enemy.range) enemy.vx *= -1;
      } else if (isTurretEnemy(enemy.type)) {
        if (enemy.cooldown <= 0 && Math.abs(player.x - enemy.x) < 620) {
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const length = Math.hypot(dx, dy) || 1;
          runtime.enemyShots.push({ x: enemy.x + enemy.w / 2, y: enemy.y + 12, w: 16, h: 16, vx: dx / length * 270, vy: dy / length * 270, life: 3.1, lane: enemy.lane });
          enemy.cooldown = 2.25;
        }
      } else {
        enemy.x += enemy.vx * enemyDt;
        if (Math.abs(enemy.x - enemy.originX) > enemy.range) enemy.vx *= -1;
      }

      if (overlap(player, enemy)) {
        const stomped = player.vy > 180 && player.y + player.h - enemy.y < 26;
        const shieldedDash = enemy.type === "fold-beetle" && player.dashTime > 0 && !playerIsBehind(enemy);
        if (stomped || player.downstrike || (player.dashTime > 0 && !shieldedDash)) {
          enemy.hp -= 1;
          player.vy = -390;
          player.downstrike = false;
          rewindChronoLeech(enemy);
          if (enemy.hp <= 0) {
            enemy.alive = false;
            burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, currentLevel.theme.edge, 12, 230);
          }
        } else if (shieldedDash) {
          player.vx = -enemyFacing(enemy) * 260;
          player.dashTime = 0;
          burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, currentLevel.theme.paper, 8, 150);
          toast("折页盾挡住了正面冲刺 · 绕到背后或从上方下砸", 1.15);
        } else {
          hurtPlayer(enemy.x + enemy.w / 2);
        }
      }
    });
  }

  function isFlyingEnemy(type) {
    return ["flyer", "moth", "bat", "wasp", "drone", "kite", "star-siphon", "rail-wisp", "lantern-heron"].some((token) => String(type).includes(token));
  }

  function isTurretEnemy(type) {
    return ["turret", "spitter", "cannon", "caster"].some((token) => String(type).includes(token));
  }

  function togglePolarity(device) {
    const previous = runtime.polarity.current;
    const configuredValues = Array.isArray(runtime.devices.polarity?.values)
      ? runtime.devices.polarity.values.map(polarityValue).filter(Boolean)
      : ["sun", "moon"];
    const target = polarityValue(device?.polarity || device?.target)
      || configuredValues.find((value) => value !== previous)
      || (previous === "sun" ? "moon" : "sun");
    if (target === previous) return;
    runtime.polarity.previous = previous;
    runtime.polarity.current = target;
    runtime.polarity.grace = runtime.polarity.graceDuration;
    runtime.polaritySwitches.forEach((entry) => { entry.active = true; });
    toast(`${target === "sun" ? "灯相" : "墨相"}接管书库 · 旧书台保留片刻`, 1.45);
    announce(`相位切换为${target === "sun" ? "灯相" : "墨相"}`);
    playTone("switch");
  }

  function activateRelay(relay) {
    if (relay.role === "boss-relay") {
      const boss = runtime?.boss;
      const required = boss?.archetype === "rift-weaver" ? weaverRequiredRelayIds(boss) : [];
      if (!boss?.active || boss.vulnerable > 0 || !required.includes(relay.id)) {
        toast(boss?.vulnerable > 0 ? "核心已经暴露 · 先集中攻击" : "这枚继电器尚未接入当前相织", 1.15);
        return false;
      }
    }
    const requiredPolarity = polarityValue(relay.polarity);
    if (requiredPolarity && requiredPolarity !== runtime.polarity.current) {
      const label = requiredPolarity === "sun" ? "灯相" : "墨相";
      toast(`这枚继电器只响应${label} · 先切换相位`, 1.35);
      return false;
    }
    const duration = Math.max(0.5, Number(relay.duration) || 8);
    relay.active = true;
    relay.timer = duration;
    toast(`${relay.role === "boss-relay" ? "织界继电器" : "热能灯塔"} ${relay.index + 1} 已点亮 · ${Math.ceil(duration)} 秒`, 1.4);
    announce(`限时继电器 ${relay.index + 1} 已启动`);
    playTone("switch");
    return true;
  }

  function bossDefenseHint() {
    if (runtime?.boss?.archetype === "boiler-beetle") return "装甲弹开了脉冲——先开冷却阀，再诱导冲锋";
    if (runtime?.boss?.archetype === "rift-weaver") {
      const relay = weaverRelayProgress(runtime.boss);
      return `织网偏转了脉冲——同时点亮本相的 ${relay.ids.length} 个继电器`;
    }
    if (runtime?.boss?.archetype === "star-whale") {
      const anchors = starWhaleAnchorProgress(runtime.boss);
      return `引力壳偏转了脉冲——追上并点亮 ${anchors.required} 枚移动星锚`;
    }
    if (runtime?.boss?.archetype === "fold-warden") return "书页羽盾弹开了脉冲——等待俯冲预警，再下砸目标折痕";
    if (runtime?.boss?.archetype === "sky-paper-dragon") return "天穹鳞甲弹开了脉冲——攀上龙身，下砸三处发光结鳞";
    if (runtime?.boss?.archetype === "scorewing-maestro") return "谱翼护拍弹开了普通脉冲——捕获足量星片后冲刺齐射";
    return "暗核吞掉了脉冲——让两面日光镜同时共鸣";
  }

  function damageScorewingWithVolley(projectile) {
    const boss = runtime?.boss;
    if (!projectile?.crownVolley || !boss || boss.archetype !== "scorewing-maestro" || boss.hp <= 0) return false;
    if (boss.lastVolleyHitId === projectile.volleyId || boss.hitFlash > 0) return false;
    boss.lastVolleyHitId = projectile.volleyId;
    boss.state = "scorewing-core-open";
    boss.vulnerable = Math.max(0.08, Number(boss.weakPoint?.exposedTime) || 1.2);
    runtime.projectiles.forEach((shot) => {
      if (shot.volleyId === projectile.volleyId) shot.life = 0;
    });
    damageBoss(1);
    return true;
  }

  function updateProjectiles(dt) {
    const projectiles = runtime.projectiles;
    projectiles.forEach((projectile) => {
      projectile.life -= dt;
      projectile.enemyCollisionGrace = Math.max(0, Number(projectile.enemyCollisionGrace) - dt || 0);
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      let consumed = false;

      if (projectile.crownVolley) {
        if (runtime.boss && overlap(projectile, runtime.boss)) damageScorewingWithVolley(projectile);
        return;
      }

      const crownShard = runtime.enemyShots.find((shot) => shot.catchable && shot.life > 0 && overlap(projectile, shot));
      if (crownShard) {
        consumed = captureCrownShard(crownShard.id);
      }

      if (!consumed) {
        const lens = runtime.growthLenses.find((entry) => entry.cooldown <= 0 && overlap(projectile, entry));
        if (lens) {
          const next = lens.mode === "small" || lens.mode === "giant"
            ? lens.mode
            : runtime.growthForm === "small" ? "giant" : "small";
          lens.cooldown = 0.34;
          consumed = setGrowthForm(next);
        }
      }

      if (!consumed) {
        const junction = runtime.railJunctions.find((entry) => entry.cooldown <= 0 && overlap(projectile, entry));
        if (junction) consumed = setRailJunction(junction.id);
      }

      if (!consumed) {
        const screen = runtime.shadowScreens.find((entry) => overlap(projectile, entry));
        if (screen) consumed = moveShadowScreen(screen.id, Math.sign(projectile.vx || player.facing));
      }

      for (const weight of runtime.weightBlocks) {
        if (!overlap(projectile, weight)) continue;
        const direction = Math.sign(projectile.vx || player.facing) || 1;
        if (!ejectWeight(weight, direction)) weight.vx = direction * 430;
        burst(projectile.x, projectile.y, currentLevel.theme.accent, 9, 160);
        consumed = true;
        break;
      }

      if (!consumed) {
        const loom = runtime.looms.find((entry) => overlap(projectile, entry));
        if (loom) {
          pulseTrajectoryLoom(loom);
          burst(loom.x + loom.w / 2, loom.y + loom.h / 2, currentLevel.theme.accent2, 14, 190);
          consumed = true;
        }
      }

      if (!consumed && runtime.trial) {
        const task = trialActiveTask(runtime.trial);
        if ((task === "counter" || runtime.trial.phaseTask === "siege")
          && actOnTrialMeteorAt(projectile.x + projectile.w / 2, "pulse")) {
          consumed = true;
        }
        if (!consumed && task === "repair") {
          const repairAnchor = runtime.trial.anchors.find((anchor) => overlap(projectile, anchor));
          if (repairAnchor) consumed = chargeTrialRepairNode(repairAnchor.id, projectile.power > 1 ? 2 : 1, "pulse");
        }
        if (!consumed && runtime.trial.phaseTask === "siege") {
          const elite = runtime.trial.siege.elite;
          if (elite.active && !elite.defeated && overlap(projectile, elite)) {
            damageTrialElite("pulse");
            consumed = true;
          }
        }
      }

      for (const enemy of runtime.enemies) {
        if (consumed) break;
        if (projectile.enemyCollisionGrace > 0) continue;
        if (!enemy.alive || !isLaneEntityActive(enemy) || !isBossSpawnAvailable(enemy) || !overlap(projectile, enemy)) continue;
        const attackSide = projectile.x + projectile.w / 2 < enemy.x + enemy.w / 2 ? -1 : 1;
        const foldShielded = enemy.type === "fold-beetle" && attackSide === enemyFacing(enemy);
        if (foldShielded) {
          consumed = true;
          burst(projectile.x, projectile.y, currentLevel.theme.paper, 8, 140);
          toast("普通脉冲被折页盾弹开 · 绕背或下砸", 1.05);
          break;
        }
        enemy.hp -= Number(projectile.power) || 1;
        if (enemy.trialEnemy) {
          const push = runtime.trial?.upgrades.has("pulse-bloom") ? 96 : 54;
          enemy.x = clamp(enemy.x + Math.sign(projectile.vx || player.facing) * push, 0, currentLevel.worldWidth - enemy.w);
        }
        consumed = true;
        rewindChronoLeech(enemy);
        if (enemy.hp <= 0) {
          enemy.alive = false;
          burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, currentLevel.theme.edge, 10, 210);
        }
        break;
      }

      if (!consumed && runtime.trial && trialActiveTask(runtime.trial) === "repair") {
        const repairAnchor = runtime.trial.anchors.find((anchor) => overlap(projectile, anchor));
        if (repairAnchor) {
          consumed = chargeTrialRepairNode(repairAnchor.id, projectile.power > 1 ? 2 : 1, "pulse");
        }
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

      runtime.timeAnchors.forEach((anchor) => {
        if (overlap(projectile, anchor)) {
          anchor.active = true;
          anchor.timer = Math.max(anchor.timer, Number(anchor.duration) || 4);
          consumed = true;
          toast(`时花绽放 · 周围机关冻结 ${anchor.timer.toFixed(1)} 秒`, 1.25);
          playTone("switch");
          burst(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2, currentLevel.theme.accent2, 18, 220);
        }
      });

      runtime.gravityAnchors.forEach((anchor) => {
        if (overlap(projectile, anchor)) {
          anchor.active = true;
          anchor.timer = Math.max(anchor.timer, Number(anchor.duration) || 9);
          consumed = true;
          const progress = starWhaleAnchorProgress(runtime.boss);
          toast(`移动星锚 ${anchor.index + 1} 已锁定 · ${progress.active.length}/${progress.required}`, 1.15);
          playTone("switch");
          burst(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2, currentLevel.theme.edge, 16, 240);
        }
      });

      runtime.foldPanels.forEach((panel) => {
        if (!overlap(projectile, panel)) return;
        const group = String(panel.group);
        const previous = Number(runtime.foldStates[group]) || 0;
        const next = previous === 0 ? 1 : 0;
        runtime.foldPrevious[group] = previous;
        runtime.foldStates[group] = next;
        runtime.foldGrace[group] = 0.22;
        consumed = true;
        const matched = next === Number(panel.targetState);
        toast(`折面 ${panel.index + 1} ${matched ? "已稳定" : "翻回背面"}`, 1.15);
        playTone("switch");
        shake = Math.max(shake, 7);
        burst(panel.x + panel.w / 2, panel.y + panel.h / 2, currentLevel.theme.accent, 20, 270);
      });

      runtime.kiteAnchors.forEach((anchor) => {
        if (!overlap(projectile, anchor)) return;
        runtime.kiteTether.anchorId = anchor.id;
        runtime.kiteTether.timer = Math.max(1, Number(anchor.duration) || 2.7);
        runtime.kiteVisited.add(anchor.id);
        consumed = true;
        toast(`风筝锚 ${anchor.index + 1} 已牵引 · ${runtime.kiteVisited.size}/${runtime.kiteAnchors.length}`, 1.05);
        playTone("switch");
        burst(anchor.x + anchor.w / 2, anchor.y + anchor.h * 0.34, currentLevel.theme.accent2, 16, 220);
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

      runtime.objectives.forEach((objective) => {
        if (objective.type === "repair-zones") {
          objective.zones.forEach((zone) => {
            if (zone.repaired || !overlap(projectile, zone)) return;
            zone.repaired = true;
            consumed = true;
            const progress = objectiveProgress(objective);
            toast(`${zone.label || `修复点 ${zone.index + 1}`}已复苏 · ${progress.progress}/${progress.required}`, 1.35);
            announce("潮汐锚点修复完成");
            playTone("switch");
            burst(zone.x + zone.w / 2, zone.y + zone.h / 2, currentLevel.theme.accent2, 18, 250);
          });
        }
        if (objective.type === "reflect-reactor") {
          objective.reactors.forEach((reactor) => {
            if (!overlap(projectile, reactor)) return;
            const amount = projectile.reflected ? 3 : 1;
            const before = reactor.charge;
            reactor.charge = Math.min(reactor.requiredCharge, reactor.charge + amount);
            reactor.powered = reactor.charge >= reactor.requiredCharge;
            consumed = true;
            if (projectile.reflected) runtime.moduleState.echoCharge += reactor.charge - before;
            toast(`${reactor.powered ? "反应炉已点亮" : "反应炉供能"} · ${reactor.charge}/${reactor.requiredCharge}${projectile.reflected ? " · 弹反增幅" : ""}`, 1.1);
            playTone("switch");
            burst(reactor.x + reactor.w / 2, reactor.y + reactor.h / 2, projectile.reflected ? currentLevel.theme.edge : currentLevel.theme.accent2, 12, 190);
          });
        }
      });

      runtime.polaritySwitches.forEach((device) => {
        if (overlap(projectile, device)) {
          togglePolarity(device);
          consumed = true;
        }
      });

      runtime.relays.forEach((relay) => {
        if (overlap(projectile, relay)) {
          activateRelay(relay);
          consumed = true;
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
        if (projectile.crownVolley && runtime.boss.archetype === "scorewing-maestro") damageScorewingWithVolley(projectile);
        else if (runtime.boss.vulnerable > 0) damageBoss(Number(projectile.power) || 1);
        else {
          burst(projectile.x, projectile.y, currentLevel.theme.paper, 6, 150);
          toast(bossDefenseHint(), 1.3);
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
      const trialCore = runtime.trial?.core;
      if (shot.life > 0 && Number(shot.trialCoreDamage) > 0 && trialCore && overlap(shot, trialCore)) {
        shot.life = 0;
        damageTrialCore(shot.trialCoreDamage);
        shake = Math.max(shake, 8);
        burst(trialCore.x + trialCore.w / 2, trialCore.y + trialCore.h / 2, currentLevel.theme.accent, 14, 220);
        playTone("hurt");
      }
    });
    runtime.enemyShots = runtime.enemyShots.filter((shot) => shot.life > 0);

    runtime.shockwaves.forEach((wave) => {
      wave.life -= hostileDt;
      wave.x += wave.vx * hostileDt;
    });
    runtime.shockwaves = runtime.shockwaves.filter((wave) => wave.life > 0);
    runtime.rootWaves.forEach((wave) => {
      wave.life -= dt;
      wave.radius += 420 * dt;
    });
    runtime.rootWaves = runtime.rootWaves.filter((wave) => wave.life > 0);
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

    if (boss.archetype === "boiler-beetle") updateBeetleBoss(boss, arena, dt);
    else if (boss.archetype === "rift-weaver") updateRiftWeaverBoss(boss, arena, dt);
    else if (boss.archetype === "star-whale") updateStarWhaleBoss(boss, arena, dt);
    else if (boss.archetype === "fold-warden") updateFoldWardenBoss(boss, arena, dt);
    else if (boss.archetype === "sky-paper-dragon") updateSkyPaperDragonBoss(boss, arena, dt);
    else if (boss.archetype === "scorewing-maestro") updateScorewingBoss(boss, arena, dt);
    else updateEclipseBoss(boss, arena, dt);

    if (overlap(player, boss)) {
      if (boss.archetype === "scorewing-maestro") hurtPlayer(boss.x + boss.w / 2);
      else if (boss.vulnerable > 0 && player.dashTime > 0) damageBoss(1);
      else if (boss.vulnerable <= 0) hurtPlayer(boss.x + boss.w / 2);
    }
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

  function updateRiftWeaverBoss(boss, arena, dt) {
    boss.phase = bossPhaseForHealth(boss);
    const relay = weaverRelayProgress(boss);
    if (relay.ready && boss.vulnerable <= 0 && boss.state !== "relay-stunned") {
      boss.vulnerable = Math.max(1, Number(runtime.bossRelay.exposedTime || boss.weakPoint.exposedTime) || 3.5);
      boss.exposureHits = 0;
      boss.state = "relay-stunned";
      boss.vx = 0;
      if (runtime.bossRelay.resetOnExposure !== false || boss.mechanism.resetRelaysOnExposure) {
        relay.relays.forEach((entry) => { entry.active = false; entry.timer = 0; });
      }
      shake = 14;
      burst(boss.x + boss.w / 2, boss.y + boss.h / 2, currentLevel.theme.edge, 34, 390);
      toast(`第 ${boss.phase} 相织网断裂 · 核心暴露！`, 1.8);
      announce("裂界织母核心暴露");
    }

    if (boss.vulnerable > 0) {
      boss.state = "relay-stunned";
      boss.y = 275 + Math.sin(runtime.time * 5.2) * 8;
      return;
    }
    if (boss.state === "relay-stunned") {
      boss.state = "weaving";
      boss.timer = 0.8;
      boss.exposureHits = 0;
    }

    const phaseData = boss.phases[Math.max(0, boss.phase - 1)] || {};
    const left = arena.x + 360;
    const right = arena.x + arena.w - boss.w - 300;
    boss.y = 255 + Math.sin(runtime.time * (1.45 + boss.phase * 0.18)) * (48 + boss.phase * 7);
    boss.x = clamp(boss.x + Math.sin(runtime.time * 0.75 + boss.phase) * (28 + boss.phase * 5) * dt, left, right);

    if (boss.timer > 0) return;
    if (boss.state !== "thread-charge") {
      boss.state = "thread-charge";
      boss.timer = Math.max(0.35, Number(phaseData.telegraph) || 0.55);
      toast(boss.phase >= 3 ? "裂界织母正在编织星暴 · 准备换位" : "星线正在收束 · 留意弹幕缝隙", 0.9);
      return;
    }
    boss.state = "weaving";
    const centerX = boss.x + boss.w / 2;
    const centerY = boss.y + boss.h / 2;
    const spread = boss.phase === 1 ? 1 : boss.phase === 2 ? 2 : 3;
    for (let i = -spread; i <= spread; i += 1) {
      const angle = Math.atan2(player.y + player.h / 2 - centerY, player.x + player.w / 2 - centerX) + i * 0.18;
      const speed = 285 + boss.phase * 28;
      runtime.enemyShots.push({ x: centerX, y: centerY, w: 18, h: 18, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 4.2 });
    }
    if (boss.phase >= 2) {
      runtime.shockwaves.push(
        { x: centerX, y: 578, w: 62, h: 24, vx: -300 - boss.phase * 25, life: 2.7 },
        { x: centerX, y: 578, w: 62, h: 24, vx: 300 + boss.phase * 25, life: 2.7 },
      );
    }
    if (boss.phase >= 3) {
      for (let i = 0; i < 4; i += 1) {
        runtime.enemyShots.push({ x: arena.x + 260 + i * 470, y: 105, w: 22, h: 22, vx: 0, vy: 390 + i * 18, life: 2.2 });
      }
    }
    boss.timer = Math.max(0.8, Number(phaseData.attackCooldown) || (2.55 - boss.phase * 0.38));
    playTone("boss");
  }

  function updateStarWhaleBoss(boss, arena, dt) {
    boss.phase = bossPhaseForHealth(boss);
    const phaseData = boss.phases[Math.max(0, boss.phase - 1)] || {};
    const orbitScale = Number(phaseData.orbitScale) || 1;
    const centerX = boss.x + boss.w / 2;
    const centerY = boss.y + boss.h / 2;
    runtime.gravityAnchors.forEach((anchor) => {
      const angle = Number(anchor.angle) + runtime.time * Number(anchor.speed || 0.8) * orbitScale;
      anchor.x = centerX + Math.cos(angle) * Number(anchor.radiusX || 230) * orbitScale - anchor.w / 2;
      anchor.y = centerY + Math.sin(angle) * Number(anchor.radiusY || 130) * orbitScale - anchor.h / 2;
    });

    const anchorProgress = starWhaleAnchorProgress(boss);
    if (anchorProgress.ready && boss.vulnerable <= 0 && boss.state !== "anchor-stunned") {
      boss.vulnerable = Math.max(1, Number(boss.weakPoint.exposedTime) || 3.8);
      boss.exposureHits = 0;
      boss.state = "anchor-stunned";
      boss.vx = 0;
      if (boss.mechanism.resetAnchorsOnExposure !== false) {
        runtime.gravityAnchors.forEach((anchor) => { anchor.active = false; anchor.timer = 0; });
      }
      shake = 16;
      burst(centerX, centerY, currentLevel.theme.edge, 40, 430);
      toast(`第 ${boss.phase} 潮被星锚拉断 · 胸口星核暴露！`, 1.8);
      announce("星噬鲸被星锚拉落，核心暴露");
    }

    if (boss.vulnerable > 0) {
      boss.state = "anchor-stunned";
      boss.y = 365 + Math.sin(runtime.time * 5.4) * 8;
      return;
    }
    if (boss.state === "anchor-stunned") {
      boss.state = "tide";
      boss.timer = 0.8;
      boss.exposureHits = 0;
    }

    const left = arena.x + 420;
    const right = arena.x + arena.w - boss.w - 260;
    boss.x = clamp(boss.x + Math.sin(runtime.time * 0.72 + boss.phase) * (38 + boss.phase * 8) * dt, left, right);
    boss.y = 225 + Math.sin(runtime.time * (1.2 + boss.phase * 0.12)) * (54 + boss.phase * 10);
    if (boss.timer > 0) return;

    const attack = Math.floor(runtime.time * 0.7 + boss.phase) % 3;
    if (attack === 0) {
      boss.state = "beam";
      const originX = boss.x + boss.w / 2;
      const originY = boss.y + boss.h / 2;
      for (let i = -2 - boss.phase; i <= 2 + boss.phase; i += 1) {
        const angle = Math.atan2(player.y + player.h / 2 - originY, player.x + player.w / 2 - originX) + i * 0.15;
        const speed = 260 + boss.phase * 34;
        runtime.enemyShots.push({ x: originX, y: originY, w: 18, h: 18, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 4.2 });
      }
      toast("星鲸吐息 · 贴近轨道缝隙", 0.95);
    } else if (attack === 1) {
      boss.state = "dive";
      runtime.shockwaves.push(
        { x: boss.x, y: 578, w: 72, h: 24, vx: -360 - boss.phase * 35, life: 2.8 },
        { x: boss.x + boss.w, y: 578, w: 72, h: 24, vx: 360 + boss.phase * 35, life: 2.8 },
      );
      shake = 10;
      toast("引力拍岸 · 跳过双向潮波", 0.95);
    } else {
      boss.state = "charge";
      for (let i = 0; i < 3 + boss.phase; i += 1) {
        runtime.enemyShots.push({ x: arena.x + 210 + i * (arena.w - 420) / (2 + boss.phase), y: 110, w: 22, h: 22, vx: 0, vy: 350 + i * 16, life: 2.3 });
      }
      toast("坠星潮 · 跟随引力方向换位", 0.95);
    }
    boss.timer = Math.max(0.75, Number(phaseData.attackCooldown) || 2.1);
    playTone("boss");
  }

  function updateFoldWardenBoss(boss, arena, dt) {
    boss.phase = bossPhaseForHealth(boss);
    const phaseData = boss.phases[Math.max(0, boss.phase - 1)] || {};
    const traps = runtime.foldTraps;

    if (boss.vulnerable > 0) {
      boss.state = "fold-trapped";
      boss.vx = 0;
      boss.vy = 0;
      return;
    }
    if (boss.state === "fold-trapped") {
      boss.state = "watching";
      boss.timer = Math.max(0.7, Number(phaseData.attackCooldown) || 1.6);
      boss.y = arena.y + 65;
      boss.targetTrapId = null;
    }

    if (boss.state === "watching") {
      boss.y = arena.y + 65 + Math.sin(runtime.time * 2.2) * 24;
      boss.x = clamp(boss.x + Math.sin(runtime.time * 0.9 + boss.phase) * 34 * dt, arena.x + 260, arena.x + arena.w - boss.w - 260);
      if (boss.timer > 0 || traps.length === 0) return;
      const target = traps[boss.attackIndex % traps.length];
      boss.targetTrapId = target.id;
      boss.state = "fold-telegraph";
      boss.timer = Math.max(0.55, Number(phaseData.telegraph) || 0.85);
      boss.x = target.x + target.w / 2 - boss.w / 2;
      boss.y = arena.y + 32;
      boss.vy = 0;
      toast(`折痕 ${target.index + 1} 被锁定 · 现在下砸！`, 1.1);
      announce("千页守鸾俯冲预警");
      return;
    }

    if (boss.state === "fold-telegraph") {
      const target = traps.find((trap) => trap.id === boss.targetTrapId);
      if (target) boss.x = target.x + target.w / 2 - boss.w / 2;
      if (boss.timer <= 0) {
        boss.state = "fold-dive";
        boss.vy = Math.max(620, Number(phaseData.diveSpeed) || 760);
        playTone("boss");
      }
      return;
    }

    if (boss.state === "fold-dive") {
      boss.y += boss.vy * dt;
      const target = traps.find((trap) => trap.id === boss.targetTrapId);
      if (boss.y + boss.h < 590) return;
      boss.attackIndex += 1;
      boss.vy = 0;
      if (target?.armed) {
        target.armed = false;
        target.timer = 0;
        boss.y = target.y - boss.h + 18;
        boss.vulnerable = Math.max(2.4, Number(boss.weakPoint.exposedTime) || 3.5);
        boss.state = "fold-trapped";
        shake = 16;
        toast("折面合拢 · 千页核心暴露！", 1.8);
        announce("千页守鸾被折面困住");
        burst(target.x + target.w / 2, target.y, currentLevel.theme.accent2, 36, 390);
      } else {
        boss.y = arena.y + 65;
        boss.state = "recover";
        boss.timer = 0.9;
        boss.targetTrapId = null;
        shake = 13;
        runtime.shockwaves.push(
          { x: boss.x, y: 584, w: 62, h: 24, vx: -380, life: 2.7 },
          { x: boss.x + boss.w, y: 584, w: 62, h: 24, vx: 380, life: 2.7 },
        );
        if (boss.phase >= 2) {
          for (let i = 0; i < boss.phase + 1; i += 1) {
            runtime.enemyShots.push({ x: arena.x + 250 + i * (arena.w - 500) / boss.phase, y: 120, w: 22, h: 22, vx: 0, vy: 340 + i * 22, life: 2.4 });
          }
        }
        toast("俯冲撕开纸面 · 跳过冲击波", 0.95);
      }
      return;
    }

    if (boss.state === "recover" && boss.timer <= 0) {
      boss.state = "watching";
      boss.timer = Math.max(0.7, Number(phaseData.attackCooldown) || 1.6);
    }
  }

  function updateSkyPaperDragonBoss(boss, arena) {
    boss.phase = bossPhaseForHealth(boss);
    const head = runtime.platforms.find((platform) => platform.id === "pd-body-head")
      || runtime.platforms.find((platform) => platform.bossAttached);
    if (head) {
      boss.x = head.x + 32;
      boss.y = head.y - boss.h - 20;
    } else {
      boss.x = clamp(boss.x, arena.x + 120, arena.x + arena.w - boss.w - 120);
    }

    if (boss.vulnerable > 0) {
      boss.state = "dragon-core-open";
      return;
    }
    if (runtime.dragonCycle.coreOpen) {
      resetDragonKnots();
      boss.state = "dragon-shield";
      boss.timer = 0.9;
      toast("头冠重新合拢 · 追上下一轮结鳞", 1.3);
    }
    if (boss.timer > 0) {
      if (boss.state !== "dragon-shield") boss.state = "dragon-bridge";
      return;
    }

    const phaseData = boss.phases[Math.max(0, boss.phase - 1)] || {};
    const originX = boss.x + boss.w / 2;
    const originY = boss.y + boss.h * 0.62;
    const starfallCount = Math.max(1, Number(phaseData.starfallCount) || boss.phase);
    boss.state = boss.attackIndex % 2 === 0 ? "dragon-charge" : "dragon-dive";
    if (boss.state === "dragon-charge") {
      for (let index = -boss.phase; index <= boss.phase; index += 1) {
        const angle = Math.atan2(player.y + player.h / 2 - originY, player.x + player.w / 2 - originX) + index * 0.17;
        const speed = 285 + boss.phase * 32;
        runtime.enemyShots.push({ x: originX, y: originY, w: 20, h: 20, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 4 });
      }
      toast("纸龙吐出裁星鳞 · 借龙脊高低躲开", 0.95);
    } else {
      for (let index = 0; index < starfallCount; index += 1) {
        const spacing = arena.w / (starfallCount + 1);
        runtime.enemyShots.push({ x: arena.x + spacing * (index + 1), y: 80, w: 26, h: 26, vx: 0, vy: 370 + index * 26, life: 2.5 });
      }
      runtime.shockwaves.push(
        { x: originX, y: 585, w: 68, h: 24, vx: -340 - boss.phase * 30, life: 2.5 },
        { x: originX, y: 585, w: 68, h: 24, vx: 340 + boss.phase * 30, life: 2.5 },
      );
      toast("龙尾翻页 · 坠星与纸浪同时逼近", 0.95);
    }
    boss.attackIndex += 1;
    boss.timer = Math.max(0.8, Number(phaseData.attackCooldown) || 2.2);
    playTone("boss");
  }

  function updateScorewingBoss(boss, arena, dt) {
    boss.phase = bossPhaseForHealth(boss);
    const phaseData = boss.phases[Math.max(0, boss.phase - 1)] || {};
    const left = arena.x + 310;
    const right = arena.x + arena.w - boss.w - 250;
    boss.x = clamp(boss.x + Math.sin(runtime.time * (0.72 + boss.phase * 0.08)) * (42 + boss.phase * 10) * dt, left, right);
    boss.y = arena.y + 92 + Math.sin(runtime.time * (1.35 + boss.phase * 0.13)) * (52 + boss.phase * 8);

    if (boss.hitFlash > 0) {
      boss.state = "scorewing-stunned";
      return;
    }
    if (boss.timer > 0) {
      if (boss.phase >= 3 && boss.state !== "scorewing-shard-cast") boss.state = "scorewing-enraged";
      else if (boss.state === "scorewing-stunned") boss.state = "scorewing-idle";
      return;
    }

    boss.state = "scorewing-shard-cast";
    const centerX = boss.x + boss.w / 2;
    const centerY = boss.y + boss.h / 2;
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h * 0.42;
    const baseAngle = Math.atan2(targetY - centerY, targetX - centerX);
    const required = scorewingRequiredShards(boss);
    const shardSpeed = Math.max(180, Number(phaseData.shardSpeed) || 250);
    const shardLife = Math.max(3.2, Number(runtime.devices.shardRules?.shardLifetime) || 5.5);
    for (let index = 0; index < required; index += 1) {
      const spread = (index - (required - 1) / 2) * (boss.phase >= 3 ? 0.16 : 0.12);
      const angle = baseAngle + spread;
      runtime.enemyShots.push({
        id: `crown-shard-${runtime.crownShardSerial += 1}`,
        kind: "crown-shard",
        catchable: true,
        x: centerX - 13,
        y: centerY - 13,
        w: 26,
        h: 26,
        vx: Math.cos(angle) * shardSpeed,
        vy: Math.sin(angle) * shardSpeed,
        life: shardLife,
        phase: boss.phase,
      });
    }

    if (boss.phase >= 2) {
      const direction = boss.attackIndex % 2 === 0 ? -1 : 1;
      runtime.shockwaves.push({
        x: direction < 0 ? arena.x + arena.w - 80 : arena.x,
        y: 580,
        w: 80,
        h: 24,
        vx: direction * (300 + boss.phase * 36),
        life: 4.2,
      });
    }
    if (boss.phase >= 3) {
      for (let index = -1; index <= 1; index += 1) {
        const angle = baseAngle + index * 0.32;
        runtime.enemyShots.push({
          x: centerX - 9,
          y: centerY - 9,
          w: 18,
          h: 18,
          vx: Math.cos(angle) * 315,
          vy: Math.sin(angle) * 315,
          life: 3.8,
        });
      }
    }
    boss.attackIndex += 1;
    boss.timer = Math.max(0.72, Number(phaseData.shardInterval || phaseData.attackCooldown) || 2.2);
    toast(`第 ${boss.phase} 乐章 · 捕获 ${required} 枚星片，再冲刺反奏`, 1.05);
    announce("谱翼指挥蛾抛出可捕获星片");
    playTone("boss");
  }

  function damageBoss(amount = 1) {
    const boss = runtime.boss;
    if (!boss || boss.hitFlash > 0 || boss.vulnerable <= 0) return;
    // Boss cores own their per-hit damage so a charged pulse cannot skip an
    // entire relay phase (the rift-weaver must still teach 1 / 2 / 3 relays).
    const configuredDamage = Number(boss.weakPoint?.damagePerHit);
    const damage = configuredDamage > 0 ? configuredDamage : Math.max(1, Number(amount) || 1);
    boss.hp = Math.max(0, boss.hp - damage);
    boss.hitFlash = 0.35;
    if (boss.archetype === "rift-weaver" || boss.archetype === "star-whale" || boss.archetype === "sky-paper-dragon") boss.exposureHits += 1;
    else boss.vulnerable = 0;
    boss.phase = bossPhaseForHealth(boss);
    shake = 18;
    flash = 0.45;
    playTone("boss");
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, currentLevel.theme.accent, 30, 430);
    if (boss.hp <= 0) {
      boss.state = "defeated";
      if (boss.archetype === "sky-paper-dragon") runtime.dragonCycle.coreOpen = false;
      runtime.goalOpen = true;
      runtime.enemyShots.length = 0;
      runtime.shockwaves.length = 0;
      const hasCoreReward = runtime.collectibles.some((item) => item.spawnOnBossDefeat && !item.collected);
      if (hasCoreReward) toast("守门核心已经显现 · 拾取它完成挑战", 2.2);
      else setTimeout(() => completeLevel(), 650);
    } else {
      if (boss.archetype === "scorewing-maestro") {
        runtime.capturedCrownShards = 0;
        runtime.enemyShots = runtime.enemyShots.filter((shot) => !shot.catchable);
        boss.vulnerable = 0;
        boss.state = boss.phase >= 3 ? "scorewing-enraged" : "scorewing-stunned";
        boss.timer = 1.05;
        toast(`终曲反奏命中 · 还剩 ${boss.hp} 个乐章`, 1.55);
      } else if (boss.archetype === "sky-paper-dragon") {
        runtime.dragonCycle.index += 1;
        resetDragonKnots();
        boss.vulnerable = 0;
        boss.state = "dragon-bridge";
        boss.timer = 1.1;
        toast(`一卷天穹核心已修复 · 还剩 ${boss.hp} 卷`, 1.6);
      } else if (boss.archetype === "rift-weaver" || boss.archetype === "star-whale") {
        const hitsPerExposure = Math.max(1, Number(runtime.bossRelay.hitsPerExposure || boss.weakPoint.hitsPerExposure) || 2);
        if (boss.exposureHits >= hitsPerExposure) {
          boss.vulnerable = 0;
          boss.state = boss.archetype === "star-whale" ? "tide" : "weaving";
          boss.timer = 1;
          toast(`${boss.archetype === "star-whale" ? "星核沉回引力壳" : "织界核心闭合"} · 还剩 ${boss.hp} 层`, 1.6);
        } else {
          boss.state = boss.archetype === "star-whale" ? "anchor-stunned" : "relay-stunned";
          toast(`核心受损 · 本轮还能命中 ${hitsPerExposure - boss.exposureHits} 次`, 1.35);
        }
      } else {
        toast(`核心受损 · 还剩 ${boss.hp} 层`, 1.6);
        boss.state = "watching";
        boss.timer = 1.15;
      }
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
    // The menu has its own opaque cover art. Skipping the hidden Canvas scene
    // avoids needlessly redrawing a full animated world on battery-powered phones.
    if (scene !== "menu") {
      if (!currentLevel || scene === "levels" || scene === "help") renderMenuWorld();
      else renderWorld();
    }
    ctx.restore();
    if (scene !== "menu" && flash > 0) {
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
    drawMenuRifts();
    drawParallaxHills(theme, menuTime * 16, 0);
    drawWindmill(menuX(885), 280, 1.45, theme, menuTime);
    drawPaperCloud(menuX(720) + Math.sin(menuTime * 0.25) * 25, 105, 1.25, theme.paper, 0.58);
    drawPaperCloud(menuX(1080) + Math.sin(menuTime * 0.18) * 36, 280, 0.85, theme.paper, 0.42);
    ctx.fillStyle = theme.ground;
    paperPolygon([[menuX(520), 610], [menuX(630), 542], [menuX(775), 570], [menuX(930), 512], [menuX(1090), 545], [VIEW_W, 474], [VIEW_W, 720], [menuX(500), 720]], theme.ground, theme.ink, 5);
    const moduleColor = { none: "#f4edda", echo: "#71d9dc", wind: "#f6b84b", root: "#87ad70" }[save.heroModule] || "#f4edda";
    const heroX = menuX(945);
    const heroY = 488 + Math.sin(menuTime * 2.2) * 5;
    ctx.save();
    ctx.strokeStyle = moduleColor;
    ctx.globalAlpha = 0.26;
    ctx.lineWidth = 18;
    ctx.beginPath(); ctx.ellipse(heroX, heroY - 70, 78, 95, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(heroX, heroY - 70, 67 + Math.sin(menuTime * 2) * 4, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    drawHero(heroX, heroY, 2.35, 1, 0, theme, menuTime);
    for (let i = 0; i < 12; i += 1) {
      const x = menuX(600) + mod(i * menuX(117) + menuTime * (18 + i), menuX(760));
      const y = 340 + Math.sin(i * 2.2 + menuTime) * 70;
      drawLeaf(x, y, 10 + (i % 3) * 4, theme.edge, menuTime + i);
    }
  }

  function drawMenuRifts() {
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
    renderDarkness();
    ctx.save();
    ctx.translate(-cameraX, 0);
    renderWindZones(theme);
    renderActFourFields(theme);
    renderActFiveFields(theme);
    renderActSixFields(theme);
    renderActSevenFields(theme);
    renderGoal(theme);
    renderPlatforms(theme);
    renderHazards(theme);
    renderDevices(theme);
    renderTrialArena(theme);
    renderCollectibles(theme);
    renderCheckpoints(theme);
    renderEnemyWebs(theme);
    runtime.enemies.forEach((enemy) => {
      if (!enemy.alive || !isBossSpawnAvailable(enemy) || !inCamera(enemy.x, enemy.w)) return;
      ctx.save();
      if (!isLaneEntityActive(enemy)) ctx.filter = inactiveLaneFilter();
      drawEnemy(enemy, theme);
      ctx.restore();
    });
    runtime.enemyShots.forEach((shot) => {
      if (!inCamera(shot.x, shot.w, 80)) return;
      ctx.save();
      if (!isLaneEntityActive(shot)) ctx.filter = inactiveLaneFilter();
      if (shot.catchable) {
        const pulse = 1 + Math.sin(runtime.time * 9 + Number(shot.phase || 0)) * 0.08;
        drawCrownShardMarker(shot.x + shot.w / 2, shot.y + shot.h / 2, 66 * pulse, theme);
      } else {
        drawOrb(shot.x + shot.w / 2, shot.y + shot.h / 2, shot.w * 0.7, theme.accent, theme.ink);
      }
      ctx.restore();
    });
    runtime.shockwaves.forEach((wave) => {
      if (!inCamera(wave.x, wave.w, 80)) return;
      ctx.save();
      if (!isLaneEntityActive(wave)) ctx.filter = inactiveLaneFilter();
      drawShockwave(wave, theme);
      ctx.restore();
    });
    runtime.rootWaves.forEach((wave) => {
      if (!inCamera(wave.x - wave.radius, wave.radius * 2, 80)) return;
      ctx.save();
      ctx.strokeStyle = "#8fb477";
      ctx.globalAlpha = clamp(wave.life / wave.maxLife, 0, 1);
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.ellipse(wave.x, wave.y, wave.radius, wave.radius * 0.25, 0, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
    runtime.projectiles.forEach((shot) => {
      if (!inCamera(shot.x, shot.w, 80)) return;
      if (shot.crownVolley) drawCrownShardMarker(shot.x + shot.w / 2, shot.y + shot.h / 2, 70, theme);
      else drawOrb(shot.x + shot.w / 2, shot.y + shot.h / 2, Math.max(11, shot.w * 0.48), shot.starCharged ? theme.accent : theme.edge, theme.paper);
    });
    if (runtime.boss && runtime.boss.hp > 0) drawBoss(runtime.boss, theme);
    if (player) {
      if (runtime.echoClone && inCamera(runtime.echoClone.x, runtime.echoClone.w, 80)) {
        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.filter = "hue-rotate(115deg) saturate(1.4)";
        drawHero(runtime.echoClone.x + runtime.echoClone.w / 2, runtime.echoClone.y + runtime.echoClone.h, 1, runtime.echoClone.facing, player.vx, theme, runtime.time - runtime.echoDelay, { ...runtime.echoClone, onGround: false, vy: 0 });
        ctx.restore();
      }
      if (player.rootShield > 0) {
        ctx.save(); ctx.strokeStyle = "#8fb477"; ctx.globalAlpha = 0.5 + Math.sin(runtime.time * 12) * 0.15; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.ellipse(player.x + player.w / 2, player.y + player.h / 2, 38, 46, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      } else if (runtime.moduleState.echoPulse > 0) {
        ctx.save(); ctx.strokeStyle = theme.accent2; ctx.globalAlpha = runtime.moduleState.echoPulse / 0.28; ctx.lineWidth = 6;
        const radius = 40 + (1 - runtime.moduleState.echoPulse / 0.28) * 150;
        ctx.beginPath(); ctx.arc(player.x + player.w / 2, player.y + player.h / 2, radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      for (let index = 0; index < runtime.capturedCrownShards; index += 1) {
        const angle = runtime.time * 2.4 + index / Math.max(1, runtime.capturedCrownShards) * Math.PI * 2;
        drawCrownShardMarker(player.x + player.w / 2 + Math.cos(angle) * 52, player.y + player.h * 0.45 + Math.sin(angle) * 38, 48, theme);
      }
      drawHero(player.x + player.w / 2, player.y + player.h, Number(growthFormConfig().scale) || 1, player.facing, player.vx, theme, player.anim, player);
    }
    runtime.particles.forEach((particle) => { if (inCamera(particle.x, particle.size * 2, 80)) drawParticle(particle); });
    renderWaterAndLava(theme);
    ctx.restore();
    renderForeground(theme);
    renderActSevenOverlay(theme);
  }

  function drawCrownShardMarker(x, y, size, theme) {
    const frame = frameSpec("deviceFrames", "crownShard", DEFAULT_DEVICE_FRAMES.crownShard);
    ctx.save();
    ctx.fillStyle = theme.accent2;
    ctx.globalAlpha = 0.18 + Math.sin(runtime.time * 7) * 0.035;
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.42, size * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (!drawAtlasFrame(frame, x, y, size, size, { anchorX: 0.5, anchorY: 0.5 })) {
      drawStarShape(x, y, size * 0.24, theme.paper, theme.ink);
    }
    ctx.restore();
  }

  function renderEnemyWebs(theme) {
    runtime.enemyWebs.forEach((web) => {
      if (!inCamera(web.x, web.w, 80)) return;
      const fade = clamp(web.life / Math.min(1.2, web.maxLife), 0, 1);
      ctx.save();
      if (!isLaneEntityActive(web)) ctx.filter = inactiveLaneFilter();
      ctx.globalAlpha = 0.26 + fade * 0.38;
      ctx.strokeStyle = theme.accent2;
      ctx.lineWidth = 3;
      for (let offset = 0; offset <= web.w; offset += 22) {
        ctx.beginPath();
        ctx.moveTo(web.x + offset, web.y + web.h);
        ctx.quadraticCurveTo(web.x + web.w / 2, web.y - 14, web.x + web.w - offset, web.y + web.h);
        ctx.stroke();
      }
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(web.x, web.y + web.h - 8, web.w, 8);
      ctx.restore();
    });
  }

  function drawTrialActionGlyph(action, x, y, theme, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = theme.paper;
    ctx.fillStyle = theme.edge;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (action === "dash") {
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(16, 0); ctx.moveTo(6, -10); ctx.lineTo(18, 0); ctx.lineTo(6, 10); ctx.stroke();
    } else if (action === "downstrike") {
      ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(0, 12); ctx.moveTo(-10, 3); ctx.lineTo(0, 15); ctx.lineTo(10, 3); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function renderTrialArena(theme) {
    const trial = runtime?.trial;
    if (!trial) return;
    const core = trial.core;
    const routeAnchors = trial.route.map((id) => trialAnchor(trial, id)).filter(Boolean);

    ctx.save();
    if (routeAnchors.length) {
      ctx.strokeStyle = theme.edge;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.2;
      ctx.setLineDash([14, 12]);
      ctx.beginPath();
      routeAnchors.forEach((anchor, index) => {
        const x = anchor.x + anchor.w / 2;
        const y = anchor.y + anchor.h / 2;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      if (trial.routeProgress > 0) {
        ctx.strokeStyle = theme.paper;
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = 7;
        ctx.beginPath();
        routeAnchors.slice(0, trial.routeProgress).forEach((anchor, index) => {
          const x = anchor.x + anchor.w / 2;
          const y = anchor.y + anchor.h / 2;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }

    trial.meteors.forEach((meteor) => {
      const warning = !meteor.struck;
      const heavyScale = meteor.type === "heavy" ? 1.45 : meteor.type === "splitter" ? 1.2 : 1;
      const intensity = warning ? 0.28 + (1 - clamp(meteor.timer / (meteor.warningTime || 1.2), 0, 1)) * 0.55 : clamp(meteor.life / 0.34, 0, 1);
      ctx.strokeStyle = warning ? theme.accent : theme.paper;
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = intensity;
      ctx.lineWidth = (warning ? 5 : 26) * heavyScale;
      ctx.setLineDash(warning ? [10, 12] : []);
      ctx.beginPath(); ctx.moveTo(meteor.x, 70); ctx.lineTo(meteor.x, 620); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.ellipse(meteor.x, 610, 48 * heavyScale, 13 * heavyScale, 0, 0, Math.PI * 2); ctx.fill();
      if (warning) {
        (meteor.actionSequence || ["downstrike"]).forEach((action, index) => {
          ctx.globalAlpha = index < meteor.actionIndex ? 0.28 : 0.92;
          drawTrialActionGlyph(action, meteor.x + (index - ((meteor.actionSequence?.length || 1) - 1) / 2) * 42, 108, theme, 0.72);
        });
      }
      if (meteor.reflected) {
        ctx.strokeStyle = theme.paper;
        ctx.globalAlpha = clamp(meteor.life / 0.48, 0, 1);
        ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(meteor.x, 590); ctx.lineTo(trial.rift.x, trial.rift.y); ctx.stroke();
      }
    });
    ctx.restore();

    trial.salvage.seeds.forEach((seed) => {
      ctx.save();
      ctx.translate(seed.x, seed.y);
      ctx.globalAlpha = seed.state === "stolen" ? 0.62 + Math.sin(runtime.time * 12) * 0.25 : 0.94;
      ctx.rotate(runtime.time * (seed.state === "falling" ? 2.8 : 0.8));
      drawStarShape(0, 0, 15, seed.state === "stolen" ? theme.accent : theme.edge, theme.paper);
      ctx.restore();
    });

    if (trial.escort.active) {
      const escort = trial.escort;
      const target = trialAnchor(trial, escort.targetId);
      ctx.save();
      if (target) {
        ctx.strokeStyle = theme.edge;
        ctx.globalAlpha = 0.36;
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.moveTo(escort.x + escort.w / 2, escort.y + escort.h / 2);
        ctx.lineTo(target.x + target.w / 2, target.y + target.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (!escort.routeId) {
        [trialAnchor(trial, "west"), trialAnchor(trial, "east")].filter(Boolean).forEach((anchor, index) => {
          ctx.strokeStyle = index ? theme.accent : theme.edge;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = index ? 6 : 4;
          ctx.setLineDash(index ? [8, 7] : [18, 10]);
          ctx.beginPath(); ctx.moveTo(escort.x + escort.w / 2, escort.y + escort.h / 2); ctx.lineTo(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2); ctx.stroke();
        });
        ctx.setLineDash([]);
      }
      const seedPulse = 1 + Math.sin(runtime.time * 7) * 0.12;
      ctx.translate(escort.x + escort.w / 2, escort.y + escort.h / 2);
      ctx.scale(seedPulse, seedPulse);
      ctx.fillStyle = theme.edge;
      ctx.globalAlpha = 0.22;
      ctx.beginPath(); ctx.arc(0, 0, 31, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      paperPolygon([[0, -18], [16, -3], [10, 17], [0, 22], [-10, 17], [-16, -3]], theme.paper, theme.ink, 3);
      ctx.fillStyle = theme.accent;
      ctx.beginPath(); ctx.arc(0, 2, 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    trial.anchors.forEach((anchor) => {
      const expected = trialExpectedAnchor(trial)?.id === anchor.id;
      const completed = trial.route.slice(0, trial.routeProgress).includes(anchor.id);
      const jammed = anchor.jammed > 0;
      const repairNode = trial.repairNodes.find((node) => node.id === anchor.id);
      const pulse = 1 + Math.sin(runtime.time * 5 + anchor.index) * 0.08;
      const centerX = anchor.x + anchor.w / 2;
      const feetY = anchor.y + anchor.h;
      drawMechanismFrame("constellationAnchor", centerX, feetY, 90 * pulse, 132 * pulse, theme, {
        active: expected || completed,
        alpha: jammed ? 0.72 : expected ? 1 : completed ? 0.88 : 0.56,
      });
      ctx.save();
      ctx.translate(centerX, feetY - 68);
      if (expected && !jammed) {
        ctx.strokeStyle = theme.paper;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 42 + Math.sin(runtime.time * 6) * 5, 0, Math.PI * 2); ctx.stroke();
        drawTrialActionGlyph(trial.routeActions[trial.routeProgress] || "touch", 0, -58, theme, 0.86);
      }
      const nodeCount = Math.min(3, anchor.index + 1);
      ctx.strokeStyle = completed ? theme.paper : theme.edge;
      ctx.fillStyle = jammed ? theme.accent : theme.paper;
      ctx.globalAlpha = jammed ? 0.78 : 0.9;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < nodeCount; i += 1) {
        const angle = -Math.PI / 2 + (i - (nodeCount - 1) / 2) * 0.86;
        const x = Math.cos(angle) * 22;
        const y = Math.sin(angle) * 22;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i < nodeCount; i += 1) {
        const angle = -Math.PI / 2 + (i - (nodeCount - 1) / 2) * 0.86;
        ctx.beginPath(); ctx.arc(Math.cos(angle) * 22, Math.sin(angle) * 22, 4.5, 0, Math.PI * 2); ctx.fill();
      }
      if (jammed) {
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-25, -24); ctx.lineTo(24, 23); ctx.moveTo(22, -27); ctx.lineTo(-20, 26); ctx.stroke();
      }
      if (trialActiveTask(trial) === "repair" && repairNode) {
        const ratio = clamp(repairNode.charge / repairNode.required, 0, 1);
        ctx.strokeStyle = ratio >= 1 ? theme.paper : theme.edge;
        ctx.globalAlpha = 0.82;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(0, 0, 49, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.stroke();
        drawTrialActionGlyph(repairNode.requiredAction, 0, 56, theme, 0.68);
      }
      ctx.restore();
    });

    if (trial.rift.active) {
      ctx.save();
      ctx.translate(trial.rift.x, trial.rift.y);
      const tear = 1 + Math.sin(runtime.time * 4.6) * 0.08;
      ctx.scale(tear, 1 / tear);
      ctx.fillStyle = trial.rift.hitFlash > 0 ? theme.paper : theme.ink;
      ctx.strokeStyle = trial.rift.armed ? theme.edge : theme.accent2;
      ctx.globalAlpha = 0.88;
      ctx.lineWidth = trial.rift.armed ? 9 : 6;
      ctx.beginPath();
      ctx.moveTo(0, -58); ctx.quadraticCurveTo(50, -22, 24, 18); ctx.quadraticCurveTo(0, 64, -24, 18); ctx.quadraticCurveTo(-50, -22, 0, -58);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = theme.accent;
      ctx.beginPath(); ctx.arc(0, 0, 11 + (trial.rift.maxHp - trial.rift.hp) * 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    if (trial.phaseTask === "siege" && trial.siege.elite.spawned && !trial.siege.elite.defeated) {
      const elite = trial.siege.elite;
      ctx.save();
      ctx.translate(elite.x + elite.w / 2, elite.y + elite.h / 2);
      ctx.globalAlpha = elite.hitFlash > 0 ? 0.62 : 0.96;
      paperPolygon([[-54, 62], [-68, -24], [-24, -72], [0, -48], [24, -72], [68, -24], [54, 62], [0, 78]], theme.ink, theme.accent, 6);
      ctx.fillStyle = theme.edge;
      ctx.beginPath(); ctx.arc(0, -8, 22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(0, -8, 39 + Math.sin(runtime.time * 5) * 3, 0, Math.PI * 2); ctx.stroke();
      drawTrialActionGlyph(elite.shieldAction, 0, -8, theme, 0.78);
      ctx.restore();
    }

    ctx.save();
    const pulse = 1 + Math.sin(runtime.time * 3.2) * 0.045;
    ctx.translate(core.x + core.w / 2, core.y + core.h / 2);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = core.hitFlash > 0 ? 0.68 : 0.24;
    ctx.fillStyle = core.hitFlash > 0 ? theme.accent : theme.edge;
    ctx.beginPath();
    ctx.arc(0, 0, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = theme.paper;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 42, runtime.time * 0.7, runtime.time * 0.7 + Math.PI * 1.55);
    ctx.stroke();
    if (core.shield > 0) {
      ctx.strokeStyle = theme.accent2;
      ctx.lineWidth = 5 + Math.min(5, core.shield);
      ctx.globalAlpha = 0.72;
      ctx.beginPath(); ctx.arc(0, 0, 58 + Math.sin(runtime.time * 4) * 3, 0, Math.PI * 2); ctx.stroke();
    }
    paperPolygon([[0, -52], [29, -10], [16, 43], [0, 57], [-16, 43], [-29, -10]], theme.edge, theme.ink, 5);
    ctx.fillStyle = theme.paper;
    ctx.beginPath();
    ctx.arc(0, -8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (trial.activeEvent) {
      ctx.save();
      ctx.translate(cameraX + VIEW_W / 2, 92);
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.82;
      ctx.beginPath(); ctx.roundRect(-176, -28, 352, 56, 18); ctx.fill();
      ctx.strokeStyle = theme.edge;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = theme.paper;
      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.font = "700 20px system-ui, sans-serif";
      ctx.fillText(`${trial.activeEvent.glyph || "✦"} ${trial.activeEvent.name}${trial.activeEvent.pendingChoice ? " · 西/东二选一" : ""}`, 0, 7);
      ctx.restore();
    }

    [34, currentLevel.worldWidth - 34].forEach((x, index) => {
      ctx.save();
      ctx.strokeStyle = index ? "#9c63ff" : "#65e2df";
      ctx.globalAlpha = 0.38 + Math.sin(runtime.time * 4 + index) * 0.12;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.ellipse(x, 500, 24, 92, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  function renderActFourFields(theme) {
    (runtime.devices.gravityZones || []).forEach((zone) => {
      if (!inCamera(Number(zone.x) || 0, Number(zone.w) || 0)) return;
      ctx.save();
      ctx.fillStyle = theme.accent2;
      ctx.globalAlpha = 0.07 + Math.sin(runtime.time * 2.2 + Number(zone.x) * 0.01) * 0.025;
      ctx.beginPath();
      ctx.roundRect(zone.x, zone.y, zone.w, zone.h, Math.min(80, zone.w * 0.12));
      ctx.fill();
      ctx.strokeStyle = theme.accent2;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 4;
      ctx.setLineDash([16, 18]);
      ctx.stroke();
      ctx.restore();
    });
  }

  function renderActFiveFields(theme) {
    runtime.platforms.filter((platform) => (platform.foldGroup || platform.pagePhase) && !isPlatformActive(platform)).forEach((platform) => {
      if (!inCamera(platform.x, platform.w, 80)) return;
      ctx.save();
      ctx.strokeStyle = platform.foldGroup ? theme.accent : theme.accent2;
      ctx.globalAlpha = 0.24;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 12]);
      ctx.strokeRect(platform.x, platform.y, platform.w, platform.h);
      ctx.restore();
    });

    if (runtime.kiteTether.anchorId && runtime.kiteTether.timer > 0) {
      const anchor = runtime.kiteAnchors.find((entry) => entry.id === runtime.kiteTether.anchorId);
      if (anchor) {
        ctx.save();
        ctx.strokeStyle = theme.accent2;
        ctx.globalAlpha = 0.72;
        ctx.lineWidth = 5;
        ctx.setLineDash([14, 10]);
        ctx.beginPath();
        ctx.moveTo(player.x + player.w / 2, player.y + player.h / 2);
        ctx.lineTo(anchor.x + anchor.w / 2, anchor.y + anchor.h * 0.34);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function renderActSixFields(theme) {
    if (runtime.seams.length) {
      ctx.save();
      const inactiveColor = runtime.silhouetteLane === "foreground" ? theme.accent2 : theme.accent;
      ctx.fillStyle = inactiveColor;
      ctx.globalAlpha = 0.045;
      ctx.fillRect(cameraX, 0, VIEW_W, VIEW_H);
      ctx.restore();
    }

    runtime.weightSlots.forEach((slot) => {
      if (!inCamera(slot.x, slot.w, 80)) return;
      const occupants = runtime.weightBlocks.filter((weight) => weight.seatedSlotId === slot.id);
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.48;
      ctx.beginPath();
      ctx.roundRect(slot.x - 5, slot.y - 2, slot.w + 10, slot.h + 10, 12);
      ctx.fill();
      ctx.strokeStyle = occupants.length >= slot.capacity ? theme.accent2 : theme.accent;
      ctx.globalAlpha = 0.86;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(slot.x + 8, slot.y + 4);
      ctx.quadraticCurveTo(slot.x + slot.w / 2, slot.y + slot.h + 13, slot.x + slot.w - 8, slot.y + 4);
      ctx.stroke();
      ctx.fillStyle = theme.paper;
      for (let index = 0; index < slot.capacity; index += 1) {
        const x = slot.x + slot.w * (index + 1) / (slot.capacity + 1);
        ctx.globalAlpha = index < occupants.length ? 0.78 : 0.2;
        ctx.beginPath(); ctx.arc(x, slot.y + slot.h - 4, 4.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });

    runtime.weightBlocks.forEach((weight) => {
      if (!inCamera(weight.x, weight.w, 80)) return;
      const cx = weight.x + weight.w / 2;
      const cy = weight.y + weight.h / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.ellipse(6, weight.h * 0.42, weight.w * 0.48, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      paperPolygon([
        [-weight.w * 0.42, weight.h * 0.34],
        [-weight.w * 0.48, -weight.h * 0.18],
        [-weight.w * 0.24, -weight.h * 0.43],
        [weight.w * 0.24, -weight.h * 0.43],
        [weight.w * 0.48, -weight.h * 0.18],
        [weight.w * 0.42, weight.h * 0.34],
      ], weight.seatedSlotId ? theme.accent2 : theme.accent, theme.ink, 4);
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 2.5;
      for (let ring = 0; ring < weight.mass; ring += 1) {
        ctx.beginPath();
        ctx.arc(0, 1, 8 + ring * 7, -Math.PI * 0.85, Math.PI * 0.35);
        ctx.stroke();
      }
      ctx.restore();
    });

    runtime.scaleBridges.forEach((bridge) => {
      const platform = runtime.platforms.find((entry) => entry.id === bridge.platformId);
      if (!platform || !inCamera(platform.x, platform.w, 90)) return;
      const centerX = platform.x + platform.w / 2;
      ctx.save();
      ctx.strokeStyle = bridge.balanced ? theme.accent2 : theme.accent;
      ctx.globalAlpha = bridge.balanced ? 0.78 : 0.42;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(centerX, platform.y); ctx.lineTo(centerX, platform.y - 72); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX - 78, platform.y - 48 - bridge.delta * 5);
      ctx.lineTo(centerX + 78, platform.y - 48 + bridge.delta * 5);
      ctx.stroke();
      drawStarShape(centerX, platform.y - 74, bridge.balanced ? 13 : 9, bridge.balanced ? theme.paper : theme.accent, theme.ink);
      ctx.restore();
    });

    runtime.seams.forEach((seam) => {
      if (!inCamera(seam.x, seam.w, 80)) return;
      const available = String(seam.from) === runtime.silhouetteLane;
      const centerX = seam.x + seam.w / 2;
      ctx.save();
      ctx.strokeStyle = available ? theme.accent2 : theme.paper;
      ctx.globalAlpha = available ? 0.82 : 0.2;
      ctx.lineWidth = available ? 7 : 4;
      ctx.setLineDash([18, 11]);
      ctx.beginPath();
      for (let y = seam.y; y <= seam.y + seam.h; y += 20) {
        const x = centerX + Math.sin(y * 0.06 + runtime.time * 3.2) * 13;
        if (y === seam.y) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      for (let y = seam.y + 24; y < seam.y + seam.h; y += 54) {
        ctx.beginPath();
        ctx.moveTo(centerX - 20, y - 8); ctx.lineTo(centerX + 20, y + 8);
        ctx.moveTo(centerX + 20, y - 8); ctx.lineTo(centerX - 20, y + 8);
        ctx.stroke();
      }
      ctx.restore();
    });

    runtime.stitchBridges.forEach((bridge, bridgeIndex) => {
      const alpha = clamp(bridge.life / Math.min(1.2, bridge.maxLife), 0.12, 1);
      bridge.segments.forEach((segment, index) => {
        if (!inCamera(segment.x, segment.w, 80)) return;
        ctx.save();
        drawPlatformMaterial({ ...segment, material: "embroidered-thread", renderAlpha: alpha }, theme, bridgeIndex * 40 + index);
        ctx.restore();
      });
      ctx.save();
      ctx.strokeStyle = theme.paper;
      ctx.globalAlpha = alpha * 0.72;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      bridge.points.forEach((point, index) => { if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
      ctx.stroke();
      ctx.restore();
    });

    if (runtime.trajectory.recording && runtime.trajectory.points.length > 1) {
      ctx.save();
      ctx.strokeStyle = theme.accent2;
      ctx.globalAlpha = 0.74;
      ctx.lineWidth = 5;
      ctx.setLineDash([10, 9]);
      ctx.beginPath();
      runtime.trajectory.points.forEach((point, index) => { if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
      ctx.stroke();
      ctx.restore();
    }

    runtime.looms.forEach((loom) => {
      if (!inCamera(loom.x, loom.w, 80)) return;
      const cx = loom.x + loom.w / 2;
      const cy = loom.y + loom.h / 2;
      ctx.save();
      ctx.strokeStyle = loom.active ? theme.accent2 : loom.completed ? theme.paper : theme.accent;
      ctx.globalAlpha = loom.completed ? 0.8 : 0.64;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(cx, cy, loom.w * 0.46, loom.h * 0.48, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 2.5;
      for (let spoke = 0; spoke < 7; spoke += 1) {
        const angle = spoke / 7 * Math.PI * 2 + runtime.time * (loom.active ? 0.55 : 0.12);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * loom.w * 0.4, cy + Math.sin(angle) * loom.h * 0.42); ctx.stroke();
      }
      drawStarShape(cx, cy, loom.completed ? 12 : 8, loom.completed ? theme.accent2 : theme.paper, theme.ink);
      ctx.restore();
    });

    runtime.dragonKnots.forEach((knot) => {
      if (!inCamera(knot.x, knot.w, 80)) return;
      ctx.save();
      ctx.translate(knot.x + knot.w / 2, knot.y + knot.h / 2);
      ctx.rotate(Math.sin(runtime.time * 2.2 + knot.index) * 0.08);
      const fill = knot.active ? theme.accent2 : theme.accent;
      paperPolygon([[-28, 9], [-18, -15], [0, -22], [22, -12], [30, 10], [0, 20]], fill, theme.ink, 4);
      ctx.strokeStyle = theme.paper;
      ctx.globalAlpha = knot.active ? 0.9 : 0.48 + Math.sin(runtime.time * 7 + knot.index) * 0.18;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-15, 6); ctx.quadraticCurveTo(0, -13, 17, 5); ctx.stroke();
      ctx.restore();
    });
  }

  function renderActSevenFields(theme) {
    runtime.rails.forEach((rail) => {
      if (!rail.points.length || !rail.points.some((point) => inCamera(point.x, 1, 120))) return;
      ctx.save();
      ctx.strokeStyle = theme.ink;
      ctx.globalAlpha = 0.62;
      ctx.lineWidth = 15;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      rail.points.forEach((point, index) => { if (index === 0) ctx.moveTo(point.x, point.y + 14); else ctx.lineTo(point.x, point.y + 14); });
      ctx.stroke();
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.82;
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 13]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    runtime.searchlights.forEach((light) => {
      if (!inCamera(light.pivotX - light.radius, light.radius * 2, 80)) return;
      const leftAngle = light.currentAngle - light.halfAngle;
      const rightAngle = light.currentAngle + light.halfAngle;
      ctx.save();
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.105;
      ctx.beginPath();
      ctx.moveTo(light.pivotX, light.pivotY);
      ctx.lineTo(light.pivotX + Math.cos(leftAngle) * light.radius, light.pivotY + Math.sin(leftAngle) * light.radius);
      ctx.arc(light.pivotX, light.pivotY, light.radius, leftAngle, rightAngle);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.45 + Math.sin(runtime.time * 6 + light.index) * 0.1;
      ctx.lineWidth = 3;
      ctx.stroke();
      drawStarShape(light.pivotX, light.pivotY, 18, theme.accent, theme.ink);
      ctx.restore();
    });

    runtime.shadowScreens.forEach((screen) => {
      if (!inCamera(screen.x, screen.w, 120)) return;
      const centerX = screen.x + screen.w / 2;
      const centerY = screen.y + screen.h / 2;
      runtime.searchlights.forEach((light) => {
        const dx = centerX - light.pivotX;
        const dy = centerY - light.pivotY;
        const length = Math.hypot(dx, dy) || 1;
        const angularWidth = Math.atan2(Math.max(screen.w, screen.h) * 0.5, length);
        if (length > light.radius || Math.abs(angleDifference(Math.atan2(dy, dx), light.currentAngle)) > light.halfAngle + angularWidth) return;
        const extendX = dx / length * 620;
        const extendY = dy / length * 620;
        ctx.save();
        ctx.fillStyle = theme.ink;
        ctx.globalAlpha = 0.17;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(screen.x + screen.w, screen.y);
        ctx.lineTo(screen.x + screen.w + extendX, screen.y + extendY);
        ctx.lineTo(screen.x + extendX, screen.y + extendY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    });
  }

  function renderActSevenOverlay(theme) {
    if (!runtime?.searchlights?.length) return;
    const grace = Math.max(0.2, Number(runtime.devices.exposure?.grace) || 1.2);
    const ratio = clamp(runtime.shadowExposure / grace, 0, 1);
    if (ratio <= 0) return;
    ctx.save();
    ctx.fillStyle = theme.danger;
    ctx.globalAlpha = ratio * (runtime.shadowLit ? 0.13 : 0.055);
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.strokeStyle = runtime.shadowLit ? theme.danger : theme.accent2;
    ctx.globalAlpha = 0.52 + ratio * 0.36;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(38, 96);
    ctx.lineTo(38 + (VIEW_W - 76) * ratio, 96);
    ctx.stroke();
    ctx.restore();
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
    // Background atlases are finite. Only use an explicitly declared level
    // frame so adding a stage can never sample outside an older 2x2 sheet.
    const frame = frameSpec("levelBackgroundFrames", String(currentLevel.id), null);
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
      layerCtx.globalAlpha = currentLevel.act === 7 ? 0.74 : 0.82;
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
    runtime.platforms.forEach((platform, index) => {
      const active = isPlatformActive(platform);
      const polarityPreview = Boolean(platform.polarity) && !active && platform.brokenTimer <= 0;
      const lanePreview = !isLaneEntityActive(platform) && platform.brokenTimer <= 0;
      if (!active && !polarityPreview && !lanePreview) return;
      if (!inCamera(platform.x, platform.w)) return;
      ctx.save();
      if (lanePreview) ctx.filter = inactiveLaneFilter();
      if (platform.fragile && platform.breakTimer > 0) {
        ctx.translate(Math.sin(runtime.time * 52 + platform.phase) * 2.2, 0);
      }
      drawPlatformMaterial(polarityPreview || lanePreview ? { ...platform, renderAlpha: lanePreview ? 1 : 0.32 } : platform, theme, index);
      ctx.restore();
    });
  }

  function platformFamily(platform) {
    const value = `${platform.material || ""} ${platform.type || ""}`.toLowerCase();
    if (["spring", "fungus", "lumen"].some((token) => value.includes(token))) return "spring";
    if (value.includes("cloud")) return "cloud";
    if (["kite", "cloth", "red-cargo", "vellum", "lacquer", "awning"].some((token) => value.includes(token))) return "cloth";
    if (["crystal", "mica", "glass", "ghost"].some((token) => value.includes(token))) return "crystal";
    if (["grass", "soil", "pressed", "moss", "leaf", "fiber", "root", "miniature", "dew"].some((token) => value.includes(token))) return "grass";
    if (["brass", "gear", "belt", "star-", "mirror", "orbit", "foil"].some((token) => value.includes(token))) return "brass";
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
      spring: [theme.mid, theme.ground, theme.edge],
      stone: [theme.ground, theme.mid, theme.edge],
    }[family];
    const renderAlpha = clamp(Number(platform.renderAlpha) || 1, 0.08, 1);

    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = 0.42 * renderAlpha;
    ctx.fillRect(x + 7, y + 9, w, h);
    ctx.globalAlpha = (platform.hidden && !runtime.hiddenRevealed ? 0.48 : 1) * renderAlpha;
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
      ctx.globalAlpha = 0.13 * renderAlpha;
      ctx.fillStyle = paperPattern;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }

    if (family === "spring") {
      ctx.fillStyle = theme.edge;
      for (let px = x + 16; px < x + w - 8; px += 28) {
        const pulse = Math.sin(runtime.time * 5 + px * 0.03) * 3;
        ctx.beginPath();
        ctx.ellipse(px, y + 2 + pulse, 12, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = theme.paper;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let px = x + 10; px <= x + w - 10; px += 12) {
        const py = y + capH + (Math.floor((px - x) / 12) % 2 ? 11 : 2);
        if (px === x + 10) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (family === "grass") {
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
      ctx.globalAlpha = renderAlpha;
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

    ctx.globalAlpha = renderAlpha;
    if (platform.type === "conveyor" || platform.conveyor) {
      ctx.fillStyle = theme.paper;
      ctx.globalAlpha = 0.62 * renderAlpha;
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
    if (platform.polarity) {
      ctx.globalAlpha = 0.78 * renderAlpha;
      ctx.fillStyle = platform.polarity === "sun" ? theme.edge : theme.ink;
      const markerX = x + Math.min(w - 15, 22);
      const markerY = y + Math.min(h - 8, 18);
      ctx.beginPath();
      ctx.arc(markerX, markerY, 7, 0, Math.PI * 2);
      ctx.fill();
      if (platform.polarity === "moon") {
        ctx.fillStyle = theme.paper;
        ctx.beginPath();
        ctx.arc(markerX + 3, markerY - 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function renderHazards(theme) {
    runtime.hazards.forEach((hazard) => {
      if (!inCamera(hazard.x, hazard.w)) return;
      ctx.save();
      if (!isLaneEntityActive(hazard)) ctx.filter = inactiveLaneFilter();
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
      ctx.restore();
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

  function drawMechanismFrame(name, x, feetY, width, height, theme, options = {}) {
    const frame = frameSpec("deviceFrames", name, DEFAULT_DEVICE_FRAMES[name]);
    const active = Boolean(options.active);
    ctx.save();
    ctx.fillStyle = active ? theme.edge : theme.ground;
    ctx.globalAlpha = active ? 0.2 : 0.26;
    ctx.beginPath();
    ctx.ellipse(x, feetY + 2, width * 0.34, Math.max(5, height * 0.045), 0, 0, Math.PI * 2);
    ctx.fill();
    if (active) {
      const glow = ctx.createRadialGradient(x, feetY - height * 0.42, 2, x, feetY - height * 0.42, width * 0.52);
      glow.addColorStop(0, theme.edge);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.2 + Math.sin(runtime.time * 4) * 0.04;
      ctx.beginPath();
      ctx.ellipse(x, feetY - height * 0.42, width * 0.52, height * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = Number(options.alpha ?? 1);
    ctx.shadowColor = active ? theme.edge : theme.far;
    ctx.shadowBlur = active ? 13 : 5;
    ctx.shadowOffsetY = 3;
    const drawn = drawAtlasFrame(frame, x, feetY, width, height, {
      anchorX: 0.5,
      anchorY: Number(options.anchorY ?? 0.92),
      flipX: Boolean(options.flipX),
    });
    ctx.restore();
    if (drawn) return true;

    ctx.save();
    ctx.translate(x, feetY - height * 0.42);
    drawGear(0, 0, Math.min(width, height) * 0.22, active ? theme.edge : theme.paper, runtime.time * (active ? 1.8 : 0.2));
    ctx.restore();
    return false;
  }

  function drawMechanismArc(x, y, radius, ratio, theme, active) {
    ctx.save();
    ctx.strokeStyle = active ? theme.paper : theme.accent2;
    ctx.globalAlpha = active ? 0.9 : 0.58;
    ctx.lineWidth = active ? 5 : 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(ratio, 0.04, 1));
    ctx.stroke();
    ctx.restore();
  }

  function renderDevices(theme) {
    runtime.objectives.forEach((objective) => {
      if (objective.type === "repair-zones") objective.zones.forEach((zone) => {
        if (!inCamera(zone.x, zone.w)) return;
        const centerX = zone.x + zone.w / 2;
        const feetY = zone.y + zone.h;
        const drawW = clamp(zone.w * 1.5, 112, 138);
        const drawH = clamp(zone.h * 1.18, 150, 208);
        drawMechanismFrame("tideRepair", centerX, feetY, drawW, drawH, theme, {
          active: zone.repaired,
          alpha: zone.repaired ? 1 : 0.78,
        });
        ctx.save();
        ctx.strokeStyle = zone.repaired ? theme.paper : theme.accent2;
        ctx.globalAlpha = zone.repaired ? 0.72 : 0.42;
        ctx.lineWidth = zone.repaired ? 5 : 3;
        if (!zone.repaired) ctx.setLineDash([7, 9]);
        ctx.beginPath();
        ctx.arc(centerX, feetY - drawH * 0.43, 34 + Math.sin(runtime.time * 3 + zone.index) * 3, -0.2, Math.PI * 1.72);
        ctx.stroke();
        ctx.setLineDash([]);
        if (zone.repaired) {
          ctx.strokeStyle = theme.accent2;
          ctx.lineWidth = 4;
          for (let i = -1; i <= 1; i += 1) {
            ctx.globalAlpha = 0.34 + i * 0.04;
            ctx.beginPath();
            ctx.moveTo(centerX + i * 12, feetY - 55);
            ctx.quadraticCurveTo(centerX - i * 7, feetY - 32, centerX + i * 10, feetY - 8);
            ctx.stroke();
          }
        }
        ctx.restore();
      });
      if (objective.type === "reflect-reactor") objective.reactors.forEach((reactor) => {
        if (!inCamera(reactor.x, reactor.w)) return;
        const ratio = clamp(reactor.charge / reactor.requiredCharge, 0, 1);
        const centerX = reactor.x + reactor.w / 2;
        const feetY = reactor.y + reactor.h + 13;
        drawMechanismFrame("auroraReactor", centerX, feetY, 112, 150, theme, { active: reactor.powered || ratio > 0 });
        ctx.save();
        const litSegments = Math.ceil(ratio * 4);
        for (let i = 0; i < 4; i += 1) {
          const y = feetY - 111 + i * 20;
          ctx.fillStyle = i >= 4 - litSegments ? (reactor.powered ? theme.paper : theme.edge) : theme.ink;
          ctx.globalAlpha = i >= 4 - litSegments ? 0.92 : 0.38;
          ctx.beginPath();
          ctx.moveTo(centerX, y - 5); ctx.lineTo(centerX + 5, y); ctx.lineTo(centerX, y + 5); ctx.lineTo(centerX - 5, y); ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });
    });
    runtime.crystals.forEach((crystal) => { if (inCamera(crystal.x, crystal.w)) drawCrystal(crystal.x + crystal.w / 2, crystal.y + crystal.h, crystal.active ? theme.edge : theme.far, crystal.active); });
    runtime.switches.forEach((device) => {
      if (!inCamera(device.x, device.w)) return;
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.beginPath(); ctx.roundRect(device.x - 4, device.y + device.h * 0.42, device.w + 8, device.h * 0.62, 7); ctx.fill();
      drawGear(device.x + device.w / 2, device.y + device.h / 2, 25, device.active ? theme.edge : theme.paper, runtime.time * (device.active ? 3 : 0.4));
      ctx.restore();
    });
    runtime.polaritySwitches.forEach((device) => {
      if (!inCamera(device.x, device.w)) return;
      const sun = runtime.polarity.current === "sun";
      const centerX = device.x + device.w / 2;
      const feetY = device.y + device.h + 10;
      drawMechanismFrame("polarityDial", centerX, feetY, 104, 116, theme, { active: true });
      ctx.save();
      ctx.translate(centerX, feetY - 63);
      ctx.rotate(sun ? -0.72 : 0.72);
      ctx.strokeStyle = theme.accent2;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -24); ctx.stroke();
      ctx.fillStyle = theme.paper;
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(6, -20); ctx.lineTo(-6, -20); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    runtime.relays.forEach((relay) => {
      if (!inCamera(relay.x, relay.w)) return;
      const ratio = relay.active ? clamp(relay.timer / Math.max(0.5, Number(relay.duration) || 8), 0, 1) : 0;
      const centerX = relay.x + relay.w / 2;
      const feetY = relay.y + relay.h + 12;
      const relayPolarity = relay.polarity || (relay.index % 2 ? "moon" : "sun");
      drawMechanismFrame(relayPolarity === "moon" ? "moonRelay" : "sunRelay", centerX, feetY, 96, 124, theme, {
        active: relay.active || relay.polarity === runtime.polarity.current,
        alpha: relay.active ? 1 : 0.8,
      });
      drawMechanismArc(centerX, feetY - 66, 31, relay.active ? ratio : 0.08, theme, relay.active);
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
    runtime.timeAnchors.forEach((anchor) => {
      if (!inCamera(anchor.x, anchor.w)) return;
      ctx.save(); ctx.translate(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2);
      ctx.fillStyle = anchor.active ? theme.accent2 : theme.ink;
      ctx.strokeStyle = anchor.active ? theme.paper : theme.accent2;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(0, 0, 23, 31, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.rotate(runtime.time * (anchor.active ? 0.15 : 1.2));
      ctx.beginPath(); ctx.moveTo(0, -23); ctx.lineTo(0, 23); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke();
      if (anchor.active) {
        ctx.globalAlpha = 0.18; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(0, 0, Number(anchor.radius) || 650, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    });
    runtime.echoPads.forEach((pad) => {
      if (!inCamera(pad.x, pad.w)) return;
      const complete = Boolean(runtime.echoPairs[pad.group]);
      const centerX = pad.x + pad.w / 2;
      const feetY = pad.y + pad.h + 9;
      drawMechanismFrame("echoPad", centerX, feetY, pad.w * 1.22, 96, theme, { active: complete || pad.active, anchorY: 0.91 });
      ctx.save();
      ctx.strokeStyle = complete ? theme.paper : pad.active ? theme.edge : theme.accent2;
      ctx.lineWidth = complete ? 5 : 3;
      ctx.globalAlpha = complete ? 0.86 : 0.52;
      const spread = 18 + Math.sin(runtime.time * 4 + pad.index) * 4;
      ctx.beginPath(); ctx.ellipse(centerX - spread, pad.y + 5, 13, 6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(centerX + spread, pad.y + 5, 13, 6, 0, 0, Math.PI * 2); ctx.stroke();
      if (complete) {
        ctx.beginPath(); ctx.moveTo(centerX - spread + 11, pad.y + 5); ctx.lineTo(centerX + spread - 11, pad.y + 5); ctx.stroke();
      }
      ctx.restore();
    });
    runtime.gravityAnchors.forEach((anchor) => {
      if (!runtime.boss?.active || !inCamera(anchor.x, anchor.w, 100)) return;
      ctx.save(); ctx.translate(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2);
      ctx.rotate(runtime.time * (anchor.index % 2 ? -1.8 : 1.8));
      drawStarShape(0, 0, 25, anchor.active ? theme.edge : theme.ink, anchor.active ? theme.paper : theme.accent2);
      ctx.strokeStyle = anchor.active ? theme.edge : theme.accent2; ctx.globalAlpha = 0.45; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 34 + Math.sin(runtime.time * 4 + anchor.index) * 4, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      if (anchor.active && runtime.boss) {
        ctx.save(); ctx.strokeStyle = theme.edge; ctx.globalAlpha = 0.32; ctx.lineWidth = 4; ctx.setLineDash([10, 12]);
        ctx.beginPath(); ctx.moveTo(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2); ctx.lineTo(runtime.boss.x + runtime.boss.w / 2, runtime.boss.y + runtime.boss.h / 2); ctx.stroke(); ctx.restore();
      }
    });

    runtime.foldPanels.forEach((panel) => {
      if (!inCamera(panel.x, panel.w, 80)) return;
      const matched = runtime.foldStates[panel.group] === Number(panel.targetState);
      ctx.save();
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.fillStyle = theme.ink;
      ctx.strokeStyle = matched ? theme.accent2 : theme.accent;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-panel.w * 0.42, -panel.h * 0.42); ctx.lineTo(panel.w * 0.42, 0); ctx.lineTo(-panel.w * 0.42, panel.h * 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(0, -panel.h * 0.34); ctx.lineTo(0, panel.h * 0.34); ctx.stroke();
      ctx.restore();
    });

    runtime.kiteAnchors.forEach((anchor) => {
      if (!inCamera(anchor.x, anchor.w, 100)) return;
      const active = runtime.kiteTether.anchorId === anchor.id && runtime.kiteTether.timer > 0;
      ctx.save();
      ctx.translate(anchor.x + anchor.w / 2, anchor.y + anchor.h * 0.34);
      ctx.rotate(Math.sin(runtime.time * 2.2 + anchor.index) * 0.08);
      paperPolygon([[0, -38], [30, 0], [0, 42], [-30, 0]], active ? theme.accent2 : theme.paper, theme.ink, 4);
      ctx.strokeStyle = active ? theme.accent : theme.accent2;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 42); ctx.quadraticCurveTo(24, 66, -5, 88); ctx.stroke();
      ctx.restore();
    });

    runtime.foldTraps.forEach((trap) => {
      if (!inCamera(trap.x, trap.w, 80)) return;
      const targeted = runtime.boss?.targetTrapId === trap.id && ["fold-telegraph", "fold-dive"].includes(runtime.boss?.state);
      const centerX = trap.x + trap.w / 2;
      const feetY = trap.y + trap.h + 12;
      drawMechanismFrame("foldTrap", centerX, feetY, trap.w * 1.04, 122, theme, { active: trap.armed || targeted, anchorY: 0.92 });
      ctx.save();
      ctx.strokeStyle = trap.armed ? theme.accent2 : targeted ? theme.accent : theme.paper;
      ctx.globalAlpha = trap.armed || targeted ? 0.9 : 0.42;
      ctx.lineWidth = targeted ? 6 : 3;
      ctx.setLineDash([14, 10]);
      ctx.beginPath(); ctx.moveTo(trap.x + 18, trap.y + trap.h * 0.64); ctx.lineTo(trap.x + trap.w - 18, trap.y + trap.h * 0.64); ctx.stroke();
      if (trap.armed) {
        ctx.fillStyle = theme.accent2;
        ctx.globalAlpha = 0.18;
        ctx.beginPath(); ctx.moveTo(trap.x + 14, trap.y); ctx.lineTo(centerX, trap.y - 116); ctx.lineTo(trap.x + trap.w - 14, trap.y); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    });

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
    runtime.growthLenses.forEach((lens) => {
      if (!inCamera(lens.x, lens.w, 80)) return;
      const active = lens.cooldown > 0;
      drawMechanismFrame("dewLens", lens.x + lens.w / 2, lens.y + lens.h + 10, 104, 132, theme, { active, alpha: active ? 1 : 0.9 });
      ctx.save();
      ctx.strokeStyle = runtime.growthForm === "small" ? theme.accent2 : theme.accent;
      ctx.globalAlpha = 0.42 + Math.sin(runtime.time * 4 + lens.index) * 0.12;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(lens.x + lens.w / 2, lens.y + lens.h * 0.43, runtime.growthForm === "small" ? 16 : 27, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
    runtime.narrowPassages.forEach((passage) => {
      if (!inCamera(passage.x, passage.w, 80)) return;
      const barrier = narrowBarrierRect(passage);
      drawMechanismFrame("fiberIris", barrier.x + barrier.w / 2, passage.y + passage.h, 116, passage.h + 44, theme, {
        active: runtime.growthForm !== "small",
        alpha: runtime.growthForm === "small" ? 0.32 : 0.94,
      });
    });
    runtime.waxSeals.forEach((seal) => {
      if (seal.broken || !inCamera(seal.x, seal.w, 80)) return;
      ctx.save();
      ctx.translate(seal.x + seal.w / 2, seal.y + seal.h / 2);
      const pulse = 1 + Math.sin(runtime.time * 3.2 + seal.index) * 0.035;
      ctx.scale(pulse, pulse);
      paperPolygon([[-seal.w * 0.48, seal.h * 0.48], [-seal.w * 0.52, -seal.h * 0.3], [-seal.w * 0.22, -seal.h * 0.5], [seal.w * 0.3, -seal.h * 0.46], [seal.w * 0.5, -seal.h * 0.12], [seal.w * 0.46, seal.h * 0.48]], theme.accent, theme.ink, 5);
      ctx.strokeStyle = theme.paper;
      ctx.globalAlpha = 0.74;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 5, 17, 0, Math.PI * 2); ctx.stroke();
      drawStarShape(0, 5, 11, theme.paper, theme.ink);
      ctx.restore();
    });
    runtime.railJunctions.forEach((junction) => {
      if (!inCamera(junction.x, junction.w, 90)) return;
      drawMechanismFrame("railJunction", junction.x + junction.w / 2, junction.y + junction.h + 4, 136, 158, theme, { active: junction.cooldown > 0 });
      const selectedIndex = Math.max(0, junction.options.findIndex((option) => option.rail === junction.selectedRail));
      const direction = junction.options[selectedIndex]?.input === "down" ? 0.72 : junction.options[selectedIndex]?.input === "up" ? -0.72 : 0;
      ctx.save();
      ctx.translate(junction.x + junction.w / 2, junction.y + junction.h * 0.5);
      ctx.rotate(direction);
      ctx.strokeStyle = theme.accent2;
      ctx.globalAlpha = 0.82;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(28, 0); ctx.moveTo(16, -10); ctx.lineTo(30, 0); ctx.lineTo(16, 10); ctx.stroke();
      ctx.restore();
    });
    runtime.railStations.forEach((station) => {
      if (!inCamera(station.x, station.w, 90)) return;
      drawMechanismFrame("railStation", station.x + station.w / 2, station.y + station.h + 10, 148, 166, theme, { active: station.visited, alpha: station.visited ? 1 : 0.78 });
      ctx.save();
      ctx.strokeStyle = station.visited ? theme.accent2 : theme.accent;
      ctx.globalAlpha = station.visited ? 0.86 : 0.38;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(station.x + station.w / 2, station.y + station.h * 0.45, 32, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
    runtime.railCarts.forEach((cart) => {
      if (!inCamera(cart.x, cart.w, 90)) return;
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.beginPath(); ctx.roundRect(cart.x - 6, cart.y - 5, cart.w + 12, cart.h + 20, 13); ctx.fill();
      ctx.fillStyle = theme.accent;
      ctx.beginPath(); ctx.roundRect(cart.x, cart.y, cart.w, cart.h, 10); ctx.fill();
      ctx.strokeStyle = theme.paper;
      ctx.globalAlpha = 0.78;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cart.x + 18, cart.y + cart.h / 2); ctx.lineTo(cart.x + cart.w - 18, cart.y + cart.h / 2); ctx.stroke();
      drawStarShape(cart.x + cart.w / 2, cart.y + cart.h / 2, 9, theme.paper, theme.ink);
      ctx.restore();
    });
    runtime.shadowScreens.forEach((screen) => {
      if (!inCamera(screen.x, screen.w, 90)) return;
      drawMechanismFrame("lanternScreen", screen.x + screen.w / 2, screen.y + screen.h + 8, Math.max(116, screen.w * 1.45), screen.h + 56, theme, { active: runtime.shadowLit, alpha: 0.96 });
      ctx.save();
      ctx.strokeStyle = theme.accent2;
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(screen.x - 28, screen.y + screen.h); ctx.lineTo(screen.x + screen.w + 28, screen.y + screen.h); ctx.stroke();
      ctx.restore();
    });
    if (runtime.boss?.archetype === "scorewing-maestro" && inCamera(runtime.boss.arena.x + runtime.boss.arena.w / 2 - 90, 180, 120)) {
      const receptorX = runtime.boss.arena.x + runtime.boss.arena.w / 2;
      drawMechanismFrame("crownReceptor", receptorX, 622, 154, 180, theme, { active: runtime.capturedCrownShards >= scorewingRequiredShards(runtime.boss) });
    }
    if (runtime.boss?.archetype === "eclipse-observer" && runtime.mirrors.every((mirror) => mirror.active)) drawMirrorBeam(theme);
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
        ctx.save();
        if (!isLaneEntityActive(item)) ctx.filter = inactiveLaneFilter();
        drawCollectible(item, theme);
        ctx.restore();
      }
    });
  }

  function drawCollectibleBadge(type, theme) {
    const effect = COLLECTIBLE_EFFECTS[type];
    if (!effect) return;
    const fill = effect.mode === "health" ? theme.danger
      : effect.mode === "quest" || effect.mode === "boss-core" || effect.mode === "rune" ? theme.edge
        : effect.mode === "timed" ? theme.accent2
          : effect.mode === "charges" ? theme.accent
            : theme.paper;
    ctx.save();
    ctx.rotate(runtime.time * 0.36);
    ctx.strokeStyle = fill;
    ctx.globalAlpha = 0.48;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 13]);
    ctx.beginPath(); ctx.ellipse(0, 0, 29, 22, -0.35, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = fill;
    for (let i = 0; i < 2; i += 1) {
      ctx.rotate(Math.PI);
      ctx.beginPath();
      ctx.moveTo(0, -31); ctx.lineTo(4, -25); ctx.lineTo(0, -19); ctx.lineTo(-4, -25); ctx.closePath();
      ctx.fill();
    }
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

    if (type === "shadow-key") {
      drawMechanismFrame("shadowKeyAltar", 0, 34, 78, 92, theme, { active: true, anchorY: 0.78 });
      ctx.restore();
      return;
    }
    if (type === "scorewing-core") {
      drawMechanismFrame("crownReceptor", 0, 38, 88, 104, theme, { active: true, anchorY: 0.78 });
      drawStarShape(0, -7, 12, theme.paper, theme.ink);
      ctx.restore();
      return;
    }

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
    if (goal.type === "lantern-gate") {
      const ready = goalRequirementMet();
      const centerX = goal.x + goal.w / 2;
      const centerY = goal.y + goal.h * 0.48;
      const keyCount = runtime.collectibles.filter((item) => item.type === "shadow-key" && item.collected).length;
      drawMechanismFrame("lanternScreen", centerX, goal.y + goal.h + 10, goal.w * 1.34, goal.h + 68, theme, { active: ready, alpha: 0.98 });
      ctx.save();
      ctx.strokeStyle = ready ? theme.paper : theme.accent;
      ctx.fillStyle = ready ? theme.accent2 : theme.ink;
      ctx.globalAlpha = ready ? 0.58 + Math.sin(runtime.time * 4) * 0.08 : 0.52;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, goal.w * 0.2, goal.h * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let index = 0; index < 3; index += 1) {
        drawStarShape(centerX + (index - 1) * 27, goal.y + goal.h - 18, 8, index < keyCount ? theme.edge : theme.ground, theme.ink, 5);
      }
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(goal.x + goal.w / 2, goal.y + goal.h / 2);
    const repairObjective = objectiveByType("repair-zones");
    const repairProgress = objectiveProgress(repairObjective);
    ctx.rotate(Math.sin(runtime.time * 0.7) * 0.035);
    ctx.fillStyle = theme.ink;
    ctx.beginPath();
    ctx.roundRect(-goal.w / 2 - 6, -goal.h / 2 + 5, goal.w + 12, goal.h + 8, 12);
    ctx.fill();
    ctx.fillStyle = theme.edge;
    ctx.beginPath();
    ctx.roundRect(-goal.w / 2 + 4, -goal.h / 2 + 8, goal.w - 8, goal.h - 12, 9);
    ctx.fill();
    if (repairObjective) {
      ctx.fillStyle = repairProgress.progress >= repairProgress.required ? theme.accent2 : theme.far;
      ctx.globalAlpha = 0.34;
      ctx.beginPath(); ctx.arc(0, 4, Math.max(goal.w, goal.h) * 0.5 + Math.sin(runtime.time * 2) * 8, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
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
      for (let x = cameraX + 20; x < cameraX + VIEW_W; x += 80) {
        ctx.beginPath();
        ctx.arc(x, runtime.lavaY + Math.sin(x + runtime.time) * 12, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (runtime.pageTurn?.active) {
      const front = runtime.pageTurn.inkX;
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(front, -40);
      for (let y = -40; y <= VIEW_H + 40; y += 36) {
        ctx.lineTo(front + Math.sin(y * 0.045 + runtime.time * 5.5) * 22, y);
      }
      ctx.lineTo(currentLevel.worldWidth + 300, VIEW_H + 40);
      ctx.lineTo(currentLevel.worldWidth + 300, -40);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.88;
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (let y = -40; y <= VIEW_H + 40; y += 24) {
        const x = front + Math.sin(y * 0.045 + runtime.time * 5.5) * 22;
        if (y === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
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

  function renderDarkness() {
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
    if (state.hurtTime > 0 && Math.floor(state.hurtTime * 28) % 2 === 0) return;
    const running = Math.min(1, Math.abs(vx || 0) / 260);
    const bob = Math.sin(time * (running ? 13 : 3)) * (running ? 3 : 1.8);
    const stretch = state.dashTime > 0 ? 1.18 : 1;
    const squash = state.onGround === false && state.vy > 350 ? 0.92 : 1;
    let action = "idle";
    if (state.hurtTime > 0) action = "hurt";
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
    const frameType = type === "lens-beetle" && enemy.state === "small" ? "lens-beetle-small"
      : type === "rail-wisp" && (enemy.state === "rail-telegraph" || enemy.state === "rail-charge") ? "rail-wisp-charge"
        : type === "lantern-heron" && enemy.state === "alert" ? "lantern-heron-alert"
          : type;
    const frame = frameSpec("enemyFrames", frameType, DEFAULT_ENEMY_FRAMES[frameType]);
    let drawn = false;
    if (frame) {
      const scale = clamp(Math.max(enemy.w / 46, enemy.h / 42), 0.82, 1.55);
      const flying = isFlyingEnemy(type) || ["kite-mite", "paper-jelly", "orbit-eye"].includes(type);
      const bob = flying ? Math.sin(enemy.t * 6.5) * 5 : Math.sin(enemy.t * 8) * 1.4;
      const width = (Number(frame.drawW) || 126) * scale;
      const height = (Number(frame.drawH) || 164) * scale;
      ctx.save();
      const centerX = enemy.x + enemy.w / 2;
      const feetY = enemy.y + enemy.h;
      ctx.fillStyle = theme.ground;
      ctx.globalAlpha = flying ? 0.09 : 0.32;
      ctx.beginPath(); ctx.ellipse(centerX, feetY + (flying ? 8 : 3), (flying ? 17 : 25) * scale, (flying ? 4 : 7) * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = theme.edge;
      ctx.globalAlpha = enemy.state?.includes("telegraph") ? 0.28 : 0.08;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(centerX, feetY - height * 0.42, width * 0.38, height * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      drawn = drawAtlasFrame(frame, centerX, feetY + bob, width, height, { flipX: enemyFacing(enemy) < 0, anchorX: 0.5, anchorY: Number(frame.anchorY ?? 0.85) });
      if (drawn && !flying) {
        ctx.save();
        const groundVeil = ctx.createLinearGradient(0, feetY - 15, 0, feetY + 8);
        groundVeil.addColorStop(0, "transparent");
        groundVeil.addColorStop(1, theme.ground);
        ctx.fillStyle = groundVeil;
        ctx.globalAlpha = 0.24;
        ctx.beginPath(); ctx.ellipse(centerX, feetY - 2, width * 0.32, 13 * scale, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = theme.paper;
        ctx.globalAlpha = Math.min(0.22, Math.abs(enemy.vx || 0) / 900);
        for (let i = 0; i < 3; i += 1) {
          const drift = stableWave(enemy.t * 7 + i * 3.1, 9);
          ctx.beginPath(); ctx.arc(centerX - enemyFacing(enemy) * (19 + i * 7) + drift, feetY - 2 - i * 2, 2 + i * 0.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }

    if (!drawn) drawFallbackEnemy(enemy, theme);
    drawEnemyIntent(enemy, theme);
  }

  function drawEnemyIntent(enemy, theme) {
    const centerX = enemy.x + enemy.w / 2;
    const centerY = enemy.y + enemy.h / 2;
    ctx.save();
    if (enemy.state === "drum-telegraph") {
      const pulse = 32 + Math.sin(runtime.time * 24) * 7;
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.82;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(centerX - 88, enemy.y + enemy.h); ctx.lineTo(centerX + 88, enemy.y + enemy.h); ctx.stroke();
    } else if (enemy.state === "mimic-telegraph") {
      const direction = enemy.mimicDirection || 1;
      ctx.strokeStyle = theme.accent2;
      ctx.globalAlpha = 0.78;
      ctx.lineWidth = 6;
      ctx.setLineDash([14, 10]);
      ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX + direction * 150, centerY); ctx.stroke();
    } else if (enemy.state === "rewind") {
      ctx.strokeStyle = theme.edge;
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(centerX, centerY, 34, runtime.time * -8, runtime.time * -8 + Math.PI * 1.55); ctx.stroke();
    } else if (enemy.state === "rail-telegraph") {
      ctx.strokeStyle = theme.accent2;
      ctx.globalAlpha = 0.72 + Math.sin(runtime.time * 25) * 0.14;
      ctx.lineWidth = 6;
      ctx.setLineDash([18, 10]);
      ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(player.x + player.w / 2, player.y + player.h / 2); ctx.stroke();
    } else if (enemy.type === "lantern-heron" && enemy.state === "alert") {
      const angle = Math.atan2(player.y + player.h / 2 - centerY, player.x + player.w / 2 - centerX);
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.14 + Math.sin(runtime.time * 10) * 0.035;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle - 0.2) * 520, centerY + Math.sin(angle - 0.2) * 520);
      ctx.arc(centerX, centerY, 520, angle - 0.2, angle + 0.2);
      ctx.closePath();
      ctx.fill();
    }
    if (enemy.type === "lens-beetle" && enemy.state === "armored") {
      const direction = enemyFacing(enemy);
      ctx.strokeStyle = theme.paper;
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(centerX + direction * 10, centerY, 29, -1.15, 1.15); ctx.stroke();
    }
    if (enemy.type === "fold-beetle") {
      const direction = enemyFacing(enemy);
      ctx.strokeStyle = theme.paper;
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.88;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(centerX + direction * 20, enemy.y - 7);
      ctx.quadraticCurveTo(centerX + direction * 48, centerY, centerX + direction * 20, enemy.y + enemy.h + 8);
      ctx.stroke();
    }
    if (enemy.type === "star-siphon" && enemy.trialRole === "jammer") {
      const anchor = trialAnchor(runtime.trial, enemy.trialTargetId);
      if (anchor) {
        ctx.strokeStyle = theme.accent;
        ctx.globalAlpha = 0.38 + Math.sin(runtime.time * 12) * 0.16;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 9]);
        ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(anchor.x + anchor.w / 2, anchor.y + anchor.h / 2); ctx.stroke();
      }
    }
    ctx.restore();
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
    const archetype = boss.archetype || "eclipse-observer";
    let frameName;
    if (archetype === "boiler-beetle") {
      if (boss.hitFlash > 0) frameName = "boilerFrozenHit";
      else if (boss.vulnerable > 0) frameName = "boilerCoreOpen";
      else if (boss.state === "telegraph" || boss.state === "charge") frameName = "boilerCharge";
      else frameName = "boilerNormal";
    } else if (archetype === "rift-weaver") {
      if (boss.hp <= 0 || boss.state === "defeated") frameName = "weaverDefeated";
      else if (boss.hitFlash > 0) frameName = "weaverStunned";
      else if (boss.vulnerable > 0) frameName = "weaverCoreOpen";
      else if (boss.state === "thread-dash") frameName = "weaverThreadDash";
      else if (boss.state === "cocoon") frameName = "weaverCocoon";
      else if (boss.state === "thread-charge" && boss.phase >= 3) frameName = "weaverBeam";
      else if (boss.state === "thread-charge") frameName = "weaverThreadCharge";
      else frameName = "weaverIdle";
    } else if (archetype === "star-whale") {
      if (boss.hp <= 0 || boss.state === "defeated") frameName = "whaleDefeated";
      else if (boss.hitFlash > 0) frameName = "whaleStunned";
      else if (boss.vulnerable > 0) frameName = "whaleCoreOpen";
      else if (boss.state === "beam") frameName = "whaleBeam";
      else if (boss.state === "dive") frameName = "whaleDive";
      else if (boss.state === "charge") frameName = "whaleCharge";
      else if (boss.state === "shield") frameName = "whaleShield";
      else frameName = "whaleIdle";
    } else if (archetype === "fold-warden") {
      if (boss.hp <= 0 || boss.state === "defeated") frameName = "foldWardenDefeated";
      else if (boss.hitFlash > 0) frameName = "foldWardenStunned";
      else if (boss.vulnerable > 0) frameName = "foldWardenCoreOpen";
      else if (boss.state === "fold-trapped") frameName = "foldWardenTrapped";
      else if (boss.state === "fold-dive") frameName = "foldWardenDive";
      else if (boss.state === "fold-telegraph") frameName = "foldWardenTelegraph";
      else if (boss.state === "recover") frameName = "foldWardenShield";
      else frameName = "foldWardenIdle";
    } else if (archetype === "sky-paper-dragon") {
      if (boss.hp <= 0 || boss.state === "defeated") frameName = "dragonDefeated";
      else if (boss.hitFlash > 0) frameName = "dragonStunned";
      else if (boss.vulnerable > 0 || boss.state === "dragon-core-open") frameName = "dragonCoreOpen";
      else if (boss.state === "dragon-charge") frameName = "dragonCharge";
      else if (boss.state === "dragon-dive") frameName = "dragonDive";
      else if (boss.state === "dragon-shield") frameName = "dragonShield";
      else if (boss.state === "dragon-bridge") frameName = "dragonBridge";
      else frameName = "dragonIdle";
    } else if (archetype === "scorewing-maestro") {
      if (boss.hp <= 0 || boss.state === "defeated") frameName = "scorewingDefeated";
      else if (boss.hitFlash > 0 || boss.state === "scorewing-stunned") frameName = "scorewingStunned";
      else if (boss.vulnerable > 0 || boss.state === "scorewing-core-open") frameName = "scorewingCoreOpen";
      else if (boss.state === "scorewing-shard-cast") frameName = "scorewingShardCast";
      else if (boss.state === "volley-guard") frameName = "scorewingVolleyGuard";
      else if (boss.state === "scorewing-enraged") frameName = "scorewingEnraged";
      else if (boss.state === "scorewing-charge") frameName = "scorewingCharge";
      else frameName = "scorewingIdle";
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
      const width = Number(frame.drawW) || (archetype === "boiler-beetle" ? 250 : archetype === "rift-weaver" ? 330 : archetype === "star-whale" ? 330 : archetype === "fold-warden" ? 360 : archetype === "sky-paper-dragon" ? 760 : archetype === "scorewing-maestro" ? 410 : 260);
      const height = Number(frame.drawH) || (archetype === "boiler-beetle" ? 315 : archetype === "rift-weaver" ? 350 : archetype === "star-whale" ? 440 : archetype === "fold-warden" ? 360 : archetype === "sky-paper-dragon" ? 380 : archetype === "scorewing-maestro" ? 340 : 340);
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.ellipse(centerX, feetY + 5, boss.w * 0.66, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const jitter = boss.state === "telegraph" || boss.state === "thread-charge" ? Math.sin(runtime.time * 48) * 4 : 0;
      if (drawAtlasFrame(frame, centerX + jitter, feetY, width, height, { flipX: archetype === "boiler-beetle" && boss.vx < 0, anchorX: 0.5, anchorY: Number(frame.anchorY ?? 0.9) })) return;
    }

    ctx.save();
    ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
    if (boss.state === "telegraph" || boss.state === "thread-charge") ctx.translate(Math.sin(runtime.time * 48) * 4, 0);
    if (boss.hitFlash > 0) ctx.globalAlpha = 0.45 + Math.sin(boss.hitFlash * 70) * 0.35;
    if (archetype === "boiler-beetle") {
      drawBoilerBossFallback(boss, theme);
    } else if (archetype === "rift-weaver") {
      drawWeaverBossFallback(boss, theme);
    } else if (archetype === "star-whale") {
      drawStarWhaleBossFallback(boss, theme);
    } else if (archetype === "fold-warden") {
      drawFoldWardenBossFallback(boss, theme);
    } else if (archetype === "sky-paper-dragon") {
      drawSkyPaperDragonBossFallback(boss, theme);
    } else if (archetype === "scorewing-maestro") {
      drawScorewingBossFallback(boss, theme);
    } else {
      drawEclipseBossFallback(boss, theme);
    }
    ctx.restore();
  }

  function drawFoldWardenBossFallback(boss, theme) {
    const open = boss.vulnerable > 0;
    ctx.fillStyle = open ? theme.paper : theme.ink;
    paperPolygon([[-86, -18], [-28, -84], [0, -30], [28, -84], [86, -18], [42, 54], [0, 20], [-42, 54]], open ? theme.paper : theme.ink, theme.accent, 5);
    ctx.fillStyle = theme.accent2;
    ctx.beginPath(); ctx.moveTo(-12, -20); ctx.lineTo(0, -54); ctx.lineTo(12, -20); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
    drawStarShape(0, 18, open ? 30 : 18, open ? theme.accent2 : theme.accent, theme.paper);
  }

  function drawSkyPaperDragonBossFallback(boss, theme) {
    const open = boss.vulnerable > 0;
    ctx.save();
    ctx.scale(1.45, 1.15);
    ctx.strokeStyle = open ? theme.accent2 : theme.accent;
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-178, 42);
    ctx.bezierCurveTo(-118, -82, -18, 90, 72, -42);
    ctx.bezierCurveTo(112, -98, 156, -48, 184, -16);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = theme.paper;
    ctx.setLineDash([18, 12]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.ink;
    ctx.beginPath();
    ctx.moveTo(130, -66); ctx.lineTo(196, -38); ctx.lineTo(166, 14); ctx.lineTo(112, -5); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 5;
    ctx.stroke();
    drawStarShape(151, -25, open ? 24 : 13, open ? theme.paper : theme.accent2, theme.ink);
    ctx.fillStyle = theme.paper;
    ctx.beginPath(); ctx.arc(174, -29, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawScorewingBossFallback(boss, theme) {
    const pulse = 1 + Math.sin(runtime.time * 3.8) * 0.035;
    const enraged = boss.phase >= 3 || boss.state === "scorewing-enraged";
    const open = boss.vulnerable > 0 || boss.state === "scorewing-core-open";
    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 4;
    for (let index = 0; index < Math.max(1, boss.phase); index += 1) {
      const angle = runtime.time * (0.5 + index * 0.12) + index * Math.PI * 0.7;
      ctx.beginPath();
      ctx.ellipse(0, 0, 112 + index * 17, 58 + index * 7, angle, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const wingLift = Math.sin(runtime.time * (enraged ? 10 : 6)) * 9;
    paperPolygon([[-8, -5], [-88, -76 - wingLift], [-118, -30], [-92, 54 + wingLift], [-24, 35]], theme.paper, theme.ink, 5);
    paperPolygon([[8, -5], [88, -76 - wingLift], [118, -30], [92, 54 + wingLift], [24, 35]], theme.paper, theme.ink, 5);
    ctx.strokeStyle = theme.accent2;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.72;
    for (const side of [-1, 1]) {
      for (let line = -1; line <= 1; line += 1) {
        ctx.beginPath();
        ctx.moveTo(side * 24, line * 15);
        ctx.quadraticCurveTo(side * 64, line * 18 - 12, side * 102, line * 20 - 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.ellipse(0, 5, 34, 68, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = enraged ? theme.danger : theme.accent;
    ctx.beginPath(); ctx.ellipse(0, -45, 27, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = theme.paper;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-10, -62); ctx.quadraticCurveTo(-28, -90, -43, -72); ctx.moveTo(10, -62); ctx.quadraticCurveTo(28, -90, 43, -72); ctx.stroke();
    ctx.fillStyle = theme.paper;
    ctx.beginPath(); ctx.arc(-9, -48, 4, 0, Math.PI * 2); ctx.arc(9, -48, 4, 0, Math.PI * 2); ctx.fill();
    drawStarShape(0, 10, open ? 27 : 16, open ? theme.paper : theme.accent2, theme.ink);
    ctx.save();
    ctx.translate(66, -2);
    ctx.rotate(-0.55 + Math.sin(runtime.time * 2.4) * 0.16);
    ctx.strokeStyle = theme.paper;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(54, -42); ctx.stroke();
    drawStarShape(57, -45, 9, theme.accent, theme.ink);
    ctx.restore();
    ctx.restore();
  }

  function drawStarWhaleBossFallback(boss, theme) {
    const open = boss.vulnerable > 0;
    ctx.fillStyle = open ? theme.edge : theme.ink;
    ctx.beginPath(); ctx.ellipse(0, 0, boss.w * 0.62, boss.h * 0.46, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.accent2;
    ctx.beginPath(); ctx.moveTo(-boss.w * 0.45, -8); ctx.quadraticCurveTo(-boss.w * 0.82, -boss.h * 0.62, -boss.w * 0.7, 10); ctx.quadraticCurveTo(-boss.w * 0.78, boss.h * 0.62, -boss.w * 0.38, 22); ctx.fill();
    ctx.fillStyle = theme.paper;
    ctx.beginPath(); ctx.ellipse(boss.w * 0.24, -boss.h * 0.1, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
    drawStarShape(0, 8, open ? 31 : 20, open ? theme.paper : theme.accent, theme.ink);
  }

  function drawWeaverBossFallback(boss, theme) {
    const pulse = 1 + Math.sin(runtime.time * 4.6) * 0.035;
    const open = boss.vulnerable > 0;
    ctx.scale(pulse, pulse);

    // A small rotating loom and taut radial threads keep the silhouette
    // readable even if the optional sprite atlas is unavailable.
    ctx.save();
    ctx.rotate(runtime.time * (open ? 0.16 : 0.34));
    ctx.strokeStyle = open ? theme.edge : theme.accent2;
    ctx.globalAlpha *= 0.58;
    ctx.lineWidth = 3;
    for (let ring = 1; ring <= 3; ring += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, 38 + ring * 25, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let spoke = 0; spoke < 8; spoke += 1) {
      const angle = spoke / 8 * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
      ctx.lineTo(Math.cos(angle) * 113, Math.sin(angle) * 113);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    for (let side = -1; side <= 1; side += 2) {
      for (let leg = 0; leg < 4; leg += 1) {
        const rootY = -40 + leg * 27;
        const kneeX = side * (72 + leg * 8);
        const footX = side * (118 + leg * 5);
        const footY = rootY + (leg < 2 ? -20 : 31);
        ctx.beginPath();
        ctx.moveTo(side * 35, rootY);
        ctx.lineTo(kneeX, rootY + (leg % 2 ? 15 : -12));
        ctx.lineTo(footX, footY);
        ctx.stroke();
        ctx.fillStyle = leg < boss.phase ? theme.edge : theme.accent2;
        ctx.beginPath(); ctx.arc(kneeX, rootY + (leg % 2 ? 15 : -12), 5, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.ellipse(0, 22, 61, 72, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.ground;
    ctx.beginPath(); ctx.ellipse(0, 20, 49, 60, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.ellipse(0, -48, 46, 37, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.paper;
    ctx.beginPath(); ctx.ellipse(-16, -53, 8, 12, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(16, -53, 8, 12, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.arc(-14, -51, 3, 0, Math.PI * 2); ctx.arc(14, -51, 3, 0, Math.PI * 2); ctx.fill();

    const coreRadius = open ? 27 + Math.sin(runtime.time * 10) * 3 : 19;
    ctx.fillStyle = open ? theme.edge : theme.accent2;
    ctx.beginPath(); ctx.arc(0, 18, coreRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = theme.paper;
    ctx.lineWidth = open ? 5 : 3;
    ctx.beginPath(); ctx.arc(0, 18, coreRadius - 7, 0, Math.PI * 2); ctx.stroke();
    paperPolygon([[0, -2], [14, 18], [0, 38], [-14, 18]], open ? theme.paper : theme.danger, theme.ink, 3);
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

  function animationLoopSuspended() {
    return document.hidden || scene !== "playing";
  }

  function scheduleAnimationLoop() {
    if (animationFrameId !== null || animationLoopSuspended()) return;
    animationFrameId = requestAnimationFrame(loop);
  }

  function stopAnimationLoop() {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  function resumeAnimationLoop() {
    if (animationLoopSuspended()) return;
    previousTime = performance.now();
    accumulator = 0;
    render();
    scheduleAnimationLoop();
  }

  function loop(now) {
    animationFrameId = null;
    if (animationLoopSuspended()) return;
    const frame = Math.min(0.1, (now - previousTime) / 1000);
    previousTime = now;
    accumulator += frame;
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
    render();
    scheduleAnimationLoop();
  }

  function init() {
    syncCanvasViewport();
    ensureProfileUi();
    $("#mute-icon").textContent = muted ? "静音" : "声音";
    renderLevelGrid();
    openMenu();
    const params = new URLSearchParams(location.search);
    const requested = Number(params.get("level"));
    const requestedTrial = params.get("trial");
    if (requestedTrial && trialById(requestedTrial)) startTrial(requestedTrial, params.get("autostart") === "1" || params.get("capture") === "1");
    else if (CAMPAIGN_LEVEL_IDS.has(requested)) startLevel(requested, params.get("autostart") === "1" || params.get("capture") === "1");
    preloadArtAsset("hero");
    preloadArtAsset("paper");
    scheduleAnimationLoop();
  }

  window.addEventListener("resize", syncCanvasViewport, { passive: true });

  window.__STARSPROUT_TEST__ = {
    startLevel: (id) => startLevel(id, true),
    seatWeight,
    crossSeam,
    setTrajectory,
    solidifyTrajectory,
    strikeDragonKnot,
    setGrowthForm,
    setRailJunction,
    visitRailStation,
    moveShadowScreen,
    setShadowExposure,
    captureCrownShard,
    launchCrownVolley,
    startTrial: (id = "night-watch") => startTrial(id, true),
    chooseTrialUpgrade,
    activateTrialAnchorBy: (id, action = "touch") => activateTrialAnchor(trialAnchor(runtime?.trial, String(id)), String(action)),
    chooseTrialRoute,
    triggerTrialEvent,
    spawnTrialSeed,
    depositTrialSeed,
    chargeTrialNodeBy: (id, action = "pulse") => chargeTrialRepairNode(String(id), 1, String(action)),
    spawnTrialMeteor,
    actOnTrialMeteor: (x, action = "downstrike") => actOnTrialMeteorAt(Number(x) || 640, String(action)),
    damageTrialElite,
    setTrialElapsed: (seconds) => {
      if (!runtime?.trial) return false;
      runtime.trial.elapsed = Math.max(0, Number(seconds) || 0);
      if (!runtime.trial.endless) runtime.trial.timeLeft = Math.max(0, runtime.trial.duration - runtime.trial.elapsed);
      updateTrial(STEP);
      return true;
    },
    chargeTrialNode: (id, amount = 1) => chargeTrialRepairNode(String(id), amount, "pulse"),
    reflectTrialMeteor: (x = player?.x || 640) => {
      if (!runtime?.trial) return false;
      spawnTrialMeteor("normal", Number(x) || 640);
      return reflectTrialMeteorAt(Number(x) || 640);
    },
    step: (frames = 1) => { for (let i = 0; i < frames; i += 1) update(STEP); render(); },
    snapshot: () => ({
      scene,
      mode: currentMode,
      level: currentLevel?.id || null,
      player: player ? {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        health: player.health,
        invulnerable: player.invulnerable,
        hurtTime: player.hurtTime,
      } : null,
      boss: runtime?.boss ? {
        hp: runtime.boss.hp,
        maxHp: runtime.boss.maxHp,
        phase: runtime.boss.phase,
        archetype: runtime.boss.archetype,
        state: runtime.boss.state,
        vulnerable: runtime.boss.vulnerable,
        targetTrapId: runtime.boss.targetTrapId,
      } : null,
      cameraX,
      viewport: { width: VIEW_W, height: VIEW_H },
      unlocked: save.unlocked,
      completed: [...save.completed],
      seeds: save.seeds,
      discoveries: [...save.discoveries],
      heroModule: save.heroModule,
      unlockedModules: unlockedModulesFor(),
      moduleState: runtime ? { ...runtime.moduleState } : null,
      goalReady: Boolean(runtime && currentLevel && goalRequirementMet()),
      objectives: runtime ? runtime.objectives.map((objective) => {
        const progress = objectiveProgress(objective);
        return { id: objective.id, type: objective.type, required: progress.required, progress: progress.progress, completed: Boolean(objective.completed), submitted: Boolean(objective.submitted) };
      }) : [],
      objective: runtime?.objectives?.[0] ? (() => {
        const objective = runtime.objectives[0];
        const progress = objectiveProgress(objective);
        return { id: objective.id, type: objective.type, required: progress.required, progress: progress.progress, completed: Boolean(objective.completed) };
      })() : null,
      repairZones: runtime ? runtime.objectives.flatMap((objective) => objective.zones || []).map((zone) => ({ id: zone.id, x: zone.x, y: zone.y, w: zone.w, h: zone.h, repaired: Boolean(zone.repaired) })) : [],
      reactors: runtime ? runtime.objectives.flatMap((objective) => objective.reactors || []).map((reactor) => ({ id: reactor.id, x: reactor.x, y: reactor.y, w: reactor.w, h: reactor.h, charge: reactor.charge, required: reactor.requiredCharge, requiredCharge: reactor.requiredCharge, charged: Boolean(reactor.powered), powered: Boolean(reactor.powered) })) : [],
      polarity: runtime?.polarity?.current || null,
      timeAnchors: runtime ? runtime.timeAnchors.map((anchor) => ({ id: anchor.id, active: anchor.active, timer: anchor.timer })) : [],
      echoPairs: runtime ? { ...runtime.echoPairs } : {},
      echoClone: runtime?.echoClone ? { x: runtime.echoClone.x, y: runtime.echoClone.y } : null,
      gravityAnchors: runtime ? runtime.gravityAnchors.map((anchor) => ({ id: anchor.id, x: anchor.x, y: anchor.y, active: anchor.active, timer: anchor.timer })) : [],
      foldPanels: runtime ? runtime.foldPanels.map((panel) => ({ id: panel.id, group: panel.group, state: runtime.foldStates[panel.group], targetState: panel.targetState })) : [],
      kiteAnchors: runtime ? runtime.kiteAnchors.map((anchor) => ({ id: anchor.id, visited: runtime.kiteVisited.has(anchor.id) })) : [],
      kiteTether: runtime ? { ...runtime.kiteTether } : null,
      pageTurn: runtime?.pageTurn ? { active: runtime.pageTurn.active, inkX: runtime.pageTurn.inkX } : null,
      foldTraps: runtime ? runtime.foldTraps.map((trap) => ({ id: trap.id, armed: trap.armed, timer: trap.timer })) : [],
      weightBlocks: runtime ? runtime.weightBlocks.map((weight) => ({
        id: weight.id,
        group: weight.group,
        mass: weight.mass,
        x: weight.x,
        y: weight.y,
        seatedSlotId: weight.seatedSlotId,
      })) : [],
      weightSlots: runtime ? runtime.weightSlots.map((slot) => ({ id: slot.id, group: slot.group, side: slot.side, capacity: slot.capacity })) : [],
      scaleBridges: runtime ? runtime.scaleBridges.map((bridge) => ({
        id: bridge.id,
        platformId: bridge.platformId,
        y: runtime.platforms.find((platform) => platform.id === bridge.platformId)?.y || 0,
        leftMass: bridge.leftMass,
        rightMass: bridge.rightMass,
        delta: bridge.delta,
        balanced: bridge.balanced,
      })) : [],
      silhouetteLane: runtime?.silhouetteLane || null,
      seams: runtime ? runtime.seams.map((seam) => ({ id: seam.id, from: seam.from, to: seam.to, crossed: seam.crossed })) : [],
      trajectory: runtime ? runtime.trajectory.points.map((point) => ({ x: point.x, y: point.y })) : [],
      stitchBridges: runtime ? runtime.stitchBridges.map((bridge) => ({
        id: bridge.id,
        loomId: bridge.loomId,
        life: bridge.life,
        segments: bridge.segments.map((segment) => ({ x: segment.x, y: segment.y, w: segment.w, h: segment.h })),
      })) : [],
      looms: runtime ? runtime.looms.map((loom) => ({ id: loom.id, active: loom.active, completed: loom.completed })) : [],
      dragonKnots: runtime ? runtime.dragonKnots.map((knot) => ({ id: knot.id, x: knot.x, y: knot.y, active: knot.active })) : [],
      dragonBodyPlatforms: runtime ? runtime.dragonBodyPlatforms.map((bodyPlatform) => {
        const platform = runtime.platforms.find((entry) => entry.id === bodyPlatform.platformId);
        return { id: bodyPlatform.id, x: platform?.x || 0, y: platform?.y || 0 };
      }) : [],
      dragonCycle: runtime ? { ...runtime.dragonCycle } : null,
      growthForm: runtime?.growthForm || null,
      growthBroken: runtime ? runtime.waxSeals.filter((seal) => seal.broken).map((seal) => seal.id) : [],
      railCarts: runtime ? runtime.railCarts.map((cart) => ({ id: cart.id, railId: cart.railId, x: cart.x, y: cart.y, direction: cart.direction })) : [],
      railStations: runtime ? runtime.railStations.map((station) => ({ id: station.id, label: station.label, visited: runtime.visitedRailStations.has(station.id) })) : [],
      shadowExposure: Number(runtime?.shadowExposure) || 0,
      shadowKeys: runtime ? runtime.collectibles.filter((item) => item.type === "shadow-key" && item.collected).length : 0,
      capturedCrownShards: Number(runtime?.capturedCrownShards) || 0,
      volleyShots: runtime ? runtime.projectiles.filter((shot) => shot.crownVolley).map((shot) => ({ x: shot.x, y: shot.y, vx: shot.vx, vy: shot.vy, life: shot.life, volleyId: shot.volleyId })) : [],
      platforms: runtime ? runtime.platforms.map((platform) => ({
        id: platform.id,
        x: platform.x,
        y: platform.y,
        bounceY: Number(platform.bounceY) || 0,
        polarity: platform.polarity || null,
        // QA reports the selected phase; collision still honors the brief
        // previous-phase grace window through isPlatformActive().
        enabled: platform.polarity
          ? platform.polarity === runtime.polarity.current
          : isPlatformActive(platform),
      })) : [],
      switches: runtime ? [...runtime.switches, ...runtime.polaritySwitches, ...runtime.relays].map((device) => ({
        id: device.id,
        active: Boolean(device.active),
        timer: Math.max(0, Number(device.timer) || 0),
      })) : [],
      checkpoints: runtime ? runtime.checkpoints.map((point) => ({
        id: point.id,
        active: Boolean(point.active),
        reached: Boolean(point.reached),
      })) : [],
      enemies: runtime ? runtime.enemies.filter((enemy) => enemy.alive).map((enemy) => ({
        id: enemy.id,
        type: enemy.type,
        x: enemy.x,
        y: enemy.y,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        state: enemy.state,
        stateTimer: enemy.stateTimer,
        trialRole: enemy.trialRole || null,
      })) : [],
      enemyWebs: runtime ? runtime.enemyWebs.map((web) => ({ x: web.x, y: web.y, w: web.w, h: web.h, life: web.life })) : [],
      shockwaves: runtime ? runtime.shockwaves.map((wave) => ({ x: wave.x, y: wave.y, vx: wave.vx, life: wave.life })) : [],
      enemyShots: runtime ? runtime.enemyShots.map((shot) => ({ id: shot.id || null, x: shot.x, y: shot.y, drain: Boolean(shot.drain), catchable: Boolean(shot.catchable), life: shot.life })) : [],
      input: { held: { ...input.held }, tapBuffer: { ...input.tapBuffer }, pointers: input.pointers.size, lastDirection: input.lastDirection },
      effects: runtime ? { ...runtime.activeEffects } : {},
      charges: runtime ? { ...runtime.charges } : {},
      trial: runtime?.trial ? {
        id: runtime.trial.id,
        name: runtime.trial.name,
        endless: runtime.trial.endless,
        elapsed: runtime.trial.elapsed,
        timeLeft: runtime.trial.timeLeft,
        score: runtime.trial.score,
        combo: runtime.trial.combo,
        bestCombo: runtime.trial.bestCombo,
        phaseIndex: runtime.trial.phaseIndex,
        phaseSerial: runtime.trial.phaseSerial,
        cycle: runtime.trial.cycle,
        phaseName: runtime.trial.phaseName,
        phaseTask: runtime.trial.phaseTask,
        arenaMotion: runtime.trial.arenaMotion,
        phaseObjectiveProgress: trialPhaseObjectiveProgress(runtime.trial),
        circuits: runtime.trial.circuits,
        dashLinks: runtime.trial.dashLinks,
        route: [...runtime.trial.route],
        routeProgress: runtime.trial.routeProgress,
        routeTime: runtime.trial.routeTimer,
        anchors: runtime.trial.anchors.map((anchor) => ({
          id: anchor.id,
          label: anchor.label,
          x: anchor.x,
          y: anchor.y,
          w: anchor.w,
          h: anchor.h,
          jammed: anchor.jammed,
          requiredAction: anchor.id === trialExpectedAnchor(runtime.trial)?.id
            ? runtime.trial.routeActions[runtime.trial.routeProgress] || anchor.requiredAction || null
            : anchor.requiredAction || null,
          expected: trialExpectedAnchor(runtime.trial)?.id === anchor.id,
        })),
        meteors: runtime.trial.meteors.map((meteor) => ({
          x: meteor.x,
          timer: meteor.timer,
          type: meteor.type,
          actionIndex: meteor.actionIndex,
          actionSequence: [...(meteor.actionSequence || [])],
          struck: meteor.struck,
          reflected: Boolean(meteor.reflected),
        })),
        escort: { ...runtime.trial.escort },
        salvage: {
          ...runtime.trial.salvage,
          seeds: runtime.trial.salvage.seeds.map((seed) => ({ ...seed })),
        },
        repairNodes: runtime.trial.repairNodes.map((node) => ({ ...node })),
        repairedSets: runtime.trial.repairedSets,
        rift: { ...runtime.trial.rift },
        reflections: runtime.trial.reflections,
        coreHp: runtime.trial.core.hp,
        coreMaxHp: runtime.trial.core.maxHp,
        coreShield: runtime.trial.core.shield,
        spawnCount: runtime.trial.spawnCount,
        upgrades: [...runtime.trial.upgrades],
        upgradeRanks: { ...runtime.trial.upgradeRanks },
        activeEvent: runtime.trial.activeEvent ? {
          id: runtime.trial.activeEvent.id,
          choiceId: runtime.trial.activeEvent.choiceId,
          pendingChoice: runtime.trial.activeEvent.pendingChoice,
          timeLeft: runtime.trial.activeEvent.timeLeft,
        } : null,
        siege: {
          ...runtime.trial.siege,
          elite: { ...runtime.trial.siege.elite },
        },
        finished: runtime.trial.finished,
      } : null,
      pickupStatus: runtime ? pickupStatusText() : "",
    }),
    press: (action, source = "qa") => pressAction(action, source),
    release: (action, source = "qa") => releaseAction(action, source),
    captureReady: () => captureReady || scene === "menu",
    unlockAll: () => { save.unlocked = MAX_LEVEL_ID; persist(); renderLevelGrid(); },
    equipModule: (moduleId) => equipHeroModule(moduleId),
    openBestiary,
    completeForQa: (id) => {
      const levelId = Number(id);
      if (!CAMPAIGN_LEVEL_IDS.has(levelId)) return false;
      save.completed = [...new Set([...save.completed, levelId])].sort((a, b) => a - b);
      persist(); renderProfile(); renderLevelGrid(); return true;
    },
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
