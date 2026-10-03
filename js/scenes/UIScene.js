// UI 总管（非场景栈成员）：HUD / Toast / 菜单 / 商店 / 确认框 / 帮助 / 章节结算
import ITEMS from '../data/items.js';
import SHOPS from '../data/shops.js';
import MainMenu from './MainMenu.js';
import { weaponTypeName, weaponTypeUsers } from '../systems/Equipment.js';
import { PanelNav } from '../core/UIPanel.js';
import { sfx } from '../core/Audio.js';

// 出售回收价：统一按商店价折半（任务品 price=0 不可卖）
const SELL_RATE = 0.5;

// 各章结算文案
const CHAPTER_CN = ['一', '二', '三', '四', '五'];
const CHAPTER_SUBS = {
  1: '青云山重归太平，而江湖路才刚刚开始……',
  2: '黑风寨已平，然密信之上，「血煞教」三字触目惊心……',
  3: '百年魔教一朝倾覆，元婴初成——而「血煞之上」的影子，才刚刚显现……',
  4: '魔主既灭，封印重铸。千年血债清偿，天下自此太平。\n然庆功宴上，一封新的密报正快马赶来……',
  5: '赤渊既灭，千年血祭终成灰烬。仙途无尽，大道未央。\n——全剧情终（真结局），感谢游玩！',
};

export default class UIScene {
  constructor(game) {
    this.game = game;
    this.panelStack = [];
    this.activePanel = null;
    this._hudT = 0;
    this.menu = new MainMenu(game);
  }

  init() {
    const root = document.getElementById('ui-root');
    this.root = root;

    this.elHud = document.createElement('div');
    this.elHud.id = 'hud';
    this.elHud.classList.add('hidden');
    root.appendChild(this.elHud);

    this.elRight = document.createElement('div');
    this.elRight.id = 'hud-right';
    this.elRight.classList.add('hidden');
    this.elRight.innerHTML = '<div id="hud-mapname"></div><div id="hud-gold"></div>';
    root.appendChild(this.elRight);

    this.elTracker = document.createElement('div');
    this.elTracker.id = 'hud-tracker';
    this.elTracker.classList.add('hidden');
    root.appendChild(this.elTracker);

    this.elHint = document.createElement('div');
    this.elHint.id = 'hud-hint';
    this.elHint.classList.add('hidden');
    this.elHint.textContent = game.input.touch ? 'A 交互 · B 菜单' : 'Z 交互 · X 菜单';
    root.appendChild(this.elHint);

    this.elToasts = document.createElement('div');
    this.elToasts.id = 'toast-area';
    root.appendChild(this.elToasts);
  }

  // ===== 面板栈（键盘路由） =====
  get modalOpen() {
    return !!this.activePanel || (this.game.dialog && this.game.dialog.active);
  }
  hasModal() { return this.modalOpen; }

  pushPanel(p) {
    this.panelStack.push(p);
    this.activePanel = p;
  }

  popPanel(p) {
    const i = this.panelStack.indexOf(p);
    if (i >= 0) this.panelStack.splice(i, 1);
    this.activePanel = this.panelStack[this.panelStack.length - 1] || null;
  }

  // ===== HUD =====
  showHUD(b) {
    for (const el of [this.elHud, this.elRight, this.elTracker, this.elHint]) {
      el.classList.toggle('hidden', !b);
    }
  }

  setMapName(n) {
    this.elRight.querySelector('#hud-mapname').textContent = n;
  }

  // 右下操作提示（面向 NPC 时由 MapScene 切换为交谈提示）
  setHint(text) {
    if (this.elHint && this.elHint.textContent !== text) this.elHint.textContent = text;
  }

