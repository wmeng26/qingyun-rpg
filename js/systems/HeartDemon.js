// 心魔战：以队伍自身为模板生成镜像敌群（只取伤害类功法，镜像不会疗伤/增益拖延）
import BALANCE from '../data/balance.js';
import SKILLS from '../data/skills.js';

export function buildMirrors(party) {
  const m = BALANCE.demon;
  return party.map(c => {
    const st = c.stats();
    const pick = key => Math.max(1, Math.floor(st[key] * m[key]));
    const skills = (c.skills || []).filter(id => {
      const s = SKILLS[id];
      return s && s.kind === 'active' && !s.heal && !s.cure && !s.buff;
    }).slice(0, 4);
    return {
      id: `demon_${c.id}`,
      mirror: true,
      name: `心魔·${c.name}`,
      level: c.level,
      element: 'dark',
      sprite: c.battleSpriteKey,
      scale: 1,
      boss: true,
      stats: {
        maxHp: pick('maxHp'), maxMp: st.maxMp,
        atk: pick('atk'), def: pick('def'),
        matk: pick('matk'), mdef: pick('mdef'),
        spd: pick('spd'),
      },
      exp: 0, gold: 0,
      skills: skills.length ? skills : ['skill_attack'],
      ai: 'aggressive',
      drops: [],
      desc: '心魔所化，与本体同源同技，唯不知慈悲。',
    };
  });
}

// 该境界是否需要心魔试炼（有丹药门槛的大境界；元婴走剧情不在此列）
export function needsTrial(next) {
  return !!(next && next.pill && !next.auto);
}
