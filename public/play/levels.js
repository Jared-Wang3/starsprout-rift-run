(function () {
  "use strict";

  var WORLD_HEIGHT = 720;

  function platform(id, x, y, w, h, options) {
    return Object.assign(
      {
        id: id,
        x: x,
        y: y,
        w: w,
        h: h,
        kind: "solid",
        material: "paper-stone"
      },
      options || {}
    );
  }

  function hazard(id, type, x, y, w, h, options) {
    return Object.assign(
      {
        id: id,
        type: type,
        x: x,
        y: y,
        w: w,
        h: h,
        damage: 1
      },
      options || {}
    );
  }

  function enemy(id, type, x, y, minX, maxX, options) {
    return Object.assign(
      {
        id: id,
        type: type,
        x: x,
        y: y,
        hp: 1,
        contactDamage: 1,
        patrol: { minX: minX, maxX: maxX },
        speed: 52
      },
      options || {}
    );
  }

  function collectible(id, type, x, y, options) {
    return Object.assign(
      {
        id: id,
        type: type,
        x: x,
        y: y,
        value: 1
      },
      options || {}
    );
  }

  function checkpoint(id, x, y, respawnX, respawnY, options) {
    return Object.assign({
      id: id,
      x: x,
      y: y,
      w: 34,
      h: 92,
      respawn: { x: respawnX, y: respawnY }
    }, options || {});
  }

  var levels = [
    {
      id: 1,
      key: "wind-hills",
      act: 1,
      kind: "stage",
      name: "风铃草丘",
      nameEn: "BELLWIND HILLS",
      subtitle: "追着风去远方",
      briefing: {
        kicker: "STAGE 01 · WIND",
        title: "风铃草丘",
        subtitle: "追着风去远方",
        mechanic: "进入青色风带会被托起，顺风冲刺能飞得更远。",
        hint: "看叶片飘动的方向，不要逆着强风硬跳。"
      },
      theme: {
        id: "wind-meadow",
        palette: {
          skyTop: "#71C7D4",
          skyBottom: "#DCEBCB",
          ink: "#071C27",
          paper: "#F4EDDA",
          ground: "#54785A",
          groundDark: "#314E41",
          platform: "#E9D9A8",
          accent: "#F6C453",
          accent2: "#2AB7A9",
          danger: "#F05D4E",
          fog: "#EAF4DD"
        },
        material: "pressed-grass",
        ambient: { type: "leaf-stream", count: 34, speed: 0.8 },
        landmark: {
          type: "windmill-organ",
          x: 2920,
          y: 118,
          scale: 1.45,
          accent: "#F6C453"
        }
      },
      worldWidth: 3900,
      worldHeight: WORLD_HEIGHT,
      killY: 790,
      camera: { mode: "follow", deadZoneX: 0.36, lookAhead: 150 },
      spawn: { x: 90, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 3738,
        y: 494,
        w: 86,
        h: 126,
        requires: "reach"
      },
      platforms: [
        platform("w-ground-01", 0, 620, 520, 100, { material: "grass-earth" }),
        platform("w-step-01", 250, 520, 170, 24, { kind: "one-way", material: "grass-paper" }),
        platform("w-ground-02", 690, 620, 490, 100, { material: "grass-earth" }),
        platform("w-cloud-01", 800, 495, 150, 22, { kind: "one-way", material: "cloud-paper" }),
        platform("w-cloud-02", 1010, 420, 150, 22, { kind: "one-way", material: "cloud-paper" }),
        platform("w-ground-03", 1350, 620, 470, 100, { material: "grass-earth" }),
        platform("w-drift-01", 1430, 495, 160, 22, {
          kind: "moving",
          material: "kite-cloth",
          motion: { axis: "y", distance: 96, speed: 0.75, phase: 0.2 }
        }),
        platform("w-ledge-01", 1640, 450, 145, 24, { kind: "one-way", material: "grass-paper" }),
        platform("w-ground-04", 2020, 620, 480, 100, { material: "grass-earth" }),
        platform("w-cloud-03", 2115, 490, 160, 22, { kind: "one-way", material: "cloud-paper" }),
        platform("w-cloud-04", 2320, 405, 160, 22, { kind: "one-way", material: "cloud-paper" }),
        platform("w-ground-05", 2660, 620, 520, 100, { material: "grass-earth" }),
        platform("w-turbine-deck", 2815, 475, 250, 26, { kind: "one-way", material: "windmill-wood" }),
        platform("w-drift-02", 3090, 410, 150, 22, {
          kind: "moving",
          material: "kite-cloth",
          motion: { axis: "x", distance: 110, speed: 0.9, phase: 0.55 }
        }),
        platform("w-ground-06", 3340, 620, 560, 100, { material: "grass-earth" }),
        platform("w-finish-step", 3490, 520, 180, 24, { kind: "one-way", material: "grass-paper" })
      ],
      hazards: [
        hazard("w-pit-01", "fall", 520, 650, 170, 70, { damage: 99 }),
        hazard("w-thorn-01", "thorn", 1090, 592, 64, 28),
        hazard("w-pit-02", "fall", 1180, 650, 170, 70, { damage: 99 }),
        hazard("w-pit-03", "fall", 1820, 650, 200, 70, { damage: 99 }),
        hazard("w-thorn-02", "thorn", 2380, 592, 78, 28),
        hazard("w-pit-04", "fall", 2500, 650, 160, 70, { damage: 99 }),
        hazard("w-pit-05", "fall", 3180, 650, 160, 70, { damage: 99 }),
        hazard("w-thorn-03", "thorn", 3450, 592, 70, 28)
      ],
      enemies: [
        enemy("w-enemy-01", "seed-hopper", 790, 566, 735, 1020, { speed: 46 }),
        enemy("w-enemy-02", "kite-mite", 1510, 388, 1380, 1710, { yBob: 30, speed: 64 }),
        enemy("w-enemy-03", "seed-hopper", 2130, 566, 2050, 2350, { speed: 54 }),
        enemy("w-enemy-04", "kite-mite", 2860, 370, 2720, 3060, { yBob: 34, speed: 70 }),
        enemy("w-enemy-05", "seed-hopper", 3470, 566, 3400, 3640, { speed: 62 })
      ],
      collectibles: [
        collectible("w-seed-01", "memory-seed", 320, 465),
        collectible("w-seed-02", "memory-seed", 855, 440),
        collectible("w-seed-03", "memory-seed", 1075, 365),
        collectible("w-seed-04", "memory-seed", 1505, 398),
        collectible("w-seed-05", "memory-seed", 1715, 395),
        collectible("w-heart-01", "heart", 2150, 440),
        collectible("w-seed-06", "memory-seed", 2390, 350),
        collectible("w-seed-07", "memory-seed", 2890, 420),
        collectible("w-feather", "wind-feather", 3150, 350, { duration: 8 }),
        collectible("w-seed-08", "memory-seed", 3580, 465)
      ],
      checkpoints: [checkpoint("w-check-01", 2055, 528, 2070, 536)],
      mechanics: {
        type: "wind",
        windZones: [
          { id: "wind-a", x: 500, y: 260, w: 235, h: 410, forceX: 115, forceY: -185, pulse: 1.4 },
          { id: "wind-b", x: 1170, y: 205, w: 220, h: 465, forceX: 165, forceY: -150, pulse: 1.1 },
          { id: "wind-c", x: 1800, y: 180, w: 245, h: 490, forceX: 145, forceY: -215, pulse: 1.5 },
          { id: "wind-d", x: 2480, y: 235, w: 205, h: 435, forceX: -78, forceY: -160, pulse: 1.25 },
          { id: "wind-e", x: 3160, y: 160, w: 205, h: 510, forceX: 178, forceY: -205, pulse: 1.35 }
        ],
        turbines: [
          { id: "turbine-a", x: 575, y: 530, radius: 58, direction: 1 },
          { id: "turbine-b", x: 1905, y: 525, radius: 66, direction: 1 },
          { id: "turbine-c", x: 2925, y: 360, radius: 92, direction: -1 }
        ],
        gustCycle: { calm: 1.6, telegraph: 0.65, strong: 1.4 }
      },
      boss: null
    },

    {
      id: 2,
      key: "echo-crystal-cave",
      act: 1,
      kind: "stage",
      name: "回声晶洞",
      nameEn: "ECHO CRYSTAL CAVE",
      subtitle: "让沉睡的路发光",
      briefing: {
        kicker: "STAGE 02 · RESONANCE",
        title: "回声晶洞",
        subtitle: "让沉睡的路发光",
        mechanic: "用脉冲击中音晶，隐藏的晶桥会在回声中显形。",
        hint: "晶体按亮度分三拍，跟着亮起的顺序前进。"
      },
      theme: {
        id: "crystal-cave",
        palette: {
          skyTop: "#122B3A",
          skyBottom: "#315A66",
          ink: "#06151E",
          paper: "#EDE5D1",
          ground: "#263F48",
          groundDark: "#142731",
          platform: "#6A8A91",
          accent: "#71C7D4",
          accent2: "#E8B8DA",
          danger: "#F05D4E",
          fog: "#557481"
        },
        material: "mica-crystal",
        ambient: { type: "crystal-dust", count: 26, speed: 0.24 },
        landmark: {
          type: "crystal-cathedral",
          x: 3170,
          y: 92,
          scale: 1.32,
          accent: "#71C7D4"
        }
      },
      worldWidth: 4200,
      worldHeight: WORLD_HEIGHT,
      killY: 805,
      camera: { mode: "follow", deadZoneX: 0.36, lookAhead: 135 },
      spawn: { x: 82, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4028,
        y: 470,
        w: 92,
        h: 150,
        requires: "crystal-crown"
      },
      platforms: [
        platform("c-ground-01", 0, 620, 610, 100, { material: "cave-rock" }),
        platform("c-ledge-01", 280, 505, 185, 24, { kind: "one-way", material: "crystal-rock" }),
        platform("c-ground-02", 780, 620, 510, 100, { material: "cave-rock" }),
        platform("c-hidden-01", 610, 525, 170, 22, {
          kind: "resonant",
          material: "ghost-crystal",
          enabledBy: "crystal-a"
        }),
        platform("c-ledge-02", 900, 470, 180, 24, { kind: "one-way", material: "crystal-rock" }),
        platform("c-hidden-02", 1170, 405, 170, 22, {
          kind: "resonant",
          material: "ghost-crystal",
          enabledBy: "crystal-b"
        }),
        platform("c-ground-03", 1450, 620, 490, 100, { material: "cave-rock" }),
        platform("c-column-01", 1530, 500, 150, 120, { material: "crystal-column" }),
        platform("c-column-02", 1760, 425, 150, 195, { material: "crystal-column" }),
        platform("c-ground-04", 2110, 620, 470, 100, { material: "cave-rock" }),
        platform("c-hidden-03", 1935, 475, 175, 22, {
          kind: "resonant",
          material: "ghost-crystal",
          enabledBy: "crystal-c"
        }),
        platform("c-ledge-03", 2200, 490, 160, 22, { kind: "one-way", material: "crystal-rock" }),
        platform("c-ledge-04", 2410, 405, 150, 22, { kind: "one-way", material: "crystal-rock" }),
        platform("c-ground-05", 2760, 620, 610, 100, { material: "cave-rock" }),
        platform("c-hidden-04", 2580, 340, 190, 22, {
          kind: "resonant",
          material: "ghost-crystal",
          enabledBy: "crystal-d"
        }),
        platform("c-organ-01", 2900, 500, 160, 120, { material: "organ-crystal" }),
        platform("c-organ-02", 3090, 430, 160, 190, { material: "organ-crystal" }),
        platform("c-ground-06", 3540, 620, 660, 100, { material: "cave-rock" }),
        platform("c-hidden-05", 3370, 485, 170, 22, {
          kind: "resonant",
          material: "ghost-crystal",
          enabledBy: "crystal-e"
        }),
        platform("c-finish-ledge", 3720, 475, 210, 24, { kind: "one-way", material: "crystal-rock" })
      ],
      hazards: [
        hazard("c-pit-01", "fall", 610, 665, 170, 55, { damage: 99 }),
        hazard("c-spike-01", "crystal-spike", 1110, 588, 90, 32),
        hazard("c-pit-02", "fall", 1290, 665, 160, 55, { damage: 99 }),
        hazard("c-stalactite-01", "falling-stalactite", 1675, 155, 42, 120, {
          triggerX: 1510,
          telegraph: 0.8
        }),
        hazard("c-pit-03", "fall", 1940, 665, 170, 55, { damage: 99 }),
        hazard("c-spike-02", "crystal-spike", 2290, 588, 82, 32),
        hazard("c-pit-04", "fall", 2580, 665, 180, 55, { damage: 99 }),
        hazard("c-stalactite-02", "falling-stalactite", 3015, 125, 46, 132, {
          triggerX: 2860,
          telegraph: 0.72
        }),
        hazard("c-pit-05", "fall", 3370, 665, 170, 55, { damage: 99 }),
        hazard("c-spike-03", "crystal-spike", 3820, 588, 94, 32)
      ],
      enemies: [
        enemy("c-enemy-01", "shard-crawler", 820, 568, 800, 1050, { hp: 2, speed: 38 }),
        enemy("c-enemy-02", "echo-bat", 1530, 360, 1460, 1880, { yBob: 42, speed: 72 }),
        enemy("c-enemy-03", "shard-crawler", 2160, 568, 2130, 2450, { hp: 2, speed: 45 }),
        enemy("c-enemy-04", "echo-bat", 2830, 310, 2780, 3260, { yBob: 54, speed: 78 }),
        enemy("c-enemy-05", "shard-crawler", 3625, 568, 3580, 3880, { hp: 2, speed: 52 })
      ],
      collectibles: [
        collectible("c-seed-01", "memory-seed", 365, 450),
        collectible("c-seed-02", "memory-seed", 690, 475),
        collectible("c-seed-03", "memory-seed", 990, 415),
        collectible("c-heart-01", "heart", 1235, 345),
        collectible("c-seed-04", "memory-seed", 1620, 450),
        collectible("c-seed-05", "memory-seed", 1840, 370),
        collectible("c-seed-06", "memory-seed", 2280, 435),
        collectible("c-resonator", "resonance-orb", 2655, 285, { duration: 10 }),
        collectible("c-seed-07", "memory-seed", 3165, 375),
        collectible("c-seed-08", "memory-seed", 3450, 430),
        collectible("c-crown", "crystal-crown", 3830, 420, { quest: true })
      ],
      checkpoints: [
        checkpoint("c-check-01", 1485, 528, 1500, 536),
        checkpoint("c-check-02", 2805, 528, 2820, 536)
      ],
      mechanics: {
        type: "resonance",
        crystals: [
          { id: "crystal-a", x: 500, y: 470, pitch: 1, duration: 7.5, color: "#71C7D4" },
          { id: "crystal-b", x: 1040, y: 425, pitch: 2, duration: 7.2, color: "#E8B8DA" },
          { id: "crystal-c", x: 1840, y: 365, pitch: 3, duration: 7.8, color: "#F6C453" },
          { id: "crystal-d", x: 2480, y: 360, pitch: 2, duration: 8.2, color: "#71C7D4" },
          { id: "crystal-e", x: 3270, y: 390, pitch: 1, duration: 9, color: "#E8B8DA" }
        ],
        resonanceLinks: [
          { crystal: "crystal-a", platforms: ["c-hidden-01"] },
          { crystal: "crystal-b", platforms: ["c-hidden-02"] },
          { crystal: "crystal-c", platforms: ["c-hidden-03"] },
          { crystal: "crystal-d", platforms: ["c-hidden-04"] },
          { crystal: "crystal-e", platforms: ["c-hidden-05"] }
        ],
        echoOrder: ["crystal-a", "crystal-c", "crystal-b", "crystal-d", "crystal-e"]
      },
      boss: null
    },

    {
      id: 3,
      key: "gear-greenhouse",
      act: 1,
      kind: "stage",
      name: "齿轮温室",
      nameEn: "GEARGLASS CONSERVATORY",
      subtitle: "给机械花园重新上弦",
      briefing: {
        kicker: "STAGE 03 · MACHINERY",
        title: "齿轮温室",
        subtitle: "给机械花园重新上弦",
        mechanic: "脉冲击打铜铃开关，改变传送带方向并抬起齿轮门。",
        hint: "裂纹玻璃只承重一会儿，落脚后继续移动。"
      },
      theme: {
        id: "gear-greenhouse",
        palette: {
          skyTop: "#96C6B1",
          skyBottom: "#E7DEB5",
          ink: "#12262A",
          paper: "#F4EDDA",
          ground: "#42685C",
          groundDark: "#263E39",
          platform: "#B78B56",
          accent: "#F6C453",
          accent2: "#2AB7A9",
          danger: "#C94D43",
          fog: "#D2E1C3"
        },
        material: "brass-and-glass",
        ambient: { type: "pollen-gears", count: 28, speed: 0.46 },
        landmark: {
          type: "clockwork-sunflower",
          x: 3250,
          y: 108,
          scale: 1.55,
          accent: "#F6C453"
        }
      },
      worldWidth: 4500,
      worldHeight: WORLD_HEIGHT,
      killY: 790,
      camera: { mode: "follow", deadZoneX: 0.36, lookAhead: 145 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4330,
        y: 486,
        w: 92,
        h: 134,
        requires: "all-gear-doors"
      },
      platforms: [
        platform("g-ground-01", 0, 620, 610, 100, { material: "greenhouse-soil" }),
        platform("g-belt-01", 260, 510, 300, 26, {
          kind: "conveyor",
          material: "brass-belt",
          conveyor: { speed: 95, group: "belt-a" }
        }),
        platform("g-ground-02", 730, 620, 500, 100, { material: "greenhouse-soil" }),
        platform("g-glass-01", 810, 485, 150, 20, {
          kind: "fragile",
          material: "cracked-glass",
          fragile: { delay: 0.8, respawn: 3.5 }
        }),
        platform("g-glass-02", 1010, 410, 150, 20, {
          kind: "fragile",
          material: "cracked-glass",
          fragile: { delay: 0.72, respawn: 3.5 }
        }),
        platform("g-ground-03", 1400, 620, 540, 100, { material: "greenhouse-soil" }),
        platform("g-belt-02", 1460, 500, 330, 26, {
          kind: "conveyor",
          material: "brass-belt",
          conveyor: { speed: -110, group: "belt-b" }
        }),
        platform("g-lift-01", 1820, 420, 150, 24, {
          kind: "moving",
          material: "gear-lift",
          motion: { axis: "y", distance: 160, speed: 0.65, phase: 0 }
        }),
        platform("g-ground-04", 2110, 620, 500, 100, { material: "greenhouse-soil" }),
        platform("g-glass-03", 2175, 485, 150, 20, {
          kind: "fragile",
          material: "cracked-glass",
          fragile: { delay: 0.68, respawn: 4 }
        }),
        platform("g-glass-04", 2380, 405, 160, 20, {
          kind: "fragile",
          material: "cracked-glass",
          fragile: { delay: 0.65, respawn: 4 }
        }),
        platform("g-ground-05", 2780, 620, 570, 100, { material: "greenhouse-soil" }),
        platform("g-belt-03", 2850, 500, 360, 26, {
          kind: "conveyor",
          material: "brass-belt",
          conveyor: { speed: 125, group: "belt-c" }
        }),
        platform("g-lift-02", 3270, 430, 155, 24, {
          kind: "moving",
          material: "gear-lift",
          motion: { axis: "x", distance: 145, speed: 0.82, phase: 0.35 }
        }),
        platform("g-ground-06", 3520, 620, 460, 100, { material: "greenhouse-soil" }),
        platform("g-glass-05", 3610, 480, 160, 20, {
          kind: "fragile",
          material: "cracked-glass",
          fragile: { delay: 0.62, respawn: 4.2 }
        }),
        platform("g-ground-07", 4130, 620, 370, 100, { material: "greenhouse-soil" }),
        platform("g-finish-ledge", 4210, 500, 160, 24, { kind: "one-way", material: "brass-bloom" })
      ],
      hazards: [
        hazard("g-pit-01", "fall", 610, 660, 120, 60, { damage: 99 }),
        hazard("g-cog-01", "saw-gear", 1135, 560, 74, 60, { radius: 34, angularSpeed: 2.1 }),
        hazard("g-pit-02", "fall", 1230, 660, 170, 60, { damage: 99 }),
        hazard("g-cog-02", "saw-gear", 1860, 548, 78, 72, { radius: 36, angularSpeed: -2.3 }),
        hazard("g-pit-03", "fall", 1940, 660, 170, 60, { damage: 99 }),
        hazard("g-steam-01", "steam-jet", 2510, 530, 54, 90, { on: 1.2, off: 1.8, phase: 0.4 }),
        hazard("g-pit-04", "fall", 2610, 660, 170, 60, { damage: 99 }),
        hazard("g-cog-03", "saw-gear", 3220, 552, 82, 68, { radius: 38, angularSpeed: 2.5 }),
        hazard("g-pit-05", "fall", 3350, 660, 170, 60, { damage: 99 }),
        hazard("g-steam-02", "steam-jet", 3870, 520, 58, 100, { on: 1.1, off: 1.4, phase: 0.9 }),
        hazard("g-pit-06", "fall", 3980, 660, 150, 60, { damage: 99 })
      ],
      enemies: [
        enemy("g-enemy-01", "tin-snail", 780, 568, 760, 1060, { hp: 2, speed: 35 }),
        enemy("g-enemy-02", "pollen-drone", 1510, 385, 1430, 1840, { hp: 2, yBob: 35, speed: 66 }),
        enemy("g-enemy-03", "tin-snail", 2170, 568, 2140, 2450, { hp: 2, speed: 43 }),
        enemy("g-enemy-04", "pollen-drone", 2890, 390, 2820, 3260, { hp: 2, yBob: 42, speed: 73 }),
        enemy("g-enemy-05", "tin-snail", 3590, 568, 3550, 3870, { hp: 3, speed: 50 }),
        enemy("g-enemy-06", "pollen-drone", 4160, 382, 4100, 4400, { hp: 2, yBob: 28, speed: 82 })
      ],
      collectibles: [
        collectible("g-seed-01", "memory-seed", 345, 455),
        collectible("g-seed-02", "memory-seed", 885, 430),
        collectible("g-seed-03", "memory-seed", 1085, 355),
        collectible("g-heart-01", "heart", 1535, 445),
        collectible("g-seed-04", "memory-seed", 1885, 365),
        collectible("g-seed-05", "memory-seed", 2250, 430),
        collectible("g-clock-spring", "clock-spring", 2460, 350, { duration: 9 }),
        collectible("g-seed-06", "memory-seed", 2960, 445),
        collectible("g-seed-07", "memory-seed", 3330, 370),
        collectible("g-seed-08", "memory-seed", 3660, 425),
        collectible("g-seed-09", "memory-seed", 4250, 445)
      ],
      checkpoints: [
        checkpoint("g-check-01", 1430, 528, 1448, 536),
        checkpoint("g-check-02", 2820, 528, 2840, 536)
      ],
      mechanics: {
        type: "clockwork",
        switches: [
          { id: "switch-a", x: 1090, y: 360, color: "#F6C453", toggles: ["door-a", "belt-a"] },
          { id: "switch-b", x: 2425, y: 355, color: "#2AB7A9", toggles: ["door-b", "belt-b"] },
          { id: "switch-c", x: 3680, y: 430, color: "#F05D4E", toggles: ["door-c", "belt-c"] }
        ],
        gates: [
          { id: "door-a", x: 1192, y: 395, w: 38, h: 225, openBy: "switch-a" },
          { id: "door-b", x: 2570, y: 380, w: 40, h: 240, openBy: "switch-b" },
          { id: "door-c", x: 3940, y: 370, w: 40, h: 250, openBy: "switch-c" }
        ],
        conveyorGroups: [
          { id: "belt-a", defaultDirection: 1, toggledDirection: -1 },
          { id: "belt-b", defaultDirection: -1, toggledDirection: 1 },
          { id: "belt-c", defaultDirection: 1, toggledDirection: -1 }
        ],
        gearRhythm: { period: 3.2, pause: 0.4 }
      },
      boss: null
    },

    {
      id: 4,
      key: "steam-beetle",
      act: 1,
      kind: "boss",
      name: "沸压虫巢",
      nameEn: "BOILER BEETLE",
      subtitle: "冷却失控的钢铁守门者",
      briefing: {
        kicker: "BOSS 01 · PRESSURE",
        title: "蒸汽甲虫",
        subtitle: "冷却失控的钢铁守门者",
        mechanic: "击亮两侧冷却阀，再诱导冲锋经过中央霜风口。",
        hint: "甲虫结霜翻倒时，跳上背部攻击发光核心。"
      },
      theme: {
        id: "boiler-nest",
        palette: {
          skyTop: "#25343A",
          skyBottom: "#6A5148",
          ink: "#091A21",
          paper: "#EFE2C8",
          ground: "#554841",
          groundDark: "#2E2A29",
          platform: "#9C7655",
          accent: "#F6C453",
          accent2: "#71C7D4",
          danger: "#F05D4E",
          fog: "#AC9180"
        },
        material: "riveted-boiler",
        ambient: { type: "steam-sparks", count: 32, speed: 0.7 },
        landmark: {
          type: "pressure-gauge-moon",
          x: 2110,
          y: 90,
          scale: 1.5,
          accent: "#F05D4E"
        }
      },
      worldWidth: 3200,
      worldHeight: WORLD_HEIGHT,
      killY: 790,
      camera: { mode: "boss-lock", deadZoneX: 0.42, lookAhead: 90 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 3020,
        y: 482,
        w: 96,
        h: 138,
        requires: "boss-defeated"
      },
      platforms: [
        platform("b1-ground-entry", 0, 620, 860, 100, { material: "boiler-floor" }),
        platform("b1-entry-ledge", 340, 500, 190, 24, { kind: "one-way", material: "rusted-grate" }),
        platform("b1-bridge", 860, 565, 320, 55, { material: "rusted-grate" }),
        platform("b1-arena-floor", 1180, 620, 1660, 100, { material: "boiler-floor" }),
        platform("b1-valve-left", 1260, 455, 205, 26, { kind: "one-way", material: "coolant-pipe" }),
        platform("b1-perch-left", 1510, 365, 160, 24, { kind: "one-way", material: "rusted-grate" }),
        platform("b1-perch-center", 1910, 430, 300, 24, { kind: "one-way", material: "rusted-grate" }),
        platform("b1-perch-right", 2380, 365, 160, 24, { kind: "one-way", material: "rusted-grate" }),
        platform("b1-valve-right", 2570, 455, 205, 26, { kind: "one-way", material: "coolant-pipe" }),
        platform("b1-ground-exit", 2840, 620, 360, 100, { material: "boiler-floor" })
      ],
      hazards: [
        hazard("b1-steam-entry", "steam-jet", 710, 520, 58, 100, { on: 1.2, off: 1.3, phase: 0.5 }),
        hazard("b1-steam-left", "steam-jet", 1450, 510, 60, 110, { on: 1, off: 1.55, phase: 0.15 }),
        hazard("b1-steam-mid-left", "steam-jet", 1740, 520, 58, 100, { on: 1.1, off: 1.4, phase: 0.7 }),
        hazard("b1-steam-mid-right", "steam-jet", 2220, 520, 58, 100, { on: 1.1, off: 1.4, phase: 1.25 }),
        hazard("b1-steam-right", "steam-jet", 2540, 510, 60, 110, { on: 1, off: 1.55, phase: 0.95 })
      ],
      enemies: [
        enemy("b1-minion-01", "steam-tick", 930, 520, 875, 1120, { hp: 2, speed: 58 }),
        enemy("b1-minion-02", "steam-tick", 1640, 560, 1270, 1880, { hp: 2, speed: 66, spawnOnBossPhase: 2 }),
        enemy("b1-minion-03", "steam-tick", 2390, 560, 2200, 2760, { hp: 2, speed: 70, spawnOnBossPhase: 3 })
      ],
      collectibles: [
        collectible("b1-seed-01", "memory-seed", 430, 445),
        collectible("b1-heart-01", "heart", 1040, 505),
        collectible("b1-coolant", "coolant-charge", 2045, 370, { charges: 3 }),
        collectible("b1-heart-02", "heart", 2700, 405, { spawnOnBossPhase: 3 }),
        collectible("b1-core", "guardian-core", 2090, 510, { quest: true, spawnOnBossDefeat: true })
      ],
      checkpoints: [checkpoint("b1-check-01", 1080, 478, 1100, 520)],
      mechanics: {
        type: "coolant-trap",
        arenaTrigger: { x: 1210, lockLeft: 1180, lockRight: 2840 },
        coolantValves: [
          { id: "valve-left", x: 1360, y: 410, radius: 30, hits: 1, activeDuration: 7 },
          { id: "valve-right", x: 2670, y: 410, radius: 30, hits: 1, activeDuration: 7 }
        ],
        frostVent: {
          id: "frost-vent",
          x: 1960,
          y: 575,
          w: 220,
          h: 45,
          activeWhen: "both-valves",
          duration: 5.5
        },
        defeatRecipe: ["activate-both-valves", "bait-charge-over-vent", "attack-exposed-core"]
      },
      boss: {
        id: "boiler-beetle",
        name: "蒸汽甲虫 · 锅炉守门者",
        maxHealth: 9,
        arena: { x: 1180, y: 240, w: 1660, h: 380 },
        spawn: { x: 2240, y: 522 },
        body: { w: 178, h: 98 },
        weakPoint: {
          type: "core",
          offsetX: 0,
          offsetY: -58,
          vulnerableState: "frost-stunned",
          damagePerHit: 1,
          maxHitsPerStun: 3
        },
        phases: [
          { atHealth: 9, name: "升压", chargeSpeed: 330, steamCount: 2, stunTime: 3.4 },
          { atHealth: 6, name: "过热", chargeSpeed: 395, steamCount: 3, stunTime: 2.8 },
          { atHealth: 3, name: "红线", chargeSpeed: 465, steamCount: 4, stunTime: 2.3 }
        ],
        mechanism: {
          shielded: true,
          chargeTelegraph: 0.82,
          turnDelay: 0.45,
          ventStateRequired: "active",
          stunOnVentCrossing: true,
          defeatEffect: "pressure-release"
        }
      }
    },

    {
      id: 5,
      key: "tidal-ruins",
      act: 2,
      kind: "stage",
      name: "潮汐遗迹",
      nameEn: "TIDAL ARCHIVES",
      subtitle: "在涨落之间读懂石城",
      tags: ["区域修复", "潮汐探索", "自由路线"],
      thumbnail: "linear-gradient(145deg, #4AA8B5 0%, #2A777D 52%, #F0D9AE 100%)",
      briefing: {
        kicker: "STAGE 05 · TIDE",
        title: "潮汐遗迹",
        subtitle: "在涨落之间读懂石城",
        mechanic: "海水按固定节拍涨落；水中可连按跳跃上浮，也能借水流穿门。",
        hint: "蓝纹石柱会在低潮露出，橙纹拱门只在高潮开启。"
      },
      theme: {
        id: "tidal-ruins",
        palette: {
          skyTop: "#4AA8B5",
          skyBottom: "#F0D9AE",
          ink: "#08212A",
          paper: "#F4EDDA",
          ground: "#496E6B",
          groundDark: "#27464A",
          platform: "#C5B38D",
          accent: "#F6C453",
          accent2: "#2AB7A9",
          danger: "#D8564B",
          fog: "#B8DDD7"
        },
        material: "salt-worn-stone",
        ambient: { type: "foam-gulls", count: 24, speed: 0.62 },
        landmark: {
          type: "sunken-astrolabe",
          x: 3180,
          y: 112,
          scale: 1.48,
          accent: "#F6C453"
        }
      },
      worldWidth: 4400,
      worldHeight: WORLD_HEIGHT,
      killY: 835,
      camera: { mode: "follow", deadZoneX: 0.36, lookAhead: 135 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "sanctuary",
        x: 2030,
        y: 466,
        w: 140,
        h: 154,
        requires: { type: "repair-zones", count: 2, submit: true, label: "潮汐修复点" }
      },
      objectives: [
        {
          id: "tide-repair-route",
          type: "repair-zones",
          label: "潮汐锚点",
          required: 2,
          submitAtGoal: true,
          zones: [
            { id: "t-repair-west", x: 690, y: 500, w: 78, h: 120, label: "西侧星盘" },
            { id: "t-repair-deep", x: 2790, y: 390, w: 86, h: 130, label: "深潮碑" },
            { id: "t-repair-east", x: 3715, y: 440, w: 88, h: 180, label: "东侧潮门" }
          ]
        }
      ],
      platforms: [
        platform("t-ground-01", 0, 620, 560, 100, { material: "ruin-stone" }),
        platform("t-step-01", 250, 500, 180, 24, { kind: "one-way", material: "salt-ledge" }),
        platform("t-sunken-01", 560, 670, 470, 50, { material: "sunken-stone" }),
        platform("t-column-01", 660, 510, 120, 160, { material: "rune-column" }),
        platform("t-column-02", 880, 430, 120, 240, { material: "rune-column" }),
        platform("t-ground-02", 1030, 620, 460, 100, { material: "ruin-stone" }),
        platform("t-float-01", 1200, 465, 170, 24, {
          kind: "floating",
          material: "reed-raft",
          motion: { axis: "y", distance: 70, speed: 0.55, phase: 0.1, followsTide: true }
        }),
        platform("t-sunken-02", 1490, 680, 520, 40, { material: "sunken-stone" }),
        platform("t-arch-01", 1610, 505, 170, 175, { material: "rune-arch" }),
        platform("t-ground-03", 2010, 620, 480, 100, { material: "ruin-stone" }),
        platform("t-float-02", 2140, 440, 180, 24, {
          kind: "floating",
          material: "reed-raft",
          motion: { axis: "y", distance: 95, speed: 0.6, phase: 0.55, followsTide: true }
        }),
        platform("t-sunken-03", 2490, 670, 560, 50, { material: "sunken-stone" }),
        platform("t-column-03", 2600, 490, 130, 180, { material: "rune-column" }),
        platform("t-column-04", 2860, 400, 130, 270, { material: "rune-column" }),
        platform("t-ground-04", 3050, 620, 500, 100, { material: "ruin-stone" }),
        platform("t-float-03", 3190, 460, 180, 24, {
          kind: "floating",
          material: "reed-raft",
          motion: { axis: "y", distance: 82, speed: 0.66, phase: 0.78, followsTide: true }
        }),
        platform("t-sunken-04", 3550, 680, 400, 40, { material: "sunken-stone" }),
        platform("t-arch-02", 3680, 485, 180, 195, { material: "rune-arch" }),
        platform("t-ground-05", 3950, 620, 450, 100, { material: "ruin-stone" }),
        platform("t-finish-step", 4050, 500, 180, 24, { kind: "one-way", material: "salt-ledge" })
      ],
      hazards: [
        hazard("t-urchin-01", "sea-urchin", 770, 642, 58, 28),
        hazard("t-urchin-02", "sea-urchin", 1360, 592, 60, 28),
        hazard("t-current-01", "strong-current", 1500, 470, 500, 210, { damage: 0, forceX: 120 }),
        hazard("t-urchin-03", "sea-urchin", 2260, 592, 62, 28),
        hazard("t-current-02", "strong-current", 2500, 470, 540, 200, { damage: 0, forceX: -135 }),
        hazard("t-urchin-04", "sea-urchin", 2945, 642, 66, 28),
        hazard("t-current-03", "strong-current", 3550, 465, 390, 215, { damage: 0, forceX: 145 }),
        hazard("t-urchin-05", "sea-urchin", 3810, 650, 64, 28)
      ],
      enemies: [
        enemy("t-enemy-01", "reef-crab", 1080, 568, 1050, 1370, { hp: 2, speed: 42 }),
        enemy("t-enemy-02", "paper-jelly", 1650, 420, 1510, 1940, { hp: 2, yBob: 58, speed: 52 }),
        enemy("t-enemy-03", "reef-crab", 2060, 568, 2030, 2390, { hp: 2, speed: 48 }),
        enemy("t-enemy-04", "paper-jelly", 2670, 380, 2520, 2970, { hp: 2, yBob: 68, speed: 58 }),
        enemy("t-enemy-05", "reef-crab", 3110, 568, 3080, 3440, { hp: 3, speed: 54 }),
        enemy("t-enemy-06", "paper-jelly", 3700, 400, 3580, 3900, { hp: 2, yBob: 55, speed: 65 })
      ],
      collectibles: [
        collectible("t-seed-01", "memory-seed", 330, 445),
        collectible("t-seed-02", "memory-seed", 1270, 410),
        collectible("t-heart-01", "heart", 1730, 445),
        collectible("t-seed-03", "memory-seed", 2190, 380),
        collectible("t-seed-04", "memory-seed", 3270, 405),
        collectible("t-pearl", "air-pearl", 3590, 520, { duration: 12 }),
        collectible("t-seed-05", "memory-seed", 4100, 445)
      ],
      checkpoints: [
        checkpoint("t-check-01", 2060, 528, 2080, 536),
        checkpoint("t-check-02", 3100, 528, 3120, 536)
      ],
      mechanics: {
        type: "tide",
        sanctuary: { id: "t-central-sanctuary", x: 2030, y: 466, w: 140, h: 154 },
        water: {
          lowY: 675,
          highY: 445,
          period: 10,
          holdLow: 1.5,
          holdHigh: 1.5,
          phase: 0,
          swimGravity: 0.22,
          buoyancy: 560
        },
        tideGates: [
          { id: "tide-gate-a", x: 1435, y: 410, w: 55, h: 210, openAt: "high" },
          { id: "tide-gate-b", x: 2995, y: 380, w: 55, h: 240, openAt: "low" },
          { id: "tide-gate-c", x: 3895, y: 400, w: 55, h: 220, openAt: "high" }
        ],
        currents: [
          { id: "current-a", hazard: "t-current-01", activeAt: "rising" },
          { id: "current-b", hazard: "t-current-02", activeAt: "falling" },
          { id: "current-c", hazard: "t-current-03", activeAt: "rising" }
        ]
      },
      boss: null
    },

    {
      id: 6,
      key: "sky-cargo-line",
      act: 2,
      kind: "stage",
      name: "天际货运线",
      nameEn: "SKYFREIGHT EXPRESS",
      subtitle: "别让云海追上车尾",
      briefing: {
        kicker: "STAGE 06 · MOMENTUM",
        title: "天际货运线",
        subtitle: "别让云海追上车尾",
        mechanic: "画面会自动前进；在货箱、吊钩和列车顶之间保持节奏。",
        hint: "击打风向扇能短暂反转侧风，红色货箱踩两次就会坠落。"
      },
      theme: {
        id: "skyfreight",
        palette: {
          skyTop: "#4D9FC4",
          skyBottom: "#F0D39A",
          ink: "#071C27",
          paper: "#F4EDDA",
          ground: "#3D5661",
          groundDark: "#253A45",
          platform: "#A36F4C",
          accent: "#F6C453",
          accent2: "#71C7D4",
          danger: "#F05D4E",
          fog: "#D8E7DE"
        },
        material: "painted-cargo-steel",
        ambient: { type: "cloud-ribbons", count: 30, speed: 1.1 },
        landmark: {
          type: "walking-crane",
          x: 3610,
          y: 95,
          scale: 1.55,
          accent: "#F6C453"
        }
      },
      worldWidth: 4800,
      worldHeight: WORLD_HEIGHT,
      killY: 760,
      camera: { mode: "autoscroll", deadZoneX: 0.3, lookAhead: 210, speed: 78, maxSpeed: 118 },
      spawn: { x: 120, y: 496, facing: 1 },
      goal: {
        type: "engine-cab",
        x: 4625,
        y: 420,
        w: 115,
        h: 150,
        requires: "reach"
      },
      platforms: [
        platform("s-train-01", 0, 580, 650, 140, { material: "cargo-train" }),
        platform("s-crate-01", 270, 485, 150, 95, { material: "cargo-crate" }),
        platform("s-fragile-01", 500, 440, 150, 24, {
          kind: "fragile",
          material: "red-cargo",
          fragile: { hits: 2, delay: 0.5, respawn: 0 }
        }),
        platform("s-hook-01", 720, 420, 150, 22, {
          kind: "moving",
          material: "hanging-pallet",
          motion: { axis: "y", distance: 115, speed: 0.82, phase: 0.2 }
        }),
        platform("s-train-02", 920, 610, 520, 110, { material: "cargo-train" }),
        platform("s-crate-02", 1010, 500, 180, 110, { material: "cargo-crate" }),
        platform("s-crate-03", 1200, 425, 150, 185, { material: "cargo-crate" }),
        platform("s-hook-02", 1480, 390, 160, 22, {
          kind: "moving",
          material: "hanging-pallet",
          motion: { axis: "x", distance: 130, speed: 0.9, phase: 0.65 }
        }),
        platform("s-train-03", 1720, 575, 610, 145, { material: "cargo-train" }),
        platform("s-fragile-02", 1790, 455, 160, 24, {
          kind: "fragile",
          material: "red-cargo",
          fragile: { hits: 2, delay: 0.48, respawn: 0 }
        }),
        platform("s-crate-04", 2020, 460, 190, 115, { material: "cargo-crate" }),
        platform("s-hook-03", 2360, 405, 160, 22, {
          kind: "moving",
          material: "hanging-pallet",
          motion: { axis: "y", distance: 130, speed: 0.95, phase: 0.4 }
        }),
        platform("s-train-04", 2600, 600, 570, 120, { material: "cargo-train" }),
        platform("s-crate-05", 2700, 490, 170, 110, { material: "cargo-crate" }),
        platform("s-fragile-03", 2920, 410, 150, 24, {
          kind: "fragile",
          material: "red-cargo",
          fragile: { hits: 2, delay: 0.44, respawn: 0 }
        }),
        platform("s-hook-04", 3200, 390, 165, 22, {
          kind: "moving",
          material: "hanging-pallet",
          motion: { axis: "x", distance: 145, speed: 1.02, phase: 0.1 }
        }),
        platform("s-train-05", 3480, 570, 600, 150, { material: "cargo-train" }),
        platform("s-crate-06", 3610, 455, 170, 115, { material: "cargo-crate" }),
        platform("s-crate-07", 3830, 380, 160, 190, { material: "cargo-crate" }),
        platform("s-hook-05", 4100, 420, 150, 22, {
          kind: "moving",
          material: "hanging-pallet",
          motion: { axis: "y", distance: 105, speed: 1.08, phase: 0.75 }
        }),
        platform("s-engine", 4320, 570, 480, 150, { material: "engine-car" }),
        platform("s-engine-roof", 4420, 410, 280, 24, { kind: "one-way", material: "engine-brass" })
      ],
      hazards: [
        hazard("s-void-01", "fall", 650, 665, 270, 55, { damage: 99 }),
        hazard("s-void-02", "fall", 1440, 665, 280, 55, { damage: 99 }),
        hazard("s-electric-01", "electric-coil", 2180, 535, 86, 40, { on: 1, off: 1.25, phase: 0.35 }),
        hazard("s-void-03", "fall", 2330, 665, 270, 55, { damage: 99 }),
        hazard("s-electric-02", "electric-coil", 3025, 560, 90, 40, { on: 0.9, off: 1.15, phase: 0.8 }),
        hazard("s-void-04", "fall", 3170, 665, 310, 55, { damage: 99 }),
        hazard("s-electric-03", "electric-coil", 3960, 530, 86, 40, { on: 0.8, off: 1.05, phase: 0.15 }),
        hazard("s-void-05", "fall", 4080, 665, 240, 55, { damage: 99 })
      ],
      enemies: [
        enemy("s-enemy-01", "cargo-bot", 1040, 556, 960, 1340, { hp: 2, speed: 62 }),
        enemy("s-enemy-02", "propeller-wasp", 1810, 350, 1740, 2250, { hp: 2, yBob: 38, speed: 94 }),
        enemy("s-enemy-03", "cargo-bot", 2700, 546, 2630, 3090, { hp: 3, speed: 70 }),
        enemy("s-enemy-04", "propeller-wasp", 3520, 330, 3460, 4010, { hp: 2, yBob: 44, speed: 105 }),
        enemy("s-enemy-05", "cargo-bot", 4380, 516, 4340, 4630, { hp: 3, speed: 78 })
      ],
      collectibles: [
        collectible("s-seed-01", "memory-seed", 340, 430),
        collectible("s-seed-02", "memory-seed", 790, 360),
        collectible("s-heart-01", "heart", 1270, 370),
        collectible("s-seed-03", "memory-seed", 1555, 330),
        collectible("s-seed-04", "memory-seed", 2100, 405),
        collectible("s-wings", "parcel-wings", 2430, 345, { duration: 9 }),
        collectible("s-seed-05", "memory-seed", 2790, 435),
        collectible("s-seed-06", "memory-seed", 3270, 330),
        collectible("s-heart-02", "heart", 3890, 325),
        collectible("s-seed-07", "memory-seed", 4160, 360),
        collectible("s-seed-08", "memory-seed", 4520, 355)
      ],
      checkpoints: [
        checkpoint("s-check-01", 1745, 483, 1770, 490),
        checkpoint("s-check-02", 3510, 478, 3535, 486)
      ],
      mechanics: {
        type: "autoscroll",
        scroll: { startX: 540, baseSpeed: 78, acceleration: 0.007, maxSpeed: 118, failMargin: 90 },
        windFans: [
          { id: "fan-a", x: 1320, y: 360, radius: 35, defaultForceX: -165, reversedForceX: 125, duration: 6 },
          { id: "fan-b", x: 2470, y: 345, radius: 35, defaultForceX: -185, reversedForceX: 145, duration: 5.5 },
          { id: "fan-c", x: 3950, y: 315, radius: 35, defaultForceX: -210, reversedForceX: 160, duration: 5 }
        ],
        cameraEvents: [
          { x: 1700, speed: 88 },
          { x: 2600, speed: 98 },
          { x: 3500, speed: 108 },
          { x: 4200, speed: 118 }
        ],
        cargoWarning: { fragileMaterial: "red-cargo", flashTime: 0.55 }
      },
      boss: null
    },

    {
      id: 7,
      key: "ember-forge",
      act: 2,
      kind: "stage",
      name: "余烬熔炉",
      nameEn: "EMBERROOT FOUNDRY",
      subtitle: "把火海铸成落脚点",
      briefing: {
        kicker: "STAGE 07 · FORGE",
        title: "余烬熔炉",
        subtitle: "把火海铸成落脚点",
        mechanic: "熔岩持续上升；击碎冷却荚会在火面凝出短暂黑曜石台。",
        hint: "铜钟会让熔岩回落一次，把它留给真正没路的时候。"
      },
      theme: {
        id: "ember-forge",
        palette: {
          skyTop: "#2B2428",
          skyBottom: "#784538",
          ink: "#100F13",
          paper: "#EEDCC0",
          ground: "#57423B",
          groundDark: "#2A2426",
          platform: "#7B5A49",
          accent: "#F6C453",
          accent2: "#71C7D4",
          danger: "#F05D4E",
          fog: "#9B6651"
        },
        material: "charcoal-iron",
        ambient: { type: "embers-ash", count: 38, speed: 0.88 },
        landmark: {
          type: "hammer-volcano",
          x: 3280,
          y: 72,
          scale: 1.62,
          accent: "#F05D4E"
        }
      },
      worldWidth: 4400,
      worldHeight: WORLD_HEIGHT,
      killY: 755,
      camera: { mode: "follow", deadZoneX: 0.36, lookAhead: 150 },
      spawn: { x: 90, y: 526, facing: 1 },
      goal: {
        type: "forge-lift",
        x: 4200,
        y: 365,
        w: 130,
        h: 205,
        requires: "forge-seal"
      },
      platforms: [
        platform("f-ground-01", 0, 610, 540, 110, { material: "forge-stone" }),
        platform("f-anvil-01", 285, 485, 170, 24, { kind: "one-way", material: "anvil-iron" }),
        platform("f-pillar-01", 700, 540, 160, 180, { material: "basalt" }),
        platform("f-pillar-02", 970, 450, 160, 270, { material: "basalt" }),
        platform("f-obsidian-01", 560, 585, 130, 24, {
          kind: "temporary",
          material: "obsidian",
          enabledBy: "coolant-a",
          lifetime: 8
        }),
        platform("f-ground-02", 1280, 610, 500, 110, { material: "forge-stone" }),
        platform("f-chain-01", 1390, 455, 155, 22, {
          kind: "moving",
          material: "chain-lift",
          motion: { axis: "y", distance: 135, speed: 0.75, phase: 0.1 }
        }),
        platform("f-obsidian-02", 1790, 570, 140, 24, {
          kind: "temporary",
          material: "obsidian",
          enabledBy: "coolant-b",
          lifetime: 7.5
        }),
        platform("f-pillar-03", 1940, 500, 170, 220, { material: "basalt" }),
        platform("f-pillar-04", 2200, 390, 170, 330, { material: "basalt" }),
        platform("f-ground-03", 2510, 610, 500, 110, { material: "forge-stone" }),
        platform("f-chain-02", 2620, 430, 160, 22, {
          kind: "moving",
          material: "chain-lift",
          motion: { axis: "x", distance: 145, speed: 0.85, phase: 0.5 }
        }),
        platform("f-obsidian-03", 3020, 555, 145, 24, {
          kind: "temporary",
          material: "obsidian",
          enabledBy: "coolant-c",
          lifetime: 7
        }),
        platform("f-pillar-05", 3180, 475, 175, 245, { material: "basalt" }),
        platform("f-pillar-06", 3450, 365, 175, 355, { material: "basalt" }),
        platform("f-ground-04", 3770, 610, 630, 110, { material: "forge-stone" }),
        platform("f-chain-03", 3860, 455, 165, 22, {
          kind: "moving",
          material: "chain-lift",
          motion: { axis: "y", distance: 105, speed: 0.95, phase: 0.25 }
        }),
        platform("f-lift-deck", 4130, 545, 240, 25, { kind: "one-way", material: "forge-lift" })
      ],
      hazards: [
        hazard("f-lava-01", "lava", 540, 630, 740, 90, { damage: 99 }),
        hazard("f-fire-01", "flame-jet", 1140, 400, 64, 220, { on: 1.1, off: 1.5, phase: 0.3 }),
        hazard("f-lava-02", "lava", 1780, 630, 730, 90, { damage: 99 }),
        hazard("f-fire-02", "flame-jet", 2350, 350, 62, 270, { on: 0.95, off: 1.35, phase: 0.8 }),
        hazard("f-lava-03", "lava", 3010, 630, 760, 90, { damage: 99 }),
        hazard("f-fire-03", "flame-jet", 3610, 335, 66, 285, { on: 0.88, off: 1.2, phase: 0.2 }),
        hazard("f-slag-01", "slag-spike", 3890, 580, 82, 30),
        hazard("f-slag-02", "slag-spike", 4050, 580, 82, 30)
      ],
      enemies: [
        enemy("f-enemy-01", "coal-golem", 1310, 552, 1290, 1640, { hp: 3, speed: 44 }),
        enemy("f-enemy-02", "cinder-bat", 2020, 335, 1950, 2310, { hp: 2, yBob: 46, speed: 82 }),
        enemy("f-enemy-03", "coal-golem", 2580, 552, 2540, 2920, { hp: 3, speed: 52 }),
        enemy("f-enemy-04", "cinder-bat", 3260, 300, 3190, 3570, { hp: 2, yBob: 52, speed: 94 }),
        enemy("f-enemy-05", "coal-golem", 3810, 552, 3790, 4100, { hp: 4, speed: 58 })
      ],
      collectibles: [
        collectible("f-seed-01", "memory-seed", 350, 430),
        collectible("f-coolant-01", "coolant-pod", 470, 520, { mechanismId: "coolant-a" }),
        collectible("f-seed-02", "memory-seed", 1050, 395),
        collectible("f-heart-01", "heart", 1470, 400),
        collectible("f-coolant-02", "coolant-pod", 1690, 520, { mechanismId: "coolant-b" }),
        collectible("f-seed-03", "memory-seed", 2260, 335),
        collectible("f-seed-04", "memory-seed", 2685, 375),
        collectible("f-coolant-03", "coolant-pod", 2930, 520, { mechanismId: "coolant-c" }),
        collectible("f-seed-05", "memory-seed", 3510, 310),
        collectible("f-bell", "quench-bell", 3900, 400, { uses: 1 }),
        collectible("f-seal", "forge-seal", 4040, 500, { quest: true })
      ],
      checkpoints: [
        checkpoint("f-check-01", 1315, 518, 1335, 526),
        checkpoint("f-check-02", 2550, 518, 2570, 526),
        checkpoint("f-check-03", 3805, 518, 3825, 526)
      ],
      mechanics: {
        type: "rising-lava",
        lava: {
          startY: 700,
          targetY: 465,
          riseSpeed: 5.4,
          checkpointDrop: 38,
          quenchBellDrop: 150,
          heatPulse: 2.8
        },
        coolantPods: [
          { id: "coolant-a", x: 470, y: 520, platforms: ["f-obsidian-01"], duration: 8 },
          { id: "coolant-b", x: 1690, y: 520, platforms: ["f-obsidian-02"], duration: 7.5 },
          { id: "coolant-c", x: 2930, y: 520, platforms: ["f-obsidian-03"], duration: 7 }
        ],
        quenchBell: { collectible: "f-bell", dropAmount: 150, uses: 1 },
        forgeSeal: { collectible: "f-seal", requiredForGoal: true }
      },
      boss: null
    },

    {
      id: 8,
      key: "eclipse-core",
      act: 2,
      kind: "boss",
      name: "日蚀天文台",
      nameEn: "ECLIPSE OBSERVATORY",
      subtitle: "把黑日的光还给星海",
      briefing: {
        kicker: "BOSS 02 · ECLIPSE",
        title: "蚀影观测者",
        subtitle: "把黑日的光还给星海",
        mechanic: "旋转左右星镜，让观测者的光束反射回黑日护盾。",
        hint: "护盾碎裂后核心只亮几秒；第三阶段要在移动镜台上完成反射。"
      },
      theme: {
        id: "eclipse-observatory",
        palette: {
          skyTop: "#0B1222",
          skyBottom: "#352C49",
          ink: "#050912",
          paper: "#EFE5D0",
          ground: "#34374D",
          groundDark: "#191C2E",
          platform: "#766D83",
          accent: "#F6C453",
          accent2: "#71C7D4",
          danger: "#F05D4E",
          fog: "#55516C"
        },
        material: "star-map-brass",
        ambient: { type: "orbiting-stars", count: 42, speed: 0.38 },
        landmark: {
          type: "black-sun-orrery",
          x: 2190,
          y: 68,
          scale: 1.72,
          accent: "#F6C453"
        }
      },
      worldWidth: 3500,
      worldHeight: WORLD_HEIGHT,
      killY: 790,
      camera: { mode: "boss-lock", deadZoneX: 0.42, lookAhead: 80 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "world-core",
        x: 3260,
        y: 430,
        w: 126,
        h: 190,
        requires: "boss-defeated"
      },
      platforms: [
        platform("e-ground-entry", 0, 620, 760, 100, { material: "observatory-stone" }),
        platform("e-entry-step", 300, 500, 190, 24, { kind: "one-way", material: "star-brass" }),
        platform("e-bridge", 760, 555, 340, 65, { material: "star-brass" }),
        platform("e-arena-floor", 1100, 620, 1960, 100, { material: "observatory-stone" }),
        platform("e-mirror-left", 1220, 430, 240, 26, { kind: "one-way", material: "mirror-dais" }),
        platform("e-orbit-left", 1560, 360, 170, 24, {
          kind: "moving",
          material: "orbit-platform",
          motion: { axis: "y", distance: 105, speed: 0.72, phase: 0.15 }
        }),
        platform("e-core-dais", 1900, 465, 360, 26, { kind: "one-way", material: "star-brass" }),
        platform("e-orbit-right", 2410, 360, 170, 24, {
          kind: "moving",
          material: "orbit-platform",
          motion: { axis: "y", distance: 105, speed: 0.72, phase: 0.65 }
        }),
        platform("e-mirror-right", 2700, 430, 240, 26, { kind: "one-way", material: "mirror-dais" }),
        platform("e-ground-exit", 3060, 620, 440, 100, { material: "observatory-stone" }),
        platform("e-world-core-step", 3180, 500, 190, 24, { kind: "one-way", material: "star-brass" })
      ],
      hazards: [
        hazard("e-void-entry", "star-void", 760, 655, 340, 65, { damage: 99, inactiveFloor: "e-bridge" }),
        hazard("e-starfall-01", "falling-star", 1450, 80, 44, 44, { interval: 2.2, telegraph: 0.75, phase: 0.2 }),
        hazard("e-starfall-02", "falling-star", 2020, 60, 44, 44, { interval: 1.8, telegraph: 0.7, phase: 0.8 }),
        hazard("e-starfall-03", "falling-star", 2700, 80, 44, 44, { interval: 2.1, telegraph: 0.72, phase: 1.3 }),
        hazard("e-void-rift-left", "void-rift", 1100, 590, 115, 30, { on: 1.3, off: 1.6, phase: 0.1 }),
        hazard("e-void-rift-center", "void-rift", 2270, 590, 150, 30, { on: 1.2, off: 1.45, phase: 0.75 }),
        hazard("e-void-rift-right", "void-rift", 2940, 590, 120, 30, { on: 1.1, off: 1.35, phase: 0.35 })
      ],
      enemies: [
        enemy("e-minion-01", "orbit-eye", 900, 400, 800, 1060, { hp: 2, yBob: 35, speed: 78 }),
        enemy("e-minion-02", "shadow-sprout", 1370, 560, 1160, 1750, { hp: 2, speed: 72, spawnOnBossPhase: 2 }),
        enemy("e-minion-03", "orbit-eye", 2530, 300, 2350, 2850, { hp: 3, yBob: 44, speed: 96, spawnOnBossPhase: 2 }),
        enemy("e-minion-04", "shadow-sprout", 2800, 560, 2450, 3000, { hp: 3, speed: 84, spawnOnBossPhase: 3 })
      ],
      collectibles: [
        collectible("e-seed-01", "memory-seed", 375, 445),
        collectible("e-heart-01", "heart", 980, 500),
        collectible("e-star-01", "star-charge", 1650, 300, { charges: 2 }),
        collectible("e-star-02", "star-charge", 2495, 300, { charges: 2 }),
        collectible("e-heart-02", "heart", 2860, 375, { spawnOnBossPhase: 3 }),
        collectible("e-core", "world-core-seed", 2110, 505, { quest: true, spawnOnBossDefeat: true })
      ],
      checkpoints: [checkpoint("e-check-01", 1010, 478, 1030, 520)],
      mechanics: {
        type: "mirror-reflection",
        arenaTrigger: { x: 1120, lockLeft: 1100, lockRight: 3060 },
        mirrors: [
          {
            id: "mirror-left",
            x: 1340,
            y: 392,
            angle: -45,
            angles: [-45, 0, 45],
            rotateBy: "pulse",
            platform: "e-mirror-left"
          },
          {
            id: "mirror-right",
            x: 2820,
            y: 392,
            angle: 45,
            angles: [-45, 0, 45],
            rotateBy: "pulse",
            platform: "e-mirror-right"
          }
        ],
        beam: {
          origin: { x: 2110, y: 255 },
          warmup: 1.15,
          duration: 1.3,
          cooldown: 2.1,
          width: 18,
          maxBounces: 3,
          playerDamage: 1
        },
        shield: { hitsToBreak: 2, recoverAfter: 7, exposedTime: 4.2 },
        defeatRecipe: ["aim-left-mirror", "aim-right-mirror", "reflect-beam-to-shield", "attack-exposed-core"]
      },
      boss: {
        id: "eclipse-observer",
        name: "蚀影观测者 · 黑日核心",
        maxHealth: 12,
        arena: { x: 1100, y: 190, w: 1960, h: 430 },
        spawn: { x: 2110, y: 260 },
        body: { w: 152, h: 152 },
        weakPoint: {
          type: "eclipse-core",
          offsetX: 0,
          offsetY: 0,
          vulnerableState: "shield-broken",
          damagePerHit: 1,
          maxHitsPerBreak: 4
        },
        phases: [
          { atHealth: 12, name: "偏光", beamBounces: 1, starfallCount: 1, orbitSpeed: 0.55 },
          { atHealth: 8, name: "双星", beamBounces: 2, starfallCount: 2, orbitSpeed: 0.78 },
          { atHealth: 4, name: "全蚀", beamBounces: 3, starfallCount: 3, orbitSpeed: 1.05 }
        ],
        mechanism: {
          shielded: true,
          shieldBreakBy: "reflected-beam",
          requiredMirrorHits: 2,
          teleportPoints: [
            { x: 1660, y: 285 },
            { x: 2110, y: 235 },
            { x: 2560, y: 285 }
          ],
          enrageAtHealth: 4,
          defeatEffect: "restore-constellation"
        }
      }
    },

    {
      id: 9,
      key: "stormbell-tower",
      act: 3,
      kind: "stage",
      name: "暴雨铜钟塔",
      nameEn: "STORMBELL TOWER",
      subtitle: "踏响雷簧，跃过雨墙",
      briefing: {
        kicker: "STAGE 09 · STORMBELL",
        title: "暴雨铜钟塔",
        subtitle: "踏响雷簧，跃过雨墙",
        mechanic: "踩上雷簧线圈会被弹向高塔；在最高点调整方向，接住下一座铜钟台。",
        hint: "亮起的线圈代表弹射力度，收集三枚雷光火种才能唤醒塔顶大钟。"
      },
      theme: {
        id: "stormbell-tower",
        palette: {
          skyTop: "#14283B",
          skyBottom: "#617D89",
          ink: "#07151F",
          paper: "#EFE7D7",
          ground: "#3C4C55",
          groundDark: "#1C2A32",
          platform: "#A36D45",
          accent: "#F3C94F",
          accent2: "#65DCE5",
          danger: "#E45B58",
          fog: "#8297A0"
        },
        material: "rain-darkened-copper",
        ambient: { type: "slant-rain-bell-sparks", count: 42, speed: 1.08 },
        landmark: {
          type: "storm-bell-spire",
          x: 3480,
          y: 92,
          scale: 1.58,
          accent: "#F3C94F"
        }
      },
      worldWidth: 4600,
      worldHeight: WORLD_HEIGHT,
      killY: 800,
      camera: { mode: "follow", deadZoneX: 0.35, lookAhead: 145 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4425,
        y: 486,
        w: 96,
        h: 134,
        requires: { type: "collect", itemType: "lumen-spore", count: 3, label: "雷光火种" }
      },
      platforms: [
        platform("lg-ground-01", 0, 620, 640, 100, { material: "rain-copper-stone" }),
        platform("lg-training-step", 245, 505, 175, 24, { kind: "one-way", material: "bell-brass" }),
        platform("lg-spring-01", 465, 570, 155, 28, { kind: "spring", material: "thunder-coil", bounceY: -760 }),
        platform("lg-canopy-01", 735, 475, 185, 26, { kind: "one-way", material: "bell-brass" }),
        platform("lg-ground-02", 920, 620, 390, 100, { material: "rain-copper-stone" }),
        platform("lg-spring-02", 1095, 570, 165, 28, { kind: "spring", material: "thunder-coil", bounceY: -840 }),
        platform("lg-canopy-02", 1275, 398, 180, 26, { kind: "one-way", material: "bell-brass" }),
        platform("lg-drifting-leaf-01", 1490, 478, 165, 22, {
          kind: "moving",
          material: "hanging-bell",
          motion: { axis: "y", distance: 68, speed: 0.72, phase: 0.2 }
        }),
        platform("lg-ground-03", 1680, 620, 520, 100, { material: "rain-copper-stone" }),
        platform("lg-root-ledge-01", 1760, 485, 180, 24, { kind: "one-way", material: "copper-rib" }),
        platform("lg-spring-03", 2040, 570, 150, 28, { kind: "spring", material: "thunder-coil", bounceY: -820 }),
        platform("lg-high-cap-01", 2205, 340, 175, 26, { kind: "one-way", material: "bell-brass" }),
        platform("lg-ground-04", 2400, 620, 460, 100, { material: "rain-copper-stone" }),
        platform("lg-tunnel-ledge-01", 2490, 505, 170, 24, { kind: "one-way", material: "copper-rib" }),
        platform("lg-tunnel-ledge-02", 2690, 420, 160, 24, { kind: "one-way", material: "copper-rib" }),
        platform("lg-spring-04", 2795, 570, 150, 28, { kind: "spring", material: "thunder-coil", bounceY: -805 }),
        platform("lg-drifting-leaf-02", 3000, 430, 170, 22, {
          kind: "moving",
          material: "hanging-bell",
          motion: { axis: "x", distance: 105, speed: 0.84, phase: 0.58 }
        }),
        platform("lg-ground-05", 3200, 620, 500, 100, { material: "rain-copper-stone" }),
        platform("lg-spring-05", 3370, 570, 160, 28, { kind: "spring", material: "thunder-coil", bounceY: -860 }),
        platform("lg-canopy-03", 3540, 388, 180, 26, { kind: "one-way", material: "bell-brass" }),
        platform("lg-cap-bridge", 3790, 475, 175, 26, { kind: "one-way", material: "bell-brass" }),
        platform("lg-ground-06", 3990, 620, 610, 100, { material: "rain-copper-stone" }),
        platform("lg-finish-step", 4230, 505, 185, 24, { kind: "one-way", material: "bell-brass" })
      ],
      hazards: [
        hazard("lg-pit-01", "fall", 640, 650, 280, 70, { damage: 99 }),
        hazard("lg-thorn-01", "electric-coil", 1010, 592, 72, 28),
        hazard("lg-pit-02", "fall", 1310, 650, 370, 70, { damage: 99 }),
        hazard("lg-stalactite-01", "stalactite", 1840, 245, 72, 135),
        hazard("lg-thorn-02", "electric-coil", 1935, 592, 78, 28),
        hazard("lg-pit-03", "fall", 2200, 650, 200, 70, { damage: 99 }),
        hazard("lg-thorn-03", "electric-coil", 2545, 592, 84, 28),
        hazard("lg-stalactite-02", "stalactite", 2695, 215, 74, 130),
        hazard("lg-pit-04", "fall", 2860, 650, 340, 70, { damage: 99 }),
        hazard("lg-thorn-04", "electric-coil", 3250, 592, 76, 28),
        hazard("lg-pit-05", "fall", 3700, 650, 290, 70, { damage: 99 }),
        hazard("lg-thorn-05", "electric-coil", 4100, 592, 82, 28)
      ],
      enemies: [
        enemy("lg-enemy-01", "steam-tick", 970, 566, 940, 1230, { hp: 2, speed: 52 }),
        enemy("lg-enemy-02", "propeller-wasp", 1410, 345, 1280, 1610, { hp: 2, yBob: 54, speed: 62 }),
        enemy("lg-enemy-03", "echo-bat", 1830, 350, 1710, 2100, { hp: 2, yBob: 44, speed: 78 }),
        enemy("lg-enemy-04", "thunder-drummer", 2460, 566, 2430, 2760, { hp: 3, speed: 52 }),
        enemy("lg-enemy-05", "propeller-wasp", 3040, 350, 2910, 3160, { hp: 2, yBob: 60, speed: 68 }),
        enemy("lg-enemy-06", "echo-bat", 3610, 305, 3470, 3890, { hp: 3, yBob: 48, speed: 86 }),
        enemy("lg-enemy-07", "steam-tick", 4140, 566, 4040, 4380, { hp: 3, speed: 66 })
      ],
      collectibles: [
        collectible("lg-seed-01", "memory-seed", 310, 450),
        collectible("lg-seed-02", "memory-seed", 820, 420),
        collectible("lg-spore-01", "lumen-spore", 1345, 338, { quest: true, order: 1, label: "雷光火种", badge: "雷" }),
        collectible("lg-wings", "parcel-wings", 1820, 430, { duration: 9 }),
        collectible("lg-seed-03", "memory-seed", 2260, 285),
        collectible("lg-heart-01", "heart", 2505, 455),
        collectible("lg-spore-02", "lumen-spore", 2735, 365, { quest: true, order: 2, label: "雷光火种", badge: "雷" }),
        collectible("lg-seed-04", "memory-seed", 3075, 372),
        collectible("lg-spore-03", "lumen-spore", 3605, 328, { quest: true, order: 3, label: "雷光火种", badge: "雷" }),
        collectible("lg-seed-05", "memory-seed", 3850, 420),
        collectible("lg-seed-06", "memory-seed", 4290, 450)
      ],
      checkpoints: [
        checkpoint("lg-check-01", 1715, 528, 1735, 536),
        checkpoint("lg-check-02", 3235, 528, 3255, 536)
      ],
      mechanics: {
        type: "storm-spring",
        springs: [
          { platform: "lg-spring-01", bounceY: -760 },
          { platform: "lg-spring-02", bounceY: -840 },
          { platform: "lg-spring-03", bounceY: -820 },
          { platform: "lg-spring-04", bounceY: -805 },
          { platform: "lg-spring-05", bounceY: -860 }
        ],
        springGrace: 0.12
      },
      boss: null
    },

    {
      id: 10,
      key: "dreamfold-library",
      act: 3,
      kind: "stage",
      name: "折纸梦境图书馆",
      nameEn: "DREAMFOLD LIBRARY",
      subtitle: "在灯相与墨相之间续写阶梯",
      briefing: {
        kicker: "STAGE 10 · DREAMFOLD",
        title: "折纸梦境图书馆",
        subtitle: "在灯相与墨相之间续写阶梯",
        mechanic: "脉冲击打翻页灯可切换灯相与墨相，只有对应纹样的折纸书页能够承重。",
        hint: "白色书脊永远不会折叠，先站稳再换相，并收齐三枚时页碎片。"
      },
      theme: {
        id: "dreamfold-library",
        palette: {
          skyTop: "#272044",
          skyBottom: "#8F6DA6",
          ink: "#120D25",
          paper: "#F4E9D4",
          ground: "#54466F",
          groundDark: "#2B2546",
          platform: "#C7A878",
          accent: "#FFD56E",
          accent2: "#79D5D8",
          danger: "#D55472",
          fog: "#A38FAE"
        },
        material: "folded-archive-paper",
        ambient: { type: "floating-pages-ink", count: 36, speed: 0.38 },
        landmark: {
          type: "folded-dream-library",
          x: 3560,
          y: 86,
          scale: 1.52,
          accent: "#FFD56E"
        }
      },
      worldWidth: 4700,
      worldHeight: WORLD_HEIGHT,
      killY: 800,
      camera: { mode: "follow", deadZoneX: 0.35, lookAhead: 140 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "storybook-gate",
        x: 4525,
        y: 472,
        w: 100,
        h: 148,
        requires: { type: "collect", itemType: "time-shard", count: 3, label: "时页碎片" }
      },
      platforms: [
        platform("sh-ground-01", 0, 620, 650, 100, { material: "archive-shelves" }),
        platform("sh-neutral-01", 350, 500, 185, 24, { kind: "one-way", material: "fixed-book-spine" }),
        platform("sh-sun-01", 690, 500, 180, 24, { kind: "polarity", polarity: "sun", material: "lamp-fold" }),
        platform("sh-moon-01", 910, 435, 180, 24, { kind: "polarity", polarity: "moon", material: "ink-fold" }),
        platform("sh-ground-02", 1160, 620, 520, 100, { material: "archive-shelves" }),
        platform("sh-neutral-02", 1280, 480, 170, 24, { kind: "one-way", material: "fixed-book-spine" }),
        platform("sh-sun-02", 1590, 405, 175, 24, { kind: "polarity", polarity: "sun", material: "lamp-fold" }),
        platform("sh-moon-02", 1810, 505, 175, 24, { kind: "polarity", polarity: "moon", material: "ink-fold" }),
        platform("sh-neutral-03", 2015, 455, 155, 24, { kind: "one-way", material: "fixed-book-spine" }),
        platform("sh-ground-03", 2170, 620, 420, 100, { material: "archive-shelves" }),
        platform("sh-neutral-04", 2260, 480, 170, 24, { kind: "one-way", material: "fixed-book-spine" }),
        platform("sh-sun-03", 2600, 510, 175, 24, { kind: "polarity", polarity: "sun", material: "lamp-fold" }),
        platform("sh-moon-03", 2825, 435, 175, 24, { kind: "polarity", polarity: "moon", material: "ink-fold" }),
        platform("sh-sun-04", 3040, 325, 165, 24, { kind: "polarity", polarity: "sun", material: "lamp-fold" }),
        platform("sh-ground-04", 3220, 620, 500, 100, { material: "archive-shelves" }),
        platform("sh-neutral-05", 3370, 485, 175, 24, { kind: "one-way", material: "fixed-book-spine" }),
        platform("sh-moon-04", 3690, 475, 175, 24, { kind: "polarity", polarity: "moon", material: "ink-fold" }),
        platform("sh-drifter", 3890, 395, 165, 22, {
          kind: "moving",
          material: "fixed-book-spine",
          motion: { axis: "y", distance: 82, speed: 0.7, phase: 0.35 }
        }),
        platform("sh-sun-05", 4100, 480, 175, 24, { kind: "polarity", polarity: "sun", material: "lamp-fold" }),
        platform("sh-ground-05", 4300, 620, 400, 100, { material: "archive-shelves" }),
        platform("sh-finish-step", 4380, 505, 175, 24, { kind: "one-way", material: "fixed-book-spine" })
      ],
      hazards: [
        hazard("sh-pit-01", "fall", 650, 650, 510, 70, { damage: 99 }),
        hazard("sh-spike-01", "crystal-spike", 1210, 590, 78, 30),
        hazard("sh-pit-02", "star-void", 1680, 650, 490, 70, { damage: 99 }),
        hazard("sh-spike-02", "crystal-spike", 2330, 590, 82, 30),
        hazard("sh-pit-03", "fall", 2590, 650, 630, 70, { damage: 99 }),
        hazard("sh-star-01", "falling-star", 2955, 236, 42, 42, { phase: 0.4 }),
        hazard("sh-spike-03", "crystal-spike", 3470, 590, 80, 30),
        hazard("sh-pit-04", "star-void", 3720, 650, 580, 70, { damage: 99 }),
        hazard("sh-star-02", "falling-star", 3980, 285, 44, 44, { phase: 1.1 }),
        hazard("sh-spike-04", "crystal-spike", 4350, 590, 74, 30)
      ],
      enemies: [
        enemy("sh-enemy-01", "shard-crawler", 1210, 566, 1180, 1510, { hp: 2, speed: 48 }),
        enemy("sh-enemy-02", "orbit-eye", 1730, 330, 1600, 2020, { hp: 2, yBob: 42, speed: 76 }),
        enemy("sh-enemy-03", "thread-spinner", 2220, 566, 2190, 2510, { hp: 2, speed: 58 }),
        enemy("sh-enemy-04", "orbit-eye", 2860, 300, 2700, 3110, { hp: 3, yBob: 48, speed: 86 }),
        enemy("sh-enemy-05", "shard-crawler", 3280, 566, 3250, 3610, { hp: 3, speed: 58 }),
        enemy("sh-enemy-06", "shadow-sprout", 4370, 566, 4330, 4590, { hp: 3, speed: 72 })
      ],
      collectibles: [
        collectible("sh-seed-01", "memory-seed", 385, 445),
        collectible("sh-shard-01", "time-shard", 990, 380, { quest: true, order: 1, polarity: "moon", label: "时页碎片", badge: "页" }),
        collectible("sh-seed-02", "memory-seed", 1340, 425),
        collectible("sh-star-charge", "star-charge", 2035, 400, { charges: 2 }),
        collectible("sh-seed-03", "memory-seed", 2310, 425),
        collectible("sh-shard-02", "time-shard", 2875, 375, { quest: true, order: 2, polarity: "moon", label: "时页碎片", badge: "页" }),
        collectible("sh-heart-01", "heart", 3420, 430),
        collectible("sh-seed-04", "memory-seed", 3745, 420),
        collectible("sh-shard-03", "time-shard", 4145, 425, { quest: true, order: 3, polarity: "sun", label: "时页碎片", badge: "页" }),
        collectible("sh-seed-05", "memory-seed", 4430, 450)
      ],
      checkpoints: [
        checkpoint("sh-check-01", 1210, 528, 1230, 536),
        checkpoint("sh-check-02", 3270, 528, 3290, 536)
      ],
      mechanics: {
        type: "polarity",
        polarity: { initial: "sun", values: ["sun", "moon"], grace: 0.5 },
        switches: [
          { id: "sh-dial-01", x: 515, y: 460, w: 54, h: 70, mode: "toggle-polarity" },
          { id: "sh-dial-02", x: 1395, y: 410, w: 54, h: 70, mode: "toggle-polarity" },
          { id: "sh-dial-03", x: 2365, y: 410, w: 54, h: 70, mode: "toggle-polarity" },
          { id: "sh-dial-04", x: 3460, y: 415, w: 54, h: 70, mode: "toggle-polarity" },
          { id: "sh-dial-05", x: 4410, y: 435, w: 54, h: 70, mode: "toggle-polarity" }
        ]
      },
      boss: null
    },

    {
      id: 11,
      key: "aurora-crystal-garden",
      act: 3,
      kind: "stage",
      name: "极光冰晶花园",
      nameEn: "AURORA CRYSTAL GARDEN",
      subtitle: "为双炉供能，让花园重新解冻",
      tags: ["脉冲解谜", "弹反供能", "多路线"],
      thumbnail: "linear-gradient(145deg, #17304B 0%, #436A77 48%, #8FE7D2 100%)",
      briefing: {
        kicker: "STAGE 11 · AURORA",
        title: "极光冰晶花园",
        subtitle: "为双炉供能，让花园重新解冻",
        mechanic: "为西、东两座极光反应炉各充满六格能量；普通脉冲也能慢慢供能。",
        hint: "普通脉冲 +1，回声弹反 +3，沿途暖光电池会为最近的未满反应炉补充 +2。"
      },
      theme: {
        id: "aurora-crystal-garden",
        palette: {
          skyTop: "#17304B",
          skyBottom: "#8BC5C9",
          ink: "#071827",
          paper: "#EDF4E7",
          ground: "#436A77",
          groundDark: "#203B4D",
          platform: "#88BFC3",
          accent: "#F5D46A",
          accent2: "#8FE7D2",
          danger: "#D95D76",
          fog: "#B5D7D3"
        },
        material: "aurora-ice-crystal",
        ambient: { type: "aurora-snow-petals", count: 38, speed: 0.52 },
        landmark: {
          type: "aurora-crystal-bloom",
          x: 3820,
          y: 72,
          scale: 1.65,
          accent: "#F5D46A"
        }
      },
      worldWidth: 4900,
      worldHeight: WORLD_HEIGHT,
      killY: 790,
      camera: { mode: "follow", deadZoneX: 0.34, lookAhead: 165 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "aurora-flower-gate",
        x: 4720,
        y: 445,
        w: 112,
        h: 175,
        requires: { type: "reflect-reactor", count: 2, label: "极光反应炉" }
      },
      objectives: [
        {
          id: "aurora-reactor-route",
          type: "reflect-reactor",
          label: "极光反应炉",
          required: 2,
          reactors: [
            { id: "ta-reactor-west", x: 1160, y: 410, w: 74, h: 60, requiredCharge: 6 },
            { id: "ta-reactor-east", x: 3500, y: 330, w: 74, h: 60, requiredCharge: 6 }
          ]
        }
      ],
      platforms: [
        platform("ta-ground-01", 0, 620, 750, 100, { material: "glacier-crystal" }),
        platform("ta-conveyor-01", 360, 505, 250, 28, { kind: "conveyor", material: "thermal-ribbon", conveyor: { speed: 105 } }),
        platform("ta-hook-01", 790, 470, 170, 24, {
          kind: "moving",
          material: "ice-leaf",
          motion: { axis: "y", distance: 85, speed: 0.82, phase: 0.15 }
        }),
        platform("ta-ground-02", 1010, 620, 500, 100, { material: "glacier-crystal" }),
        platform("ta-relay-deck-01", 1110, 470, 180, 24, { kind: "one-way", material: "heat-beacon-glass" }),
        platform("ta-ground-03", 1560, 620, 590, 100, { material: "glacier-crystal" }),
        platform("ta-conveyor-02", 1710, 500, 270, 28, { kind: "conveyor", material: "thermal-ribbon", conveyor: { speed: -115 } }),
        platform("ta-hook-02", 2200, 430, 175, 24, {
          kind: "moving",
          material: "ice-leaf",
          motion: { axis: "x", distance: 105, speed: 0.9, phase: 0.48 }
        }),
        platform("ta-ground-04", 2410, 620, 650, 100, { material: "glacier-crystal" }),
        platform("ta-relay-deck-02", 2510, 455, 180, 24, { kind: "one-way", material: "heat-beacon-glass" }),
        platform("ta-lift-01", 2825, 390, 165, 24, {
          kind: "moving",
          material: "crystal-stem",
          motion: { axis: "y", distance: 120, speed: 0.88, phase: 0.72 }
        }),
        platform("ta-ground-05", 3110, 620, 690, 100, { material: "glacier-crystal" }),
        platform("ta-conveyor-03", 3260, 500, 280, 28, { kind: "conveyor", material: "thermal-ribbon", conveyor: { speed: 130 } }),
        platform("ta-relay-deck-03", 3480, 390, 175, 24, { kind: "one-way", material: "heat-beacon-glass" }),
        platform("ta-hook-03", 3870, 455, 175, 24, {
          kind: "moving",
          material: "ice-leaf",
          motion: { axis: "x", distance: 120, speed: 1.02, phase: 0.25 }
        }),
        platform("ta-ground-06", 4100, 620, 800, 100, { material: "glacier-crystal" }),
        platform("ta-finish-step", 4480, 500, 190, 24, { kind: "one-way", material: "heat-beacon-glass" })
      ],
      hazards: [
        hazard("ta-electric-01", "crystal-spike", 635, 582, 92, 38),
        hazard("ta-pit-01", "fall", 750, 650, 260, 70, { damage: 99 }),
        hazard("ta-electric-02", "crystal-spike", 1320, 582, 108, 38),
        hazard("ta-pit-02", "fall", 2150, 650, 260, 70, { damage: 99 }),
        hazard("ta-electric-03", "crystal-spike", 2720, 582, 92, 38),
        hazard("ta-electric-04", "crystal-spike", 2950, 582, 84, 38),
        hazard("ta-pit-03", "fall", 3800, 650, 300, 70, { damage: 99 }),
        hazard("ta-electric-05", "crystal-spike", 4210, 582, 105, 38),
        hazard("ta-electric-06", "crystal-spike", 4560, 582, 90, 38)
      ],
      enemies: [
        enemy("ta-enemy-01", "cargo-bot", 1060, 566, 1030, 1430, { hp: 2, speed: 58 }),
        enemy("ta-enemy-02", "propeller-wasp", 1800, 355, 1650, 2070, { hp: 2, yBob: 45, speed: 92 }),
        enemy("ta-enemy-03", "storm-cannon", 2500, 552, 2500, 2500, { hp: 3, speed: 0 }),
        enemy("ta-enemy-04", "thunder-drummer", 3170, 566, 3140, 3460, { hp: 3, speed: 62 }),
        enemy("ta-enemy-05", "propeller-wasp", 3510, 315, 3380, 3730, { hp: 3, yBob: 48, speed: 102 }),
        enemy("ta-enemy-06", "storm-cannon", 4170, 552, 4170, 4170, { hp: 3, speed: 0 }),
        enemy("ta-enemy-07", "cargo-bot", 4520, 566, 4400, 4680, { hp: 3, speed: 74 })
      ],
      collectibles: [
        collectible("ta-seed-01", "memory-seed", 285, 450),
        collectible("ta-seed-02", "memory-seed", 870, 410),
        collectible("ta-cell-01", "storm-cell", 1521, 550, { quest: true, order: 1, label: "暖光电池", badge: "暖" }),
        collectible("ta-heart-01", "heart", 1910, 445),
        collectible("ta-clock", "clock-spring", 2570, 395, { duration: 9 }),
        collectible("ta-seed-03", "memory-seed", 2870, 330),
        collectible("ta-cell-02", "storm-cell", 3071, 550, { quest: true, order: 2, label: "暖光电池", badge: "暖" }),
        collectible("ta-seed-04", "memory-seed", 3520, 335),
        collectible("ta-star", "star-charge", 3950, 390, { charges: 2 }),
        collectible("ta-cell-03", "storm-cell", 3811, 550, { quest: true, order: 3, label: "暖光电池", badge: "暖" }),
        collectible("ta-seed-05", "memory-seed", 4540, 445)
      ],
      checkpoints: [
        checkpoint("ta-check-01", 1600, 528, 1620, 536),
        checkpoint("ta-check-02", 3150, 528, 3170, 536),
        checkpoint("ta-check-03", 4140, 528, 4160, 536)
      ],
      mechanics: {
        type: "thermal-relay",
        switches: [
          { id: "ta-relay-a", x: 535, y: 440, w: 54, h: 62, mode: "timed", duration: 8.5 },
          { id: "ta-relay-b", x: 1900, y: 430, w: 54, h: 62, mode: "timed", duration: 8 },
          { id: "ta-relay-c", x: 3380, y: 430, w: 54, h: 62, mode: "timed", duration: 7.5 }
        ],
        gates: [
          { id: "ta-gate-a", x: 1510, y: 350, w: 48, h: 270, openBy: "ta-relay-a" },
          { id: "ta-gate-b", x: 3060, y: 340, w: 48, h: 280, openBy: "ta-relay-b" },
          { id: "ta-gate-c", x: 3800, y: 350, w: 48, h: 270, openBy: "ta-relay-c" }
        ],
        relayWarning: { flashAt: 2.2, soundAt: 1.2 }
      },
      boss: null
    },

    {
      id: 12,
      key: "riftweave-sanctum",
      act: 3,
      kind: "boss",
      name: "裂界织殿",
      nameEn: "RIFTWEAVE SANCTUM",
      subtitle: "让断裂的星线重新相连",
      briefing: {
        kicker: "BOSS 03 · WEAVE",
        title: "裂界织母",
        subtitle: "让断裂的星线重新相连",
        mechanic: "借菌伞跃上相位平台，限时击亮继电器；织母落地时集中攻击纺星核心。",
        hint: "三个阶段分别需要一、二、三个继电器同时发光，最后阶段要先切换日月相位。"
      },
      theme: {
        id: "riftweave-sanctum",
        palette: {
          skyTop: "#11162E",
          skyBottom: "#67446F",
          ink: "#050817",
          paper: "#F0E7D6",
          ground: "#2E304C",
          groundDark: "#14172A",
          platform: "#746989",
          accent: "#FFD45C",
          accent2: "#73E1DC",
          danger: "#EC5268",
          fog: "#504B6A"
        },
        material: "woven-star-brass",
        ambient: { type: "rift-threads", count: 46, speed: 0.72 },
        landmark: {
          type: "cosmic-loom-palace",
          x: 2240,
          y: 62,
          scale: 1.74,
          accent: "#FFD45C"
        }
      },
      worldWidth: 3500,
      worldHeight: WORLD_HEIGHT,
      killY: 790,
      camera: { mode: "boss-lock", deadZoneX: 0.42, lookAhead: 85 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "rift-core",
        x: 3280,
        y: 435,
        w: 120,
        h: 185,
        requires: "boss-defeated"
      },
      platforms: [
        platform("rw-ground-entry", 0, 620, 720, 100, { material: "woven-stone" }),
        platform("rw-entry-step", 280, 500, 185, 24, { kind: "one-way", material: "star-thread" }),
        platform("rw-entry-bridge", 720, 555, 330, 65, { material: "woven-star-brass" }),
        platform("rw-arena-floor", 1050, 620, 2100, 100, { material: "woven-stone" }),
        platform("rw-spring-left", 1175, 570, 165, 28, { kind: "spring", material: "lumen-fungus", bounceY: -810 }),
        platform("rw-sun-left", 1420, 420, 185, 24, { kind: "polarity", polarity: "sun", material: "sun-glass" }),
        platform("rw-moon-left", 1640, 325, 175, 24, { kind: "polarity", polarity: "moon", material: "moon-glass" }),
        platform("rw-core-dais", 1940, 500, 340, 28, { kind: "one-way", material: "loom-brass" }),
        platform("rw-sun-right", 2390, 345, 180, 24, { kind: "polarity", polarity: "sun", material: "sun-glass" }),
        platform("rw-moon-right", 2605, 445, 180, 24, { kind: "polarity", polarity: "moon", material: "moon-glass" }),
        platform("rw-spring-right", 2830, 570, 165, 28, { kind: "spring", material: "lumen-fungus", bounceY: -810 }),
        platform("rw-ground-exit", 3150, 620, 350, 100, { material: "woven-stone" }),
        platform("rw-core-step", 3240, 500, 185, 24, { kind: "one-way", material: "star-thread" })
      ],
      hazards: [
        hazard("rw-void-entry", "star-void", 720, 655, 330, 65, { damage: 99 }),
        hazard("rw-electric-left", "electric-coil", 1350, 582, 105, 38),
        hazard("rw-rift-left", "void-rift", 1815, 586, 112, 34),
        hazard("rw-rift-right", "void-rift", 2295, 586, 112, 34),
        hazard("rw-electric-right", "electric-coil", 2735, 582, 88, 38),
        hazard("rw-star-01", "falling-star", 1515, 168, 44, 44, { phase: 0.2 }),
        hazard("rw-star-02", "falling-star", 2540, 148, 44, 44, { phase: 1.1 })
      ],
      enemies: [
        enemy("rw-minion-01", "propeller-wasp", 1510, 300, 1320, 1800, { hp: 2, yBob: 44, speed: 92, spawnOnBossPhase: 2 }),
        enemy("rw-minion-02", "thread-spinner", 1850, 566, 1640, 2050, { hp: 2, speed: 66, spawnOnBossPhase: 2 }),
        enemy("rw-minion-03", "orbit-eye", 2550, 270, 2320, 2820, { hp: 3, yBob: 50, speed: 104, spawnOnBossPhase: 3 }),
        enemy("rw-minion-04", "thunder-drummer", 2960, 566, 2760, 3150, { hp: 3, speed: 62, spawnOnBossPhase: 3 })
      ],
      collectibles: [
        collectible("rw-seed-01", "memory-seed", 350, 445),
        collectible("rw-heart-entry", "heart", 920, 500),
        collectible("rw-star-01", "star-charge", 1485, 365, { charges: 2 }),
        collectible("rw-heart-phase-03", "heart", 2680, 390, { spawnOnBossPhase: 3 }),
        collectible("rw-core", "rift-core-seed", 2110, 455, { quest: true, spawnOnBossDefeat: true })
      ],
      checkpoints: [checkpoint("rw-check-01", 970, 478, 995, 536)],
      mechanics: {
        type: "rift-weaver",
        arenaTrigger: { x: 1050, lockLeft: 1050, lockRight: 3150 },
        polarity: { initial: "sun", values: ["sun", "moon"], grace: 0.18 },
        springs: [
          { platform: "rw-spring-left", bounceY: -810 },
          { platform: "rw-spring-right", bounceY: -810 }
        ],
        switches: [
          { id: "rw-phase-dial", x: 2085, y: 430, w: 54, h: 70, mode: "toggle-polarity", role: "polarity" },
          { id: "rw-relay-a", x: 1260, y: 315, w: 54, h: 68, mode: "timed", role: "boss-relay", duration: 12 },
          { id: "rw-relay-b", x: 2460, y: 275, w: 54, h: 68, mode: "timed", role: "boss-relay", duration: 12, polarity: "sun" },
          { id: "rw-relay-c", x: 2665, y: 375, w: 54, h: 68, mode: "timed", role: "boss-relay", duration: 12, polarity: "moon" }
        ],
        bossRelay: {
          requiredByPhase: {
            1: ["rw-relay-a"],
            2: ["rw-relay-a", "rw-relay-b"],
            3: ["rw-relay-a", "rw-relay-b", "rw-relay-c"]
          },
          exposedTime: 3.5,
          hitsPerExposure: 2,
          resetOnExposure: true
        },
        defeatRecipe: ["bounce-to-relays", "match-sun-moon-platforms", "activate-required-relays", "attack-exposed-core"]
      },
      boss: {
        id: "rift-weaver",
        archetype: "rift-weaver",
        name: "裂界织母 · 纺星核心",
        hp: 6,
        maxHealth: 6,
        arena: { x: 1050, y: 180, w: 2100, h: 440 },
        spawn: { x: 2140, y: 255 },
        body: { w: 176, h: 154 },
        weakPoint: {
          type: "spun-star-core",
          offsetX: 0,
          offsetY: 8,
          vulnerableState: "relay-stunned",
          damagePerHit: 1,
          hitsPerExposure: 2,
          exposedTime: 3.5
        },
        phases: [
          { atHealth: 6, name: "牵丝", requiredRelayCount: 1, requiredRelays: ["rw-relay-a"], attack: "thread-fan", attackCooldown: 2.25 },
          { atHealth: 4, name: "双相", requiredRelayCount: 2, requiredRelays: ["rw-relay-a", "rw-relay-b"], attack: "phase-needles", attackCooldown: 1.85 },
          { atHealth: 2, name: "裂织", requiredRelayCount: 3, requiredRelays: ["rw-relay-a", "rw-relay-b", "rw-relay-c"], attack: "storm-loom", attackCooldown: 1.35 }
        ],
        mechanism: {
          shielded: true,
          exposeBy: "timed-relays",
          relayConfig: "bossRelay",
          resetRelaysOnExposure: true,
          defeatEffect: "rewoven-rift"
        }
      }
    },

    {
      id: 13,
      key: "weightless-star-ring",
      act: 4,
      kind: "stage",
      name: "失重星环",
      nameEn: "WEIGHTLESS STAR RING",
      subtitle: "把坠落变成一条新的航线",
      briefing: {
        kicker: "STAGE 13 · GRAVITY",
        title: "失重星环",
        subtitle: "把坠落变成一条新的航线",
        mechanic: "进入蓝色引力泡后跳跃会持续升空，下砸则能立刻锚定；环轨平台会围绕星井转动。",
        hint: "不要只向右跑：先借低重力升到外环，再用下砸切回下层收集三枚星轨钥。"
      },
      theme: {
        id: "weightless-star-ring",
        palette: {
          skyTop: "#07182D",
          skyBottom: "#214E68",
          ink: "#050B19",
          paper: "#F2E9D5",
          ground: "#273E55",
          groundDark: "#111D2C",
          platform: "#506E78",
          accent: "#F7C85C",
          accent2: "#58D5D0",
          danger: "#F06463",
          fog: "#36596D"
        },
        material: "orbital-paper-brass",
        ambient: { type: "gravity-dust", count: 42, speed: 0.38 },
        landmark: { type: "orbital-garden", x: 2920, y: 72, scale: 1.65, accent: "#58D5D0" }
      },
      worldWidth: 4800,
      worldHeight: WORLD_HEIGHT,
      killY: 830,
      camera: { mode: "follow", deadZoneX: 0.35, lookAhead: 145 },
      spawn: { x: 90, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4610,
        y: 470,
        w: 94,
        h: 150,
        requires: { type: "collect", itemType: "orbit-key", count: 3, label: "星轨钥" }
      },
      platforms: [
        platform("sg-ground-01", 0, 620, 520, 100, { material: "star-stone" }),
        platform("sg-orbit-01", 620, 500, 170, 24, { kind: "moving", material: "orbit-brass", motion: { type: "orbit", centerX: 780, centerY: 430, radiusX: 170, radiusY: 105, speed: 0.72, phase: 0 } }),
        platform("sg-orbit-02", 940, 360, 150, 24, { kind: "moving", material: "orbit-brass", motion: { type: "orbit", centerX: 1010, centerY: 380, radiusX: 125, radiusY: 145, speed: -0.88, phase: 1.4 } }),
        platform("sg-ground-02", 1240, 620, 480, 100, { material: "star-stone" }),
        platform("sg-high-01", 1330, 355, 190, 24, { kind: "one-way", material: "crystal-orbit" }),
        platform("sg-orbit-03", 1800, 430, 170, 24, { kind: "moving", material: "orbit-brass", motion: { type: "orbit", centerX: 1940, centerY: 405, radiusX: 190, radiusY: 150, speed: 0.64, phase: 2.2 } }),
        platform("sg-ground-03", 2140, 620, 460, 100, { material: "star-stone" }),
        platform("sg-high-02", 2220, 330, 180, 24, { kind: "one-way", material: "crystal-orbit" }),
        platform("sg-orbit-04", 2670, 420, 165, 24, { kind: "moving", material: "orbit-brass", motion: { type: "orbit", centerX: 2830, centerY: 390, radiusX: 205, radiusY: 170, speed: -0.74, phase: 0.8 } }),
        platform("sg-ground-04", 3050, 620, 510, 100, { material: "star-stone" }),
        platform("sg-high-03", 3140, 305, 200, 24, { kind: "one-way", material: "crystal-orbit" }),
        platform("sg-orbit-05", 3650, 455, 175, 24, { kind: "moving", material: "orbit-brass", motion: { type: "orbit", centerX: 3780, centerY: 395, radiusX: 170, radiusY: 150, speed: 0.92, phase: 2.8 } }),
        platform("sg-ground-05", 4010, 620, 790, 100, { material: "star-stone" }),
        platform("sg-finish-step", 4380, 480, 185, 24, { kind: "one-way", material: "crystal-orbit" })
      ],
      hazards: [
        hazard("sg-void-01", "star-void", 520, 660, 720, 60, { damage: 99 }),
        hazard("sg-void-02", "star-void", 1720, 660, 420, 60, { damage: 99 }),
        hazard("sg-void-03", "star-void", 2600, 660, 450, 60, { damage: 99 }),
        hazard("sg-void-04", "star-void", 3560, 660, 450, 60, { damage: 99 }),
        hazard("sg-rift-01", "void-rift", 1490, 575, 110, 45),
        hazard("sg-rift-02", "void-rift", 3290, 575, 120, 45)
      ],
      enemies: [
        enemy("sg-eye-01", "orbit-eye", 1370, 285, 1250, 1580, { hp: 2, yBob: 45, speed: 76 }),
        enemy("sg-eye-02", "orbit-eye", 2240, 260, 2140, 2480, { hp: 2, yBob: 48, speed: 84 }),
        enemy("sg-shadow-01", "shadow-sprout", 3160, 566, 3090, 3440, { hp: 2, speed: 72 }),
        enemy("sg-eye-03", "star-siphon", 4180, 300, 4050, 4450, { hp: 3, yBob: 56, speed: 96 })
      ],
      collectibles: [
        collectible("sg-seed-01", "memory-seed", 320, 470),
        collectible("sg-key-01", "orbit-key", 1470, 295, { quest: true }),
        collectible("sg-seed-02", "memory-seed", 1940, 220),
        collectible("sg-key-02", "orbit-key", 2300, 270, { quest: true }),
        collectible("sg-heart", "heart", 3220, 245),
        collectible("sg-key-03", "orbit-key", 3790, 245, { quest: true }),
        collectible("sg-seed-03", "memory-seed", 4370, 425)
      ],
      checkpoints: [
        checkpoint("sg-check-01", 1280, 528, 1300, 536),
        checkpoint("sg-check-02", 3090, 528, 3110, 536)
      ],
      mechanics: {
        type: "gravity-wells",
        gravityZones: [
          { id: "sg-gravity-a", x: 500, y: 130, w: 740, h: 520, gravityScale: 0.22, liftOnHold: 390 },
          { id: "sg-gravity-b", x: 1700, y: 100, w: 900, h: 550, gravityScale: 0.28, liftOnHold: 350 },
          { id: "sg-gravity-c", x: 2590, y: 80, w: 970, h: 570, gravityScale: 0.2, liftOnHold: 410 },
          { id: "sg-gravity-d", x: 3540, y: 110, w: 470, h: 540, gravityScale: 0.25, liftOnHold: 370 }
        ]
      },
      boss: null
    },

    {
      id: 14,
      key: "timesand-cloister",
      act: 4,
      kind: "stage",
      name: "时砂回廊",
      nameEn: "TIMESAND CLOISTER",
      subtitle: "让危险停在发生之前",
      briefing: {
        kicker: "STAGE 14 · TIME",
        title: "时砂回廊",
        subtitle: "让危险停在发生之前",
        mechanic: "脉冲击中时花会冻结附近的平台、敌人与机关四秒；冻结不是开门，而是亲手制造通行窗口。",
        hint: "先观察机关的运动轨迹，再决定何时冻结。三枚时砂花瓣分布在不同高度。"
      },
      theme: {
        id: "timesand-cloister",
        palette: {
          skyTop: "#102232",
          skyBottom: "#76513E",
          ink: "#08121B",
          paper: "#F2E4CC",
          ground: "#493B38",
          groundDark: "#211E22",
          platform: "#8A6950",
          accent: "#F1A94E",
          accent2: "#67D6D1",
          danger: "#E85E55",
          fog: "#6D5A4D"
        },
        material: "timesand-paper",
        ambient: { type: "suspended-sand", count: 40, speed: 0.22 },
        landmark: { type: "hourglass-cloister", x: 3020, y: 64, scale: 1.55, accent: "#F1A94E" }
      },
      worldWidth: 4700,
      worldHeight: WORLD_HEIGHT,
      killY: 800,
      camera: { mode: "follow", deadZoneX: 0.36, lookAhead: 140 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4515,
        y: 470,
        w: 94,
        h: 150,
        requires: { type: "collect", itemType: "chrono-petal", count: 3, label: "时砂花瓣" }
      },
      platforms: [
        platform("tc-ground-01", 0, 620, 560, 100, { material: "clock-stone" }),
        platform("tc-pendulum-01", 600, 470, 170, 24, { kind: "moving", material: "hourglass-brass", motion: { axis: "y", distance: 170, speed: 1.45, phase: 0.3 } }),
        platform("tc-pendulum-02", 850, 350, 170, 24, { kind: "moving", material: "hourglass-brass", motion: { axis: "y", distance: 185, speed: 1.7, phase: 2.1 } }),
        platform("tc-ground-02", 1110, 620, 510, 100, { material: "clock-stone" }),
        platform("tc-gear-01", 1240, 455, 180, 24, { kind: "moving", material: "hourglass-brass", motion: { axis: "x", distance: 175, speed: 1.8, phase: 0.7 } }),
        platform("tc-ground-03", 1840, 620, 500, 100, { material: "clock-stone" }),
        platform("tc-pendulum-03", 1900, 365, 170, 24, { kind: "moving", material: "hourglass-brass", motion: { axis: "y", distance: 185, speed: 1.9, phase: 1.4 } }),
        platform("tc-pendulum-04", 2200, 430, 165, 24, { kind: "moving", material: "hourglass-brass", motion: { axis: "x", distance: 190, speed: 2.1, phase: 2.7 } }),
        platform("tc-ground-04", 2600, 620, 520, 100, { material: "clock-stone" }),
        platform("tc-high-01", 2690, 370, 190, 24, { kind: "one-way", material: "frozen-glass" }),
        platform("tc-pendulum-05", 3190, 420, 175, 24, { kind: "moving", material: "hourglass-brass", motion: { axis: "y", distance: 200, speed: 2.25, phase: 0.9 } }),
        platform("tc-ground-05", 3580, 620, 470, 100, { material: "clock-stone" }),
        platform("tc-pendulum-06", 3650, 355, 175, 24, { kind: "moving", material: "hourglass-brass", motion: { axis: "x", distance: 210, speed: 2.4, phase: 1.8 } }),
        platform("tc-ground-06", 4270, 620, 430, 100, { material: "clock-stone" }),
        platform("tc-finish-step", 4380, 480, 180, 24, { kind: "one-way", material: "frozen-glass" })
      ],
      hazards: [
        hazard("tc-pit-01", "fall", 560, 660, 550, 60, { damage: 99 }),
        hazard("tc-pit-02", "fall", 1620, 660, 220, 60, { damage: 99 }),
        hazard("tc-saw-01", "saw-gear", 1460, 546, 74, 74, { radius: 35, angularSpeed: 3.4 }),
        hazard("tc-pit-03", "fall", 2340, 660, 260, 60, { damage: 99 }),
        hazard("tc-saw-02", "saw-gear", 2930, 544, 76, 76, { radius: 36, angularSpeed: -3.8 }),
        hazard("tc-pit-04", "fall", 3120, 660, 460, 60, { damage: 99 }),
        hazard("tc-saw-03", "saw-gear", 3900, 542, 78, 78, { radius: 37, angularSpeed: 4.1 }),
        hazard("tc-pit-05", "fall", 4050, 660, 220, 60, { damage: 99 })
      ],
      enemies: [
        enemy("tc-eye-01", "orbit-eye", 1180, 350, 1120, 1510, { hp: 2, yBob: 42, speed: 86 }),
        enemy("tc-shadow-01", "chrono-leech", 1900, 566, 1870, 2260, { hp: 3, speed: 76 }),
        enemy("tc-cannon-01", "storm-cannon", 2790, 552, 2790, 2790, { hp: 3, speed: 0 }),
        enemy("tc-eye-02", "orbit-eye", 3650, 280, 3540, 3950, { hp: 3, yBob: 52, speed: 104 })
      ],
      collectibles: [
        collectible("tc-seed-01", "memory-seed", 330, 470),
        collectible("tc-petal-01", "chrono-petal", 925, 270, { quest: true }),
        collectible("tc-heart", "heart", 1970, 315),
        collectible("tc-petal-02", "chrono-petal", 2765, 315, { quest: true }),
        collectible("tc-seed-02", "memory-seed", 3310, 250),
        collectible("tc-petal-03", "chrono-petal", 3740, 295, { quest: true }),
        collectible("tc-seed-03", "memory-seed", 4420, 425)
      ],
      checkpoints: [
        checkpoint("tc-check-01", 1150, 528, 1170, 536),
        checkpoint("tc-check-02", 2630, 528, 2650, 536),
        checkpoint("tc-check-03", 3610, 528, 3630, 536)
      ],
      mechanics: {
        type: "local-time-freeze",
        timeAnchors: [
          { id: "tc-anchor-a", x: 505, y: 430, w: 54, h: 72, radius: 650, duration: 4.2 },
          { id: "tc-anchor-b", x: 1645, y: 390, w: 54, h: 72, radius: 720, duration: 4.0 },
          { id: "tc-anchor-c", x: 3060, y: 390, w: 54, h: 72, radius: 720, duration: 3.8 },
          { id: "tc-anchor-d", x: 4160, y: 430, w: 54, h: 72, radius: 620, duration: 3.6 }
        ]
      },
      boss: null
    },

    {
      id: 15,
      key: "echo-twin-city",
      act: 4,
      kind: "stage",
      name: "双影镜城",
      nameEn: "ECHO TWIN CITY",
      subtitle: "和一秒前的自己并肩前进",
      briefing: {
        kicker: "STAGE 15 · ECHO",
        title: "双影镜城",
        subtitle: "和一秒前的自己并肩前进",
        mechanic: "青色纸影会持续重演约 1.8 秒前的移动；让本体与纸影分别站上同组双生台，才能封合镜门。",
        hint: "先踩过第一座台，再保持节奏抵达第二座；停顿和折返都会改变纸影的路线。"
      },
      theme: {
        id: "echo-twin-city",
        palette: {
          skyTop: "#171637",
          skyBottom: "#526390",
          ink: "#09091A",
          paper: "#F1E7D8",
          ground: "#343553",
          groundDark: "#17182B",
          platform: "#696780",
          accent: "#D989D8",
          accent2: "#62DDD3",
          danger: "#ED6373",
          fog: "#54536F"
        },
        material: "mirror-paper",
        ambient: { type: "echo-ribbons", count: 38, speed: 0.5 },
        landmark: { type: "twin-mirror-city", x: 2860, y: 72, scale: 1.62, accent: "#62DDD3" }
      },
      worldWidth: 4700,
      worldHeight: WORLD_HEIGHT,
      killY: 800,
      camera: { mode: "follow", deadZoneX: 0.34, lookAhead: 150 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4510,
        y: 470,
        w: 94,
        h: 150,
        requires: { type: "echo-pairs", count: 2, label: "双生镜印" }
      },
      platforms: [
        platform("ec-ground-01", 0, 620, 1500, 100, { material: "mirror-stone" }),
        platform("ec-step-01", 470, 485, 170, 24, { kind: "one-way", material: "echo-glass" }),
        platform("ec-step-02", 1080, 420, 170, 24, { kind: "one-way", material: "echo-glass" }),
        platform("ec-ground-02", 1600, 620, 500, 100, { material: "mirror-stone" }),
        platform("ec-bridge-01", 2100, 485, 260, 24, { kind: "moving", material: "echo-glass", motion: { axis: "y", distance: 115, speed: 0.82, phase: 0.4 } }),
        platform("ec-ground-03", 2440, 620, 1260, 100, { material: "mirror-stone" }),
        platform("ec-step-03", 2600, 455, 170, 24, { kind: "one-way", material: "echo-glass" }),
        platform("ec-step-04", 3240, 380, 170, 24, { kind: "one-way", material: "echo-glass" }),
        platform("ec-ground-04", 3800, 620, 900, 100, { material: "mirror-stone" }),
        platform("ec-finish-step", 4330, 480, 185, 24, { kind: "one-way", material: "echo-glass" })
      ],
      hazards: [
        hazard("ec-mirror-spike-01", "crystal-spike", 700, 588, 90, 32),
        hazard("ec-mirror-spike-02", "crystal-spike", 1320, 588, 90, 32),
        hazard("ec-void-01", "star-void", 1500, 660, 100, 60, { damage: 99 }),
        hazard("ec-void-02", "star-void", 2100, 660, 340, 60, { damage: 99 }),
        hazard("ec-mirror-spike-03", "crystal-spike", 2860, 588, 90, 32),
        hazard("ec-mirror-spike-04", "crystal-spike", 3500, 588, 90, 32),
        hazard("ec-void-03", "star-void", 3700, 660, 100, 60, { damage: 99 })
      ],
      enemies: [
        enemy("ec-shadow-01", "shadow-sprout", 860, 566, 820, 1120, { hp: 2, speed: 72 }),
        enemy("ec-eye-01", "orbit-eye", 1880, 320, 1720, 2030, { hp: 2, yBob: 44, speed: 82 }),
        enemy("ec-shadow-02", "mirror-mimic", 2700, 566, 2520, 3050, { hp: 3, speed: 78 }),
        enemy("ec-eye-02", "orbit-eye", 4040, 300, 3870, 4290, { hp: 3, yBob: 54, speed: 96 })
      ],
      collectibles: [
        collectible("ec-seed-01", "memory-seed", 390, 430),
        collectible("ec-heart", "heart", 1860, 520),
        collectible("ec-seed-02", "memory-seed", 2220, 425),
        collectible("ec-seed-03", "memory-seed", 3310, 325),
        collectible("ec-star", "star-charge", 4050, 480, { charges: 2 })
      ],
      checkpoints: [
        checkpoint("ec-check-01", 1635, 528, 1655, 536),
        checkpoint("ec-check-02", 3835, 528, 3855, 536)
      ],
      mechanics: {
        type: "delayed-echo",
        echoDelay: 1.8,
        echoPads: [
          { id: "ec-pad-a1", group: "a", x: 540, y: 594, w: 120, h: 26 },
          { id: "ec-pad-a2", group: "a", x: 1170, y: 594, w: 120, h: 26 },
          { id: "ec-pad-b1", group: "b", x: 2560, y: 594, w: 120, h: 26 },
          { id: "ec-pad-b2", group: "b", x: 3190, y: 594, w: 120, h: 26 }
        ],
        gates: [
          { id: "ec-gate-a", x: 1430, y: 350, w: 50, h: 270, openByEcho: "a" },
          { id: "ec-gate-b", x: 3610, y: 350, w: 50, h: 270, openByEcho: "b" }
        ]
      },
      boss: null
    },

    {
      id: 16,
      key: "starwhale-court",
      act: 4,
      kind: "boss",
      name: "星噬鲸庭",
      nameEn: "STAR-EATER COURT",
      subtitle: "在引力潮中拉回最后一颗星",
      briefing: {
        kicker: "BOSS 04 · ORBIT",
        title: "星噬鲸",
        subtitle: "在引力潮中拉回最后一颗星",
        mechanic: "三枚星锚会环绕鲸身高速移动；用脉冲依次点亮足够数量的星锚，把巨鲸拉落后攻击胸口星核。",
        hint: "引力潮会持续推拉星芽。顺着潮向移动比逆向硬冲更安全，后两个阶段需要同时维持更多星锚。"
      },
      theme: {
        id: "starwhale-court",
        palette: {
          skyTop: "#070D22",
          skyBottom: "#31325F",
          ink: "#030714",
          paper: "#F4EBD8",
          ground: "#252C4A",
          groundDark: "#101428",
          platform: "#555C78",
          accent: "#F5C653",
          accent2: "#55D8D3",
          danger: "#F05D69",
          fog: "#42466A"
        },
        material: "constellation-brass",
        ambient: { type: "gravity-tide", count: 48, speed: 0.64 },
        landmark: { type: "star-whale-court", x: 2250, y: 58, scale: 1.76, accent: "#F5C653" }
      },
      worldWidth: 3600,
      worldHeight: WORLD_HEIGHT,
      killY: 800,
      camera: { mode: "boss-lock", deadZoneX: 0.42, lookAhead: 80 },
      spawn: { x: 88, y: 536, facing: 1 },
      goal: { type: "world-core", x: 3370, y: 435, w: 120, h: 185, requires: "boss-defeated" },
      platforms: [
        platform("sw-ground-entry", 0, 620, 760, 100, { material: "constellation-stone" }),
        platform("sw-entry-step", 300, 500, 185, 24, { kind: "one-way", material: "orbit-brass" }),
        platform("sw-entry-bridge", 760, 555, 330, 65, { material: "constellation-brass" }),
        platform("sw-arena-floor", 1090, 620, 2100, 100, { material: "constellation-stone" }),
        platform("sw-orbit-left", 1250, 410, 180, 24, { kind: "moving", material: "orbit-brass", motion: { type: "orbit", centerX: 1450, centerY: 390, radiusX: 180, radiusY: 100, speed: 0.72, phase: 0.2 } }),
        platform("sw-high-left", 1580, 330, 170, 24, { kind: "one-way", material: "crystal-orbit" }),
        platform("sw-core-dais", 2030, 505, 320, 28, { kind: "one-way", material: "constellation-brass" }),
        platform("sw-high-right", 2500, 345, 170, 24, { kind: "one-way", material: "crystal-orbit" }),
        platform("sw-orbit-right", 2780, 430, 180, 24, { kind: "moving", material: "orbit-brass", motion: { type: "orbit", centerX: 2790, centerY: 405, radiusX: 175, radiusY: 110, speed: -0.8, phase: 1.5 } }),
        platform("sw-ground-exit", 3190, 620, 410, 100, { material: "constellation-stone" }),
        platform("sw-core-step", 3310, 500, 190, 24, { kind: "one-way", material: "orbit-brass" })
      ],
      hazards: [
        hazard("sw-void-entry", "star-void", 760, 660, 330, 60, { damage: 99 }),
        hazard("sw-rift-left", "void-rift", 1510, 586, 120, 34),
        hazard("sw-rift-mid", "void-rift", 2110, 586, 120, 34),
        hazard("sw-rift-right", "void-rift", 2680, 586, 120, 34),
        hazard("sw-star-01", "falling-star", 1420, 155, 46, 46, { phase: 0.4 }),
        hazard("sw-star-02", "falling-star", 2780, 145, 46, 46, { phase: 1.4 })
      ],
      enemies: [
        enemy("sw-minion-01", "star-siphon", 1450, 285, 1260, 1740, { hp: 2, yBob: 48, speed: 92, spawnOnBossPhase: 2 }),
        enemy("sw-minion-02", "chrono-leech", 1730, 566, 1600, 1980, { hp: 3, speed: 74, spawnOnBossPhase: 2 }),
        enemy("sw-minion-03", "storm-cannon", 2910, 552, 2910, 2910, { hp: 3, speed: 0, spawnOnBossPhase: 3 })
      ],
      collectibles: [
        collectible("sw-seed-01", "memory-seed", 360, 445),
        collectible("sw-heart-entry", "heart", 950, 505),
        collectible("sw-star-charge", "star-charge", 1630, 275, { charges: 2 }),
        collectible("sw-heart-phase-03", "heart", 2580, 295, { spawnOnBossPhase: 3 }),
        collectible("sw-core", "starwhale-core", 2200, 455, { quest: true, spawnOnBossDefeat: true })
      ],
      checkpoints: [checkpoint("sw-check-01", 1010, 478, 1030, 536)],
      mechanics: {
        type: "star-whale",
        arenaTrigger: { x: 1090, lockLeft: 1090, lockRight: 3190 },
        gravityTide: { horizontalForce: 520, verticalForce: 170, period: 4.8 },
        gravityAnchors: [
          { id: "sw-anchor-a", angle: 0, radiusX: 210, radiusY: 125, speed: 0.7, duration: 9 },
          { id: "sw-anchor-b", angle: 2.094, radiusX: 250, radiusY: 150, speed: -0.82, duration: 9 },
          { id: "sw-anchor-c", angle: 4.188, radiusX: 290, radiusY: 105, speed: 0.96, duration: 9 }
        ]
      },
      boss: {
        id: "star-whale",
        archetype: "star-whale",
        name: "星噬鲸 · 引力守门者",
        hp: 6,
        maxHealth: 6,
        arena: { x: 1090, y: 150, w: 2100, h: 470 },
        spawn: { x: 2110, y: 245 },
        body: { w: 230, h: 140 },
        weakPoint: { type: "stellar-heart", vulnerableState: "anchor-fall", damagePerHit: 1, hitsPerExposure: 2, exposedTime: 3.8 },
        phases: [
          { atHealth: 6, name: "初潮", requiredAnchors: 1, attackCooldown: 2.25, orbitScale: 0.8 },
          { atHealth: 4, name: "回潮", requiredAnchors: 2, attackCooldown: 1.8, orbitScale: 1.05 },
          { atHealth: 2, name: "坍潮", requiredAnchors: 3, attackCooldown: 1.35, orbitScale: 1.3 }
        ],
        mechanism: { shielded: true, exposeBy: "moving-gravity-anchors", resetAnchorsOnExposure: true }
      }
    },

    {
      id: 17,
      key: "foldpaper-canyon",
      act: 5,
      kind: "stage",
      name: "折纸峡谷",
      nameEn: "FOLDPAPER CANYON",
      subtitle: "把墙折成路，再把路折回世界",
      briefing: {
        kicker: "STAGE 17 · FOLD",
        title: "折纸峡谷",
        subtitle: "把墙折成路，再把路折回世界",
        mechanic: "脉冲击中珊瑚色折痕，会让同组纸层在墙面与桥面之间翻折；出口要求三处地形都保持在修复形态。",
        hint: "每次折叠都会同时移走旧路并展开新路。先看虚线指向，再站到不会被翻走的位置发射脉冲。"
      },
      theme: {
        id: "foldpaper-canyon",
        palette: {
          skyTop: "#07182B",
          skyBottom: "#B96857",
          ink: "#06101D",
          paper: "#F4E9D2",
          ground: "#29384A",
          groundDark: "#121C29",
          platform: "#68757A",
          accent: "#F06A55",
          accent2: "#5BD5CF",
          danger: "#E64F59",
          fog: "#5C5060"
        },
        material: "perforated-origami-stone",
        ambient: { type: "crease-sparks", count: 44, speed: 0.42 },
        landmark: { type: "folded-compass", x: 2880, y: 72, scale: 1.7, accent: "#F06A55" }
      },
      worldWidth: 4900,
      worldHeight: WORLD_HEIGHT,
      killY: 820,
      camera: { mode: "follow", deadZoneX: 0.34, lookAhead: 150 },
      spawn: { x: 100, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4700,
        y: 470,
        w: 94,
        h: 150,
        requires: { type: "fold-pattern", count: 3, label: "稳定折面" }
      },
      platforms: [
        platform("fc-ground-01", 0, 620, 700, 100, { material: "fold-stone" }),
        platform("fc-wall-a", 720, 345, 42, 275, { material: "crease-paper", foldGroup: "a", foldState: 0 }),
        platform("fc-bridge-a", 700, 500, 430, 26, { kind: "one-way", material: "crease-paper", foldGroup: "a", foldState: 1 }),
        platform("fc-ground-02", 1130, 620, 570, 100, { material: "fold-stone" }),
        platform("fc-step-02", 1280, 445, 180, 24, { kind: "one-way", material: "paper-brass" }),
        platform("fc-wall-b", 1740, 315, 44, 305, { material: "crease-paper", foldGroup: "b", foldState: 0 }),
        platform("fc-bridge-b", 1700, 420, 520, 26, { kind: "one-way", material: "crease-paper", foldGroup: "b", foldState: 1 }),
        platform("fc-ground-03", 2220, 620, 560, 100, { material: "fold-stone" }),
        platform("fc-high-03", 2320, 360, 210, 24, { kind: "one-way", material: "paper-brass" }),
        platform("fc-wall-c", 2820, 350, 44, 270, { material: "crease-paper", foldGroup: "c", foldState: 0 }),
        platform("fc-bridge-c", 2780, 485, 560, 26, { kind: "one-way", material: "crease-paper", foldGroup: "c", foldState: 1 }),
        platform("fc-ground-04", 3340, 620, 620, 100, { material: "fold-stone" }),
        platform("fc-fold-step", 3610, 410, 185, 24, { kind: "one-way", material: "paper-brass" }),
        platform("fc-ground-05", 4210, 620, 690, 100, { material: "fold-stone" }),
        platform("fc-finish-step", 4480, 480, 180, 24, { kind: "one-way", material: "paper-brass" })
      ],
      hazards: [
        hazard("fc-void-01", "star-void", 700, 670, 430, 50, { damage: 99 }),
        hazard("fc-void-02", "star-void", 1700, 670, 520, 50, { damage: 99 }),
        hazard("fc-void-03", "star-void", 2780, 670, 560, 50, { damage: 99 }),
        hazard("fc-spike-01", "crystal-spike", 1450, 588, 100, 32),
        hazard("fc-spike-02", "crystal-spike", 3680, 588, 110, 32)
      ],
      enemies: [
        enemy("fc-shadow-01", "fold-beetle", 1240, 566, 1170, 1590, { hp: 3, speed: 62 }),
        enemy("fc-eye-01", "orbit-eye", 2320, 300, 2220, 2620, { hp: 2, yBob: 44, speed: 84 }),
        enemy("fc-shadow-02", "thread-spinner", 3470, 566, 3380, 3860, { hp: 3, speed: 74 }),
        enemy("fc-eye-02", "orbit-eye", 4310, 320, 4220, 4600, { hp: 3, yBob: 48, speed: 96 })
      ],
      collectibles: [
        collectible("fc-seed-01", "memory-seed", 360, 470),
        collectible("fc-seed-02", "memory-seed", 2420, 300),
        collectible("fc-heart", "heart", 3530, 350),
        collectible("fc-seed-03", "memory-seed", 4530, 425)
      ],
      checkpoints: [
        checkpoint("fc-check-01", 1180, 528, 1200, 536),
        checkpoint("fc-check-02", 3380, 528, 3400, 536)
      ],
      mechanics: {
        type: "world-fold",
        foldPanels: [
          { id: "fc-crease-a", group: "a", x: 590, y: 470, w: 58, h: 82, targetState: 1 },
          { id: "fc-crease-b", group: "b", x: 1530, y: 380, w: 58, h: 82, targetState: 1 },
          { id: "fc-crease-c", group: "c", x: 2560, y: 390, w: 58, h: 82, targetState: 1 }
        ]
      },
      boss: null
    },

    {
      id: 18,
      key: "kitewind-spire",
      act: 5,
      kind: "stage",
      name: "风筝天塔",
      nameEn: "KITEWIND SPIRE",
      subtitle: "让脉冲变成一根会飞的绳",
      briefing: {
        kicker: "STAGE 18 · TETHER",
        title: "风筝天塔",
        subtitle: "让脉冲变成一根会飞的绳",
        mechanic: "脉冲命中风筝锚后会形成短暂牵引线，把星芽拉向空中锚点；移动和跳跃仍能改变摆荡方向。",
        hint: "不要等牵引结束才找下一枚锚。摆到线的外侧时转身发射，就能在空中接力。"
      },
      theme: {
        id: "kitewind-spire",
        palette: {
          skyTop: "#153A58",
          skyBottom: "#9BC9D0",
          ink: "#071624",
          paper: "#F7EBD2",
          ground: "#3C5262",
          groundDark: "#172A38",
          platform: "#748995",
          accent: "#F2A65A",
          accent2: "#36C7C4",
          danger: "#E85E62",
          fog: "#8FAFB9"
        },
        material: "kite-silk-and-brass",
        ambient: { type: "kite-streamers", count: 46, speed: 0.82 },
        landmark: { type: "giant-kite-mast", x: 2940, y: 48, scale: 1.78, accent: "#36C7C4" }
      },
      worldWidth: 4800,
      worldHeight: WORLD_HEIGHT,
      killY: 850,
      camera: { mode: "follow", deadZoneX: 0.32, lookAhead: 170 },
      spawn: { x: 92, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4605,
        y: 470,
        w: 94,
        h: 150,
        requires: { type: "kite-chain", count: 4, label: "风筝锚" }
      },
      platforms: [
        platform("ks-ground-start", 0, 620, 650, 100, { material: "cloud-stone" }),
        platform("ks-launch", 470, 455, 175, 24, { kind: "one-way", material: "kite-brass" }),
        platform("ks-perch-01", 980, 390, 150, 24, { kind: "one-way", material: "kite-brass" }),
        platform("ks-perch-02", 1530, 300, 150, 24, { kind: "one-way", material: "kite-brass" }),
        platform("ks-rest-01", 1910, 620, 350, 100, { material: "cloud-stone" }),
        platform("ks-perch-03", 2390, 400, 155, 24, { kind: "one-way", material: "kite-brass" }),
        platform("ks-perch-04", 3010, 285, 155, 24, { kind: "one-way", material: "kite-brass" }),
        platform("ks-rest-02", 3350, 620, 360, 100, { material: "cloud-stone" }),
        platform("ks-perch-05", 3840, 390, 160, 24, { kind: "one-way", material: "kite-brass" }),
        platform("ks-ground-end", 4210, 620, 590, 100, { material: "cloud-stone" }),
        platform("ks-finish", 4440, 480, 175, 24, { kind: "one-way", material: "kite-brass" })
      ],
      hazards: [
        hazard("ks-void-01", "star-void", 650, 670, 1260, 50, { damage: 99 }),
        hazard("ks-void-02", "star-void", 2260, 670, 1090, 50, { damage: 99 }),
        hazard("ks-void-03", "star-void", 3710, 670, 500, 50, { damage: 99 })
      ],
      enemies: [
        enemy("ks-wasp-01", "propeller-wasp", 1040, 330, 900, 1240, { hp: 2, yBob: 46, speed: 92 }),
        enemy("ks-eye-01", "orbit-eye", 2050, 310, 1920, 2240, { hp: 2, yBob: 52, speed: 88 }),
        enemy("ks-wasp-02", "star-siphon", 3060, 230, 2860, 3260, { hp: 3, yBob: 48, speed: 104 }),
        enemy("ks-eye-02", "mirror-mimic", 4360, 566, 4240, 4580, { hp: 3, speed: 82 })
      ],
      collectibles: [
        collectible("ks-seed-01", "memory-seed", 520, 395),
        collectible("ks-seed-02", "memory-seed", 1580, 240),
        collectible("ks-heart", "heart", 2050, 520),
        collectible("ks-seed-03", "memory-seed", 3070, 225),
        collectible("ks-star", "star-charge", 3900, 330, { charges: 2 })
      ],
      checkpoints: [
        checkpoint("ks-check-01", 1940, 528, 1960, 536),
        checkpoint("ks-check-02", 3380, 528, 3400, 536)
      ],
      mechanics: {
        type: "kite-tether",
        kiteAnchors: [
          { id: "ks-kite-a", x: 760, y: 180, w: 72, h: 150, duration: 2.8, pull: 1420 },
          { id: "ks-kite-b", x: 1320, y: 115, w: 72, h: 170, duration: 2.8, pull: 1480 },
          { id: "ks-kite-c", x: 2320, y: 150, w: 72, h: 180, duration: 2.7, pull: 1500 },
          { id: "ks-kite-d", x: 2860, y: 90, w: 72, h: 190, duration: 2.6, pull: 1540 },
          { id: "ks-kite-e", x: 3780, y: 145, w: 72, h: 180, duration: 2.6, pull: 1580 }
        ]
      },
      boss: null
    },

    {
      id: 19,
      key: "turning-page-escape",
      act: 5,
      kind: "stage",
      name: "逆页逃亡",
      nameEn: "TURNING PAGE ESCAPE",
      subtitle: "抵达终点以后，真正的路才刚开始",
      briefing: {
        kicker: "STAGE 19 · RETURN",
        title: "逆页逃亡",
        subtitle: "抵达终点以后，真正的路才刚开始",
        mechanic: "先前往书页最右端唤醒返航星种；世界随后翻页，原路消失、返程纸桥展开，出口会回到出发处。",
        hint: "墨潮从右向左吞没书页。返程平台比去程更高，利用冲刺和下砸快速切换层级。"
      },
      theme: {
        id: "turning-page-escape",
        palette: {
          skyTop: "#071528",
          skyBottom: "#5A6E8B",
          ink: "#020B17",
          paper: "#F4E7CE",
          ground: "#38465C",
          groundDark: "#141D2E",
          platform: "#7C7A82",
          accent: "#F07A55",
          accent2: "#5FDDD0",
          danger: "#CA3654",
          fog: "#515A72"
        },
        material: "accordion-book-paper",
        ambient: { type: "flying-pages", count: 52, speed: 1.0 },
        landmark: { type: "turning-page-shrine", x: 4020, y: 56, scale: 1.72, accent: "#5FDDD0" }
      },
      worldWidth: 4900,
      worldHeight: WORLD_HEIGHT,
      killY: 830,
      camera: { mode: "follow", deadZoneX: 0.36, lookAhead: 145 },
      spawn: { x: 150, y: 536, facing: 1 },
      goal: {
        type: "return-gate",
        x: 24,
        y: 470,
        w: 96,
        h: 150,
        requires: { type: "return-seed", label: "返航星种" }
      },
      platforms: [
        platform("tp-ground-start", 0, 620, 600, 100, { material: "book-stone" }),
        platform("tp-out-01", 600, 525, 430, 26, { kind: "one-way", material: "page-paper", pagePhase: "outbound" }),
        platform("tp-back-01", 620, 365, 390, 26, { kind: "one-way", material: "ink-paper", pagePhase: "return" }),
        platform("tp-ground-02", 1030, 620, 470, 100, { material: "book-stone" }),
        platform("tp-out-02", 1500, 455, 520, 26, { kind: "one-way", material: "page-paper", pagePhase: "outbound" }),
        platform("tp-back-02", 1510, 305, 500, 26, { kind: "one-way", material: "ink-paper", pagePhase: "return" }),
        platform("tp-ground-03", 2020, 620, 500, 100, { material: "book-stone" }),
        platform("tp-out-03", 2520, 520, 520, 26, { kind: "one-way", material: "page-paper", pagePhase: "outbound" }),
        platform("tp-back-03", 2540, 380, 480, 26, { kind: "one-way", material: "ink-paper", pagePhase: "return" }),
        platform("tp-ground-04", 3040, 620, 500, 100, { material: "book-stone" }),
        platform("tp-out-04", 3540, 450, 480, 26, { kind: "one-way", material: "page-paper", pagePhase: "outbound" }),
        platform("tp-back-04", 3560, 290, 450, 26, { kind: "one-way", material: "ink-paper", pagePhase: "return" }),
        platform("tp-ground-end", 4020, 620, 880, 100, { material: "book-stone" }),
        platform("tp-seed-dais", 4440, 470, 220, 28, { kind: "one-way", material: "shrine-brass" })
      ],
      hazards: [
        hazard("tp-void-01", "star-void", 600, 670, 430, 50, { damage: 99 }),
        hazard("tp-void-02", "star-void", 1500, 670, 520, 50, { damage: 99 }),
        hazard("tp-void-03", "star-void", 2520, 670, 520, 50, { damage: 99 }),
        hazard("tp-void-04", "star-void", 3540, 670, 480, 50, { damage: 99 }),
        hazard("tp-rift-01", "void-rift", 1220, 586, 110, 34),
        hazard("tp-rift-02", "void-rift", 3190, 586, 120, 34)
      ],
      enemies: [
        enemy("tp-shadow-01", "chrono-leech", 1120, 566, 1070, 1440, { hp: 3, speed: 76 }),
        enemy("tp-bat-01", "echo-bat", 1740, 340, 1530, 1970, { hp: 2, yBob: 45, speed: 90 }),
        enemy("tp-shadow-02", "fold-beetle", 3090, 566, 3060, 3470, { hp: 4, speed: 68 }),
        enemy("tp-eye-01", "orbit-eye", 4140, 330, 4050, 4370, { hp: 3, yBob: 50, speed: 98 })
      ],
      collectibles: [
        collectible("tp-seed-01", "memory-seed", 760, 465),
        collectible("tp-heart", "heart", 2200, 520),
        collectible("tp-seed-02", "memory-seed", 2720, 460),
        collectible("tp-return-seed", "return-seed", 4530, 405, { quest: true })
      ],
      checkpoints: [
        checkpoint("tp-check-01", 1080, 528, 1100, 536),
        checkpoint("tp-check-02", 3070, 528, 3090, 536),
        checkpoint("tp-check-03", 4100, 528, 4120, 536)
      ],
      mechanics: {
        type: "page-return",
        pageTurn: { itemType: "return-seed", inkSpeed: 220, startOffset: 180, resetOffset: 220 }
      },
      boss: null
    },

    {
      id: 20,
      key: "thousand-page-aviary",
      act: 5,
      kind: "boss",
      name: "千页鸾庭",
      nameEn: "THOUSAND-PAGE AVIARY",
      subtitle: "让守门者撞进自己写下的折痕",
      briefing: {
        kicker: "BOSS 05 · CREASE",
        title: "千页守鸾",
        subtitle: "让守门者撞进自己写下的折痕",
        mechanic: "守鸾俯冲前会点亮一块场地折痕。在它落下前对准该折痕下砸，把纸台折起，才能困住羽翼并暴露胸口星种。",
        hint: "观察珊瑚色预警线，而不是追着 Boss 跑。后两个阶段会制造落页和地面冲击波干扰下砸时机。"
      },
      theme: {
        id: "thousand-page-aviary",
        palette: {
          skyTop: "#081427",
          skyBottom: "#485873",
          ink: "#030A16",
          paper: "#F6E9D0",
          ground: "#303D52",
          groundDark: "#121A2B",
          platform: "#6F707C",
          accent: "#F06A50",
          accent2: "#4DD7CC",
          danger: "#E23D56",
          fog: "#4C526B"
        },
        material: "book-spine-brass",
        ambient: { type: "page-flock", count: 54, speed: 0.72 },
        landmark: { type: "origami-aviary", x: 2280, y: 45, scale: 1.82, accent: "#F06A50" }
      },
      worldWidth: 3700,
      worldHeight: WORLD_HEIGHT,
      killY: 820,
      camera: { mode: "boss-lock", deadZoneX: 0.42, lookAhead: 80 },
      spawn: { x: 90, y: 536, facing: 1 },
      goal: { type: "world-core", x: 3440, y: 435, w: 120, h: 185, requires: "boss-defeated" },
      platforms: [
        platform("pa-ground-entry", 0, 620, 820, 100, { material: "aviary-stone" }),
        platform("pa-entry-step", 330, 480, 190, 24, { kind: "one-way", material: "book-brass" }),
        platform("pa-entry-bridge", 820, 555, 300, 65, { material: "book-spine" }),
        platform("pa-arena-floor", 1120, 620, 2160, 100, { material: "aviary-stone" }),
        platform("pa-high-left", 1310, 390, 180, 24, { kind: "one-way", material: "book-brass" }),
        platform("pa-high-mid", 2060, 330, 180, 24, { kind: "one-way", material: "book-brass" }),
        platform("pa-high-right", 2810, 390, 180, 24, { kind: "one-way", material: "book-brass" }),
        platform("pa-exit", 3280, 620, 420, 100, { material: "aviary-stone" })
      ],
      hazards: [
        hazard("pa-rift-left", "void-rift", 1350, 586, 120, 34),
        hazard("pa-rift-mid", "void-rift", 2110, 586, 120, 34),
        hazard("pa-rift-right", "void-rift", 2860, 586, 120, 34)
      ],
      enemies: [
        enemy("pa-minion-01", "star-siphon", 1450, 300, 1250, 1760, { hp: 3, yBob: 44, speed: 90, spawnOnBossPhase: 2 }),
        enemy("pa-minion-02", "fold-beetle", 2550, 566, 2380, 2920, { hp: 4, speed: 68, spawnOnBossPhase: 3 })
      ],
      collectibles: [
        collectible("pa-seed-01", "memory-seed", 390, 420),
        collectible("pa-heart-entry", "heart", 910, 505),
        collectible("pa-star-charge", "star-charge", 2070, 270, { charges: 2 }),
        collectible("pa-heart-phase-03", "heart", 2920, 330, { spawnOnBossPhase: 3 }),
        collectible("pa-core", "page-core-seed", 2240, 455, { quest: true, spawnOnBossDefeat: true })
      ],
      checkpoints: [checkpoint("pa-check-01", 1030, 478, 1050, 536)],
      mechanics: {
        type: "fold-warden",
        arenaTrigger: { x: 1120, lockLeft: 1120, lockRight: 3280 },
        foldTraps: [
          { id: "pa-trap-a", x: 1430, y: 574, w: 260, h: 46, armTime: 1.7 },
          { id: "pa-trap-b", x: 2020, y: 574, w: 260, h: 46, armTime: 1.7 },
          { id: "pa-trap-c", x: 2610, y: 574, w: 260, h: 46, armTime: 1.7 }
        ]
      },
      boss: {
        id: "thousand-page-warden",
        archetype: "fold-warden",
        name: "千页守鸾 · 折界执笔者",
        hp: 3,
        maxHealth: 3,
        arena: { x: 1120, y: 130, w: 2160, h: 490 },
        spawn: { x: 2100, y: 190 },
        body: { w: 190, h: 180 },
        weakPoint: { type: "page-star-core", vulnerableState: "fold-trapped", damagePerHit: 1, exposedTime: 3.5 },
        phases: [
          { atHealth: 3, name: "试折", telegraph: 0.95, diveSpeed: 720, attackCooldown: 1.9 },
          { atHealth: 2, name: "乱页", telegraph: 0.78, diveSpeed: 840, attackCooldown: 1.55 },
          { atHealth: 1, name: "终章", telegraph: 0.65, diveSpeed: 960, attackCooldown: 1.25 }
        ],
        mechanism: { shielded: true, exposeBy: "downstrike-fold-trap", resetTrapOnExposure: true }
      }
    },

    {
      id: 21,
      key: "starweight-court",
      act: 6,
      kind: "stage",
      name: "衡星砝庭",
      nameEn: "STARWEIGHT COURT",
      subtitle: "让重量成为一条会呼吸的桥",
      briefing: {
        kicker: "STAGE 21 · WEIGHT",
        title: "衡星砝庭",
        subtitle: "让重量成为一条会呼吸的桥",
        mechanic: "脉冲可以推动星砝，空中下砸会把它压入纸槽；左右槽的重量差会连续改变秤桥高度。",
        hint: "先看桥边的刻度目标。压错砝码时，从侧面用脉冲把它推出纸槽，再重新分配重量。"
      },
      theme: {
        id: "starweight-court",
        palette: {
          skyTop: "#111B35",
          skyBottom: "#8A694F",
          ink: "#070D1C",
          paper: "#F3E6CA",
          ground: "#4A4653",
          groundDark: "#211E2C",
          platform: "#9B7A55",
          accent: "#F1C75B",
          accent2: "#69D8C9",
          danger: "#E35E65",
          fog: "#6B6170"
        },
        material: "astrolabe-scale-brass",
        ambient: { type: "floating-weight-runes", count: 46, speed: 0.36 },
        landmark: { type: "celestial-balance", x: 3060, y: 56, scale: 1.74, accent: "#F1C75B" }
      },
      worldWidth: 5000,
      worldHeight: WORLD_HEIGHT,
      killY: 830,
      camera: { mode: "follow", deadZoneX: 0.34, lookAhead: 155 },
      spawn: { x: 92, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4815,
        y: 470,
        w: 96,
        h: 150,
        requires: { type: "balanced-bridges", count: 3, label: "衡星桥" }
      },
      platforms: [
        platform("wc-ground-01", 0, 620, 700, 100, { material: "scale-court-stone" }),
        platform("wc-training-step", 255, 485, 180, 24, { kind: "one-way", material: "weight-brass" }),
        platform("wc-scale-bridge-a", 700, 510, 480, 28, { kind: "weight-bridge", material: "balance-paper", weightGroup: "a" }),
        platform("wc-ground-02", 1180, 620, 570, 100, { material: "scale-court-stone" }),
        platform("wc-ledge-02", 1350, 430, 185, 24, { kind: "one-way", material: "weight-brass" }),
        platform("wc-scale-bridge-b", 1750, 455, 590, 28, { kind: "weight-bridge", material: "balance-paper", weightGroup: "b" }),
        platform("wc-ground-03", 2340, 620, 640, 100, { material: "scale-court-stone" }),
        platform("wc-high-03", 2530, 370, 190, 24, { kind: "one-way", material: "weight-brass" }),
        platform("wc-scale-bridge-c", 2980, 505, 620, 28, { kind: "weight-bridge", material: "balance-paper", weightGroup: "c" }),
        platform("wc-ground-04", 3600, 620, 700, 100, { material: "scale-court-stone" }),
        platform("wc-balance-lift", 3820, 420, 180, 24, {
          kind: "moving",
          material: "weight-brass",
          motion: { axis: "y", distance: 105, speed: 0.72, phase: 0.35 }
        }),
        platform("wc-ground-05", 4300, 620, 700, 100, { material: "scale-court-stone" }),
        platform("wc-finish-step", 4600, 480, 185, 24, { kind: "one-way", material: "weight-brass" })
      ],
      hazards: [
        hazard("wc-void-01", "star-void", 700, 665, 480, 55, { damage: 99 }),
        hazard("wc-spike-01", "crystal-spike", 1435, 588, 96, 32),
        hazard("wc-void-02", "star-void", 1750, 665, 590, 55, { damage: 99 }),
        hazard("wc-star-01", "falling-star", 2070, 120, 44, 44, { interval: 2.3, telegraph: 0.78, phase: 0.4 }),
        hazard("wc-spike-02", "crystal-spike", 2700, 588, 102, 32),
        hazard("wc-void-03", "star-void", 2980, 665, 620, 55, { damage: 99 }),
        hazard("wc-star-02", "falling-star", 3290, 105, 46, 46, { interval: 2, telegraph: 0.72, phase: 1.2 }),
        hazard("wc-spike-03", "crystal-spike", 4090, 588, 106, 32)
      ],
      enemies: [
        enemy("wc-beetle-01", "fold-beetle", 1240, 566, 1210, 1640, { hp: 3, speed: 58 }),
        enemy("wc-eye-01", "orbit-eye", 2470, 315, 2360, 2780, { hp: 3, yBob: 46, speed: 88 }),
        enemy("wc-leech-01", "chrono-leech", 3690, 566, 3630, 4140, { hp: 4, speed: 76 }),
        enemy("wc-eye-02", "star-siphon", 4440, 320, 4330, 4740, { hp: 3, yBob: 52, speed: 102 })
      ],
      collectibles: [
        collectible("wc-seed-01", "memory-seed", 325, 430),
        collectible("wc-seed-02", "memory-seed", 910, 420),
        collectible("wc-heart-01", "heart", 1450, 370),
        collectible("wc-seed-03", "memory-seed", 2070, 390),
        collectible("wc-star", "star-charge", 2580, 310, { charges: 2 }),
        collectible("wc-seed-04", "memory-seed", 3290, 420),
        collectible("wc-heart-02", "heart", 3905, 360),
        collectible("wc-seed-05", "memory-seed", 4640, 425)
      ],
      checkpoints: [
        checkpoint("wc-check-01", 1215, 528, 1235, 536),
        checkpoint("wc-check-02", 2375, 528, 2395, 536),
        checkpoint("wc-check-03", 3635, 528, 3655, 536)
      ],
      mechanics: {
        type: "starweight-balance",
        weightBlocks: [
          { id: "wc-weight-a1", group: "a", x: 245, y: 558, w: 54, h: 62, mass: 1, pushBy: "pulse", seatBy: "downstrike" },
          { id: "wc-weight-a2", group: "a", x: 475, y: 546, w: 66, h: 74, mass: 1, pushBy: "pulse", seatBy: "downstrike" },
          { id: "wc-weight-b1", group: "b", x: 1260, y: 558, w: 54, h: 62, mass: 1, pushBy: "pulse", seatBy: "downstrike" },
          { id: "wc-weight-b2", group: "b", x: 1510, y: 546, w: 66, h: 74, mass: 2, pushBy: "pulse", seatBy: "downstrike" },
          { id: "wc-weight-c1", group: "c", x: 2420, y: 558, w: 54, h: 62, mass: 1, pushBy: "pulse", seatBy: "downstrike" },
          { id: "wc-weight-c2", group: "c", x: 2630, y: 546, w: 66, h: 74, mass: 2, pushBy: "pulse", seatBy: "downstrike" },
          { id: "wc-weight-c3", group: "c", x: 2830, y: 534, w: 78, h: 86, mass: 3, pushBy: "pulse", seatBy: "downstrike" }
        ],
        weightSlots: [
          { id: "wc-slot-a-left", group: "a", side: "left", x: 365, y: 585, w: 86, h: 35, capacity: 1, ejectBy: "pulse" },
          { id: "wc-slot-a-right", group: "a", side: "right", x: 555, y: 585, w: 86, h: 35, capacity: 1, ejectBy: "pulse" },
          { id: "wc-slot-b-left", group: "b", side: "left", x: 1340, y: 585, w: 92, h: 35, capacity: 1, ejectBy: "pulse" },
          { id: "wc-slot-b-right", group: "b", side: "right", x: 1580, y: 585, w: 92, h: 35, capacity: 1, ejectBy: "pulse" },
          { id: "wc-slot-c-left", group: "c", side: "left", x: 2470, y: 585, w: 110, h: 35, capacity: 2, ejectBy: "pulse" },
          { id: "wc-slot-c-right", group: "c", side: "right", x: 2740, y: 585, w: 110, h: 35, capacity: 2, ejectBy: "pulse" }
        ],
        scaleBridges: [
          { id: "wc-balance-a", platform: "wc-scale-bridge-a", leftSlot: "wc-slot-a-left", rightSlot: "wc-slot-a-right", minY: 350, maxY: 555, targetDelta: 0, tolerance: 0.15 },
          { id: "wc-balance-b", platform: "wc-scale-bridge-b", leftSlot: "wc-slot-b-left", rightSlot: "wc-slot-b-right", minY: 315, maxY: 555, targetDelta: 1, tolerance: 0.15 },
          { id: "wc-balance-c", platform: "wc-scale-bridge-c", leftSlot: "wc-slot-c-left", rightSlot: "wc-slot-c-right", minY: 300, maxY: 555, targetDelta: 0, tolerance: 0.15 }
        ]
      },
      boss: null
    },

    {
      id: 22,
      key: "duplex-silhouette-harbor",
      act: 6,
      kind: "stage",
      name: "双层剪影港",
      nameEn: "DUPLEX SILHOUETTE HARBOR",
      subtitle: "冲过纸缝，在两座港口之间换岸",
      briefing: {
        kicker: "STAGE 22 · SILHOUETTE",
        title: "双层剪影港",
        subtitle: "冲过纸缝，在两座港口之间换岸",
        mechanic: "冲刺穿过发光裁切缝会在前景与背景之间换层；另一层的地面、敌人和危险只留下剪影。",
        hint: "先看远处同色灯塔确认下一段落脚层。普通移动碰到裁切缝不会换层，必须用冲刺贯穿。"
      },
      theme: {
        id: "duplex-silhouette-harbor",
        palette: {
          skyTop: "#071A2D",
          skyBottom: "#B55F63",
          ink: "#030A14",
          paper: "#F2DFC5",
          ground: "#344654",
          groundDark: "#111C2A",
          platform: "#7E8790",
          accent: "#F0A85A",
          accent2: "#5ED8D2",
          danger: "#E44762",
          fog: "#64596D"
        },
        material: "cut-paper-dock",
        ambient: { type: "layered-paper-gulls", count: 48, speed: 0.7 },
        landmark: { type: "double-lighthouse", x: 3380, y: 60, scale: 1.72, accent: "#5ED8D2" }
      },
      worldWidth: 5000,
      worldHeight: WORLD_HEIGHT,
      killY: 825,
      camera: { mode: "follow", deadZoneX: 0.34, lookAhead: 160 },
      spawn: { x: 90, y: 536, facing: 1 },
      goal: { type: "rift-gate", x: 4815, y: 470, w: 96, h: 150, requires: "reach" },
      platforms: [
        platform("dh-shared-start", 0, 620, 610, 100, { material: "harbor-stone", lane: "both" }),
        platform("dh-foreground-01", 610, 620, 590, 100, { material: "sunset-dock", lane: "foreground" }),
        platform("dh-background-01", 610, 455, 590, 28, { kind: "one-way", material: "shadow-dock", lane: "background" }),
        platform("dh-background-step-01", 970, 345, 175, 24, { kind: "one-way", material: "shadow-sail", lane: "background" }),
        platform("dh-shared-island-01", 1200, 620, 430, 100, { material: "harbor-stone", lane: "both" }),
        platform("dh-foreground-02", 1630, 475, 600, 28, { kind: "one-way", material: "sunset-dock", lane: "foreground" }),
        platform("dh-background-02", 1630, 620, 600, 100, { material: "shadow-dock", lane: "background" }),
        platform("dh-foreground-crane", 1880, 340, 180, 24, { kind: "moving", material: "sunset-sail", lane: "foreground", motion: { axis: "y", distance: 90, speed: 0.82, phase: 0.25 } }),
        platform("dh-shared-island-02", 2230, 620, 470, 100, { material: "harbor-stone", lane: "both" }),
        platform("dh-foreground-03", 2700, 620, 620, 100, { material: "sunset-dock", lane: "foreground" }),
        platform("dh-background-03", 2700, 430, 620, 28, { kind: "one-way", material: "shadow-dock", lane: "background" }),
        platform("dh-background-crane", 2960, 300, 180, 24, { kind: "moving", material: "shadow-sail", lane: "background", motion: { axis: "x", distance: 120, speed: 0.94, phase: 0.6 } }),
        platform("dh-shared-island-03", 3320, 620, 520, 100, { material: "harbor-stone", lane: "both" }),
        platform("dh-foreground-04", 3840, 455, 560, 28, { kind: "one-way", material: "sunset-dock", lane: "foreground" }),
        platform("dh-background-04", 3840, 620, 560, 100, { material: "shadow-dock", lane: "background" }),
        platform("dh-shared-end", 4400, 620, 600, 100, { material: "harbor-stone", lane: "both" }),
        platform("dh-finish-step", 4610, 480, 180, 24, { kind: "one-way", material: "seam-brass", lane: "both" })
      ],
      hazards: [
        hazard("dh-void-01", "star-void", 610, 665, 590, 55, { damage: 99, lane: "background" }),
        hazard("dh-spike-01", "crystal-spike", 820, 588, 105, 32, { lane: "foreground" }),
        hazard("dh-void-02", "star-void", 1630, 665, 600, 55, { damage: 99, lane: "foreground" }),
        hazard("dh-spike-02", "crystal-spike", 1940, 588, 105, 32, { lane: "background" }),
        hazard("dh-void-03", "star-void", 2700, 665, 620, 55, { damage: 99, lane: "background" }),
        hazard("dh-spike-03", "crystal-spike", 2960, 588, 112, 32, { lane: "foreground" }),
        hazard("dh-void-04", "star-void", 3840, 665, 560, 55, { damage: 99, lane: "foreground" }),
        hazard("dh-spike-04", "crystal-spike", 4070, 588, 112, 32, { lane: "background" })
      ],
      enemies: [
        enemy("dh-mimic-01", "mirror-mimic", 720, 566, 650, 1090, { hp: 3, speed: 72, lane: "foreground" }),
        enemy("dh-eye-01", "orbit-eye", 980, 285, 740, 1160, { hp: 2, yBob: 48, speed: 88, lane: "background" }),
        enemy("dh-spinner-01", "thread-spinner", 1760, 566, 1660, 2160, { hp: 3, speed: 70, lane: "background" }),
        enemy("dh-wasp-01", "propeller-wasp", 1920, 285, 1680, 2180, { hp: 3, yBob: 46, speed: 100, lane: "foreground" }),
        enemy("dh-mimic-02", "mirror-mimic", 2810, 566, 2740, 3240, { hp: 4, speed: 80, lane: "foreground" }),
        enemy("dh-eye-02", "star-siphon", 3040, 260, 2770, 3260, { hp: 3, yBob: 54, speed: 104, lane: "background" }),
        enemy("dh-spinner-02", "thread-spinner", 3940, 566, 3880, 4320, { hp: 4, speed: 78, lane: "background" })
      ],
      collectibles: [
        collectible("dh-seed-01", "memory-seed", 330, 455),
        collectible("dh-seed-02", "memory-seed", 1030, 285, { lane: "background" }),
        collectible("dh-heart-01", "heart", 1900, 285, { lane: "foreground" }),
        collectible("dh-seed-03", "memory-seed", 2450, 540),
        collectible("dh-star", "star-charge", 3040, 245, { charges: 2, lane: "background" }),
        collectible("dh-seed-04", "memory-seed", 3590, 540),
        collectible("dh-heart-02", "heart", 4130, 540, { lane: "background" }),
        collectible("dh-seed-05", "memory-seed", 4660, 425)
      ],
      checkpoints: [
        checkpoint("dh-check-01", 1240, 528, 1260, 536),
        checkpoint("dh-check-02", 2270, 528, 2290, 536),
        checkpoint("dh-check-03", 3360, 528, 3380, 536),
        checkpoint("dh-check-04", 4440, 528, 4460, 536)
      ],
      mechanics: {
        type: "silhouette-lanes",
        initialLane: "foreground",
        lanes: [
          { id: "foreground", depth: 1, opacity: 1, color: "#F0A85A" },
          { id: "background", depth: 0, opacity: 0.66, color: "#5ED8D2" }
        ],
        seams: [
          { id: "dh-seam-a", x: 540, y: 250, w: 78, h: 370, from: "foreground", to: "background", trigger: "dash" },
          { id: "dh-seam-b", x: 1555, y: 235, w: 82, h: 385, from: "background", to: "foreground", trigger: "dash" },
          { id: "dh-seam-c", x: 2625, y: 220, w: 82, h: 400, from: "foreground", to: "background", trigger: "dash" },
          { id: "dh-seam-d", x: 3765, y: 230, w: 82, h: 390, from: "background", to: "foreground", trigger: "dash" }
        ],
        inactiveLane: { collision: false, enemyContact: false, opacity: 0.28 }
      },
      boss: null
    },

    {
      id: 23,
      key: "sproutstitch-meadow",
      act: 6,
      kind: "stage",
      name: "芽纹绣原",
      nameEn: "SPROUTSTITCH MEADOW",
      subtitle: "把走过的弧线绣成下一次落脚",
      briefing: {
        kicker: "STAGE 23 · STITCH",
        title: "芽纹绣原",
        subtitle: "把走过的弧线绣成下一次落脚",
        mechanic: "用脉冲点亮绣架后，最近数秒的移动轨迹会被记录；再次发射脉冲可把这条轨迹固化成临时纸桥。",
        hint: "先借弹簧画出平缓的跳跃弧线，落地后再固化。轨迹太陡会变成难以站稳的纸阶。"
      },
      theme: {
        id: "sproutstitch-meadow",
        palette: {
          skyTop: "#26475A",
          skyBottom: "#E7C985",
          ink: "#10212A",
          paper: "#F7EBD2",
          ground: "#56735D",
          groundDark: "#2D4438",
          platform: "#C39B69",
          accent: "#F0B95A",
          accent2: "#54CDBA",
          danger: "#D95663",
          fog: "#BAD0A8"
        },
        material: "embroidered-grass-paper",
        ambient: { type: "thread-petals", count: 52, speed: 0.58 },
        landmark: { type: "giant-embroidery-hoop", x: 3100, y: 52, scale: 1.8, accent: "#54CDBA" }
      },
      worldWidth: 5000,
      worldHeight: WORLD_HEIGHT,
      killY: 835,
      camera: { mode: "follow", deadZoneX: 0.34, lookAhead: 165 },
      spawn: { x: 92, y: 536, facing: 1 },
      goal: {
        type: "rift-gate",
        x: 4810,
        y: 470,
        w: 96,
        h: 150,
        requires: { type: "woven-routes", count: 3, label: "芽纹纸桥" }
      },
      platforms: [
        platform("sm-ground-01", 0, 620, 610, 100, { material: "stitch-meadow-earth" }),
        platform("sm-spring-01", 440, 570, 145, 28, { kind: "spring", material: "thread-bloom", bounceY: -760 }),
        platform("sm-island-01", 1210, 620, 600, 100, { material: "stitch-meadow-earth" }),
        platform("sm-high-01", 1380, 420, 180, 24, { kind: "one-way", material: "embroidery-hoop" }),
        platform("sm-spring-02", 1630, 570, 150, 28, { kind: "spring", material: "thread-bloom", bounceY: -810 }),
        platform("sm-island-02", 2520, 620, 650, 100, { material: "stitch-meadow-earth" }),
        platform("sm-high-02", 2700, 360, 190, 24, { kind: "one-way", material: "embroidery-hoop" }),
        platform("sm-spring-03", 2980, 570, 155, 28, { kind: "spring", material: "thread-bloom", bounceY: -850 }),
        platform("sm-island-03", 3980, 620, 520, 100, { material: "stitch-meadow-earth" }),
        platform("sm-thread-lift", 4120, 390, 180, 24, { kind: "moving", material: "embroidery-hoop", motion: { axis: "y", distance: 115, speed: 0.78, phase: 0.45 } }),
        platform("sm-ground-end", 4500, 620, 500, 100, { material: "stitch-meadow-earth" }),
        platform("sm-finish-step", 4610, 480, 180, 24, { kind: "one-way", material: "embroidery-hoop" })
      ],
      hazards: [
        hazard("sm-void-01", "star-void", 610, 665, 600, 55, { damage: 99 }),
        hazard("sm-star-01", "falling-star", 900, 130, 44, 44, { interval: 2.5, telegraph: 0.82, phase: 0.3 }),
        hazard("sm-spike-01", "crystal-spike", 1430, 588, 105, 32),
        hazard("sm-void-02", "star-void", 1810, 665, 710, 55, { damage: 99 }),
        hazard("sm-star-02", "falling-star", 2160, 105, 46, 46, { interval: 2.2, telegraph: 0.76, phase: 1.1 }),
        hazard("sm-spike-02", "crystal-spike", 2760, 588, 110, 32),
        hazard("sm-void-03", "star-void", 3170, 665, 810, 55, { damage: 99 }),
        hazard("sm-star-03", "falling-star", 3560, 90, 48, 48, { interval: 1.9, telegraph: 0.7, phase: 0.7 }),
        hazard("sm-spike-03", "crystal-spike", 4300, 588, 110, 32)
      ],
      enemies: [
        enemy("sm-hopper-01", "seed-hopper", 1280, 566, 1240, 1710, { hp: 3, speed: 64 }),
        enemy("sm-wasp-01", "propeller-wasp", 1510, 340, 1260, 1760, { hp: 3, yBob: 48, speed: 96 }),
        enemy("sm-spinner-01", "thread-spinner", 2600, 566, 2560, 3070, { hp: 4, speed: 74 }),
        enemy("sm-eye-01", "orbit-eye", 2790, 285, 2560, 3070, { hp: 3, yBob: 52, speed: 98 }),
        enemy("sm-spinner-02", "thread-spinner", 4060, 566, 4020, 4430, { hp: 4, speed: 82 })
      ],
      collectibles: [
        collectible("sm-seed-01", "memory-seed", 315, 445),
        collectible("sm-seed-02", "memory-seed", 910, 370),
        collectible("sm-heart-01", "heart", 1460, 365),
        collectible("sm-seed-03", "memory-seed", 2160, 350),
        collectible("sm-star", "star-charge", 2770, 300, { charges: 2 }),
        collectible("sm-seed-04", "memory-seed", 3560, 330),
        collectible("sm-heart-02", "heart", 4190, 330),
        collectible("sm-seed-05", "memory-seed", 4680, 425)
      ],
      checkpoints: [
        checkpoint("sm-check-01", 1250, 528, 1270, 536),
        checkpoint("sm-check-02", 2560, 528, 2580, 536),
        checkpoint("sm-check-03", 4020, 528, 4040, 536)
      ],
      mechanics: {
        type: "trajectory-weave",
        weaveRules: {
          recordSeconds: 3.4,
          sampleInterval: 0.08,
          segmentLength: 54,
          segmentThickness: 18,
          lifetime: 9,
          maxActiveBridges: 3,
          solidifyBy: "pulse",
          cancelOnDamage: true
        },
        looms: [
          { id: "sm-loom-a", x: 500, y: 465, w: 62, h: 86, bridgeZone: { x: 590, y: 220, w: 640, h: 400 }, targetPlatform: "sm-island-01" },
          { id: "sm-loom-b", x: 1695, y: 455, w: 62, h: 86, bridgeZone: { x: 1790, y: 160, w: 750, h: 460 }, targetPlatform: "sm-island-02" },
          { id: "sm-loom-c", x: 3045, y: 445, w: 62, h: 86, bridgeZone: { x: 3150, y: 120, w: 850, h: 500 }, targetPlatform: "sm-island-03" }
        ]
      },
      boss: null
    },

    {
      id: 24,
      key: "sky-paper-dragon",
      act: 6,
      kind: "boss",
      name: "天穹纸龙",
      nameEn: "SKY PAPER DRAGON",
      subtitle: "沿着活着的书脊冲向天穹核心",
      briefing: {
        kicker: "BOSS 06 · SKYDRAGON",
        title: "天穹纸龙",
        subtitle: "沿着活着的书脊冲向天穹核心",
        mechanic: "纸龙的身体就是移动关卡。攀上龙身，下砸三处结鳞，纸鳞会翻转成通往头冠核心的短暂跑道。",
        hint: "每轮只需完成一次三结鳞机关并命中核心。三轮成功后战斗结束，不必反复磨损普通部位。"
      },
      theme: {
        id: "sky-paper-dragon",
        palette: {
          skyTop: "#06142E",
          skyBottom: "#6B4C83",
          ink: "#020812",
          paper: "#F5E5C9",
          ground: "#313552",
          groundDark: "#11152A",
          platform: "#73708A",
          accent: "#F2BE55",
          accent2: "#55DCD1",
          danger: "#ED4863",
          fog: "#514E73"
        },
        material: "celestial-dragon-paper",
        ambient: { type: "dragon-scale-comets", count: 60, speed: 0.9 },
        landmark: { type: "sky-scroll-gate", x: 2360, y: 36, scale: 1.9, accent: "#F2BE55" }
      },
      worldWidth: 4200,
      worldHeight: WORLD_HEIGHT,
      killY: 850,
      camera: { mode: "boss-lock", deadZoneX: 0.4, lookAhead: 95 },
      spawn: { x: 92, y: 536, facing: 1 },
      goal: { type: "world-core", x: 3940, y: 425, w: 126, h: 195, requires: "boss-defeated" },
      platforms: [
        platform("pd-ground-entry", 0, 620, 850, 100, { material: "sky-temple-stone" }),
        platform("pd-entry-step", 330, 480, 190, 24, { kind: "one-way", material: "dragon-brass" }),
        platform("pd-launch", 690, 550, 150, 28, { kind: "spring", material: "dragon-scale", bounceY: -820 }),
        platform("pd-body-head", 1050, 430, 340, 34, { kind: "boss-body", material: "living-paper-scale", bossAttached: true, segment: "head" }),
        platform("pd-body-neck", 1390, 365, 330, 32, { kind: "boss-body", material: "living-paper-scale", bossAttached: true, segment: "neck" }),
        platform("pd-body-01", 1720, 440, 340, 32, { kind: "boss-body", material: "living-paper-scale", bossAttached: true, segment: "body-a" }),
        platform("pd-body-02", 2060, 325, 340, 32, { kind: "boss-body", material: "living-paper-scale", bossAttached: true, segment: "body-b" }),
        platform("pd-body-03", 2400, 420, 340, 32, { kind: "boss-body", material: "living-paper-scale", bossAttached: true, segment: "body-c" }),
        platform("pd-body-04", 2740, 345, 340, 32, { kind: "boss-body", material: "living-paper-scale", bossAttached: true, segment: "body-d" }),
        platform("pd-body-tail", 3080, 455, 320, 30, { kind: "boss-body", material: "living-paper-scale", bossAttached: true, segment: "tail" }),
        platform("pd-arena-exit", 3500, 620, 700, 100, { material: "sky-temple-stone" }),
        platform("pd-core-step", 3800, 490, 190, 24, { kind: "one-way", material: "dragon-brass" })
      ],
      hazards: [
        hazard("pd-sky-void", "star-void", 850, 665, 2650, 55, { damage: 99 }),
        hazard("pd-star-01", "falling-star", 1320, 90, 46, 46, { interval: 2.4, telegraph: 0.82, phase: 0.2 }),
        hazard("pd-star-02", "falling-star", 2140, 70, 48, 48, { interval: 2.1, telegraph: 0.74, phase: 1.0 }),
        hazard("pd-star-03", "falling-star", 2920, 85, 50, 50, { interval: 1.8, telegraph: 0.68, phase: 1.5 }),
        hazard("pd-rift-left", "void-rift", 3620, 586, 120, 34),
        hazard("pd-rift-right", "void-rift", 4010, 586, 120, 34)
      ],
      enemies: [
        enemy("pd-wasp-01", "propeller-wasp", 1450, 260, 1180, 1760, { hp: 3, yBob: 50, speed: 102, spawnOnBossPhase: 2 }),
        enemy("pd-eye-01", "star-siphon", 2520, 245, 2220, 2870, { hp: 3, yBob: 54, speed: 108, spawnOnBossPhase: 2 }),
        enemy("pd-mimic-01", "mirror-mimic", 3650, 566, 3550, 3920, { hp: 4, speed: 84, spawnOnBossPhase: 3 })
      ],
      collectibles: [
        collectible("pd-seed-01", "memory-seed", 365, 425),
        collectible("pd-heart-entry", "heart", 735, 490),
        collectible("pd-star-charge", "star-charge", 2220, 265, { charges: 2 }),
        collectible("pd-heart-phase-03", "heart", 2980, 285, { spawnOnBossPhase: 3 }),
        collectible("pd-core", "sky-dragon-core", 3990, 455, { quest: true, spawnOnBossDefeat: true })
      ],
      checkpoints: [checkpoint("pd-check-01", 790, 478, 810, 536)],
      mechanics: {
        type: "sky-paper-dragon",
        arenaTrigger: { x: 850, lockLeft: 850, lockRight: 3500 },
        exposureCycles: 3,
        dragonRoute: {
          centerX: 2240,
          centerY: 360,
          radiusX: 520,
          radiusY: 135,
          speed: 0.34,
          phaseSpeedByCycle: [0.34, 0.46, 0.58]
        },
        bodyPlatforms: [
          { platform: "pd-body-head", offsetX: -1190, offsetY: 70, phase: 0 },
          { platform: "pd-body-neck", offsetX: -850, offsetY: 5, phase: 0.35 },
          { platform: "pd-body-01", offsetX: -510, offsetY: 80, phase: 0.7 },
          { platform: "pd-body-02", offsetX: -170, offsetY: -35, phase: 1.05 },
          { platform: "pd-body-03", offsetX: 170, offsetY: 60, phase: 1.4 },
          { platform: "pd-body-04", offsetX: 510, offsetY: -15, phase: 1.75 },
          { platform: "pd-body-tail", offsetX: 850, offsetY: 95, phase: 2.1 }
        ],
        knotScales: [
          { id: "pd-knot-a", platform: "pd-body-01", offsetX: 105, offsetY: -38, w: 64, h: 42, activation: "downstrike", order: 1 },
          { id: "pd-knot-b", platform: "pd-body-02", offsetX: 138, offsetY: -38, w: 64, h: 42, activation: "downstrike", order: 2 },
          { id: "pd-knot-c", platform: "pd-body-04", offsetX: 126, offsetY: -38, w: 64, h: 42, activation: "downstrike", order: 3 }
        ],
        scaleFlip: { duration: 4.5, runDirection: "head", resetKnotsAfterExposure: true }
      },
      boss: {
        id: "sky-paper-dragon",
        archetype: "sky-paper-dragon",
        name: "天穹纸龙 · 星卷守门者",
        hp: 3,
        maxHealth: 3,
        arena: { x: 850, y: 90, w: 2650, h: 530 },
        spawn: { x: 2240, y: 255 },
        body: { w: 1540, h: 270 },
        weakPoint: { type: "sky-crown-core", offsetX: -690, offsetY: -65, vulnerableState: "knots-broken", damagePerHit: 1, maxHitsPerExposure: 1, exposedTime: 4.5 },
        phases: [
          { atHealth: 3, name: "游卷", requiredKnots: 3, routeSpeed: 0.34, attackCooldown: 2.2, starfallCount: 1 },
          { atHealth: 2, name: "翻鳞", requiredKnots: 3, routeSpeed: 0.46, attackCooldown: 1.75, starfallCount: 2 },
          { atHealth: 1, name: "天穹", requiredKnots: 3, routeSpeed: 0.58, attackCooldown: 1.3, starfallCount: 3 }
        ],
        mechanism: {
          shielded: true,
          bodyIsPlatform: true,
          exposeBy: "three-knot-scales",
          requiredKnots: 3,
          exposureCycles: 3,
          resetKnotsOnExposure: true,
          defeatEffect: "open-sky-scroll"
        }
      }
    },

    {
      id: 25,
      key: "dewdrop-miniature-garden",
      act: 7,
      kind: "stage",
      name: "露珠缩景园",
      nameEn: "DEWDROP MINIATURE GARDEN",
      subtitle: "换一种身量，走进纸叶背面",
      briefing: {
        kicker: "STAGE 25 · SCALE",
        title: "露珠缩景园",
        subtitle: "换一种身量，走进纸叶背面",
        mechanic: "脉冲唤醒露镜，在小芽与巨芽之间切换；小芽穿过纤维窄缝，巨芽下砸击碎厚蜡壳。",
        hint: "露镜只改变星芽，不改变世界。窄缝与蜡壳前后都留有安全的复原位置。"
      },
      theme: {
        id: "dewdrop-miniature-garden",
        palette: {
          skyTop: "#315F68",
          skyBottom: "#DCE8B8",
          ink: "#0B2026",
          paper: "#F4EDDA",
          ground: "#5E7656",
          groundDark: "#304638",
          platform: "#C8B879",
          accent: "#F4C45A",
          accent2: "#72D6C9",
          danger: "#E95A58",
          fog: "#C5DDBE"
        },
        material: "dew-magnified-fiber-paper",
        ambient: { type: "rolling-dew-prisms", count: 48, speed: 0.46 },
        landmark: { type: "dewdrop-prism-tree", x: 3090, y: 46, scale: 1.82, accent: "#72D6C9" }
      },
      worldWidth: 5000,
      worldHeight: WORLD_HEIGHT,
      killY: 820,
      camera: { mode: "follow", deadZoneX: 0.34, lookAhead: 155 },
      spawn: { x: 92, y: 536, facing: 1 },
      goal: { type: "rift-gate", x: 4810, y: 470, w: 96, h: 150, requires: "reach" },
      platforms: [
        platform("dg-ground-01", 0, 620, 980, 100, { material: "moss-fiber-earth" }),
        platform("dg-canopy-01", 540, 455, 350, 48, { material: "pressed-leaf-canopy" }),
        platform("dg-ledge-01", 930, 405, 175, 24, { kind: "one-way", material: "dew-brass" }),
        platform("dg-ground-02", 1120, 620, 980, 100, { material: "moss-fiber-earth" }),
        platform("dg-canopy-02", 1510, 450, 390, 52, { material: "pressed-leaf-canopy" }),
        platform("dg-ledge-02", 1950, 365, 180, 24, { kind: "one-way", material: "dew-brass" }),
        platform("dg-ground-03", 2240, 620, 1000, 100, { material: "moss-fiber-earth" }),
        platform("dg-canopy-03", 2580, 445, 420, 54, { material: "pressed-leaf-canopy" }),
        platform("dg-ledge-03", 3080, 350, 185, 24, { kind: "one-way", material: "dew-brass" }),
        platform("dg-ground-04", 3380, 620, 920, 100, { material: "moss-fiber-earth" }),
        platform("dg-canopy-04", 3580, 452, 400, 50, { material: "pressed-leaf-canopy" }),
        platform("dg-ledge-04", 4150, 390, 180, 24, { kind: "one-way", material: "dew-brass" }),
        platform("dg-ground-05", 4420, 620, 580, 100, { material: "moss-fiber-earth" }),
        platform("dg-finish-step", 4610, 480, 180, 24, { kind: "one-way", material: "dew-brass" })
      ],
      hazards: [
        hazard("dg-pit-01", "fall", 980, 665, 140, 55, { damage: 99 }),
        hazard("dg-press-01", "paper-press", 1810, 260, 92, 360, { telegraph: 0.78, on: 0.8, off: 1.5, phase: 0.2 }),
        hazard("dg-pit-02", "fall", 2100, 665, 140, 55, { damage: 99 }),
        hazard("dg-thorn-01", "crystal-spike", 2760, 588, 105, 32),
        hazard("dg-pit-03", "fall", 3240, 665, 140, 55, { damage: 99 }),
        hazard("dg-press-02", "paper-press", 3850, 250, 98, 370, { telegraph: 0.7, on: 0.72, off: 1.25, phase: 0.8 }),
        hazard("dg-pit-04", "fall", 4300, 665, 120, 55, { damage: 99 })
      ],
      enemies: [
        enemy("dg-lens-beetle-01", "lens-beetle", 760, 566, 690, 920, { hp: 2, speed: 54 }),
        enemy("dg-spinner-01", "thread-spinner", 1260, 566, 1160, 1470, { hp: 3, speed: 64 }),
        enemy("dg-lens-beetle-02", "lens-beetle", 2320, 566, 2280, 2550, { hp: 3, speed: 62 }),
        enemy("dg-siphon-01", "star-siphon", 3060, 285, 2780, 3190, { hp: 3, yBob: 48, speed: 98 }),
        enemy("dg-lens-beetle-03", "lens-beetle", 3480, 566, 3420, 3770, { hp: 3, speed: 70 }),
        enemy("dg-spinner-02", "thread-spinner", 4480, 566, 4440, 4740, { hp: 4, speed: 76 })
      ],
      collectibles: [
        collectible("dg-seed-01", "memory-seed", 330, 445),
        collectible("dg-seed-02", "memory-seed", 820, 395),
        collectible("dg-heart-01", "heart", 1320, 520),
        collectible("dg-seed-03", "memory-seed", 2010, 310),
        collectible("dg-star", "star-charge", 2660, 390, { charges: 2 }),
        collectible("dg-seed-04", "memory-seed", 3170, 295),
        collectible("dg-heart-02", "heart", 4050, 350),
        collectible("dg-seed-05", "memory-seed", 4680, 425)
      ],
      checkpoints: [
        checkpoint("dg-check-01", 1160, 528, 1180, 536),
        checkpoint("dg-check-02", 2280, 528, 2300, 536),
        checkpoint("dg-check-03", 3420, 528, 3440, 536),
        checkpoint("dg-check-04", 4450, 528, 4470, 536)
      ],
      mechanics: {
        type: "scale-lenses",
        initialForm: "giant",
        forms: {
          small: {
            label: "小芽",
            scale: 0.62,
            widthScale: 0.68,
            heightScale: 0.58,
            moveSpeedMultiplier: 1.12,
            jumpMultiplier: 1.04,
            canBreakWax: false
          },
          giant: {
            label: "巨芽",
            scale: 1.22,
            widthScale: 1.14,
            heightScale: 1.2,
            moveSpeedMultiplier: 0.9,
            jumpMultiplier: 0.92,
            canBreakWax: true
          }
        },
        lenses: [
          { id: "dg-lens-a", x: 380, y: 500, w: 62, h: 92, activation: "pulse", mode: "toggle" },
          { id: "dg-lens-b", x: 920, y: 500, w: 62, h: 92, activation: "pulse", mode: "toggle" },
          { id: "dg-lens-c", x: 1360, y: 500, w: 62, h: 92, activation: "pulse", mode: "toggle" },
          { id: "dg-lens-d", x: 2030, y: 500, w: 62, h: 92, activation: "pulse", mode: "toggle" },
          { id: "dg-lens-e", x: 2440, y: 500, w: 62, h: 92, activation: "pulse", mode: "toggle" },
          { id: "dg-lens-f", x: 3210, y: 500, w: 62, h: 92, activation: "pulse", mode: "toggle" },
          { id: "dg-lens-g", x: 3470, y: 500, w: 62, h: 92, activation: "pulse", mode: "toggle" },
          { id: "dg-lens-h", x: 4290, y: 500, w: 62, h: 92, activation: "pulse", mode: "toggle" }
        ],
        narrowPassages: [
          { id: "dg-narrow-a", x: 540, y: 503, w: 350, h: 117, requiredForm: "small", clearance: 102 },
          { id: "dg-narrow-b", x: 1510, y: 502, w: 390, h: 118, requiredForm: "small", clearance: 104 },
          { id: "dg-narrow-c", x: 3580, y: 502, w: 400, h: 118, requiredForm: "small", clearance: 103 }
        ],
        waxSeals: [
          { id: "dg-wax-a", x: 1140, y: 454, w: 54, h: 166, requiredForm: "giant", activation: "downstrike", hp: 1 },
          { id: "dg-wax-b", x: 2260, y: 446, w: 58, h: 174, requiredForm: "giant", activation: "downstrike", hp: 1 },
          { id: "dg-wax-c", x: 3400, y: 438, w: 60, h: 182, requiredForm: "giant", activation: "downstrike", hp: 1 },
          { id: "dg-wax-d", x: 4440, y: 448, w: 56, h: 172, requiredForm: "giant", activation: "downstrike", hp: 1 }
        ],
        transitionFreeze: 0.2,
        safeMargin: 18
      },
      boss: null
    },

    {
      id: 26,
      key: "cometline-switchyard",
      act: 7,
      kind: "stage",
      name: "彗线换轨站",
      nameEn: "COMETLINE SWITCHYARD",
      subtitle: "离开轨道，才能选对下一条路",
      briefing: {
        kicker: "STAGE 26 · RAIL",
        title: "彗线换轨站",
        subtitle: "离开轨道，才能选对下一条路",
        mechanic: "跳上轨车沿彗线滑行；左右选择岔道，跳跃脱轨，冲刺加速并撕开轨上星丝。",
        hint: "岔口会提前亮起方向旗。依次停靠三座星站后，终点车库才会开启。"
      },
      theme: {
        id: "cometline-switchyard",
        palette: {
          skyTop: "#081B34",
          skyBottom: "#715777",
          ink: "#040B18",
          paper: "#F4E7D0",
          ground: "#394459",
          groundDark: "#171D30",
          platform: "#9B7656",
          accent: "#F4C057",
          accent2: "#50D7CF",
          danger: "#EB5263",
          fog: "#5D5871"
        },
        material: "quilled-comet-foil",
        ambient: { type: "rail-sparks-and-tickets", count: 56, speed: 1.08 },
        landmark: { type: "comet-sorting-wheel", x: 3230, y: 42, scale: 1.86, accent: "#F4C057" }
      },
      worldWidth: 5200,
      worldHeight: WORLD_HEIGHT,
      killY: 850,
      camera: { mode: "follow", deadZoneX: 0.32, lookAhead: 185 },
      spawn: { x: 96, y: 536, facing: 1 },
      goal: {
        type: "rail-depot",
        x: 5000,
        y: 445,
        w: 112,
        h: 175,
        requires: { type: "rail-stations", count: 3, label: "彗线星站" }
      },
      platforms: [
        platform("cr-ground-start", 0, 620, 760, 100, { material: "switchyard-stone" }),
        platform("cr-launch-deck", 430, 485, 210, 24, { kind: "one-way", material: "rail-brass" }),
        platform("cr-station-west", 1180, 620, 650, 100, { material: "switchyard-stone" }),
        platform("cr-station-west-high", 1410, 390, 230, 26, { kind: "one-way", material: "station-foil" }),
        platform("cr-station-crown", 2240, 620, 700, 100, { material: "switchyard-stone" }),
        platform("cr-station-crown-high", 2530, 325, 240, 26, { kind: "one-way", material: "station-foil" }),
        platform("cr-station-east", 3360, 620, 720, 100, { material: "switchyard-stone" }),
        platform("cr-station-east-high", 3690, 405, 230, 26, { kind: "one-way", material: "station-foil" }),
        platform("cr-depot-ground", 4500, 620, 700, 100, { material: "switchyard-stone" }),
        platform("cr-depot-step", 4770, 490, 190, 24, { kind: "one-way", material: "rail-brass" })
      ],
      hazards: [
        hazard("cr-void-01", "star-void", 760, 665, 420, 55, { damage: 99 }),
        hazard("cr-rail-saw-01", "saw-gear", 1710, 548, 76, 72, { radius: 36, angularSpeed: 3.1 }),
        hazard("cr-void-02", "star-void", 1830, 665, 410, 55, { damage: 99 }),
        hazard("cr-star-01", "falling-star", 2690, 110, 46, 46, { interval: 2.2, telegraph: 0.76, phase: 0.4 }),
        hazard("cr-void-03", "star-void", 2940, 665, 420, 55, { damage: 99 }),
        hazard("cr-rail-saw-02", "saw-gear", 3930, 548, 78, 72, { radius: 37, angularSpeed: -3.4 }),
        hazard("cr-void-04", "star-void", 4080, 665, 420, 55, { damage: 99 }),
        hazard("cr-star-02", "falling-star", 4620, 120, 48, 48, { interval: 1.9, telegraph: 0.68, phase: 1.1 })
      ],
      enemies: [
        enemy("cr-wisp-01", "rail-wisp", 930, 350, 800, 1120, { hp: 2, yBob: 52, speed: 98 }),
        enemy("cr-spinner-01", "thread-spinner", 1270, 566, 1210, 1740, { hp: 3, speed: 70 }),
        enemy("cr-wisp-02", "rail-wisp", 2050, 285, 1870, 2260, { hp: 3, yBob: 48, speed: 108 }),
        enemy("cr-drummer-01", "thunder-drummer", 2360, 566, 2280, 2860, { hp: 4, speed: 64 }),
        enemy("cr-wisp-03", "rail-wisp", 3180, 260, 2990, 3370, { hp: 3, yBob: 56, speed: 116 }),
        enemy("cr-wasp-01", "propeller-wasp", 3740, 330, 3440, 4020, { hp: 3, yBob: 46, speed: 106 }),
        enemy("cr-spinner-02", "thread-spinner", 4590, 566, 4530, 4880, { hp: 4, speed: 78 })
      ],
      collectibles: [
        collectible("cr-seed-01", "memory-seed", 340, 445),
        collectible("cr-seed-02", "memory-seed", 1020, 310),
        collectible("cr-heart-01", "heart", 1510, 335),
        collectible("cr-seed-03", "memory-seed", 2110, 260),
        collectible("cr-star", "star-charge", 2670, 270, { charges: 2 }),
        collectible("cr-seed-04", "memory-seed", 3220, 260),
        collectible("cr-heart-02", "heart", 3800, 350),
        collectible("cr-seed-05", "memory-seed", 4740, 425)
      ],
      checkpoints: [
        checkpoint("cr-check-01", 1210, 528, 1230, 536),
        checkpoint("cr-check-02", 2280, 528, 2300, 536),
        checkpoint("cr-check-03", 3400, 528, 3420, 536),
        checkpoint("cr-check-04", 4540, 528, 4560, 536)
      ],
      mechanics: {
        type: "comet-rails",
        attachRadius: 54,
        rideSpeed: 360,
        dashSpeed: 560,
        detachVelocityY: -510,
        junctionLeadTime: 0.8,
        rescueSnapDistance: 92,
        rails: [
          {
            id: "cr-rail-start",
            points: [{ x: 570, y: 485 }, { x: 900, y: 390 }, { x: 1260, y: 440 }, { x: 1540, y: 390 }],
            next: ["cr-rail-high", "cr-rail-low"]
          },
          {
            id: "cr-rail-high",
            points: [{ x: 1540, y: 390 }, { x: 1900, y: 245 }, { x: 2320, y: 330 }, { x: 2660, y: 325 }],
            next: ["cr-rail-crown"]
          },
          {
            id: "cr-rail-low",
            points: [{ x: 1540, y: 390 }, { x: 1910, y: 515 }, { x: 2260, y: 455 }, { x: 2660, y: 325 }],
            next: ["cr-rail-crown"]
          },
          {
            id: "cr-rail-crown",
            points: [{ x: 2660, y: 325 }, { x: 3020, y: 220 }, { x: 3420, y: 360 }, { x: 3780, y: 405 }],
            next: ["cr-rail-east", "cr-rail-loop"]
          },
          {
            id: "cr-rail-loop",
            points: [{ x: 3780, y: 405 }, { x: 3520, y: 515 }, { x: 3180, y: 470 }, { x: 3420, y: 360 }],
            next: ["cr-rail-east"]
          },
          {
            id: "cr-rail-east",
            points: [{ x: 3780, y: 405 }, { x: 4140, y: 275 }, { x: 4540, y: 390 }, { x: 4880, y: 490 }],
            next: []
          }
        ],
        carts: [
          { id: "cr-cart-a", rail: "cr-rail-start", progress: 0.05, direction: 1, speed: 330, w: 122, h: 28 },
          { id: "cr-cart-b", rail: "cr-rail-high", progress: 0.25, direction: 1, speed: 350, w: 118, h: 28 },
          { id: "cr-cart-c", rail: "cr-rail-low", progress: 0.65, direction: -1, speed: 340, w: 118, h: 28 },
          { id: "cr-cart-d", rail: "cr-rail-crown", progress: 0.35, direction: 1, speed: 370, w: 124, h: 28 },
          { id: "cr-cart-e", rail: "cr-rail-east", progress: 0.15, direction: 1, speed: 390, w: 124, h: 28 }
        ],
        junctions: [
          {
            id: "cr-junction-a",
            x: 1490,
            y: 330,
            w: 100,
            h: 130,
            incoming: "cr-rail-start",
            options: [
              { input: "up", rail: "cr-rail-high" },
              { input: "down", rail: "cr-rail-low" }
            ]
          },
          {
            id: "cr-junction-b",
            x: 3730,
            y: 345,
            w: 110,
            h: 130,
            incoming: "cr-rail-crown",
            options: [
              { input: "forward", rail: "cr-rail-east" },
              { input: "down", rail: "cr-rail-loop" }
            ]
          }
        ],
        stations: [
          { id: "cr-station-west", label: "西弦站", x: 1410, y: 352, w: 230, h: 96, rail: "cr-rail-start", required: true },
          { id: "cr-station-crown", label: "天冠站", x: 2530, y: 287, w: 240, h: 96, rail: "cr-rail-crown", required: true },
          { id: "cr-station-east", label: "东辉站", x: 3690, y: 367, w: 230, h: 96, rail: "cr-rail-east", required: true }
        ]
      },
      boss: null
    },

    {
      id: 27,
      key: "hidden-lantern-silhouette-city",
      act: 7,
      kind: "stage",
      name: "藏灯剪影城",
      nameEn: "HIDDEN-LANTERN SILHOUETTE CITY",
      subtitle: "不要熄灭光，借影子穿过它",
      briefing: {
        kicker: "STAGE 27 · SHADOW",
        title: "藏灯剪影城",
        subtitle: "不要熄灭光，借影子穿过它",
        mechanic: "巡灯光锥会累积暴露；躲在纸屏投下的阴影里，用脉冲移动屏风，找回三枚影钥。",
        hint: "从中央灯门向两侧探索，影钥集齐后必须回到中央。青色地纹标出不会被巡灯照到的安全区。"
      },
      theme: {
        id: "hidden-lantern-silhouette-city",
        palette: {
          skyTop: "#071126",
          skyBottom: "#443657",
          ink: "#020711",
          paper: "#EFE1C8",
          ground: "#303747",
          groundDark: "#111625",
          platform: "#6F6875",
          accent: "#F0B958",
          accent2: "#55D9D0",
          danger: "#E54A5F",
          fog: "#4D455D"
        },
        material: "vellum-and-black-lacquer",
        ambient: { type: "moving-cutout-shadows", count: 44, speed: 0.34 },
        landmark: { type: "rotating-lantern-tower", x: 2520, y: 34, scale: 1.92, accent: "#F0B958" }
      },
      worldWidth: 5000,
      worldHeight: WORLD_HEIGHT,
      killY: 820,
      camera: { mode: "follow", deadZoneX: 0.36, lookAhead: 135 },
      spawn: { x: 2460, y: 536, facing: -1 },
      goal: {
        type: "lantern-gate",
        x: 2420,
        y: 438,
        w: 150,
        h: 182,
        requires: { type: "collect", itemType: "shadow-key", count: 3, label: "影钥", submit: true }
      },
      platforms: [
        platform("ls-ground-west", 0, 620, 1080, 100, { material: "lantern-city-stone" }),
        platform("ls-west-awning", 330, 430, 230, 24, { kind: "one-way", material: "lacquer-awning" }),
        platform("ls-west-roof", 720, 345, 210, 24, { kind: "one-way", material: "vellum-roof" }),
        platform("ls-ground-mid-west", 1180, 620, 1120, 100, { material: "lantern-city-stone" }),
        platform("ls-mid-west-awning", 1420, 455, 220, 24, { kind: "one-way", material: "lacquer-awning" }),
        platform("ls-central-ground", 2300, 620, 400, 100, { material: "lantern-sanctuary" }),
        platform("ls-central-step-west", 2300, 500, 130, 22, { kind: "one-way", material: "lantern-brass" }),
        platform("ls-central-step-east", 2570, 500, 130, 22, { kind: "one-way", material: "lantern-brass" }),
        platform("ls-central-balcony", 2390, 355, 220, 24, { kind: "one-way", material: "lantern-brass" }),
        platform("ls-ground-mid-east", 2700, 620, 1120, 100, { material: "lantern-city-stone" }),
        platform("ls-mid-east-awning", 3280, 440, 220, 24, { kind: "one-way", material: "lacquer-awning" }),
        platform("ls-ground-east", 3920, 620, 1080, 100, { material: "lantern-city-stone" }),
        platform("ls-east-roof", 4090, 350, 210, 24, { kind: "one-way", material: "vellum-roof" }),
        platform("ls-east-awning", 4510, 435, 230, 24, { kind: "one-way", material: "lacquer-awning" })
      ],
      hazards: [
        hazard("ls-thorn-west", "crystal-spike", 980, 588, 92, 32),
        hazard("ls-gap-west", "star-void", 1080, 665, 100, 55, { damage: 99 }),
        hazard("ls-rift-west", "void-rift", 1740, 586, 120, 34),
        hazard("ls-rift-east", "void-rift", 3140, 586, 120, 34),
        hazard("ls-gap-east", "star-void", 3820, 665, 100, 55, { damage: 99 }),
        hazard("ls-thorn-east", "crystal-spike", 3940, 588, 92, 32)
      ],
      enemies: [
        enemy("ls-heron-west", "lantern-heron", 520, 300, 260, 910, { hp: 3, yBob: 42, speed: 84 }),
        enemy("ls-mimic-west", "mirror-mimic", 1300, 566, 1210, 1690, { hp: 4, speed: 76 }),
        enemy("ls-heron-crown", "lantern-heron", 2440, 275, 2240, 2740, { hp: 3, yBob: 50, speed: 92 }),
        enemy("ls-siphon-east", "star-siphon", 3370, 300, 3100, 3720, { hp: 3, yBob: 52, speed: 102 }),
        enemy("ls-heron-east", "lantern-heron", 4480, 300, 4070, 4800, { hp: 4, yBob: 46, speed: 98 })
      ],
      collectibles: [
        collectible("ls-seed-west", "memory-seed", 260, 445),
        collectible("ls-key-west", "shadow-key", 480, 375, { quest: true, order: 1, label: "影钥", badge: "影" }),
        collectible("ls-heart-west", "heart", 1460, 400),
        collectible("ls-key-crown", "shadow-key", 2495, 295, { quest: true, order: 2, label: "影钥", badge: "影" }),
        collectible("ls-star", "star-charge", 3350, 380, { charges: 2 }),
        collectible("ls-key-east", "shadow-key", 4580, 380, { quest: true, order: 3, label: "影钥", badge: "影" }),
        collectible("ls-seed-east", "memory-seed", 4780, 445)
      ],
      checkpoints: [
        checkpoint("ls-check-center", 2360, 528, 2440, 536, { activation: "proximity", radius: 180 }),
        checkpoint("ls-check-west", 1180, 528, 1200, 536, { activation: "proximity", radius: 150 }),
        checkpoint("ls-check-east", 3800, 528, 3780, 536, { activation: "proximity", radius: 150 })
      ],
      mechanics: {
        type: "lantern-shadow",
        collisionWorld: "single",
        centralGate: { id: "ls-central-gate", x: 2420, y: 438, w: 150, h: 182 },
        exposure: {
          grace: 1.2,
          damageInterval: 1.1,
          damage: 1,
          decayPerSecond: 1.8,
          safeEdgeColor: "#55D9D0"
        },
        searchlights: [
          { id: "ls-light-west", x: 760, y: 110, w: 90, h: 90, pivotX: 805, pivotY: 155, radius: 720, angleMin: 0.35, angleMax: 2.55, sweepPeriod: 7.4, phase: 0.15, warning: 0.75 },
          { id: "ls-light-mid-west", x: 1650, y: 95, w: 88, h: 88, pivotX: 1694, pivotY: 139, radius: 690, angleMin: 0.5, angleMax: 2.65, sweepPeriod: 6.7, phase: 0.62, warning: 0.72 },
          { id: "ls-light-crown", x: 2455, y: 75, w: 96, h: 96, pivotX: 2503, pivotY: 123, radius: 760, angleMin: 0.25, angleMax: 2.85, sweepPeriod: 8.2, phase: 0.35, warning: 0.8 },
          { id: "ls-light-mid-east", x: 3290, y: 95, w: 88, h: 88, pivotX: 3334, pivotY: 139, radius: 690, angleMin: 0.5, angleMax: 2.65, sweepPeriod: 6.5, phase: 0.08, warning: 0.7 },
          { id: "ls-light-east", x: 4170, y: 110, w: 90, h: 90, pivotX: 4215, pivotY: 155, radius: 720, angleMin: 0.35, angleMax: 2.55, sweepPeriod: 7.1, phase: 0.78, warning: 0.74 }
        ],
        screens: [
          { id: "ls-screen-a", x: 890, y: 350, w: 84, h: 270, axis: "x", min: 820, max: 1080, step: 130, activation: "pulse", occludes: true },
          { id: "ls-screen-b", x: 1870, y: 330, w: 92, h: 290, axis: "x", min: 1740, max: 2070, step: 165, activation: "pulse", occludes: true },
          { id: "ls-screen-c", x: 2790, y: 330, w: 92, h: 290, axis: "x", min: 2730, max: 3060, step: 165, activation: "pulse", occludes: true },
          { id: "ls-screen-d", x: 4030, y: 350, w: 84, h: 270, axis: "x", min: 3920, max: 4180, step: 130, activation: "pulse", occludes: true }
        ],
        shadowKeys: ["ls-key-west", "ls-key-crown", "ls-key-east"]
      },
      boss: null
    },

    {
      id: 28,
      key: "grand-cadence-theater",
      act: 7,
      kind: "boss",
      finale: true,
      name: "万籁终演场",
      nameEn: "GRAND CADENCE THEATER",
      subtitle: "把夺回的星片奏成最后一击",
      briefing: {
        kicker: "BOSS 07 · SCOREWING",
        title: "谱翼指挥蛾",
        subtitle: "把夺回的星片奏成最后一击",
        mechanic: "用脉冲捕获飞来的星片并储存在芽芯中；蓄满后冲刺，把星片齐射回谱翼指挥蛾。",
        hint: "三个阶段分别要储存一、二、三枚星片。未蓄满时冲刺只用于闪避，不会浪费已经捕获的星片。"
      },
      theme: {
        id: "grand-cadence-theater",
        palette: {
          skyTop: "#090F26",
          skyBottom: "#6A3F61",
          ink: "#030711",
          paper: "#F5E6CD",
          ground: "#3B354B",
          groundDark: "#171326",
          platform: "#8C6873",
          accent: "#F3BE55",
          accent2: "#58DAD0",
          danger: "#EC4661",
          fog: "#55425F"
        },
        material: "embossed-score-paper-and-foil",
        ambient: { type: "floating-score-shards", count: 64, speed: 0.76 },
        landmark: { type: "metronome-moon-stage", x: 2320, y: 28, scale: 1.96, accent: "#F3BE55" }
      },
      worldWidth: 4000,
      worldHeight: WORLD_HEIGHT,
      killY: 820,
      camera: { mode: "boss-lock", deadZoneX: 0.42, lookAhead: 90 },
      spawn: { x: 92, y: 536, facing: 1 },
      goal: { type: "world-core", x: 3740, y: 425, w: 126, h: 195, requires: "boss-defeated" },
      platforms: [
        platform("ma-ground-entry", 0, 620, 760, 100, { material: "theater-stone" }),
        platform("ma-entry-step", 320, 480, 190, 24, { kind: "one-way", material: "score-brass" }),
        platform("ma-entry-bridge", 760, 555, 300, 65, { material: "score-spine" }),
        platform("ma-arena-floor", 1060, 620, 2340, 100, { material: "theater-stage" }),
        platform("ma-perch-left", 1290, 405, 190, 24, { kind: "one-way", material: "score-brass" }),
        platform("ma-perch-mid-left", 1710, 330, 180, 24, { kind: "one-way", material: "score-brass" }),
        platform("ma-center-dais", 2130, 490, 240, 28, { kind: "one-way", material: "conductor-foil" }),
        platform("ma-perch-mid-right", 2610, 330, 180, 24, { kind: "one-way", material: "score-brass" }),
        platform("ma-perch-right", 3020, 405, 190, 24, { kind: "one-way", material: "score-brass" }),
        platform("ma-ground-exit", 3400, 620, 600, 100, { material: "theater-stone" }),
        platform("ma-core-step", 3640, 490, 190, 24, { kind: "one-way", material: "score-brass" })
      ],
      hazards: [
        hazard("ma-void-entry", "star-void", 760, 665, 300, 55, { damage: 99 }),
        hazard("ma-rift-left", "void-rift", 1370, 586, 120, 34),
        hazard("ma-rift-mid-left", "void-rift", 1840, 586, 120, 34),
        hazard("ma-rift-mid-right", "void-rift", 2540, 586, 120, 34),
        hazard("ma-rift-right", "void-rift", 3010, 586, 120, 34),
        hazard("ma-star-01", "falling-star", 1570, 100, 46, 46, { interval: 2.3, telegraph: 0.8, phase: 0.25 }),
        hazard("ma-star-02", "falling-star", 2860, 90, 48, 48, { interval: 2.0, telegraph: 0.72, phase: 1.0 })
      ],
      enemies: [
        enemy("ma-wisp-01", "rail-wisp", 1480, 300, 1250, 1780, { hp: 3, yBob: 50, speed: 104, spawnOnBossPhase: 2 }),
        enemy("ma-heron-01", "lantern-heron", 2870, 285, 2600, 3200, { hp: 4, yBob: 48, speed: 96, spawnOnBossPhase: 3 })
      ],
      collectibles: [
        collectible("ma-seed-01", "memory-seed", 360, 425),
        collectible("ma-heart-entry", "heart", 910, 505),
        collectible("ma-star-charge", "star-charge", 2220, 430, { charges: 2 }),
        collectible("ma-heart-phase-03", "heart", 3060, 350, { spawnOnBossPhase: 3 }),
        collectible("ma-core", "scorewing-core", 3800, 455, { quest: true, spawnOnBossDefeat: true })
      ],
      checkpoints: [checkpoint("ma-check-01", 980, 478, 1000, 536)],
      mechanics: {
        type: "scorewing-maestro",
        arenaTrigger: { x: 1060, lockLeft: 1060, lockRight: 3400 },
        shardRules: {
          captureBy: "pulse",
          storeBy: "automatic",
          releaseBy: "dash",
          releaseMode: "stored-volley",
          requiredByPhase: [1, 2, 3],
          storeLimitByPhase: [1, 2, 3],
          captureRadius: 54,
          captureWindow: 0.72,
          shardLifetime: 5.5,
          volleySpeed: 920,
          volleyWindow: 2.8,
          keepStoredOnEarlyDash: true,
          resetOnVolleyHit: true
        },
        emitters: [
          { id: "ma-emitter-left", x: 1280, y: 190, direction: 1, interval: 2.4, phase: 0.15 },
          { id: "ma-emitter-crown", x: 2190, y: 125, direction: 0, interval: 2.15, phase: 0.65 },
          { id: "ma-emitter-right", x: 3160, y: 190, direction: -1, interval: 2.3, phase: 1.1 }
        ],
        volleyLanes: [
          { id: "ma-lane-low", y: 525, h: 58 },
          { id: "ma-lane-mid", y: 385, h: 58 },
          { id: "ma-lane-high", y: 245, h: 58 }
        ]
      },
      boss: {
        id: "scorewing-maestro",
        archetype: "scorewing-maestro",
        name: "谱翼指挥蛾 · 未写终曲",
        hp: 3,
        maxHealth: 3,
        arena: { x: 1060, y: 100, w: 2340, h: 520 },
        spawn: { x: 2230, y: 210 },
        body: { w: 220, h: 186 },
        weakPoint: {
          type: "cadence-heart",
          vulnerableState: "stored-volley-impact",
          damagePerHit: 1,
          maxHitsPerVolley: 1,
          exposedTime: 1.2
        },
        phases: [
          { atHealth: 3, name: "启拍", captureRequired: 1, shardSpeed: 250, shardInterval: 2.4, attackCooldown: 2.2 },
          { atHealth: 2, name: "复调", captureRequired: 2, shardSpeed: 305, shardInterval: 1.9, attackCooldown: 1.75 },
          { atHealth: 1, name: "终曲", captureRequired: 3, shardSpeed: 360, shardInterval: 1.45, attackCooldown: 1.3 }
        ],
        mechanism: {
          shielded: true,
          exposeBy: "captured-shard-dash-volley",
          counterBy: "capture-store-dash-volley",
          captureAction: "pulse",
          releaseAction: "dash",
          requiredByPhase: [1, 2, 3],
          directVolleyDamage: 1,
          resetStoredShardsOnHit: true,
          defeatEffect: "write-final-cadence"
        }
      }
    }
  ];

  function normaliseId(id) {
    if (typeof id === "string" && /^\d+$/.test(id)) {
      return Number(id);
    }
    return id;
  }

  function get(id) {
    var target = normaliseId(id);
    for (var i = 0; i < levels.length; i += 1) {
      if (levels[i].id === target || levels[i].key === target) {
        return levels[i];
      }
    }
    return null;
  }

  function clone(id) {
    var source = get(id);
    return source ? JSON.parse(JSON.stringify(source)) : null;
  }

  window.StarSproutLevels = {
    version: 7,
    schema: {
      coordinateSystem: "1280x720 logical canvas; x grows right, y grows down",
      level: [
        "id",
        "key",
        "act",
        "kind",
        "name",
        "nameEn",
        "subtitle",
        "briefing",
        "theme",
        "worldWidth",
        "worldHeight",
        "killY",
        "camera",
        "spawn",
        "goal",
        "platforms",
        "hazards",
        "enemies",
        "collectibles",
        "checkpoints",
        "mechanics",
        "boss"
      ],
      entityRect: "x, y, w, h use world pixels; platform y is its top edge",
      goalRequirement: "requires may be a legacy string or an object with type collect, repair-zones, reflect-reactor, echo-pairs, fold-pattern, kite-chain, return-seed, balanced-bridges, woven-routes, or rail-stations; object fields may include itemType, count, label, and type-specific metadata",
      act3Mechanics: ["spring/bounceY", "polarity/sun-moon", "timed relay", "rift-weaver"],
      act4Mechanics: ["gravity zones/orbit", "local time freeze", "delayed echo pairing", "moving gravity anchors"],
      act5Mechanics: ["world fold topology", "kite tether traversal", "reverse page escape", "downstrike fold trap"],
      act6Mechanics: ["continuous weight balance", "foreground/background lane switching", "recorded trajectory bridges", "moving dragon body platform"],
      act7Mechanics: ["player scale lenses", "branching comet rail carts", "single-world lantern exposure and occlusion", "captured shard dash volley"],
      bossLevels: levels.filter(function (level) { return level.kind === "boss" || level.boss; }).map(function (level) { return level.id; })
    },
    levels: levels,
    list: levels,
    get: get,
    clone: clone
  };
})();
