// 技能与状态效果同表（kind: 'active' 技能 / 'status' 状态）
// target: one_enemy / one_ally / all_enemies / all_allies / self
// phys: true 走 atk-def，否则走 matk-mdef 并吃五行克制
export default {
  // ============ 基础 ============
  skill_attack: {
    id: 'skill_attack', name: '攻击', kind: 'active', mpCost: 0,
    target: 'one_enemy', phys: true, power: 1.0, accuracy: 1.0,
    desc: '基础的挥击。',
  },

  // ============ 萧逸（主角·剑修） ============
  skill_jianqi: {
    id: 'skill_jianqi', owner: 'hero', name: '剑气斩', kind: 'active', mpCost: 4,
    target: 'one_enemy', phys: true, power: 1.35, accuracy: 0.95,
    learnRealm: 'lianqi_1',
    desc: '凝聚剑气斩出一道锋芒。',
  },
  skill_huichun: {
    id: 'skill_huichun', owner: 'hero', name: '回春术', kind: 'active', mpCost: 7,
    target: 'one_ally', heal: true, power: 1.1, accuracy: 1.0,
    learnRealm: 'lianqi_4',
    desc: '木灵之力温养伤处，恢复少量气血。',
  },
  skill_liehuo: {
    id: 'skill_liehuo', owner: 'hero', name: '烈火剑气', kind: 'active', mpCost: 12,
    target: 'one_enemy', power: 1.6, accuracy: 0.95, element: 'fire',
    addStatus: { id: 'burn', chance: 0.35 },
    learnRealm: 'lianqi_3',
    desc: '附火灵之气的斩击，可能造成灼烧。',
  },
  skill_yufeng: {
    id: 'skill_yufeng', owner: 'hero', name: '御风步', kind: 'active', mpCost: 8,
    target: 'self', buff: { id: 'spd_up', chance: 1.0 },
    learnRealm: 'lianqi_5',
    desc: '身法如风，3回合内速度大幅提升。',
  },
  skill_bingxin: {
    id: 'skill_bingxin', owner: 'hero', name: '冰心诀', kind: 'active', mpCost: 14,
    target: 'one_enemy', power: 1.5, accuracy: 0.95, element: 'ice',
    addStatus: { id: 'stun', chance: 0.25 },
    learnRealm: 'lianqi_7',
    desc: '寒气侵体，可能冻结敌人行动。',
  },
  skill_jinzhong: {
    id: 'skill_jinzhong', owner: 'hero', name: '金钟罩', kind: 'active', mpCost: 10,
    target: 'self', buff: { id: 'def_up', chance: 1.0 },
    learnRealm: 'zhuji',
    desc: '罡气护体，3回合内防御大幅提升。',
  },
  skill_leiting: {
    id: 'skill_leiting', owner: 'hero', name: '雷霆万钧', kind: 'active', mpCost: 20,
    target: 'one_enemy', power: 2.2, accuracy: 0.9, element: 'thunder',
    learnRealm: 'zhuji',
    desc: '引九天雷霆轰落，威力惊人。',
  },
  skill_tiangang: {
    id: 'skill_tiangang', owner: 'hero', name: '天罡剑阵', kind: 'active', mpCost: 26,
    target: 'all_enemies', phys: true, power: 1.5, accuracy: 0.9,
    learnRealm: 'zhuji',
    desc: '剑气成阵，横扫所有敌人。',
  },
  skill_wanjian: {
    id: 'skill_wanjian', owner: 'hero', name: '万剑诀', kind: 'active', mpCost: 38,
    target: 'all_enemies', power: 1.7, accuracy: 0.9,
    learnRealm: 'jindan',
    desc: '化气为剑，万剑齐发，席卷全场敌人。',
  },
  skill_jianxin: {
    id: 'skill_jianxin', owner: 'hero', name: '剑心通明', kind: 'active', mpCost: 16,
    target: 'self', buff: { id: 'atk_up', chance: 1.0 },
    learnRealm: 'jindan',
    desc: '剑心澄澈如镜，3回合内攻杀之力大增。',
  },
  skill_guizong: {
    id: 'skill_guizong', owner: 'hero', name: '万剑归宗', kind: 'active', mpCost: 52,
    target: 'all_enemies', power: 2.1, accuracy: 0.95,
    learnRealm: 'yuanying',
    desc: '元婴御剑，万剑朝宗，荡涤全场。',
  },
  skill_tianmen: {
    id: 'skill_tianmen', owner: 'hero', name: '剑开天门', kind: 'active', mpCost: 60,
    target: 'one_enemy', phys: true, power: 3.0, accuracy: 0.95,
    learnRealm: 'huashen',
    desc: '一剑既出，天门为开。',
  },

  // ============ 柳如烟（医修·符咒） ============
  skill_jishi: {
    id: 'skill_jishi', owner: 'liu', name: '济世术', kind: 'active', mpCost: 8,
    target: 'one_ally', heal: true, power: 1.5, accuracy: 1.0,
    learnRealm: 'lianqi_1',
    desc: '精纯的医术，恢复较多气血。',
  },
  skill_liuxu: {
    id: 'skill_liuxu', owner: 'liu', name: '柳絮冰绡', kind: 'active', mpCost: 9,
    target: 'one_enemy', power: 1.4, accuracy: 0.95, element: 'ice',
    learnRealm: 'lianqi_1',
    desc: '冰绡如絮，割肤刺骨。',
  },
  skill_qingxin: {
    id: 'skill_qingxin', owner: 'liu', name: '清心咒', kind: 'active', mpCost: 6,
    target: 'one_ally', cure: true, accuracy: 1.0,
    learnRealm: 'lianqi_3',
    desc: '清除同伴身上的异常状态。',
  },
  skill_fuling: {
    id: 'skill_fuling', owner: 'liu', name: '缚灵符', kind: 'active', mpCost: 11,
    target: 'one_enemy', power: 1.0, accuracy: 0.9, element: 'holy',
    addStatus: { id: 'stun', chance: 0.5 },
    learnRealm: 'lianqi_6',
    desc: '镇邪灵符，可能定住邪祟身形。',
  },
  skill_yuchen: {
    id: 'skill_yuchen', owner: 'liu', name: '玉露回春阵', kind: 'active', mpCost: 18,
    target: 'all_allies', heal: true, power: 1.0, accuracy: 1.0,
    learnRealm: 'zhuji',
    desc: '玉露化阵，润泽全队。',
  },
  skill_puti: {
    id: 'skill_puti', owner: 'liu', name: '菩提甘露', kind: 'active', mpCost: 30,
    target: 'one_ally', heal: true, power: 2.4, accuracy: 1.0,
    learnRealm: 'jindan',
    desc: '以金丹灵力凝成甘露，恢复大量气血。',
  },
  skill_ganlin: {
    id: 'skill_ganlin', owner: 'liu', name: '九天甘露', kind: 'active', mpCost: 44,
    target: 'all_allies', heal: true, power: 1.6, accuracy: 1.0,
    learnRealm: 'yuanying',
    desc: '甘露自九天而降，润泽全队。',
  },
  skill_huichun2: {
    id: 'skill_huichun2', owner: 'liu', name: '妙手回春', kind: 'active', mpCost: 60,
    target: 'all_allies', heal: true, power: 2.0, accuracy: 1.0,
    learnRealm: 'huashen',
    desc: '医道化神，回春之力泽被全队。',
  },

  // ============ 洛清霜（刀客·冰） ============
  skill_hansha: {
    id: 'skill_hansha', owner: 'luo', name: '寒沙刀法', kind: 'active', mpCost: 4,
    target: 'one_enemy', power: 1.4, accuracy: 0.95, element: 'ice',
    learnRealm: 'lianqi_1',
    desc: '刀风裹挟寒沙，割面生疼。',
  },
  skill_duanjin: {
    id: 'skill_duanjin', owner: 'luo', name: '截金断玉', kind: 'active', mpCost: 10,
    target: 'one_enemy', phys: true, power: 1.7, accuracy: 0.9,
    learnRealm: 'lianqi_4',
    desc: '全力劈斩，快得能截断金玉。',
  },
  skill_shuangwu: {
    id: 'skill_shuangwu', owner: 'luo', name: '霜刃旋舞', kind: 'active', mpCost: 16,
    target: 'all_enemies', phys: true, power: 1.3, accuracy: 0.9,
    learnRealm: 'lianqi_6',
    desc: '刀光如霜雪回旋，席卷所有敌人。',
  },
  skill_nujiang: {
    id: 'skill_nujiang', owner: 'luo', name: '怒江拔刀', kind: 'active', mpCost: 24,
    target: 'one_enemy', phys: true, power: 2.1, accuracy: 0.9,
    learnRealm: 'zhuji',
    desc: '蓄力一闪，如怒江决堤。',
  },
  skill_bingfeng: {
    id: 'skill_bingfeng', owner: 'luo', name: '冰封千里', kind: 'active', mpCost: 46,
    target: 'all_enemies', power: 1.7, accuracy: 0.95, element: 'ice',
    learnRealm: 'yuanying',
    desc: '刀意化雪，千里冰封。',
  },
  skill_jiuxiaosh: {
    id: 'skill_jiuxiaosh', owner: 'luo', name: '九霄霜华', kind: 'active', mpCost: 58,
    target: 'all_enemies', power: 2.2, accuracy: 0.95, element: 'ice',
    learnRealm: 'huashen',
    desc: '霜华自九霄而落，冻结山河。',
  },

  // ============ 沈孤鸿（琴师·雷/增益） ============
  skill_xianyin: {
    id: 'skill_xianyin', owner: 'shen', name: '弦音斩', kind: 'active', mpCost: 4,
    target: 'one_enemy', power: 1.35, accuracy: 0.95, element: 'thunder',
    learnRealm: 'lianqi_1',
    desc: '拨弦成锋，音波如刃。',
  },
  skill_zhanqu: {
    id: 'skill_zhanqu', owner: 'shen', name: '破阵曲', kind: 'active', mpCost: 14,
    target: 'all_allies', buff: { id: 'atk_up', chance: 1.0 },
    learnRealm: 'lianqi_4',
    desc: '一曲破阵，全队攻杀之力大增（3回合）。',
  },
  skill_leiyin: {
    id: 'skill_leiyin', owner: 'shen', name: '雷音贯耳', kind: 'active', mpCost: 16,
    target: 'all_enemies', power: 1.3, accuracy: 0.9, element: 'thunder',
    learnRealm: 'lianqi_6',
    desc: '琴音化雷，贯耳摄魂。',
  },
  skill_anyun: {
    id: 'skill_anyun', owner: 'shen', name: '暗云压城', kind: 'active', mpCost: 24,
    target: 'one_enemy', power: 2.0, accuracy: 0.9, element: 'thunder',
    learnRealm: 'zhuji',
    desc: '弦音骤沉，如暗云崩城。',
  },
  skill_poxiao: {
    id: 'skill_poxiao', owner: 'shen', name: '破晓惊雷', kind: 'active', mpCost: 38,
    target: 'all_enemies', power: 1.7, accuracy: 0.9, element: 'thunder',
    learnRealm: 'jindan',
    desc: '一弦惊雷破长夜。',
  },
  skill_tianlai: {
    id: 'skill_tianlai', owner: 'shen', name: '天籁涤尘', kind: 'active', mpCost: 40,
    target: 'all_allies', heal: true, power: 1.2, accuracy: 1.0,
    learnRealm: 'yuanying',
    desc: '琴音化泉，涤伤润脉，润泽全队。',
  },
  skill_longyin: {
    id: 'skill_longyin', owner: 'shen', name: '九霄龙吟', kind: 'active', mpCost: 60,
    target: 'all_enemies', power: 2.3, accuracy: 0.95, element: 'thunder',
    learnRealm: 'huashen',
    desc: '琴音化龙，震彻九霄。',
  },

  // ============ 敌人技能 ============
  e_siyao:   { id: 'e_siyao', name: '撕咬', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.15, accuracy: 0.95 },
  e_duwei:   { id: 'e_duwei', name: '毒液喷吐', kind: 'active', mpCost: 0, target: 'one_enemy', power: 1.0, accuracy: 0.9, element: 'poison', addStatus: { id: 'poison', chance: 0.55 } },
  e_kanpai:  { id: 'e_kanpai', name: '劈砍', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.35, accuracy: 0.9 },
  e_huhuo:   { id: 'e_huhuo', name: '狐火', kind: 'active', mpCost: 0, target: 'one_enemy', power: 1.3, accuracy: 0.95, element: 'fire', addStatus: { id: 'burn', chance: 0.25 } },
  e_shizhua: { id: 'e_shizhua', name: '尸爪', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.2, accuracy: 0.95, addStatus: { id: 'poison', chance: 0.3 } },
  e_guihuo:  { id: 'e_guihuo', name: '鬼火缠身', kind: 'active', mpCost: 0, target: 'one_enemy', power: 1.4, accuracy: 0.95, element: 'dark' },
  e_shehun:  { id: 'e_shehun', name: '摄魂术', kind: 'active', mpCost: 0, target: 'one_enemy', power: 0.8, accuracy: 0.85, element: 'dark', addStatus: { id: 'stun', chance: 0.6 } },
  e_youmingzha: { id: 'e_youmingzha', name: '幽冥爪', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.6, accuracy: 0.95, element: 'dark' },
  e_guihuoquan: { id: 'e_guihuoquan', name: '鬼火燎原', kind: 'active', mpCost: 0, target: 'all_enemies', power: 1.15, accuracy: 0.9, element: 'dark' },
  e_weiya:   { id: 'e_weiya', name: '威压', kind: 'active', mpCost: 0, target: 'one_enemy', accuracy: 1.0, addStatus: { id: 'atk_down', chance: 0.7 } },

  // ---- 黑风寨敌技 ----
  e_feibiao: { id: 'e_feibiao', name: '飞镖', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.25, accuracy: 0.95 },
  e_dapi:    { id: 'e_dapi', name: '劈山刀', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.45, accuracy: 0.9 },
  e_yinsha:  { id: 'e_yinsha', name: '阴煞弹', kind: 'active', mpCost: 0, target: 'one_enemy', power: 1.35, accuracy: 0.95, element: 'dark', addStatus: { id: 'poison', chance: 0.3 } },
  e_daofeng: { id: 'e_daofeng', name: '刀风', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.4, accuracy: 0.9 },
  e_fengsha: { id: 'e_fengsha', name: '风煞斩', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.7, accuracy: 0.95, element: 'dark' },
  e_fengjuan:{ id: 'e_fengjuan', name: '风卷残云', kind: 'active', mpCost: 0, target: 'all_enemies', phys: true, power: 1.2, accuracy: 0.9 },

  // ---- 血煞教敌技 ----
  e_xueren:  { id: 'e_xueren', name: '血刃', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.4, accuracy: 0.95, element: 'dark' },
  e_shazhua: { id: 'e_shazhua', name: '煞爪', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.5, accuracy: 0.9 },
  e_xueji:   { id: 'e_xueji', name: '血祭', kind: 'active', mpCost: 0, target: 'one_enemy', power: 1.45, accuracy: 0.95, element: 'dark', addStatus: { id: 'burn', chance: 0.35 } },
  e_pozhen:  { id: 'e_pozhen', name: '破阵刀', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.6, accuracy: 0.9 },
  e_xuezhou: { id: 'e_xuezhou', name: '血咒', kind: 'active', mpCost: 0, target: 'one_enemy', power: 1.3, accuracy: 0.9, element: 'dark', addStatus: { id: 'poison', chance: 0.5 } },
  e_xuehai:  { id: 'e_xuehai', name: '血海无涯', kind: 'active', mpCost: 0, target: 'all_enemies', power: 1.35, accuracy: 0.9, element: 'dark' },
  e_shaxhan: { id: 'e_shaxhan', name: '血煞斩', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.8, accuracy: 0.95, element: 'dark' },

  // ---- 寒渊魔主敌技 ----
  e_xuezhua: { id: 'e_xuezhua', name: '雪爪', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.5, accuracy: 0.95 },
  e_bingji:  { id: 'e_bingji', name: '冰棘', kind: 'active', mpCost: 0, target: 'one_enemy', power: 1.5, accuracy: 0.95, element: 'ice', addStatus: { id: 'stun', chance: 0.2 } },
  e_yuanyan: { id: 'e_yuanyan', name: '渊焰', kind: 'active', mpCost: 0, target: 'one_enemy', power: 1.55, accuracy: 0.95, element: 'dark' },
  e_mowei:   { id: 'e_mowei', name: '魔威滔天', kind: 'active', mpCost: 0, target: 'all_enemies', power: 1.4, accuracy: 0.9, element: 'dark' },
  e_suiming: { id: 'e_suiming', name: '碎命斩', kind: 'active', mpCost: 0, target: 'one_enemy', phys: true, power: 1.9, accuracy: 0.9 },
  e_xuanbing:{ id: 'e_xuanbing', name: '玄冰刺', kind: 'active', mpCost: 0, target: 'one_enemy', power: 2.0, accuracy: 0.95, element: 'ice' },
  e_moyuan:  { id: 'e_moyuan', name: '魔渊吞世', kind: 'active', mpCost: 0, target: 'all_enemies', power: 1.6, accuracy: 0.9, element: 'dark' },

  // ============ 状态效果 ============
  burn: {
    id: 'burn', name: '灼烧', kind: 'status', isDebuff: true, duration: 3,
    onTurnEnd: { hpPct: -0.06 }, iconColor: '#e0703c',
  },
  poison: {
    id: 'poison', name: '中毒', kind: 'status', isDebuff: true, duration: 4,
    onTurnEnd: { hpPct: -0.05 }, iconColor: '#7ba34a',
  },
  stun: {
    id: 'stun', name: '眩晕', kind: 'status', isDebuff: true, duration: 1,
    canAct: false, iconColor: '#e8d44c',
  },
  atk_up: {
    id: 'atk_up', name: '攻升', kind: 'status', isDebuff: false, duration: 3,
    modifyStat: { atk: 1.3, matk: 1.3 }, iconColor: '#d0704c',
  },
  def_up: {
    id: 'def_up', name: '防升', kind: 'status', isDebuff: false, duration: 3,
    modifyStat: { def: 1.35, mdef: 1.25 }, iconColor: '#c8a84c',
  },
  spd_up: {
    id: 'spd_up', name: '疾风', kind: 'status', isDebuff: false, duration: 3,
    modifyStat: { spd: 1.4 }, iconColor: '#7cc8d0',
  },
  atk_down: {
    id: 'atk_down', name: '威压', kind: 'status', isDebuff: true, duration: 3,
    modifyStat: { atk: 0.72, matk: 0.72 }, iconColor: '#8a6aa0',
  },

  byId(id) { return this[id]; },
};
