// 暗雷遇敌：遇敌区内每步 8% 概率，25 步未遇敌概率递增保底
import BALANCE from '../data/balance.js';

export default class Encounter {
  constructor(game, mapDef) {
    this.game = game;
    this.mapDef = mapDef;
    this.steps = 0;
  }

  // 玩家落到 (x,y) 时调用；返回怪物数组或 null
  onStep(x, y, zone) {
    if (!zone) return null;
    const table = this.mapDef.encounters && this.mapDef.encounters[zone];
    if (!table || !table.length) return null;
    this.steps++;
    const pity = BALANCE.encounter.pitySteps;
    let chance = BALANCE.encounter.baseChance;
    if (this.steps > pity) chance += (this.steps - pity) * 0.04; // 保底递增
    if (Math.random() < chance) {
      this.steps = 0;
      return this._pick(table);
    }
    return null;
  }

  _pick(table) {
    const total = table.reduce((s, r) => s + r.w, 0);
    let roll = Math.random() * total;
    for (const row of table) {
      roll -= row.w;
      if (roll <= 0) return [...row.mobs];
    }
    return [...table[0].mobs];
  }
}
