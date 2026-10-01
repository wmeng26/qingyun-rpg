// 面板键盘导航助手：为 DOM 按钮列表提供 JRPG 式方向键 + 确认/取消
import { sfx } from './Audio.js';

export class PanelNav {
  constructor({ onCancel = null, vertical = true } = {}) {
    this.items = [];
    this.idx = 0;
    this.onCancel = onCancel;
    this.vertical = vertical;
  }

  setItems(items) {
    this.items = items.filter(i => i && !i.disabled);
    this.idx = 0;
    this.refresh();
  }

  refresh() {
    this.items.forEach((it, i) => {
      it.el.classList.toggle('focus', i === this.idx);
      if (i === this.idx && it.el.scrollIntoView) {
        // 确保选中项可见（不滚动整页）
        it.el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  current() { return this.items[this.idx] || null; }

  move(d) {
    if (!this.items.length) return;
    this.idx = (this.idx + d + this.items.length) % this.items.length;
    sfx.play('cursor');
    this.refresh();
  }

  handleKey(action) {
    if (this.vertical) {
      if (action === 'up') { this.move(-1); return true; }
      if (action === 'down') { this.move(1); return true; }
    } else {
      if (action === 'left') { this.move(-1); return true; }
      if (action === 'right') { this.move(1); return true; }
    }
    if (action === 'confirm') {
      const cur = this.current();
      if (cur) { sfx.play('confirm'); cur.onSelect(); return true; }
      return false;
    }
    if (action === 'cancel') {
      if (this.onCancel) { sfx.play('cancel'); this.onCancel(); return true; }
    }
    return false;
  }

  attachHover() {
    // 鼠标悬停同步焦点，点击即触发
    this.items.forEach((it, i) => {
      it.el.addEventListener('mouseenter', () => {
        if (this.idx !== i) sfx.play('cursor');
        this.idx = i;
        this.refresh();
      });
      it.el.addEventListener('click', () => { this.idx = i; sfx.play('confirm'); it.onSelect(); });
    });
  }
}
