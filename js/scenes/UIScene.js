// UI 总管（非场景栈成员）：HUD / Toast / 菜单 / 商店 / 确认框 / 帮助 / 章节结算
import ITEMS from '../data/items.js';
import MainMenu from './MainMenu.js';
import { PanelNav } from '../core/UIPanel.js';

const SHOP_GOODS = [
  'pill_huixue', 'pill_lingli', 'pill_jiedu',
  'sword_iron', 'robe_cotton', 'armor_leather', 'amulet_pingan', 'jade_ling',
  'sword_qingfeng', 'pill_zhuji', 'pill_jindan',
  'pill_dahuan', 'sword_hanshuang', 'armor_silver', 'amulet_yulin',
  'pill_jiuzhuan', 'sword_zhanlu', 'armor_longlin', 'amulet_huhun',
  'pill_guyuan', 'pill_huashen', 'sword_zhanxing', 'armor_xuanming', 'yu_longhun', 'qin_jiaowei',
];

// 各章结算文案
const CHAPTER_CN = ['一', '二', '三', '四'];
const CHAPTER_SUBS = {
  1: '青云山重归太平，而江湖路才刚刚开始……',
  2: '黑风寨已平，然密信之上，「血煞教」三字触目惊心……',
  3: '百年魔教一朝倾覆，元婴初成——而「血煞之上」的影子，才刚刚显现……',
  4: '魔主既灭，封印重铸。千年血债清偿，天下自此太平。——全剧情终，感谢游玩！',
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
  openShop() {
    if (this.shopOpen) return;
    this.shopOpen = true;
    const g = this.game;
    const root = document.createElement('div');
    root.id = 'shop-root';
    root.innerHTML = `
      <div id="shop-panel" class="panel">
        <div class="panel-title">杂货铺 · 丹药器械</div>
        <div class="goods scroll" id="shop-goods"></div>
        <div class="shop-gold" id="shop-gold"></div>
        <div style="text-align:center;padding:0 0 10px;"><button class="btn" id="shop-close">打烊（X）</button></div>
      </div>`;
    this.root.appendChild(root);
    this.elShop = root;
    const nav = new PanelNav({ onCancel: () => this.closeShop() });
    const goods = root.querySelector('#shop-goods');
    const goldEl = root.querySelector('#shop-gold');
    const rerender = () => {
      goldEl.textContent = `金钱 ${g.gold} 文`;
      goods.innerHTML = '';
      nav.setItems([]);
      for (const id of SHOP_GOODS) {
        const def = ITEMS[id];
        const row = document.createElement('div');
        row.className = 'inv-row';
        const icon = g.assets.get(def.icon);
        if (icon) {
          const img = document.createElement('canvas');
          img.width = 24; img.height = 24;
          img.style.cssText = 'width:24px;height:24px;image-rendering:pixelated;';
          img.getContext('2d').drawImage(icon, 0, 0);
          row.appendChild(img);
        }
        row.insertAdjacentHTML('beforeend', `
          <span class="i-name">${def.name}</span>
          <span class="i-count">${def.price}文</span>
          <span class="i-desc">${def.desc || ''}</span>`);
        const b = document.createElement('button');
        b.className = 'btn' + (g.gold < def.price ? ' disabled' : '');
        b.textContent = '购买';
        row.appendChild(b);
        goods.appendChild(row);
        nav.items.push({
          el: b, disabled: g.gold < def.price,
          onSelect: () => {
            if (g.gold < def.price) return;
            g.addGold(-def.price);
            g.obtainItem(id, 1);
            g.ui.toast(`买下了「${def.name}」`);
            rerender();
          },
        });
      }
      nav.attachHover();
      nav.refresh();
    };
    rerender();
    root.querySelector('#shop-close').addEventListener('click', () => this.closeShop());
    this.shopNav = nav;
    this.pushPanel({ handleKey: (a) => this.shopNav.handleKey(a) });
    this._shopPanelObj = this.activePanel;
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
         <div><span class="k">B 键</span>取消 · 打开菜单（地图中）</div>`
      : `<div><span class="k">方向键 / WASD</span>移动 · 选择</div>
         <div><span class="k">Z / 回车 / 空格</span>确认 · 交互 · 快进对话</div>
         <div><span class="k">X / Esc</span>取消 · 打开菜单（地图中）</div>`;
    const root = document.createElement('div');
    root.id = 'confirm-root';
    root.innerHTML = `
      <div id="confirm-panel" class="panel" style="max-width:420px;">
        <div class="panel-title">操作说明</div>
        <div class="c-text" id="help-body">
          ${controlLines}
          <div class="dim">深草丛中会遭遇「暗雷」（随机遇敌）。</div>
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
    const isFinal = chapter >= 4;
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
    const close = () => { root.remove(); this.popPanel(obj); };
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
