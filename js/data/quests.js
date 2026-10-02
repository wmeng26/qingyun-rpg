// 任务表：locked/available/active/readyToTurnIn/completed
// objective type: kill 击杀 / talk 交谈 / item 收集 / flag 事件旗标 / realm 境界
// final:true 的目标即「回禀交付」，与给予者对话时结算
export default {
  quest_main_1: {
    id: 'quest_main_1', name: '初入青云', type: 'main', giver: 'npc_zhangmen',
    requires: null, next: 'quest_main_2',
    intro: '山道野狼为祸，替掌门清理山道。',
    objectives: [
      { type: 'kill', target: 'mob_lang', count: 5, text: '击杀野狼' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 150, gold: 200, items: [{ id: 'pill_zhuji', count: 1 }] },
  },

  quest_main_2: {
    id: 'quest_main_2', name: '幽冥异动', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_1', next: 'quest_main_3',
    intro: '邀柳如烟师姐同行，突破筑基后调查幽冥洞。',
    objectives: [
      { type: 'talk', target: 'npc_liu', text: '邀柳如烟师姐同行' },
      { type: 'realm', value: 'zhuji', text: '突破至筑基期' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 400, gold: 300, items: [{ id: 'jade_ling', count: 1 }] },
  },

  quest_main_3: {
    id: 'quest_main_3', name: '洞玄除魔', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_2', next: 'quest_main_4',
    intro: '深入幽冥洞，铲除盘踞百年的幽冥老祖。',
    objectives: [
      { type: 'flag', flag: 'boss_youming_defeated', text: '击败幽冥老祖' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 900, gold: 666, items: [{ id: 'armor_xuantie', count: 1 }], action: 'chapterEnd', chapter: 1 },
  },

  quest_main_4: {
    id: 'quest_main_4', name: '黑风疑云', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_3', next: 'quest_main_5',
    intro: '幽冥老祖虽除，黑风寨的探子仍在山道游弋。搜剿探子，查明来意。',
    objectives: [
      { type: 'kill', target: 'mob_tanzi', count: 3, text: '击杀黑风寨探子' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 700, gold: 400, items: [{ id: 'pill_dahuan', count: 2 }] },
  },

  quest_main_5: {
    id: 'quest_main_5', name: '西山剿匪', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_4', next: 'quest_main_6',
    intro: '西出山道，联络荒古道上的货郎摸清敌情，而后踏平黑风寨。',
    objectives: [
      { type: 'talk', target: 'npc_huolang', text: '向落难货郎打听敌情' },
      { type: 'flag', flag: 'boss_heifeng_defeated', text: '击败黑风王' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 2200, gold: 1200, items: [{ id: 'armor_silver', count: 1 }, { id: 'pill_jindan', count: 1 }], action: 'chapterEnd', chapter: 2 },
  },

  quest_main_6: {
    id: 'quest_main_6', name: '血煞疑云', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_5', next: 'quest_main_7',
    intro: '密信既现，血煞教必有后手。搜剿潜入山道的血煞教徒，查明来路。',
    objectives: [
      { type: 'kill', target: 'mob_xueshatu', count: 3, text: '击杀血煞教徒' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 900, gold: 500, items: [{ id: 'pill_jiuzhuan', count: 2 }] },
  },

  quest_main_7: {
    id: 'quest_main_7', name: '谷中除魔', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_6', next: 'quest_main_8',
    intro: '北入血煞谷，联络谷中采药人，剿灭血煞左使；丹成金丹，方可叩坛。',
    objectives: [
      { type: 'talk', target: 'npc_yaonong', text: '寻访谷中采药人' },
      { type: 'flag', flag: 'boss_zuoshi_defeated', text: '击败血煞左使' },
      { type: 'realm', value: 'jindan', text: '突破至金丹期' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 2500, gold: 1500, items: [{ id: 'pill_jindan', count: 2 }, { id: 'amulet_huhun', count: 1 }] },
  },

  quest_main_8: {
    id: 'quest_main_8', name: '血煞覆灭', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_7', next: 'quest_main_9',
    intro: '血煞祭坛禁制已开。诛灭血煞教主，了断这段百年孽缘。',
    objectives: [
      { type: 'flag', flag: 'boss_xueshazhu_defeated', text: '击败血煞教主' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 5000, gold: 2000, items: [{ id: 'armor_longlin', count: 1 }], action: 'chapterEnd', chapter: 3 },
  },

  quest_main_9: {
    id: 'quest_main_9', name: '渡口之围', type: 'main', giver: 'npc_cunzhang',
    requires: 'quest_main_8', next: 'quest_main_10',
    intro: '北上的必经之路寒霜渡被雪魈围困，渡口老班求援已久。',
    objectives: [
      { type: 'talk', target: 'npc_shen', text: '寻访渡口的琴师' },
      { type: 'kill', target: 'mob_xuejiao', count: 4, text: '击退围渡的雪魈' },
      { type: 'talk', target: 'npc_cunzhang', text: '回报村正', final: true },
    ],
    rewards: { exp: 4000, gold: 1500, items: [{ id: 'pill_huashen', count: 1 }, { id: 'pill_guyuan', count: 3 }] },
  },

  quest_main_10: {
    id: 'quest_main_10', name: '冰原魔踪', type: 'main', giver: 'npc_cunzhang',
    requires: 'quest_main_9', next: 'quest_main_11',
    intro: '冰原深处的魔气与日俱增，隘口有魔物镇守——破隘、化神，方能叩响魔渊。',
    objectives: [
      { type: 'flag', flag: 'boss_yuanmojiang_defeated', text: '击败渊魔将' },
      { type: 'realm', value: 'huashen', text: '突破至化神期' },
      { type: 'talk', target: 'npc_cunzhang', text: '回报村正', final: true },
    ],
    rewards: { exp: 8000, gold: 2000, items: [{ id: 'pill_huashen', count: 2 }, { id: 'yu_longhun', count: 1 }] },
  },

  quest_main_11: {
    id: 'quest_main_11', name: '魔主玄冥', type: 'main', giver: 'npc_cunzhang',
    requires: 'quest_main_10', next: 'quest_main_12',
    intro: '魔渊封印已开。千年前的一切恩怨，都在渊底做个了断。',
    objectives: [
      { type: 'flag', flag: 'boss_xuanming_defeated', text: '击败魔主玄冥' },
      { type: 'talk', target: 'npc_cunzhang', text: '回报村正', final: true },
    ],
    rewards: { exp: 15000, gold: 5000, items: [{ id: 'sword_zhanxing', count: 1 }, { id: 'armor_xuanming', count: 1 }], action: 'chapterEnd', chapter: 4 },
  },

  // ---- 第五章：血煞之上（后传） ----
  quest_main_12: {
    id: 'quest_main_12', name: '赤煞余孽', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_11', next: 'quest_main_13',
    intro: '庆功酒尚温，密报已至——血煞残党在西南古窟集结，侍奉着「血煞之上」。',
    objectives: [
      { type: 'kill', target: 'mob_chisha', count: 4, text: '剿灭赤煞教士' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 12000, gold: 3000, items: [{ id: 'pill_xuling', count: 1 }] },
  },

  quest_main_13: {
    id: 'quest_main_13', name: '赤魂三晶', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_12', next: 'quest_main_14',
    intro: '窟中古碑有载：三枚赤魂晶共鸣，可开启通往煞天幻境的门。而破门之人，须有炼虚之力。',
    objectives: [
      { type: 'item', target: 'jing_chihun', count: 3, text: '收集赤魂晶' },
      { type: 'realm', value: 'lianxu', text: '突破至炼虚期' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 18000, gold: 4000, items: [{ id: 'pill_xuling', count: 2 }, { id: 'pill_tianyuan', count: 2 }] },
  },

  quest_main_14: {
    id: 'quest_main_14', name: '赤渊终战', type: 'main', giver: 'npc_zhangmen',
    requires: 'quest_main_13', next: null,
    intro: '幻境之门已开。千年血祭背后的真凶——血煞之上·赤渊，就在门后等你。',
    objectives: [
      { type: 'flag', flag: 'boss_chiyuan_defeated', text: '击败血煞之上·赤渊' },
      { type: 'talk', target: 'npc_zhangmen', text: '回禀掌门', final: true },
    ],
    rewards: { exp: 30000, gold: 8000, items: [{ id: 'sword_tianwen', count: 1 }, { id: 'armor_chixia', count: 1 }], action: 'chapterEnd', chapter: 5 },
  },

  quest_side_1: {
    id: 'quest_side_1', name: '药铺的委托', type: 'side', giver: 'npc_shangren',
    requires: null, next: null,
    intro: '杂货商想收些狼牙入药。',
    objectives: [
      { type: 'item', target: 'fang_wolf', count: 3, text: '收集狼牙' },
      { type: 'talk', target: 'npc_shangren', text: '交给杂货商', final: true },
    ],
    rewards: { exp: 120, gold: 150, items: [{ id: 'pill_huixue', count: 3 }] },
  },

  quest_side_2: {
    id: 'quest_side_2', name: '失传的功法', type: 'side', giver: 'npc_liu',
    requires: null, next: null,
    intro: '柳如烟的《青元诀》残页被妖狐叼走了。',
    objectives: [
      { type: 'kill', target: 'mob_yaohu', count: 3, text: '击败妖狐' },
      { type: 'item', target: 'book_canpian', count: 1, text: '找回功法残页' },
      { type: 'talk', target: 'npc_liu', text: '交还柳如烟', final: true },
    ],
    rewards: { exp: 200, gold: 100, items: [{ id: 'pill_zhuji', count: 1 }] },
  },

  quest_side_3: {
    id: 'quest_side_3', name: '货郎的失单', type: 'side', giver: 'npc_huolang',
    requires: null, next: null,
    intro: '货郎的货担被飞贼劫散，贼赃散落在荒古道上。',
    objectives: [
      { type: 'item', target: 'zei_zang', count: 3, text: '寻回贼赃' },
      { type: 'talk', target: 'npc_huolang', text: '交还货郎', final: true },
    ],
    rewards: { exp: 450, gold: 350, items: [{ id: 'pill_dahuan', count: 2 }] },
  },

  quest_side_4: {
    id: 'quest_side_4', name: '刀在人在', type: 'side', giver: 'npc_luo',
    requires: 'quest_main_5', next: null,
    intro: '洛家家传的《怒江刀谱》被黑风王锁在寨中武库。',
    objectives: [
      { type: 'item', target: 'dao_pu', count: 1, text: '取回家传刀谱' },
      { type: 'talk', target: 'npc_luo', text: '交还洛清霜', final: true },
    ],
    rewards: { exp: 650, gold: 200, items: [{ id: 'amulet_yulin', count: 1 }] },
  },

  quest_side_5: {
    id: 'quest_side_5', name: '谷中药引', type: 'side', giver: 'npc_yaonong',
    requires: null, next: null,
    intro: '采药人需血煞珠入药，克制谷中瘴毒。',
    objectives: [
      { type: 'item', target: 'xue_zhu', count: 4, text: '收集血煞珠' },
      { type: 'talk', target: 'npc_yaonong', text: '交给采药人', final: true },
    ],
    rewards: { exp: 800, gold: 500, items: [{ id: 'pill_jiuzhuan', count: 2 }] },
  },

  quest_side_6: {
    id: 'quest_side_6', name: '玄晶铸刀', type: 'side', giver: 'npc_luo',
    requires: 'quest_main_7', next: null,
    intro: '洛清霜想以谷中玄晶重铸家传宝刀。',
    objectives: [
      { type: 'item', target: 'xuan_jing', count: 3, text: '收集玄晶' },
      { type: 'talk', target: 'npc_luo', text: '交给洛清霜', final: true },
    ],
    rewards: { exp: 1000, gold: 300, items: [{ id: 'dao_nujiang', count: 1 }] },
  },

  quest_side_7: {
    id: 'quest_side_7', name: '雪中送炭', type: 'side', giver: 'npc_laoban',
    requires: null, next: null,
    intro: '渡口商人缺冰莲入药，渡口的过冬丹药全指望它。',
    objectives: [
      { type: 'item', target: 'bing_lian', count: 5, text: '收集冰莲' },
      { type: 'talk', target: 'npc_laoban', text: '交给孙掌柜', final: true },
    ],
    rewards: { exp: 3000, gold: 800, items: [{ id: 'pill_guyuan', count: 3 }] },
  },

  quest_side_8: {
    id: 'quest_side_8', name: '故琴新弦', type: 'side', giver: 'npc_shen',
    requires: 'quest_main_10', next: null,
    intro: '沈孤鸿的焦尾琴在魔物溃散处残留共鸣——集齐魔魂碎片可重续琴魂。',
    objectives: [
      { type: 'item', target: 'mo_hun', count: 3, text: '收集魔魂碎片' },
      { type: 'talk', target: 'npc_shen', text: '交给沈孤鸿', final: true },
    ],
    rewards: { exp: 4000, gold: 500, items: [{ id: 'qin_jiaowei', count: 1 }] },
  },

  quest_side_9: {
    id: 'quest_side_9', name: '轮回试炼', type: 'side', giver: 'npc_guchen',
    requires: 'quest_main_9', next: null,
    intro: '守塔人古尘守着青云山后这座古塔：「塔中幻境重演旧敌，九层之上，有物相赠。」',
    objectives: [
      { type: 'flag', flag: 'tower_f9_cleared', text: '登顶轮回塔，胜过守塔傀儡' },
      { type: 'talk', target: 'npc_guchen', text: '告知古尘', final: true },
    ],
    rewards: { exp: 10000, gold: 3000, items: [{ id: 'ling_xukong', count: 1 }, { id: 'pill_tianyuan', count: 3 }] },
  },

  quest_side_10: {
    id: 'quest_side_10', name: '翎羽铸锋', type: 'side', giver: 'npc_qiuju',
    requires: 'quest_main_12', next: null,
    intro: '被困窟中的铸剑师鲁铸想要赤焰蝠的火翎：「三根赤焰翎，我助你淬一口问天的剑。」',
    objectives: [
      { type: 'item', target: 'chi_ling', count: 3, text: '收集赤焰翎' },
      { type: 'talk', target: 'npc_qiuju', text: '交给鲁铸', final: true },
    ],
    rewards: { exp: 6000, gold: 1200, items: [{ id: 'pill_tianyuan', count: 2 }, { id: 'pill_xuling', count: 1 }] },
  },

  quest_side_11: {
    id: 'quest_side_11', name: '药妪的酒引', type: 'side', giver: 'npc_yaogu',
    requires: null, next: null,
    intro: '落霞林的采药妪要猴儿酿泡药酒：「林中妖猴抢了我的酒坛，如今倒自己酿起酒来了——替我讨两坛回来。」',
    objectives: [
      { type: 'item', target: 'hou_niang', count: 2, text: '收集猴儿酿' },
      { type: 'talk', target: 'npc_yaogu', text: '交给采药妪', final: true },
    ],
    rewards: { exp: 300, gold: 280, items: [{ id: 'pill_lingli', count: 2 }, { id: 'pill_huixue', count: 3 }] },
  },
};
