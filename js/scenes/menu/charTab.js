// 页签：角色（属性 / 功法 / 装备 / 突破）
import SKILLS from '../../data/skills.js';
import ITEMS from '../../data/items.js';
import Cultivation from '../../systems/Cultivation.js';
import { buildMirrors, needsTrial } from '../../systems/HeartDemon.js';
import { displayName as forgeName } from '../../systems/Forge.js';
import { esc } from '../../core/dom.js';
import { SLOT_NAMES } from './shared.js';

export function renderChar(menu) {
  const g = menu.game;
  for (const c of g.party) {
    const box = document.createElement('div');
    box.style.marginBottom = '14px';
    const st = c.stats();
    const rd = c.realmDef();
    const expNeed = c.expToNext();
    const bt = Cultivation.status(c, g.inventory);

    const skillRows = c.skills.map(id => {
      const s = SKILLS[id];
      if (!s) return '';
      return `<div class="skill-row"><div class="s-top"><span>${esc(s.name)}</span><span class="s-cost">${s.mpCost ? s.mpCost + ' 灵力' : '—'}</span></div><div class="s-desc">${esc(s.desc || '')}</div></div>`;
    }).join('');

    const slots = ['weapon', 'armor', 'accessory'].map(slot => {
      const itemId = c.equipment[slot];
      const def = itemId ? ITEMS[itemId] : null;
      return `<div class="slot-row"><span>${SLOT_NAMES[slot]}：${def ? esc(forgeName(def)) : '——'}</span></div>`;
    }).join('');

    box.innerHTML = `
      <div class="char-head">
        <img src="${menu._portrait(c.portraitKey)}" alt="">
        <div>
          <div class="c-name">${esc(c.name)}</div>
          <div class="c-realm">${esc(rd.name)} · Lv${c.level}</div>
          <div class="c-lv">经验 ${c.exp}/${expNeed}</div>
        </div>
      </div>
      <div class="bar exp"><div class="fill" style="width:${Math.min(100, (c.exp / expNeed) * 100)}%"></div></div>
      <div class="stat-grid">
        <span class="sk">气血</span><span class="sv">${c.hp}/${st.maxHp}</span>
        <span class="sk">灵力</span><span class="sv">${c.mp}/${st.maxMp}</span>
        <span class="sk">速度</span><span class="sv">${st.spd}</span>
        <span class="sk">攻击</span><span class="sv">${st.atk}</span>
        <span class="sk">防御</span><span class="sv">${st.def}</span>
        <span class="sk"></span><span class="sv"></span>
        <span class="sk">灵攻</span><span class="sv">${st.matk}</span>
        <span class="sk">灵防</span><span class="sv">${st.mdef}</span>
        <span class="sk"></span><span class="sv"></span>
      </div>
      <div class="sec-title">功法</div>${skillRows}
      <div class="sec-title">装备</div>${slots}`;
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;';
    for (const slot of ['weapon', 'armor', 'accessory']) {
      const b = menu._btn(`换${SLOT_NAMES[slot]}`, () => menu._openEquipSub(c, slot));
      btnRow.appendChild(b);
    }
    const bForge = menu._btn('淬炼装备', () => menu._openForgeSub(c));
    btnRow.appendChild(bForge);
    if (bt.next) {
      const label = bt.ok
        ? `尝试突破 → ${bt.next.name}（${Math.round(bt.next.rate * 100)}%）`
        : bt.reason === 'level'
          ? `突破 ${bt.next.name}（需 Lv${bt.next.levelReq}）`
          : `突破 ${bt.next.name}（需${g.itemName(bt.next.pill)}）`;
      const b = menu._btn(label, () => {
        if (!bt.ok) { g.ui.toast(bt.reason === 'level' ? '等级不足，无法突破' : `缺少${g.itemName(bt.next.pill)}`); return; }
        g.ui.confirm(
          `消耗 ${g.itemName(bt.next.pill)}×1，冲击${bt.next.name}？\n成功率 ${Math.round(bt.next.rate * 100)}%，失败丹药不返。`,
          () => {
            const r = Cultivation.attempt(c, g.inventory, g.bus);
            if (r.success) {
              g.ui.toast(`${c.name} 突破成功！境界提升至「${r.realm.name}」`);
            } else {
              g.ui.toast(`${c.name} 突破失败……灵气反噬，丹药已耗。`);
            }
            menu.render();
          });
      });
      btnRow.appendChild(b);
    }
    // 心魔试炼：以镜像一战换「必定突破」，丹药同样消耗（元婴走剧情不在此列）
    if (bt.ok && needsTrial(bt.next)) {
      const bTrial = menu._btn(`心魔试炼（胜则必破${bt.next.name}）`, () => {
        g.ui.confirm(
          `以心魔为炉，与自己的镜像一战。\n胜则必定晋升「${bt.next.name}」；败则丹药尽耗、身死道消。\n（消耗 ${g.itemName(bt.next.pill)}×1）`,
          () => {
            const r = Cultivation.takePill(c, g.inventory);
            if (!r.ok) { g.ui.toast('丹药不足，无法开启试炼'); return; }
            const mirrors = buildMirrors(g.party);
            menu.close();
            g.startBattle({
              mobs: mirrors, boss: true, canFlee: false, bg: 'bg_blood',
              onEnd: (o) => {
                if (o === 'victory') {
                  Cultivation.applyAdvance(c, r.next, g.bus);
                  g.ui.toast(`${c.name} 斩却心魔，境界晋升「${r.next.name}」！`);
                }
              },
            });
          });
      });
      btnRow.appendChild(bTrial);
    }
    box.appendChild(btnRow);
    menu.elContent.appendChild(box);
    const hr = document.createElement('div');
    hr.style.cssText = 'border-top:1px dashed rgba(212,175,55,0.25);margin:4px 0 10px;';
    menu.elContent.appendChild(hr);
  }
  menu.nav.setItems(menu.nav.items);
}
