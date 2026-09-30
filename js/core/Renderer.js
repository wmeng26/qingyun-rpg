// 渲染器：逻辑分辨率 480×270，整数倍缩放 + pixelated；飘字/震屏/白闪
export default class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.LOGICAL_W = 480;
    this.LOGICAL_H = 270;
    this.floaters = [];
    this.shake = 0;
    this.flashTimer = 0;
    this.flashColor = '#fff';
    this.offsetX = 0;
    this.offsetY = 0;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    let scale = Math.min(w / this.LOGICAL_W, h / this.LOGICAL_H);
    if (scale >= 1) scale = Math.floor(scale); // 整数倍缩放保持像素锐利
    // 不足 1 倍（窗口比 480×270 还小）时按比例继续缩小以完整显示画面，
    // 不设下限——抬高到固定 0.5 会让画布反超窗口尺寸
    this.scale = scale;
    const dw = Math.round(this.LOGICAL_W * scale);
    const dh = Math.round(this.LOGICAL_H * scale);
    this.canvas.style.width = dw + 'px';
    this.canvas.style.height = dh + 'px';
    const wrap = document.getElementById('game-wrap');
    wrap.style.width = dw + 'px';
    wrap.style.height = dh + 'px';
  }

  shakeFor(time) { this.shake = Math.max(this.shake, time); }
  flash(time = 0.12, color = 'rgba(255,255,255,0.55)') { this.flashTimer = time; this.flashColor = color; }

  addFloater(text, x, y, opts = {}) {
    this.floaters.push({
      text, x, y,
      color: opts.color || '#fff',
      size: opts.size || 11,
      vy: opts.vy != null ? opts.vy : -28,
      life: opts.life != null ? opts.life : 0.9,
      t: 0,
    });
  }

  update(dt) {
    this.offsetX = 0; this.offsetY = 0;
    if (this.shake > 0) {
      this.shake -= dt;
      const amp = Math.min(this.shake * 22, 5);
      this.offsetX = (Math.random() * 2 - 1) * amp;
      this.offsetY = (Math.random() * 2 - 1) * amp;
    }
    if (this.flashTimer > 0) this.flashTimer -= dt;
    for (const f of this.floaters) {
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= 0.92;
    }
    this.floaters = this.floaters.filter(f => f.t < f.life);
  }

  beginFrame() {
    const { ctx } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.LOGICAL_W, this.LOGICAL_H);
    ctx.save();
    ctx.translate(Math.round(this.offsetX), Math.round(this.offsetY));
  }

  endFrame() {
    const { ctx } = this;
    ctx.restore();
    if (this.flashTimer > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.LOGICAL_W, this.LOGICAL_H);
    }
    // 飘字（不随震屏）
    for (const f of this.floaters) {
      const a = f.life - f.t > 0.25 ? 1 : (f.life - f.t) / 0.25;
      ctx.globalAlpha = a;
      ctx.font = `bold ${f.size}px "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }
}
