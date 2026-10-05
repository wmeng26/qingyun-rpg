// 地图氛围层：天气粒子 / 云影 / 风过草浪 / 环境色调与晕影
// 纯渲染模块：不 import 任何游戏代码（validate.mjs 直接引用 AMBIENCE_NAMES 校验
// maps.js 的 ambience 字段）。由 MapScene 持有，逻辑分辨率 480×270（与 MapScene
// 的 VIEW_W/H 保持一致）：
//   update(dt)                  每帧推进粒子（对话/弹窗时地图 update 仍会调用，氛围不间断）
//   drawUnder(ctx,camX,camY)    瓦片之后、角色之前：云影 + 草浪亮带（画在地面层）
//   drawOver(ctx,px,py)         角色之后、黑场过渡之前：色调 → 晕影 → 雾团 → 粒子
// 预设即数据：粒子运动参数、云影数量、全屏 tint、晕影（screen 固定居中 /
// player 以玩家为光心——洞窟暗角带随身光圈）。
// 实机校色结论：绿-on-绿（叶/萤）必须取亮黄绿系才可见；全屏 tint 压太高会发闷。

export const VIEW_W = 480, VIEW_H = 270;

// 草浪亮带扫过的草地系瓦片（土路/石面不参与，避免路口闪白）
const GUST_TILES = new Set(['grass', 'flower', 'tallgrass', 'tallgrass2', 'snowgrass', 'snowdeep']);

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// ---- 预设表 ------------------------------------------------------------

