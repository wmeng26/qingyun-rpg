// 无头回归测试：node tools/regression.mjs
// 覆盖：第二章任务链 / 支线交付与回退 / 入队与技能回填 / 三人 Boss 战模拟 / 存档往返
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mod = (p) => import(pathToFileURL(path.join(root, 'js', p)).href);

const [
  { default: EventBus }, { default: Inventory }, { default: Equipment },
  { Character }, { default: Cultivation }, { default: QuestManager }, { default: BattleEngine },
  { default: QUESTS }, { default: ITEMS }, { default: SKILLS }, { default: MAPS },
] = await Promise.all([
  mod('core/EventBus.js'), mod('systems/Inventory.js'), mod('systems/Equipment.js'),
  mod('systems/Character.js'), mod('systems/Cultivation.js'), mod('systems/QuestManager.js'), mod('battle/BattleEngine.js'),
  mod('data/quests.js'), mod('data/items.js'), mod('data/skills.js'), mod('data/maps.js'),
]);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error(`  ❌ ${msg}`); }
}
function section(name) { console.log(`\n== ${name} ==`); }

// ===== 模拟 Game =====
function makeGame() {
  const g = {
    bus: new EventBus(),
    flags: new Set(),
    gold: 0,
    kills: 0,
    seenMobs: new Set(),
    killsByMob: {},
    chapterEnds: [],
    addGold(n) { this.gold = Math.max(0, this.gold + n); },
    obtainItem(id, count = 1, silent = false) {
      this.inventory.add(id, count);
      if (!silent) this.ui.toast(`获得 ${id}×${count}`);
      this.bus.emit('itemObtained', { id, count });
    },
    itemName(id) { return (ITEMS[id] && ITEMS[id].name) || id; },
    setFlag(f) { if (!this.flags.has(f)) { this.flags.add(f); this.bus.emit('flagSet', { flag: f }); } },
    storyBreakthrough() {
      const hero = this.party[0];
      if (!hero) return null;
      const next = Cultivation.storyAdvance(hero, this.bus);
      if (next) this.ui.toast(`${hero.name} 境界突破！晋升「${next.name}」`);
      return next;
    },
    ui: { toast() {}, chapterEnd(ch) { g.chapterEnds.push(ch); } },
  };
  // 与 Game 构造器同款的图鉴追踪绑定（enemyKilled 载荷 {mobId}）
  g.bus.on('enemyKilled', ({ mobId }) => {
    g.kills++;
    g.killsByMob[mobId] = (g.killsByMob[mobId] || 0) + 1;
  });
  g.inventory = new Inventory(g);
  g.equipment = new Equipment(g);
  g.party = [new Character('hero')];
  g.party[0].level = 20;
  g.party[0].realmId = 'zhuji';
  g.party[0].fullHeal();
  g.quests = new QuestManager(g);
  return g;
}

// ============ 1. 第二章任务链 ============
section('第二章任务链');
{
  const g = makeGame();
  const q = g.quests;
  // 模拟第一章已完成
  for (const id of ['quest_main_1', 'quest_main_2', 'quest_main_3']) q.get(id).state = 'completed';
  q.refreshAvailability();
  ok(q.get('quest_main_4').state === 'available', '主线4 在主线3完成后可接取');
  ok(q.get('quest_main_5').state === 'locked', '主线5 尚未解锁');

  q.accept('quest_main_4');
  ok(q.get('quest_main_4').state === 'active', '主线4 已接取');
  for (let i = 0; i < 3; i++) q.notifyKill('mob_tanzi');
  ok(q.get('quest_main_4').state === 'ready', '击杀探子×3 后可交付');
  q.complete('quest_main_4');
  ok(q.get('quest_main_4').state === 'completed', '主线4 已完成');
  ok(g.flags.has('quest_main_4_done'), '主线4 完成旗标已置位');
  ok(g.inventory.count('pill_dahuan') === 2, '主线4 奖励大还丹×2 到账');
  ok(q.get('quest_main_5').state === 'available', '主线5 解锁');
  ok(g.chapterEnds.length === 0, '主线4 不触发章节结算');

  q.accept('quest_main_5');
  q.notifyTalk('npc_huolang');
  ok(!q.get('quest_main_5').state.match(/ready/), '仅打听敌情尚不可交付');
  g.setFlag('boss_heifeng_defeated');
  ok(q.get('quest_main_5').state === 'ready', '敌情+击败黑风王后可交付');
  q.complete('quest_main_5');
  ok(q.get('quest_main_5').state === 'completed', '主线5 已完成');
  ok(g.inventory.count('armor_silver') === 1 && g.inventory.count('pill_jindan') === 1, '主线5 奖励到账');
  // 章节结算经 setTimeout(600ms) 延迟触发，等待后断言
  await new Promise(r => setTimeout(r, 700));
  ok(g.chapterEnds.length === 1 && g.chapterEnds[0] === 2, '触发第二章结算（chapterEnd(2)）');
}

