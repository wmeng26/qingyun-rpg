// 页签：背包（使用 / 装备）
import { weaponTypeName } from '../../systems/Equipment.js';
import { displayName as forgeName } from '../../systems/Forge.js';
import { esc } from '../../core/dom.js';

export function renderItems(menu) {
  const g = menu.game;
  const entries = g.inventory.entries();
  if (!entries.length) {
    menu.elContent.innerHTML = '<div class="inv-empty">行囊空空如也……</div>';
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'inv-grid';
  for (const e of entries) {
    const row = document.createElement('div');
    row.className = 'inv-row';
    const icon = g.assets.get(e.def.icon);
    if (icon) {
      const img = document.createElement('canvas');
      img.width = 24; img.height = 24;
      img.style.cssText = 'width:24px;height:24px;image-rendering:pixelated;';
      img.getContext('2d').drawImage(icon, 0, 0);
      row.appendChild(img);
    }
    const bonus = e.def.type === 'equipment' ? menu._bonusText(e.def) : '';
    // 武器显示门类与适用者，一眼看清归谁用
    const wtTag = e.def.slot === 'weapon'
      ? ` <span class="i-bonus">（${weaponTypeName(e.def.wtype)} · ${menu._wtypeUserNames(e.def.wtype)}）</span>`
      : '';
    row.insertAdjacentHTML('beforeend', `
      <span class="i-name">${esc(forgeName(e.def))}</span>
      <span class="i-count">×${e.count}</span>
      <span class="i-desc">${esc(e.def.desc || '')}${bonus ? ` <span class="i-bonus">（${bonus}）</span>` : ''}${wtTag}</span>`);
    if (e.def.type === 'consumable') {
      const b = menu._btn('使用', () => menu._openUseSub(e));
      row.appendChild(b);
    } else if (e.def.type === 'equipment') {
      // 武器无人能用（门类角色未入队）时不出「装备」按钮，避免空列表
      const usable = e.def.slot !== 'weapon' || g.party.some(c => g.equipment.canEquip(c, e.def).ok);
      if (usable) {
        const b = menu._btn('装备', () => menu._openEquipMemberSub(e));
        row.appendChild(b);
      }
    }
    grid.appendChild(row);
  }
  menu.elContent.appendChild(grid);
  menu.nav.setItems(menu.nav.items);
}
