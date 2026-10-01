// 主菜单：角色 / 背包 / 任务 / 图鉴 / 存档 / 系统
import ITEMS from '../data/items.js';
import SKILLS from '../data/skills.js';
import MONSTERS from '../data/monsters.js';
import Cultivation from '../systems/Cultivation.js';
import { PanelNav } from '../core/UIPanel.js';
import { sfx } from '../core/Audio.js';
import TitleScene from './TitleScene.js';

const TABS = [
  { id: 'char', name: '角色' },
  { id: 'item', name: '背包' },
  { id: 'quest', name: '任务' },
  { id: 'book', name: '图鉴' },
  { id: 'save', name: '存档' },
  { id: 'sys', name: '系统' },
];

const SLOT_NAMES = { weapon: '武器', armor: '防具', accessory: '饰品' };

export default class MainMenu {
  constructor(game) {
    this.game = game;
    this.tab = 'char';
    this.opened = false;
  }

  open() {
    if (this.opened) return;
    this.opened = true;
    this.tab = 'char';
    this.sub = null;
    if (!this.el) this._buildDom();
    this.el.classList.remove('hidden');
    this.game.ui.pushPanel(this);
    this.render();
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.el.classList.add('hidden');
    this.game.ui.popPanel(this);
  }

  _buildDom() {
    const root = document.createElement('div');
    root.id = 'menu-root';
    root.classList.add('hidden');
    root.innerHTML = `
      <div id="menu-panel" class="panel">
        <div id="menu-tabs"></div>
        <div id="menu-body"><div id="menu-content" class="scroll"></div></div>
        <div id="menu-foot"><span>←/→ 切换页签 · Z 确认 · X 关闭</span><span id="menu-gold"></span></div>
      </div>`;
    document.getElementById('ui-root').appendChild(root);
    this.el = root;
    this.elTabs = root.querySelector('#menu-tabs');
    this.elContent = root.querySelector('#menu-content');
    this.elGold = root.querySelector('#menu-gold');
  }

  // ===== 键盘 =====
  handleKey(action) {
    if (this.subNav) {
      if (action === 'cancel') { this._closeSub(); return true; }
      return this.subNav.handleKey(action);
    }
    if (action === 'left' || action === 'right') {
      const idx = TABS.findIndex(t => t.id === this.tab);
      const next = (idx + (action === 'right' ? 1 : TABS.length - 1)) % TABS.length;
      this.tab = TABS[next].id;
      sfx.play('cursor');
      this.render();
      return true;
    }
    if (action === 'cancel') { sfx.play('cancel'); this.close(); return true; }
    if (this.nav) return this.nav.handleKey(action);
    return true;
  }

  // ===== 渲染 =====
  render() {
    // 页签
    this.elTabs.innerHTML = '';
    for (const t of TABS) {
      const d = document.createElement('div');
      d.className = 'tab' + (t.id === this.tab ? ' active' : '');
      d.textContent = t.name;
      d.addEventListener('click', () => { this.tab = t.id; sfx.play('cursor'); this.render(); });
      this.elTabs.appendChild(d);
    }
    this.elGold.textContent = `金钱 ${this.game.gold} 文`;
    this.elContent.innerHTML = '';
    this.nav = new PanelNav();
    if (this.tab === 'char') this._renderChar();
    else if (this.tab === 'item') this._renderItems();
    else if (this.tab === 'quest') this._renderQuests();
    else if (this.tab === 'book') this._renderBook();
    else if (this.tab === 'save') this._renderSave();
    else this._renderSys();
    this.nav.attachHover();
    this.nav.refresh();
  }

  _btn(label, fn, cls = '') {
    const b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.textContent = label;
    this.nav.items.push({ el: b, onSelect: fn });
    return b;
  }