// ============ 2. 支线交付与回退 ============
section('支线：货郎失单 / 刀谱');
{
  const g = makeGame();
  const q = g.quests;
  for (const id of ['quest_main_1', 'quest_main_2', 'quest_main_3', 'quest_main_4', 'quest_main_5']) q.get(id).state = 'completed';
  q.refreshAvailability();

  ok(q.get('quest_side_3').state === 'available', '支线3 可接取');
  q.accept('quest_side_3');
  g.obtainItem('zei_zang', 3, true);
  ok(q.get('quest_side_3').state === 'ready', '贼赃×3 集齐可交付');
  g.inventory.remove('zei_zang', 1);
  g.quests.notifyItem();
  ok(q.get('quest_side_3').state === 'active', '用掉贼赃后回退为进行中');
  g.obtainItem('zei_zang', 1, true);
  ok(q.get('quest_side_3').state === 'ready', '补足后重新可交付');
  q.complete('quest_side_3');
  ok(g.inventory.count('zei_zang') === 0, '交付扣除贼赃');
  ok(g.inventory.count('pill_dahuan') === 2, '支线3 奖励到账');

  ok(q.get('quest_side_4').state === 'available', '主线5 完成后支线4 可接取');
  q.accept('quest_side_4');
  g.obtainItem('dao_pu', 1, true);
  q.notifyTalk('npc_luo'); // 非最终 talk 不影响
  ok(q.get('quest_side_4').state === 'ready', '刀谱到手可交付');
  q.complete('quest_side_4');
  ok(g.inventory.count('amulet_yulin') === 1, '支线4 奖励御灵铃到账');
}

// ============ 3. 洛清霜入队 ============
section('洛清霜入队');
{
  const g = makeGame();
  const hero = g.party[0];
  const luo = new Character('luo');
  luo.level = hero.level;
  luo.exp = hero.exp;
  luo.realmId = hero.realmId;
  const learned = luo.syncSkills();
  ok(luo.id === 'luo' && luo.name === '洛清霜', '角色定义正确');
  ok(['skill_hansha', 'skill_duanjin', 'skill_shuangwu', 'skill_nujiang'].every(s => luo.skills.includes(s)),
    `筑基期回填全部刀法（实际 ${luo.skills.join(',')}）`);
  ok(learned.length >= 3, `syncSkills 返回新学列表（寒沙刀法为初始技能，新学 ${learned.length} 个）`);
  const st = luo.stats();
  ok(Object.values(st).every(v => Number.isFinite(v) && v > 0), `属性链有限（atk=${st.atk} spd=${st.spd}）`);
  ok(st.atk > hero.stats().atk && st.spd > hero.stats().spd, '刀客攻击/速度高于剑修');
  const liu = new Character('liu');
  liu.level = hero.level; liu.exp = hero.exp; liu.realmId = hero.realmId; liu.syncSkills();
  g.party.push(liu, luo);
  ok(g.party.length === 3, '三人成队');
}

// ============ 4. 三人 Boss 战（无头 300 局） ============
section('三人 Boss 战 300 局');
{
  let wins = 0, losses = 0, totalTurns = 0, errs = 0;
  for (let run = 0; run < 300; run++) {
    try {
      const g = makeGame();
      const hero = g.party[0];
      hero.equipment.weapon = 'sword_hanshuang';
      hero.equipment.armor = 'armor_silver';
      hero.equipment.accessory = 'amulet_yulin';
      const liu = new Character('liu');
      const luo = new Character('luo');
      for (const c of [liu, luo]) { c.level = 20; c.realmId = 'zhuji'; c.syncSkills(); }
      liu.equipment.weapon = 'sword_hanshuang';
      g.party.push(liu, luo);
      for (const c of g.party) c.fullHeal();

      const eng = new BattleEngine({ game: g, mobs: ['boss_heifeng'], boss: true, canFlee: false, winFlag: 'boss_heifeng_defeated' });
      let outcome = null, guard = 0;
      while (!outcome && guard++ < 200) {
        eng.beginTurn();
        while (eng.currentCommander()) {
          const u = eng.currentCommander();
          eng.setCommand(u, partyCommand(u, eng));
          eng.popCommander();
        }
        const r = eng.resolveTurn();
        outcome = r.outcome;
      }
      totalTurns += eng.turn - 1;
      if (outcome === 'victory') wins++;
      else losses++;
    } catch (e) { errs++; console.error('  异常:', e.message); }
  }
  ok(errs === 0, `无异常（异常 ${errs} 局）`);
  ok(losses === 0, `300 局全胜（胜 ${wins} / 负 ${losses}）`);
  console.log(`  平均回合数: ${(totalTurns / 300).toFixed(1)}`);
  ok(totalTurns / 300 < 40, '平均回合数 < 40');
}

// 简易队伍策略：优先治疗重伤者，否则用可用的最强输出
function partyCommand(u, eng) {
  const allies = eng.aliveParty();
  const enemies = eng.aliveEnemies();
  const skills = (u.source.skills || []).map(id => SKILLS[id]).filter(Boolean);
  const usable = skills.filter(s => s && (s.mpCost || 0) <= u.mp);
  if (u.source.id === 'liu') {
    const hurt = allies.filter(a => a.hp / a.maxHp() < 0.55).sort((a, b) => a.hp / a.maxHp() - b.hp / b.maxHp())[0];
    if (hurt) {
      const heal = usable.find(s => s.heal && s.target === 'one_ally') || usable.find(s => s.heal && s.target === 'all_allies');
      if (heal) {
        return heal.target === 'all_allies'
          ? { kind: 'skill', skillId: heal.id, targets: allies }
          : { kind: 'skill', skillId: heal.id, targets: [hurt] };
      }
    }
  }
  const aoe = usable.find(s => s.target === 'all_enemies' && enemies.length >= 2 && (s.power || 0) > 0);
  if (aoe) return { kind: 'skill', skillId: aoe.id, targets: enemies.slice() };
  const dmg = usable.filter(s => !s.heal && !s.cure && !s.buff).sort((a, b) => (b.power || 1) - (a.power || 1))[0];
  if (dmg && Math.random() < 0.8) return { kind: 'skill', skillId: dmg.id, targets: [enemies[0]] };
  return { kind: 'attack', targets: [enemies[0]] };
}

