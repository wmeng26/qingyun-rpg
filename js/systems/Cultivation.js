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

  // 只做前置校验 + 扣丹，返回 { ok, next }（心魔试炼与掷骰突破共用）
  takePill(char, inventory) {
    const next = REALMS.nextOf(char.realmId);
    if (!next) return { ok: false, reason: 'max' };
    if (char.level < next.levelReq) return { ok: false, reason: 'level' };
    if (next.pill && !inventory.remove(next.pill, 1)) return { ok: false, reason: 'pill' };
    return { ok: true, next };
  },

  // 落地境界提升：改境界 + 补学功法 + 全恢复
  applyAdvance(char, next, bus) {
    char.realmId = next.id;
    char.learnSkillsForRealm(next.id);
    char.fullHeal();
    if (bus) bus.emit('breakthrough', { char, realm: next });
    return next;
  },

  // 执行突破（消耗丹药、掷成功率）；成功则境界提升 + 学习功法 + 全恢复
  attempt(char, inventory, bus) {
    const before = char.skills.length;
    const r = this.takePill(char, inventory);
    if (!r.ok) return { success: false, reason: r.reason };
    const next = r.next;
    const success = Math.random() < next.rate;
    if (success) this.applyAdvance(char, next, bus);
    return { success, realm: next, learned: success ? char.skills.length - before : 0 };
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