  // ---- 角色 ----
  _renderChar() {
    const g = this.game;
    for (const c of g.party) {
      const box = document.createElement('div');
      box.style.marginBottom = '14px';
      const st = c.stats();
      const rd = c.realmDef();
      const expNeed = c.expToNext();
      const bt = Cultivation.status(c, g.inventory);

      const skillRows = c.skills.map(id => {
        const s = SKILLS[id];
        if (!s) return '';
        return `<div class="skill-row"><span>${s.name}</span><span class="s-cost">${s.mpCost ? s.mpCost + ' 灵力' : '—'}</span></div>`;
      }).join('');

      const slots = ['weapon', 'armor', 'accessory'].map(slot => {
        const itemId = c.equipment[slot];
        const def = itemId ? ITEMS[itemId] : null;
        return `<div class="slot-row"><span>${SLOT_NAMES[slot]}：${def ? def.name : '——'}</span></div>`;
      }).join('');

      box.innerHTML = `
        <div class="char-head">
          <img src="${this._portrait(c.portraitKey)}" alt="">
          <div>
            <div class="c-name">${c.name}</div>
            <div class="c-realm">${rd.name} · Lv${c.level}</div>
            <div class="c-lv">经验 ${c.exp}/${expNeed}</div>
          </div>
        </div>
        <div class="bar exp"><div class="fill" style="width:${Math.min(100, (c.exp / expNeed) * 100)}%"></div></div>
        <div class="stat-grid">
          <span class="sk">气血</span><span class="sv">${c.hp}/${st.maxHp}</span>
          <span class="sk">灵力</span><span class="sv">${c.mp}/${st.maxMp}</span>
          <span class="sk">速度</span><span class="sv">${st.spd}</span>
          <span class="sk">攻击</span><span class="sv">${st.atk}</span>
          <span class="sk">防御</span><span class="sv">${st.def}</span>
          <span class="sk"></span><span class="sv"></span>
          <span class="sk">灵攻</span><span class="sv">${st.matk}</span>
          <span class="sk">灵防</span><span class="sv">${st.mdef}</span>
          <span class="sk"></span><span class="sv"></span>
        </div>
        <div class="sec-title">功法</div>${skillRows}
        <div class="sec-title">装备</div>${slots}`;
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;';
      for (const slot of ['weapon', 'armor', 'accessory']) {
        const b = this._btn(`换${SLOT_NAMES[slot]}`, () => this._openEquipSub(c, slot));
        btnRow.appendChild(b);
      }
      if (bt.next) {
        const label = bt.ok
          ? `尝试突破 → ${bt.next.name}（${Math.round(bt.next.rate * 100)}%）`
          : bt.reason === 'level'
            ? `突破 ${bt.next.name}（需 Lv${bt.next.levelReq}）`
            : `突破 ${bt.next.name}（需${this.game.itemName(bt.next.pill)}）`;
        const b = this._btn(label, () => {
          if (!bt.ok) { this.game.ui.toast(bt.reason === 'level' ? '等级不足，无法突破' : `缺少${this.game.itemName(bt.next.pill)}`); return; }
          this.game.ui.confirm(
            `消耗 ${this.game.itemName(bt.next.pill)}×1，冲击${bt.next.name}？\n成功率 ${Math.round(bt.next.rate * 100)}%，失败丹药不返。`,
            () => {
              const r = Cultivation.attempt(c, g.inventory, g.bus);
              if (r.success) {
                g.ui.toast(`${c.name} 突破成功！境界提升至「${r.realm.name}」`);
              } else {
                g.ui.toast(`${c.name} 突破失败……灵气反噬，丹药已耗。`);
              }
              this.render();
            });
        });
        btnRow.appendChild(b);
      }
      box.appendChild(btnRow);
      this.elContent.appendChild(box);
      const hr = document.createElement('div');
      hr.style.cssText = 'border-top:1px dashed rgba(212,175,55,0.25);margin:4px 0 10px;';
      this.elContent.appendChild(hr);
    }
    this.nav.setItems(this.nav.items);
  }

  _portrait(key) {
    const cv = this.game.assets.get(key);
    return cv ? cv.toDataURL() : '';
  }

