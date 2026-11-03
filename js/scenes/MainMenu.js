// 主菜单骨架：页签路由 + 公共 DOM/子面板/按钮设施
// 各页签的具体渲染在 js/scenes/menu/*.js，新增页签只需加一个模块并登记进 RENDERERS
import ITEMS from '../data/items.js';
import { weaponTypeName, weaponTypeUsers } from '../systems/Equipment.js';
import { PanelNav } from '../core/UIPanel.js';
import { sfx } from '../core/Audio.js';
import { esc } from '../core/dom.js';
import { getPlus, costOf, displayName as forgeName, refine as forgeRefine } from '../systems/Forge.js';
import { SLOT_NAMES } from './menu/shared.js';
import { renderChar } from './menu/charTab.js';
import { renderItems } from './menu/itemTab.js';
import { renderQuests } from './menu/questTab.js';
import { renderBook } from './menu/bookTab.js';
import { renderSave } from './menu/saveTab.js';
import { renderSys } from './menu/sysTab.js';

const TABS = [
  { id: 'char', name: '角色' },
  { id: 'item', name: '背包' },
  { id: 'quest', name: '任务' },
  { id: 'book', name: '图鉴' },
  { id: 'save', name: '存档' },
  { id: 'sys', name: '系统' },
];

const RENDERERS = {
  char: renderChar, item: renderItems, quest: renderQuests,
  book: renderBook, save: renderSave, sys: renderSys,
};

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
    const touch = this.game.input.touch;
    const root = document.createElement('div');
    root.id = 'menu-root';
    root.classList.add('hidden');
    root.innerHTML = `
      <div id="menu-panel" class="panel">
        <div id="menu-tabs"></div>
        <div id="menu-body"><div id="menu-content" class="scroll"></div></div>
        <div id="menu-foot"><span>${touch ? '点页签切换 · 点按钮确认' : '←/→ 切换页签 · Z 确认 · X 关闭'}</span><span class="foot-right"><span id="menu-gold"></span><button class="btn" id="menu-close">✕ 关闭</button></span></div>
      </div>`;
    document.getElementById('ui-root').appendChild(root);
    this.el = root;
    this.elTabs = root.querySelector('#menu-tabs');
    this.elContent = root.querySelector('#menu-content');
    this.elGold = root.querySelector('#menu-gold');
    // 触屏下虚拟 B 键随面板隐藏，页脚的「✕ 关闭」是唯一常驻的关闭入口
    root.querySelector('#menu-close').addEventListener('click', () => { sfx.play('cancel'); this.close(); });
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
    this._closeSub();
    this.nav = new PanelNav();
    RENDERERS[this.tab](this);
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

  // ===== 公共设施（供各页签模块调用） =====
  _portrait(key) {
    const cv = this.game.assets.get(key);
    return cv ? cv.toDataURL() : '';
  }

  _bonusText(def) {
    if (!def.bonus) return '';
    const names = { maxHp: '气血', maxMp: '灵力', atk: '攻', def: '防', matk: '灵攻', mdef: '灵防', spd: '速' };
    return Object.entries(def.bonus).map(([k, v]) => `${names[k] || k}+${v}`).join(' ');
  }

  // 武器门类的适用角色名（未入队的也算，提示「这把刀归洛清霜」）
  _wtypeUserNames(wtype) { return weaponTypeUsers(wtype); }

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

  _closeSub() {
    if (this.subEl) { this.subEl.remove(); this.subEl = null; }
    this.subNav = null;
  }

  // ---- 子面板：换装（角色页） ----
  _openEquipSub(char, slot) {
    const g = this.game;
    // 武器按门类绑定角色：只列出该角色能用的装备
    const candidates = g.inventory.entries().filter(e =>
      e.def.type === 'equipment' && e.def.slot === slot && g.equipment.canEquip(char, e.def).ok);
    const current = char.equipment[slot];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;background:rgba(8,6,4,0.96);padding:10px 14px;overflow-y:auto;';
    const title = document.createElement('div');
    title.className = 'sec-title';
    const wtTag = slot === 'weapon' ? ` · ${weaponTypeName(char.def.wtype)}系` : '';
    title.textContent = `更换${SLOT_NAMES[slot]}（${char.name}${wtTag}）`;
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
      addBtn(`${esc(e.def.name)} ×${e.count}（${esc(this._bonusText(e.def))}）`, () => {
        const r = g.equipment.equip(char, e.id, g.inventory);
        g.ui.toast(r.ok ? `${char.name} 装备了 ${e.def.name}` : r.msg);
        this._closeSub();
        this.render();
      });
    }
    if (current) {
      addBtn(`卸下「${esc(ITEMS[current].name)}」`, () => {
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

  // ---- 子面板：装备淬炼（角色页） ----
  _openForgeSub(char) {
    const g = this.game;
    const wrap = this._subWrap(`淬炼装备（${char.name}）`);
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
    for (const slot of ['weapon', 'armor', 'accessory']) {
      const id = char.equipment[slot];
      const def = id ? ITEMS[id] : null;
      if (!def) { addBtn(`${SLOT_NAMES[slot]}：未装备`, () => g.ui.toast('该部位没有装备')); continue; }
      const plus = getPlus(id);
      const cost = costOf(plus);
      const label = cost
        ? `${SLOT_NAMES[slot]}：${esc(forgeName(def))} → +${plus + 1}（金${cost.gold} · 玄晶${cost.count}）`
        : `${SLOT_NAMES[slot]}：${esc(forgeName(def))}（已至极限 +${plus}）`;
      addBtn(label, () => {
        if (!cost) { g.ui.toast('已至极限，无可再淬'); return; }
        const r = forgeRefine(g, id);
        if (!r.ok) { g.ui.toast(r.msg); return; }
        sfx.play('confirm');
        g.ui.toast(`${def.name} 淬炼至 +${r.plus}`);
        this._closeSub();
        this._openForgeSub(char);
      });
    }
    addBtn('返回', () => this._closeSub());
    this._finishSub(wrap, nav);
  }

  // ---- 子面板：使用道具（背包页） ----
  _openUseSub(entry) {
    const g = this.game;
    const wrap = this._subWrap('使用（选择对象）');
    const nav = new PanelNav({ onCancel: () => this._closeSub() });
    for (const c of g.party) {
      const b = document.createElement('button');
      b.className = 'btn';
      b.style.cssText = 'display:flex;justify-content:space-between;width:100%;margin-bottom:4px;';
      b.innerHTML = `<span>${esc(c.name)}</span><span>${c.hp}/${c.stats().maxHp}</span>`;
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

  // ---- 子面板：指定成员装备（背包页） ----
  _openEquipMemberSub(entry) {
    const g = this.game;
    // 只列出能装备该武器的成员（门类不符的成员不出现）
    const members = g.party.filter(c => g.equipment.canEquip(c, entry.def).ok);
    const wrap = this._subWrap(`装备 ${entry.def.name}（选择对象）`);
    const nav = new PanelNav({ onCancel: () => this._closeSub() });
    for (const c of members) {
      const b = document.createElement('button');
      b.className = 'btn';
      b.style.cssText = 'display:flex;justify-content:space-between;width:100%;margin-bottom:4px;';
      b.innerHTML = `<span>${esc(c.name)}</span><span>当前${SLOT_NAMES[entry.def.slot]}：${c.equipment[entry.def.slot] ? esc(ITEMS[c.equipment[entry.def.slot]].name) : '无'}</span>`;
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
}
