// 道具表：consumable 消耗品 / equipment 装备 / material 材料 / quest 任务品
// price = 商店售价（0 = 商店不出售）；材料可按半价出售给商人
export default {
  // ---- 丹药 ----
  pill_huixue: {
    id: 'pill_huixue', name: '回血丹', type: 'consumable', price: 50, icon: 'icon_pill_red',
    desc: '服下后恢复35%气血。',
    effect: { hpPct: 0.35 }, target: 'one_ally',
  },
  pill_lingli: {
    id: 'pill_lingli', name: '灵力丹', type: 'consumable', price: 60, icon: 'icon_pill_blue',
    desc: '服下后恢复40%灵力。',
    effect: { mpPct: 0.40 }, target: 'one_ally',
  },
  pill_jiedu: {
    id: 'pill_jiedu', name: '解毒丹', type: 'consumable', price: 40, icon: 'icon_pill_green',
    desc: '解除中毒、灼烧等异常状态。',
    effect: { cureAll: true }, target: 'one_ally',
  },
  pill_zhuji: {
    id: 'pill_zhuji', name: '筑基丹', type: 'consumable', price: 800, icon: 'icon_pill_gold',
    desc: '突破至筑基期所需的辅药（突破时消耗，成功率80%）。',
    effect: { breakthrough: true }, target: 'one_ally',
  },
  pill_jindan: {
    id: 'pill_jindan', name: '金元丹', type: 'consumable', price: 3000, icon: 'icon_pill_gold',
    desc: '冲击金丹期所需的辅药（突破时消耗，成功率60%）。',
    effect: { breakthrough: true }, target: 'one_ally',
  },
  pill_huashen: {
    id: 'pill_huashen', name: '破境丹', type: 'consumable', price: 8000, icon: 'icon_pill_rainbow',
    desc: '冲击化神期所需的辅药（突破时消耗，成功率50%）。',
    effect: { breakthrough: true }, target: 'one_ally',
  },
  pill_guyuan: {
    id: 'pill_guyuan', name: '固元丹', type: 'consumable', price: 1200, icon: 'icon_pill_jade',
    desc: '固本培元的上品丹药，气血灵力尽数恢复。',
    effect: { hpPct: 1.0, mpPct: 1.0 }, target: 'one_ally',
  },
  pill_dahuan: {
    id: 'pill_dahuan', name: '大还丹', type: 'consumable', price: 240, icon: 'icon_pill_amber',
    desc: '上品丹药，服下后恢复80%气血。',
    effect: { hpPct: 0.8 }, target: 'one_ally',
  },
  pill_jiuzhuan: {
    id: 'pill_jiuzhuan', name: '九转丹', type: 'consumable', price: 800, icon: 'icon_pill_crimson',
    desc: '九转炼制的救急丹药，气血全复并祛除一切异常。',
    effect: { hpPct: 1.0, cureAll: true }, target: 'one_ally',
  },
  pill_xuling: {
    id: 'pill_xuling', name: '炼虚丹', type: 'consumable', price: 20000, icon: 'icon_pill_rainbow',
    desc: '冲击炼虚期所需的辅药（突破时消耗，成功率45%）。',
    effect: { breakthrough: true }, target: 'one_ally',
  },
  pill_tianyuan: {
    id: 'pill_tianyuan', name: '天元丹', type: 'consumable', price: 6000, icon: 'icon_pill_gold',
    desc: '传说中的绝品丹药，气血灵力尽复、百毒不侵（对倒地的同伴亦有回天之效）。',
    effect: { hpPct: 1.0, mpPct: 1.0, cureAll: true }, target: 'one_ally',
  },

  // ---- 材料（可出售） ----
  fang_wolf: {
    id: 'fang_wolf', name: '狼牙', type: 'material', price: 20, icon: 'icon_fang',
    desc: '锋利的野狼獠牙，药铺商会收购。',
  },
  hu_mao: {
    id: 'hu_mao', name: '灵狐毛', type: 'material', price: 35, icon: 'icon_fur',
    desc: '带着温热灵气的狐毛。',
  },
  shi_dan: {
    id: 'shi_dan', name: '尸丹', type: 'material', price: 80, icon: 'icon_pill_purple',
    desc: '尸傀体内凝成的阴丹，阴气森森。',
  },
  zei_zang: {
    id: 'zei_zang', name: '贼赃', type: 'material', price: 45, icon: 'icon_loot',
    desc: '黑风寨劫掠来的杂物，可变卖，也可作失单凭证。',
  },
  xue_zhu: {
    id: 'xue_zhu', name: '血煞珠', type: 'material', price: 90, icon: 'icon_xuezhu',
    desc: '凝着血煞之气的暗红珠子，既是魔道凭证，也是难得药引。',
  },
  xuan_jing: {
    id: 'xuan_jing', name: '玄晶', type: 'material', price: 130, icon: 'icon_jing',
    desc: '煞气千百年凝成的晶石，可作铸兵之材。',
  },
  bing_lian: {
    id: 'bing_lian', name: '冰莲', type: 'material', price: 160, icon: 'icon_lian',
    desc: '冰原雪线下才生的寒莲，是炼制固元丹的主药。',
  },
  mo_hun: {
    id: 'mo_hun', name: '魔魂碎片', type: 'material', price: 220, icon: 'icon_mohun',
    desc: '渊魔溃散后残留的魔魂结晶，封印重铸所需之法器材料。',
  },
  jing_chihun: {
    id: 'jing_chihun', name: '赤魂晶', type: 'material', price: 1200, icon: 'icon_xuezhu',
    desc: '赤魂使者溃散后凝成的血色晶石，三晶共鸣可开启幻境之门。',
  },
  chi_ling: {
    id: 'chi_ling', name: '赤焰翎', type: 'material', price: 150, icon: 'icon_fur',
    desc: '赤焰蝠翼上的火羽，是铸剑师梦寐以求的淬火之材。',
  },

  // ---- 装备：武器 ----
  sword_iron: {
    id: 'sword_iron', name: '铁剑', type: 'equipment', slot: 'weapon', price: 120, icon: 'icon_sword',
    desc: '最普通的制式铁剑。', bonus: { atk: 4 },
  },
  sword_qingfeng: {
    id: 'sword_qingfeng', name: '青锋剑', type: 'equipment', slot: 'weapon', price: 420, icon: 'icon_sword2',
    desc: '剑身泛着青光，吹毛断发。', bonus: { atk: 10, spd: 1 },
  },
  // ---- 装备：防具 ----
  robe_cotton: {
    id: 'robe_cotton', name: '粗布衣', type: 'equipment', slot: 'armor', price: 80, icon: 'icon_robe',
    desc: '耐磨的粗布衣物。', bonus: { def: 3, maxHp: 10 },
  },
  armor_leather: {
    id: 'armor_leather', name: '皮甲', type: 'equipment', slot: 'armor', price: 220, icon: 'icon_armor',
    desc: '硝好的兽皮缝制，轻便防身。', bonus: { def: 6, maxHp: 15 },
  },
  armor_xuantie: {
    id: 'armor_xuantie', name: '玄铁护心甲', type: 'equipment', slot: 'armor', price: 900, icon: 'icon_armor2',
    desc: '内衬玄铁片，刀枪难入。', bonus: { def: 12, mdef: 5, maxHp: 30 },
  },
  armor_silver: {
    id: 'armor_silver', name: '锁子甲', type: 'equipment', slot: 'armor', price: 1600, icon: 'icon_armor3',
    desc: '银亮铁环相扣，柔韧且坚固。', bonus: { def: 18, mdef: 6, maxHp: 40 },
  },
  armor_longlin: {
    id: 'armor_longlin', name: '龙鳞甲', type: 'equipment', slot: 'armor', price: 4200, icon: 'icon_armor4',
    desc: '甲片如龙鳞层叠，水火难侵。', bonus: { def: 28, mdef: 10, maxHp: 60 },
  },
  sword_zhanxing: {
    id: 'sword_zhanxing', name: '斩星剑', type: 'equipment', slot: 'weapon', price: 8000, icon: 'icon_sword5',
    desc: '剑气可断星辰，寒渊之地方见其锋。', bonus: { atk: 36, spd: 4 },
  },
  armor_xuanming: {
    id: 'armor_xuanming', name: '玄冥甲', type: 'equipment', slot: 'armor', price: 8500, icon: 'icon_armor5',
    desc: '以渊魔之鳞缀成，寒暑不侵，魔煞不近。', bonus: { def: 38, mdef: 14, maxHp: 90 },
  },
  sword_tianwen: {
    id: 'sword_tianwen', name: '天问剑', type: 'equipment', slot: 'weapon', price: 16000, icon: 'icon_sword5',
    desc: '以赤渊残韵淬炼的长剑，剑鸣如问天。', bonus: { atk: 46, spd: 6 },
  },
  armor_chixia: {
    id: 'armor_chixia', name: '赤霞袍', type: 'equipment', slot: 'armor', price: 15000, icon: 'icon_armor5',
    desc: '赤霞织就的法袍，煞气不侵。', bonus: { def: 42, mdef: 18, maxHp: 120 },
  },
  qin_jiaowei: {
    id: 'qin_jiaowei', name: '焦尾琴', type: 'equipment', slot: 'weapon', price: 7000, icon: 'icon_qin',
    desc: '沈孤鸿的故琴，琴音可裂金石。', bonus: { matk: 30, maxMp: 30 },
  },
  sword_hanshuang: {
    id: 'sword_hanshuang', name: '寒霜剑', type: 'equipment', slot: 'weapon', price: 1500, icon: 'icon_sword3',
    desc: '剑锋凝霜，出鞘时寒气逼人。', bonus: { atk: 16, spd: 2 },
  },
  sword_zhanlu: {
    id: 'sword_zhanlu', name: '湛卢剑', type: 'equipment', slot: 'weapon', price: 4000, icon: 'icon_sword4',
    desc: '古名匠所铸仁道之剑，剑气如虹。', bonus: { atk: 26, spd: 3 },
  },
  dao_nujiang: {
    id: 'dao_nujiang', name: '怒江刀', type: 'equipment', slot: 'weapon', price: 3600, icon: 'icon_dao',
    desc: '以玄晶重铸的洛家宝刀，刀出如江潮。', bonus: { atk: 23, spd: 3 },
  },
  // ---- 装备：饰品 ----
  amulet_pingan: {
    id: 'amulet_pingan', name: '平安符', type: 'equipment', slot: 'accessory', price: 150, icon: 'icon_amulet',
    desc: '青云门开光的护身符。', bonus: { mdef: 5 },
  },
  jade_ling: {
    id: 'jade_ling', name: '灵玉坠', type: 'equipment', slot: 'accessory', price: 380, icon: 'icon_jade',
    desc: '温养灵力的玉坠，佩之心神清明。', bonus: { matk: 6, maxMp: 12 },
  },
  amulet_yulin: {
    id: 'amulet_yulin', name: '御灵铃', type: 'equipment', slot: 'accessory', price: 1100, icon: 'icon_bell',
    desc: '铃音涤荡神魂，辟邪安心。', bonus: { mdef: 10, maxMp: 25 },
  },
  amulet_huhun: {
    id: 'amulet_huhun', name: '护魂玉', type: 'equipment', slot: 'accessory', price: 3000, icon: 'icon_yu',
    desc: '温润古玉，神魂遇袭时自生护罩。', bonus: { mdef: 16, maxMp: 40 },
  },
  yu_longhun: {
    id: 'yu_longhun', name: '龙魂玉', type: 'equipment', slot: 'accessory', price: 6000, icon: 'icon_longyu',
    desc: '古龙残魂所栖，佩者神魂如铁。', bonus: { mdef: 22, maxMp: 60 },
  },
  ling_xukong: {
    id: 'ling_xukong', name: '虚空佩', type: 'equipment', slot: 'accessory', price: 20000, icon: 'icon_jade',
    desc: '轮回塔顶的古老玉佩，虚空中凝练的道韵，诸般属性皆有其益。',
    bonus: { atk: 8, def: 8, matk: 8, mdef: 8, spd: 8, maxHp: 60, maxMp: 30 },
  },

  // ---- 任务物品 ----
  book_canpian: {
    id: 'book_canpian', name: '功法残页', type: 'quest', price: 0, icon: 'icon_book',
    desc: '《青元诀》残页，被妖狐叼走了。',
  },
  dao_pu: {
    id: 'dao_pu', name: '家传刀谱', type: 'quest', price: 0, icon: 'icon_book2',
    desc: '洛家家传的《怒江刀谱》，被黑风王劫走，锁在寨中武库。',
  },
};
