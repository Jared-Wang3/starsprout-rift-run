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

  function checkpoint(id, x, y, respawnX, respawnY) {
    return {
      id: id,
      x: x,
      y: y,
      w: 34,
      h: 92,
      respawn: { x: respawnX, y: respawnY }
    };
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
        enemy("lg-enemy-04", "steam-tick", 2460, 566, 2430, 2760, { hp: 2, speed: 58 }),
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
        enemy("sh-enemy-03", "shadow-sprout", 2220, 566, 2190, 2510, { hp: 2, speed: 62 }),
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
        enemy("ta-enemy-04", "cargo-bot", 3170, 566, 3140, 3460, { hp: 3, speed: 68 }),
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
      finale: true,
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
        enemy("rw-minion-02", "shadow-sprout", 1850, 566, 1640, 2050, { hp: 2, speed: 72, spawnOnBossPhase: 2 }),
        enemy("rw-minion-03", "orbit-eye", 2550, 270, 2320, 2820, { hp: 3, yBob: 50, speed: 104, spawnOnBossPhase: 3 }),
        enemy("rw-minion-04", "storm-cannon", 2960, 552, 2960, 2960, { hp: 3, speed: 0, spawnOnBossPhase: 3 })
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
    version: 3,
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
      goalRequirement: "requires may be a legacy string or { type: 'collect', itemType, count, label }",
      act3Mechanics: ["spring/bounceY", "polarity/sun-moon", "timed relay", "rift-weaver"],
      bossLevels: levels.filter(function (level) { return level.kind === "boss" || level.boss; }).map(function (level) { return level.id; })
    },
    levels: levels,
    list: levels,
    get: get,
    clone: clone
  };
})();
