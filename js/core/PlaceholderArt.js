// 程序化占位像素美术：全部资源代码生成（零外部文件）。
// 未来替换 AI 素材：assets.loadManifest({key: 'assets/images/xxx.png'}) 覆盖同名 key 即可。

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

// 确定性随机（保证每次启动美术一致）
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 24 格网格 -> 48px（2x 像素）
function grid2(ctx, ox, oy) {
  return (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(ox + x * 2, oy + y * 2, w * 2, h * 2); };
}

// ================= 瓦片 32×32 =================
function tileGrass(ctx, seed, dark = false) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = dark ? '#41672f' : '#4d7c3c';
  ctx.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = rnd() > 0.5 ? (dark ? '#39592a' : '#457236') : (dark ? '#4a7036' : '#578a44');
    ctx.fillRect((rnd() * 32) | 0, (rnd() * 32) | 0, 2, 1);
  }
  for (let i = 0; i < 5; i++) {
    const x = (rnd() * 30) | 0, y = (rnd() * 30) | 0;
    ctx.fillStyle = dark ? '#54803c' : '#639a4c';
    ctx.fillRect(x, y, 1, 2); ctx.fillRect(x + 2, y + 1, 1, 1);
  }
}

function tileFlower(ctx) {
  tileGrass(ctx, 7);
  tileFlowerDetail(ctx);
}

function tileFlowerDetail(ctx) {
  const rnd = mulberry32(77);
  const cols = ['#e8e4d8', '#d06a5a', '#e8c84c'];
  for (let i = 0; i < 3; i++) {
    const x = 3 + ((rnd() * 24) | 0), y = 4 + ((rnd() * 22) | 0), c = cols[i % 3];
    ctx.fillStyle = c; ctx.fillRect(x, y - 1, 2, 1); ctx.fillRect(x, y + 1, 2, 1); ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 2, y, 1, 1);
    ctx.fillStyle = '#f0e0a0'; ctx.fillRect(x, y, 2, 2 - 1 + 1);
    ctx.fillStyle = '#8a6a2e'; ctx.fillRect(x, y, 2, 2);
  }
}

function tileTallgrass(ctx, seed, deep = false) {
  tileGrass(ctx, seed, deep);
  const rnd = mulberry32(seed * 13);
  for (let i = 0; i < 9; i++) {
    const x = 2 + ((rnd() * 27) | 0), h = (deep ? 10 : 7) + ((rnd() * 5) | 0), y = 30 - h;
    ctx.fillStyle = deep ? '#2c4f22' : '#356028';
    ctx.fillRect(x, y, 2, h);
    ctx.fillStyle = deep ? '#223f1a' : '#2c5020';
    ctx.fillRect(x + 2, y + 2, 1, h - 3);
  }
}

function tileTree(ctx) {
  tileGrass(ctx, 9);
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  P(14, 22, 4, 8, '#5a4232'); P(15, 22, 1, 8, '#6d5340');
  const canopy = [
    [10, 12, 12, 4], [8, 8, 16, 5], [10, 4, 12, 4], [12, 2, 8, 2],
  ];
  for (const [x, y, w, h] of canopy) P(x, y, w, h, '#2f5526');
  P(12, 6, 8, 3, '#3f6a30'); P(14, 8, 4, 2, '#4a7a38'); P(10, 9, 3, 2, '#3f6a30');
  P(20, 10, 3, 2, '#26471e'); P(11, 14, 10, 2, '#26471e');
}

function tileWater(ctx, seed = 11) {
  ctx.fillStyle = '#3a6a9a'; ctx.fillRect(0, 0, 32, 32);
  const rnd = mulberry32(seed);
  for (let i = 0; i < 7; i++) {
    const y = 2 + ((rnd() * 28) | 0), x = (rnd() * 24) | 0;
    ctx.fillStyle = '#2c5580'; ctx.fillRect(x, y, 6, 2);
    ctx.fillStyle = '#6aa0c8'; ctx.fillRect(x + 2, y, 3, 1);
  }
}

function tileBridge(ctx) {
  tileWater(ctx);
  ctx.fillStyle = '#8a6a42'; ctx.fillRect(0, 2, 32, 28);
  ctx.fillStyle = '#6d5334';
  for (let y = 2; y < 30; y += 5) ctx.fillRect(0, y, 32, 1);
  ctx.fillStyle = '#5a4232'; ctx.fillRect(0, 2, 2, 28); ctx.fillRect(30, 2, 2, 28);
  ctx.fillStyle = '#a3825a'; ctx.fillRect(2, 3, 28, 1);
}

function tilePath(ctx, seed = 23) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#c0a878'; ctx.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#b09868' : '#cbb68a';
    ctx.fillRect((rnd() * 30) | 0, (rnd() * 30) | 0, 2, 2);
  }
}

function tileRock(ctx) {
  tileGrass(ctx, 31);
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  P(8, 14, 16, 12, '#6a6a62'); P(10, 10, 12, 6, '#6a6a62');
  P(12, 8, 8, 4, '#7a7a72'); P(11, 11, 8, 4, '#8a8a80');
  P(12, 12, 4, 2, '#9a9a8e'); P(9, 24, 14, 3, '#4a4a44');
}

function tileWall(ctx) {
  ctx.fillStyle = '#c8b28a'; ctx.fillRect(0, 0, 32, 32);
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  P(0, 0, 32, 3, '#6a4a32'); P(0, 0, 3, 32, '#6a4a32'); P(29, 0, 3, 32, '#6a4a32');
  P(3, 15, 26, 2, '#b09868');
  const rnd = mulberry32(41);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = '#bfa87e'; ctx.fillRect(4 + ((rnd() * 24) | 0), 5 + ((rnd() * 24) | 0), 3, 2); }
}

function tileRoof(ctx) {
  ctx.fillStyle = '#7a3a2e'; ctx.fillRect(0, 0, 32, 32);
  for (let y = 0; y < 32; y += 6) { ctx.fillStyle = '#5f2c22'; ctx.fillRect(0, y, 32, 2); ctx.fillStyle = '#8d4a3a'; ctx.fillRect(0, y + 2, 32, 1); }
  ctx.fillStyle = '#4a231b'; ctx.fillRect(0, 0, 32, 2);
}

function tileDoor(ctx) {
  ctx.fillStyle = '#6a4a32'; ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = '#4a3222'; ctx.fillRect(3, 0, 26, 32);
  ctx.fillStyle = '#5f422c'; for (let x = 6; x < 28; x += 5) ctx.fillRect(x, 2, 2, 30);
  ctx.fillStyle = '#2e2015'; ctx.fillRect(3, 0, 26, 2);
  ctx.fillStyle = '#d4af37'; ctx.fillRect(22, 16, 3, 3);
}

function tileCavewall(ctx) {
  const rnd = mulberry32(55);
  ctx.fillStyle = '#2c2622'; ctx.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#383029' : '#251f1c';
    ctx.fillRect((rnd() * 28) | 0, (rnd() * 28) | 0, 4 + ((rnd() * 4) | 0), 3);
  }
  ctx.fillStyle = '#1a1614'; ctx.fillRect(0, 28, 32, 4);
}

function tileCavefloor(ctx, seed = 63) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#4a4038'; ctx.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#3e352e' : '#544940';
    ctx.fillRect((rnd() * 30) | 0, (rnd() * 30) | 0, 3, 2);
  }
}

function tileStairs(ctx) {
  tileCavefloor(ctx);
  for (let y = 4; y < 32; y += 7) {
    ctx.fillStyle = '#5f5346'; ctx.fillRect(2, y, 28, 5);
    ctx.fillStyle = '#6d6052'; ctx.fillRect(2, y, 28, 2);
  }
}

// ---- 第四章：寒渊雪地 ----
function tileSnow(ctx, seed = 71) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#dfe6ea'; ctx.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#d2dbe2' : '#eef2f5';
    ctx.fillRect((rnd() * 30) | 0, (rnd() * 30) | 0, 3, 2);
  }
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#c8d2da';
    ctx.fillRect((rnd() * 28) | 0, (rnd() * 28) | 0, 4, 1);
  }
}

function tileSnowGrass(ctx, seed = 83) {
  tileSnow(ctx, seed);
  const rnd = mulberry32(seed * 17);
  for (let i = 0; i < 6; i++) {
    const x = 2 + ((rnd() * 27) | 0), y = 4 + ((rnd() * 24) | 0);
    ctx.fillStyle = '#7a8a6a'; ctx.fillRect(x, y, 1, 4); ctx.fillRect(x + 2, y + 1, 1, 3);
    ctx.fillStyle = '#94a482'; ctx.fillRect(x + 1, y + 2, 1, 2);
  }
}

function tileSnowDeep(ctx, seed = 97) {
  tileSnow(ctx, seed);
  const rnd = mulberry32(seed * 11);
  for (let i = 0; i < 7; i++) {
    const x = 2 + ((rnd() * 26) | 0), y = 6 + ((rnd() * 20) | 0);
    ctx.fillStyle = '#b8c6d0'; ctx.fillRect(x, y, 5, 3);
    ctx.fillStyle = '#a5b4c0'; ctx.fillRect(x + 1, y + 3, 3, 2);
    ctx.fillStyle = '#8a9aa8'; ctx.fillRect(x + 1, y + 1, 2, 1);
  }
}

function tilePine(ctx) {
  tileSnow(ctx);
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  P(14, 24, 4, 7, '#4a3828'); P(15, 24, 1, 7, '#5a4634');
  const tiers = [[9, 18, 14, 5], [11, 12, 10, 5], [13, 7, 6, 4]];
  for (const [x, y, w, h] of tiers) {
    P(x, y, w, h, '#2a4a38');
    P(x, y, w, 2, '#e8eef2');                     // 积雪覆顶
    P(x + 2, y + 2, w - 4, h - 2, '#1f3a2c');
  }
  P(14, 3, 4, 3, '#e8eef2'); P(15, 2, 2, 2, '#f4f8fa');
}

function tileIce(ctx, seed = 109) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#a8ccd8'; ctx.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#bcdce6' : '#98c0cc';
    ctx.fillRect((rnd() * 28) | 0, (rnd() * 28) | 0, 5, 3);
  }
  ctx.fillStyle = '#e0f0f5'; ctx.fillRect(4, 4, 8, 1); ctx.fillRect(20, 18, 8, 1);
  ctx.fillStyle = '#7aa8b8'; ctx.fillRect(2, 24, 10, 2); ctx.fillRect(22, 8, 6, 2);
}

// 踏雪之路：压实的雪面 + 车辙足迹。仍是雪色系，但比周遭雪地更暗更实
// （不画瓦片边线——横竖两个方向的路面都由相邻瓦片自然连成整条）
function tileSnowPath(ctx, seed = 131) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#cfd8de'; ctx.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#c2ccd4' : '#dae2e8';
    ctx.fillRect((rnd() * 30) | 0, (rnd() * 30) | 0, 4, 2);
  }
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#a8b4be';
    ctx.fillRect(5 + ((rnd() * 20) | 0), 6 + ((rnd() * 20) | 0), 4, 3);
  }
}

// ---- 室内：木地板 / 地毯 / 桌案 / 柜台 / 货架 ----
function tileFloor(ctx, seed = 141) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#96744a'; ctx.fillRect(0, 0, 32, 32);
  for (let y = 0; y < 32; y += 8) {
    ctx.fillStyle = '#7a5c38'; ctx.fillRect(0, y, 32, 1);          // 板缝
    const jx = ((seed * 7 + y * 13) % 24) + 4;
    ctx.fillRect(jx, y, 1, 8);                                      // 交错端缝
  }
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#a5825a' : '#85613c';
    ctx.fillRect((rnd() * 28) | 0, (rnd() * 30) | 0, 3 + ((rnd() * 4) | 0), 1);
  }
}

function tileCarpet(ctx) {
  ctx.fillStyle = '#8a3030'; ctx.fillRect(0, 0, 32, 32);
  const rnd = mulberry32(151);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#7a2828' : '#983c3c';
    ctx.fillRect((rnd() * 28) | 0, (rnd() * 28) | 0, 3, 2);
  }
  ctx.fillStyle = '#c8a84c';                                        // 金线回纹边
  ctx.fillRect(0, 0, 32, 2); ctx.fillRect(0, 30, 32, 2);
  ctx.fillRect(0, 0, 2, 32); ctx.fillRect(30, 0, 2, 32);
  ctx.fillStyle = '#d8bc6c'; ctx.fillRect(2, 2, 1, 28); ctx.fillRect(29, 2, 1, 28);
  ctx.fillRect(2, 2, 28, 1); ctx.fillRect(2, 29, 28, 1);
  ctx.fillStyle = '#6a2222';                                        // 中央团花
  ctx.fillRect(13, 13, 6, 6);
  ctx.fillStyle = '#a84a4a'; ctx.fillRect(15, 15, 2, 2);
}

// 地面基底的家具（桌/柜/架先铺地板再画家具，保证与房间地面无缝）
function tileTable(ctx) {
  tileFloor(ctx, 143);
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  P(3, 6, 26, 21, '#54371f');
  P(4, 5, 24, 20, '#7a5230');                                       // 桌面
  P(4, 5, 24, 3, '#93683f');
  P(5, 22, 22, 3, '#634023');
  P(6, 11, 4, 4, '#54371f'); P(7, 10, 4, 4, '#d8d0c0');             // 茶碗
  P(20, 9, 6, 8, '#8a6a42'); P(21, 8, 5, 2, '#a8865a');             // 书卷
}

