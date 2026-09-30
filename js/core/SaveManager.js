// 存档管理：localStorage 三档位，带版本校验
const PREFIX = 'xiuxian_rpg_save_';

export default class SaveManager {
  constructor(game) {
    this.game = game;
  }

  slots() { return [1, 2, 3]; }

  save(slot, data) {
    // 规则落地：战斗中不可存档（帮助文本已有约定）
    if (this.game && this.game.inBattle) return false;
    try {
      data.savedAt = Date.now();
      localStorage.setItem(PREFIX + slot, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('存档失败', e);
      return false;
    }
  }

  load(slot) {
    try {
      const raw = localStorage.getItem(PREFIX + slot);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== this.game.BALANCE.saveVersion) return { incompatible: true, data };
      return data;
    } catch (e) {
      console.error('读档失败', e);
      return null;
    }
  }

  meta(slot) {
    const data = this.load(slot);
    if (!data) return null;
    const hero = data.party && data.party[0];
    // 版本不兼容的档位也要如实呈现：显示成「空」会让玩家误以为存档丢了
    if (data.incompatible) {
      return {
        slot, exists: true, incompatible: true,
        name: '【旧版本存档】', level: '?', realm: '?', mapName: '?',
        gold: 0, savedAt: data.savedAt || 0,
      };
    }
    return {
      slot,
      exists: true,
      name: hero ? (hero.name || '侠客') : '???',
      level: hero ? hero.level : '?',
      realm: hero ? hero.realmName : '?',
      mapName: data.mapName || '?',
      gold: data.gold || 0,
      savedAt: data.savedAt || 0,
    };
  }

  delete(slot) { localStorage.removeItem(PREFIX + slot); }
}
