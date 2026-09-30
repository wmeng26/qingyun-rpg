// 任务管理：状态机 locked→available→active→ready→completed，监听 EventBus 推进
// ready（可交付）为正式状态：对话脚本的 {quest:{state:'ready'}} 交付分支依赖它
import QUESTS from '../data/quests.js';

export default class QuestManager {
  constructor(game) {
    this.game = game;
    this.states = {};
    for (const id of Object.keys(QUESTS)) {
      this.states[id] = { state: 'locked', progress: {} };
    }
    this.refreshAvailability();
    this.bind();
  }

  def(id) { return QUESTS[id]; }

  get(id) { return this.states[id]; }

  all() { return Object.values(QUESTS); }

  // ===== 事件推进 =====
  bind() {
    const bus = this.game.bus;
    // bus.on 返回解绑函数，收集起来供重建（新游戏/读档）时退订
    this._unbinders = [
      bus.on('enemyKilled', ({ mobId }) => this.notifyKill(mobId)),
      bus.on('flagSet', ({ flag }) => this.notifyFlag(flag)),
      bus.on('breakthrough', () => this.notifyRealm()),
      bus.on('itemObtained', () => this.notifyItem()),
      bus.on('joinAlly', () => this.notifyItem()),
    ];
  }

  unbind() {
    for (const off of this._unbinders || []) off();
    this._unbinders = [];
  }

  refreshAvailability() {
    for (const [id, st] of Object.entries(this.states)) {
      if (st.state !== 'locked') continue;
      const q = QUESTS[id];
      const ok = !q.requires || this.states[q.requires]?.state === 'completed';
      if (ok) st.state = 'available';
    }
  }

  accept(id) {
    const st = this.states[id];
    if (!st || st.state !== 'available') return;
    st.state = 'active';
    st.progress = {};
    this.refreshAvailability();
    this.game.bus.emit('questAccepted', { id });
    this.game.ui.toast(`接受任务「${QUESTS[id].name}」`);
    // 补检：接受前已发生的事件（境界/物品/旗标）可能已满足目标
    this.notifyRealm();
    this.notifyFlag('');
    this.notifyItem();
  }

  // 击杀目标
  notifyKill(mobId) {
    for (const [qid, st] of Object.entries(this.states)) {
      if (st.state !== 'active') continue;
      for (const obj of QUESTS[qid].objectives) {
        if (obj.type === 'kill' && obj.target === mobId) {
          st.progress.kill = st.progress.kill || {};
          st.progress.kill[obj.target] = (st.progress.kill[obj.target] || 0) + 1;
        }
      }
      this.checkReady(qid);
    }
  }

  // 与 NPC 交谈：推进 talk 目标。交付不在此自动结算，统一由对话脚本的
  // completeQuest 动作在「可交付」分支里执行，保证奖励剧情正常播放
  notifyTalk(npcId) {
    for (const [qid, st] of Object.entries(this.states)) {
      if (st.state !== 'active') continue;
      const q = QUESTS[qid];
      for (const obj of q.objectives) {
        if (obj.type === 'talk' && !obj.final && obj.target === npcId) {
          st.progress.talk = st.progress.talk || {};
          st.progress.talk[obj.target] = true;
        }
      }
      this.checkReady(qid);
    }
  }

  notifyFlag(flag) {
    for (const [qid, st] of Object.entries(this.states)) {
      if (st.state !== 'active') continue;
      for (const obj of QUESTS[qid].objectives) {
        if (obj.type === 'flag' && (obj.flag === flag || this.game.flags.has(obj.flag))) {
          st.progress.flag = st.progress.flag || {};
          st.progress.flag[obj.flag] = true;
        }
      }
      this.checkReady(qid);
    }
  }

  notifyRealm() {
    const hero = this.game.party[0];
    if (!hero) return;
    for (const [qid, st] of Object.entries(this.states)) {
      if (st.state !== 'active') continue;
      for (const obj of QUESTS[qid].objectives) {
        if (obj.type === 'realm') {
          const need = obj.value; // 如 'zhuji'
          const rd = hero.realmDef();
          if (rd.id === need || rd.tier === need) {
            st.progress.realm = st.progress.realm || {};
            st.progress.realm[need] = true;
          }
        }
      }
      this.checkReady(qid);
    }
  }

  notifyItem() {
    const inv = this.game.inventory;
    for (const [qid, st] of Object.entries(this.states)) {
      // ready 也要参与：物品被用掉/卖掉后，可交付状态需要回退
      if (st.state !== 'active' && st.state !== 'ready') continue;
      let changed = false;
      for (const obj of QUESTS[qid].objectives) {
        if (obj.type === 'item') {
          st.progress.item = st.progress.item || {};
          const cur = inv.count(obj.target);
          if (st.progress.item[obj.target] !== cur) { st.progress.item[obj.target] = cur; changed = true; }
        }
      }
      if (changed) {
        // 物品数量跌破目标：可交付状态回退为进行中，避免挂着永远无法交付的 ready
        if (st.state === 'ready' && !this.nonFinalDone(qid)) st.state = 'active';
        this.checkReady(qid);
      }
    }
  }