function tileCounter(ctx) {
  tileFloor(ctx, 147);
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  P(0, 7, 32, 20, '#4a3220');
  P(0, 5, 32, 19, '#5f4227');                                       // 柜身
  P(0, 5, 32, 4, '#7a5a36');                                        // 台面
  P(0, 8, 32, 1, '#8d6c40');
  P(4, 1, 6, 4, '#9aa2ac'); P(10, 0, 5, 5, '#b0a084'); P(22, 1, 5, 4, '#c0b090'); // 台上货物
  P(6, 14, 20, 2, '#54371f');                                       // 抽屉缝
  P(9, 14, 2, 2, '#c8a84c'); P(21, 14, 2, 2, '#c8a84c');            // 铜扣
}

function tileShelf(ctx) {
  tileFloor(ctx, 149);
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  P(2, 0, 28, 32, '#54371f');
  P(3, 1, 26, 30, '#3a281a');                                       // 架膛
  P(3, 12, 26, 2, '#7a5230'); P(3, 24, 26, 2, '#7a5230');           // 隔板
  const jars = ['#a8865a', '#8a9a6a', '#c0b0a0', '#b06a4a'];
  for (let i = 0; i < 4; i++) {
    P(4 + i * 7, 5 + (i % 2), 5, 7, jars[i]);
    P(4 + i * 7, 5 + (i % 2), 5, 2, '#d8ccb8');
  }
  for (let i = 0; i < 4; i++) P(4 + i * 7, 16, 5, 8, i % 2 ? '#8a4a3a' : '#4a5a6a'); // 竖排书册
  P(4, 26, 24, 6, '#2e2015');
  for (let i = 0; i < 5; i++) P(5 + i * 5, 27, 4, 4, ['#a8865a', '#b06a4a', '#8a9a6a'][i % 3]);
}

// ================= 人物（16×16 帧，2 帧 × 4 向，sheet 32×64） =================
// pal: {hair, skin, robe, robeDark, trim, pants}
function drawPersonFrame(ctx, ox, oy, pal, dir, frame) {
  const P = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); };
  const legSwing = frame === 1 ? 1 : 0;
  if (dir === 'down' || dir === 'up') {
    P(5, 1, 6, 2, pal.hair);
    P(4, 2, 1, 3, pal.hair); P(11, 2, 1, 3, pal.hair);
    if (dir === 'down') {
      P(5, 3, 6, 4, pal.skin);
      P(6, 4, 1, 1, '#1a1a1a'); P(9, 4, 1, 1, '#1a1a1a');
      P(7, 6, 2, 1, pal.robeDark);
    } else {
      P(5, 3, 6, 4, pal.hair);
    }
    P(4, 7, 8, 5, pal.robe);
    P(4, 7, 8, 1, pal.robeDark);
    P(3, 8, 1, 3, pal.robeDark); P(12, 8, 1, 3, pal.robeDark);
    P(4, 11, 8, 1, pal.trim);
    if (legSwing) { P(5, 12, 2, 2, pal.pants); P(9, 13, 2, 3, pal.pants); }
    else { P(5, 13, 2, 3, pal.pants); P(9, 12, 2, 2, pal.pants); }
    P(5, 14, 2, 1, '#2a2018'); P(9, 14, 2, 1, '#2a2018');
  } else {
    const flip = dir === 'right';
    ctx.save();
    if (flip) { ctx.translate(ox + 16, oy); ctx.scale(-1, 1); }
    const Q = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect((flip ? 0 : ox) + x, (flip ? 0 : oy) + y, w, h); };
    Q(4, 1, 7, 2, pal.hair);
    Q(4, 2, 2, 3, pal.hair);
    Q(6, 3, 5, 4, pal.skin);
    Q(7, 4, 1, 1, '#1a1a1a');
    Q(5, 7, 7, 5, pal.robe);
    Q(5, 7, 7, 1, pal.robeDark);
    Q(11, 8, 1, 3, pal.robeDark);
    Q(5, 11, 7, 1, pal.trim);
    if (legSwing) { Q(6, 12, 2, 2, pal.pants); Q(9, 13, 2, 3, pal.pants); }
    else { Q(6, 13, 2, 3, pal.pants); Q(9, 12, 2, 2, pal.pants); }
    ctx.restore();
  }
}

function charSheet(pal) {
  const [c, ctx] = makeCanvas(32, 64);
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((d, row) => {
    drawPersonFrame(ctx, 0, row * 16, pal, d, 0);
    drawPersonFrame(ctx, 16, row * 16, pal, d, 1);
  });
  return c;
}

// ================= 战斗精灵 48×48 =================
function battleWolf(fur = '#8a8f98', furD = '#5a5f68', furL = '#aab0b8', eye = '#d04838') {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const G = fur, D = furD, L = furL;
  P(6, 10, 12, 6, G); P(6, 10, 12, 2, D);
  P(7, 14, 10, 2, L);
  P(16, 8, 6, 5, G); P(16, 8, 6, 1, D);
  P(16, 5, 2, 3, D); P(20, 5, 2, 3, D);
  P(19, 9, 1, 1, eye); P(21, 10, 2, 2, L);
  P(7, 16, 2, 5, D); P(11, 16, 2, 5, D); P(15, 16, 2, 5, D);
  P(3, 8, 3, 3, G); P(1, 6, 2, 2, D);
  P(18, 11, 1, 1, '#1a1a1a');
  return c;
}

function battleSnake() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const G = '#4a8a3a', D = '#35682a', B = '#c8c06a';
  P(3, 16, 12, 3, G); P(3, 16, 12, 1, D);
  P(13, 11, 3, 6, G); P(13, 11, 3, 1, D);
  P(8, 9, 8, 3, G); P(8, 9, 8, 1, D);
  P(5, 11, 3, 4, G);
  P(15, 7, 5, 4, G); P(15, 7, 5, 1, D);
  P(17, 8, 1, 1, '#d04838');
  P(20, 9, 2, 1, '#d04838');
  P(4, 17, 10, 1, B);
  return c;
}

function battleBandit(palette) {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const { robe, robeD, band, hair } = palette;
  P(8, 12, 8, 9, robe); P(8, 12, 8, 2, robeD);
  P(7, 13, 1, 5, robeD); P(16, 13, 1, 5, robeD);
  P(9, 5, 6, 5, '#d8a878');
  P(9, 4, 6, 2, hair); P(9, 5, 6, 1, band);
  P(10, 7, 1, 1, '#1a1a1a'); P(13, 7, 1, 1, '#1a1a1a');
  P(9, 20, 2, 4, '#33302a'); P(13, 20, 2, 4, '#33302a');
  P(16, 12, 4, 1, '#c8ccd4'); P(20, 11, 2, 2, '#c8ccd4'); P(15, 13, 2, 2, '#6a4a32');
  P(5, 21, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleFox() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const O = '#d08030', D = '#9a5a1e', W = '#efe6d0';
  P(5, 12, 10, 5, O); P(5, 12, 10, 2, D);
  P(13, 8, 6, 5, O);
  P(13, 4, 2, 4, D); P(18, 4, 2, 4, O); P(18, 4, 2, 1, D);
  P(18, 10, 2, 2, W);
  P(15, 9, 1, 1, '#2a1a10'); P(19, 9, 1, 1, '#2a1a10') ;
  P(0, 5, 5, 9, O); P(0, 4, 3, 3, W);
  P(6, 17, 2, 4, D); P(12, 17, 2, 4, D);
  P(5, 12, 8, 1, W);
  return c;
}

function battleShikui() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const S = '#7a9a6a', D = '#5a7450', C = '#4a4a44';
  P(9, 3, 6, 5, S); P(9, 3, 6, 1, D);
  P(10, 5, 2, 1, '#111'); P(13, 5, 1, 1, '#111');
  P(10, 7, 1, 1, '#111');
  P(8, 9, 8, 9, C); P(8, 9, 8, 2, '#3a3a36');
  P(9, 13, 3, 2, S); P(13, 10, 2, 2, C);
  P(15, 10, 5, 2, S); P(15, 13, 5, 2, D);
  P(20, 10, 1, 1, '#111'); P(20, 13, 1, 1, '#111');
  P(9, 18, 2, 5, '#33302a'); P(13, 18, 2, 4, '#33302a');
  return c;
}

function battleGuihuo() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const O = '#3a6ac8', M = '#6aa8e8', I = '#a8dcf8';
  const flame = [[10, 2, 4, 2, O], [8, 4, 8, 4, O], [7, 8, 10, 6, O], [6, 14, 12, 6, O],
    [9, 6, 6, 6, M], [8, 12, 8, 6, M], [10, 10, 4, 5, I]];
  for (const [x, y, w, h, col] of flame) P(x, y, w, h, col);
  P(9, 11, 2, 2, '#122a4a'); P(13, 11, 2, 2, '#122a4a');
  P(10, 16, 4, 1, '#122a4a');
  P(5, 18, 2, 4, M); P(17, 16, 2, 6, O); P(12, 20, 2, 3, M);
  return c;
}