export const PRESETS = {
  // 青云山下：亮黄绿碎叶（深绿叶在草地上隐形——实机校色教训），云影缓移
  leaves: {
    particles: { kind: 'fall', n: 26, colors: ['#c8d86a', '#e0e88a', '#f0e8a0', '#d8e87a'], sizes: [2, 2, 3], vy: [14, 30], sway: [4, 10], swayF: [0.4, 0.9], alpha: [0.5, 0.85] },
    clouds: { n: 4, alpha: 0.13, speed: [5, 11], scale: [1.6, 2.6] },
    gust: 0.05,
  },
  // 落霞林：暖霞色调 + 红叶纷落（密度/亮度上调：绿地上红叶要够醒目）
  sunset: {
    particles: { kind: 'fall', n: 34, colors: ['#d8813c', '#c05a2e', '#a8842e', '#b8503a'], sizes: [2, 2, 3], vy: [16, 34], sway: [5, 12], swayF: [0.4, 1.0], alpha: [0.5, 0.85] },
    clouds: { n: 4, alpha: 0.12, speed: [5, 11], scale: [1.6, 2.6] },
    gust: 0.05,
    tint: 'rgba(255,166,80,0.05)',
    vignette: { rgb: [40, 24, 36], edge: 0.16 },
  },
  // 青云门：花瓣轻扬，山门清雅
  petals: {
    particles: { kind: 'fall', n: 22, colors: ['#f2d8e0', '#e8b8c8', '#f5ecdc'], sizes: [2, 2, 3], vy: [8, 18], sway: [6, 14], swayF: [0.3, 0.8], alpha: [0.4, 0.8] },
    clouds: { n: 3, alpha: 0.12, speed: [4, 9], scale: [1.6, 2.4] },
    gust: 0.04,
    tint: 'rgba(255,214,235,0.04)',
    vignette: { rgb: [36, 28, 40], edge: 0.12 },
  },
  // 惊鸿涧：暮色流萤（罩色压暗发蓝而不发青绿，避免草地发闷——实机校色教训）
  fireflies: {
    particles: { kind: 'firefly', n: 14, sp: [8, 18], f: [0.3, 0.8], alpha: [0.7, 1.0] },
    clouds: { n: 3, alpha: 0.10, speed: [4, 9], scale: [1.8, 2.6] },
    gust: 0.03,
    tint: 'rgba(40,58,120,0.08)',
    vignette: { rgb: [10, 20, 44], edge: 0.22 },
  },
  // 荒古道 / 黑风寨：风沙浮尘
  dust: {
    particles: { kind: 'drift', n: 28, colors: ['#c8b088', '#b8a878', '#d0c098'], sizes: [1, 1, 2], vx: [6, 20], vy: [-3, 3], alpha: [0.18, 0.4] },
    clouds: { n: 2, alpha: 0.10, speed: [6, 12], scale: [1.8, 2.6] },
    gust: 0.03,
    tint: 'rgba(208,188,140,0.05)',
    vignette: { rgb: [40, 32, 20], edge: 0.14 },
  },
  // 寒霜渡：细雪清冷（实机已验证）
  snow: {
    particles: { kind: 'fall', n: 50, colors: ['#ffffff', '#e8f2ff'], sizes: [1, 1, 2], vy: [20, 42], sway: [3, 8], swayF: [0.5, 1.2], alpha: [0.45, 0.85], wind: 10 },
    clouds: { n: 2, alpha: 0.09, speed: [6, 12], scale: [1.8, 2.8] },
    gust: 0.05,
    tint: 'rgba(152,190,255,0.05)',
    vignette: { rgb: [22, 42, 84], edge: 0.15 },
  },
  // 寒渊冰原：风雪交加（横向雪针，实机已验证）
  blizzard: {
    particles: { kind: 'fall', n: 95, colors: ['#ffffff', '#e6f2ff'], sizes: [1, 1, 2], vy: [36, 72], sway: [2, 6], swayF: [0.6, 1.4], alpha: [0.4, 0.8], wind: 60, streak: true },
    gust: 0.06,
    tint: 'rgba(160,200,255,0.09)',
    vignette: { rgb: [26, 46, 92], edge: 0.20 },
  },
  // 血煞系（血煞谷/祭坛/赤煞窟/煞天幻境）：血色余烬升腾（实机偏稀，加密度提亮）
  embers: {
    particles: { kind: 'rise', n: 48, colors: ['#ff8c3a', '#ffb04a', '#e8552a', '#ffd06a'], sizes: [1, 1, 2], vy: [10, 26], alpha: [0.5, 0.95], flickerF: [2.5, 6], glow: true },
    gust: 0,
    tint: 'rgba(255,64,30,0.09)',
    vignette: { rgb: [64, 6, 6], edge: 0.30 },
  },
  // 幽冥洞 / 魔渊封印：幽雾弥散，随身光圈（雾团加浓一档）
  mist: {
    particles: { kind: 'drift', n: 8, colors: ['#a8a8c0', '#9890b8'], sizes: [1, 2], vx: [2, 6], vy: [-2, 2], alpha: [0.08, 0.2] },
    mists: { n: 7, alpha: [0.07, 0.13], speed: [3, 8], r: [55, 110] },
    gust: 0,
    tint: 'rgba(110,100,190,0.05)',
    vignette: { rgb: [8, 8, 26], edge: 0.30, mode: 'player', inner: 115, outer: 260 },
  },
  // 轮回古塔：塔内浮尘，随身光圈（实机已验证）
  cave: {
    particles: { kind: 'drift', n: 10, colors: ['#b0b0bc', '#9a9aa8'], sizes: [1, 1, 2], vx: [2, 7], vy: [-2, 2], alpha: [0.08, 0.18] },
    gust: 0,
    vignette: { rgb: [8, 8, 20], edge: 0.32, mode: 'player', inner: 110, outer: 250 },
  },
  // 室内场景：暖金浮尘（实机过淡，加密度提亮）+ 暖光晕影
  warm: {
    particles: { kind: 'drift', n: 22, colors: ['#ffe0a0', '#ffd88a', '#fff0c0'], sizes: [1, 1, 2], vx: [2, 6], vy: [-2, 2], alpha: [0.12, 0.28] },
    gust: 0,
    tint: 'rgba(255,190,110,0.06)',
    vignette: { rgb: [52, 28, 12], edge: 0.20 },
  },
};

export const AMBIENCE_NAMES = Object.keys(PRESETS);

// ---- 粒子生灭 ----------------------------------------------------------

function spawn(p, ps, first) {
  p.kind = ps.kind;
  p.color = ps.colors ? pick(ps.colors) : '#fff';
  p.s = ps.sizes ? pick(ps.sizes) : 1;
  p.alpha = rand(ps.alpha[0], ps.alpha[1]);
  p.phase = rand(0, Math.PI * 2);
  switch (ps.kind) {
    case 'fall':
      p.x = rand(-30, VIEW_W + 30);
      p.y = first ? rand(0, VIEW_H) : rand(-40, -6);
      p.vy = rand(ps.vy[0], ps.vy[1]);
      p.swayA = ps.sway ? rand(ps.sway[0], ps.sway[1]) : 0;
      p.swayF = ps.swayF ? rand(ps.swayF[0], ps.swayF[1]) : 0;
      break;
    case 'rise':
      p.x = rand(-10, VIEW_W + 20);
      p.y = first ? rand(0, VIEW_H) : rand(VIEW_H + 6, VIEW_H + 30);
      p.vy = rand(ps.vy[0], ps.vy[1]);
      p.fl = rand(ps.flickerF[0], ps.flickerF[1]);
      break;
    case 'drift':
      p.x = rand(0, VIEW_W);
      p.y = rand(0, VIEW_H);
      p.vx = rand(ps.vx[0], ps.vx[1]);
      p.vy = rand(ps.vy[0], ps.vy[1]);
      break;
    case 'firefly':
      p.x = rand(0, VIEW_W);
      p.y = rand(0, VIEW_H);
      p.sp = rand(ps.sp[0], ps.sp[1]);
      p.f1 = rand(ps.f[0], ps.f[1]);
      p.f2 = rand(ps.f[0], ps.f[1]);
      p.ph2 = rand(0, Math.PI * 2);
      break;
  }
}

