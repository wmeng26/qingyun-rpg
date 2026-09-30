// 战斗单位：玩家角色与怪物的统一战斗抽象
import * as SE from './StatusEffect.js';

export default class Unit {
  // source: Character（有 def.growth）或怪物定义（有 stats）
  constructor(source, suffix = '') {
    this.isChar = !!source.def && !!source.def.growth;
    this.source = source;
    this.suffix = suffix;
    this.statuses = [];
    this.defending = false;
    this.lastApplyChance = null;

    if (this.isChar) {
      this.name = source.name;
      this.spriteKey = source.battleSpriteKey;
      this.level = source.level;
      this.boss = false;
      this.scale = 1;
    } else {
      this.name = source.name;
      this.spriteKey = source.sprite;
      this.level = source.level;
      this.boss = !!source.boss;
      this.scale = source.scale || 1;
      this.element = source.element || 'none';
    }
    const s = this.baseStats();
    this.hp = Math.min(this.isChar ? source.hp : s.maxHp, s.maxHp);
    this.mp = Math.min(this.isChar ? source.mp : s.maxMp, s.maxMp);
    this.alive = this.hp > 0;
  }

  get displayName() { return this.name + (this.suffix || ''); }

  baseStats() {
    if (this.isChar) return this.source.stats();
    return { ...this.source.stats };
  }

  maxHp() { return this.baseStats().maxHp; }
  maxMp() { return this.baseStats().maxMp; }

  effStat(name) {
    return SE.modifyStat(this, name, this.baseStats()[name]);
  }

  elementOf() {
    return this.isChar ? 'none' : (this.element || 'none');
  }

  takeDamage(n) {
    this.hp = Math.max(0, this.hp - n);
    if (this.hp <= 0) {
      this.alive = false;
      this.statuses = [];
      this.defending = false;
    }
  }

  heal(n) {
    this.hp = Math.min(this.maxHp(), this.hp + n);
    this.alive = this.hp > 0;
  }

  cureAllDebuffs() { return SE.cureDebuffs(this); }

  // 战斗结束回写角色数据
  syncBack() {
    if (!this.isChar) return;
    this.source.hp = this.hp;
    this.source.mp = this.mp;
  }
}
