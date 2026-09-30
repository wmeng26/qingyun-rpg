// 标题场景：新游戏 / 读取存档 / 操作说明
import { PanelNav } from '../core/UIPanel.js';

export default class TitleScene {
  enter() {
    const game = this.game;
    game.ui.showHUD(false);

    const root = document.createElement('div');
    root.id = 'title-ui';
    root.innerHTML = `
      <div id="title-logo">
        <div class="t-main">青云仙途</div>
        <div class="t-sub">—— 修仙 · 回合制 RPG ——</div>
      </div>
      <div id="title-menu"></div>
      <div id="title-foot">${this.game.input.touch
        ? '虚拟方向键移动 · A 确认 · B 取消/菜单 · 首次游玩请先「开始新游戏」'
        : '方向键移动 · Z 确认 · X 取消/菜单 · 首次游玩请先「开始新游戏」'}</div>`;
    document.getElementById('ui-root').appendChild(root);
    this.el = root;
    this.elMenu = root.querySelector('#title-menu');

    this.nav = new PanelNav();
    this._renderMain();
    game.ui.pushPanel(this);
  }

  _clearMenu() { this.elMenu.innerHTML = ''; }

  _btn(label, fn) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = label;
    return { el: b, onSelect: fn };
  }

  _renderMain() {
    this._clearMenu();
    this.nav.setItems([
      this._btn('开始新游戏', () => { this.game.ui.popPanel(this); this.game.newGame(); }),
      this._btn('读取存档', () => this._renderLoad()),
      this._btn('操作说明', () => this.game.ui.openHelp(() => this._renderMain())),
    ]);
    this.nav.attachHover();
    for (const it of this.nav.items) this.elMenu.appendChild(it.el);
  }

  _renderLoad() {
    this._clearMenu();
    const meta = this.game.save.slots().map(s => this.game.save.meta(s));
    const items = [];
    meta.forEach((m, i) => {
      const label = !m ? `${i + 1}. —— 空 ——`
        : m.incompatible ? `${i + 1}. 【旧版本存档】（版本不符，无法读取）`
        : `${i + 1}. ${m.name} Lv${m.level} · ${m.realm} · ${m.mapName}`;
      items.push(this._btn(label, () => {
        if (!m || m.incompatible) {
          if (m) this.game.ui.toast('存档版本不兼容，无法读取');
          return;
        }
        const data = this.game.save.load(m.slot);
        if (!data) return;
        this.game.ui.popPanel(this);
        this.game.applySave(data);
      }, m ? undefined : null));
    });
    items.push(this._btn('返回', () => this._renderMain()));
    this.nav.setItems(items);
    this.nav.attachHover();
    for (const it of this.nav.items) this.elMenu.appendChild(it.el);
  }

  handleKey(action) { return this.nav.handleKey(action); }

  render(ctx) {
    const bg = this.game.assets.get('bg_title');
    if (bg) ctx.drawImage(bg, 0, 0);
  }

  exit() {
    this.game.ui.popPanel(this);
    this.el.remove();
  }
}
