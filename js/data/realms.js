// 境界体系：炼气1-9层(自动) → 筑基(筑基丹·80%) → 金丹(金元丹·60%) → 元婴(剧情·100%) → 化神(破境丹·50%)
// factor 为全属性乘区（绝对值，非跨境界累乘）
const lianqi = [];
for (let i = 1; i <= 9; i++) {
  lianqi.push({
    id: `lianqi_${i}`,
    name: `炼气${'一二三四五六七八九'[i - 1]}层`,
    tier: 'lianqi',
    tierName: '炼气期',
    index: i,
    levelReq: i,
    factor: 1 + 0.05 * (i - 1),
    pill: null,
    rate: 1,
    auto: true,
  });
}

export default {
  realms: [
    ...lianqi,
    { id: 'zhuji',    name: '筑基期', tier: 'zhuji',    tierName: '筑基期', levelReq: 16, factor: 2.2,  pill: 'pill_zhuji',   rate: 0.80, auto: false },
    { id: 'jindan',   name: '金丹期', tier: 'jindan',   tierName: '金丹期', levelReq: 31, factor: 4.5,  pill: 'pill_jindan',  rate: 0.60, auto: false },
    { id: 'yuanying', name: '元婴期', tier: 'yuanying', tierName: '元婴期', levelReq: 46, factor: 8.0,  pill: null,           rate: 1.00, auto: false, note: '需剧情契机' },
    { id: 'huashen',  name: '化神期', tier: 'huashen',  tierName: '化神期', levelReq: 48, factor: 12.0, pill: 'pill_huashen', rate: 0.50, auto: false, note: '破境丹可辅' },
  ],

  // 各境界功法（技能）槽上限——预留，当前版本技能学会即用
  skillSlots: { lianqi: 6, zhuji: 9, jindan: 12, yuanying: 16, huashen: 20 },

  byId(id) {
    return this.realms.find(r => r.id === id) || this.realms[0];
  },
  nextOf(realmId) {
    const idx = this.realms.findIndex(r => r.id === realmId);
    return idx >= 0 && idx < this.realms.length - 1 ? this.realms[idx + 1] : null;
  },
};
