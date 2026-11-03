// 装备精炼：全局限定每件装备一个强化等级（+0~+maxPlus），
// 属性加成按 bonusMult 放大；等级随存档持久化（saveVersion 2 起）
import BALANCE from '../data/balance.js';

let levels = {}; // itemId -> plus

export function getPlus(itemId) { return levels[itemId] || 0; }

export function bonusMult(plus = 0) { return 1 + BALANCE.forge.bonusPerLevel * plus; }

// 从 plus 升到 plus+1 的代价（金 + 材料），返回 null 表示已满级
export function costOf(plus) {
  const cfg = BALANCE.forge;
  if (plus >= cfg.maxPlus) return null;
  const step = plus + 1;
  return { gold: cfg.goldBase * step * step, mat: cfg.mat, count: Math.ceil(step / cfg.matEvery) };
}

export function getLevels() { return { ...levels }; }

export function setLevels(obj) {
  levels = {};
  const max = BALANCE.forge.maxPlus;
  for (const [id, v] of Object.entries(obj || {})) {
    const n = Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
    if (n > 0) levels[id] = n;
  }
}

export function reset() { levels = {}; }

// 展示名：铁剑 +3
export function displayName(def) {
  if (!def) return '';
  const p = getPlus(def.id);
  return p > 0 ? `${def.name} +${p}` : def.name;
}

// 执行精炼：扣金与材料，成功返回新等级
export function refine(game, itemId) {
  const plus = getPlus(itemId);
  const cost = costOf(plus);
  if (!cost) return { ok: false, msg: '已是极限，无可再淬' };
  if (game.gold < cost.gold) return { ok: false, msg: `金钱不足（需 ${cost.gold} 文）` };
  if (game.inventory.count(cost.mat) < cost.count) return { ok: false, msg: `材料不足（需 ${cost.mat}×${cost.count}）` };
  game.addGold(-cost.gold);
  game.inventory.remove(cost.mat, cost.count);
  levels[itemId] = plus + 1;
  return { ok: true, plus: plus + 1 };
}
