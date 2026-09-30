# 修仙题材 HTML5 回合制 RPG — 开发计划

## 一、已确认需求（用户拍板）

| 维度 | 决策 |
|---|---|
| 核心玩法 | 回合制战斗 RPG（经典 JRPG 式，速度决定行动顺序） |
| 目标平台 | 浏览器 HTML5，纯前端，无后端，无构建依赖 |
| 美术风格 | 2D 像素风，AI 生图素材，开发期色块占位后替换 |
| 题材 | 东方武侠/修仙（功法、境界突破、门派、江湖） |
| 队伍 | 首版主角单人起步，**架构按多单位数组设计，阶段 2 加入第二名队友验证** |
| 遇敌 | 阶段 1 暗雷（随机遇敌），阶段 2 加明雷 |
| 存档 | localStorage 随时存档（3 档位），战斗内禁止存档 |
| 交付 | 常规多文件工程 + `serve.bat` 一键本地服务 |
| 范围 | 完整小型 RPG，5 阶段迭代交付 |

## 二、技术选型

**原生 Canvas + ES Modules 自研，不引入 Phaser。** 理由：回合制 RPG 不需要物理引擎；全部代码自有、AI 辅助编码友好；零依赖体积小。

关键技术决策：
- 单个 `<canvas>`，逻辑分辨率 480×270，整数倍缩放 + `image-rendering: pixelated`
- 瓦片层离屏 canvas 预渲染
- **UI（战斗菜单/对话框/背包/任务面板）全部用 DOM/CSS 覆盖 canvas**，不自绘——中文排版、滚动、按钮天然支持
- 数据文件用 `.js`（`export default {}`）import，不用 `.json` fetch，绕开 file:// CORS 限制
- `index.html` 内嵌 file:// 协议检测，加载失败时显示「请运行 serve.bat」引导
- 音频用 `<audio>` 标签（阶段 5）

## 三、项目目录

```
2026-09-29-11-07-50/
├── index.html
├── css/{main.css, ui.css}
├── serve.bat                       # python -m http.server 8080
├── README.md
├── js/
│   ├── main.js                     # 引导 + 资源 manifest
│   ├── core/     Game.js, SceneManager.js, Input.js, Assets.js,
│   │             Renderer.js, EventBus.js, SaveManager.js
│   ├── scenes/   BootScene.js, MapScene.js, BattleScene.js, UIScene.js
│   ├── map/      TileMap.js, Player.js, NPC.js, Encounter.js
│   ├── battle/   BattleEngine.js, Unit.js, Skill.js, StatusEffect.js,
│   │             DamageFormula.js, BattleUI.js
│   ├── systems/  Inventory.js, Equipment.js, Character.js,
│   │             Cultivation.js, QuestManager.js, DialogEngine.js
│   └── data/     items.js, skills.js, monsters.js, maps.js,
│                 quests.js, dialogs.js, realms.js, balance.js
└── assets/
    ├── images/{tilesets,characters,battle,backgrounds,icons,ui}/
    └── audio/{bgm,se}/
```

**依赖规则（禁止循环）**：`data` 无依赖 ← `core` ← `systems`/`battle` ← `scenes` ← `main.js`；systems 之间只经 EventBus / Game 服务定位通信。

## 四、核心模块设计要点

1. **Game.js**：主循环（rAF + dt）、场景栈、全局服务定位（`game.inventory`、`game.quests`…）
2. **SceneManager**：场景栈 push/pop/replace（菜单盖住地图时地图暂停），生命周期 enter/exit/update/render/onPause/onResume
3. **MapScene**：瓦片+碰撞层渲染、Player 四方向网格移动（每格 150ms 步进）、NPC 交互、事件点（传送/宝箱/剧情格）、暗雷遇敌（遇敌区每格 8%，25 格未遇敌概率递增保底）
4. **BattleEngine**：回合状态机 `INTRO → COMMAND_SELECT → SORT(spd±5%) → ACTION_EXEC → CHECK_END → TURN_END(状态结算)`；引擎只产出事件队列 `{type:'damage',target,value}`，BattleUI 消费播放，**引擎可脱离 UI 跑**
5. **Unit**：玩家/敌人通用战斗单位；`partyUnits[]` / `enemyUnits[]` 数组遍历一切指令与结算——加队友 = `push()`，引擎零改动
6. **StatusEffect**：钩子式 `modifyStat / onTurnStart / onTurnEnd / onDamaged / canAct`（眩晕封印返回 false）
7. **Cultivation**：境界突破 = 等级达标 + 突破丹 + 成功率判定，成功全属性 × 跃升系数 + 解锁功法槽
8. **QuestManager**：状态 `locked/available/active/readyToTurnIn/completed`，监听 EventBus（enemyKilled/itemObtained/dialogFinished/flagSet）推进 objective
9. **DialogEngine**：DOM 对话框，逐字打印、立绘、选项分支（condition/next）、脚本指令（giveItem/startQuest/startBattle/setFlag/heal）
10. **SaveManager**：`{version, mapId, playerPos, partyState, inventory, equipment, questStates, flags}` → `localStorage["xiuxian_rpg_save_N"]`，带 version 校验与迁移表

## 五、数据驱动格式（关键示例）

