// 队友跟随：沿玩家 trail 蛇形跟进，与玩家同一节拍插值移动
// 槽位 i（0 起）的目标格 = player.trail[i]；轨迹尚未覆盖到时原地驻留（不入队前不显示）
const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };

export default class Follower {
  constructor(game, char) {
    this.game = game;
    this.spriteKey = char.spriteKey;
    this.gx = null; this.gy = null; // 落格（null = 尚未入场，不绘制）
    this.dir = 'down';
    this.fromX = 0; this.fromY = 0;
    this._toX = null; this._toY = null;
    this.moving = false;
  }

  // 每帧调用（紧随 player.update 之后），slot = 队伍序号 - 1
  update(slot, player) {
    this.player = player; // draw 插值取玩家本步进度用
    const goal = player.trail[slot];
    if (this.gx == null) {
      // 首个可达目标格直接驻留（玩家刚离开的格子，视觉上无缝补位）
      if (goal) { this.gx = goal.x; this.gy = goal.y; this.dir = goal.dir; }
      return;
    }
    if (this.moving && !player.moving) {
      // 玩家本步已落定 → 跟随同步落格
      this.gx = this._toX; this.gy = this._toY;
      this._toX = this._toY = null;
      this.moving = false;
    }
    if (!this.moving && goal && (goal.x !== this.gx || goal.y !== this.gy)) {
      this.fromX = this.gx; this.fromY = this.gy;
      this._toX = goal.x; this._toY = goal.y;
      this.dir = goal.x > this.gx ? 'right' : goal.x < this.gx ? 'left'
        : goal.y > this.gy ? 'down' : 'up';
      this.moving = true;
    }
  }

  // 移动插值与玩家同拍（玩家 moveT 即本步进度）
  _t() {
    if (!this.moving || !this.player) return 1;
    return Math.min(this.player.moveT / this.game.BALANCE.stepMs, 1);
  }

  draw(ctx, camX, camY, assets) {
    if (this.gx == null) return;
    const sheet = assets.get(this.spriteKey);
    if (!sheet) return;
    const t = this._t();
    const frame = this.moving ? (Math.floor(t * 2) % 2) : 0;
    const sx = frame * 16, sy = DIR_ROW[this.dir] * 16;
    const wx = (this.fromX + ((this._toX ?? this.gx) - this.fromX) * t) * 32;
    const wy = (this.fromY + ((this._toY ?? this.gy) - this.fromY) * t) * 32;
    const x = Math.round(wx - camX), y = Math.round(wy - camY);
    if (x < -32 || y < -32 || x > 512 || y > 302) return;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 6, y + 27, 20, 4);
    ctx.drawImage(sheet, sx, sy, 16, 16, x, y, 32, 32);
  }
}
