// 触屏虚拟按键：左下 D-pad（按住移动 / 滑动换向）+ 右下 A/B
// A = 确认·交互，B = 取消·菜单；经由 Input.pressAction 注入，与键盘同一套路由
const DIRS = ['up', 'down', 'left', 'right'];

export default class TouchControls {
  constructor(game) {
    this.game = game;
    this.mode = 'hidden'; // hidden | ab | full
    this._dpDir = null;
    this._buildDom();
  }

  _buildDom() {
    const root = document.createElement('div');
    root.id = 'touch-controls';
    root.dataset.mode = 'hidden';
    root.innerHTML = `
      <div id="dpad" aria-label="方向键">
        <button class="dp up" data-dir="up" aria-label="上"></button>
        <button class="dp left" data-dir="left" aria-label="左"></button>
        <button class="dp center" aria-hidden="true" tabindex="-1"></button>
        <button class="dp right" data-dir="right" aria-label="右"></button>
        <button class="dp down" data-dir="down" aria-label="下"></button>
      </div>
      <div id="ab-btns">
        <button class="ab b" data-act="cancel" aria-label="取消/菜单">B</button>
        <button class="ab a" data-act="confirm" aria-label="确认">A</button>
      </div>`;
    document.getElementById('stage').appendChild(root);
    this.el = root;
    // 长按按键会触发浏览器长按菜单（部分安卓浏览器表现为「页面内查找」），整个控件区一律屏蔽
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    this.elDpad = root.querySelector('#dpad');
    this.elBtns = [...root.querySelectorAll('.dp[data-dir]')];

    // ---- D-pad：单指按住/滑动（pointer capture，越界不丢） ----
    this.elDpad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { this.elDpad.setPointerCapture(e.pointerId); } catch { /* 合成事件无活跃指针，忽略 */ }
      this._dpApply(e);
    });
    this.elDpad.addEventListener('pointermove', (e) => {
      if (this._dpDir === null) return;
      this._dpApply(e);
    });
    const end = () => this._dpRelease();
    this.elDpad.addEventListener('pointerup', end);
    this.elDpad.addEventListener('pointercancel', end);

    // ---- A/B：按下即注入，抬起释放（confirm/cancel 无需 held 语义，但统一处理） ----
    for (const b of root.querySelectorAll('.ab')) {
      const act = b.dataset.act;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.classList.add('on');
        this.game.input.pressAction(act);
      });
      const off = () => { b.classList.remove('on'); this.game.input.releaseAction(act); };
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('pointerleave', off);
    }
  }

  _dpApply(e) {
    const r = this.elDpad.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    // 死区：中心附近不判定方向
    if (Math.hypot(dx, dy) < r.width * 0.12) return;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (dir === this._dpDir) return;
    this._dpRelease();
    this._dpDir = dir;
    this.game.input.pressAction(dir);
    this.elBtns.find(b => b.dataset.dir === dir)?.classList.add('on');
  }

  _dpRelease() {
    if (this._dpDir === null) return;
    this.game.input.releaseAction(this._dpDir);
    this.elBtns.find(b => b.dataset.dir === this._dpDir)?.classList.remove('on');
    this._dpDir = null;
  }

  // 显示策略：地图上全量（D-pad + A/B）；对话中仅 A/B（推进/关闭）；
  // 菜单/商店等面板与战斗中隐藏（面板按钮本身可点）
  refresh() {
    const g = this.game;
    let mode = 'hidden';
    if (g.dialog && g.dialog.active) mode = 'ab';
    else if (g.mapScene && !g.inBattle && !g.ui.hasModal()) mode = 'full';
    if (mode === this.mode) return;
    this.mode = mode;
    this.el.dataset.mode = mode;
    if (mode !== 'full') this._dpRelease();
    if (mode === 'hidden') {
      // display:none 后 pointerup 会丢失，兜底释放避免按键卡死
      for (const act of ['confirm', 'cancel']) this.game.input.releaseAction(act);
      this.el.querySelectorAll('.ab.on').forEach(b => b.classList.remove('on'));
    }
  }
}
