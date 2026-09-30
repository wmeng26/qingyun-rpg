// 全局数值与手感参数（调参总入口）
export default {
  saveVersion: 1,

  // 地图移动：每格步进耗时
  stepMs: 150,

  // 暗雷遇敌
  encounter: { baseChance: 0.08, pitySteps: 25 },

  // 会心
  crit: { chance: 0.08, mult: 1.5 },

  // 命中：clamp(0.9 + (攻方spd - 守方spd)*0.005, 0.7, 1.0)
  hit: { base: 0.9, spdFactor: 0.005, min: 0.7, max: 1.0 },

  // 逃跑：clamp(0.5 + spd差*0.02, 0.2, 0.95)
  flee: { base: 0.5, spdFactor: 0.02, min: 0.2, max: 0.95 },

  damage: {
    variance: 0.1,        // ±10% 随机浮动
    min: 1,               // 保底伤害
    softCapMaxHpMult: 3,  // 软上限：单次伤害 ≤ 目标 maxHp × 3
    defendMult: 0.5,      // 防御指令减伤
  },

  // 经验：expToNext(n) = floor(base * n^pow)
  exp: {
    base: 10, pow: 1.55, cap: 60,
    overStep: 0.1,   // 越级修正 ±10%/级
    overMin: 0.6, overMax: 1.5,  // 下限 0.6：压住筑基前（Lv10→16）的练级墙
  },

  // 五行/属性克制（攻方元素 -> 守方元素 倍率）
  elementChart: {
    fire:    { ice: 1.25, water: 0.75 },
    water:   { fire: 1.25 },
    ice:     { water: 1.25, fire: 0.75 },
    thunder: { water: 1.25 },
    dark:    { holy: 1.25 },
    holy:    { dark: 1.25 },
  },

  // 新游戏初始状态
  start: {
    mapId: 'map_shanxia',
    pos: { x: 10, y: 19 },
    dir: 'up',
    gold: 80,
    items: [
      { id: 'pill_huixue', count: 3 },
      { id: 'pill_lingli', count: 2 },
    ],
  },

  // 全灭后复活地点
  respawn: { mapId: 'map_qingyunmen', x: 12, y: 17, hpPct: 0.5 },
};