// ============ 5. 存档往返（三人 + 新任务状态） ============
section('存档往返');
{
  const g = makeGame();
  const hero = g.party[0];
  const liu = new Character('liu'); liu.level = 21; liu.realmId = 'zhuji'; liu.syncSkills();
  const luo = new Character('luo'); luo.level = 21; luo.realmId = 'zhuji'; luo.syncSkills();
  g.party.push(liu, luo);
  hero.hp = Math.floor(hero.stats().maxHp * 0.42);
  liu.equipment.accessory = 'amulet_yulin';
  luo.equipment.weapon = 'sword_hanshuang';
  g.setFlag('boss_heifeng_defeated');
  g.setFlag('luo_joined');
  g.addGold(888);
  g.obtainItem('dao_pu', 1, true);
  const q = g.quests;
  for (const id of ['quest_main_1', 'quest_main_2', 'quest_main_3', 'quest_main_4']) q.get(id).state = 'completed';
  q.refreshAvailability();
  q.accept('quest_main_5');
  q.notifyTalk('npc_huolang');
  const mainStateBefore = q.get('quest_main_5').state;

  const data = {
    party: g.party.map(c => c.serialize()),
    quests: q.serialize(),
    inventory: g.inventory.serialize(),
    flags: [...g.flags],
    gold: g.gold,
  };
  const json = JSON.parse(JSON.stringify(data)); // 模拟 localStorage

  const g2 = makeGame();
  g2.party = json.party.map(cd => Character.deserialize(cd));
  g2.quests.deserialize(json.quests);
  g2.inventory.deserialize(json.inventory);
  g2.flags = new Set(json.flags);
  g2.gold = json.gold;

  ok(g2.party.length === 3, '三人还原');
  ok(g2.party[2].name === '洛清霜' && g2.party[2].skills.includes('skill_nujiang'), '洛清霜技能还原');
  ok(g2.party[1].equipment.accessory === 'amulet_yulin', '装备还原');
  ok(Math.abs(g2.party[0].hp / g2.party[0].stats().maxHp - 0.42) < 0.01, '主角残血比例还原');
  ok(g2.flags.has('luo_joined') && g2.flags.has('boss_heifeng_defeated'), '旗标还原');
  ok(g2.gold === 888, '金钱还原');
  ok(g2.quests.get('quest_main_5').state === mainStateBefore, `任务状态还原（${mainStateBefore}）`);
  ok(g2.inventory.count('dao_pu') === 1, '背包还原');
}

// ============ 6. 回归：第一章内容不受影响 ============
section('第一章内容回归');
{
  const g = makeGame();
  const q = g.quests;
  ok(q.get('quest_main_1').state === 'available', '新游戏主线1 可接取');
  ok(q.get('quest_main_4').state === 'locked' && q.get('quest_main_5').state === 'locked', '第二章主线锁定');
  q.accept('quest_main_1');
  for (let i = 0; i < 5; i++) q.notifyKill('mob_lang');
  ok(q.get('quest_main_1').state === 'ready', '主线1 可交付');
  q.complete('quest_main_1');
  ok(g.inventory.count('pill_zhuji') === 1, '主线1 奖励筑基丹');
  // 幽冥 Boss 仍可无头运行
  const eng = new BattleEngine({ game: g, mobs: ['boss_youming'], boss: true, canFlee: false, winFlag: 'boss_youming_defeated' });
  eng.beginTurn();
  eng.setCommand(eng.currentCommander(), { kind: 'attack', targets: [eng.aliveEnemies()[0]] });
  const r = eng.resolveTurn();
  ok(Array.isArray(r.events) && r.events.length > 0, '幽冥老祖战斗可运行');
}

// ============ 7. 第三章任务链 ============
section('第三章任务链');
{
  const g = makeGame();
  const q = g.quests;
  for (const id of ['quest_main_1', 'quest_main_2', 'quest_main_3', 'quest_main_4', 'quest_main_5']) q.get(id).state = 'completed';
  q.refreshAvailability();
  ok(q.get('quest_main_6').state === 'available', '主线6 在主线5完成后可接取');

  q.accept('quest_main_6');
  for (let i = 0; i < 3; i++) q.notifyKill('mob_xueshatu');
  ok(q.get('quest_main_6').state === 'ready', '击杀血煞教徒×3 后可交付');
  q.complete('quest_main_6');
  ok(g.flags.has('quest_main_6_done'), '主线6 完成旗标已置位（谷口开启）');

  q.accept('quest_main_7');
  q.notifyTalk('npc_yaonong');
  g.setFlag('boss_zuoshi_defeated');
  ok(!q.get('quest_main_7').state.match(/ready/), '未突破金丹前主线7 不可交付');
  g.party[0].realmId = 'jindan';
  g.bus.emit('breakthrough', { char: g.party[0], realm: 'jindan' });
  ok(q.get('quest_main_7').state === 'ready', '金丹突破后主线7 可交付');
  q.complete('quest_main_7');
  ok(g.inventory.count('pill_jindan') === 2, '主线7 奖励金元丹×2 到账');
  ok(q.get('quest_main_8').state === 'available', '主线8 解锁');

  q.accept('quest_main_8');
  g.setFlag('boss_xueshazhu_defeated');
  ok(q.get('quest_main_8').state === 'ready', '击败教主后可交付');
  q.complete('quest_main_8');
  ok(g.inventory.count('armor_longlin') === 1, '主线8 奖励龙鳞甲到账');
  await new Promise(r => setTimeout(r, 700));
  ok(g.chapterEnds.length === 1 && g.chapterEnds[0] === 3, '触发第三章结算（chapterEnd(3)）');
}

