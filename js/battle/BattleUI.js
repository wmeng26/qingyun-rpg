// 战斗 UI：DOM 指令面板 + 事件队列播放（伤害飘字/闪白/震屏由 Renderer 呈现）
import SKILLS from '../data/skills.js';
import { PanelNav } from '../core/UIPanel.js';
import { sfx } from '../core/Audio.js';

const EVENT_WAIT = {
  turn: 0.3, msg: 0.5, dmg: 0.55, miss: 0.5, heal: 0.6, mpheal: 0.5,
  cure: 0.5, status: 0.55, dot: 0.5, die: 0.6, end: 0.15,
};

const ELEMENT_CN = { fire: '火', water: '水', ice: '冰', thunder: '雷', dark: '阴', holy: '阳', poison: '毒' };

export default class BattleUI {
  constructor(game, engine, onEnd) {
    this.game = game;
    this.engine = engine;
    this.onEnd = onEnd;
    this.queue = [];
    this.timers = [];
    this.waitT = 0;
    this.pendingOutcome = null;
    this.phase = 'intro';
    this.menuStack = [];
    this._buildDom();
    this._buildCards();
  }

  // ================= DOM =================
  _buildDom() {
    const root = document.createElement('div');
    root.id = 'battle-ui';
    root.innerHTML = `
      <div id="battle-log"></div>
      <div id="battle-turn"></div>
      <div id="party-cards"></div>
      <div id="cmd-panel" class="panel hidden">
        <div class="panel-title"></div>
        <div id="cmd-body"></div>
        <div id="cmd-desc"></div>
        <div class="cmd-hint">${this.game.input.touch ? '点击选项行动' : 'Z/回车 确认 · X 取消'}</div>
      </div>
      <div id="battle-result" class="panel hidden">
        <div class="panel-title"></div>
        <div class="res-body"></div>
        <div class="res-actions"><button class="btn res-ok">确认</button></div>
      </div>`;
    document.getElementById('ui-root').appendChild(root);
    this.el = root;
    this.elLog = root.querySelector('#battle-log');
    this.elTurn = root.querySelector('#battle-turn');
    this.elCards = root.querySelector('#party-cards');
    this.elCmd = root.querySelector('#cmd-panel');
    this.elCmdTitle = this.elCmd.querySelector('.panel-title');
    this.elCmdBody = this.elCmd.querySelector('#cmd-body');
    this.elCmdDesc = this.elCmd.querySelector('#cmd-desc');
    this.elResult = root.querySelector('#battle-result');
    this.elResultTitle = this.elResult.querySelector('.panel-title');
    this.elResultBody = this.elResult.querySelector('.res-body');
  }

  destroy() { this.el.remove(); }

  _buildCards() {
    this.elCards.innerHTML = '';
    this.cardEls = [];
    for (const u of this.engine.partyUnits) {
      const card = document.createElement('div');
      card.className = 'pcard';
      card.innerHTML = `
        <div class="p-name"><span class="n"></span><span class="lv"></span></div>
        <div class="bar hp"><div class="fill"></div></div>
        <div class="bar-nums"><span class="hpn"></span><span class="mpn"></span></div>
        <div class="bar mp"><div class="fill"></div></div>
        <div class="statuses"></div>`;
      this.elCards.appendChild(card);
      this.cardEls.push({ u, el: card });
    }
  }

