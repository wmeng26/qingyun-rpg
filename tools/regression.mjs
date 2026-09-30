// 无头回归测试：node tools/regression.mjs
// 覆盖：第二章任务链 / 支线交付与回退 / 入队与技能回填 / 三人 Boss 战模拟 / 存档往返
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mod = (p) => import(pathToFileURL(path.join(root, 'js', p)).href);

const [
  { default: EventBus }, { default: Inventory }, { default: Equipment },
  { Character }, { default: Cultivation }, { default: QuestManager }, { default: BattleEngine },
  { default: QUESTS }, { default: ITEMS }, { default: SKILLS },
] = await Promise.all([
  mod('core/EventBus.js'), mod('systems/Inventory.js'), mod('systems/Equipment.js'),
  mod('systems/Character.js'), mod('systems/Cultivation.js'), mod('systems/QuestManager.js'), mod('battle/BattleEngine.js'),
  mod('data/quests.js'), mod('data/items.js'), mod('data/skills.js'),
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
  // 满境界再调用应安全返回 null（化神为当前最高境界）
  hero.realmId = 'huashen';
  ok(g.storyBreakthrough() === null, '满境界（化神）时 storyBreakthrough 返回 null');
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

console.log(`\n========== 结果: ${passed} 通过 / ${failed} 失败 ==========`);
process.exit(failed ? 1 : 0);
