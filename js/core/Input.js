// 键盘输入：held(长按) + pressed(边沿)；UI 面板激活时按键优先路由给 UI
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'confirm', Enter: 'confirm', Space: 'confirm',
  KeyX: 'cancel', Escape: 'cancel',
};

export default class Input {
  constructor(game) {
    this.game = game;
    this.held = new Set();
    this.pressed = new Set();
    // 触屏设备检测：供虚拟按键 / 文案分支使用；URL 带 ?touch=1 可在桌面强制开启（调试用）
    this.touch = new URLSearchParams(location.search).has('touch')
      || (window.matchMedia && matchMedia('(pointer: coarse)').matches)
      || navigator.maxTouchPoints > 0
      || 'ontouchstart' in window;
    if (this.touch) {
      document.body.classList.add('is-touch');
      // 触屏下全局屏蔽长按菜单：部分安卓浏览器长按页面会弹「网页内查找」等菜单，
      // 游戏内没有任何依赖浏览器长按菜单的场景（桌面右键不受影响）
      document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    window.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      e.preventDefault();
      this.held.add(action);
      // 系统按键重复只更新 held（供移动长按），不派发边沿事件：
      // 场景级 wasPressed 与面板级 handleKey 都必须是「按下一次 = 触发一次」，
      // 否则长按会以系统重复速率连续翻菜单／快进对话。
      if (e.repeat) return;
      this._press(action);
    });
    window.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      this.held.delete(action);
    });
    window.addEventListener('blur', () => { this.held.clear(); this.pressed.clear(); });
  }

  // 按键按下路由：UI 面板优先消费（对话框/菜单/战斗面板等），未消费则派发边沿
  _press(action) {
    const panel = this.game.ui && this.game.ui.activePanel;
    if (panel && panel.handleKey && panel.handleKey(action, null)) return;
    this.pressed.add(action);
  }

  // 触屏虚拟按键注入（TouchControls 使用），与键盘同一套路由
  pressAction(action) {
    if (this.held.has(action)) return;
    this.held.add(action);
    this._press(action);
  }

  releaseAction(action) { this.held.delete(action); }

  isDown(action) { return this.held.has(action); }
  wasPressed(action) { return this.pressed.has(action); }
  endFrame() { this.pressed.clear(); }
}
