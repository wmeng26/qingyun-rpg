// 对话引擎：DOM 对话框，逐字打印、立绘、选项分支、脚本指令
import DIALOGS from '../data/dialogs.js';
import { BATTLES } from '../data/maps.js';
import { sfx } from '../core/Audio.js';

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
        <button class="dlg-log-btn" title="对话回看（C）">回看</button>
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
    // 回看对话记录（不推进对话）
    root.querySelector('.dlg-log-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.active) return;
      sfx.play('cursor');
      this.openLog();
    });
    // 点击对话框推进（触屏 / 鼠标）；选项按钮与回看按钮自行处理点击，冒泡到此需忽略
    root.querySelector('.dlg-box').addEventListener('click', (e) => {
      if (!this.active) return;
      if (e.target.closest('.dlg-choices') || e.target.closest('.dlg-log-btn')) return;
      sfx.play('advance');
      this._advance();
    });
    // 会话级对话记录（回看用，跨对话保留，不随存档持久化）
    this._log = [];
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
    this._holdT = 0; // 按住快进的推进计时归零
    // 会话记录（回看用）
    if (node.text) {
      this._log.push({ speaker: node.speaker || '', text: node.text });
      if (this._log.length > 80) this._log.shift();
    }
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
    this._lastBlip = 0;
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
      b.addEventListener('mouseenter', () => { if (this._navIdx !== i) sfx.play('cursor'); this._navIdx = i; this._refreshChoices(); });
      b.addEventListener('click', () => { this._navIdx = i; sfx.play('confirm'); this._pickChoice(); });
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
    const holding = this.game.input.isDown('confirm');
    if (this.typing) {
      // 按住确认键：打字机 ×5 速快进
      this._typed += dt * TYPE_SPEED * (holding ? 5 : 1);
      if (this._typed >= this._fullText.length) this._typed = this._fullText.length;
      // 打字机音：每 3 字一声，音量很低（快进时不播，避免连成噪音）
      if (!holding) {
        const idx = Math.floor(this._typed);
        if (idx - this._lastBlip >= 3) { this._lastBlip = idx; sfx.play('text'); }
      }
      this._renderText();
    } else if (holding && !this._choicesShown && !this.node.choices) {
      // 持续按住：文本完毕后稍停即自动推进（有选项的节点必须手动选择）
      this._holdT += dt;
      if (this._holdT >= 0.16) { this._holdT = 0; this._advance(); }
    } else {
      this._holdT = 0;
    }
  }

  handleKey(action) {
    if (!this.active) return false;
    if (action === 'log') { this.openLog(); return true; }
    if (this._choicesShown) {
      if (action === 'up') { this._navIdx = (this._navIdx + this._choiceDefs.length - 1) % this._choiceDefs.length; sfx.play('cursor'); this._refreshChoices(); return true; }
      if (action === 'down') { this._navIdx = (this._navIdx + 1) % this._choiceDefs.length; sfx.play('cursor'); this._refreshChoices(); return true; }
      if (action === 'confirm') { sfx.play('confirm'); this._pickChoice(); return true; }
      if (action === 'cancel') { sfx.play('cancel'); this.close(); return true; }
      return true; // 吞掉其它键
    }
    if (action === 'confirm' || action === 'cancel') { sfx.play('advance'); this._advance(); return true; }
    return true; // 对话期间吞掉方向键
  }

  // 对话回看：本会话最近 40 条，C 键或对话框「回看」按钮打开
  openLog() {
    if (this._logOpen || !this.active) return;
    this._logOpen = true;
    const root = document.createElement('div');
    root.id = 'dlg-log';
    const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rows = this._log.slice(-40).map(e => e.speaker
      ? `<div class="log-entry"><span class="lg-name">${esc(e.speaker)}：</span>${esc(e.text)}</div>`
      : `<div class="log-entry narration">${esc(e.text)}</div>`).join('');
    root.innerHTML = `
      <div id="dlg-log-panel" class="panel">
        <div class="panel-title">对话回看</div>
        <div class="dlg-log-body scroll">${rows || '<div class="log-entry narration">（暂无对话记录）</div>'}</div>
        <div style="text-align:center;padding:0 0 10px;"><button class="btn dlg-log-close">关闭（X / C）</button></div>
      </div>`;
    document.getElementById('ui-root').appendChild(root);
    const body = root.querySelector('.dlg-log-body');
    body.scrollTop = body.scrollHeight; // 定位到最新一条
    const close = () => {
      if (!this._logOpen) return;
      this._logOpen = false;
      this._logCloser = null;
      root.remove();
      this.game.ui.popPanel(this._logPanelObj);
    };
    this._logCloser = close;
    root.querySelector('.dlg-log-close').addEventListener('click', close);
    root.addEventListener('click', (e) => { if (e.target === root) close(); }); // 点遮罩关闭
    this._logPanelObj = {
      handleKey: (a) => {
        if (a === 'confirm' || a === 'cancel' || a === 'log') { close(); return true; }
        return true; // 回看打开期间吞掉其它键
      },
    };
    this.game.ui.pushPanel(this._logPanelObj);
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
    if (this._logCloser) this._logCloser(); // 回看面板尚开着则一并收掉
    this.el.classList.add('hidden');
    this.game.ui.popPanel(this);
    this.game.bus.emit('dialogFinished', { id: this.scriptId });
    const deferred = this.deferred;
    this.deferred = [];
    if (this.onDone) { const f = this.onDone; this.onDone = null; f(); }
    for (const fn of deferred) fn();
  }
}
