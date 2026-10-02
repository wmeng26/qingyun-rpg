// 瓦片地图：预渲染整图到离屏 canvas（坐标变体混铺 / 水岸·洞窟边缘过渡 / 立体投影
// / 水面波光动画），并提供碰撞、遇敌、传送门查询
const TILE = 32;

// 参与坐标混铺变体的基础瓦片（美术端为它们各注册两枚 '名#1'/'名#2' 变体）
const VARYING = new Set([
  'grass', 'flower', 'tallgrass', 'tallgrass2', 'path', 'water',
  'cavefloor', 'snow', 'snowgrass', 'snowdeep', 'snowpath', 'ice',
]);
// 会向正下方邻格投影的立体制瓦片
const CASTS_SHADOW = new Set(['tree', 'rock', 'pine', 'wall', 'roof', 'door']);

// (x,y) -> 0..255 确定性哈希：变体选择与波光相位共用，保证每次启动画面一致
function hash2(x, y) {
  let h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  return (h ^ (h >>> 15)) & 255;
}

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

  // 变体贴图名：50% 原版 + 25%/25% 两枚变体，大面积铺贴不再呈现单一贴图的网格感
  _variantName(x, y) {
    const name = this.tileName(x, y);
    if (!name || !VARYING.has(name)) return name;
    const r = hash2(x, y) & 3;
    return r === 2 ? `${name}#1` : r === 3 ? `${name}#2` : name;
  }

  _prerender() {
    const { width, height } = this.def;
    const c = document.createElement('canvas');
    c.width = this.worldW; c.height = this.worldH;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const nameAt = (x, y) => this.tileName(x, y);
    const isCaveWall = (x, y) => nameAt(x, y) === 'cavewall';
    this._water = [];

    // 1) 底图：按坐标混铺变体贴图
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const name = nameAt(x, y);
        if (!name) { g.fillStyle = '#000'; g.fillRect(x * TILE, y * TILE, TILE, TILE); continue; }
        if (name === 'water') this._water.push([x, y]);
        const img = name && this.assets.get(this._variantName(x, y));
        if (img) g.drawImage(img, x * TILE, y * TILE);
      }
    }

    // 2) 水岸过渡：水域格朝陆地（非桥面）的一侧压出浅色岸沿 + 泡沫亮线
    for (const [x, y] of this._water) {
      const px = x * TILE, py = y * TILE;
      const isLand = (nx, ny) => {
        const n = nameAt(nx, ny);
        return n != null && n !== 'water' && n !== 'bridge';
      };
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        if (!isLand(x + dx, y + dy)) continue;
        g.fillStyle = 'rgba(158,208,232,0.5)';
        if (dy < 0) g.fillRect(px, py, TILE, 3);
        else if (dy > 0) g.fillRect(px, py + TILE - 3, TILE, 3);
        else if (dx < 0) g.fillRect(px, py, 3, TILE);
        else g.fillRect(px + TILE - 3, py, 3, TILE);
        g.fillStyle = 'rgba(228,246,252,0.65)';
        if (dy < 0) g.fillRect(px, py, TILE, 1);
        else if (dy > 0) g.fillRect(px, py + TILE - 1, TILE, 1);
        else if (dx < 0) g.fillRect(px, py, 1, TILE);
        else g.fillRect(px + TILE - 1, py, 1, TILE);
      }
    }

    // 3) 洞窟接触阴影：洞窟地面朝岩壁的一侧压暗，拉开洞内纵深
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const name = nameAt(x, y);
        if (name !== 'cavefloor' && name !== 'stairs') continue;
        const px = x * TILE, py = y * TILE;
        const grad = (x0, y0, x1, y1, a) => {
          const gr = g.createLinearGradient(x0, y0, x1, y1);
          gr.addColorStop(0, `rgba(0,0,0,${a})`);
          gr.addColorStop(1, 'rgba(0,0,0,0)');
          return gr;
        };
        if (isCaveWall(x, y - 1)) { g.fillStyle = grad(px, py, px, py + 6, 0.4); g.fillRect(px, py, TILE, 6); }
        if (isCaveWall(x, y + 1)) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(px, py + TILE - 2, TILE, 2); }
        if (isCaveWall(x - 1, y)) { g.fillStyle = grad(px, py, px + 6, py, 0.35); g.fillRect(px, py, 6, TILE); }
        if (isCaveWall(x + 1, y)) { g.fillStyle = grad(px + TILE, py, px + TILE - 6, py, 0.35); g.fillRect(px + TILE - 6, py, 6, TILE); }
      }
    }

    // 4) 立体投影：树/石/松在正下方落椭圆影；成排的建筑瓦片（墙/檐/门）
    //    改画连续的渐变阴影带，避免长墙下出现一串孤立的椭圆
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width; x++) {
        const name = nameAt(x, y);
        if (!CASTS_SHADOW.has(name)) continue;
        const belowName = nameAt(x, y + 1);
        if (!belowName || belowName === 'water' || CASTS_SHADOW.has(belowName)) continue;
        const l = this.def.legend[this.def.tiles[y + 1][x]];
        if (!l || l.solid) continue;
        const px = x * TILE, py = (y + 1) * TILE;
        if (name === 'wall' || name === 'roof' || name === 'door') {
          const gr = g.createLinearGradient(0, py, 0, py + 9);
          gr.addColorStop(0, 'rgba(0,0,0,0.28)');
          gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr;
          g.fillRect(px, py, TILE, 9);
        } else {
          g.fillStyle = 'rgba(0,0,0,0.24)';
          g.beginPath();
          g.ellipse(px + 16, py + 6, 12, 4.5, 0, 0, Math.PI * 2);
          g.fill();
        }
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

    // 水面波光：视口内水面格按坐标相位淡入淡出的短高光
    const t = performance.now() / 1000;
    for (const [wx, wy] of this._water) {
      const px = wx * TILE - camX, py = wy * TILE - camY;
      if (px < -TILE || py < -TILE || px > viewW || py > viewH) continue;
      const phase = ((hash2(wx, wy) & 7) * 0.42 + (hash2(wy + 31, wx) & 3) * 0.13);
      const s = (t * 0.6 + phase) % 3;
      if (s > 1.2) continue;
      ctx.globalAlpha = 0.45 * Math.sin((s / 1.2) * Math.PI);
      ctx.fillStyle = 'rgba(230,246,252,1)';
      ctx.fillRect(px + 3 + (hash2(wx * 3 + 1, wy) & 15), py + 5 + (hash2(wx, wy * 5 + 7) & 19), 5, 2);
    }
    ctx.globalAlpha = 1;
  }
}
