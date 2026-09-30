// 可入队角色：等级/经验/境界/技能/装备 → 实际属性计算
import CHARACTERS from '../data/characters.js';
import REALMS from '../data/realms.js';
import BALANCE from '../data/balance.js';
import SKILLS from '../data/skills.js';

const STAT_KEYS = ['maxHp', 'maxMp', 'atk', 'def', 'matk', 'mdef', 'spd'];

export class Character {
  constructor(defId) {
    this.def = CHARACTERS[defId] || CHARACTERS.hero;
    this.id = this.def.id;
    this.level = 1;
    this.exp = 0;
    this.realmId = 'lianqi_1';
    this.skills = [...this.def.initialSkills];
    this.equipment = { weapon: null, armor: null, accessory: null };
    this.hp = 1; this.mp = 1;
    this.fullHeal();
  }

  get name() { return this.def.name; }
  get spriteKey() { return this.def.sprite; }
  get battleSpriteKey() { return this.def.battleSprite; }
  get portraitKey() { return this.def.portrait; }

  expToNext(level = this.level) {
    return Math.floor(BALANCE.exp.base * Math.pow(level, BALANCE.exp.pow));
  }

  realmDef() { return REALMS.byId(this.realmId); }

  baseStat(key) { return Math.max(1, Math.floor(this.def.growth[key](this.level))); }

  equipBonus() {
    const bonus = {};
    for (const slot of Object.keys(this.equipment)) {
      const itemId = this.equipment[slot];
      if (!itemId) continue;
      // 延迟引入避免循环依赖：items 是纯数据
      const def = this._itemDef(itemId);
      if (!def || !def.bonus) continue;
      for (const [k, v] of Object.entries(def.bonus)) bonus[k] = (bonus[k] || 0) + v;
    }
    return bonus;
  }

  _itemDef(itemId) {
    // 纯数据查找（data 之间无依赖问题）
    return itemsTable()[itemId];
  }

  // 实际属性 = 基础 × 境界系数 + 装备固定值
  stats() {
    const f = this.realmDef().factor;
    const eq = this.equipBonus();
    const out = {};
    for (const k of STAT_KEYS) {
      out[k] = Math.floor(this.baseStat(k) * f) + (eq[k] || 0);
    }
    return out;
  }

  fullHeal() {
    const s = this.stats();
    this.hp = s.maxHp; this.mp = s.maxMp;
  }

  hpPct() { return this.hp / Math.max(1, this.stats().maxHp); }

  // 与战斗 Unit 同构的访问器：Inventory.applyEffect 按 duck-typing 调用
  maxHp() { return this.stats().maxHp; }
  maxMp() { return this.stats().maxMp; }

  // 返回 {levels, newSkills[], realmUps[]}
  gainExp(n) {
    const res = { levels: 0, newSkills: [], realmUps: [] };
    if (this.level >= BALANCE.exp.cap) return res;
    this.exp += n;
    while (this.level < BALANCE.exp.cap && this.exp >= this.expToNext()) {
      this.exp -= this.expToNext();
      this.level++;
      res.levels++;
    }
    if (res.levels > 0) this.fullHeal();
    // 炼气期自动突破层数（境界提升，气血充盈）
    let guard = 0;
    while (guard++ < 20) {
      const next = REALMS.nextOf(this.realmId);
      if (!next || !next.auto || this.level < next.levelReq) break;
      this.realmId = next.id;
      res.realmUps.push(next);
      res.newSkills.push(...this.learnSkillsForRealm(next.id));
      this.fullHeal();
    }
    return res;
  }

  // 学会该境界解锁的全部本命技能（去重），返回新学列表。
  // 技能表的 owner 标明归属角色；无 owner 的为公共技能
  learnSkillsForRealm(realmId = this.realmId) {
    const learned = [];
    for (const s of Object.values(SKILLS)) {
      if (s.kind === 'active' && s.learnRealm === realmId
        && (!s.owner || s.owner === this.id) && !this.skills.includes(s.id)) {
        this.skills.push(s.id);
        learned.push(s);
      }
    }
    return learned;
  }

  // 按境界链补齐当前境界及之前应学未学的全部技能（入队回填用）
  syncSkills() {
    const learned = [];
    let idx = REALMS.realms.findIndex(r => r.id === this.realmId);
    if (idx < 0) idx = REALMS.realms.length - 1;
    for (let i = 0; i <= idx; i++) {
      learned.push(...this.learnSkillsForRealm(REALMS.realms[i].id));
    }
    return learned;
  }

  serialize() {
    return {
      id: this.id, name: this.name, level: this.level, exp: this.exp, realmId: this.realmId,
      hp: this.hp, mp: this.mp, skills: [...this.skills], equipment: { ...this.equipment },
      realmName: this.realmDef().name,
    };
  }

  static deserialize(d) {
    const c = new Character(d.id);
    // 存档数值归一化：手工编辑或损坏的档位不得让 undefined/NaN 沿属性链扩散
    c.level = Math.max(1, Math.min(BALANCE.exp.cap, Number(d.level) || 1));
    c.exp = Math.max(0, Math.floor(Number(d.exp) || 0));
    c.realmId = REALMS.byId(d.realmId).id;
    c.skills = [...(d.skills || [])];
    c.equipment = { ...c.equipment, ...(d.equipment || {}) };
    const s = c.stats();
    const hp = Number(d.hp), mp = Number(d.mp);
    c.hp = Number.isFinite(hp) ? Math.min(hp, s.maxHp) : s.maxHp;
    c.mp = Number.isFinite(mp) ? Math.min(mp, s.maxMp) : s.maxMp;
    return c;
  }
}

// 延迟加载道具表（避免 systems 与 data 的循环依赖顾虑——data 本就是叶子）
import ITEMS from '../data/items.js';
function itemsTable() { return ITEMS; }