// ---- 前期拓展：落霞林 / 惊鸿涧 ----
function battleHou() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const F = '#8a6238', D = '#6a4a28', S = '#d8b090';
  P(7, 10, 9, 8, F); P(7, 10, 9, 2, D);              // 弓背躯干
  P(8, 17, 2, 4, D); P(13, 17, 2, 4, D);             // 后腿
  P(4, 11, 3, 2, F); P(4, 13, 2, 2, S);              // 前臂
  P(15, 11, 3, 2, F); P(17, 13, 2, 2, S);
  P(8, 4, 7, 6, F); P(9, 6, 5, 4, S);                // 头+脸
  P(6, 3, 2, 3, D); P(15, 3, 2, 3, D);               // 耳
  P(10, 7, 1, 1, '#1a1a1a'); P(13, 7, 1, 1, '#1a1a1a');
  P(11, 9, 2, 1, '#8a4a3a');
  P(17, 8, 2, 2, F); P(19, 6, 2, 2, F); P(20, 4, 2, 2, F); P(21, 2, 2, 2, D); // 翘尾
  P(5, 21, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleZhufeng() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const Y = '#d8b03a', K = '#3a3222', W = 'rgba(210,230,240,0.75)';
  P(9, 3, 7, 4, W); P(13, 4, 6, 3, W);               // 双翼
  P(5, 9, 11, 7, Y);                                  // 腹
  P(7, 9, 2, 7, K); P(11, 9, 2, 7, K); P(14, 9, 2, 7, K);
  P(3, 11, 2, 3, K);                                  // 尾针
  P(15, 8, 5, 5, K); P(16, 6, 3, 2, K);              // 头
  P(17, 10, 1, 1, '#e04030'); P(19, 10, 1, 1, '#e04030');
  P(8, 16, 1, 4, K); P(12, 16, 1, 4, K); P(16, 15, 1, 4, K);
  P(5, 21, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleYezhu() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const B = '#6a4a34', D = '#4e3624', S = '#c88a7a';
  P(4, 9, 13, 8, B); P(4, 9, 13, 2, D);              // 躯干
  P(5, 8, 12, 1, D);                                  // 背鬃
  P(16, 8, 6, 7, B); P(16, 8, 6, 1, D);              // 头
  P(21, 11, 3, 4, S); P(22, 12, 1, 2, '#8a5a4a');    // 猪鼻
  P(17, 10, 1, 1, '#1a1a1a');
  P(20, 15, 2, 1, '#efe6d0'); P(17, 15, 2, 1, '#efe6d0'); // 獠牙
  P(5, 17, 2, 4, D); P(9, 17, 2, 4, D); P(13, 17, 2, 4, D); P(15, 17, 2, 4, D);
  P(5, 21, 15, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleHeixiong() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const F = '#3a3230', D = '#282220', M = '#8a6a4a';
  P(4, 8, 14, 10, F); P(4, 8, 14, 2, D);             // 厚躯
  P(14, 5, 7, 6, F);                                  // 头
  P(14, 3, 2, 2, D); P(19, 3, 2, 2, D);              // 耳
  P(18, 8, 3, 3, M);                                  // 口鼻
  P(15, 7, 1, 1, '#e04030'); P(17, 7, 1, 1, '#e04030');
  P(2, 9, 3, 8, F); P(19, 9, 3, 2, F); P(19, 11, 3, 2, M); // 前肢+爪
  P(5, 18, 3, 4, D); P(12, 18, 3, 4, D);
  P(4, 22, 16, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleShuyao() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const L = '#4a8a3a', D = '#35682a', T = '#6a4a2a', TD = '#4e3620';
  P(5, 1, 12, 5, D); P(4, 4, 15, 6, L); P(6, 3, 10, 4, L); // 树冠
  P(7, 5, 4, 2, '#5a9a46'); P(13, 6, 4, 2, '#5a9a46');
  P(9, 10, 7, 11, T); P(9, 10, 7, 2, TD);            // 树干
  P(10, 12, 5, 4, '#2a1a10');                         // 树洞
  P(11, 13, 1, 1, '#e8d44c'); P(13, 13, 1, 1, '#e8d44c');
  P(8, 14, 1, 4, TD); P(16, 13, 1, 5, TD);           // 伸枝
  P(8, 21, 3, 2, TD); P(14, 21, 3, 2, TD);           // 根
  P(5, 22, 15, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleShanxiao() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const F = '#5a5060', D = '#443c4a', S = '#3a7a5a';
  P(8, 9, 9, 10, F); P(8, 9, 9, 2, D);               // 躯干
  P(9, 2, 8, 7, F); P(10, 4, 6, 4, S);               // 头+青脸
  P(4, 4, 2, 3, D); P(19, 4, 2, 3, D);
  P(11, 5, 1, 1, '#e04030'); P(14, 5, 1, 1, '#e04030');
  P(12, 7, 2, 1, '#efe6d0');                          // 獠牙
  P(3, 10, 3, 11, F); P(3, 20, 3, 2, S);             // 长臂垂地
  P(19, 10, 3, 11, F); P(19, 20, 3, 2, S);
  P(10, 19, 2, 4, D); P(14, 19, 2, 4, D);
  P(4, 22, 16, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleCangdiao() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const B = '#5a6a7a', D = '#414c58', W = '#d8dce2', K = '#d08030';
  P(1, 5, 9, 3, D); P(2, 6, 7, 2, B);                // 左翼
  P(14, 5, 9, 3, D); P(15, 6, 7, 2, B);              // 右翼
  P(8, 9, 8, 8, B); P(8, 9, 8, 2, D);                // 躯干
  P(14, 6, 5, 5, W);                                  // 白头
  P(18, 8, 3, 2, K);                                  // 喙
  P(16, 7, 1, 1, '#1a1a1a');
  P(7, 17, 8, 2, D); P(6, 18, 3, 3, D);              // 尾羽
  P(9, 17, 2, 4, K); P(13, 17, 2, 4, K);             // 爪
  P(5, 22, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleYanjia() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const S = '#7a7a72', D = '#5a5a54', HL = '#94948a', S2 = '#8a8a80';
  P(4, 6, 15, 11, S); P(4, 6, 15, 2, HL);            // 岩壳
  P(6, 9, 4, 2, D); P(12, 9, 4, 2, D); P(9, 13, 5, 2, D);
  P(3, 9, 2, 5, D); P(18, 9, 2, 5, D);               // 壳刺
  P(18, 11, 6, 6, S2); P(21, 13, 1, 1, '#1a1a1a');   // 头
  P(22, 15, 2, 1, '#4e3624');
  P(6, 17, 3, 5, D); P(13, 17, 3, 5, D);             // 粗腿
  P(4, 22, 17, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleShuigui() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const B = '#4a8a8a', D = '#356868', I = '#c8f0e8';
  P(8, 4, 8, 6, B); P(9, 6, 6, 4, D);                // 头
  P(10, 6, 1, 2, I); P(13, 6, 1, 2, I);              // 白瞳
  P(7, 10, 10, 8, B); P(7, 10, 10, 2, D);            // 躯干
  P(4, 11, 3, 7, B); P(4, 17, 2, 3, D);              // 滴水长臂
  P(17, 11, 3, 7, B); P(18, 17, 2, 3, D);
  P(9, 18, 3, 3, D); P(13, 18, 3, 2, B);             // 下身消散
  P(11, 21, 2, 2, D);
  P(4, 22, 16, 1, 'rgba(90,170,210,0.5)');           // 水痕
  return c;
}

function battleBoss() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#3a2a4a', RD = '#241a30', M = '#d8d0c0', MD = '#b0a890';
  P(8, 1, 8, 3, RD);
  P(7, 4, 10, 5, R);
  P(9, 4, 6, 6, M); P(9, 4, 6, 1, MD);
  P(10, 6, 2, 1, '#c03030'); P(13, 6, 2, 1, '#c03030');
  P(11, 9, 3, 1, '#8a8070');
  P(5, 9, 14, 4, R); P(5, 9, 14, 1, '#6a4a8a');
  P(6, 13, 12, 8, R);
  P(4, 17, 16, 6, RD); P(3, 20, 18, 4, RD);
  P(6, 13, 1, 8, '#6a4a8a'); P(17, 13, 1, 8, '#6a4a8a');
  P(10, 15, 4, 1, '#c8a84c');
  P(3, 22, 2, 3, '#7a4ac0'); P(19, 21, 2, 4, '#7a4ac0'); P(10, 23, 3, 2, '#5a3a9a');
  return c;
}

// ---- 第二章：黑风寨 ----
function battleFeizei() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#4a5a42', RD = '#36422f', B = '#c03a2e';
  P(9, 4, 6, 2, '#2a2a2a');              // 蒙面巾
  P(9, 6, 6, 4, '#d8a878'); P(10, 7, 1, 1, '#1a1a1a'); P(13, 7, 1, 1, '#1a1a1a');
  P(8, 10, 7, 8, R); P(8, 10, 7, 2, RD); // 窄身劲装
  P(7, 11, 1, 4, RD); P(15, 11, 1, 4, RD);
  P(4, 11, 4, 1, B); P(3, 10, 1, 2, B);  // 飘起的红巾
  P(8, 14, 7, 1, '#2a2a2a');             // 腰带
  P(9, 18, 2, 5, '#33302a'); P(13, 18, 2, 5, '#33302a');
  P(15, 10, 4, 1, '#c8ccd4'); P(18, 9, 2, 1, '#c8ccd4'); // 短刃
  P(5, 22, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleLangwang() {
  return battleWolf('#3a3d44', '#26282e', '#4a4e56', '#e04030');
}

function battleFeibing() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const S = '#7a7a82', SD = '#5a5a62', HL = '#9a9aa4';
  P(8, 3, 8, 3, S); P(8, 3, 8, 1, HL);   // 铁盔
  P(8, 5, 2, 1, S); P(14, 5, 2, 1, S);   // 盔耳
  P(10, 6, 4, 3, '#d8a878'); P(10, 7, 1, 1, '#1a1a1a'); P(13, 7, 1, 1, '#1a1a1a');
  P(7, 9, 10, 9, S); P(7, 9, 10, 2, HL); // 甲身
  P(9, 12, 6, 1, SD); P(9, 15, 6, 1, SD);
  P(5, 10, 2, 4, SD); P(17, 10, 2, 4, SD); // 护肩
  P(9, 18, 2, 5, '#3a3a40'); P(13, 18, 2, 5, '#3a3a40');
  P(19, 5, 1, 12, '#6a4a32');            // 长枪杆
  P(18, 3, 3, 3, HL); P(19, 2, 1, 1, HL); // 枪头
  P(5, 22, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleXieshi() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#3a2a4a', RD = '#281c36', G = '#7a4ac0';
  P(8, 2, 8, 5, R); P(8, 2, 8, 1, '#4a3a5e'); // 兜帽
  P(10, 5, 4, 3, '#1a1420');                   // 帽影
  P(10, 6, 1, 1, '#8ae0e0'); P(13, 6, 1, 1, '#8ae0e0'); // 幽光眼
  P(7, 8, 10, 11, R); P(7, 8, 10, 2, RD);
  P(9, 12, 6, 1, RD);
  P(5, 19, 14, 4, RD); P(4, 21, 16, 2, RD);   // 下摆铺开
  P(3, 9, 4, 2, R);                            // 抬起的左臂
  P(1, 6, 4, 4, G); P(2, 5, 2, 6, G);          // 灵力法球
  P(2, 7, 2, 2, '#b48ae8');
  P(5, 23, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleHufa() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const A = '#4a3a3a', AD = '#382c2c', G = '#c8a84c';
  P(8, 3, 8, 2, '#8a3a2e');               // 束发红带
  P(11, 1, 2, 2, '#2a2a2a');              // 发髻
  P(9, 5, 6, 4, '#d8a878'); P(10, 6, 1, 1, '#1a1a1a'); P(13, 6, 1, 1, '#1a1a1a');
  P(7, 9, 10, 10, A); P(7, 9, 10, 2, AD);
  P(7, 12, 10, 1, G);                     // 金绦
  P(5, 10, 2, 5, AD); P(17, 10, 2, 5, AD);
  P(9, 19, 2, 5, '#2a2622'); P(13, 19, 2, 5, '#2a2622');
  P(16, 8, 5, 1, '#c8ccd4'); P(20, 7, 2, 1, '#c8ccd4'); // 长刀斜举
  P(15, 10, 2, 2, '#6a4a32');
  P(5, 23, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleBossHeifeng() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const A = '#3a3a42', AD = '#2a2a32', F = '#5a4232', FD = '#44311f', G = '#c8a84c';
  P(6, 2, 12, 3, '#55555e'); P(6, 2, 12, 1, '#6a6a74'); // 铁盔
  P(7, 5, 10, 6, '#c89878');                             // 脸
  P(8, 9, 8, 3, '#3a3230');                              // 络腮胡
  P(9, 6, 2, 1, '#c03030'); P(13, 6, 2, 1, '#c03030');   // 赤目
  P(4, 10, 16, 5, F); P(4, 13, 16, 2, FD);               // 兽皮披风
  P(2, 14, 2, 3, F); P(20, 14, 2, 3, F);
  P(5, 15, 14, 8, A); P(5, 15, 14, 2, AD);               // 甲身
  P(8, 18, 8, 1, AD);
  P(5, 21, 14, 2, '#8a6a2a');                            // 腰带
  P(11, 21, 2, 2, G);
  P(7, 23, 3, 3, '#2a2622'); P(14, 23, 3, 3, '#2a2622');
  P(21, 6, 2, 14, '#c8ccd4'); P(21, 6, 1, 14, '#e8ecf4');// 九环大刀
  P(19, 13, 2, 2, G);                                    // 刀镡
  P(23, 18, 1, 4, '#6a4a32');
  P(3, 26, 19, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleLuoFighter() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const H = '#c8d4dc', R = '#3e4e66', RD = '#2e3a4e', T = '#8ab0d8';
  P(8, 2, 7, 2, H); P(8, 4, 2, 7, H); P(15, 3, 1, 6, H); // 银发
  P(10, 4, 5, 4, '#f0c8a8');                              // 脸（朝左）
  P(10, 5, 1, 1, '#1a1a1a');
  P(9, 3, 5, 1, '#e0e8ec');
  P(8, 8, 8, 9, R); P(8, 8, 8, 2, RD);
  P(8, 12, 8, 1, T);                                      // 衣绦
  P(6, 9, 2, 6, RD);                                      // 广袖
  P(4, 11, 2, 2, '#f0c8a8');
  P(1, 11, 6, 1, '#cfe0ec'); P(0, 10, 1, 3, '#cfe0ec');   // 长刀前指
  P(7, 11, 2, 1, '#4a3a2a');
  P(9, 17, 2, 6, '#26303e'); P(12, 17, 2, 5, '#26303e');
  P(5, 21, 15, 1, 'rgba(0,0,0,0.35)');
  return c;
}

// ---- 第三章：血煞教 ----
function battleXueshatu() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#8a2a2a', RD = '#6a1e1e', M = '#d8b0a0';
  P(8, 4, 8, 2, RD); P(10, 6, 4, 3, M);     // 兜帽遮面
  P(10, 7, 1, 1, '#e04030'); P(13, 7, 1, 1, '#e04030'); // 红目
  P(7, 9, 10, 10, R); P(7, 9, 10, 2, RD);
  P(5, 10, 2, 6, RD); P(17, 10, 2, 6, RD);
  P(9, 12, 6, 1, '#5a1616');                // 血纹腰带
  P(8, 14, 8, 1, '#e0c060');                // 金纹
  P(5, 19, 14, 3, RD);                      // 血色下摆
  P(9, 22, 2, 3, '#2a1a1a'); P(13, 22, 2, 3, '#2a1a1a');
  P(15, 11, 4, 1, '#c8ccd4'); P(18, 10, 2, 2, '#c8ccd4'); // 弯刀
  P(4, 24, 16, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleShagui() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const S = '#6a5a50', D = '#4e423a', X = '#8a3a3a';
  P(9, 3, 6, 4, S); P(9, 3, 6, 1, D);       // 石质头颅
  P(10, 5, 2, 1, '#e04030'); P(13, 5, 2, 1, '#e04030'); // 煞气红目
  P(10, 6, 4, 1, D);
  P(7, 8, 10, 11, S); P(7, 8, 10, 2, D);
  P(9, 11, 2, 3, X); P(13, 14, 2, 3, X);    // 裂纹中的血煞结晶
  P(4, 10, 3, 3, S); P(4, 14, 3, 4, D);     // 粗壮左臂
  P(16, 10, 3, 3, S); P(16, 14, 3, 4, D);
  P(8, 19, 3, 5, D); P(13, 19, 3, 5, D);
  P(7, 24, 10, 1, 'rgba(0,0,0,0.4)');
  return c;
}

function battleXuenv() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const H = '#2a1a22', D = '#8a2a4a', L = '#c85a7a', SK = '#e8d0c8';
  P(8, 2, 8, 3, H); P(7, 4, 2, 10, H); P(15, 4, 2, 10, H); // 黑长发
  P(10, 5, 4, 4, SK); P(10, 6, 1, 1, '#e04030'); P(13, 6, 1, 1, '#e04030');
  P(9, 9, 6, 6, D); P(9, 9, 6, 1, L);       // 血色罗裙
  P(6, 10, 3, 6, D); P(15, 10, 3, 6, D);    // 飘袖
  P(4, 8, 2, 3, L); P(18, 8, 2, 3, L);      // 袖口血雾
  P(9, 15, 6, 7, D); P(8, 20, 8, 3, '#5a1e32');
  P(10, 22, 2, 3, SK); P(12, 22, 2, 3, SK);
  P(4, 25, 16, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleHushan() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const A = '#5a4a3a', AD = '#443828', G = '#c8a84c', S = '#7a7a82';
  P(8, 2, 8, 3, S); P(8, 2, 8, 1, '#8a8a94'); // 铁盔
  P(9, 5, 6, 4, '#c89878');
  P(10, 6, 1, 1, '#1a1a1a'); P(13, 6, 1, 1, '#1a1a1a');
  P(6, 9, 12, 11, A); P(6, 9, 12, 2, AD);   // 重甲
  P(8, 12, 8, 1, G); P(8, 16, 8, 1, G);
  P(4, 10, 2, 6, AD); P(18, 10, 2, 6, AD);  // 护肩
  P(6, 20, 12, 2, '#8a6a2a');
  P(8, 22, 3, 4, '#2a2622'); P(13, 22, 3, 4, '#2a2622');
  P(20, 4, 2, 16, '#6a4a32');               // 重刀立地
  P(19, 2, 4, 3, '#c8ccd4');
  P(4, 26, 18, 1, 'rgba(0,0,0,0.4)');
  return c;
}

function battleZuoshi() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#7a2038', RD = '#5a1628', M = '#d8b0a0', G = '#e0c060';
  P(8, 2, 8, 3, RD); P(11, 0, 2, 2, RD);    // 高帽
  P(9, 5, 6, 4, M);
  P(10, 6, 1, 1, '#e04030'); P(13, 6, 1, 1, '#e04030');
  P(11, 8, 2, 1, '#8a4040');
  P(6, 9, 12, 11, R); P(6, 9, 12, 2, RD);
  P(9, 12, 6, 1, G);                        // 金纹法衣
  P(4, 10, 2, 7, RD); P(18, 10, 2, 7, RD);
  P(6, 20, 12, 3, RD); P(5, 22, 14, 2, RD); // 血袍下摆
  P(2, 12, 3, 3, '#c03050'); P(3, 10, 2, 2, '#c03050'); // 左手血球
  P(10, 25, 4, 1, 'rgba(0,0,0,0.4)');
  return c;
}

function battleBossXueshazhu() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#4a1020', RD = '#300a14', M = '#c89878', X = '#c03050', G = '#d4af37';
  P(6, 1, 12, 4, RD); P(9, 0, 6, 2, RD);            // 血冠
  P(7, 5, 10, 6, M);
  P(9, 6, 2, 1, '#e04030'); P(13, 6, 2, 1, '#e04030'); // 血目
  P(10, 9, 4, 1, '#6a3040');
  P(11, 10, 2, 2, X);                                // 额间血晶
  P(4, 10, 16, 5, R); P(4, 13, 16, 2, X);            // 血袍肩氅
  P(2, 13, 2, 4, RD); P(20, 13, 2, 4, RD);
  P(5, 15, 14, 9, R); P(5, 15, 14, 2, RD);
  P(8, 18, 8, 1, G); P(8, 21, 8, 1, G);              // 金纹
  P(5, 24, 14, 3, RD);
  P(7, 27, 3, 3, '#1a0a10'); P(14, 27, 3, 3, '#1a0a10');
  P(21, 8, 3, 3, X); P(22, 11, 3, 3, X); P(21, 14, 3, 3, X); // 悬浮血珠
  P(3, 30, 19, 1, 'rgba(0,0,0,0.4)');
  return c;
}

// ---- 第四章：寒渊魔主 ----
function battleXuejiao() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const F = '#c8d4dc', D = '#94a6b4', E = '#e04030';
  P(6, 8, 12, 5, F); P(6, 8, 12, 2, D);      // 弓背雪躯
  P(7, 12, 10, 2, '#e8f0f4');
  P(15, 6, 6, 5, F); P(15, 6, 6, 1, D);      // 头
  P(17, 2, 2, 4, D); P(21, 2, 2, 4, D);      // 双角
  P(17, 8, 1, 1, E); P(19, 8, 1, 1, E);      // 血目
  P(14, 10, 2, 2, '#2a3238');                // 鼻
  P(0, 4, 5, 7, F); P(0, 3, 3, 3, D);        // 尾
  P(7, 13, 2, 6, D); P(11, 13, 2, 6, D); P(15, 13, 2, 5, D); // 长肢
  P(5, 6, 3, 3, F);                          // 背棘
  return c;
}

function battleBingkui() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const I = '#a8ccd8', D = '#7aa8b8', HL = '#d8ecf2';
  P(8, 4, 8, 5, I); P(8, 4, 8, 2, HL);       // 冰颅
  P(10, 6, 2, 1, '#2a4a5a'); P(13, 6, 2, 1, '#2a4a5a');
  P(6, 9, 12, 10, I); P(6, 9, 12, 2, HL);
  P(9, 12, 2, 4, D); P(13, 15, 2, 3, D);     // 冰棱裂纹
  P(3, 10, 3, 6, I); P(3, 8, 2, 3, HL);      // 巨臂
  P(18, 10, 3, 6, I); P(19, 8, 2, 3, HL);
  P(8, 19, 3, 6, D); P(13, 19, 3, 6, D);
  P(7, 25, 10, 1, 'rgba(40,80,100,0.4)');
  return c;
}

function battleYuanmo() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const M = '#3a2a4a', D = '#281c36', X = '#7a4ac0', E = '#e04030';
  P(8, 2, 8, 4, D); P(10, 0, 2, 3, D); P(13, 1, 1, 2, D); // 魔角颅
  P(10, 5, 4, 3, '#241a30');
  P(10, 6, 1, 1, E); P(13, 6, 1, 1, E);
  P(6, 8, 12, 10, M); P(6, 8, 12, 2, D);
  P(9, 12, 6, 1, X);                          // 紫纹
  P(3, 9, 3, 7, D); P(18, 9, 3, 7, D);        // 长爪臂
  P(2, 6, 2, 3, X); P(20, 6, 2, 3, X);        // 爪尖煞气
  P(7, 18, 3, 6, D); P(13, 18, 3, 6, D);
  P(5, 24, 14, 1, 'rgba(20,8,30,0.5)');
  return c;
}

function battleShaling() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const S = '#5a6a8a', HL = '#8a9ac0', E = '#e0e060';
  // 无形煞灵：飘浮的雾状上身 + 渐隐下摆
  const veil = [[8, 4, 8, 4, S], [6, 8, 12, 7, S], [5, 15, 14, 5, HL], [7, 20, 10, 3, S], [9, 23, 6, 2, HL], [11, 25, 3, 1, S]];
  for (const [x, y, w, h, col] of veil) P(x, y, w, h, col);
  P(10, 6, 2, 1, E); P(13, 6, 2, 1, E);       // 黄瞳
  P(8, 2, 3, 2, HL); P(14, 3, 2, 2, S);       // 雾角
  P(4, 10, 2, 5, HL); P(18, 10, 2, 5, HL);    // 雾袖
  P(10, 12, 4, 1, '#3a4a6a');
  return c;
}

function battleYuanmojiang() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const A = '#2e2a3e', AD = '#1e1a2c', X = '#7a4ac0', E = '#e04030', B = '#4a4460';
  P(6, 1, 12, 3, AD); P(4, 2, 3, 2, AD); P(17, 2, 3, 2, AD); // 魔盔双角
  P(7, 4, 10, 5, '#5a5068');
  P(9, 6, 2, 1, E); P(13, 6, 2, 1, E);
  P(11, 9, 3, 1, '#3a3244');
  P(4, 9, 16, 5, B); P(4, 9, 16, 2, A);       // 兽皮披
  P(2, 12, 2, 4, AD); P(20, 12, 2, 4, AD);
  P(5, 14, 14, 9, A); P(5, 14, 14, 2, AD);
  P(8, 17, 8, 1, X);
  P(5, 21, 14, 2, '#3a3450');
  P(7, 23, 3, 4, AD); P(14, 23, 3, 4, AD);
  P(21, 5, 2, 16, '#6a5a8a');                 // 巨斧柄
  P(18, 2, 8, 4, '#c8ccd4'); P(19, 6, 6, 2, '#c8ccd4'); // 斧刃
  P(3, 27, 19, 1, 'rgba(10,4,20,0.5)');
  return c;
}

function battleBossXuanming() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#1e1826', RD = '#120e1a', M = '#8a8298', HL = '#b0a8c0', X = '#7a4ac0', E = '#e04030';
  P(5, 0, 14, 4, RD); P(8, 0, 8, 2, '#0c0812');           // 垂天魔冠
  P(6, 4, 12, 6, R);
  P(8, 5, 8, 5, M); P(8, 5, 8, 1, HL);                    // 灰白魔面
  P(9, 7, 2, 1, E); P(13, 7, 2, 1, E);                    // 血目
  P(10, 10, 4, 1, '#4a4258');
  P(4, 10, 16, 5, R); P(4, 12, 16, 2, X);                 // 魔纹披领
  P(1, 12, 3, 6, RD); P(20, 12, 3, 6, RD);                // 广袖垂落
  P(3, 15, 18, 10, R); P(3, 15, 18, 2, RD);
  P(7, 18, 10, 1, X); P(7, 21, 10, 1, X);
  P(3, 25, 18, 4, RD);
  P(6, 29, 3, 3, '#0c0812'); P(15, 29, 3, 3, '#0c0812');
  P(23, 6, 2, 20, '#3a3252');                             // 渊魔权杖
  P(21, 3, 6, 4, X); P(22, 2, 4, 2, HL);                  // 杖首魔晶
  P(2, 32, 21, 1, 'rgba(6,2,12,0.55)');
  return c;
}

function battleShenFighter() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const H = '#4a4258', R = '#e4e0d0', RD = '#c2bca8', T = '#7a8ac0';
  P(9, 2, 6, 2, H); P(8, 3, 1, 5, H); P(15, 3, 1, 5, H);  // 束发
  P(11, 1, 3, 2, H);                                       // 发髻
  P(10, 4, 5, 4, '#e8c0a0');                               // 脸（朝左）
  P(10, 5, 1, 1, '#1a1a1a');
  P(8, 8, 8, 9, R); P(8, 8, 8, 2, RD);
  P(8, 12, 8, 1, T);                                       // 琴纹衣绦
  P(6, 9, 2, 6, RD);                                       // 广袖
  P(4, 10, 2, 2, '#e8c0a0');
  P(1, 10, 3, 2, '#8a6a42'); P(2, 9, 1, 4, '#8a6a42');     // 横抱古琴
  P(1, 9, 3, 1, '#d8d0c0');                                // 琴弦
  P(9, 17, 2, 6, '#3a3244'); P(12, 17, 2, 5, '#3a3244');
  P(5, 21, 15, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleHeroFighter() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const H = '#2a2a30', R = '#3a5a8a', RD = '#2c4568', T = '#c8a84c';
  P(9, 3, 6, 5, '#e8b888');         // 脸（朝左）
  P(9, 2, 6, 2, H); P(8, 3, 1, 3, H); P(9, 4, 2, 1, T);
  P(10, 5, 1, 1, '#1a1a1a');
  P(8, 8, 8, 8, R); P(8, 8, 8, 2, RD);
  P(7, 9, 1, 5, RD);
  P(8, 14, 8, 1, T);
  P(9, 15, 2, 6, '#33302a'); P(12, 15, 2, 5, '#33302a');
  P(6, 9, 2, 4, R);                 // 持剑臂
  P(2, 9, 5, 1, '#c8ccd4'); P(1, 8, 1, 3, '#c8ccd4'); // 剑
  P(7, 8, 1, 3, '#6a4a32');
  P(5, 21, 15, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleLiuFighter() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const H = '#3a4a3a', R = '#e4e0d0', RD = '#c2bca8', T = '#5a8a5a';
  P(9, 2, 6, 6, H); P(8, 3, 1, 6, H); P(15, 3, 1, 5, H); // 长发
  P(9, 4, 5, 4, '#e8c0a0');
  P(14, 5, 1, 1, '#2a2a2a');
  P(8, 8, 8, 9, R); P(8, 8, 8, 2, RD);
  P(8, 12, 8, 1, T);
  P(6, 9, 2, 6, RD);                 // 广袖
  P(4, 12, 2, 2, '#e8c0a0');
  P(9, 17, 2, 4, '#5a4a5a'); P(12, 17, 2, 4, '#5a4a5a');
  P(14, 3, 1, 2, T);                 // 发饰
  P(5, 21, 15, 1, 'rgba(0,0,0,0.35)');
  return c;
}

// ================= 头像 32×32 =================
function portrait(bg, paint) {
  const [c, ctx] = makeCanvas(32, 32);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 32, 32);
  const P = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  paint(P);
  ctx.strokeStyle = '#8a6d3b'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 30, 30);
  return c;
}

const PORTRAITS = {
  face_hero: (P) => {
    P(10, 26, 12, 6, '#3a5a8a');
    P(9, 6, 14, 6, '#2a2a30'); P(8, 8, 2, 5, '#2a2a30'); P(22, 8, 2, 5, '#2a2a30');
    P(10, 9, 12, 12, '#e8b888');
    P(9, 8, 14, 2, '#c8a84c');
    P(12, 13, 2, 2, '#1a1a1a'); P(18, 13, 2, 2, '#1a1a1a');
    P(14, 18, 4, 1, '#a06a4a');
  },
  face_liu: (P) => {
    P(10, 26, 12, 6, '#e4e0d0');
    P(8, 5, 16, 8, '#3a4a3a'); P(7, 8, 2, 12, '#3a4a3a'); P(23, 8, 2, 12, '#3a4a3a');
    P(10, 9, 12, 12, '#f0c8a8');
    P(14, 6, 4, 2, '#5a8a5a');
    P(12, 13, 2, 2, '#2a2a2a'); P(18, 13, 2, 2, '#2a2a2a');
    P(13, 14, 1, 3, '#d88a7a'); P(18, 14, 1, 3, '#d88a7a');
    P(14, 18, 4, 1, '#c06a5a');
  },
  face_zhangmen: (P) => {
    P(10, 26, 12, 6, '#5a4a6a');
    P(9, 5, 14, 6, '#c8c4bc'); P(14, 2, 4, 4, '#c8c4bc');
    P(10, 9, 12, 11, '#d8b090');
    P(11, 13, 2, 2, '#3a3a3a'); P(19, 13, 2, 2, '#3a3a3a');
    P(11, 16, 1, 2, '#b0907a'); P(20, 16, 1, 2, '#b0907a');
    P(9, 18, 14, 8, '#d8d4cc'); P(12, 24, 8, 4, '#d8d4cc');
    P(14, 19, 4, 1, '#8a7a6a');
  },
  face_shangren: (P) => {
    P(10, 26, 12, 6, '#8a6a3a');
    P(7, 3, 18, 3, '#6a4a2a'); P(9, 6, 14, 4, '#6a4a2a');
    P(10, 10, 12, 11, '#d8a878');
    P(12, 14, 2, 2, '#2a2a2a'); P(18, 14, 2, 2, '#2a2a2a');
    P(11, 19, 10, 2, '#4a3a2a');
    P(14, 21, 4, 2, '#c07a5a');
  },
  face_dizi: (P) => {
    P(10, 26, 12, 6, '#7a8a9a');
    P(9, 6, 14, 5, '#3a3a40');
    P(10, 9, 12, 12, '#d8a878');
    P(12, 13, 2, 2, '#1a1a1a'); P(18, 13, 2, 2, '#1a1a1a');
    P(14, 18, 4, 1, '#a06a4a');
  },
  face_hunter: (P) => {
    P(10, 26, 12, 6, '#6a5a3a');
    P(6, 4, 20, 3, '#a08a4a'); P(9, 7, 14, 4, '#a08a4a');
    P(10, 10, 12, 11, '#c89060');
    P(12, 14, 2, 2, '#2a2a2a'); P(18, 14, 2, 2, '#2a2a2a');
    P(12, 19, 8, 2, '#8a8a8a');
    P(14, 22, 4, 1, '#7a5a3a');
  },
  face_boss: (P) => {
    P(8, 26, 16, 6, '#241a30');
    P(6, 2, 20, 22, '#3a2a4a'); P(8, 4, 16, 18, '#241a30');
    P(10, 8, 12, 14, '#d8d0c0');
    P(12, 12, 2, 2, '#c03030'); P(18, 12, 2, 2, '#c03030');
    P(11, 11, 4, 1, '#8a8070'); P(17, 11, 4, 1, '#8a8070');
    P(14, 18, 4, 1, '#6a6055');
  },
  face_luo: (P) => {
    P(10, 26, 12, 6, '#3e4e66');
    P(8, 5, 16, 8, '#c8d4dc'); P(7, 8, 2, 12, '#c8d4dc'); P(23, 8, 2, 12, '#c8d4dc');
    P(10, 9, 12, 12, '#f0c8a8');
    P(9, 7, 14, 2, '#e0e8ec');
    P(12, 13, 2, 2, '#2a3a4a'); P(18, 13, 2, 2, '#2a3a4a');
    P(11, 12, 3, 1, '#b09a8a'); P(18, 12, 3, 1, '#b09a8a');
    P(21, 15, 1, 3, '#d09a8a');
    P(14, 18, 4, 1, '#c06a5a');
  },
  face_huolang: (P) => {
    P(10, 26, 12, 6, '#7a6a4a');
    P(7, 4, 18, 4, '#8a7a5a'); P(9, 7, 14, 3, '#8a7a5a'); P(7, 4, 2, 10, '#8a7a5a'); P(23, 4, 2, 10, '#8a7a5a');
    P(10, 10, 12, 11, '#d8a878');
    P(11, 12, 3, 1, '#6a4a2a'); P(18, 13, 3, 1, '#6a4a2a');
    P(12, 14, 2, 2, '#2a2a2a'); P(18, 14, 2, 2, '#2a2a2a');
    P(12, 15, 1, 3, '#a07858'); P(19, 15, 1, 3, '#a07858');
    P(13, 19, 6, 1, '#7a5a3a'); P(13, 20, 1, 1, '#7a5a3a'); P(18, 20, 1, 1, '#7a5a3a');
  },
  face_heifeng: (P) => {
    P(8, 26, 16, 6, '#4a3a3a');
    P(6, 2, 20, 6, '#55555e'); P(6, 2, 20, 2, '#6a6a74'); P(5, 7, 22, 2, '#44444e');
    P(9, 9, 14, 12, '#c89878');
    P(9, 18, 14, 4, '#3a3230'); P(10, 21, 12, 3, '#3a3230');
    P(11, 13, 2, 2, '#c03030'); P(19, 13, 2, 2, '#c03030');
    P(10, 11, 5, 1, '#8a8070'); P(17, 11, 5, 1, '#8a8070');
    P(14, 15, 3, 3, '#a87858');
    P(13, 19, 6, 1, '#6a5040');
  },
  face_yaonong: (P) => {
    P(10, 26, 12, 6, '#6a6a5a');
    P(9, 5, 14, 5, '#c8c4bc'); P(8, 7, 2, 8, '#c8c4bc'); P(22, 7, 2, 8, '#c8c4bc');
    P(10, 10, 12, 11, '#c8a078');
    P(9, 8, 14, 2, '#b8b4ac');
    P(12, 14, 2, 2, '#2a2a2a'); P(18, 14, 2, 2, '#2a2a2a');
    P(11, 12, 3, 1, '#8a8478'); P(18, 12, 3, 1, '#8a8478');
    P(11, 18, 3, 4, '#8a8078'); P(18, 18, 3, 4, '#8a8078'); // 白须
    P(14, 21, 4, 1, '#7a5a4a');
  },
  face_xuesha: (P) => {
    P(8, 26, 16, 6, '#300a14');
    P(6, 2, 20, 20, '#4a1020'); P(8, 4, 16, 16, '#300a14');
    P(10, 8, 12, 14, '#c89878');
    P(12, 12, 2, 2, '#e04030'); P(18, 12, 2, 2, '#e04030');
    P(11, 10, 4, 1, '#8a3040'); P(17, 10, 4, 1, '#8a3040');
    P(14, 9, 4, 3, '#c03050');                      // 额间血晶
    P(10, 18, 12, 6, '#5a1e2e'); P(11, 21, 10, 3, '#5a1e2e'); // 血纹络腮
    P(13, 19, 6, 1, '#8a4040');
  },
  face_shen: (P) => {
    P(10, 26, 12, 6, '#e4e0d0');
    P(9, 5, 14, 6, '#4a4258'); P(11, 3, 6, 3, '#4a4258');   // 束发发髻
    P(10, 9, 12, 12, '#e8c0a8');
    P(12, 13, 2, 2, '#2a2a2a'); P(18, 13, 2, 2, '#2a2a2a');
    P(11, 12, 3, 1, '#5a5264'); P(18, 12, 3, 1, '#5a5264');
    P(14, 18, 4, 1, '#a06a4a');
    P(8, 8, 2, 10, '#4a4258');                              // 垂发
  },
  face_cunzhang: (P) => {
    P(10, 26, 12, 6, '#6a5a4a');
    P(9, 5, 14, 5, '#c8c4bc'); P(8, 7, 2, 9, '#c8c4bc'); P(22, 7, 2, 9, '#c8c4bc');
    P(10, 10, 12, 11, '#c8a078');
    P(12, 14, 2, 2, '#2a2a2a'); P(18, 14, 2, 2, '#2a2a2a');
    P(11, 12, 3, 1, '#9a948a'); P(18, 12, 3, 1, '#9a948a');
    P(13, 16, 6, 6, '#d8d4cc'); P(14, 22, 4, 3, '#d8d4cc'); // 长髯
    P(14, 15, 4, 1, '#8a7a6a');
  },
  face_laoban: (P) => {
    P(10, 26, 12, 6, '#8a6a3a');
    P(9, 4, 14, 4, '#6a4a2a'); P(14, 3, 4, 2, '#c8b28a');   // 瓜皮帽
    P(10, 9, 12, 11, '#d8a878');
    P(12, 13, 2, 2, '#2a2a2a'); P(18, 13, 2, 2, '#2a2a2a');
    P(11, 18, 10, 2, '#4a3a2a');
    P(14, 20, 4, 2, '#c07a5a');
    P(9, 15, 1, 3, '#b08858'); P(22, 15, 1, 3, '#b08858');
  },
  face_xiaoer: (P) => {
    P(10, 26, 12, 6, '#4a7a5a');
    P(8, 4, 16, 4, '#e8e4d8'); P(8, 3, 16, 2, '#f4f0e4');            // 小二白巾
    P(10, 8, 12, 12, '#e0b090');
    P(12, 12, 2, 2, '#1a1a1a'); P(18, 12, 2, 2, '#1a1a1a');
    P(13, 17, 6, 2, '#8a5a3a');
    P(12, 16, 1, 1, '#c87a5a'); P(19, 16, 1, 1, '#c87a5a');           // 笑纹
  },
  face_cunv: (P) => {
    P(10, 26, 12, 6, '#a86a5a');
    P(8, 5, 16, 8, '#4a3222'); P(7, 8, 2, 10, '#4a3222'); P(23, 8, 2, 10, '#4a3222');
    P(13, 4, 6, 3, '#4a3222');                                        // 发髻
    P(15, 5, 2, 2, '#d06a5a');                                        // 簪花
    P(10, 9, 12, 12, '#f0c8a8');
    P(12, 13, 2, 2, '#2a2a2a'); P(18, 13, 2, 2, '#2a2a2a');
    P(14, 18, 4, 1, '#c08a7a');
  },
  face_laobo: (P) => {
    P(10, 26, 12, 6, '#7a7a6a');
    P(9, 5, 14, 5, '#c8c4bc'); P(8, 7, 2, 8, '#c8c4bc'); P(22, 7, 2, 8, '#c8c4bc');
    P(10, 10, 12, 11, '#d8a878');
    P(12, 14, 2, 2, '#2a2a2a'); P(18, 14, 2, 2, '#2a2a2a');
    P(11, 17, 10, 5, '#c8c4bc'); P(13, 22, 6, 3, '#c8c4bc');          // 白须
    P(14, 15, 4, 1, '#8a7a6a');
  },
  face_xuanming: (P) => {
    P(6, 26, 20, 6, '#120e1a');
    P(5, 2, 22, 22, '#1e1826'); P(7, 4, 18, 18, '#120e1a');
    P(9, 8, 14, 14, '#8a8298');
    P(11, 12, 3, 2, '#e04030'); P(18, 12, 3, 2, '#e04030');
    P(10, 10, 5, 1, '#4a4258'); P(17, 10, 5, 1, '#4a4258');
    P(12, 8, 8, 2, '#b0a8c0');                              // 灰白眉
    P(12, 18, 8, 4, '#4a4258');                             // 短须
    P(14, 6, 4, 3, '#7a4ac0');                              // 冠上魔晶
  },
};

// ================= 图标 24×24 =================
function iconPill(color, dark) {
  const [c, ctx] = makeCanvas(24, 24);
  const P = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  P(7, 5, 10, 2, dark); P(5, 7, 14, 10, color); P(7, 17, 10, 2, dark);
  P(6, 6, 10, 2, dark); P(18, 6, 2, 10, dark); P(4, 6, 2, 10, dark);
  P(8, 7, 4, 3, '#ffffff');
  P(9, 14, 6, 2, dark);
  return c;
}

function makeIcon(paint) {
  const [c, ctx] = makeCanvas(24, 24);
  const P = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  paint(P);
  return c;
}

const ICONS = {
  icon_pill_red: () => iconPill('#c04838', '#7a2a20'),
  icon_pill_blue: () => iconPill('#3a6ac0', '#24447c'),
  icon_pill_green: () => iconPill('#4a9a3a', '#2e6424'),
  icon_pill_gold: () => iconPill('#d4af37', '#8a6d1e'),
  icon_pill_purple: () => iconPill('#7a4ac0', '#4c2e7a'),
  icon_fang: () => makeIcon(P => {
    P(10, 4, 4, 3, '#efe8d8'); P(9, 7, 6, 6, '#efe8d8'); P(10, 13, 4, 4, '#d8d0bc'); P(11, 17, 2, 3, '#b8b09a');
  }),
  icon_fur: () => makeIcon(P => {
    P(6, 8, 12, 8, '#d08030'); P(6, 8, 12, 2, '#9a5a1e'); P(8, 6, 2, 3, '#d08030'); P(12, 5, 2, 4, '#e8a050'); P(16, 7, 2, 3, '#d08030');
  }),
  icon_sword: () => makeIcon(P => {
    P(5, 16, 3, 3, '#6a4a32'); P(8, 13, 3, 3, '#c8a84c'); P(10, 11, 2, 2, '#c8a84c');
    P(12, 4, 3, 8, '#c8ccd4'); P(11, 6, 5, 4, '#c8ccd4'); P(13, 3, 1, 10, '#e8ecf4');
  }),
  icon_sword2: () => makeIcon(P => {
    P(5, 16, 3, 3, '#4a3a5a'); P(8, 13, 3, 3, '#5a8a5a'); P(10, 11, 2, 2, '#5a8a5a');
    P(12, 3, 3, 9, '#a8e8c8'); P(11, 5, 5, 5, '#a8e8c8'); P(13, 2, 1, 11, '#e0fff0');
  }),
  icon_robe: () => makeIcon(P => {
    P(9, 4, 6, 3, '#c8b28a'); P(6, 7, 12, 10, '#c8b28a'); P(8, 17, 8, 3, '#b09868'); P(11, 7, 2, 10, '#a8905f');
  }),
  icon_armor: () => makeIcon(P => {
    P(7, 5, 10, 4, '#8a6a42'); P(5, 8, 14, 10, '#8a6a42'); P(7, 18, 10, 2, '#6a4e30'); P(9, 10, 2, 2, '#d4af37'); P(13, 10, 2, 2, '#d4af37'); P(11, 14, 2, 2, '#d4af37');
  }),
  icon_armor2: () => makeIcon(P => {
    P(7, 5, 10, 4, '#4a4a52'); P(5, 8, 14, 10, '#4a4a52'); P(7, 18, 10, 2, '#33333a'); P(9, 10, 2, 2, '#8ab0d8'); P(13, 10, 2, 2, '#8ab0d8'); P(11, 14, 2, 2, '#8ab0d8');
  }),
  icon_amulet: () => makeIcon(P => {
    P(10, 2, 4, 2, '#8a6a2a'); P(7, 4, 10, 14, '#e8d44c'); P(9, 18, 6, 3, '#c8b02e');
    P(10, 8, 4, 4, '#c03a2e'); P(11, 7, 2, 6, '#c03a2e');
  }),
  icon_jade: () => makeIcon(P => {
    P(10, 4, 4, 2, '#5a9a5a'); P(8, 6, 8, 6, '#5a9a5a'); P(10, 12, 4, 6, '#4a8a4a'); P(12, 18, 2, 2, '#3a7a3a');
    P(10, 6, 3, 3, '#a8e0a8'); P(11, 10, 2, 4, '#7ac07a');
  }),
  icon_book: () => makeIcon(P => {
    P(4, 5, 7, 14, '#e8dcc0'); P(13, 5, 7, 14, '#e8dcc0'); P(11, 4, 2, 16, '#8a6a42');
    P(6, 8, 3, 1, '#b0a480'); P(15, 8, 3, 1, '#b0a480'); P(6, 11, 3, 1, '#b0a480'); P(15, 11, 3, 1, '#b0a480');
  }),
  icon_pill_amber: () => iconPill('#d0803c', '#8a5020'),
  icon_loot: () => makeIcon(P => {
    P(9, 4, 6, 3, '#8a6a44'); P(6, 7, 12, 11, '#a08256'); P(6, 7, 12, 2, '#8a6a44');
    P(6, 7, 2, 11, '#8a6a44'); P(16, 7, 2, 11, '#8a6a44'); P(8, 18, 8, 2, '#7a5c38');
    P(10, 10, 4, 1, '#d4af37'); P(10, 13, 4, 1, '#d4af37'); P(9, 11, 1, 2, '#d4af37'); P(14, 11, 1, 2, '#d4af37');
    P(12, 11, 1, 2, '#8a6d1e');
  }),
  icon_sword3: () => makeIcon(P => {
    P(5, 16, 3, 3, '#3a4a5a'); P(8, 13, 3, 3, '#7ab0d8'); P(10, 11, 2, 2, '#7ab0d8');
    P(12, 3, 3, 9, '#bfe0f4'); P(11, 5, 5, 5, '#bfe0f4'); P(13, 2, 1, 11, '#e8f6ff');
  }),
  icon_armor3: () => makeIcon(P => {
    P(7, 5, 10, 4, '#9aa2ac'); P(5, 8, 14, 10, '#9aa2ac'); P(7, 18, 10, 2, '#7a828c');
    P(9, 10, 2, 2, '#d4af37'); P(13, 10, 2, 2, '#d4af37'); P(11, 14, 2, 2, '#d4af37');
  }),
  icon_bell: () => makeIcon(P => {
    P(10, 2, 4, 2, '#8a6a2a');
    P(8, 4, 8, 3, '#d4af37');
    P(6, 7, 12, 9, '#d4af37'); P(6, 7, 2, 9, '#b8942a'); P(16, 7, 2, 9, '#b8942a');
    P(9, 16, 6, 3, '#e8d44c'); P(11, 19, 2, 2, '#8a6d1e');
    P(10, 9, 4, 4, '#f0e0a0'); P(11, 10, 2, 2, '#c03a2e');
  }),
  icon_book2: () => makeIcon(P => {
    P(4, 5, 7, 14, '#c8d4dc'); P(13, 5, 7, 14, '#c8d4dc'); P(11, 4, 2, 16, '#3a4e66');
    P(6, 8, 3, 1, '#7a8a9a'); P(15, 8, 3, 1, '#7a8a9a'); P(6, 11, 3, 1, '#7a8a9a'); P(15, 11, 3, 1, '#7a8a9a');
    P(9, 14, 3, 1, '#3a4e66'); P(10, 12, 1, 4, '#3a4e66');
  }),
  icon_pill_crimson: () => iconPill('#c03a5a', '#7a1e38'),
  icon_xuezhu: () => makeIcon(P => {
    P(9, 6, 6, 2, '#8a2030'); P(7, 8, 10, 8, '#a02838'); P(9, 16, 6, 2, '#7a1a28');
    P(6, 9, 2, 5, '#8a2030'); P(16, 9, 2, 5, '#8a2030');
    P(9, 8, 3, 3, '#d04858'); P(12, 13, 2, 2, '#c03040');
  }),
  icon_jing: () => makeIcon(P => {
    P(10, 3, 4, 2, '#5a6a8a'); P(8, 5, 8, 5, '#6a7a9a'); P(6, 10, 12, 6, '#5a6a8a'); P(8, 16, 8, 4, '#4a5a7a');
    P(10, 6, 3, 4, '#9aaac8'); P(8, 11, 3, 3, '#8a9ab8'); P(13, 13, 2, 2, '#7a8aa8');
  }),
  icon_dao: () => makeIcon(P => {
    P(5, 16, 3, 3, '#4a3222'); P(8, 13, 3, 3, '#c8a84c'); P(10, 11, 2, 2, '#c8a84c');
    P(12, 4, 3, 8, '#e8b0a0'); P(11, 6, 5, 4, '#e8b0a0'); P(13, 3, 1, 10, '#f4d0c4');
  }),
  icon_dao2: () => makeIcon(P => {
    P(5, 16, 3, 3, '#2a3a4a'); P(8, 13, 3, 3, '#5a8ab0'); P(10, 11, 2, 2, '#5a8ab0');
    P(12, 4, 3, 8, '#8aa8c0'); P(11, 6, 5, 4, '#8aa8c0'); P(13, 3, 1, 10, '#c8e0f0');
  }),
  icon_brush: () => makeIcon(P => {
    P(11, 2, 2, 12, '#d8c8a0'); P(11, 3, 1, 10, '#ecdfbe');   // 竹杆
    P(9, 13, 6, 3, '#8a6a42'); P(10, 13, 4, 1, '#a8865a');    // 笔斗
    P(10, 16, 4, 4, '#3a3a46'); P(11, 19, 2, 2, '#1c1c26');   // 笔锋蘸墨
  }),
  icon_sword4: () => makeIcon(P => {
    P(5, 16, 3, 3, '#3a3a52'); P(8, 13, 3, 3, '#d4af37'); P(10, 11, 2, 2, '#d4af37');
    P(12, 3, 3, 9, '#f0e8b8'); P(11, 5, 5, 5, '#f0e8b8'); P(13, 2, 1, 11, '#fffbe0');
  }),
  icon_armor4: () => makeIcon(P => {
    P(7, 5, 10, 4, '#5a3a3a'); P(5, 8, 14, 10, '#5a3a3a'); P(7, 18, 10, 2, '#442a2a');
    P(9, 10, 2, 2, '#c8a84c'); P(13, 10, 2, 2, '#c8a84c'); P(11, 14, 2, 2, '#c8a84c');
    P(6, 9, 1, 8, '#6a4a4a'); P(12, 8, 1, 2, '#6a4a4a'); P(17, 10, 1, 6, '#6a4a4a');
  }),
  icon_yu: () => makeIcon(P => {
    P(10, 2, 4, 2, '#8a6a2a');
    P(8, 4, 8, 8, '#7ac0c8'); P(6, 6, 12, 5, '#7ac0c8'); P(8, 12, 8, 4, '#5aa0a8'); P(9, 16, 6, 3, '#4a9098');
    P(9, 5, 3, 3, '#c0f0f4'); P(11, 9, 2, 4, '#9adfe4');
  }),
  icon_pill_rainbow: () => iconPill('#8a5ac0', '#54357c'),
  icon_pill_jade: () => iconPill('#5aa88a', '#38785a'),
  icon_lian: () => makeIcon(P => {
    P(10, 3, 4, 3, '#c8e8f0'); P(7, 5, 10, 4, '#d8f0f8'); P(5, 9, 14, 4, '#c8e8f0'); P(8, 13, 8, 3, '#b0dce8');
    P(11, 6, 2, 8, '#e8f8fc'); P(10, 16, 4, 4, '#4a7a5a');
  }),
  icon_mohun: () => makeIcon(P => {
    P(9, 5, 6, 3, '#5a3a8a'); P(7, 8, 10, 8, '#6a4aa0'); P(9, 16, 6, 3, '#4a2a6a');
    P(9, 7, 3, 3, '#a88ad0'); P(13, 12, 2, 2, '#8a6ab0');
    P(10, 10, 1, 5, '#2a1a3a'); P(12, 9, 1, 3, '#2a1a3a');
  }),
  icon_sword5: () => makeIcon(P => {
    P(5, 16, 3, 3, '#2a3a52'); P(8, 13, 3, 3, '#7ab0d8'); P(10, 11, 2, 2, '#7ab0d8');
    P(12, 2, 3, 10, '#cfe4f4'); P(11, 4, 5, 6, '#cfe4f4'); P(13, 1, 1, 12, '#eef8ff');
    P(12, 3, 1, 8, '#8ac0e0');
  }),
  icon_armor5: () => makeIcon(P => {
    P(7, 5, 10, 4, '#2e2a3e'); P(5, 8, 14, 10, '#2e2a3e'); P(7, 18, 10, 2, '#1e1a2c');
    P(9, 10, 2, 2, '#7a4ac0'); P(13, 10, 2, 2, '#7a4ac0'); P(11, 14, 2, 2, '#7a4ac0');
    P(6, 9, 1, 8, '#4a4460'); P(12, 8, 1, 2, '#4a4460'); P(17, 10, 1, 6, '#4a4460');
  }),
  icon_qin: () => makeIcon(P => {
    P(3, 9, 18, 7, '#6a4a2a'); P(3, 9, 18, 2, '#8a6a42'); P(4, 11, 16, 1, '#d8d0c0');
    P(4, 13, 16, 1, '#d8d0c0'); P(2, 8, 2, 9, '#4a3222'); P(20, 8, 2, 9, '#4a3222');
    P(6, 15, 2, 3, '#4a3222'); P(16, 15, 2, 3, '#4a3222');
  }),
  icon_longyu: () => makeIcon(P => {
    P(10, 2, 4, 2, '#c8a84c');
    P(8, 4, 8, 8, '#5a9a6a'); P(6, 6, 12, 5, '#5a9a6a'); P(8, 12, 8, 4, '#4a8a5a'); P(9, 16, 6, 3, '#3a7a4a');
    P(9, 5, 3, 3, '#a8e0b0'); P(11, 9, 2, 4, '#7ac088');
    P(10, 7, 4, 1, '#2a5a3a'); P(12, 9, 1, 5, '#2a5a3a');   // 龙纹
  }),
  icon_wine: () => makeIcon(P => {
    P(10, 2, 4, 2, '#6a4a28'); P(9, 4, 6, 3, '#a4713a'); P(7, 7, 10, 9, '#a4713a');
    P(8, 16, 8, 2, '#8a5e30'); P(11, 18, 2, 2, '#6a4a28');
    P(9, 8, 2, 6, '#c08a50');                               // 高光
    P(6, 11, 12, 1, '#5f4326'); P(9, 4, 6, 1, '#5f4326');   // 箍绳
    P(10, 12, 4, 3, '#e8dcc0'); P(11, 13, 2, 1, '#8a5e30'); // 封泥
  }),
};

// ================= 宝箱 16×16 =================
function chest(open) {
  const [c, ctx] = makeCanvas(16, 16);
  const P = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  if (!open) {
    P(2, 5, 12, 9, '#8a5a2e'); P(2, 3, 12, 3, '#a06a38');
    P(2, 8, 12, 1, '#5f3c1e'); P(7, 7, 2, 4, '#d4af37');
    P(2, 13, 12, 1, '#4a2e16');
  } else {
    P(2, 1, 12, 3, '#a06a38'); P(2, 5, 12, 8, '#4a2e16');
    P(3, 6, 10, 3, '#2a1a0e'); P(7, 8, 2, 3, '#d4af37');
    P(2, 13, 12, 1, '#4a2e16');
  }
  return c;
}

// ================= 战斗背景 480×270 =================
function bgOutdoor() {
  const [c, ctx] = makeCanvas(480, 270);
  const g = ctx.createLinearGradient(0, 0, 0, 270);
  g.addColorStop(0, '#1e3252'); g.addColorStop(0.55, '#4a6a8a'); g.addColorStop(1, '#7a94a4');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 270);
  const rnd = mulberry32(101);
  ctx.fillStyle = 'rgba(220,230,240,0.25)';
  for (let i = 0; i < 6; i++) {
    const x = rnd() * 440, y = 20 + rnd() * 60, w = 40 + rnd() * 70;
    ctx.fillRect(x, y, w, 4); ctx.fillRect(x + 8, y - 3, w * 0.6, 3);
  }
  // 远山
  ctx.fillStyle = '#2c3e54';
  for (let i = 0; i < 7; i++) {
    const bx = i * 80 - 30, bh = 50 + rnd() * 45;
    ctx.beginPath(); ctx.moveTo(bx, 160); ctx.lineTo(bx + 55, 160 - bh); ctx.lineTo(bx + 110, 160); ctx.fill();
  }
  // 近山
  ctx.fillStyle = '#22301e';
  for (let i = 0; i < 5; i++) {
    const bx = i * 110 - 40, bh = 40 + rnd() * 30;
    ctx.beginPath(); ctx.moveTo(bx, 185); ctx.lineTo(bx + 70, 185 - bh); ctx.lineTo(bx + 140, 185); ctx.fill();
  }
  // 地面
  ctx.fillStyle = '#3d5230'; ctx.fillRect(0, 185, 480, 85);
  ctx.fillStyle = '#34462a'; ctx.fillRect(0, 185, 480, 6);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#465e36' : '#35482b';
    ctx.fillRect((rnd() * 478) | 0, 195 + ((rnd() * 72) | 0), 3, 2);
  }
  return c;
}

