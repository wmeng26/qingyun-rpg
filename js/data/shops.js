// 商店表：id -> { id, name, goods: [itemId...] }
// 对话动作 { do: 'openShop', id: 'shop_xxx' } 打开对应商店；缺省 id 打开第一间。
// 卖出规则：可卖物品（price>0 且非任务品）统一按半价回收，见 UIScene.openShop。
// 武器按门类绑定角色（sword 剑=萧逸 / blade 刀=洛清霜 / qin 琴=沈孤鸿 / brush 笔=柳如烟）
export default {
  // 青云门杂货摊：南方（一~三章）唯一商店，保障突破链（筑基/金丹/化神）与四系武器中低档
  shop_qingyun: {
    id: 'shop_qingyun', name: '杂货摊 · 丹药器械',
    goods: [
      'pill_huixue', 'pill_lingli', 'pill_jiedu', 'pill_dahuan',
      'pill_zhuji', 'pill_jindan', 'pill_huashen',
      'pill_jiuzhuan', 'pill_guyuan',
      'sword_iron', 'robe_cotton', 'armor_leather', 'amulet_pingan', 'jade_ling',
      'sword_qingfeng', 'sword_hanshuang', 'armor_silver', 'amulet_yulin',
      'sword_zhanlu', 'armor_longlin', 'amulet_huhun',
      'dao_liuye', 'dao_pozhen', 'dao_duanjiang', 'dao_hanyue',
      'qin_wutong', 'qin_liuquan', 'qin_hanquan',
      'bi_qingzhu', 'bi_zhusha', 'bi_zixiao',
    ],
  },
  // 寒霜渡渡口摊位：北地行商，主攻丹药与四系兵器高档货
  shop_hanshidu: {
    id: 'shop_hanshidu', name: '渡口行商 · 丹药兵器',
    goods: [
      'pill_jiuzhuan', 'pill_guyuan', 'pill_tianyuan', 'pill_xuling',
      'dao_nujiang', 'dao_tunxiao', 'sword_zhanxing', 'sword_tianwen',
      'qin_jiaowei', 'qin_tianlai', 'bi_chunqiu',
      'yu_longhun',
    ],
  },
  // 渡口杂货铺：补给齐全，防具饰品与顶阶装备
  shop_zahuopu: {
    id: 'shop_zahuopu', name: '杂货铺 · 北地百货',
    goods: [
      'pill_huixue', 'pill_lingli', 'pill_jiedu', 'pill_dahuan',
      'pill_jiuzhuan', 'pill_guyuan', 'pill_tianyuan',
      'armor_xuanming', 'armor_chixia', 'ling_xukong',
    ],
  },
};