  refreshCards() {
    for (const { u, el } of this.cardEls) {
      const maxHp = u.maxHp(), maxMp = u.maxMp();
      el.classList.toggle('dead', !u.alive);
      el.classList.toggle('active', this.phase === 'command' && this.engine.currentCommander() === u);
      el.querySelector('.n').textContent = u.displayName;
      el.querySelector('.lv').textContent = `Lv${u.level}`;
      const hpFill = el.querySelector('.bar.hp .fill');
      hpFill.style.width = `${(u.hp / maxHp) * 100}%`;
      el.querySelector('.bar.hp').classList.toggle('low', u.hp / maxHp < 0.3);
      el.querySelector('.hpn').textContent = `${u.hp}/${maxHp}`;
      el.querySelector('.bar.mp .fill').style.width = `${(u.mp / Math.max(1, maxMp)) * 100}%`;
      el.querySelector('.mpn').textContent = `灵力 ${u.mp}/${maxMp}`;
      const st = el.querySelector('.statuses');
      st.innerHTML = '';
      for (const s of u.statuses) {
        const tag = document.createElement('span');
        tag.className = 'st-tag' + (s.def.isDebuff ? '' : ' buff');
        tag.textContent = s.def.name;
        tag.title = s.def.desc || s.def.name;
        st.appendChild(tag);
      }
    }
  }