function bgCave() {
  const [c, ctx] = makeCanvas(480, 270);
  const g = ctx.createLinearGradient(0, 0, 0, 270);
  g.addColorStop(0, '#120e12'); g.addColorStop(1, '#2a221c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 270);
  const rnd = mulberry32(202);
  // 钟乳石
  ctx.fillStyle = '#1c1518';
  for (let i = 0; i < 12; i++) {
    const x = rnd() * 460, w = 14 + rnd() * 22, h = 30 + rnd() * 55;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w / 2, h); ctx.fill();
  }
  // 岩壁
  ctx.fillStyle = '#241b16';
  for (let i = 0; i < 10; i++) ctx.fillRect((rnd() * 440) | 0, 60 + ((rnd() * 100) | 0), 30 + rnd() * 40, 10 + rnd() * 20);
  // 地面
  ctx.fillStyle = '#2e2620'; ctx.fillRect(0, 190, 480, 80);
  ctx.fillStyle = '#241d18'; ctx.fillRect(0, 190, 480, 6);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#382e26' : '#282019';
    ctx.fillRect((rnd() * 478) | 0, 200 + ((rnd() * 66) | 0), 4, 2);
  }
  // 幽蓝鬼火点缀
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = 'rgba(90,140,220,0.35)';
    ctx.fillRect((rnd() * 460) | 0, 40 + ((rnd() * 130) | 0), 3, 3);
  }
  return c;
}

