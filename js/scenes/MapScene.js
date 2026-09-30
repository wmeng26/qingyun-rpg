// 地图场景：瓦片渲染 / 网格移动 / NPC 交互 / 传送门 / 宝箱 / 暗雷
import MAPS from '../data/maps.js';
import TileMap from '../map/TileMap.js';
import Player from '../map/Player.js';
import NPC from '../map/NPC.js';
import Encounter from '../map/Encounter.js';

const VIEW_W = 480, VIEW_H = 270;
const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export default class MapScene {
  constructor(game, mapId, x, y, dir = 'down') {
    this.mapId = mapId;
    this.startPos = { x, y, dir };
  }

  enter() {
    const g = this.game;
    this.def = MAPS[this.mapId];
    this.tileMap = new TileMap(this.def, g.assets);
    this.player = new Player(g);
    this.player.place(this.startPos.x, this.startPos.y, this.startPos.dir);
    this.player.onArrive = (x, y) => this._onArrive(x, y);
    this.npcs = (this.def.npcs || []).map(d => new NPC(d));
    this.encounter = new Encounter(g, this.def);
    this.fade = 1;
    this.fadeDir = -1;   // 进入时从黑淡入
    this.pendingPortal = null;
    g.mapId = this.mapId;
    g.mapScene = this;
    g.playerPos = { ...this.startPos };
    g.ui.setMapName(this.def.name);
    g.ui.showHUD(true);
  }

  exit() {
    this.game.mapScene = null;
    this.game.ui.showHUD(false);
  }

  update(dt) {
    // 淡入淡出
    this.fade += this.fadeDir * dt * 2.2;
    if (this.fade <= 0 && !this.pendingPortal) { this.fade = 0; this.fadeDir = 0; }
    if (this.pendingPortal) {
      if (this.fade >= 1) {
        const p = this.pendingPortal;
        this.pendingPortal = null;
        this.game.enterMap(p.to, p.toX, p.toY, this.player.dir);
        return;
      }
    } else if (this.fade >= 1 && this.fadeDir > 0) {
      this.fade = 1; this.fadeDir = 0;
    }

    const blocked = this.game.ui.hasModal() || this.game.dialog.active || this.pendingPortal;
    this.player.update(dt, !blocked, this.tileMap);

    // 交互
    const input = this.game.input;
    if (!blocked && input.wasPressed('cancel')) {
      this.game.ui.openMenu();
      return;
    }
    if (!blocked && input.wasPressed('confirm')) {
      const [dx, dy] = DIR_VEC[this.player.dir];
      const fx = this.player.gx + dx, fy = this.player.gy + dy;
      const npc = this.npcs.find(n => n.x === fx && n.y === fy);
      if (npc) {
        npc.faceToward(this.player.gx, this.player.gy);
        this.game.quests.notifyTalk(npc.id);
        this.game.dialog.start(npc.dialog);
      }
    }
  }

  _onArrive(x, y) {
    const g = this.game;
    g.playerPos = { x, y, dir: this.player.dir };

    // 传送门
    const portal = (this.def.portals || []).find(p => p.x === x && p.y === y);
    if (portal) {
      if (portal.requiresFlag && !g.flags.has(portal.requiresFlag)) {
        g.ui.toast(portal.lockedMsg || '此路尚未开启');
      } else {
        this.fadeDir = 1;
        this.pendingPortal = portal;
        return;
      }
    }

    // 事件（宝箱 / 战斗触发）
    const ev = (this.def.events || []).find(e => e.x === x && e.y === y);
    if (ev && this._handleEvent(ev)) return;

    // 暗雷
    const zone = this.tileMap.encZone(x, y);
    const mobs = this.encounter.onStep(x, y, zone);
    if (mobs) {
      g.startBattle({ mobs, bg: this.def.bg });
    }
  }

  _handleEvent(ev) {
    const g = this.game;
    if (ev.type === 'chest') {
      const flag = `chest_${this.mapId}_${ev.x}_${ev.y}`;
      if (g.flags.has(flag)) return false;
      g.setFlag(flag);
      if (ev.gold) {
        g.addGold(ev.gold);
        g.ui.toast(`获得 ${ev.gold} 文钱`);
      }
      for (const it of ev.items || []) g.obtainItem(it.id, it.count);
      return false; // 走上宝箱格继续正常流程（该格无遇敌）
    }
    if (ev.type === 'battle') {
      if (g.flags.has(ev.flag)) return false;
      const b = ev.battle;
      const start = () => g.startBattle({
        mobs: b.mobs, boss: b.boss, canFlee: b.canFlee !== false, bg: this.def.bg,
        winFlag: ev.flag,
        onEnd: (o) => {
          if (o === 'victory') {
            g.ui.toast(b.victoryMsg || '妖气散去，洞窟恢复了平静……');
            // 战后剧情（如顿悟突破）待 toast 播出、场景切回地图后再展开
            if (b.afterDialog) setTimeout(() => g.dialog.start(b.afterDialog), 500);
          }
        },
      });
      if (b.introDialog) g.dialog.start(b.introDialog, { onDone: start });
      else start();
      return true;
    }
    return false;
  }

  render(ctx) {
    const g = this.game;
    const worldW = this.tileMap.worldW, worldH = this.tileMap.worldH;
    const camX = Math.max(0, Math.min(this.player.px() + 16 - VIEW_W / 2, worldW - VIEW_W));
    const camY = Math.max(0, Math.min(this.player.py() + 16 - VIEW_H / 2, worldH - VIEW_H));
    this.camX = camX; this.camY = camY;

    this.tileMap.draw(ctx, camX, camY, VIEW_W, VIEW_H);

    // 宝箱
    for (const ev of this.def.events || []) {
      if (ev.type !== 'chest') continue;
      const opened = g.flags.has(`chest_${this.mapId}_${ev.x}_${ev.y}`);
      const img = g.assets.get(opened ? 'chest_open' : 'chest_closed');
      if (img) ctx.drawImage(img, ev.x * 32 + 8 - camX, ev.y * 32 + 10 - camY);
    }
    // 传送门提示
    for (const p of this.def.portals || []) {
      ctx.font = '9px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(p.label || '', p.x * 32 + 17 - camX, p.y * 32 - 6 - camY);
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(p.label || '', p.x * 32 + 16 - camX, p.y * 32 - 7 - camY);
      ctx.textAlign = 'left';
    }

    for (const n of this.npcs) n.draw(ctx, camX, camY, g.assets);
    this.player.draw(ctx, camX, camY);

    // 黑场过渡
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, Math.max(0, this.fade))})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
}
