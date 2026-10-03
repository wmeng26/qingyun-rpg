// 玩家：四方向网格移动（每格 stepMs），行走帧动画
// trail：刚走过的格子队列（新在前），供队友蛇形跟随
const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };

export default class Player {
  constructor(game) {
    this.game = game;
    this.gx = 0; this.gy = 0;
    this.dir = 'down';
    this.moving = false;
    this.fromX = 0; this.fromY = 0;
    this.moveT = 0;
    this.onArrive = null; // (gx, gy) => void，由 MapScene 注入
    this.onBump = null;   // (gx, gy, dir) => void，撞上障碍格的边沿触发（推门用）
    this.enabled = true;
    this.trail = [];
    this._lastDir = null;
    this._bumped = false;
  }

  place(x, y, dir = 'down') {
    this.gx = x; this.gy = y;
    this.dir = dir;
    this.moving = false;
    this.moveT = 0;
    this.trail = [];
  }

  // 像素坐标（渲染用）
  px() {
    const t = this.moving ? Math.min(this.moveT / this.game.BALANCE.stepMs, 1) : 1;
    const ex = this._toX != null ? this._toX : this.gx;
    const ey = this._toY != null ? this._toY : this.gy;
    return (this.fromX + (ex - this.fromX) * t) * 32;
  }
  py() {
    const t = this.moving ? Math.min(this.moveT / this.game.BALANCE.stepMs, 1) : 1;
    const ex = this._toX != null ? this._toX : this.gx;
    const ey = this._toY != null ? this._toY : this.gy;
    return (this.fromY + (ey - this.fromY) * t) * 32;
  }

  update(dt, canMove, tileMap) {
    const stepMs = this.game.BALANCE.stepMs;
    if (this.moving) {
      this.moveT += dt * 1000;
      if (this.moveT >= stepMs) {
        this.gx = this._toX; this.gy = this._toY;
        this.moving = false; this.moveT = 0;
        this._toX = this._toY = null;
        if (this.onArrive) this.onArrive(this.gx, this.gy);
      }
      return;
    }
    if (!canMove || !this.enabled) return;
    const input = this.game.input;
    let dx = 0, dy = 0, dir = null;
    if (input.isDown('up')) { dy = -1; dir = 'up'; }
    else if (input.isDown('down')) { dy = 1; dir = 'down'; }
    else if (input.isDown('left')) { dx = -1; dir = 'left'; }
    else if (input.isDown('right')) { dx = 1; dir = 'right'; }
    if (!dir) { this._lastDir = null; return; }
    // 方向变化时重置撞墙闩：同一次按住只触发一次 onBump
    if (dir !== this._lastDir) { this._lastDir = dir; this._bumped = false; }
    this.dir = dir;
    const map = tileMap || (this.game.mapScene && this.game.mapScene.tileMap);
    if (!map) return;
    const nx = this.gx + dx, ny = this.gy + dy;
    if (map.isSolid(nx, ny)) {
      if (!this._bumped && this.onBump) { this._bumped = true; this.onBump(nx, ny, dir); }
      return;
    }
    this._bumped = false;
    this.fromX = this.gx; this.fromY = this.gy;
    this._toX = nx; this._toY = ny;
    this.moving = true;
    this.moveT = 0;
    // 记录刚离开的格子（含本步朝向），队友按槽位取 trail[i] 作为目标格
    this.trail.unshift({ x: this.gx, y: this.gy, dir });
    if (this.trail.length > 8) this.trail.pop();
  }

  draw(ctx, camX, camY) {
    const sheet = this.game.assets.get(this.game.party[0].spriteKey);
    if (!sheet) return;
    const t = this.moving ? Math.min(this.moveT / this.game.BALANCE.stepMs, 1) : 0;
    const frame = this.moving ? (Math.floor(t * 2) % 2) : 0;
    const sx = frame * 16, sy = DIR_ROW[this.dir] * 16;
    const x = Math.round(this.px() - camX), y = Math.round(this.py() - camY);
    // 影子
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 6, y + 27, 20, 4);
    ctx.drawImage(sheet, sx, sy, 16, 16, x, y, 32, 32);
  }
}