// ---- 第五章：血色幻境背景 ----
function bgBlood() {
  const [c, ctx] = makeCanvas(480, 270);
  const g = ctx.createLinearGradient(0, 0, 0, 270);
  g.addColorStop(0, '#1a0a0e'); g.addColorStop(0.6, '#3a1218'); g.addColorStop(1, '#200a10');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 270);
  const rnd = mulberry32(505);
  // 血色巨柱
  for (let i = 0; i < 7; i++) {
    const x = 20 + i * 68 + rnd() * 20, w = 18 + rnd() * 14, h = 90 + rnd() * 70;
    ctx.fillStyle = '#2c1016';
    ctx.fillRect(x, 268 - h, w, h);
    ctx.fillStyle = '#3c161e';
    ctx.fillRect(x + 3, 268 - h, 3, h);
  }
  // 悬浮血晶
  for (let i = 0; i < 14; i++) {
    const x = (rnd() * 470) | 0, y = 30 + ((rnd() * 140) | 0), s = 2 + ((rnd() * 4) | 0);
    ctx.fillStyle = 'rgba(200,50,60,0.55)';
    ctx.fillRect(x, y, s, s + 2);
  }
  // 血雾地面
  ctx.fillStyle = '#2e1016'; ctx.fillRect(0, 200, 480, 70);
  ctx.fillStyle = '#40151c'; ctx.fillRect(0, 200, 480, 5);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#4a1a22' : '#341016';
    ctx.fillRect((rnd() * 478) | 0, 210 + ((rnd() * 56) | 0), 5, 2);
  }
  // 天际血月
  ctx.fillStyle = 'rgba(220,70,80,0.5)';
  ctx.beginPath(); ctx.arc(400, 46, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(240,120,120,0.35)';
  ctx.beginPath(); ctx.arc(396, 42, 10, 0, Math.PI * 2); ctx.fill();
  return c;
}