// ============ 8. 剧情突破（元婴） ============
section('剧情突破 storyBreakthrough');
{
  const g = makeGame();
  const hero = g.party[0];
  hero.realmId = 'jindan';
  const before = hero.realmId;
  const next = g.storyBreakthrough();
  ok(!!next && next.id === 'yuanying', '金丹 → 元婴剧情突破成功');
  ok(hero.realmId === 'yuanying' && hero.realmDef().id === 'yuanying', '境界已更新');
  ok(hero.skills.includes('skill_guizong'), '主角学会元婴功法「万剑归宗」');
  const st = hero.stats();
  ok(Object.values(st).every(v => Number.isFinite(v) && v > 0), '元婴属性链有限');
  ok(hero.hp === st.maxHp, '突破后全恢复');
  // 满境界再调用应安全返回 null（炼虚为当前最高境界）
  hero.realmId = 'lianxu';
  ok(g.storyBreakthrough() === null, '满境界（炼虚）时 storyBreakthrough 返回 null');
  ok(before === 'jindan', '前置状态未受影响');
}

// ============ 9. 支线5/6 ============
section('支线：谷中药引 / 玄晶铸刀');
{
  const g = makeGame();
  const q = g.quests;
  for (const id of ['quest_main_1', 'quest_main_2', 'quest_main_3', 'quest_main_4', 'quest_main_5', 'quest_main_6', 'quest_main_7']) q.get(id).state = 'completed';
  q.refreshAvailability();

  ok(q.get('quest_side_5').state === 'available', '支线5 可接取');
  q.accept('quest_side_5');
  g.obtainItem('xue_zhu', 4, true);
  ok(q.get('quest_side_5').state === 'ready', '血煞珠×4 集齐可交付');
  q.complete('quest_side_5');
  ok(g.inventory.count('xue_zhu') === 0 && g.inventory.count('pill_jiuzhuan') === 2, '交付扣珠、九转丹到账');

  ok(q.get('quest_side_6').state === 'available', '主线7 完成后支线6 可接取');
  q.accept('quest_side_6');
  g.obtainItem('xuan_jing', 3, true);
  ok(q.get('quest_side_6').state === 'ready', '玄晶×3 集齐可交付');
  q.complete('quest_side_6');
  ok(g.inventory.count('dao_nujiang') === 1, '支线6 奖励怒江刀到账');
}

// ============ 10. 金丹三人 Boss 战（无头 300 局） ============
section('金丹三人 Boss 战 300 局');
{
  let wins = 0, losses = 0, totalTurns = 0, errs = 0;
  for (let run = 0; run < 300; run++) {
    try {
      const g = makeGame();
      const hero = g.party[0];
      hero.level = 30; hero.realmId = 'jindan'; hero.syncSkills();
      hero.equipment.weapon = 'sword_zhanlu';
      hero.equipment.armor = 'armor_longlin';
      hero.equipment.accessory = 'amulet_huhun';
      const liu = new Character('liu');
      const luo = new Character('luo');
      for (const c of [liu, luo]) { c.level = 30; c.realmId = 'jindan'; c.syncSkills(); }
      liu.equipment.weapon = 'sword_zhanlu'; liu.equipment.accessory = 'amulet_huhun';
      luo.equipment.weapon = 'dao_nujiang'; luo.equipment.armor = 'armor_longlin';
      g.party.push(liu, luo);
      for (const c of g.party) c.fullHeal();

      const eng = new BattleEngine({ game: g, mobs: ['boss_xueshazhu'], boss: true, canFlee: false, winFlag: 'boss_xueshazhu_defeated' });
      let outcome = null, guard = 0;
      while (!outcome && guard++ < 300) {
        eng.beginTurn();
        while (eng.currentCommander()) {
          const u = eng.currentCommander();
          eng.setCommand(u, partyCommand(u, eng));
          eng.popCommander();
        }
        const r = eng.resolveTurn();
        outcome = r.outcome;
      }
      totalTurns += eng.turn - 1;
      if (outcome === 'victory') wins++;
      else losses++;
    } catch (e) { errs++; console.error('  异常:', e.message); }
  }
  ok(errs === 0, `无异常（异常 ${errs} 局）`);
  ok(losses === 0, `300 局全胜（胜 ${wins} / 负 ${losses}）`);
  console.log(`  平均回合数: ${(totalTurns / 300).toFixed(1)}`);
  ok(totalTurns / 300 < 40, '平均回合数 < 40');

  // 左使（小 Boss）抽查 50 局
  let zuoWins = 0, zuoErrs = 0;
  for (let run = 0; run < 50; run++) {
    try {
      const g = makeGame();
      const hero = g.party[0];
      hero.level = 27; hero.realmId = 'jindan'; hero.syncSkills();
      const liu = new Character('liu'); const luo = new Character('luo');
      for (const c of [liu, luo]) { c.level = 27; c.realmId = 'jindan'; c.syncSkills(); }
      g.party.push(liu, luo);
      for (const c of g.party) c.fullHeal();
      const eng = new BattleEngine({ game: g, mobs: ['mob_zuoshi'], boss: true, canFlee: false, winFlag: 'boss_zuoshi_defeated' });
      let outcome = null, guard = 0;
      while (!outcome && guard++ < 300) {
        eng.beginTurn();
        while (eng.currentCommander()) {
          const u = eng.currentCommander();
          eng.setCommand(u, partyCommand(u, eng));
          eng.popCommander();
        }
        outcome = eng.resolveTurn().outcome;
      }
      if (outcome === 'victory') zuoWins++;
    } catch (e) { zuoErrs++; }
  }
  ok(zuoErrs === 0 && zuoWins >= 48, `左使抽查 50 局无异常且基本全胜（胜 ${zuoWins}，异常 ${zuoErrs}）`);
}

