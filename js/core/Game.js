// 游戏主控：主循环 / 服务定位 / 全局状态 / 存档序列化
import EventBus from './EventBus.js';
import Input from './Input.js';
import Assets from './Assets.js';
import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import SaveManager from './SaveManager.js';
import { initAudio, sfx } from './Audio.js';
import BALANCE from '../data/balance.js';
import MAPS from '../data/maps.js';
import ITEMS from '../data/items.js';
import { Character } from '../systems/Character.js';
import Cultivation from '../systems/Cultivation.js';
import Inventory from '../systems/Inventory.js';
import Equipment from '../systems/Equipment.js';
import QuestManager from '../systems/QuestManager.js';
import DialogEngine from '../systems/DialogEngine.js';

export default class Game {
  constructor(canvas) {
    this.BALANCE = BALANCE;
    this.MAPS = MAPS;
    this.ITEMS = ITEMS;

    this.bus = new EventBus();
    this.assets = new Assets();
    this.renderer = new Renderer(canvas);
    this.scenes = new SceneManager(this);
    this.save = new SaveManager(this);
    this.inventory = new Inventory(this);
    this.equipment = new Equipment(this);
    this.dialog = new DialogEngine(this);
    this.input = new Input(this);

    this.party = [];
    this.flags = new Set();
    this.gold = 0;
    this.kills = 0;
    this.playSec = 0;
    this.inBattle = false;
    this.mapScene = null;
    this.mapId = null;
    this.playerPos = null;
    this.ui = null; // main.js 注入（UIScene）

    this.audio = initAudio();

    this.bus.on('enemyKilled', () => this.kills++);
    // 全局奖励类音效（战斗结算的升级音在 BattleUI 播，避免与结算画面重叠）
    this.bus.on('levelUp', () => sfx.play('levelup'));
    this.bus.on('breakthrough', () => sfx.play('breakthrough'));
    this.bus.on('joinAlly', () => sfx.play('ally'));
    this.bus.on('questCompleted', () => sfx.play('quest'));
  }

  // ===== 新游戏 / 读档 =====
  newGame() {
    if (this.quests) this.quests.unbind();
    this.party = [new Character('hero')];
    this.quests = new QuestManager(this);
    this.flags = new Set();
    this.gold = BALANCE.start.gold;
    this.kills = 0;
    this.playSec = 0;
    this.inventory.deserialize({});
    for (const it of BALANCE.start.items) this.inventory.add(it.id, it.count);
    this.dialog.start('dlg_prologue', {
      onDone: () => {
        this.enterMap(BALANCE.start.mapId, BALANCE.start.pos.x, BALANCE.start.pos.y, BALANCE.start.dir);
      },
    });
  }

  applySave(d) {
    if (this.quests) this.quests.unbind();
    this.party = (d.party || []).map(cd => Character.deserialize(cd));
    this.quests = new QuestManager(this);
    this.quests.deserialize(d.quests);
    this.inventory.deserialize(d.inventory);
    this.flags = new Set(d.flags || []);
    this.gold = d.gold || 0;
    this.kills = d.kills || 0;
    this.playSec = d.playSec || 0;
    const pos = d.pos || BALANCE.start.pos;
    this.enterMap(d.mapId || BALANCE.start.mapId, pos.x, pos.y, pos.dir || 'down');
  }

  serialize() {
    return {
      version: BALANCE.saveVersion,
      mapId: this.mapId,
      pos: this.playerPos || BALANCE.start.pos,
      mapName: this.mapId && MAPS[this.mapId] ? MAPS[this.mapId].name : '',
      gold: this.gold,
      kills: this.kills,
      playSec: Math.floor(this.playSec),
      flags: [...this.flags],
      party: this.party.map(c => c.serialize()),
      inventory: this.inventory.serialize(),
      quests: this.quests ? this.quests.serialize() : {},
    };
  }

  // ===== 地图 / 战斗 =====
  enterMap(mapId, x, y, dir) {
    const scene = this.makeMapScene(mapId, x, y, dir);
    this.scenes.replace(scene);
  }

  startBattle(cfg) {
    if (this.inBattle) return;
    this.inBattle = true;
    this.ui.showHUD(false);
    const mapDef = this.mapId ? MAPS[this.mapId] : null;
    const scene = this.makeBattleScene({
      mobs: cfg.mobs,
      canFlee: cfg.canFlee,
      boss: cfg.boss,
      winFlag: cfg.winFlag,
      bg: cfg.bg || (mapDef && mapDef.bg) || 'bg_outdoor',
      onEnd: (o) => {
        this.inBattle = false;
        if (cfg.onEnd) cfg.onEnd(o);
        if (o === 'defeat') this.gameOver();
        else this.ui.showHUD(true);
      },
    });
    this.scenes.push(scene);
  }

  gameOver() {
    const r = BALANCE.respawn;
    for (const c of this.party) {
      const s = c.stats();
      c.hp = Math.max(1, Math.floor(s.maxHp * r.hpPct));
      c.mp = Math.floor(s.maxMp * 0.5);
    }
    this.enterMap(r.mapId, r.x, r.y, 'down');
    this.ui.toast('你在青云门中醒来，伤势已无大碍……');
  }

  // ===== 队伍 / 资产 =====
  joinParty(id) {
    if (this.party.some(c => c.id === id)) return;
    const c = new Character(id);
    const hero = this.party[0];
    if (hero) {
      c.level = hero.level;
      c.exp = hero.exp;
      c.realmId = hero.realmId;
      c.syncSkills(); // 按境界链补齐本命技能（含跳过的中间境界）
    }
    c.fullHeal();
    this.party.push(c);
    this.bus.emit('joinAlly', { id });
    this.ui.toast(`${c.name} 加入了队伍！`);
  }

  // 剧情契机突破：境界不受等级/丹药限制，硬性推进一层（元婴等剧情节点用）
  storyBreakthrough() {
    const hero = this.party[0];
    if (!hero) return null;
    const next = Cultivation.storyAdvance(hero, this.bus);
    if (next) this.ui.toast(`${hero.name} 境界突破！晋升「${next.name}」`);
    return next;
  }

  addGold(n) {
    this.gold = Math.max(0, this.gold + n);
    if (n > 0) this.bus.emit('goldObtained', { n });
  }

  obtainItem(id, count = 1, silent = false) {
    this.inventory.add(id, count);
    if (!silent) {
      sfx.play('item');
      this.ui.toast(`获得 ${this.itemName(id)} ×${count}`);
    }
  }

  itemName(id) { return (ITEMS[id] && ITEMS[id].name) || id; }

  setFlag(f) {
    if (this.flags.has(f)) return;
    this.flags.add(f);
    this.bus.emit('flagSet', { flag: f });
  }

  // ===== 主循环 =====
  update(dt) {
    this.playSec += dt;
    this.renderer.update(dt);
    if (this.dialog) this.dialog.update(dt);
    if (this.touch) this.touch.refresh();
    this.scenes.update(dt);
  }

  render() {
    const r = this.renderer;
    r.beginFrame();
    this.scenes.render(r.ctx);
    r.endFrame();
  }

  start() {
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      this.update(dt);
      if (this.ui) this.ui.tick(dt);
      this.render();
      this.input.endFrame();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
