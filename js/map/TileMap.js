// 瓦片地图：预渲染整图到离屏 canvas，碰撞/遇敌/传送门查询
const TILE = 32;

export default class TileMap {
  constructor(def, assets) {
    this.def = def;
    this.assets = assets;
    this.TILE = TILE;
    this.worldW = def.width * TILE;
    this.worldH = def.height * TILE;
    this._prerender();
  }

  legendAt(x, y) {
    const row = this.def.tiles[y];
    if (!row) return null;
    const ch = row[x];
    return ch != null ? this.def.legend[ch] : null;
  }

  isSolid(x, y) {
    const l = this.legendAt(x, y);
    return !l || l.solid;
  }

  encZone(x, y) {
    const l = this.legendAt(x, y);
    return l && l.enc ? l.enc : null;
  }

  tileName(x, y) {
    const l = this.legendAt(x, y);
    return l ? l.tile : null;
  }

  _prerender() {
    const [c, ctx] = [document.createElement('canvas'), null];
    c.width = this.worldW; c.height = this.worldH;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < this.def.height; y++) {
      for (let x = 0; x < this.def.width; x++) {
        const l = this.legendAt(x, y);
        const img = l && this.assets.get(l.tile);
        if (img) g.drawImage(img, x * TILE, y * TILE);
        else { g.fillStyle = '#000'; g.fillRect(x * TILE, y * TILE, TILE, TILE); }
      }
    }
    this.cache = c;
  }

  draw(ctx, camX, camY, viewW, viewH) {
    const sx = Math.max(0, Math.min(camX, this.worldW - 1));
    const sy = Math.max(0, Math.min(camY, this.worldH - 1));
    const sw = Math.min(viewW, this.worldW - sx);
    const sh = Math.min(viewH, this.worldH - sy);
    ctx.drawImage(this.cache, sx, sy, sw, sh, sx - camX, sy - camY, sw, sh);
  }
}
