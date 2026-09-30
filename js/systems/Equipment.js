// 装备管理：穿脱（三槽：weapon/armor/accessory），属性加成在 Character.equipBonus 计算
import ITEMS from '../data/items.js';

export default class Equipment {
  constructor(game) { this.game = game; }

  equip(char, itemId, inventory) {
    const def = ITEMS[itemId];
    if (!def || def.type !== 'equipment') return { ok: false, msg: '无法装备' };
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
