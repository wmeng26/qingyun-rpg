// 战斗引擎：回合状态机，只产出事件队列，可脱离 UI 运行
import MONSTERS from '../data/monsters.js';
import SKILLS from '../data/skills.js';
import ITEMS from '../data/items.js';
import Unit from './Unit.js';
import { executeSkill } from './Skill.js';
import * as F from './DamageFormula.js';
import * as SE from './StatusEffect.js';

export default class BattleEngine {
  constructor({ game, mobs, canFlee = true, boss = false, winFlag = null }) {
    this.game = game;
    this.canFlee = canFlee;
    this.boss = boss;
    this.winFlag = winFlag;
    this.turn = 1;
    this.phase = 'intro';
    this.outcome = null;
    this.commands = new Map();

    // 敌人（同类多只加「甲乙丙」后缀）
    const seen = {};
    this.enemyUnits = mobs.map(id => {
      const def = MONSTERS[id];
      seen[id] = (seen[id] || 0) + 1;
      const dup = mobs.filter(m => m === id).length > 1;
      return new Unit(def, dup ? ('甲乙丙丁'[seen[id] - 1] || '?') : '');
    });
    this.partyUnits = game.party.map(c => new Unit(c));
  }

  allUnits() { return [...this.partyUnits, ...this.enemyUnits]; }
  aliveEnemies() { return this.enemyUnits.filter(u => u.alive); }
  aliveParty() { return this.partyUnits.filter(u => u.alive); }

  // 自动指令的默认目标：首位存活敌人（集火；结算时若已阵亡会自动转向其他敌人）
  autoTarget() { return this.aliveEnemies()[0] || null; }

  // ===== 指令阶段 =====
  beginTurn() {
    this.phase = 'command';
    this.commands.clear();
    this.commandQueue = this.aliveParty();
  }

  currentCommander() {
    return (this.commandQueue || []).find(u => u.alive) || null;
  }

  popCommander() {
    while (this.commandQueue && this.commandQueue.length) {
      const u = this.commandQueue.shift();
      if (u.alive) return u;
    }
    return null;
  }

  setCommand(unit, cmd) { this.commands.set(unit, cmd); }

  // ===== 回合结算 =====
  resolveTurn() {
    this.phase = 'resolving';
    const events = [{ type: 'turn', turn: this.turn }];
    const order = this.allUnits().filter(u => u.alive).map(u => ({
      u, s: u.effStat('spd') * (0.95 + Math.random() * 0.1),
    })).sort((a, b) => b.s - a.s).map(o => o.u);

    for (const actor of order) {
      if (!actor.alive) continue;
      actor.defending = false; // 自身回合开始，上回合防御解除
      if (!SE.canAct(actor)) {
        events.push({ type: 'msg', text: `${actor.displayName} 无法行动！` });
      } else {
        const cmd = actor.isChar ? this.commands.get(actor) : this._aiCommand(actor);
        if (cmd) {
          const stop = this._execute(actor, cmd, events);
          if (stop) break; // 战斗已被终结（如逃跑成功），不再结算状态
        }
      }
      // 回合末结算自身状态（持续伤害 + 时长递减），无论本回合是否行动
      if (actor.alive) events.push(...SE.tickTurnEnd(actor));
      if (!actor.alive) events.push({ type: 'die', target: actor });
      if (this._checkEnd(events)) break;
    }
    this.turn++;
    return { events, outcome: this.outcome };
  }

  _execute(actor, cmd, events) {
    this._redirectDeadTargets(actor, cmd, events);
    switch (cmd.kind) {
      case 'attack':
        events.push(...executeSkill(actor, SKILLS.skill_attack, cmd.targets));
        return false;
      case 'skill': {
        const skill = SKILLS[cmd.skillId];
        actor.mp = Math.max(0, actor.mp - (skill.mpCost || 0));
        events.push({ type: 'msg', text: `${actor.displayName} 施展「${skill.name}」！` });
        events.push(...executeSkill(actor, skill, cmd.targets));
        return false;
      }
      case 'item': {
        const def = ITEMS[cmd.itemId];
        if (!this.game.inventory.remove(cmd.itemId, 1)) {
          events.push({ type: 'msg', text: '道具已经用完了……' });
          return false;
        }
        events.push({ type: 'msg', text: `${actor.displayName} 使用了「${def.name}」` });
        for (const t of cmd.targets) {
          const r = this.game.inventory.applyEffect(def, t);
          if (r.hp > 0) events.push({ type: 'heal', actor, target: t, value: r.hp });
          if (r.mp > 0) events.push({ type: 'mpheal', actor, target: t, value: r.mp });
          if (r.cured) events.push({ type: 'cure', actor, target: t, cured: true });
        }
        return false;
      }
      case 'defend':
        actor.defending = true;
        events.push({ type: 'msg', text: `${actor.displayName} 摆出防御姿态` });
        return false;
      case 'flee': {
        if (!this.canFlee) {
          events.push({ type: 'msg', text: '逃不掉！' });
          return false;
        }
        const spd = Math.max(...this.aliveParty().map(u => u.effStat('spd')));
        const esp = Math.max(...this.aliveEnemies().map(u => u.effStat('spd')));
        if (Math.random() < F.fleeChance(spd, esp)) {
          events.push({ type: 'msg', text: '成功逃走了！' });
          this.outcome = 'fled';
          return true;
        }
        events.push({ type: 'msg', text: '逃跑失败！' });
        return false;
      }
    }
    return false;
  }

