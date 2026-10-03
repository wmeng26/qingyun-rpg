// 地图场景：瓦片渲染 / 网格移动 / NPC 交互 / 传送门 / 推门进屋 / 宝箱 / 暗雷 / 队友跟随
import MAPS from '../data/maps.js';
import TileMap from '../map/TileMap.js';
import Player from '../map/Player.js';
import NPC from '../map/NPC.js';
import Follower from '../map/Follower.js';
import Encounter from '../map/Encounter.js';
import { sfx } from '../core/Audio.js';

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
    this.player.onBump = (x, y) => this._onBump(x, y);
    this.npcs = (this.def.npcs || []).map(d => new NPC(d));
    // 门（建筑互动）：朝门走（推门）/ 面向按确认 / 点按均可进入
    this.doors = this.def.doors || [];
    this.doorTarget = null;
    this._loreShown = new Set();
    // 队友蛇形跟随（槽位 = 队伍序号 - 1）；碰撞体把 NPC 格也视为障碍
    this.followers = g.party.slice(1).map(c => new Follower(g, c));
    this.moveBlocker = { isSolid: (x, y) => this.tileMap.isSolid(x, y) || !!this.npcAt(x, y) };
    this.encounter = new Encounter(g, this.def);
    this.fade = 1;
    this.fadeDir = -1;   // 进入时从黑淡入
    this.pendingPortal = null;
    this.talkTarget = null;
    this._tapHintT = 0;
    this._bindTap();
    g.mapId = this.mapId;
    g.mapScene = this;
    g.playerPos = { ...this.startPos };
    g.ui.setMapName(this.def.name);
    g.ui.showHUD(true);
    sfx.music(this.def.music || 'map');
  }

  npcAt(x, y) { return this.npcs.find(n => n.x === x && n.y === y) || null; }

  doorAt(x, y) { return this.doors.find(d => d.x === x && d.y === y) || null; }

  // 队伍变动同步：入队发生在地图上的对话中，须按帧补齐跟随者（按 spriteKey 保留既有状态）
  _syncFollowers() {
    const want = this.game.party.length - 1;
    if (this.followers.length === want) return;
    for (const c of this.game.party.slice(1)) {
      if (!this.followers.some(f => f.spriteKey === c.spriteKey)) {
        this.followers.push(new Follower(this.game, c));
      }
    }
    // 队伍只增不减；顺序以入队序为准
    this.followers.sort((a, b) =>
      this.game.party.findIndex(c => c.spriteKey === a.spriteKey)
      - this.game.party.findIndex(c => c.spriteKey === b.spriteKey));
  }

  // 战斗场景弹出回到地图时接回地图 BGM（战斗结算画面已停曲）
  onResume() {
    sfx.music(this.def.music || 'map');
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
    this.player.update(dt, !blocked, this.moveBlocker);
    this._syncFollowers();
    // 跟随者紧随玩家同步（须在玩家 update 后、早退分支前）
    for (let i = 0; i < this.followers.length; i++) this.followers[i].update(i, this.player);
    if (this._tapHintT > 0) this._tapHintT -= dt;

    // 面向可交互目标（NPC / 门）：NPC 注视玩家 + 更新交互提示
    this.talkTarget = null;
    this.doorTarget = null;
    if (!blocked) {
      const [dx, dy] = DIR_VEC[this.player.dir];
      const fx = this.player.gx + dx, fy = this.player.gy + dy;
      const n = this.npcAt(fx, fy);
      if (n) { this.talkTarget = n; n.faceToward(this.player.gx, this.player.gy); }
      else this.doorTarget = this.doorAt(fx, fy);
    }
    this._refreshHint();

    // 交互
    const input = this.game.input;
    if (!blocked && input.wasPressed('cancel')) {
      this.game.ui.openMenu();
      return;
    }
    if (!blocked && input.wasPressed('confirm')) {
      if (this.talkTarget) this._talkTo(this.talkTarget);
      else if (this.doorTarget) this._enterDoor(this.doorTarget);
    }
  }

  _refreshHint() {
    const g = this.game;
    if (!g.ui.setHint) return;
    const n = this.talkTarget;
    const d = this.doorTarget;
    if (n) g.ui.setHint(g.input.touch ? `A 与${n.name}交谈` : `Z 与${n.name}交谈 · X 菜单`);
    else if (d && d.label) g.ui.setHint(g.input.touch ? `A 进入${d.label}` : `Z 进入${d.label} · X 菜单`);
    else g.ui.setHint(g.input.touch ? 'A 交互 · B 菜单' : 'Z 交互 · X 菜单');
  }

  // 与 NPC 交谈（确认键 / 点按共用）：NPC 转向玩家 + 任务交谈事件 + 开对话
  _talkTo(n) {
    n.faceToward(this.player.gx, this.player.gy);
    this.game.quests.notifyTalk(n.id);
    this.game.dialog.start(n.dialog);
  }

  // 推门：朝门方向走撞上时触发（Player.onBump 边沿回调）
  _onBump(x, y) {
    const d = this.doorAt(x, y);
    if (d) this._enterDoor(d);
  }

  // 进入门：目标地图为室内时记下回程（门外那格），室内的门按来路送回
  _enterDoor(d) {
    const g = this.game;
    if (this.pendingPortal || this.fadeDir > 0) return;
    if (d.requiresFlag && !g.flags.has(d.requiresFlag)) {
      g.ui.toast(d.lockedMsg || '此门尚未开启');
      return;
    }
    let to = { to: d.to, toX: d.toX, toY: d.toY };
    if (d.useReturn) {
      if (g.doorReturn) to = { to: g.doorReturn.mapId, toX: g.doorReturn.x, toY: g.doorReturn.y };
    } else if (MAPS[d.to] && MAPS[d.to].interior) {
      g.doorReturn = { mapId: this.mapId, x: d.x, y: d.y + 1 };
    }
    sfx.play('teleport');
    this.fadeDir = 1;
    this.pendingPortal = to;
  }

  // 画布点按：直接点 NPC 交谈、点门进入（触屏免对准）；离得远则提示走近
  handleTap(lx, ly) {
    const g = this.game;
    if (g.inBattle || g.dialog.active || g.ui.hasModal() || this.pendingPortal || this.fadeDir > 0) return;
    const tx = Math.floor((lx + this.camX) / 32), ty = Math.floor((ly + this.camY) / 32);
    const n = this.npcAt(tx, ty);
    if (n) {
      const dist = Math.abs(n.x - this.player.gx) + Math.abs(n.y - this.player.gy);
      if (dist === 1) {
        this.player.dir = n.x > this.player.gx ? 'right' : n.x < this.player.gx ? 'left'
          : n.y > this.player.gy ? 'down' : 'up';
        this._talkTo(n);
      } else if (this._tapHintT <= 0) {
        this._tapHintT = 2.5;
        g.ui.toast(`走近「${n.name}」再交谈`);
      }
      return;
    }
    const d = this.doorAt(tx, ty);
    if (d) {
      const dist = Math.abs(d.x - this.player.gx) + Math.abs(d.y - this.player.gy);
      if (dist === 1) {
        this.player.dir = d.x > this.player.gx ? 'right' : d.x < this.player.gx ? 'left'
          : d.y > this.player.gy ? 'down' : 'up';
        this._enterDoor(d);
      } else if (this._tapHintT <= 0) {
        this._tapHintT = 2.5;
        g.ui.toast(d.label ? `走近门口再进入${d.label}` : '走近门口再进入');
      }
    }
  }

  // 画布点按只绑一次（画布常驻，handler 委托给当前 mapScene）
  _bindTap() {
    const g = this.game;
    const canvas = g.renderer.canvas;
    if (canvas._npcTapBound) return;
    canvas._npcTapBound = true;
    canvas.addEventListener('pointerdown', (e) => {
      const sc = g.mapScene;
      if (!sc) return;
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      sc.handleTap((e.clientX - r.left) / r.width * 480, (e.clientY - r.top) / r.height * 270);
    });
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
        sfx.play('teleport');
        this.fadeDir = 1;
        this.pendingPortal = portal;
        return;
      }
    }

    // 事件（宝箱 / 战斗触发 / 氛围描写）
    const ev = (this.def.events || []).find(e => e.x === x && e.y === y);
    if (ev && this._handleEvent(ev)) return;

    // 暗雷
    const zone = this.tileMap.encZone(x, y);
    const mobs = this.encounter.onStep(x, y, zone);
    if (mobs) {
      sfx.play('encounter');
      g.startBattle({ mobs, bg: this.def.bg });
    }
  }

  _handleEvent(ev) {
    const g = this.game;
    if (ev.type === 'chest') {
      const flag = `chest_${this.mapId}_${ev.x}_${ev.y}`;
      if (g.flags.has(flag)) return false;
      g.setFlag(flag);
      sfx.play('chest');
      if (ev.gold) {
        g.addGold(ev.gold);
        g.ui.toast(`获得 ${ev.gold} 文钱`);
      }
      for (const it of ev.items || []) g.obtainItem(it.id, it.count);
      return false; // 走上宝箱格继续正常流程（该格无遇敌）
    }
    if (ev.type === 'lore') {
      // 场景描写：踏上触发，每次进图只提示一次，避免来回走动刷屏
      const key = `${this.mapId}_${ev.x}_${ev.y}`;
      if (!this._loreShown.has(key)) {
        this._loreShown.add(key);
        g.ui.toast(ev.text);
      }
      return false;
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
    // 传送门提示（顶部一行的标签画在格下方，避免被视口上缘裁掉）
    for (const p of this.def.portals || []) {
      const ly = p.y === 0 ? p.y * 32 + 27 : p.y * 32 - 6;
      ctx.font = '9px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(p.label || '', p.x * 32 + 17 - camX, ly + 1 - camY);
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(p.label || '', p.x * 32 + 16 - camX, ly - camY);
      ctx.textAlign = 'left';
    }
    // 门：走近才浮出匾额式标签，面向时可进入（与 NPC 一致的「!」提示）
    for (const d of this.doors) {
      const dist = Math.abs(d.x - this.player.gx) + Math.abs(d.y - this.player.gy);
      if (dist > 3 || !d.label) continue;
      const lx = d.x * 32 + 16 - camX;
      const ly = d.y * 32 - 6 - camY;
      ctx.font = '9px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(d.label, lx + 1, ly + 1);
      ctx.fillStyle = this.doorTarget === d ? '#ffd24c' : '#ffe9a8';
      ctx.fillText(d.label, lx, ly);
      if (this.doorTarget === d) {
        const bob = Math.round(Math.sin(performance.now() / 170) * 2);
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText('!', lx, ly - 14 + bob);
        ctx.fillText('!', lx, ly - 14 + bob);
      }
      ctx.textAlign = 'left';
    }

    for (const n of this.npcs) n.draw(ctx, camX, camY, g.assets);
    // 队友蛇形跟随（队首离玩家最近、最后绘制）
    for (let i = this.followers.length - 1; i >= 0; i--) {
      this.followers[i].draw(ctx, camX, camY, g.assets);
    }
    this.player.draw(ctx, camX, camY);

    // 交互提示：面向 NPC 时头顶名字 + 弹跳「!」
    if (this.talkTarget) {
      const n = this.talkTarget;
      const bob = Math.round(Math.sin(performance.now() / 170) * 2);
      const cx = n.x * 32 + 16 - camX;
      const top = n.y * 32 - camY;
      ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.strokeText(n.name, cx, top - 10);
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(n.name, cx, top - 10);
      ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
      ctx.strokeText('!', cx, top - 24 + bob);
      ctx.fillStyle = '#ffd24c';
      ctx.fillText('!', cx, top - 24 + bob);
      ctx.textAlign = 'left';
    }

    // 黑场过渡
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, Math.max(0, this.fade))})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
}