  _openEquipSub(char, slot) {
    const g = this.game;
    const candidates = g.inventory.entries().filter(e => e.def.type === 'equipment' && e.def.slot === slot);
    const current = char.equipment[slot];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;background:rgba(8,6,4,0.96);padding:10px 14px;overflow-y:auto;';
    const title = document.createElement('div');
    title.className = 'sec-title';
    title.textContent = `更换${SLOT_NAMES[slot]}（${char.name}）`;
    wrap.appendChild(title);
    const nav = new PanelNav({ onCancel: () => this._closeSub() });
    const addBtn = (label, fn) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.style.cssText = 'display:flex;justify-content:space-between;width:100%;margin-bottom:4px;';
      b.innerHTML = `<span>${label}</span>`;
      b.addEventListener('mouseenter', () => { nav.items.forEach((it, i) => it.el === b && (nav.idx = i)); nav.refresh(); });
      nav.items.push({ el: b, onSelect: fn });
      wrap.appendChild(b);
    };
    for (const e of candidates) {
      addBtn(`${e.def.name} ×${e.count}（${this._bonusText(e.def)}）`, () => {
        const r = g.equipment.equip(char, e.id, g.inventory);
        g.ui.toast(r.ok ? `${char.name} 装备了 ${e.def.name}` : r.msg);
        this._closeSub();
        this.render();
      });
    }
    if (current) {
      addBtn(`卸下「${ITEMS[current].name}」`, () => {
        const r = g.equipment.unequip(char, slot, g.inventory);
        g.ui.toast(r.ok ? '已卸下装备' : r.msg);
        this._closeSub();
        this.render();
      });
    }
    addBtn('返回', () => this._closeSub());
    nav.refresh();
    nav.attachHover();
    this.elContent.parentElement.style.position = 'relative';
    this.elContent.parentElement.appendChild(wrap);
    this.subNav = nav;
    this.subEl = wrap;
  }

  _bonusText(def) {
    if (!def.bonus) return '';
    const names = { maxHp: '气血', maxMp: '灵力', atk: '攻', def: '防', matk: '灵攻', mdef: '灵防', spd: '速' };
    return Object.entries(def.bonus).map(([k, v]) => `${names[k] || k}+${v}`).join(' ');
  }

  _closeSub() {
    if (this.subEl) { this.subEl.remove(); this.subEl = null; }
    this.subNav = null;
  }

  // ---- 背包 ----
  _renderItems() {
    const g = this.game;
    const entries = g.inventory.entries();
    if (!entries.length) {
      this.elContent.innerHTML = '<div class="inv-empty">行囊空空如也……</div>';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'inv-grid';
    for (const e of entries) {
      const row = document.createElement('div');
      row.className = 'inv-row';
      const icon = g.assets.get(e.def.icon);
      if (icon) {
        const img = document.createElement('canvas');
        img.width = 24; img.height = 24;
        img.style.cssText = 'width:24px;height:24px;image-rendering:pixelated;';
        img.getContext('2d').drawImage(icon, 0, 0);
        row.appendChild(img);
      }
      row.insertAdjacentHTML('beforeend', `
        <span class="i-name">${e.def.name}</span>
        <span class="i-count">×${e.count}</span>
        <span class="i-desc">${e.def.desc || ''}</span>`);
      if (e.def.type === 'consumable') {
        const b = this._btn('使用', () => this._openUseSub(e));
        row.appendChild(b);
      } else if (e.def.type === 'equipment') {
        const b = this._btn('装备', () => this._openEquipMemberSub(e));
        row.appendChild(b);
      }
      grid.appendChild(row);
    }
    this.elContent.appendChild(grid);
    this.nav.setItems(this.nav.items);
  }

  _openUseSub(entry) {
    const g = this.game;
    const wrap = this._subWrap('使用（选择对象）');
    const nav = new PanelNav({ onCancel: () => this._closeSub() });
    for (const c of g.party) {
      const b = document.createElement('button');
      b.className = 'btn';
      b.style.cssText = 'display:flex;justify-content:space-between;width:100%;margin-bottom:4px;';
      b.innerHTML = `<span>${c.name}</span><span>${c.hp}/${c.stats().maxHp}</span>`;
      b.addEventListener('mouseenter', () => { nav.items.forEach((it, i) => it.el === b && (nav.idx = i)); nav.refresh(); });
      nav.items.push({
        el: b,
        onSelect: () => {
          const r = g.inventory.use(entry.id, c);
          g.ui.toast(r.ok ? `${c.name}：${r.msg}` : r.msg);
          this._closeSub();
          this.render();
        },
      });
      wrap.appendChild(b);
    }
    this._finishSub(wrap, nav);
  }

  _openEquipMemberSub(entry) {
    const g = this.game;
    const wrap = this._subWrap(`装备 ${entry.def.name}（选择对象）`);
    const nav = new PanelNav({ onCancel: () => this._closeSub() });
    for (const c of g.party) {
      const b = document.createElement('button');
      b.className = 'btn';
      b.style.cssText = 'display:flex;justify-content:space-between;width:100%;margin-bottom:4px;';
      b.innerHTML = `<span>${c.name}</span><span>当前${SLOT_NAMES[entry.def.slot]}：${c.equipment[entry.def.slot] ? ITEMS[c.equipment[entry.def.slot]].name : '无'}</span>`;
      b.addEventListener('mouseenter', () => { nav.items.forEach((it, i) => it.el === b && (nav.idx = i)); nav.refresh(); });
      nav.items.push({
        el: b,
        onSelect: () => {
          const r = g.equipment.equip(c, entry.id, g.inventory);
          g.ui.toast(r.ok ? `${c.name} 装备了 ${entry.def.name}` : r.msg);
          this._closeSub();
          this.render();
        },
      });
      wrap.appendChild(b);
    }
    this._finishSub(wrap, nav);
  }

  _subWrap(title) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;background:rgba(8,6,4,0.96);padding:10px 14px;overflow-y:auto;';
    const t = document.createElement('div');
    t.className = 'sec-title';
    t.textContent = title;
    wrap.appendChild(t);
    this.elContent.parentElement.style.position = 'relative';
    return wrap;
  }

  _finishSub(wrap, nav) {
    this.elContent.parentElement.appendChild(wrap);
    nav.refresh();
    nav.attachHover();
    this.subNav = nav;
    this.subEl = wrap;
  }

  // ---- 任务 ----
  _renderQuests() {
    const g = this.game;
    const stateNames = { available: '可接取', active: '进行中', ready: '可交付', completed: '已完成' };
    let any = false;
    const quests = g.quests.all();
    for (const q of quests) {
      const st = g.quests.get(q.id);
      if (st.state === 'locked') continue;
      any = true;
      const box = document.createElement('div');
      box.className = 'quest-item';
      const objs = q.objectives.map(o => {
        const os = g.quests.objectiveState(q.id, o);
        const mark = os.done && !o.final ? '✔ ' : o.final && st.state === 'completed' ? '✔ ' : '';
        const prog = os.need > 1 ? ` ${os.cur}/${os.need}` : '';
        return `<div class="q-obj ${os.done && !o.final ? 'done' : ''}">${mark}${o.text}${prog}</div>`;
      }).join('');
      const rewards = [];
      if (q.rewards.exp) rewards.push(`经验+${q.rewards.exp}`);
      if (q.rewards.gold) rewards.push(`金钱+${q.rewards.gold}`);
      for (const it of q.rewards.items || []) rewards.push(`${g.itemName(it.id)}×${it.count}`);
      box.innerHTML = `
        <div class="q-title"><span>【${q.type === 'main' ? '主线' : '支线'}】${q.name}</span><span class="q-state">${stateNames[st.state] || ''}</span></div>
        <div class="q-obj" style="color:#a89878;">${q.intro || ''}</div>
        ${objs}
        <div class="q-obj" style="color:#8a7a52;">奖励：${rewards.join('　')}</div>`;
      this.elContent.appendChild(box);
    }
    if (!any) this.elContent.innerHTML = '<div class="inv-empty">暂无任务……去青云门找掌门吧。</div>';
    this.nav.setItems([]);
  }

  // ---- 图鉴 ----
  _renderBook() {
    const g = this.game;
    const ELEMENT_CN = { fire: '火', water: '水', ice: '冰', thunder: '雷', dark: '阴', holy: '阳', none: '' };
    const all = Object.values(MONSTERS).filter(m => m && m.id).sort((a, b) => a.level - b.level);
    const seenCount = all.filter(m => g.seenMobs.has(m.id) || g.killsByMob[m.id]).length;
    const head = document.createElement('div');
    head.className = 'sec-title';
    head.style.marginBottom = '8px';
    head.textContent = `妖物图鉴 · 已遭遇 ${seenCount}/${all.length} · 累计除妖 ${g.kills}`;
    this.elContent.appendChild(head);
    for (const m of all) {
      const kills = g.killsByMob[m.id] || 0;
      const seen = g.seenMobs.has(m.id) || kills > 0;
      const box = document.createElement('div');
      box.className = 'quest-item';
      const el = m.element && m.element !== 'none' ? ` · ${ELEMENT_CN[m.element] || m.element}系` : '';
      if (!seen) {
        box.innerHTML = `
          <div class="q-title"><span>？？？</span><span class="q-state">未遭遇</span></div>
          <div class="q-obj" style="color:#5a5040;">Lv?? · 尚未照面的妖物。</div>`;
      } else {
        const bossTag = m.boss ? '<span class="q-state">首领</span>' : '';
        box.innerHTML = `
          <div class="q-title"><span>Lv${m.level} ${m.name}${el}</span><span class="q-state">${kills ? `击杀 ×${kills}` : '已遭遇'}</span>${bossTag}</div>
          <div class="q-obj" style="color:#a89878;">${m.desc || ''}</div>`;
      }
      this.elContent.appendChild(box);
    }
    this.nav.setItems([]);
  }

  // ---- 存档 ----
  _renderSave() {
    const g = this.game;
    for (const slot of g.save.slots()) {
      const m = g.save.meta(slot);
      const row = document.createElement('div');
      row.className = 'slot-row-big';
      const info = !m ? '—— 空 ——'
        : m.incompatible ? `【旧版本存档】· ${new Date(m.savedAt).toLocaleString('zh-CN')}（版本不符，无法读取）`
        : `${m.name} Lv${m.level} · ${m.realm} · ${m.mapName} · ${new Date(m.savedAt).toLocaleString('zh-CN')}`;
      row.innerHTML = `
        <div class="s-info">
          <div class="s-title">存档 ${slot}</div>
          <div>${info}</div>
        </div>`;
      const bSave = this._btn('存档', () => {
        const doSave = () => {
          const ok = g.save.save(slot, g.serialize());
          g.ui.toast(ok ? `已存入档位 ${slot}` : '存档失败');
          this.render();
        };
        // 档位上已有存档（含不兼容旧档）时先确认再覆盖
        if (m) g.ui.confirm(`档位 ${slot} 已有存档，覆盖？`, doSave);
        else doSave();
      });
      const bLoad = this._btn('读档', () => {
        if (!m) { g.ui.toast('该档位为空'); return; }
        if (m.incompatible) { g.ui.toast('存档版本不兼容，无法读取'); return; }
        g.ui.confirm(`读取档位 ${slot}？当前进度将丢失。`, () => {
          const data = g.save.load(slot);
          if (!data) { g.ui.toast('读取存档失败'); return; }
          this.close();
          g.applySave(data);
        });
      });
      const bDel = this._btn('删除', () => {
        if (!m) { g.ui.toast('该档位为空'); return; }
        g.ui.confirm(`删除档位 ${slot} 的存档？此操作不可恢复。`, () => {
          g.save.delete(slot);
          g.ui.toast(`已删除档位 ${slot}`);
          this.render();
        });
      });
      row.appendChild(bSave);
      row.appendChild(bLoad);
      row.appendChild(bDel);
      this.elContent.appendChild(row);
    }
    this.nav.setItems(this.nav.items);
  }

  // ---- 系统 ----
  _renderSys() {
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;flex-direction:column;gap:8px;max-width:260px;margin:10px auto;';
    // 音量档位（关/低/中/高），独立于存档持久化在 localStorage
    box.appendChild(this._btn(`音乐音量：${sfx.musicVolName()}`, () => { sfx.cycleMusicVol(); sfx.play('confirm'); this.render(); }));
    box.appendChild(this._btn(`音效音量：${sfx.sfxVolName()}`, () => { sfx.cycleSfxVol(); sfx.play('confirm'); this.render(); }));
    const b1 = this._btn('操作说明', () => this.game.ui.openHelp());
    const b2 = this._btn('返回标题画面', () => {
      this.game.ui.confirm('返回标题？（未存档的进度将丢失）', () => {
        this.close();
        this.game.scenes.replace(new TitleScene());
      });
    });
    const b3 = this._btn('关闭菜单', () => this.close());
    box.appendChild(b1); box.appendChild(b2); box.appendChild(b3);
    this.elContent.appendChild(box);
    this.nav.setItems(this.nav.items);
  }
}
