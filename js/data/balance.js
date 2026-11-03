// 全局数值与手感参数（调参总入口）
export default {
  saveVersion: 2, // v2：新增 forge（装备精炼等级），旧 v1 档读入时自动补齐

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

  // 元素连携：同一回合内，我方前后两次元素伤害技能满足相生衔接（上技元素 -> 本技元素）
  // 则本技伤害 ×mult 并触发连携提示。无元素技能/普攻不推进也不打断衔接链。
  combo: {
    mult: 1.3,
    cycle: { fire: 'ice', ice: 'water', water: 'thunder', thunder: 'fire', dark: 'holy', holy: 'dark' },
    names: {
      'fire>ice': '冰火相济', 'ice>water': '寒江化雨', 'water>thunder': '雷泽引电',
      'thunder>fire': '雷火焚天', 'dark>holy': '阴阳轮转', 'holy>dark': '阴阳轮转',
    },
  },

  // 装备精炼：+1 提升 8% 装备加成，上限 +9；升一级的代价 = goldBase*级数² 金 + 材料
  forge: { maxPlus: 9, bonusPerLevel: 0.08, goldBase: 300, goldPow: 2, mat: 'xuan_jing', matEvery: 2 },

  // 心魔试炼：镜像队伍属性系数（低于本体，因镜像无丹药/无治疗）
  demon: { maxHp: 0.8, atk: 0.9, def: 0.85, matk: 0.9, mdef: 0.85, spd: 1.0 },

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