// ---- 主体 --------------------------------------------------------------

export default class Ambience {
  constructor(name) {
    this.name = name || null;
    this.def = PRESETS[name] || null;
    this.t = 0;
    this.parts = [];
    this.mists = [];
    this.clouds = [];
    if (!this.def) return;
    const ps = this.def.particles;
    if (ps) for (let i = 0; i < ps.n; i++) { const p = {}; spawn(p, ps, true); this.parts.push(p); }
    if (this.def.mists) {
      for (let i = 0; i < this.def.mists.n; i++) {
        this.mists.push({
          x: rand(-60, VIEW_W + 60), y: rand(-40, VIEW_H + 40),
          r: rand(this.def.mists.r[0], this.def.mists.r[1]),
          v: rand(this.def.mists.speed[0], this.def.mists.speed[1]) * (Math.random() < 0.5 ? -1 : 1),
          a: rand(this.def.mists.alpha[0], this.def.mists.alpha[1]),
          tone: Math.random() < 0.5 ? '140,150,185' : '140,120,180',
        });
      }
    }
    if (this.def.clouds) {
      for (let i = 0; i < this.def.clouds.n; i++) this.clouds.push(this._cloud(true));
      // 错开初始相位，避免开局同排
      for (const c of this.clouds) c.x = rand(-120, VIEW_W + 120);
    }
    this._vg = null; // screen 晕影渐变缓存
  }

  _cloud(first) {
    const cd = this.def.clouds;
    return {
      x: first ? 0 : rand(-160, -60),
      y: rand(-40, VIEW_H * 0.7),
      s: rand(cd.scale[0], cd.scale[1]),
      v: rand(cd.speed[0], cd.speed[1]),
      a: cd.alpha * rand(0.7, 1.15),
    };
  }

  update(dt) {
    if (!this.def) return;
    this.t += dt;
    const ps = this.def.particles;
    if (ps) for (const p of this.parts) this._step(p, ps, dt);
    for (const m of this.mists) {
      m.x += m.v * dt;
      if (m.x < -m.r - 80) m.x = VIEW_W + m.r + 70;
      if (m.x > VIEW_W + m.r + 80) m.x = -m.r - 70;
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.x += c.v * dt;
      if (c.x - 70 * c.s > VIEW_W + 20) this.clouds[i] = this._cloud(false);
    }
  }

