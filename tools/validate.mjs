// 数据一致性校验（开发工具，node 运行：node tools/validate.mjs）
// 检查：行宽一致 / 图例齐全 / NPC·传送门·事件落在可行走格 / 传送门目标存在 / 引用的 id 存在
//       / 连通性：NPC 格与明雷格视为障碍时，各地图的关键点仍全部可达（NPC 阻挡行走、明雷未讨伐时阻挡）
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const data = (f) => import(pathToFileURL(path.join(root, 'js', 'data', f)).href);
const core = (f) => import(pathToFileURL(path.join(root, 'js', 'core', f)).href);

const [maps, quests, dialogs, items, skills, monsters, realms, characters, audioMod, balance, shops] =
  await Promise.all([
    data('maps.js'), data('quests.js'), data('dialogs.js'), data('items.js'),
    data('skills.js'), data('monsters.js'), data('realms.js'), data('characters.js'),
    core('Audio.js'), data('balance.js'), data('shops.js'),
  ]).then(arrs => arrs.map(m => m.default !== undefined ? m.default : m));
const { SONG_NAMES } = audioMod;
// 头像白名单动态扫描美术模块源码，新增 face_* 后无需再改本文件
const FACE_NAMES = [...readFileSync(path.join(root, 'js', 'core', 'PlaceholderArt.js'), 'utf8')
  .matchAll(/^\s{2}(face_[A-Za-z0-9_]+)\s*:/gm)].map(m => m[1]);

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
      if (!e.battle) { err(`${id}: 战斗事件 (${e.x},${e.y}) 缺少 battle 配置`); continue; }
      for (const m of e.battle.mobs) if (!monsters[m]) err(`${id}: 战斗怪物不存在 ${m}`);
      if (e.battle.introDialog && !dialogs[e.battle.introDialog]) err(`${id}: 战斗前置对话不存在 ${e.battle.introDialog}`);
    }
  }
  for (const zone of Object.values(encounters || {})) {
    for (const row of zone) for (const m of row.mobs) if (!monsters[m]) err(`${id}: 遇敌怪物不存在 ${m}`);
  }
  if (map.music && !SONG_NAMES.includes(map.music)) err(`${id}: BGM 曲目不存在 ${map.music}`);
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
    for (const c of node.choices || []) {
      if (c.next && !script.nodes[c.next]) err(`${sid}.${nid}: choice next 不存在 ${c.next}`);
      for (const a of c.actions || []) {
        if (a.do === 'openShop' && a.id && !shops[a.id]) err(`${sid}.${nid}: openShop 商店不存在 ${a.id}`);
      }
    }
    if (node.portrait && !FACE_NAMES.includes(node.portrait))
      warnings.push(`${sid}.${nid}: 头像未注册 ${node.portrait}`);
  }
}

// 商店表：货品存在、商店被对话引用（缺省回退到 shop_qingyun）
for (const [sid, shop] of Object.entries(shops)) {
  for (const it of shop.goods) if (!items[it]) err(`商店 ${sid}: 货品不存在 ${it}`);
  else if (items[it].price <= 0) err(`商店 ${sid}: 货品无售价 ${it}`);
}
const referencedShops = new Set(Object.values(dialogs)
  .flatMap(s => Object.values(s.nodes)).flatMap(n => (n.choices || []).flatMap(c => c.actions || []))
  .filter(a => a.do === 'openShop').map(a => a.id || 'shop_qingyun'));
for (const sid of Object.keys(shops)) {
  if (!referencedShops.has(sid)) warnings.push(`商店 ${sid}: 没有任何对话引用（不可达）`);
}

