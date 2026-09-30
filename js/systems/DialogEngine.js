// 对话引擎：DOM 对话框，逐字打印、立绘、选项分支、脚本指令
import DIALOGS from '../data/dialogs.js';
import { BATTLES } from '../data/maps.js';

const TYPE_SPEED = 34; // 字/秒

export default class DialogEngine {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.script = null;
    this.node = null;
    this.deferred = [];
    this._buildDom();
  }

  _buildDom() {
    const root = document.createElement('div');
    root.id = 'dialog';
    root.classList.add('hidden');
    root.innerHTML = `
      <div class="dlg-box panel">
        <div class="dlg-name"></div>
        <canvas class="dlg-portrait" width="32" height="32"></canvas>
        <div class="dlg-text"></div>
        <div class="dlg-next">▼</div>
        <div class="dlg-choices"></div>
      </div>`;
    document.getElementById('ui-root').appendChild(root);
    this.el = root;
    this.elName = root.querySelector('.dlg-name');
    this.elPortrait = root.querySelector('.dlg-portrait');
    this.elText = root.querySelector('.dlg-text');
    this.elNext = root.querySelector('.dlg-next');
    this.elChoices = root.querySelector('.dlg-choices');
  }

  start(scriptId, { onDone } = {}) {
    const script = DIALOGS[scriptId];
    if (!script) { console.warn('对话脚本不存在:', scriptId); onDone && onDone(); return; }
    this.script = script;
    this.scriptId = scriptId;
    this.onDone = onDone;
    this.deferred = [];
    this.active = true;
    this._navIdx = 0;
    this.el.classList.remove('hidden');
    this.game.ui.pushPanel(this);
    this._goto(script.entry, 0);
  }

  get typing() { return this._typed < this._fullText.length; }

  _goto(nodeId, depth = 0) {
    if (!nodeId || depth > 12) { this.close(); return; }
    const node = this.script.nodes[nodeId];
    if (!node) { console.warn('对话节点不存在:', nodeId); this.close(); return; }
    this.node = node;
    this.nodeId = nodeId;

    // 进入节点动作
    if (node.actions) this._runActions(node.actions);

    // 分支：取第一个满足条件的 next
    let next = node.next ?? null;
    if (node.branch) {
      for (const b of node.branch) {
        if (this._evalCond(b.cond)) { next = b.next; break; }
      }
    }

    const text = node.text || '';
    if (!text && !node.choices) {
      this._goto(next, depth + 1); // 纯路由节点直接跳过
      return;
    }
    this._pendingNext = next;
    this._showNode(node);
  }

  _showNode(node) {
    // 立绘
    const p = this.game.assets.get(node.portrait || '');
    if (p) {
      this.elPortrait.classList.remove('hidden');
      const ctx = this.elPortrait.getContext('2d');
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(p, 0, 0);
    } else {
      this.elPortrait.classList.add('hidden');
    }
    // 说话人
    if (node.speaker) {
      this.elName.textContent = node.speaker;
      this.elName.classList.remove('hidden');
      this.elText.classList.remove('narrator');
    } else {
      this.elName.classList.add('hidden');
      this.elText.classList.add('narrator');
    }
    // 逐字
    this._fullText = node.text || '';
    this._typed = 0;
    this.elText.textContent = '';
    this.elNext.classList.add('hidden');
    this.elChoices.innerHTML = '';
    this.elChoices.classList.add('hidden');
    this._choicesShown = false;
  }

  _showChoices() {
    this._choicesShown = true;
    this.elNext.classList.add('hidden');
    const choices = (this.node.choices || []).filter(c => !c.cond || this._evalCond(c.cond));
    this._choiceDefs = choices;
    this.elChoices.innerHTML = '';
    this.elChoices.classList.remove('hidden');
    choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = c.text;
      b.addEventListener('mouseenter', () => { this._navIdx = i; this._refreshChoices(); });
      b.addEventListener('click', () => { this._navIdx = i; this._pickChoice(); });
      this.elChoices.appendChild(b);
    });
    this._navIdx = 0;
    this._refreshChoices();
  }

  _refreshChoices() {
    [...this.elChoices.children].forEach((el, i) => el.classList.toggle('focus', i === this._navIdx));
  }

  _pickChoice() {
    const c = this._choiceDefs[this._navIdx];
    if (!c) return;
    if (c.actions) this._runActions(c.actions);
    this.elChoices.innerHTML = '';
    if (c.next) this._goto(c.next);
    else this.close();
  }

  _advance() {
    if (this.typing) {
      this._typed = this._fullText.length;
      this._renderText();
      return;
    }
    if (this._choicesShown) return; // 必须选择
    if (this.node.choices) { this._showChoices(); return; }
    if (this._pendingNext) this._goto(this._pendingNext);
    else this.close();
  }

  _renderText() {
    const shown = this._fullText.slice(0, Math.floor(this._typed));
    this.elText.textContent = shown;
    if (!this.typing && !this._choicesShown) {
      if (this.node.choices) this.elNext.classList.add('hidden');
      else this.elNext.classList.remove('hidden');
    }
  }

  update(dt) {
    if (!this.active || !this.node) return;
    if (this.typing) {
      this._typed += dt * TYPE_SPEED;
      if (this._typed >= this._fullText.length) this._typed = this._fullText.length;
      this._renderText();
    }
  }

  handleKey(action) {
    if (!this.active) return false;
    if (this._choicesShown) {
      if (action === 'up') { this._navIdx = (this._navIdx + this._choiceDefs.length - 1) % this._choiceDefs.length; this._refreshChoices(); return true; }
      if (action === 'down') { this._navIdx = (this._navIdx + 1) % this._choiceDefs.length; this._refreshChoices(); return true; }
      if (action === 'confirm') { this._pickChoice(); return true; }
      if (action === 'cancel') { this.close(); return true; }
      return true; // 吞掉其它键
    }
    if (action === 'confirm' || action === 'cancel') { this._advance(); return true; }
    return true; // 对话期间吞掉方向键
  }

  _evalCond(cond) {
    const g = this.game;
    if (!cond) return true;
    if (cond.all) return cond.all.every(c => this._evalCond(c));
    if (cond.any) return cond.any.some(c => this._evalCond(c));
    if (cond.quest) {
      const st = g.quests.get(cond.quest.id);
      return !!st && st.state === cond.quest.state;
    }
    if (cond.flag !== undefined) return g.flags.has(cond.flag);
    if (cond.flagAbsent !== undefined) return !g.flags.has(cond.flagAbsent);
    if (cond.realm) {
      const rd = g.party[0] && g.party[0].realmDef();
      return !!rd && (rd.id === cond.realm || rd.tier === cond.realm);
    }
    if (cond.item) return g.inventory.count(cond.item.id) >= (cond.item.count || 1);
    if (cond.ally) return g.party.some(c => c.id === cond.ally);
    return true;
  }

  _runActions(actions) {
    for (const a of actions || []) {
      switch (a.do) {
        case 'startQuest': this.game.quests.accept(a.id); break;
        case 'completeQuest': this.game.quests.complete(a.id); break;
        case 'giveItem': this.game.obtainItem(a.id, a.count || 1); break;
        case 'giveGold': this.game.addGold(a.gold || a.n || 0); break;
        case 'setFlag': this.game.setFlag(a.flag); break;
        case 'joinAlly': this.game.joinParty(a.id); break;
        case 'healFull':
          this.game.party.forEach(c => c.fullHeal());
          this.game.ui.toast('众人伤势尽复');
          break;
        case 'openShop': this.deferred.push(() => this.game.ui.openShop()); break;
        case 'startBattle': {
          const def = BATTLES[a.id];
          if (def) this.deferred.push(() => this.game.startBattle(def));
          else console.warn('战斗定义不存在:', a.id);
          break;
        }
        case 'chapterEnd': this.deferred.push(() => this.game.ui.chapterEnd(a.chapter || 1)); break;
        case 'storyBreakthrough': this.deferred.push(() => this.game.storyBreakthrough()); break;
        default: console.warn('未知对话动作:', a.do);
      }
    }
  }

  close() {
    if (!this.active) return;
    this.active = false;
    this.el.classList.add('hidden');
    this.game.ui.popPanel(this);
    this.game.bus.emit('dialogFinished', { id: this.scriptId });
    const deferred = this.deferred;
    this.deferred = [];
    if (this.onDone) { const f = this.onDone; this.onDone = null; f(); }
    for (const fn of deferred) fn();
  }
}