// ============ 11. 第四章任务链 ============
section('第四章任务链');
{
  const g = makeGame();
  const q = g.quests;
  for (const id of ['quest_main_1','quest_main_2','quest_main_3','quest_main_4','quest_main_5','quest_main_6','quest_main_7','quest_main_8']) q.get(id).state = 'completed';
  q.refreshAvailability();
  ok(q.get('quest_main_9').state === 'available', '主线9 在主线8完成后可接取');

  q.accept('quest_main_9');
  q.notifyTalk('npc_shen');
  for (let i = 0; i < 4; i++) q.notifyKill('mob_xuejiao');
  ok(q.get('quest_main_9').state === 'ready', '邀琴师+雪魈×4 后可交付');
  q.complete('quest_main_9');
  ok(g.inventory.count('pill_huashen') === 1, '主线9 奖励破境丹到账');

  q.accept('quest_main_10');
  g.setFlag('boss_yuanmojiang_defeated');
  ok(!q.get('quest_main_10').state.match(/ready/), '未化神前主线10 不可交付');
  g.party[0].realmId = 'huashen';
  g.bus.emit('breakthrough', { char: g.party[0], realm: 'huashen' });
  ok(q.get('quest_main_10').state === 'ready', '化神突破后主线10 可交付');
  q.complete('quest_main_10');
  ok(g.inventory.count('yu_longhun') === 1, '主线10 奖励龙魂玉到账');
  ok(q.get('quest_main_11').state === 'available', '主线11 解锁');

  q.accept('quest_main_11');
  g.setFlag('boss_xuanming_defeated');
  ok(q.get('quest_main_11').state === 'ready', '击败魔主后可交付');
  q.complete('quest_main_11');
  ok(g.inventory.count('sword_zhanxing') === 1 && g.inventory.count('armor_xuanming') === 1, '主线11 终章装备到账');
  await new Promise(r => setTimeout(r, 700));
  ok(g.chapterEnds.length === 1 && g.chapterEnds[0] === 4, '触发终章结算（chapterEnd(4)）');
}

// ============ 12. 沈孤鸿入队 ============
section('沈孤鸿入队');
{
  const g = makeGame();
  const hero = g.party[0];
  hero.level = 45; hero.realmId = 'yuanying';
  const shen = new Character('shen');
  shen.level = hero.level; shen.exp = hero.exp; shen.realmId = hero.realmId;
  shen.syncSkills();
  ok(shen.name === '沈孤鸿', '角色定义正确');
  ok(['skill_xianyin','skill_zhanqu','skill_leiyin','skill_anyun','skill_poxiao','skill_tianlai'].every(s => shen.skills.includes(s)),
    `元婴期回填全部琴技（实际 ${shen.skills.join(',')}）`);
  const st = shen.stats();
  ok(Object.values(st).every(v => Number.isFinite(v) && v > 0), `属性链有限（matk=${st.matk}）`);
  ok(st.matk > hero.stats().matk, '琴师灵攻高于剑修');
  // 化神突破补学
  shen.realmId = 'huashen';
  shen.learnSkillsForRealm('huashen');
  ok(shen.skills.includes('skill_longyin'), '化神学会「九霄龙吟」');
  g.party.push(shen);
  ok(g.party.length === 2, '入队成功');
}

// ============ 13. 化神四人 Boss 战（无头 300 局） ============
section('化神四人 Boss 战 300 局');
{
  let wins = 0, losses = 0, totalTurns = 0, errs = 0;
  for (let run = 0; run < 300; run++) {
    try {
      const g = makeGame();
      const hero = g.party[0];
      hero.level = 49; hero.realmId = 'huashen'; hero.syncSkills();
      hero.equipment.weapon = 'sword_zhanxing';
      hero.equipment.armor = 'armor_xuanming';
      hero.equipment.accessory = 'yu_longhun';
      const liu = new Character('liu'); const luo = new Character('luo'); const shen = new Character('shen');
      for (const c of [liu, luo, shen]) { c.level = 49; c.realmId = 'huashen'; c.syncSkills(); }
      liu.equipment.weapon = 'sword_zhanxing'; liu.equipment.accessory = 'yu_longhun';
      luo.equipment.weapon = 'dao_nujiang'; luo.equipment.armor = 'armor_xuanming';
      shen.equipment.weapon = 'qin_jiaowei'; shen.equipment.accessory = 'yu_longhun';
      g.party.push(liu, luo, shen);
      for (const c of g.party) c.fullHeal();

      const eng = new BattleEngine({ game: g, mobs: ['boss_xuanming'], boss: true, canFlee: false, winFlag: 'boss_xuanming_defeated' });
      let outcome = null, guard = 0;
      while (!outcome && guard++ < 300) {
        eng.beginTurn();
        while (eng.currentCommander()) {
          const u = eng.currentCommander();
          eng.setCommand(u, partyCommand(u, eng));
          eng.popCommander();
        }
        const r = eng.resolveTurn();
        outcome = r.outcome;
      }
      totalTurns += eng.turn - 1;
      if (outcome === 'victory') wins++;
      else losses++;
    } catch (e) { errs++; console.error('  异常:', e.message); }
  }
  ok(errs === 0, `无异常（异常 ${errs} 局）`);
  ok(losses === 0, `300 局全胜（胜 ${wins} / 负 ${losses}）`);
  console.log(`  平均回合数: ${(totalTurns / 300).toFixed(1)}`);
  ok(totalTurns / 300 < 40, '平均回合数 < 40');

  // 渊魔将抽查 50 局（元婴期队伍）
  let jWins = 0, jErrs = 0;
  for (let run = 0; run < 50; run++) {
    try {
      const g = makeGame();
      const hero = g.party[0];
      hero.level = 45; hero.realmId = 'yuanying'; hero.syncSkills();
      const liu = new Character('liu'); const luo = new Character('luo');
      for (const c of [liu, luo]) { c.level = 45; c.realmId = 'yuanying'; c.syncSkills(); }
      g.party.push(liu, luo);
      for (const c of g.party) c.fullHeal();
      const eng = new BattleEngine({ game: g, mobs: ['mob_yuanmojiang'], boss: true, canFlee: false, winFlag: 'boss_yuanmojiang_defeated' });
      let outcome = null, guard = 0;
      while (!outcome && guard++ < 300) {
        eng.beginTurn();
        while (eng.currentCommander()) {
          const u = eng.currentCommander();
          eng.setCommand(u, partyCommand(u, eng));
          eng.popCommander();
        }
        outcome = eng.resolveTurn().outcome;
      }
      if (outcome === 'victory') jWins++;
    } catch (e) { jErrs++; }
  }
  ok(jErrs === 0 && jWins >= 48, `渊魔将抽查 50 局无异常且基本全胜（胜 ${jWins}，异常 ${jErrs}）`);
}