```js
// data/skills.js —— 技能与状态同表
"skill_liehuojian": { id, name:"烈火剑气", kind:"active", mpCost:12,
  learnRealm:"lianqi_3", target:"one_enemy", element:"fire",
  power:1.6, accuracy:0.95, addStatus:{defId:"burn",chance:0.3} }
"burn": { kind:"status", isDebuff:true, duration:3,
  onTurnEnd:{ hpPercent:-0.06 } }

// data/quests.js
"quest_main_01": { name:"初入青云", type:"main", giver:"npc_zhangmen",
  objectives:[ {type:"kill",target:"mob_yelang",count:5},
               {type:"talk",target:"npc_zhangmen"} ],
  rewards:{ exp:120, gold:200, items:[{id:"pill_zhuji",count:1}] } }

// data/dialogs.js —— 节点数组，choices 带 actions
[ {speaker, portrait, text, next},
  {speaker, text, choices:[{text, next, actions:[{do:"startQuest",id}]}]} ]
```
道具/怪物结构同理（`type/slot/bonus/effect`、`base 属性表/skills/aiPattern/exp/gold/drops`）。

## 六、修仙数值框架（草案，系数全在 balance.js 可调）

- **属性**：气血HP / 灵力MP / 攻击atk / 防御def / 灵攻matk / 灵防mdef / 速度spd
- **境界**：炼气1-9层(Lv1-15, 每层+5%) → 筑基(Lv16-30, ×2.2, 筑基丹, 80%) → 金丹(Lv31-45, ×4.5, 60%) → 元婴(Lv46-60, ×8.0, 剧情100%)
- **成长**：`maxHp = 40+18n+0.6n²`、`atk = 6+2.2n`、`spd = 8+n`（其余同理，详见 realms.js/balance.js）；实际值 = 基础 × 境界系数 × (1+装备%) + 装备固定值，再乘 status 修正
- **伤害**：`raw = (atk*2 - def) * power * rand(0.9,1.1)`（法术用 matk/mdef × 五行克制 1.25/0.75）；保底 1；会心 8% ×1.5；软上限 ≤ 目标 maxHp×3
- **命中**：`clamp(0.9 + (spd差)*0.005, 0.7, 1.0)`；**逃跑**：`0.5 + spd差*0.02`，clamp(0.2,0.95)
- **经验**：`expToNext(n) = floor(12 * n^1.6)`；越级 ±10%/级，clamp 0.3~1.5
- **经济**：回血丹 50 金（回 30% 同级 HP）；主线必送 1 颗筑基丹，第 2 颗引导支线

## 七、阶段里程碑

### 阶段 1：最小可玩闭环
core 全套 + 一张 20×15 青云山下地图 + 网格移动/碰撞 + 暗雷（一种野狼）+ 完整回合战斗（普攻/1 技能/1 道具/逃跑、速度排序、HP/MP 条、日志、胜负结算）
**验证**：走地图→遇敌→打完→回地图。全色块占位，无存档/背包/对话。

### 阶段 2：成长系统 + 队友验证
经验升级、炼气→筑基突破（筑基丹）、技能学习面板、背包（分类/使用/装备三槽）、第二张地图（青云门内）+ 传送、明雷怪、随时存档/读档（3 档）、**加入第 2 名队友回归验证多单位架构**
**验证**：打怪升级→突破→属性跃升→双队友打更强怪→存档读档。

### 阶段 3：剧情与任务
DialogEngine、NPC 交互、QuestManager + 任务面板 + 追踪 HUD、主线×3 + 支线×2、怪物 6-8 种（AI 策略差异）、技能 10+、序章 Boss 战
**验证**：接任务→打怪→交付→推主线→Boss→「第一章完」。

### 阶段 4：美术与打磨
AI 像素素材全量替换、古风 UI 皮肤、受击闪白/伤害飘字/技能特效/震屏、标题与结算画面、数值 playtest、手感优化
**验证**：1-2 小时内容量、视觉统一的完整体验。

### 阶段 5（可选）：音频与扩展
BGM×4 + 音效×10、炼丹合成（材料→丹药）、发布分享。

## 八、AI 素材清单与工作流

- 主角行走图（四方向×3帧，单帧32×32）/战斗立绘96×96；怪物6种（64~128px）；NPC行走图5套；地块图集32×32格；战斗背景480×270×2；图标24×24约24个；头像/边框/LOGO
- 生图统一后缀：`pixel art, 16-bit JRPG style, limited palette, transparent background`；行走图多帧一致性差，先生成单帧再人工修帧
- **占位工作流**：Assets.js 加载失败自动生成色块+首字母占位图；素材路径集中在 manifest（key→path），代码只引用 key；替换 = 丢 PNG + 改 manifest 一行

## 九、风险与对策

| 风险 | 对策 |
|---|---|
| file:// 下 ES Module 被 Chrome 阻止 | serve.bat 一键起服务 + index.html 协议检测引导；数据用 .js import 不用 .json fetch |
| 模块循环依赖 | 严格单向依赖规则，main.js 集中注册，data 不 import 逻辑 |
| 旧存档不兼容崩溃 | version 字段 + migrations 迁移表，不兼容给明确提示 |
| 境界系数叠乘数值爆炸 | 系数全集中 balance.js；伤害保底+软上限；阶段 4 留 playtest 轮 |
| 战斗 UI 与引擎耦合 | 引擎只产事件队列，UI 消费播放，引擎可 console 自测 |
| 素材体积失控 | 尺寸上限表 + pngquant 压缩 + sprite sheet |

## 十、实施入口

从阶段 1 开始：建目录骨架 → core（Game/Renderer/Input/SceneManager/Assets 占位）→ TileMap+Player → BattleScene → data 各写 1 条示例跑通链路再铺量。

## 十一、关键文件清单（待创建）

- `index.html`、`css/main.css`、`css/ui.css`、`serve.bat`、`README.md`
- `js/main.js`、`js/core/*`（7 个）、`js/scenes/*`（4 个）、`js/map/*`（4 个）、`js/battle/*`（6 个）、`js/systems/*`（6 个）、`js/data/*`（8 个）
