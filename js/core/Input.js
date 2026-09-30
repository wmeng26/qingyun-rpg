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

    window.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      e.preventDefault();
      this.held.add(action);
      // 系统按键重复只更新 held（供移动长按），不派发边沿事件：
      // 场景级 wasPressed 与面板级 handleKey 都必须是「按下一次 = 触发一次」，
      // 否则长按会以系统重复速率连续翻菜单／快进对话。
      if (e.repeat) return;
      // UI 面板优先消费按键（对话框/菜单/战斗面板等）
      const panel = game.ui && game.ui.activePanel;
      if (panel && panel.handleKey && panel.handleKey(action, e)) return;
      this.pressed.add(action);
    });
    window.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      this.held.delete(action);
    });
    window.addEventListener('blur', () => { this.held.clear(); this.pressed.clear(); });
  }

  isDown(action) { return this.held.has(action); }
  wasPressed(action) { return this.pressed.has(action); }
  endFrame() { this.pressed.clear(); }
}
