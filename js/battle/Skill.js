// 技能执行：给定施放者/技能/目标，产出事件流（引擎与 UI 解耦）
import SKILLS from '../data/skills.js';
import * as F from './DamageFormula.js';
import * as SE from './StatusEffect.js';

// 返回事件数组（dmg/heal/miss/status/msg/die）
export function executeSkill(actor, skill, targets) {
  const events = [];
  for (const target of targets) {
    if (!target.alive && !skill.heal) continue;
    if (skill.heal) {
      if (!target.alive) continue;
      const amount = Math.floor(actor.effStat('matk') * 2 * (skill.power || 1)) + 10;
      target.heal(amount);
      events.push({ type: 'heal', actor, target, value: amount });
      continue;
    }
    if (skill.cure) {
      const cured = SE.cureDebuffs(target);
      events.push({ type: 'cure', actor, target, cured });
      continue;
    }
    if (skill.buff) {
      target.lastApplyChance = skill.buff.chance != null ? skill.buff.chance : 1;
      const applied = SE.addStatus(target, skill.buff.id);
      target.lastApplyChance = null;
      events.push({ type: 'status', actor, target, statusId: skill.buff.id, applied });
      continue;
    }
    // 没有 power 字段 = 非伤害技能：只结算附加状态，绝不结算伤害。
    // 否则 `skill.power || 1` 会让纯 debuff 技能（如 Boss 的「威压」）白打一发全额伤害；
    // 基础攻击 skill_attack 显式声明了 power:1.0，不受影响。
    const isAttack = skill.power != null;
    if (!isAttack) {
      if (skill.addStatus) {
        const chance = skill.addStatus.chance;
        target.lastApplyChance = chance;
        const applied = SE.addStatus(target, skill.addStatus.id);
        target.lastApplyChance = null;
        events.push({ type: 'status', actor, target, statusId: skill.addStatus.id, applied });
      }
      continue;
    }
    // 攻击类
    const aSpd = actor.effStat('spd');
    const dSpd = target.effStat('spd');
    if (!F.rollHit(aSpd, dSpd, skill.accuracy || 1)) {
      events.push({ type: 'miss', actor, target });
      continue;
    }
    const defendMul = target.defending ? 0.5 : 1;
    const roll = F.rollDamage({
      atk: skill.phys ? actor.effStat('atk') : actor.effStat('matk'),
      def: skill.phys ? target.effStat('def') : target.effStat('mdef'),
      power: skill.power || 1,
      element: skill.element || 'none',
      defElement: target.elementOf(),
      maxHp: target.maxHp(),
      defendMul,
    });
    target.takeDamage(roll.value);
    events.push({ type: 'dmg', actor, target, value: roll.value, crit: roll.crit, eff: roll.eff });
    if (!target.alive) events.push({ type: 'die', target });
    else if (skill.addStatus) {
      const chance = skill.addStatus.chance;
      target.lastApplyChance = chance;
      const applied = SE.addStatus(target, skill.addStatus.id);
      target.lastApplyChance = null;
      events.push({ type: 'status', actor, target, statusId: skill.addStatus.id, applied });
    }
  }
  return events;
}

export function skillDef(id) { return SKILLS[id]; }