  toast(text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    this.elToasts.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2400);
    setTimeout(() => t.remove(), 2750);
    while (this.elToasts.children.length > 5) this.elToasts.removeChild(this.elToasts.firstChild);
  }

  tick(dt) {
    this._hudT -= dt;
    if (this._hudT > 0) return;
    this._hudT = 0.3;
    if (this.elHud.classList.contains('hidden')) return;
    const g = this.game;
    // 队伍状态
    this.elHud.innerHTML = g.party.map(c => {
      const st = c.stats();
      return `<div class="hud-card">
        <div class="name-row"><span class="name">${c.name}</span><span class="lv">${c.realmDef().name} Lv${c.level}</span></div>
        <div class="bars">
          <div class="bar hp ${c.hp / st.maxHp < 0.3 ? 'low' : ''}"><div class="fill" style="width:${(c.hp / st.maxHp) * 100}%"></div></div>
          <div class="bar mp"><div class="fill" style="width:${(c.mp / Math.max(1, st.maxMp)) * 100}%"></div></div>
        </div>
        <div class="bar-nums">${c.hp}/${st.maxHp} · 灵${c.mp}/${st.maxMp}</div>
      </div>`;
    }).join('');
    this.elRight.querySelector('#hud-gold').textContent = `金钱 ${g.gold} 文`;
    const lines = g.quests ? g.quests.trackerLines() : [];
    this.elTracker.innerHTML = lines.map(l =>
      `<div><span class="q-name">【${l.qname}】</span><div class="q-obj">${l.text}</div></div>`).join('')
      || '<div class="q-obj">（暂无进行中的任务）</div>';
  }

  // ===== 商店 =====
  // 购买/出售双页签。shopId 对应 js/data/shops.js；缺省打开青云门杂货摊（兼容旧调用）
  openShop(shopId = 'shop_qingyun') {
    if (this.shopOpen) return;
    const shop = SHOPS[shopId] || SHOPS.shop_qingyun;
    this.shopOpen = true;
    const g = this.game;
    const touch = g.input.touch;
    const root = document.createElement('div');
    root.id = 'shop-root';
    root.innerHTML = `
      <div id="shop-panel" class="panel">
        <div class="panel-title">${shop.name}</div>
        <div class="shop-tabs">
          <button class="btn shop-tab" data-tab="buy">购买</button>
          <button class="btn shop-tab" data-tab="sell">出售</button>
        </div>
        <div class="goods scroll" id="shop-goods"></div>
        <div class="shop-gold" id="shop-gold"></div>
        <div class="shop-foot">
          <span class="shop-hint">${touch ? '点页签切换 · 点按钮买卖' : '←/→ 换页签 · Z 买卖 · X 打烊'}</span>
          <button class="btn" id="shop-close">打烊</button>
        </div>
      </div>`;
    this.root.appendChild(root);
    this.elShop = root;
    const nav = new PanelNav({ onCancel: () => this.closeShop() });
    const goods = root.querySelector('#shop-goods');
    const goldEl = root.querySelector('#shop-gold');
    const tabBtns = [...root.querySelectorAll('.shop-tab')];
    this._shopTab = 'buy';

    const bonusText = (def) => {
      const wt = def.slot === 'weapon' ? ` <span class="i-bonus">（${weaponTypeName(def.wtype)} · ${weaponTypeUsers(def.wtype)}专用）</span>` : '';
      if (!def.bonus) return wt;
      const names = { maxHp: '气血', maxMp: '灵力', atk: '攻', def: '防', matk: '灵攻', mdef: '灵防', spd: '速' };
      return `${wt} <span class="i-bonus">（${Object.entries(def.bonus).map(([k, v]) => `${names[k] || k}+${v}`).join(' ')}）</span>`;
    };
    const addIcon = (row, icon) => {
      const cv = g.assets.get(icon);
      if (!cv) return;
      const img = document.createElement('canvas');
      img.width = 24; img.height = 24;
      img.style.cssText = 'width:24px;height:24px;image-rendering:pixelated;';
      img.getContext('2d').drawImage(cv, 0, 0);
      row.appendChild(img);
    };
    const sellPrice = (def) => Math.floor(def.price * SELL_RATE);

    const renderList = () => {
      goldEl.textContent = `金钱 ${g.gold} 文`;
      goods.innerHTML = '';
      nav.items = [];
      if (this._shopTab === 'buy') {
        for (const id of shop.goods) {
          const def = ITEMS[id];
          const row = document.createElement('div');
          row.className = 'inv-row';
          addIcon(row, def.icon);
          const owned = g.inventory.count(id);
          row.insertAdjacentHTML('beforeend', `
            <span class="i-name">${def.name}</span>
            <span class="i-count">${def.price}文</span>
            <span class="i-desc">${def.desc || ''}${bonusText(def)}${owned ? ` <span class="i-bonus">（持有×${owned}）</span>` : ''}</span>`);
          const b = document.createElement('button');
          b.className = 'btn' + (g.gold < def.price ? ' disabled' : '');
          b.textContent = '购买';
          row.appendChild(b);
          goods.appendChild(row);
          nav.items.push({
            el: b, disabled: g.gold < def.price,
            onSelect: () => {
              if (g.gold < def.price) { g.ui.toast('钱不够……'); return; }
              g.addGold(-def.price);
              g.obtainItem(id, 1, true);
              sfx.play('gold');
              g.ui.toast(`买下了「${def.name}」`);
              renderList();
            },
          });
        }
      } else {
        const entries = g.inventory.entries().filter(e => e.def.price > 0 && e.def.type !== 'quest');
        if (!entries.length) goods.innerHTML = '<div class="inv-empty">行囊里没有能出手的物件。</div>';
        for (const e of entries) {
          const row = document.createElement('div');
          row.className = 'inv-row';
          addIcon(row, e.def.icon);
          row.insertAdjacentHTML('beforeend', `
            <span class="i-name">${e.def.name}</span>
            <span class="i-count">×${e.count}</span>
            <span class="i-desc">${sellPrice(e.def)}文/件${bonusText(e.def)}</span>`);
          const b = document.createElement('button');
          b.className = 'btn';
          b.textContent = '卖出';
          row.appendChild(b);
          goods.appendChild(row);
          nav.items.push({
            el: b,
            onSelect: () => {
              if (!g.inventory.remove(e.id, 1)) return;
              const got = sellPrice(e.def);
              g.addGold(got);
              sfx.play('gold');
              g.ui.toast(`卖出「${e.def.name}」，得 ${got} 文`);
              renderList();
            },
          });
        }
      }
      nav.idx = Math.min(nav.idx, Math.max(0, nav.items.length - 1));
      nav.attachHover();
      nav.refresh();
    };

    const setTab = (tab, silent = false) => {
      if (this._shopTab === tab && !silent) return;
      this._shopTab = tab;
      if (!silent) sfx.play('cursor');
      tabBtns.forEach(b => b.classList.toggle('focus', b.dataset.tab === tab));
      renderList();
    };
    tabBtns.forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
    root.querySelector('#shop-close').addEventListener('click', () => this.closeShop());

    this.shopNav = nav;
    this.pushPanel({
      handleKey: (a) => {
        if (a === 'left' || a === 'right') {
          setTab(this._shopTab === 'buy' ? 'sell' : 'buy');
          return true;
        }
        return nav.handleKey(a);
      },
    });
    this._shopPanelObj = this.activePanel;
    setTab('buy', true);
  }

  closeShop() {
    if (!this.shopOpen) return;
    this.shopOpen = false;
    this.popPanel(this._shopPanelObj);
    this.elShop.remove();
  }

  // ===== 确认框 =====
  confirm(text, onOk) {
    const root = document.createElement('div');
    root.id = 'confirm-root';
    root.innerHTML = `
      <div id="confirm-panel" class="panel">
        <div class="c-text" style="white-space:pre-wrap;">${text}</div>
        <div class="c-btns">
          <button class="btn c-ok">确定</button>
          <button class="btn c-no">取消</button>
        </div>
      </div>`;
    this.root.appendChild(root);
    const nav = new PanelNav({ onCancel: () => done(false) });
    const okBtn = root.querySelector('.c-ok');
    const noBtn = root.querySelector('.c-no');
    nav.setItems([
      { el: okBtn, onSelect: () => done(true) },
      { el: noBtn, onSelect: () => done(false) },
    ]);
    nav.attachHover();
    let closed = false;
    const done = (ok) => {
      if (closed) return;
      closed = true;
      this.popPanel(obj);
      root.remove();
      if (ok && onOk) onOk();
    };
    const obj = { handleKey: (a) => nav.handleKey(a) };
    this.pushPanel(obj);
  }

  // ===== 帮助 =====
  openHelp(onClose) {
    const touch = this.game.input.touch;
    const controlLines = touch
      ? `<div><span class="k">左下方向键</span>移动 · 按住持续走</div>
         <div><span class="k">A 键</span>确认 · 交互 · 快进对话（也可点对话框）</div>
         <div><span class="k">B 键</span>取消 · 打开菜单（地图中）</div>
         <div><span class="k">直接点 NPC</span>即可交谈（无需对准）· 按住 A 快进对话</div>`
      : `<div><span class="k">方向键 / WASD</span>移动 · 选择</div>
         <div><span class="k">Z / 回车 / 空格</span>确认 · 交互 · 快进对话（按住更快）</div>
         <div><span class="k">X / Esc</span>取消 · 打开菜单（地图中）</div>
         <div><span class="k">C</span>对话中回看记录 · 点击 NPC 也可直接交谈</div>`;
    const root = document.createElement('div');
    root.id = 'confirm-root';
    root.innerHTML = `
      <div id="confirm-panel" class="panel" style="max-width:420px;">
        <div class="panel-title">操作说明</div>
        <div class="c-text" id="help-body">
          ${controlLines}
          <div class="dim">深草丛中会遭遇「暗雷」（随机遇敌）。</div>
          <div class="dim">武器各有门类：剑（萧逸）· 刀（洛清霜）· 琴（沈孤鸿）· 笔（柳如烟），防具饰品通用。</div>
          <div class="dim">菜单中可随时存档（战斗中不可）。全灭后将在青云门苏醒。</div>
          <div class="dim">境界突破：等级达标 + 对应丹药，在「角色」页尝试。</div>
        </div>
        <div class="c-btns"><button class="btn h-ok">关闭</button></div>
      </div>`;
    this.root.appendChild(root);
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      this.popPanel(obj);
      root.remove();
      if (onClose) onClose();
    };
    const okBtn = root.querySelector('.h-ok');
    okBtn.addEventListener('click', close);
    const obj = {
      handleKey: (a) => {
        if (a === 'confirm' || a === 'cancel') { close(); return true; }
        return true;
      },
    };
    this.pushPanel(obj);
  }

  // ===== 章节结算 =====
  chapterEnd(chapter = 1) {
    const g = this.game;
    const flag = `chapter_end_shown_${chapter}`;
    if (g.flags.has(flag)) return;
    g.setFlag(flag);
    const hero = g.party[0];
    const mins = Math.floor(g.playSec / 60);
    const root = document.createElement('div');
    root.id = 'chapter-root';
    const isFinal = chapter >= 5;
    root.innerHTML = `
      <div class="ch-title">${isFinal ? '终章' : `第${CHAPTER_CN[chapter - 1] || chapter}章`} · 完</div>
      <div class="ch-sub">${CHAPTER_SUBS[chapter] || '江湖路远，未完待续……'}</div>
      <div class="ch-stats">
        ${hero.name} · ${hero.realmDef().name} Lv${hero.level}<br>
        同行伙伴 ${g.party.length} 人 · 击败妖物 ${g.kills} 只 · 历时 ${mins} 分钟<br>
        <span style="color:#a89878;">（可继续自由探索、练级与突破）</span>
      </div>
      <button class="btn ch-ok">继续游历</button>`;
    this.root.appendChild(root);
    sfx.music(isFinal ? 'ending' : 'chapter');
    const close = () => {
      root.remove();
      this.popPanel(obj);
      // 结算关闭后回到当前地图的 BGM
      const ms = this.game.mapScene;
      sfx.music(ms && ms.def ? (ms.def.music || 'map') : 'map');
    };
    root.querySelector('.ch-ok').addEventListener('click', close);
    const obj = {
      handleKey: (a) => {
        if (a === 'confirm' || a === 'cancel') { close(); return true; }
        return true;
      },
    };
    this.pushPanel(obj);
  }

  openMenu() { this.menu.open(); }
}
