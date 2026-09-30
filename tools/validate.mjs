// 数据一致性校验（开发工具，node 运行：node tools/validate.mjs）
// 检查：行宽一致 / 图例齐全 / NPC·传送门·事件落在可行走格 / 传送门目标存在 / 引用的 id 存在
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const data = (f) => import(pathToFileURL(path.join(root, 'js', 'data', f)).href);

const [maps, quests, dialogs, items, skills, monsters, realms, characters] =
  (await Promise.all([
    data('maps.js'), data('quests.js'), data('dialogs.js'), data('items.js'),
    data('skills.js'), data('monsters.js'), data('realms.js'), data('characters.js'),
  ])).map(m => m.default);

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);

for (const map of Object.values(maps)) {
  const { id, width, height, legend, tiles, portals, npcs, events, encounters } = map;
  if (tiles.length !== height) err(`${id}: 行数 ${tiles.length} != height ${height}`);
  tiles.forEach((row, y) => {
    if (row.length !== width) err(`${id}: 第${y}行宽 ${row.length} != ${width}`);
    for (const ch of row) if (!legend[ch]) err(`${id}: (${row.indexOf(ch)},${y}) 未知字符 '${ch}'`);
  });

  const walkable = (x, y) => {
    if (x < 0 || y < 0 || y >= tiles.length || x >= (tiles[y]?.length || 0)) return false;
    const l = legend[tiles[y][x]];
    return l && !l.solid;
  };

  for (const p of portals || []) {
    if (!walkable(p.x, p.y)) err(`${id}: 传送门 (${p.x},${p.y}) 不可行走`);
    if (!maps[p.to]) err(`${id}: 传送门目标地图不存在 ${p.to}`);
    else {
      const t = maps[p.to];
      if (!t.tiles[p.toY] || !t.legend[t.tiles[p.toY][p.toX]] || t.legend[t.tiles[p.toY][p.toX]].solid)
        err(`${id} -> ${p.to}: 落点 (${p.toX},${p.toY}) 不可行走`);
    }
  }
  for (const n of npcs || []) {
    if (!walkable(n.x, n.y)) err(`${id}: NPC ${n.id} (${n.x},${n.y}) 不可行走`);
    if (!dialogs[n.dialog]) err(`${id}: NPC ${n.id} 对话脚本不存在 ${n.dialog}`);
  }
  for (const e of events || []) {
    if (!walkable(e.x, e.y)) err(`${id}: 事件 ${e.type} (${e.x},${e.y}) 不可行走`);
    if (e.type === 'chest') {
      for (const it of e.items || []) if (!items[it.id]) err(`${id}: 宝箱物品不存在 ${it.id}`);
    }
    if (e.type === 'battle') {
      for (const m of e.battle.mobs) if (!monsters[m]) err(`${id}: 战斗怪物不存在 ${m}`);
      if (e.battle.introDialog && !dialogs[e.battle.introDialog]) err(`${id}: 战斗前置对话不存在 ${e.battle.introDialog}`);
    }
  }
  for (const zone of Object.values(encounters || {})) {
    for (const row of zone) for (const m of row.mobs) if (!monsters[m]) err(`${id}: 遇敌怪物不存在 ${m}`);
  }
}

// 任务引用
for (const q of Object.values(quests)) {
  if (q.requires && !quests[q.requires]) err(`${q.id}: 前置任务不存在 ${q.requires}`);
  if (q.next && !quests[q.next]) err(`${q.id}: 后续任务不存在 ${q.next}`);
  if (q.giver && !Object.values(maps).some(m => (m.npcs || []).some(n => n.id === q.giver)))
    err(`${q.id}: 任务给予者 NPC 不存在 ${q.giver}`);
  for (const o of q.objectives) {
    if (o.type === 'kill' && !monsters[o.target]) err(`${q.id}: kill 目标不存在 ${o.target}`);
    if (o.type === 'item' && !items[o.target]) err(`${q.id}: item 目标不存在 ${o.target}`);
    if (o.type === 'talk' && !Object.values(maps).some(m => (m.npcs || []).some(n => n.id === o.target)))
      err(`${q.id}: talk 目标 NPC 不存在 ${o.target}`);
  }
  for (const it of q.rewards.items || []) if (!items[it.id]) err(`${q.id}: 奖励物品不存在 ${it.id}`);
}

// 对话脚本
for (const [sid, script] of Object.entries(dialogs)) {
  if (!script.nodes[script.entry]) err(`${sid}: entry 节点不存在 ${script.entry}`);
  for (const [nid, node] of Object.entries(script.nodes)) {
    for (const b of node.branch || []) if (!script.nodes[b.next] && b.next !== null) err(`${sid}.${nid}: branch next 不存在 ${b.next}`);
    if (node.next && !script.nodes[node.next]) err(`${sid}.${nid}: next 不存在 ${node.next}`);
    for (const c of node.choices || []) if (c.next && !script.nodes[c.next]) err(`${sid}.${nid}: choice next 不存在 ${c.next}`);
    if (node.portrait && !['face_hero','face_liu','face_luo','face_shen','face_zhangmen','face_shangren','face_dizi','face_boss','face_hunter','face_huolang','face_heifeng','face_yaonong','face_xuesha','face_cunzhang','face_laoban','face_xuanming'].includes(node.portrait))
      warnings.push(`${sid}.${nid}: 头像未注册 ${node.portrait}`);
  }
}

// 技能引用
const defsOf = (table) => Object.values(table).filter(v => v && typeof v === 'object' && v.id);
for (const m of defsOf(monsters)) {
  for (const s of m.skills) if (!skills[s]) err(`${m.id}: 技能不存在 ${s}`);
  for (const d of m.drops) if (!items[d.id]) err(`${m.id}: 掉落物品不存在 ${d.id}`);
}
for (const c of defsOf(characters)) {
  for (const s of c.initialSkills) if (!skills[s]) err(`${c.id}: 初始技能不存在 ${s}`);
}
for (const s of defsOf(skills)) {
  if (s.kind === 'status' && s.onTurnEnd?.hpPct) { /* ok */ }
  if (s.addStatus && !skills[s.addStatus.id]) err(`技能 ${s.id}: 附加状态不存在 ${s.addStatus.id}`);
  if (s.buff && !skills[s.buff.id]) err(`技能 ${s.id}: 增益状态不存在 ${s.buff.id}`);
}

// 境界
const realmIds = realms.realms.map(r => r.id);
for (const s of Object.values(skills)) {
  if (s.learnRealm && !realmIds.includes(s.learnRealm)) err(`技能 ${s.id}: learnRealm 不存在 ${s.learnRealm}`);
}

// 商店物品价格
if (errors.length === 0) {
  console.log('✅ 数据校验通过');
} else {
  console.log(`❌ ${errors.length} 个错误:`);
  for (const e of errors) console.log('  ' + e);
}
for (const w of warnings) console.log(`⚠ ${w}`);
process.exit(errors.length ? 1 : 0);