// ============ 14. 程序化音频模块 ============
section('音频模块（无 AudioContext 降级 + FakeContext 调度）');
{
  const A = await mod('core/Audio.js');
  const { SONGS } = A;

  // 曲库完整性：结构齐全、音符落在循环内、音域合法
  const songIds = Object.keys(SONGS);
  ok(songIds.length >= 8, `曲库齐全（${songIds.length} 首：${songIds.join('/')}）`);
  ok(['title', 'map', 'cave', 'ice', 'battle', 'boss', 'chapter', 'ending'].every(k => SONGS[k]), '八首曲目命名符合场景约定');
  let badNotes = 0;
  for (const song of Object.values(SONGS)) {
    if (!(song.bpm > 0) || !(song.loopBeats > 0) || !song.tracks?.length) { badNotes++; continue; }
    for (const tr of song.tracks) {
      for (const [b, m, d] of tr.notes) {
        if (!(b >= 0 && b < song.loopBeats) || !(m >= 21 && m <= 108) || !(d > 0)) badNotes++;
      }
    }
  }
  ok(badNotes === 0, `曲谱音符全部合法（非法 ${badNotes} 个）`);

  // 1) 无 AudioContext 环境：initAudio/sfx 全套调用必须零抛错
  const eng = A.initAudio();
  let threw = false;
  try {
    for (const n of ['cursor', 'confirm', 'cancel', 'attack', 'victory', 'defeat']) A.sfx.play(n);
    A.sfx.music('map');       // 记录意图，不抛错
    A.sfx.cycleMusicVol();
    A.sfx.cycleSfxVol();
    A.sfx.music(null);
    A.sfx.musicVolName(); A.sfx.sfxVolName();
  } catch (e) { threw = true; console.error('  降级路径异常:', e.message); }
  ok(!threw && eng.ctx === null, '无 AudioContext 环境下全部 API no-op 不抛错');

  // 2) FakeContext：解锁后 SFX 合成与 BGM 音序器真正驱动节点
  let oscCount = 0, srcCount = 0;
  const fakeNode = () => ({
    connect() {}, disconnect() {}, start() {}, stop() {},
    gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
    frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    pan: { value: 0 }, type: '',
  });
  const fakeCtx = {
    currentTime: 0, sampleRate: 48000, state: 'running', destination: fakeNode(),
    resume: async () => {}, suspend: async () => {},
    createGain: fakeNode,
    createBiquadFilter: fakeNode,
    createStereoPanner: fakeNode,
    createDynamicsCompressor: fakeNode,
    createOscillator() { oscCount++; return fakeNode(); },
    createBufferSource() { srcCount++; return fakeNode(); },
    createBuffer: () => ({ getChannelData: () => new Float32Array(48000) }),
  };
  globalThis.AudioContext = function () { return fakeCtx; };
  try {
    eng.unlock();
    ok(eng.ctx === fakeCtx, 'unlock 后引擎持有 AudioContext');
    oscCount = srcCount = 0;
    A.sfx.play('attack');
    A.sfx.play('victory');
    ok(oscCount >= 5 && srcCount >= 1, `SFX 合成驱动振荡器/噪声（osc=${oscCount} noise=${srcCount}）`);

    A.sfx.music('battle');
    eng.musicPlayer._schedule(); // 显式推进一格（绕开真实 setInterval 时延）
    ok(oscCount > 5, `BGM 音序器向 FakeContext 排入音符（累计 osc=${oscCount}）`);
    const idBefore = eng.musicPlayer.songId;
    A.sfx.music('battle'); // 同曲重复调用不重排
    ok(eng.musicPlayer.songId === idBefore, '同曲目重复 music() 不重启');

    fakeCtx.currentTime += 2;
    const oscBefore = oscCount;
    eng.musicPlayer._schedule();
    ok(oscCount > oscBefore, '时间推进后 lookahead 持续补排音符');

    A.sfx.music(null);
    ok(eng.musicPlayer._timer === null && eng.musicPlayer._playing === false, 'music(null) 停止调度器');

    eng.settings.music = 2; // 固定起点，档位断言才确定
    const v0 = A.sfx.cycleMusicVol();
    ok(v0 === 3 && A.sfx.musicVolName() === '高', '音量档位循环（中→高），名称同步');
  } finally {
    delete globalThis.AudioContext;
    A.sfx.music(null);
  }
}