  // 指令阶段锁定的目标，在按速度结算时可能已被队友抢先击杀。
  // 单体敌方指令（普攻/单体技能）不应白白落空：执行前改锁其他存活敌人
  _redirectDeadTargets(actor, cmd, events) {
    if (cmd.kind !== 'attack' && cmd.kind !== 'skill') return;
    if (cmd.kind === 'skill') {
      const skill = SKILLS[cmd.skillId];
      if (!skill || (skill.target || 'one_enemy') !== 'one_enemy') return;
    }
    cmd.targets = cmd.targets.map(t => {
      if (t.alive) return t;
      const alt = this.aliveEnemies()[0];
      if (!alt) return t;
      events.push({ type: 'msg', text: `${t.displayName} 已倒下，${actor.displayName} 将目标转向 ${alt.displayName}！` });
      return alt;
    });
  }

  _checkEnd(events) {
    if (this.outcome) return true;
    if (this.aliveEnemies().length === 0) {
      this.outcome = 'victory';
      events.push({ type: 'end', outcome: 'victory' });
      return true;
    }
    if (this.aliveParty().length === 0) {
      this.outcome = 'defeat';
      events.push({ type: 'end', outcome: 'defeat' });
      return true;
    }
    return false;
  }

  // ===== 敌方 AI =====
  _aiCommand(actor) {
    const party = this.aliveParty();
    if (!party.length) return { kind: 'defend' };
    const pickTarget = () => party[(Math.random() * party.length) | 0];
    const skills = (actor.source.skills || []).map(id => SKILLS[id]).filter(Boolean);
    const usable = skills.filter(s => (s.mpCost || 0) <= actor.mp);
    const dmgSkills = usable.filter(s => !s.heal && !s.cure && !s.buff);
    const statusSkills = usable.filter(s => s.addStatus);
    const ai = actor.source.ai || 'animal';
    const rnd = Math.random();

    if (ai === 'boss') {
      const weiya = skills.find(s => s.id === 'e_weiya');
      if (weiya && this.turn <= 2 && rnd < 0.8) return { kind: 'skill', skillId: weiya.id, targets: [pickTarget()] };
      const shehun = usable.find(s => s.id === 'e_shehun');
      if (shehun && this.turn % 3 === 0) return { kind: 'skill', skillId: shehun.id, targets: [pickTarget()] };
      if (actor.hp < actor.maxHp() * 0.5) {
        const aoe = usable.find(s => s.target === 'all_enemies');
        if (aoe && rnd < 0.5) return { kind: 'skill', skillId: aoe.id, targets: party.slice() };
      }
      const strong = [...dmgSkills].sort((a, b) => (b.power || 1) - (a.power || 1))[0];
      if (strong && rnd < 0.7) return { kind: 'skill', skillId: strong.id, targets: [pickTarget()] };
      return { kind: 'attack', targets: [pickTarget()] };
    }
    if (ai === 'caster') {
      if (statusSkills.length && rnd < 0.35) {
        return { kind: 'skill', skillId: statusSkills[0].id, targets: [pickTarget()] };
      }
      if (dmgSkills.length && rnd < 0.75) {
        const s = dmgSkills[(Math.random() * dmgSkills.length) | 0];
        return { kind: 'skill', skillId: s.id, targets: [pickTarget()] };
      }
      return { kind: 'attack', targets: [pickTarget()] };
    }
    if (ai === 'aggressive') {
      if (dmgSkills.length && rnd < 0.5) {
        const s = [...dmgSkills].sort((a, b) => (b.power || 1) - (a.power || 1))[0];
        return { kind: 'skill', skillId: s.id, targets: [pickTarget()] };
      }
      return { kind: 'attack', targets: [pickTarget()] };
    }
    // animal
    if (dmgSkills.length && rnd < 0.25) return { kind: 'skill', skillId: dmgSkills[0].id, targets: [pickTarget()] };
    return { kind: 'attack', targets: [pickTarget()] };
  }

  // ===== 胜利结算 =====
  applyVictory() {
    const game = this.game;
    const avgLv = game.party.reduce((s, c) => s + c.level, 0) / game.party.length;
    let exp = 0, gold = 0;
    const drops = [];
    for (const u of this.enemyUnits) {
      exp += F.expFor(u.source.exp, u.source.level, avgLv);
      gold += Math.floor(u.source.gold * (0.9 + Math.random() * 0.2));
      for (const d of u.source.drops || []) {
        if (Math.random() < d.chance) drops.push(d.id);
      }
    }
    const levelUps = [];
    for (const c of game.party) {
      const res = c.gainExp(exp);
      if (res.levels > 0 || res.realmUps.length > 0) {
        // 升级/突破的全恢复同步回战斗单位，避免 syncBack 用战斗残血覆盖
        const u = this.partyUnits.find(p => p.source === c);
        if (u) { u.hp = u.maxHp(); u.mp = u.maxMp(); }
      }
      if (res.levels > 0 || res.realmUps.length > 0) levelUps.push({ char: c, res });
    }
    gold = Math.floor(gold);
    game.addGold(gold);
    for (const id of drops) game.obtainItem(id, 1, true);
    for (const u of this.enemyUnits) game.bus.emit('enemyKilled', { mobId: u.source.id });
    if (this.winFlag) game.setFlag(this.winFlag);
    return { exp, gold, drops, levelUps };
  }

  // 战斗结束：角色数据回写
  finish() {
    for (const u of this.partyUnits) u.syncBack();
  }
}
