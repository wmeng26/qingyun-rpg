// NPC：地图上的静态交互角色
const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };

export default class NPC {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.x = def.x;
    this.y = def.y;
    this.dir = def.dir || 'down';
    this.spriteKey = def.sprite;
    this.dialog = def.dialog;
  }

  // 面向玩家
  faceToward(px, py) {
    const dx = px - this.x, dy = py - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
    else this.dir = dy > 0 ? 'down' : 'up';
  }

  draw(ctx, camX, camY, assets) {
    const sheet = assets.get(this.spriteKey);
    if (!sheet) return;
    const x = this.x * 32 - camX, y = this.y * 32 - camY;
    if (x < -32 || y < -32 || x > 480 || y > 270) return;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 6, y + 27, 20, 4);
    ctx.drawImage(sheet, 0, DIR_ROW[this.dir] * 16, 16, 16, x, y, 32, 32);
  }
}