// ============ 15. 第五章任务链（后传·血煞之上） ============
section('第五章任务链');
{
  const g = makeGame();
  const q = g.quests;
  for (let i = 1; i <= 11; i++) q.get(`quest_main_${i}`).state = 'completed';
  q.refreshAvailability();
  ok(q.get('quest_main_12').state === 'available', '主线12 在主线11完成后可接取');

  q.accept('quest_main_12');
  for (let i = 0; i < 4; i++) q.notifyKill('mob_chisha');
  ok(q.get('quest_main_12').state === 'ready', '击杀赤煞教士×4 后可交付');
  q.complete('quest_main_12');
  ok(g.inventory.count('pill_xuling') === 1, '主线12 奖励炼虚丹到账');
  ok(q.get('quest_main_13').state === 'available', '主线13 解锁');

  q.accept('quest_main_13');
  ok(q.get('quest_main_13').state === 'active', '主线13 已接取');
  g.obtainItem('jing_chihun', 3, true);
  g.setFlag('chihun_a_defeated');
  ok(!q.get('quest_main_13').state.match(/ready/), '仅有晶未炼虚尚不可交付');
  g.party[0].realmId = 'lianxu';
  g.party[0].syncSkills();
  g.bus.emit('breakthrough', { char: g.party[0], realm: 'lianxu' });
  ok(q.get('quest_main_13').state === 'ready', '三晶+炼虚突破后可交付');
  q.complete('quest_main_13');
  ok(g.inventory.count('pill_xuling') === 3, '主线13 奖励炼虚丹补足至3');
  ok(q.get('quest_main_14').state === 'available', '主线14 解锁');

  q.accept('quest_main_14');
  g.setFlag('boss_chiyuan_defeated');
  ok(q.get('quest_main_14').state === 'ready', '击败赤渊后可交付');
  q.complete('quest_main_14');
  ok(g.inventory.count('sword_tianwen') === 1 && g.inventory.count('armor_chixia') === 1, '主线14 天问剑/赤霞袍到账');
  await new Promise(r => setTimeout(r, 700));
  ok(g.chapterEnds.length === 1 && g.chapterEnds[0] === 5, '触发第五章结算（chapterEnd(5)）');

  // 支线9/10
  const g2 = makeGame();
  const q2 = g2.quests;
  for (let i = 1; i <= 9; i++) q2.get(`quest_main_${i}`).state = 'completed';
  q2.refreshAvailability();
  ok(q2.get('quest_side_9').state === 'available', '支线9（轮回试炼）在主线9后可接取');
  q2.accept('quest_side_9');
  g2.setFlag('tower_f9_cleared');
  ok(q2.get('quest_side_9').state === 'ready', '登顶后可交付');
  q2.complete('quest_side_9');
  ok(g2.inventory.count('ling_xukong') === 1, '支线9 奖励虚空佩到账');

  // 支线10 依赖主线12（翎羽铸锋的铸剑师在赤煞窟）
  for (let i = 10; i <= 12; i++) q2.get(`quest_main_${i}`).state = 'completed';
  q2.refreshAvailability();
  ok(q2.get('quest_side_10').state === 'available', '支线10 在主线12后可接取');
  q2.accept('quest_side_10');
  g2.obtainItem('chi_ling', 3, true);
  ok(q2.get('quest_side_10').state === 'ready', '支线10 三根赤焰翎集齐可交付');
  q2.complete('quest_side_10');
  ok(g2.inventory.count('chi_ling') === 0, '支线10 交付扣除赤焰翎');
  ok(g2.inventory.count('pill_tianyuan') === 5, '支线10 天元丹到账（3+2 累计）');
}

// ============ 16. 炼虚境 + 图鉴追踪 ============
section('炼虚境与图鉴');
{
  const g = makeGame();
  const hero = g.party[0];
  hero.level = 55; hero.realmId = 'lianxu'; hero.syncSkills();
  ok(hero.skills.includes('skill_wenjian'), '主角炼虚学会「天问一剑」');
  const liu = new Character('liu'); liu.level = 55; liu.realmId = 'lianxu'; liu.syncSkills();
  const luo = new Character('luo'); luo.level = 55; luo.realmId = 'lianxu'; luo.syncSkills();
  const shen = new Character('shen'); shen.level = 55; shen.realmId = 'lianxu'; shen.syncSkills();
  ok(liu.skills.includes('skill_zaohua'), '柳如烟学会「造化回天」');
  ok(luo.skills.includes('skill_shuangjue'), '洛清霜学会「霜天绝斩」');
  ok(shen.skills.includes('skill_dayin'), '沈孤鸿学会「大音希声」');
  const st = hero.stats();
  ok(Object.values(st).every(v => Number.isFinite(v) && v > 0), `炼虚属性链有限（atk=${st.atk}）`);
  ok(Cultivation.nextRealmDef(hero) === null, '炼虚为当前最高境界');

  // 图鉴：击杀追踪（镜像 Game 构造器的 enemyKilled 绑定）
  const eng = new BattleEngine({ game: g, mobs: ['mob_chisha', 'mob_chisha'], canFlee: false });
  let outcome = null, guard = 0;
  while (!outcome && guard++ < 200) {
    eng.beginTurn();
    while (eng.currentCommander()) {
      const u = eng.currentCommander();
      eng.setCommand(u, { kind: 'attack', targets: [eng.aliveEnemies()[0]] });
      eng.popCommander();
    }
    outcome = eng.resolveTurn().outcome;
  }
  eng.applyVictory();
  ok(g.killsByMob['mob_chisha'] === 2, `图鉴击杀计数（mob_chisha ×${g.killsByMob['mob_chisha']}）`);
  ok(g.kills === 2, '总击杀同步');
}

