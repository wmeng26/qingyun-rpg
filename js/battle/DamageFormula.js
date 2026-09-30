// 伤害/命中/逃跑/经验公式（纯函数）
import BALANCE from '../data/balance.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function elementMult(atkElem, defElem) {
  if (!atkElem || atkElem === 'none' || !defElem || defElem === 'none') return 1;
  const chart = BALANCE.elementChart[atkElem];
  return (chart && chart[defElem]) || 1;
}

// 单次伤害掷骰
export function rollDamage({ atk, def, power = 1, element = 'none', defElement = 'none', maxHp = 9999, defendMul = 1 }) {
  const em = elementMult(element, defElement);
  const raw = (atk * 2 - def) * power;
  const variance = 1 + (Math.random() * 2 - 1) * BALANCE.damage.variance;
  let v = raw * variance * em;
  const crit = Math.random() < BALANCE.crit.chance;
  if (crit) v *= BALANCE.crit.mult;
  v *= defendMul;
  v = Math.floor(v);
  const softCap = maxHp * BALANCE.damage.softCapMaxHpMult;
  v = clamp(v, BALANCE.damage.min, softCap);
  return { value: v, crit, eff: em > 1 ? 'strong' : em < 1 ? 'weak' : 'normal' };
}

export function hitChance(aSpd, dSpd) {
  return clamp(BALANCE.hit.base + (aSpd - dSpd) * BALANCE.hit.spdFactor, BALANCE.hit.min, BALANCE.hit.max);
}

export function rollHit(aSpd, dSpd, accuracy = 1) {
  return Math.random() < hitChance(aSpd, dSpd) * accuracy;
}

export function fleeChance(aSpd, dSpd) {
  return clamp(BALANCE.flee.base + (aSpd - dSpd) * BALANCE.flee.spdFactor, BALANCE.flee.min, BALANCE.flee.max);
}

// 越级经验修正：队伍均级每高 1 级 -10%，clamp 0.3~1.5
export function expFor(baseExp, enemyLevel, partyAvgLevel) {
  const diff = partyAvgLevel - enemyLevel;
  const mul = clamp(1 - diff * BALANCE.exp.overStep, BALANCE.exp.overMin, BALANCE.exp.overMax);
  return Math.max(1, Math.floor(baseExp * mul));
}