  log(text) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = text;
    this.elLog.appendChild(line);
    while (this.elLog.children.length > 4) this.elLog.removeChild(this.elLog.firstChild);
  }

  // ================= 事件播放 =================
  play(events, outcome) {
    this.phase = 'playing';
    this.pendingOutcome = outcome;
    this.queue = [...events];
    this.elCmd.classList.add('hidden');
  }

  startLunge(unit) { if (unit) unit._lungeT = 0.0001; }
  flash(unit) { if (unit) unit._flashT = 0.15; }

  _floater(unit, text, color, size) {
    if (!unit) return;
    this.game.renderer.addFloater(text, unit.bx + 24, unit.by - 6, { color, size: size || 11 });
  }

  _processEvent(e) {
    switch (e.type) {
      case 'turn':
        this.elTurn.textContent = `第 ${e.turn} 回合`;
        break;
      case 'msg':
        this.log(e.text);
        break;
      case 'dmg': {
        this.startLunge(e.actor);
        this.timers.push({ t: 0.16, fn: () => {
          this.flash(e.target);
          sfx.play(e.crit ? 'crit' : 'attack');
          const col = e.crit ? '#ffb347' : e.eff === 'strong' ? '#ff9080' : e.eff === 'weak' ? '#9fb8c8' : '#ffffff';
          this._floater(e.target, `-${e.value}`, col, e.crit ? 14 : 11);
          if (e.crit || e.value > e.target.maxHp() * 0.15) this.game.renderer.shakeFor(0.2);
          let suffix = e.crit ? '（会心！）' : '';
          if (e.eff === 'strong') suffix += '效果绝佳！';
          if (e.eff === 'weak') suffix += '收效甚微…';
          this.log(`${e.actor.displayName} 对 ${e.target.displayName} 造成 ${e.value} 点伤害${suffix}`);
        } });
        break;
      }
      case 'miss':
        this.startLunge(e.actor);
        this.timers.push({ t: 0.16, fn: () => {
          sfx.play('miss');
          this._floater(e.target, 'MISS', '#b8b8b8', 10);
          this.log(`${e.actor.displayName} 的攻击被 ${e.target.displayName} 避开了！`);
        } });
        break;
      case 'heal':
        sfx.play('heal');
        this._floater(e.target, `+${e.value}`, '#9ed37f', 12);
        this.log(`${e.target.displayName} 恢复了 ${e.value} 点气血`);
        break;
      case 'mpheal':
        sfx.play('mpheal');
        this._floater(e.target, `+${e.value}灵力`, '#8fc3e8', 10);
        break;
      case 'cure':
        if (e.cured) { sfx.play('buff'); this._floater(e.target, '异常解除', '#e8d44c', 10); }
        break;
      case 'status': {
        const def = SKILLS[e.statusId];
        if (e.applied) {
          sfx.play(def && def.isDebuff ? 'debuff' : 'buff');
          this._floater(e.target, def ? def.name : '状态', def && def.isDebuff ? '#e0968c' : '#a8d08c', 10);
          this.log(`${e.target.displayName} 陷入了「${def ? def.name : e.statusId}」`);
        } else {
          sfx.play('resist');
          this._floater(e.target, '抵抗', '#b8b8b8', 10);
          this.log(`${e.target.displayName} 抵抗住了…`);
        }
        break;
      }
      case 'dot':
        sfx.play('dot');
        this.flash(e.target);
        this._floater(e.target, `-${e.value}`, '#c89ae8', 11);
        this.log(`${e.target.displayName} 受到「${e.statusName}」伤害 ${e.value}`);
        break;
      case 'die':
        sfx.play('die');
        e.target._fadeT = 0.5;
        this.log(`${e.target.displayName} 倒下了！`);
        break;
      case 'end':
        break;
    }
  }

  update(dt) {
    // 单位动画计时
    for (const u of [...this.engine.partyUnits, ...this.engine.enemyUnits]) {
      if (u._lungeT > 0) {
        u._lungeT += dt / 0.25;
        if (u._lungeT >= 1) u._lungeT = 0;
      }
      if (u._flashT > 0) u._flashT -= dt;
      if (u._fadeT > 0) u._fadeT -= dt;
    }
    // 延迟回调
    for (const t of this.timers) t.t -= dt;
    const fired = this.timers.filter(t => t.t <= 0);
    this.timers = this.timers.filter(t => t.t > 0);
    for (const t of fired) t.fn();

    this.refreshCards();

    if (this.phase === 'playing') {
      if (this.waitT > 0) { this.waitT -= dt; return; }
      if (this.queue.length) {
        const e = this.queue.shift();
        this._processEvent(e);
        this.waitT = EVENT_WAIT[e.type] != null ? EVENT_WAIT[e.type] : 0.5;
        return;
      }
      if (this.timers.length) return;
      // 播放完毕
      if (this.pendingOutcome) {
        const outcome = this.pendingOutcome;
        this.pendingOutcome = null;
        this.showResult(outcome);
      } else {
        this.engine.beginTurn();
        this.showCommandRoot();
      }
    }
  }

  // ================= 指令菜单 =================
  // items 的条目可携带 desc 字段：光标指向/悬停该条目时显示在面板底部的说明栏
  _showMenu(title, items, { onCancel = null, vertical = true } = {}) {
    this.elCmd.classList.remove('hidden');
    this.elCmdTitle.textContent = title;
    this.elCmdBody.innerHTML = '';
    this.elCmdDesc.textContent = '';
    // 子菜单（技能/道具/选目标）必须带可见的「返回」：触屏下虚拟 A/B 键在战斗中
    // 隐藏，没有返回键就无法反悔已进入的子菜单（键盘 X 仍走 onCancel 同一路径）
    if (onCancel) {
      const back = document.createElement('button');
      back.className = 'btn back';
      back.textContent = '◀ 返回';
      items = [...items, { el: back, onSelect: onCancel }];
    }
    const nav = new PanelNav({
      onCancel,
      onFocus: (it) => { this.elCmdDesc.textContent = (it && it.desc) || ''; },
    });
    nav.setItems(items);
    nav.attachHover();
    for (const it of items) this.elCmdBody.appendChild(it.el);
    this.nav = nav;
  }

  showCommandRoot() {
    const u = this.engine.currentCommander();
    if (!u) { this._resolveAll(); return; }
    this.phase = 'command';
    const items = [];
    const mk = (label, fn, disabled = false) => {
      const b = document.createElement('button');
      b.className = 'btn' + (disabled ? ' disabled' : '');
      b.textContent = label;
      return { el: b, onSelect: fn, disabled };
    };
    items.push(mk('攻击', () => this._pickTarget('enemy', t => this._commit({ kind: 'attack', targets: [t] }))));
    items.push(mk('技能', () => this._showSkillMenu(u)));
    items.push(mk('道具', () => this._showItemMenu(u)));
    items.push(mk('防御', () => this._commit({ kind: 'defend' })));
    if (this.engine.canFlee) items.push(mk('逃跑', () => this._commit({ kind: 'flee' })));
    this._showMenu(`${u.displayName} · 行动指令`, items, { vertical: true });
  }

  _showSkillMenu(u) {
    const skills = (u.source.skills || u.source.skillsList || []).map(id => SKILLS[id]).filter(Boolean);
    if (!skills.length) { this.showCommandRoot(); return; }
    const items = skills.map(s => {
      const disabled = (s.mpCost || 0) > u.mp;
      const b = document.createElement('button');
      b.className = 'btn' + (disabled ? ' disabled' : '');
      b.innerHTML = `<span>${s.name}</span><span class="cost${disabled ? ' no' : ''}">${s.mpCost ? s.mpCost + ' 灵力' : '—'}</span>`;
      return { el: b, disabled, desc: this._skillDesc(s), onSelect: () => this._skillTarget(u, s) };
    });
    this._showMenu('选择功法', items, { onCancel: () => this.showCommandRoot() });
  }

  // 技能说明：描述 + 属性标注（敌人同样属性的克制规则适用于属性技）
  _skillDesc(s) {
    if (!s) return '';
    let t = s.desc || '';
    if (s.element && ELEMENT_CN[s.element]) t += `（${ELEMENT_CN[s.element]}系）`;
    return t;
  }

  _skillTarget(u, s) {
    const t = s.target || 'one_enemy';
    if (t === 'one_enemy') {
      this._pickTarget('enemy', (tg) => this._commit({ kind: 'skill', skillId: s.id, targets: [tg] }), '选择目标', () => this._showSkillMenu(u));
    } else if (t === 'one_ally') {
      this._pickTarget('ally', (tg) => this._commit({ kind: 'skill', skillId: s.id, targets: [tg] }), '选择目标', () => this._showSkillMenu(u));
    } else if (t === 'all_enemies') {
      this._commit({ kind: 'skill', skillId: s.id, targets: this.engine.aliveEnemies() });
    } else if (t === 'all_allies') {
      this._commit({ kind: 'skill', skillId: s.id, targets: this.engine.aliveParty() });
    } else { // self
      this._commit({ kind: 'skill', skillId: s.id, targets: [u] });
    }
  }

  _showItemMenu(u) {
    const entries = this.game.inventory.entries()
      .filter(e => e.def.type === 'consumable' && !e.def.effect.breakthrough);
    if (!entries.length) {
      const b = document.createElement('div');
      b.style.cssText = 'padding:10px;font-size:12px;color:#a89878;';
      b.textContent = '（没有可用的丹药）';
      this._showMenu('选择道具', [], { onCancel: () => this.showCommandRoot() });
      this.elCmdBody.insertBefore(b, this.elCmdBody.lastChild); // 提示置于返回键上方
      return;
    }
    const items = entries.map(e => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.innerHTML = `<span>${e.def.name}</span><span class="cost">×${e.count}</span>`;
      return { el: b, desc: e.def.desc || '', onSelect: () => {
        this._pickTarget('ally', (tg) => this._commit({ kind: 'item', itemId: e.id, targets: [tg] }), e.def.name, () => this._showItemMenu(u));
      } };
    });
    this._showMenu('选择道具', items, { onCancel: () => this.showCommandRoot() });
  }

  _pickTarget(side, cb, label = '选择目标', onCancel = null) {
    const list = side === 'enemy' ? this.engine.aliveEnemies() : this.engine.aliveParty();
    const items = list.map(u => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.innerHTML = `<span>${u.displayName}</span><span class="cost">${u.hp}/${u.maxHp()}</span>`;
      // 选敌方目标时顺带展示图鉴描述（u.source 即怪物定义）
      const desc = side === 'enemy' ? (u.source.desc || '') : '';
      return { el: b, desc, onSelect: () => cb(u) };
    });
    // 未指定返回目标时回指令根菜单（如「攻击」直达选目标）
    this._showMenu(label, items, { onCancel: onCancel || (() => this.showCommandRoot()) });
  }

  _commit(cmd) {
    const u = this.engine.currentCommander();
    if (!u) return;
    this.engine.setCommand(u, cmd);
    const next = this.engine.popCommander();
    if (next) this.showCommandRoot();
    else this._resolveAll();
  }

  _resolveAll() {
    this.phase = 'playing';
    this.elCmd.classList.add('hidden');
    const { events, outcome } = this.engine.resolveTurn();
    this.play(events, outcome);
  }

  // ================= 结算 =================
  showResult(outcome) {
    this.phase = 'result';
    this.elTurn.textContent = '';
    const game = this.game;
    const eng = this.engine;

    // 结算只能执行一次：鼠标点击与键盘确认是两条独立路径（且空格确认会同时触发
    // click + keydown），重复执行会多跑一次 scenes.pop()，把 MapScene 一并弹掉
    // 导致场景栈清空、永久黑屏。键盘路径必须保留（Z/回车/空格是主要确认方式），
    // 因此不置空 this.nav，而是靠 done 标志去重。
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      sfx.play('confirm');
      this.elResult.querySelector('.res-ok').onclick = null;  // 断开鼠标路径
      this.elResult.classList.add('hidden');
      eng.finish();
      this.onEnd(outcome);
    };
    this.elResult.querySelector('.res-ok').onclick = finish;

    // 结算画面停掉战斗 BGM，播胜负 jingle；回到地图后由 MapScene.onResume 接回地图曲
    sfx.music(null);
    if (outcome === 'victory') {
      sfx.play('victory');
      const r = eng.applyVictory();
      this.elResultTitle.textContent = '—— 战斗胜利 ——';
      const rows = [];
      rows.push(`<div class="res-row"><span>经验</span><span class="v">+${r.exp}</span></div>`);
      rows.push(`<div class="res-row"><span>金钱</span><span class="v">+${r.gold} 文</span></div>`);
      const dropNames = r.drops.map(id => game.itemName(id));
      rows.push(`<div class="res-row"><span>掉落</span><span class="v">${dropNames.length ? dropNames.join('、') : '无'}</span></div>`);
      for (const { char, res } of r.levelUps) {
        rows.push(`<div class="lvup">★ ${char.name} 升至 Lv${char.level}</div>`);
        for (const rd of res.realmUps) rows.push(`<div class="lvup">★ ${char.name} 境界突破：${rd.name}！</div>`);
        for (const sk of res.newSkills) rows.push(`<div class="lvup">★ ${char.name} 学会「${sk.name}」</div>`);
      }
      this.elResultBody.innerHTML = rows.join('');
      if (r.levelUps.length) sfx.play('levelup');
      if (r.levelUps.some(({ res }) => res.realmUps.length)) sfx.play('breakthrough');
    } else if (outcome === 'fled') {
      sfx.play('flee');
      this.elResultTitle.textContent = '—— 逃跑成功 ——';
      this.elResultBody.innerHTML = '<div style="color:#a89878;">你狼狈地脱离了战斗……</div>';
    } else {
      sfx.play('defeat');
      this.elResultTitle.textContent = '—— 队伍覆灭 ——';
      this.elResultBody.innerHTML = '<div style="color:#e0968c;">眼前一黑，不省人事……</div>';
    }
    this.elResult.classList.remove('hidden');
    // 键盘确认
    this.nav = { handleKey: (action) => { if (action === 'confirm' || action === 'cancel') { finish(); return true; } return true; } };
  }

  // ================= 键盘路由 =================
  handleKey(action) {
    if (this.phase === 'command' && this.nav) return this.nav.handleKey(action);
    if (this.phase === 'playing') return true; // 播放中吞键
    if (this.phase === 'result' && this.nav) return this.nav.handleKey(action);
    if (this.phase === 'intro') return true;
    return false;
  }
}