// ============ 17. 轮回塔结构 ============
section('轮回古塔结构');
{
  const tower = MAPS.map_lunhui;
  ok(tower.tiles.length === 108 && tower.tiles.every(r => r.length === 18), '塔身 9层×12行、宽18 全部一致');
  ok(tower.legend['a'] && tower.legend['a'].enc === 'tw1' && tower.legend['i'].enc === 'tw8', '遭遇分区图例齐全');
  const walkable = (x, y) => {
    const l = tower.legend[tower.tiles[y] && tower.tiles[y][x]];
    return l && !l.solid;
  };
  ok(walkable(8, 10), '入塔落点（8,10）可行走');
  for (let n = 1; n <= 8; n++) ok(walkable(8, (n - 1) * 12) && walkable(9, (n - 1) * 12), `第${n}层上行门可行走`);
  for (let n = 1; n <= 9; n++) ok(walkable(8, n * 12 - 1) && walkable(9, n * 12 - 1), `第${n}层下行门可行走`);
  ok(walkable(8, 33) && walkable(9, 33), '第3层守层咽喉可行走');
  ok(tower.portals.length === 34, `传送门 34 座（实际 ${tower.portals.length}）`);
  const ups = tower.portals.filter(p => p.requiresFlag);
  ok(ups.length === 4 && ups.every(p => ['tower_f3_cleared', 'tower_f6_cleared'].includes(p.requiresFlag)),
    '第3/6层上行门有守层旗标禁制');
  const chests = tower.events.filter(e => e.type === 'chest');
  ok(chests.some(e => (e.items || []).some(it => it.id === 'ling_xukong')), '塔顶藏有虚空佩');
  const guards = tower.events.filter(e => e.type === 'battle');
  ok(guards.length === 6 && new Set(guards.map(e => e.flag)).size === 3, '3 个守层战（双侧触发格）');
  const mobIds = new Set(Object.values(tower.encounters).flat().map(r => r.mobs).flat());
  ok([...mobIds].every(id => typeof id === 'string'), '遭遇表引用完整（validate 已校验怪物存在性）');
}

// ============ 18. 炼虚四人 Boss 战（赤渊，无头 300 局） ============
section('赤渊终战 300 局（炼虚四人）');
{
  let wins = 0, losses = 0, totalTurns = 0, errs = 0;
  for (let run = 0; run < 300; run++) {
    try {
      const g = makeGame();
      const hero = g.party[0];
      hero.level = 55; hero.realmId = 'lianxu'; hero.syncSkills();
      hero.equipment.weapon = 'sword_tianwen';
      hero.equipment.armor = 'armor_chixia';
      hero.equipment.accessory = 'ling_xukong';
      const liu = new Character('liu'); const luo = new Character('luo'); const shen = new Character('shen');
      for (const c of [liu, luo, shen]) { c.level = 55; c.realmId = 'lianxu'; c.syncSkills(); }
      liu.equipment.weapon = 'sword_zhanxing'; liu.equipment.armor = 'armor_chixia'; liu.equipment.accessory = 'ling_xukong';
      luo.equipment.weapon = 'dao_nujiang'; luo.equipment.armor = 'armor_xuanming'; luo.equipment.accessory = 'yu_longhun';
      shen.equipment.weapon = 'qin_jiaowei'; shen.equipment.accessory = 'yu_longhun';
      g.party.push(liu, luo, shen);
      for (const c of g.party) c.fullHeal();

      const eng = new BattleEngine({ game: g, mobs: ['boss_chiyuan'], boss: true, canFlee: false, winFlag: 'boss_chiyuan_defeated' });
      let outcome = null, guard = 0;
      while (!outcome && guard++ < 300) {
        eng.beginTurn();
        while (eng.currentCommander()) {
          const u = eng.currentCommander();
          eng.setCommand(u, partyCommand(u, eng));
          eng.popCommander();
        }
        const r = eng.resolveTurn();
        outcome = r.outcome;
      }
      totalTurns += eng.turn - 1;
      if (outcome === 'victory') wins++;
      else losses++;
    } catch (e) { errs++; console.error('  异常:', e.message); }
  }
  ok(errs === 0, `无异常（异常 ${errs} 局）`);
  ok(losses === 0, `300 局全胜（胜 ${wins} / 负 ${losses}）`);
  console.log(`  平均回合数: ${(totalTurns / 300).toFixed(1)}`);
  ok(totalTurns / 300 < 40, '平均回合数 < 40');

  // 守塔傀儡抽查 50 局（炼虚单人+伙伴）
  let tWins = 0, tErrs = 0;
  for (let run = 0; run < 50; run++) {
    try {
      const g = makeGame();
      const hero = g.party[0];
      hero.level = 55; hero.realmId = 'lianxu'; hero.syncSkills();
      const liu = new Character('liu');
      liu.level = 55; liu.realmId = 'lianxu'; liu.syncSkills();
      g.party.push(liu);
      for (const c of g.party) c.fullHeal();
      const eng = new BattleEngine({ game: g, mobs: ['mob_takui'], boss: true, canFlee: false });
      let outcome = null, guard = 0;
      while (!outcome && guard++ < 300) {
        eng.beginTurn();
        while (eng.currentCommander()) {
          const u = eng.currentCommander();
          eng.setCommand(u, partyCommand(u, eng));
          eng.popCommander();
        }
        outcome = eng.resolveTurn().outcome;
      }
      if (outcome === 'victory') tWins++;
    } catch (e) { tErrs++; }
  }
  ok(tErrs === 0 && tWins >= 48, `守塔傀儡抽查 50 局无异常且基本全胜（胜 ${tWins}，异常 ${tErrs}）`);
}

console.log(`\n========== 结果: ${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