// 武器门类：weapon 必须带合法 wtype；角色 wtype 合法；每名角色至少可获得一把本门类武器
const WEAPON_TYPE_KEYS = ['sword', 'blade', 'qin', 'brush'];
for (const it of Object.values(items)) {
  if (it.type === 'equipment' && it.slot === 'weapon' && !WEAPON_TYPE_KEYS.includes(it.wtype))
    err(`武器 ${it.id}: wtype 非法 ${it.wtype}`);
}
for (const c of Object.values(characters)) {
  if (!WEAPON_TYPE_KEYS.includes(c.wtype)) err(`角色 ${c.id}: wtype 非法 ${c.wtype}`);
}
const obtainableWtypes = new Set();
for (const shop of Object.values(shops)) {
  for (const id of shop.goods) if (items[id] && items[id].slot === 'weapon') obtainableWtypes.add(items[id].wtype);
}
for (const q of Object.values(quests)) {
  for (const it of q.rewards.items || []) if (items[it.id] && items[it.id].slot === 'weapon') obtainableWtypes.add(items[it.id].wtype);
}
for (const c of Object.values(characters)) {
  if (!obtainableWtypes.has(c.wtype)) err(`角色 ${c.id}（${c.wtype}系）: 商店与任务奖励中没有任何本门类武器`);
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

// 音频曲库完整性：音符数值合法、曲目结构齐全、BGM 名与地图引用一致
{
  const { SONGS, SFX_NAMES } = audioMod;
  for (const [sid, song] of Object.entries(SONGS)) {
    if (!(song.bpm > 0)) err(`曲目 ${sid}: bpm 非法`);
    if (!(song.loopBeats > 0)) err(`曲目 ${sid}: loopBeats 非法`);
    if (!Array.isArray(song.tracks) || !song.tracks.length) err(`曲目 ${sid}: 无音轨`);
    for (const tr of song.tracks) {
      if (!['sine', 'square', 'triangle', 'sawtooth'].includes(tr.wave)) err(`曲目 ${sid}: 音色非法 ${tr.wave}`);
      for (const [b, m, d] of tr.notes) {
        if (!(b >= 0) || !(m >= 21 && m <= 108) || !(d > 0)) err(`曲目 ${sid}: 音符非法 [${b},${m},${d}]`);
      }
    }
    for (const [b, k] of song.drums || []) {
      if (!['kick', 'snare', 'hat'].includes(k)) err(`曲目 ${sid}: 鼓型非法 ${k}`);
      if (!(b >= 0)) err(`曲目 ${sid}: 鼓点位置非法 ${b}`);
    }
  }
  if (!SFX_NAMES.length) err('音效表为空');
}

// 连通性：NPC 格与明雷格（可视敌人，未讨伐时为障碍）均视为障碍，从各入口
// （出生点/复活点/传送门落点）BFS，验证所有传送门、事件格可达，且每个 NPC / 明雷
// 至少一侧邻格可达（保证能对话 / 能走近交战）
{
  const entries = {};
  const addEntry = (mapId, x, y) => {
    if (maps[mapId]) (entries[mapId] ||= []).push([x, y]);
  };
  addEntry(balance.start.mapId, balance.start.pos.x, balance.start.pos.y);
  addEntry(balance.respawn.mapId, balance.respawn.x, balance.respawn.y);
  // 入口来源包含 portals 与 doors（室内建筑的进出走 doors 字段）
  for (const m of Object.values(maps)) {
    for (const p of m.portals || []) addEntry(p.to, p.toX, p.toY);
    for (const d of m.doors || []) addEntry(d.to, d.toX, d.toY);
  }

  for (const [id, map] of Object.entries(maps)) {
    const { tiles, legend, width, height } = map;
    const walkable = (x, y) => x >= 0 && y >= 0 && y < tiles.length && x < (tiles[y]?.length || 0)
      && legend[tiles[y][x]] && !legend[tiles[y][x]].solid;
    const npcSet = new Set((map.npcs || []).map(n => `${n.x},${n.y}`));
    const mobSet = new Set((map.events || []).filter(e => e.type === 'battle' && e.sprite).map(e => `${e.x},${e.y}`));
    const blocked = (x, y) => !walkable(x, y) || npcSet.has(`${x},${y}`) || mobSet.has(`${x},${y}`);
    const seen = new Set();
    const q = [];
    for (const [x, y] of entries[id] || []) {
      if (walkable(x, y) && !blocked(x, y) && !seen.has(`${x},${y}`)) { seen.add(`${x},${y}`); q.push([x, y]); }
    }
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (seen.has(k) || blocked(nx, ny)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    const reach = (x, y) => seen.has(`${x},${y}`);
    for (const p of map.portals || []) if (!reach(p.x, p.y)) err(`${id}: 传送门 (${p.x},${p.y}) 被 NPC/明雷 隔断不可达`);
    for (const e of map.events || []) {
      // 明雷本身即障碍格：改为验证四邻至少一格可达（能走近交战）
      if (e.type === 'battle' && e.sprite) {
        const touchable = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => walkable(e.x + dx, e.y + dy) && reach(e.x + dx, e.y + dy));
        if (!touchable) err(`${id}: 明雷 (${e.x},${e.y}) 四邻均不可达，无法交战`);
        continue;
      }
      if (!reach(e.x, e.y)) err(`${id}: 事件 ${e.type} (${e.x},${e.y}) 被 NPC/明雷 隔断不可达`);
    }
    for (const n of map.npcs || []) {
      const touchable = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => walkable(n.x + dx, n.y + dy) && reach(n.x + dx, n.y + dy));
      if (!touchable) err(`${id}: NPC ${n.id} (${n.x},${n.y}) 四邻均不可达，无法对话`);
    }
  }
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