  // ===== 目标状态 =====
  objectiveState(qid, obj) {
    const st = this.states[qid];
    const p = st.progress || {};
    switch (obj.type) {
      case 'kill': {
        const cur = p.kill?.[obj.target] || 0;
        return { done: cur >= obj.count, cur: Math.min(cur, obj.count), need: obj.count };
      }
      case 'talk':
        return { done: obj.final ? false : !!p.talk?.[obj.target], cur: 0, need: 1 };
      case 'item': {
        const cur = this.game.inventory.count(obj.target);
        return { done: cur >= obj.count, cur: Math.min(cur, obj.count), need: obj.count };
      }
      case 'flag':
        return { done: !!p.flag?.[obj.flag], cur: 0, need: 1 };
      case 'realm':
        return { done: !!p.realm?.[obj.value], cur: 0, need: 1 };
      default:
        return { done: false, cur: 0, need: 1 };
    }
  }

  nonFinalDone(qid) {
    const q = QUESTS[qid];
    return q.objectives.filter(o => !o.final).every(o => this.objectiveState(qid, o).done);
  }

  checkReady(qid) {
    const st = this.states[qid];
    if (st.state !== 'active') return;
    if (this.nonFinalDone(qid)) {
      st.state = 'ready';
      this.game.bus.emit('questReady', { id: qid });
      this.game.ui.toast(`任务「${QUESTS[qid].name}」可以交付了`);
    }
  }

  // ===== 交付结算 =====
  complete(qid) {
    const st = this.states[qid];
    const q = QUESTS[qid];
    if (st.state !== 'active' && st.state !== 'ready') return;

    // 收集类目标先校验数量：物品在接取后可能被用掉/卖掉，不足则阻断交付
    //（不改状态、不扣物品、不发奖励），防止「少交也算完成」的刷奖励漏洞
    for (const obj of q.objectives) {
      if (obj.type === 'item' && this.game.inventory.count(obj.target) < obj.count) {
        this.game.ui.toast(`缺少${this.game.itemName(obj.target)}×${obj.count}，无法交付`);
        return;
      }
    }
    st.state = 'completed';

    // 收集类目标：交付时扣除物品（校验已通过，必然成功）
    for (const obj of q.objectives) {
      if (obj.type === 'item') this.game.inventory.remove(obj.target, obj.count);
    }

    const r = q.rewards || {};
    const lines = [];
    if (r.exp) {
      for (const c of this.game.party) {
        const res = c.gainExp(r.exp);
        if (res.levels > 0) this.game.bus.emit('levelUp', { char: c, res });
      }
      lines.push(`经验+${r.exp}`);
    }
    if (r.gold) { this.game.addGold(r.gold); lines.push(`金钱+${r.gold}`); }
    for (const it of r.items || []) {
      this.game.obtainItem(it.id, it.count, true);
      lines.push(`${this.game.itemName(it.id)}×${it.count}`);
    }
    this.refreshAvailability();
    this.game.setFlag(`${qid}_done`);
    this.game.bus.emit('questCompleted', { id: qid });
    this.game.ui.toast(`完成任务「${q.name}」 ${lines.join(' ')}`);

    if (r.action === 'chapterEnd') {
      setTimeout(() => this.game.ui.chapterEnd(r.chapter || 1), 600);
    }
  }

  // HUD 追踪（主任务优先，各取第一条未完成目标；可交付任务单独提示）
  trackerLines() {
    const lines = [];
    const actives = Object.keys(QUESTS).filter(id => ['active', 'ready'].includes(this.states[id].state));
    actives.sort((a, b) => (QUESTS[a].type === 'main' ? -1 : 1) - (QUESTS[b].type === 'main' ? -1 : 1));
    for (const qid of actives) {
      const q = QUESTS[qid];
      if (this.states[qid].state === 'ready') {
        lines.push({ qid, qname: q.name, text: '可交付', ready: true });
        if (lines.length >= 2) break;
        continue;
      }
      const obj = q.objectives.find(o => !o.final && !this.objectiveState(qid, o).done);
      if (!obj) continue;
      const os = this.objectiveState(qid, obj);
      let text = obj.text;
      if (os.need > 1) text += ` ${os.cur}/${os.need}`;
      lines.push({ qid, qname: q.name, text });
      if (lines.length >= 2) break;
    }
    return lines;
  }

  serialize() {
    const o = {};
    for (const [id, st] of Object.entries(this.states)) o[id] = { state: st.state, progress: st.progress };
    return o;
  }

  deserialize(o) {
    for (const [id, st] of Object.entries(o || {})) {
      if (this.states[id]) this.states[id] = { state: st.state, progress: st.progress || {} };
    }
    this.refreshAvailability();
  }
}
