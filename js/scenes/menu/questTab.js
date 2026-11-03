// 页签：任务（只读面板，含接取/交付指引）
import MAPS from '../../data/maps.js';
import { esc } from '../../core/dom.js';

// NPC 索引：id -> { name, map }（跨图同名 NPC 取首次出现），供任务指引定位
function npcLookup() {
  const idx = {};
  for (const def of Object.values(MAPS)) {
    for (const n of def.npcs || []) {
      if (!idx[n.id]) idx[n.id] = { name: n.name, map: def.name };
    }
  }
  return idx;
}

export function renderQuests(menu) {
  const g = menu.game;
  const stateNames = { available: '可接取', active: '进行中', ready: '可交付', completed: '已完成' };
  const npcs = npcLookup();
  let any = false;
  const quests = g.quests.all();
  for (const q of quests) {
    const st = g.quests.get(q.id);
    if (st.state === 'locked') continue;
    any = true;
    const box = document.createElement('div');
    box.className = 'quest-item';
    const objs = q.objectives.map(o => {
      const os = g.quests.objectiveState(q.id, o);
      const mark = os.done && !o.final ? '✔ ' : o.final && st.state === 'completed' ? '✔ ' : '';
      const prog = os.need > 1 ? ` ${os.cur}/${os.need}` : '';
      return `<div class="q-obj ${os.done && !o.final ? 'done' : ''}">${mark}${esc(o.text)}${prog}</div>`;
    }).join('');
    // 接取/交付指引：任务面板本身只读，「去哪里交互」必须写明，
    // 否则触屏玩家点条目无反馈，会当成「任务无法交互」的故障
    const turnInId = (q.objectives.find(o => o.type === 'talk' && o.final) || {}).target || q.giver;
    let go = '';
    if (st.state === 'available' && npcs[q.giver]) {
      go = `<div class="q-go">▸ 前往接取：${esc(npcs[q.giver].map)} · ${esc(npcs[q.giver].name)}</div>`;
    } else if (st.state === 'ready' && npcs[turnInId]) {
      go = `<div class="q-go">▸ 前往交付：${esc(npcs[turnInId].map)} · ${esc(npcs[turnInId].name)}</div>`;
    }
    const rewards = [];
    if (q.rewards.exp) rewards.push(`经验+${q.rewards.exp}`);
    if (q.rewards.gold) rewards.push(`金钱+${q.rewards.gold}`);
    for (const it of q.rewards.items || []) rewards.push(`${esc(g.itemName(it.id))}×${it.count}`);
    box.innerHTML = `
      <div class="q-title"><span>【${q.type === 'main' ? '主线' : '支线'}】${esc(q.name)}</span><span class="q-state">${stateNames[st.state] || ''}</span></div>
      <div class="q-obj" style="color:#a89878;">${esc(q.intro || '')}</div>
      ${objs}
      ${go}
      <div class="q-obj" style="color:#8a7a52;">奖励：${rewards.join('　')}</div>`;
    menu.elContent.appendChild(box);
  }
  if (!any) menu.elContent.innerHTML = '<div class="inv-empty">暂无任务……去青云门找掌门吧。</div>';
  menu.nav.setItems([]);
}