function bgSnow() {
  const [c, ctx] = makeCanvas(480, 270);
  const g = ctx.createLinearGradient(0, 0, 0, 270);
  g.addColorStop(0, '#5a6a84'); g.addColorStop(0.55, '#8a9aac'); g.addColorStop(1, '#c2ccd4');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 270);
  const rnd = mulberry32(404);
  // 风雪
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = 'rgba(240,246,250,' + (0.25 + rnd() * 0.5) + ')';
    ctx.fillRect((rnd() * 478) | 0, (rnd() * 268) | 0, 1 + (rnd() > 0.8 ? 1 : 0), 1);
  }
  // 远冰峰
  ctx.fillStyle = '#6a7c94';
  for (let i = 0; i < 6; i++) {
    const bx = i * 90 - 30, bh = 60 + rnd() * 50;
    ctx.beginPath(); ctx.moveTo(bx, 170); ctx.lineTo(bx + 60, 170 - bh); ctx.lineTo(bx + 120, 170); ctx.fill();
    ctx.fillStyle = '#dfe8ee';
    ctx.beginPath(); ctx.moveTo(bx + 44, 170 - bh + 18); ctx.lineTo(bx + 60, 170 - bh); ctx.lineTo(bx + 76, 170 - bh + 18); ctx.fill();
    ctx.fillStyle = '#6a7c94';
  }
  // 近处雪松
  ctx.fillStyle = '#233c30';
  for (let i = 0; i < 6; i++) {
    const bx = 20 + i * 88 + rnd() * 30, bh = 34 + rnd() * 26;
    for (let t = 0; t < 3; t++) {
      const w = 26 - t * 7, y = 200 - bh + t * (bh / 3.2);
      ctx.beginPath(); ctx.moveTo(bx - w / 2, y); ctx.lineTo(bx, y - bh / 2.6); ctx.lineTo(bx + w / 2, y); ctx.fill();
    }
  }
  // 雪地
  ctx.fillStyle = '#dde5ea'; ctx.fillRect(0, 200, 480, 70);
  ctx.fillStyle = '#cdd8e0'; ctx.fillRect(0, 200, 480, 5);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#eef3f6' : '#ccd6de';
    ctx.fillRect((rnd() * 478) | 0, 208 + ((rnd() * 58) | 0), 4, 2);
  }
  return c;
}

