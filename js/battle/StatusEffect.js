// 状态效果：钩子式结算（modifyStat / onTurnEnd / canAct）
import SKILLS from '../data/skills.js';

export function statusDef(id) { return SKILLS[id]; }

// 施加状态（同类刷新持续回合）；boss 对眩晕有抗性
export function addStatus(unit, statusId, sourceIsBoss = false) {
  const def = SKILLS[statusId];
  if (!def) return false;
  let chance = 1;
  if (unit.lastApplyChance != null) chance = unit.lastApplyChance;
  if (unit.boss && statusId === 'stun') chance *= 0.5;
  if (Math.random() >= chance) return false;
  const exist = unit.statuses.find(s => s.id === statusId);
  if (exist) exist.left = def.duration;
  else unit.statuses.push({ id: statusId, def, left: def.duration });
  return true;
}

export function hasStatus(unit, statusId) {
  return unit.statuses.some(s => s.id === statusId);
}

export function canAct(unit) {
  return !unit.statuses.some(s => s.def.canAct === false);
}

// 属性修正（乘区叠乘）
export function modifyStat(unit, stat, base) {
  let v = base;
  for (const s of unit.statuses) {
    const m = s.def.modifyStat && s.def.modifyStat[stat];
    if (m) v *= m;
  }
  return v;
}

// 回合末结算：持续伤害 + 时长递减。返回事件数组（死亡事件由 BattleEngine 统一推送）
export function tickTurnEnd(unit) {
  const events = [];
  for (const s of [...unit.statuses]) {
    if (s.def.onTurnEnd && s.def.onTurnEnd.hpPct) {
      const dmg = Math.max(1, Math.floor(unit.maxHp() * Math.abs(s.def.onTurnEnd.hpPct)));
      unit.takeDamage(dmg);
      events.push({ type: 'dot', target: unit, value: dmg, statusName: s.def.name });
      if (!unit.alive) return events;
    }
    s.left--;
    if (s.left <= 0) {
      unit.statuses.splice(unit.statuses.indexOf(s), 1);
      events.push({ type: 'msg', text: `${unit.displayName} 的「${s.def.name}」效果结束了` });
    }
  }
  return events;
}

// 清除全部异常状态
export function cureDebuffs(unit) {
  const before = unit.statuses.length;
  unit.statuses = unit.statuses.filter(s => !s.def.isDebuff);
  return unit.statuses.length < before;
}
