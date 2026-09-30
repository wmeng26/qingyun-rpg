// 境界突破：等级达标 + 突破丹 + 成功率判定
import REALMS from '../data/realms.js';

export default {
  nextRealmDef(char) {
    return REALMS.nextOf(char.realmId);
  },

  // 'ok' | 'max' | 'level' | 'pill'
  status(char, inventory) {
    const next = REALMS.nextOf(char.realmId);
    if (!next) return { ok: false, reason: 'max', next: null };
    if (char.level < next.levelReq) return { ok: false, reason: 'level', next };
    if (next.pill && inventory.count(next.pill) <= 0) return { ok: false, reason: 'pill', next };
    return { ok: true, reason: 'ok', next };
  },

  // 执行突破（消耗丹药、掷成功率）；成功则境界提升 + 学习功法 + 全恢复
  attempt(char, inventory, bus) {
    const next = REALMS.nextOf(char.realmId);
    if (!next) return { success: false, reason: 'max' };
    if (char.level < next.levelReq) return { success: false, reason: 'level' };
    if (next.pill) {
      if (!inventory.remove(next.pill, 1)) return { success: false, reason: 'pill' };
    }
    const success = Math.random() < next.rate;
    if (success) {
      char.realmId = next.id;
      char.learnSkillsForRealm(next.id);
      char.fullHeal();
      if (bus) bus.emit('breakthrough', { char, realm: next });
    }
    return { success, realm: next, learned: success ? char.learnSkillsForRealm(next.id).length : 0 };
  },

  // 剧情契机突破：不受等级/丹药/成功率限制，硬性推进一层（元婴等节点用）
  storyAdvance(char, bus) {
    const next = REALMS.nextOf(char.realmId);
    if (!next) return null;
    char.realmId = next.id;
    char.learnSkillsForRealm(next.id);
    char.fullHeal();
    if (bus) bus.emit('breakthrough', { char, realm: next });
    return next;
  },
};