function bgTitle() {
  const [c, ctx] = makeCanvas(480, 270);
  const g = ctx.createLinearGradient(0, 0, 0, 270);
  g.addColorStop(0, '#0a0e2a'); g.addColorStop(0.6, '#1c2a52'); g.addColorStop(1, '#31436b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 270);
  const rnd = mulberry32(303);
  // 星
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = rnd() > 0.8 ? '#ffe9a8' : 'rgba(220,230,255,0.8)';
    ctx.fillRect((rnd() * 478) | 0, (rnd() * 160) | 0, 1, 1);
  }
  // 月
  ctx.fillStyle = 'rgba(232,228,200,0.18)'; ctx.beginPath(); ctx.arc(368, 62, 34, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8e4c8'; ctx.beginPath(); ctx.arc(368, 62, 26, 0, 7); ctx.fill();
  ctx.fillStyle = '#d8d4b4'; ctx.beginPath(); ctx.arc(360, 56, 5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(374, 68, 4, 0, 7); ctx.fill();
  // 山影
  ctx.fillStyle = '#141c38';
  for (let i = 0; i < 6; i++) {
    const bx = i * 95 - 40, bh = 60 + rnd() * 50;
    ctx.beginPath(); ctx.moveTo(bx, 200); ctx.lineTo(bx + 60, 200 - bh); ctx.lineTo(bx + 120, 200); ctx.fill();
  }
  // 飞檐（剪影宝塔）
  ctx.fillStyle = '#0e1428';
  const px0 = 120, py0 = 132;
  for (let t = 0; t < 3; t++) {
    const w = 64 - t * 16, y = py0 + t * 22;
    ctx.fillRect(px0 - w / 2, y, w, 5);
    ctx.beginPath(); ctx.moveTo(px0 - w / 2 - 8, y); ctx.lineTo(px0 + w / 2 + 8, y); ctx.lineTo(px0 + w / 2 - 2, y - 6); ctx.lineTo(px0 - w / 2 + 2, y - 6); ctx.fill();
    ctx.fillRect(px0 - (w - 14) / 2, y + 5, w - 14, 18);
  }
  ctx.fillRect(px0 - 2, py0 - 12, 4, 12);
  // 前景树线
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 236, 480, 34);
  for (let x = 0; x < 480; x += 26) {
    const h = 10 + rnd() * 22;
    ctx.beginPath(); ctx.moveTo(x, 238); ctx.lineTo(x + 13, 238 - h); ctx.lineTo(x + 26, 238); ctx.fill();
  }
  // 云雾
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(180,200,230,0.07)';
    ctx.fillRect(0, 150 + i * 24, 480, 6);
  }
  return c;
}