  _step(p, ps, dt) {
    switch (ps.kind) {
      case 'fall':
        p.y += p.vy * dt;
        p.x += (ps.wind || 0) * dt;
        if (p.y > VIEW_H + 8) { spawn(p, ps, false); break; }
        if (p.x < -30) p.x += VIEW_W + 60;
        else if (p.x > VIEW_W + 30) p.x -= VIEW_W + 60;
        break;
      case 'rise':
        p.y -= p.vy * dt;
        p.x += Math.sin(this.t * 0.8 + p.phase) * 6 * dt;
        if (p.y < -8) spawn(p, ps, false);
        break;
      case 'drift':
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -6) p.x = VIEW_W + 5; else if (p.x > VIEW_W + 6) p.x = -5;
        if (p.y < -6) p.y = VIEW_H + 5; else if (p.y > VIEW_H + 6) p.y = -5;
        break;
      case 'firefly':
        p.x += Math.sin(this.t * p.f1 + p.phase) * p.sp * dt;
        p.y += Math.cos(this.t * p.f2 + p.ph2) * p.sp * dt;
        if (p.x < -10) p.x = VIEW_W + 9; else if (p.x > VIEW_W + 10) p.x = -9;
        if (p.y < -10) p.y = VIEW_H + 9; else if (p.y > VIEW_H + 10) p.y = -9;
        break;
    }
  }

  // 地面层：云影 + 风过草浪（tileMap 只需 tileName/def.width/def.height）
  drawUnder(ctx, camX, camY, tileMap) {
    if (!this.def) return;
    for (const c of this.clouds) {
      const r = 70 * c.s;
      const gr = ctx.createRadialGradient(c.x, c.y, r * 0.15, c.x, c.y, r);
      gr.addColorStop(0, `rgba(24,40,62,${c.a.toFixed(3)})`);
      gr.addColorStop(1, 'rgba(24,40,62,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(c.x - r, c.y - r, r * 2, r * 2);
    }
    // 草浪：一条亮带沿对角线周期扫过视口内的草地系瓦片
    const gust = this.def.gust || 0;
    if (gust > 0 && tileMap) {
      const sweep = camX + camY + ((this.t * 72) % 1400) - 200;
      const x0 = Math.max(0, Math.floor(camX / 32));
      const x1 = Math.min(tileMap.def.width - 1, Math.floor((camX + VIEW_W) / 32));
      const y0 = Math.max(0, Math.floor(camY / 32));
      const y1 = Math.min(tileMap.def.height - 1, Math.floor((camY + VIEW_H) / 32));
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (!GUST_TILES.has(tileMap.tileName(tx, ty))) continue;
          const a = 1 - Math.abs(tx * 32 + ty * 32 - sweep) / 130;
          if (a <= 0) continue;
          const alpha = a * a * gust;
          if (alpha < 0.004) continue;
          ctx.fillStyle = `rgba(255,250,214,${alpha.toFixed(3)})`;
          ctx.fillRect(tx * 32 - camX, ty * 32 - camY, 32, 32);
        }
      }
    }
  }

  // 空气层：色调 → 晕影 → 雾团 → 粒子
  drawOver(ctx, px, py) {
    if (!this.def) return;
    if (this.def.tint) { ctx.fillStyle = this.def.tint; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    const vg = this.def.vignette;
    if (vg) {
      let gr;
      if (vg.mode === 'player') {
        gr = ctx.createRadialGradient(px, py, vg.inner, px, py, vg.outer);
        gr.addColorStop(0, `rgba(${vg.rgb},0)`);
        gr.addColorStop(0.55, `rgba(${vg.rgb},${(vg.edge * 0.45).toFixed(3)})`);
        gr.addColorStop(1, `rgba(${vg.rgb},${vg.edge})`);
      } else {
        if (!this._vg) {
          this._vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 110, VIEW_W / 2, VIEW_H / 2, 300);
          this._vg.addColorStop(0, `rgba(${vg.rgb},0)`);
          this._vg.addColorStop(0.6, `rgba(${vg.rgb},${(vg.edge * 0.45).toFixed(3)})`);
          this._vg.addColorStop(1, `rgba(${vg.rgb},${vg.edge})`);
        }
        gr = this._vg;
      }
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    for (const m of this.mists) {
      const gr = ctx.createRadialGradient(m.x, m.y, m.r * 0.1, m.x, m.y, m.r);
      gr.addColorStop(0, `rgba(${m.tone},${m.a.toFixed(3)})`);
      gr.addColorStop(0.55, `rgba(${m.tone},${(m.a * 0.55).toFixed(3)})`);
      gr.addColorStop(1, `rgba(${m.tone},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }
    const ps = this.def.particles;
    if (!ps) return;
    for (const p of this.parts) this._draw(ctx, p, ps);
  }

  _draw(ctx, p, ps) {
    const t = this.t;
    let a = p.alpha;
    if (ps.kind === 'rise') a *= 0.55 + 0.45 * Math.sin(t * p.fl + p.phase);
    if (ps.kind === 'firefly') {
      const pulse = Math.max(0, Math.sin(t * 1.4 + p.phase));
      a = p.alpha * (0.10 + 0.9 * pulse * pulse * pulse);
      ctx.fillStyle = `rgba(190,255,130,${(a * 0.3).toFixed(3)})`;
      ctx.fillRect(p.x - 1, p.y - 1, 4, 4);
      ctx.fillStyle = `rgba(234,255,176,${a.toFixed(3)})`;
      ctx.fillRect(p.x, p.y, 2, 2);
      return;
    }
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.fillStyle = p.color;
    if (ps.kind === 'fall' && ps.streak) {
      ctx.fillRect(p.x, p.y, 5, 1);
    } else if (ps.kind === 'fall') {
      const dx = Math.sin(t * p.swayF + p.phase) * p.swayA;
      ctx.fillRect(p.x + dx, p.y, p.s, p.s);
    } else {
      ctx.fillRect(p.x, p.y, p.s, p.s);
      if (ps.glow && p.s === 2) {
        ctx.globalAlpha *= 0.3;
        ctx.fillRect(p.x - 1, p.y - 1, 4, 4);
      }
    }
    ctx.globalAlpha = 1;
  }
}

// 预设表挂为静态成员：validate.mjs 的导入映射只保留 default（本类），
// 校验 maps.js 的 ambience 字段时从类上取名单
Ambience.PRESETS = PRESETS;
Ambience.AMBIENCE_NAMES = AMBIENCE_NAMES;
