// 战斗场景：画布渲染战斗背景/单位/血条，DOM 战斗 UI 叠加
import BattleEngine from '../battle/BattleEngine.js';
import BattleUI from '../battle/BattleUI.js';
import { sfx } from '../core/Audio.js';

const PARTY_POS = {
  1: [[350, 130]],
  2: [[340, 105], [390, 160]],
  3: [[330, 88], [385, 138], [340, 188]],
  4: [[322, 70], [390, 108], [328, 148], [388, 190]],
};
const ENEMY_POS = {
  1: [[120, 125]],
  2: [[105, 92], [125, 168]],
  3: [[95, 72], [120, 142], [100, 208]],
};

export default class BattleScene {
  // cfg: { mobs, canFlee, boss, winFlag, bg, onEnd }
  constructor(cfg) { this.cfg = cfg; }

  enter() {
    const g = this.game;
    this.engine = new BattleEngine({
      game: g,
      mobs: this.cfg.mobs,
      canFlee: this.cfg.canFlee !== false,
      boss: !!this.cfg.boss,
      winFlag: this.cfg.winFlag || null,
    });
    this.ui = new BattleUI(g, this.engine, (o) => this._finish(o));
    this._layout();
    g.ui.pushPanel(this.ui);
    sfx.music(this.cfg.boss ? 'boss' : 'battle');
    const names = this.engine.enemyUnits.map(u => u.displayName).join('、');
    const intro = this.cfg.boss ? `${names} 挡在面前！` : `${names} 袭来！`;
    this.ui.play([{ type: 'msg', text: intro }], null);
  }

  _layout() {
    const assign = (units, table) => {
      const row = table[units.length] || table[3];
      units.forEach((u, i) => {
        const [x, y] = row[i] || row[row.length - 1];
        u.bx = x; u.by = y;
      });
    };
    assign(this.engine.enemyUnits, ENEMY_POS);
    assign(this.engine.partyUnits, PARTY_POS);
  }

  update(dt) { this.ui.update(dt); }

  render(ctx) {
    const bg = this.game.assets.get(this.cfg.bg || 'bg_outdoor');
    if (bg) ctx.drawImage(bg, 0, 0);
    for (const u of this.engine.enemyUnits) this._drawUnit(ctx, u, 1);
    for (const u of this.engine.partyUnits) this._drawUnit(ctx, u, -1);
    for (const u of this.engine.enemyUnits) if (u.alive) this._drawEnemyBar(ctx, u);
  }

  _drawUnit(ctx, u, lungeDir) {
    if (!u.alive && (!u._fadeT || u._fadeT <= 0)) return;
    const img = this.game.assets.get(u.spriteKey);
    if (!img) return;
    let dx = 0;
    if (u._lungeT > 0) dx = Math.sin(Math.PI * Math.min(u._lungeT, 1)) * 14 * lungeDir;
    const scale = u.scale || 1;
    const w = img.width * scale, h = img.height * scale;
    const x = Math.round(u.bx + dx + (48 - w) / 2);
    const y = Math.round(u.by + (48 - h) / 2 - (u.boss ? 8 : 0));
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(u.bx + 24, u.by + 50, 19 * scale, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    if (!u.alive) ctx.globalAlpha = Math.max(0, (u._fadeT || 0) / 0.5);
    if (u._flashT > 0) ctx.filter = 'brightness(2.2)';
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  _drawEnemyBar(ctx, u) {
    const w = u.boss ? 64 : 36;
    const x = u.bx + 24 - w / 2;
    const y = u.by - (u.boss ? 20 : 12);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(x - 1, y - 1, w + 2, 5);
    const pct = Math.max(0, u.hp / u.maxHp());
    ctx.fillStyle = pct > 0.5 ? '#7dbb5e' : pct > 0.25 ? '#d4af37' : '#d05a4e';
    ctx.fillRect(x, y, Math.round(w * pct), 3);
    ctx.font = 'bold 8px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillText(u.displayName, u.bx + 25, y - 3);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(u.displayName, u.bx + 24, y - 4);
    ctx.textAlign = 'left';
  }

  _finish(outcome) {
    this.game.ui.popPanel(this.ui);
    const cb = this.cfg.onEnd;
    this.game.scenes.pop(); // exit() 会销毁战斗 DOM
    if (cb) cb(outcome);
  }

  exit() { this.ui.destroy(); }
}