// ================= 总装 =================
export default {
  build(assets) {
    // --- 瓦片 ---
    // 大面积铺贴的基础瓦片各带两枚变体（'名#1' / '名#2'），TileMap 预渲染时按格坐标
    // 确定性混铺，打破整图单一贴图的重复感；其余装饰/立体瓦片保持单张。
    const V = (key, make) => {
      assets.put(key, make(0));
      assets.put(`${key}#1`, make(1));
      assets.put(`${key}#2`, make(2));
    };
    V('grass', v => tile(32, c => tileGrass(c, 5 + v * 11)));
    V('flower', v => tile(32, c => { tileGrass(c, 5 + v * 11); tileFlowerDetail(c); }));
    V('tallgrass', v => tile(32, c => tileTallgrass(c, 3 + v * 9)));
    V('tallgrass2', v => tile(32, c => tileTallgrass(c, 8 + v * 9, true)));
    V('path', v => tile(32, c => tilePath(c, 23 + v * 7)));
    V('water', v => tile(32, c => tileWater(c, 11 + v * 5)));
    V('cavefloor', v => tile(32, c => tileCavefloor(c, 63 + v * 5)));
    V('snow', v => tile(32, c => tileSnow(c, 71 + v * 5)));
    V('snowgrass', v => tile(32, c => tileSnowGrass(c, 83 + v * 5)));
    V('snowdeep', v => tile(32, c => tileSnowDeep(c, 97 + v * 5)));
    V('snowpath', v => tile(32, c => tileSnowPath(c, 131 + v * 5)));
    V('ice', v => tile(32, c => tileIce(c, 109 + v * 5)));
    V('floor', v => tile(32, c => tileFloor(c, 141 + v * 7)));
    assets.put('carpet', tile(32, tileCarpet));
    assets.put('table', tile(32, tileTable));
    assets.put('counter', tile(32, tileCounter));
    assets.put('shelf', tile(32, tileShelf));
    assets.put('tree', tile(32, tileTree));
    assets.put('bridge', tile(32, tileBridge));
    assets.put('rock', tile(32, tileRock));
    assets.put('wall', tile(32, tileWall));
    assets.put('roof', tile(32, tileRoof));
    assets.put('door', tile(32, tileDoor));
    assets.put('cavewall', tile(32, tileCavewall));
    assets.put('stairs', tile(32, tileStairs));
    assets.put('pine', tile(32, tilePine));

    // --- 行走图（sheet: 2帧×4向） ---
    assets.put('char_hero', charSheet({ hair: '#2a2a30', skin: '#e8b888', robe: '#3a5a8a', robeDark: '#2c4568', trim: '#c8a84c', pants: '#33302a' }));
    assets.put('char_liu', charSheet({ hair: '#3a4a3a', skin: '#f0c8a8', robe: '#e4e0d0', robeDark: '#c2bca8', trim: '#5a8a5a', pants: '#5a4a5a' }));
    assets.put('npc_zhangmen', charSheet({ hair: '#c8c4bc', skin: '#d8b090', robe: '#5a4a6a', robeDark: '#443852', trim: '#c8a84c', pants: '#3a3044' }));
    assets.put('npc_shangren', charSheet({ hair: '#4a3a2a', skin: '#d8a878', robe: '#8a6a3a', robeDark: '#6d522c', trim: '#d4af37', pants: '#4a3a28' }));
    assets.put('npc_dizi', charSheet({ hair: '#3a3a40', skin: '#d8a878', robe: '#7a8a9a', robeDark: '#5f6d7a', trim: '#c8b28a', pants: '#3a4048' }));
    assets.put('npc_dizi2', charSheet({ hair: '#4a3828', skin: '#d8a878', robe: '#8a5a3a', robeDark: '#6d462c', trim: '#c8b28a', pants: '#3a3028' }));
    assets.put('npc_hunter', charSheet({ hair: '#4a3a2a', skin: '#c89060', robe: '#6a5a3a', robeDark: '#54462c', trim: '#a08a4a', pants: '#3e3424' }));
    // 柳如烟 NPC 行走图与可入队形象共用
    assets.put('npc_liu', assets.get('char_liu'));
    assets.put('char_luo', charSheet({ hair: '#c8d4dc', skin: '#f0c8a8', robe: '#3e4e66', robeDark: '#2e3a4e', trim: '#8ab0d8', pants: '#26303e' }));
    assets.put('npc_luo', assets.get('char_luo'));
    assets.put('npc_huolang', charSheet({ hair: '#4a3a2a', skin: '#c89060', robe: '#7a6a4a', robeDark: '#5f523a', trim: '#a08a4a', pants: '#4a4030' }));
    assets.put('npc_yaonong', charSheet({ hair: '#c8c4bc', skin: '#c8a078', robe: '#6a6a5a', robeDark: '#545446', trim: '#8a9a6a', pants: '#4a4a3a' }));
    assets.put('char_shen', charSheet({ hair: '#4a4258', skin: '#e8c0a0', robe: '#e4e0d0', robeDark: '#c2bca8', trim: '#7a8ac0', pants: '#3a3244' }));
    assets.put('npc_shen', assets.get('char_shen'));
    assets.put('npc_cunzhang', charSheet({ hair: '#c8c4bc', skin: '#c8a078', robe: '#7a6a52', robeDark: '#64553e', trim: '#a89a7a', pants: '#54483a' }));
    assets.put('npc_laoban', charSheet({ hair: '#6a4a2a', skin: '#d8a878', robe: '#9a7a3a', robeDark: '#7c612c', trim: '#d4af37', pants: '#5a4a28' }));

    // --- 战斗精灵 ---
    assets.put('bchar_hero', battleHeroFighter());
    assets.put('bchar_liu', battleLiuFighter());
    assets.put('mob_lang', battleWolf());
    assets.put('mob_dushe', battleSnake());
    assets.put('mob_shanzei', battleBandit({ robe: '#3a4a66', robeD: '#2c3a52', band: '#c03a2e', hair: '#2a2a30' }));
    assets.put('mob_yaohu', battleFox());
    assets.put('mob_tanzi', battleBandit({ robe: '#4a4448', robeD: '#383336', band: '#8a6a2a', hair: '#1e1e22' }));
    assets.put('mob_shikui', battleShikui());
    assets.put('mob_guihuo', battleGuihuo());
    // 前期拓展：落霞林 / 惊鸿涧
    assets.put('mob_hou', battleHou());
    assets.put('mob_zhufeng', battleZhufeng());
    assets.put('mob_yezhu', battleYezhu());
    assets.put('mob_heixiong', battleHeixiong());
    assets.put('mob_shuyao', battleShuyao());
    assets.put('mob_shanxiao', battleShanxiao());
    assets.put('mob_cangdiao', battleCangdiao());
    assets.put('mob_yanjia', battleYanjia());
    assets.put('mob_shuigui', battleShuigui());
    assets.put('boss_youming', battleBoss());
    assets.put('mob_feizei', battleFeizei());
    assets.put('mob_langwang', battleLangwang());
    assets.put('mob_feibing', battleFeibing());
    assets.put('mob_xieshi', battleXieshi());
    assets.put('mob_hufa', battleHufa());
    assets.put('boss_heifeng', battleBossHeifeng());
    assets.put('bchar_luo', battleLuoFighter());
    assets.put('mob_xueshatu', battleXueshatu());
    assets.put('mob_shagui', battleShagui());
    assets.put('mob_xuenv', battleXuenv());
    assets.put('mob_hushan', battleHushan());
    assets.put('mob_zuoshi', battleZuoshi());
    assets.put('boss_xueshazhu', battleBossXueshazhu());
    assets.put('bchar_shen', battleShenFighter());
    assets.put('mob_xuejiao', battleXuejiao());
    assets.put('mob_bingkui', battleBingkui());
    assets.put('mob_yuanmo', battleYuanmo());
    assets.put('mob_shaling', battleShaling());
    assets.put('mob_yuanmojiang', battleYuanmojiang());
    assets.put('boss_xuanming', battleBossXuanming());
    // 第五章
    assets.put('mob_chisha', battleChisha());
    assets.put('mob_chiyu', battleChiyu());
    assets.put('mob_chihun', battleChihun());
    assets.put('mob_xuekui', battleXuekui());
    assets.put('mob_takui', battleTakui());
    assets.put('boss_chiyuan', battleBossChiyuan());
    // 守塔人与囚徒（第五章 NPC）
    assets.put('npc_guchen', charSheet({ hair: '#d8d4c8', skin: '#c8a078', robe: '#4a5044', robeDark: '#383e34', trim: '#a8a080', pants: '#34382e' }));
    assets.put('npc_qiuju', charSheet({ hair: '#2a2a30', skin: '#d0a888', robe: '#6e5a48', robeDark: '#54443a', trim: '#8a7a5a', pants: '#443a30' }));
    assets.put('npc_yaogu', charSheet({ hair: '#d8d4c8', skin: '#d0a888', robe: '#7a6a52', robeDark: '#5f523e', trim: '#8a9a6a', pants: '#4a4438' }));
    assets.put('npc_xiangke', charSheet({ hair: '#2a2a30', skin: '#e0b090', robe: '#9a8a5a', robeDark: '#7a6c44', trim: '#c8b28a', pants: '#5a523e' }));
    // 室内居民（店小二 / 村妇 / 村中老伯）
    assets.put('npc_xiaoer', charSheet({ hair: '#2a2a30', skin: '#e0b090', robe: '#4a7a5a', robeDark: '#38604a', trim: '#c8b28a', pants: '#3a3a30' }));
    assets.put('npc_cunv', charSheet({ hair: '#4a3222', skin: '#f0c8a8', robe: '#a86a5a', robeDark: '#8a5245', trim: '#e0d0b0', pants: '#5a4a4a' }));
    assets.put('npc_laobo', charSheet({ hair: '#c8c4bc', skin: '#d8a878', robe: '#7a7a6a', robeDark: '#63635a', trim: '#a8a094', pants: '#4a4a40' }));

    // --- 头像 ---
    for (const [k, fn] of Object.entries(PORTRAITS)) assets.put(k, portrait('#1c1812', fn));

    // --- 图标 ---
    for (const [k, fn] of Object.entries(ICONS)) assets.put(k, fn());

    // --- 宝箱 ---
    assets.put('chest_closed', chest(false));
    assets.put('chest_open', chest(true));

    // --- 背景 ---
    assets.put('bg_outdoor', bgOutdoor());
    assets.put('bg_cave', bgCave());
    assets.put('bg_snow', bgSnow());
    assets.put('bg_blood', bgBlood());
    assets.put('bg_title', bgTitle());
  },
};

// ---- 第五章：血煞之上 ----
function battleChisha() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#6e1c1c', RD = '#521313', G = '#e05a3a';
  P(8, 2, 8, 5, R); P(8, 2, 8, 1, '#8a2c24');            // 赤兜帽
  P(10, 5, 4, 3, '#160c0c');
  P(10, 6, 1, 1, '#ffb03a'); P(13, 6, 1, 1, '#ffb03a');  // 灼热之眼
  P(7, 8, 10, 11, R); P(7, 8, 10, 2, RD);
  P(9, 12, 6, 1, '#3a0e0e');
  P(5, 19, 14, 4, RD); P(4, 21, 16, 2, RD);
  P(3, 9, 4, 2, R);
  P(1, 5, 4, 4, G); P(2, 4, 2, 6, G);                    // 血焰法球
  P(2, 6, 2, 2, '#ffc86a');
  P(5, 23, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleChiyu() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const B = '#6e2c1a', W = '#a8442a', F = '#e0703a';
  P(10, 8, 6, 5, B); P(11, 6, 1, 2, B); P(15, 6, 1, 2, B); // 躯干与耳
  P(11, 9, 1, 1, '#ffd23a'); P(14, 9, 1, 1, '#ffd23a');    // 黄眼
  P(12, 11, 2, 1, '#3a1408');
  P(2, 6, 8, 4, W); P(1, 10, 7, 3, B);                     // 左翼
  P(16, 6, 8, 4, W); P(18, 10, 7, 3, B);                   // 右翼
  P(3, 5, 3, 2, F); P(19, 4, 3, 2, F);                     // 翼尖火羽
  P(10, 13, 2, 3, B); P(14, 13, 2, 3, B);
  P(9, 16, 2, 2, F); P(16, 15, 2, 2, F);                   // 爪焰
  P(6, 21, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battleChihun() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#4a1420', RD = '#340d16', G = '#e04a5a';
  P(8, 2, 8, 6, R); P(8, 2, 8, 1, '#661e2c');
  P(10, 5, 4, 3, '#0c0508');
  P(10, 6, 1, 1, G); P(13, 6, 1, 1, G);
  P(7, 8, 10, 10, R); P(7, 8, 10, 2, RD);
  P(5, 18, 14, 5, RD); P(3, 20, 18, 3, RD);              // 雾状下摆
  P(6, 23, 3, 1, '#240810'); P(15, 23, 3, 1, '#240810');
  P(3, 10, 3, 2, R); P(18, 8, 3, 2, R);
  P(19, 4, 4, 4, G); P(20, 3, 2, 6, G);                  // 赤魂晶
  P(20, 5, 2, 2, '#ffb0a8');
  P(5, 23, 14, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function battlePuppetP(main, dark, glow, accent) {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  P(7, 2, 10, 6, main); P(7, 2, 10, 1, glow);            // 巨首
  P(9, 4, 2, 2, dark); P(13, 4, 2, 2, dark);             // 眼窝
  P(9, 4, 1, 1, accent); P(13, 4, 1, 1, accent);         // 凶光
  P(8, 8, 2, 2, dark); P(14, 8, 2, 2, dark);             // 颚钉
  P(6, 10, 12, 10, main); P(6, 10, 12, 2, glow);         // 厚躯
  P(8, 14, 8, 1, dark);
  P(3, 10, 3, 7, dark); P(18, 10, 3, 7, dark);           // 粗臂
  P(2, 17, 4, 3, main); P(18, 17, 4, 3, main);           // 巨拳
  P(9, 20, 3, 5, dark); P(13, 20, 3, 4, dark);           // 短腿
  P(5, 25, 15, 1, 'rgba(0,0,0,0.4)');
  return c;
}
function battleXuekui() { return battlePuppetP('#5a2020', '#2c0c0c', '#8a3a30', '#ff5a4a'); }
function battleTakui() { return battlePuppetP('#4e5258', '#2c2e34', '#6e747c', '#c8d4e0'); }

function battleBossChiyuan() {
  const [c, ctx] = makeCanvas(48, 48);
  const P = grid2(ctx, 0, 0);
  const R = '#5c1418', RD = '#3c0c10', M = '#d8c0b0', G = '#ff4646';
  P(8, 0, 2, 3, RD); P(14, 0, 2, 3, RD);                 // 双角
  P(7, 3, 10, 5, R);
  P(9, 5, 6, 5, M); P(9, 5, 6, 1, '#b8a090');
  P(10, 7, 2, 1, G); P(13, 7, 2, 1, G);                  // 血瞳
  P(11, 9, 2, 1, '#7a1c1c');
  P(5, 9, 14, 4, R); P(5, 9, 14, 1, '#8a2c30');
  P(6, 13, 12, 9, R);
  P(4, 18, 16, 6, RD); P(3, 21, 18, 4, RD);
  P(6, 13, 1, 9, '#8a2c30'); P(17, 13, 1, 9, '#8a2c30');
  P(10, 15, 4, 1, '#c8a84c');
  P(1, 12, 3, 2, G); P(20, 10, 3, 2, G);                 // 缠绕血气
  P(3, 23, 2, 3, '#7a1c2c'); P(19, 22, 2, 4, '#7a1c2c'); P(10, 24, 3, 2, '#4a1018');
  return c;
}

function tile(size, painter) {
  const [c, ctx] = makeCanvas(size, size);
  painter(ctx);
  return c;
}
