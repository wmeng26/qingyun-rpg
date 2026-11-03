// 页签：妖物图鉴
import MONSTERS from '../../data/monsters.js';
import SKILLS from '../../data/skills.js';
import ITEMS from '../../data/items.js';
import { esc } from '../../core/dom.js';

export function renderBook(menu) {
  const g = menu.game;
  const ELEMENT_CN = { fire: '火', water: '水', ice: '冰', thunder: '雷', dark: '阴', holy: '阳', none: '' };
  const all = Object.values(MONSTERS).filter(m => m && m.id).sort((a, b) => a.level - b.level);
  const seenCount = all.filter(m => g.seenMobs.has(m.id) || g.killsByMob[m.id]).length;
  const head = document.createElement('div');
  head.className = 'sec-title';
  head.style.marginBottom = '8px';
  head.textContent = `妖物图鉴 · 已遭遇 ${seenCount}/${all.length} · 累计除妖 ${g.kills}`;
  menu.elContent.appendChild(head);
  for (const m of all) {
    const kills = g.killsByMob[m.id] || 0;
    const seen = g.seenMobs.has(m.id) || kills > 0;
    const box = document.createElement('div');
    box.className = 'quest-item';
    const el = m.element && m.element !== 'none' ? ` · ${ELEMENT_CN[m.element] || m.element}系` : '';
    if (!seen) {
      box.innerHTML = `
        <div class="q-title"><span>？？？</span><span class="q-state">未遭遇</span></div>
        <div class="q-obj" style="color:#5a5040;">Lv?? · 尚未照面的妖物。</div>`;
    } else {
      const bossTag = m.boss ? '<span class="q-state">首领</span>' : '';
      const stats = m.stats || {};
      const skillNames = (m.skills || []).map(id => (SKILLS[id] || {}).name).filter(Boolean).join('、');
      const dropNames = (m.drops || []).map(d => {
        const it = ITEMS[d.id];
        return it ? `${it.name} ${Math.round(d.chance * 100)}%` : null;
      }).filter(Boolean).join('、');
      box.innerHTML = `
        <div class="q-title"><span>Lv${m.level} ${esc(m.name)}${el}</span><span class="q-state">${kills ? `击杀 ×${kills}` : '已遭遇'}</span>${bossTag}</div>
        <div class="q-obj m-stats">气血 ${stats.maxHp} · 攻 ${stats.atk} · 防 ${stats.def} · 灵攻 ${stats.matk} · 灵防 ${stats.mdef} · 速 ${stats.spd}</div>
        <div class="q-obj" style="color:#a89878;">${esc(m.desc || '')}</div>
        ${skillNames ? `<div class="q-obj">功法：${esc(skillNames)}</div>` : ''}
        ${dropNames ? `<div class="q-obj m-drops">掉落：${esc(dropNames)}</div>` : ''}`;
    }
    menu.elContent.appendChild(box);
  }
  menu.nav.setItems([]);
}
