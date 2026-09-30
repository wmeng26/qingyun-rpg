// 背包：物品堆叠、使用（战斗外）、战斗内效果应用
import ITEMS from '../data/items.js';

const TYPE_ORDER = { consumable: 0, equipment: 1, material: 2, quest: 3 };

export default class Inventory {
  constructor(game) {
    this.game = game;
    this.items = new Map();
  }

  add(id, n = 1) {
    this.items.set(id, (this.items.get(id) || 0) + n);
    if (this.game) this.game.bus.emit('itemObtained', { id, count: n });
  }

  remove(id, n = 1) {
    const cur = this.items.get(id) || 0;
    if (cur < n) return false;
    if (cur - n <= 0) this.items.delete(id);
    else this.items.set(id, cur - n);
    this.game && this.game.bus.emit('itemObtained', { id, count: 0 });
    return true;
  }

  count(id) { return this.items.get(id) || 0; }

  entries() {
    const out = [];
    for (const [id, count] of this.items) {
      const def = ITEMS[id];
      if (def && count > 0) out.push({ id, def, count });
    }
    out.sort((a, b) =>
      (TYPE_ORDER[a.def.type] - TYPE_ORDER[b.def.type]) || a.id.localeCompare(b.id));
    return out;
  }

  // 使用消耗品（战斗外）。突破丹不可直接服用，走突破界面。
  use(id, char) {
    const def = ITEMS[id];
    if (!def || def.type !== 'consumable') return { ok: false, msg: '无法使用' };
    if (def.effect.breakthrough) {
      return { ok: false, msg: '突破丹需在「角色」面板中用于突破' };
    }
    const r = this.applyEffect(def, char);
    // applyEffect 返回的是实际变化量：目标满血满灵力且无可解异常时
    // 什么都不发生，此时不消耗丹药
    if (r.hp === 0 && r.mp === 0 && !r.cured) {
      return { ok: false, msg: '现在使用没有效果，丹药未消耗' };
    }
    this.remove(id, 1);
    const parts = [];
    if (r.hp > 0) parts.push(`气血+${r.hp}`);
    if (r.mp > 0) parts.push(`灵力+${r.mp}`);
    if (r.cured) parts.push('异常解除');
    if (r.hpMaxUp) parts.push(`气血上限+${r.hpMaxUp}`);
    return { ok: true, msg: parts.join('，') || '没有效果' };
  }

  // 对 Character 或战斗 Unit 应用效果（二者都有 maxHp/maxMp/hp/mp/statuses 语义差异，
  // 由调用方传入适配器 {getMaxHp,getMaxMp,heal,cure} —— 此处直接 duck-typing）
  // 返回值为实际变化量（满血时 hp=0），供调用方判断是否产生了效果
  applyEffect(def, target) {
    const r = { hp: 0, mp: 0, cured: false, hpMaxUp: 0 };
    const e = def.effect || {};
    if (e.hpPct) {
      const max = typeof target.maxHp === 'function' ? target.maxHp() : target.maxHp;
      const before = target.hp;
      target.hp = Math.min(max, target.hp + Math.floor(max * e.hpPct));
      r.hp = target.hp - before;
    }
    if (e.mpPct) {
      const max = typeof target.maxMp === 'function' ? target.maxMp() : target.maxMp;
      const before = target.mp;
      target.mp = Math.min(max, target.mp + Math.floor(max * e.mpPct));
      r.mp = target.mp - before;
    }
    if (e.cureAll && target.statuses) {
      const before = target.statuses.length;
      target.statuses = target.statuses.filter(s => !s.def.isDebuff);
      r.cured = target.statuses.length < before;
    } else if (e.cureAll && target.cureAllDebuffs) {
      r.cured = target.cureAllDebuffs();
    }
    return r;
  }

  serialize() {
    const o = {};
    for (const [id, n] of this.items) if (n > 0) o[id] = n;
    return o;
  }

  deserialize(o) {
    this.items = new Map();
    for (const [id, n] of Object.entries(o || {})) if (n > 0) this.items.set(id, n);
  }
}
