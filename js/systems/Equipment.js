// 装备管理：穿脱（三槽：weapon/armor/accessory），属性加成在 Character.equipBonus 计算
import ITEMS, { WEAPON_TYPES } from '../data/items.js';
import CHARACTERS from '../data/characters.js';

// 门类中文名 / 该门类可用的角色名（供菜单、商店展示「剑 · 萧逸专用」这类标签）
export function weaponTypeName(wtype) { return WEAPON_TYPES[wtype] || '未知'; }
export function weaponTypeUsers(wtype) {
  return Object.values(CHARACTERS).filter(c => c.wtype === wtype).map(c => c.name).join('、');
}

export default class Equipment {
  constructor(game) { this.game = game; }

  // 角色能否装备该道具：武器按门类绑定角色，防具/饰品通用
  canEquip(char, def) {
    if (!def || def.type !== 'equipment') return { ok: false, msg: '无法装备' };
    if (def.slot !== 'weapon') return { ok: true };
    if (char.def.wtype === def.wtype) return { ok: true };
    const wtName = weaponTypeName(def.wtype);
    const who = Object.values(CHARACTERS).filter(c => c.wtype === def.wtype).map(c => c.name).join('、');
    return { ok: false, msg: `「${def.name}」是${wtName}类兵刃，${who ? `只有 ${who} 能用` : '无人能用'}` };
  }

  equip(char, itemId, inventory) {
    const def = ITEMS[itemId];
    if (!def || def.type !== 'equipment') return { ok: false, msg: '无法装备' };
    const r = this.canEquip(char, def);
    if (!r.ok) return r;
    const slot = def.slot;
    const prev = char.equipment[slot];
    if (!inventory.remove(itemId, 1)) return { ok: false, msg: '物品不存在' };
    if (prev) inventory.add(prev, 1);
    char.equipment[slot] = itemId;
    return { ok: true, prev };
  }

  unequip(char, slot, inventory) {
    const prev = char.equipment[slot];
    if (!prev) return { ok: false, msg: '该部位没有装备' };
    inventory.add(prev, 1);
    char.equipment[slot] = null;
    return { ok: true };
  }
}
