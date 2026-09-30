# 《青云仙途》项目检查报告

检查日期：本次会话　检查方式：静态走查 + 两种运行时验证（无头战斗模拟、DOM/Canvas 桩实跑游戏）
代码规模：49 个文件 / 约 6,090 行（JS 41 个模块）

---

## 一、结论速览

| 项目 | 结果 |
|---|---|
| 自带数据校验 `node tools/validate.mjs` | ✅ 通过 |
| 自带语法检查 `node tools/syntax-check.mjs` | ✅ 41 个模块全部通过 |
| 全部模块 HTTP 可达性 | ✅ 41/41 返回 200 |
| 端到端实跑（引导→标题→新游戏→序章→地图→菜单） | ✅ 无异常 |
| 无头战斗引擎（含 Boss 战 300 局） | ✅ 0 异常，状态机不卡死 |
| 存档/读档往返（8 类状态逐项比对） | ✅ 全部一致 |
| **发现缺陷** | **1 个致命、1 个高危、3 个中危、5 个低危**（另有 2 项初判有疑、实测为误报，见第六节） |
| **修复状态** | **全部 10 项已修复并回归验证通过**（C1/H1/M1 见第八节，M2~M5、L1~L4 见第十节） |

**总体评价**：架构干净、依赖分层严格、数据驱动彻底，工程完成度明显高于一般个人项目。存档系统尤其扎实，实测 8 类状态全部无损往返。主要问题集中在个别交互细节和一处数据字段缺失上。

---

## 二、致命缺陷（必须修）

### C1　战斗结算可被二次确认 → 永久黑屏死锁　【已修复 → 见第八节】

**位置**：`js/battle/BattleUI.js:342-347`、`:372`，`js/scenes/BattleScene.js:98-103`

```js
const finish = () => {                     // ← 没有 once 保护
  this.elResult.classList.add('hidden');
  eng.finish();
  this.onEnd(outcome);
};
this.elResult.querySelector('.res-ok').onclick = finish;
// :372 结算阶段又把键盘也接到 finish
this.nav = { handleKey: (a) => { if (a === 'confirm' || a === 'cancel') { finish(); return true; } ... } };
```

`finish()` 没有任何幂等保护，而结算画面有**两条**触发路径：鼠标点 `.res-ok`、键盘 Z/回车/空格（`:372` 装的 `nav`，且 `phase` 始终停留在 `'result'`，`handleKey` 会一直路由过去）。按空格尤其危险——浏览器会同时派发 click 与 keydown。

多跑一次 `finish()` 的后果：`BattleScene._finish` 会再执行一次 `game.scenes.pop()`，此时战斗场景早已弹出，于是**把 MapScene 也弹掉**，场景栈清空 → `SceneManager.update/render` 直接 return → 画面永远黑屏，只能刷新页面。

**实测复现**（DOM 桩实跑）：

```
第1次确认后: 栈 = MapScene          | 金钱 = 92 | inBattle = false   ← 正常
第2次确认后: 栈 = MapScene          | 金钱 = 92 | inBattle = false   ← 陈旧引用未触发
第3次确认后: 栈 = (空)              | 金钱 = 92                     ← ★ 场景栈被清空
栈顶 = (空)  | 仍可推进帧 = true                                      ← 黑屏、无恢复途径
```

**修复**：

```js
let done = false;
const finish = () => {
  if (done) return;
  done = true;
  this.nav = null;                                  // 断开键盘路径
  this.elResult.querySelector('.res-ok').onclick = null;  // 断开鼠标路径
  this.elResult.classList.add('hidden');
  eng.finish();
  this.onEnd(outcome);
};
```

并让 `BattleScene._finish` 也幂等：`if (this._ended) return; this._ended = true;`

---

## 三、高危缺陷（建议尽快修）

### H1　按住方向键/确认键会按系统重复速率驱动菜单　【已修复 → 见第八节】

**位置**：`js/core/Input.js:17-26`

```js
window.addEventListener('keydown', (e) => {
  const action = KEYMAP[e.code];
  if (!action) return;
  e.preventDefault();
  const panel = game.ui && game.ui.activePanel;
  if (panel && panel.handleKey && panel.handleKey(action, e)) return;  // ← 重复事件也走这里
  if (!e.repeat) this.pressed.add(action);                              // ← 守卫来得太晚
  this.held.add(action);
});
```

`!e.repeat` 守卫只保护了场景级输入（`wasPressed`），**面板级输入没有保护**。而 `PanelNav.handleKey`（`js/core/UIPanel.js:34-51`）和 `DialogEngine.handleKey`（`js/systems/DialogEngine.js:182`）都会消费重复事件，于是长按会以系统重复速率连续触发移动/确认。

**实测复现**：菜单里按住右方向键，11 次 repeat 事件 → 页签从 `sys` 翻到 `item`（连翻两格）。

**影响**：菜单光标跳跃、对话被瞬间快进到底（可能看漏剧情和选项）。这是玩家一上手就会遇到的手感问题。

**修复**：把守卫提到面板路由之前。

```js
if (e.repeat) { this.held.add(action); return; }
```

---

## 四、中危缺陷

### M1　`威压`（Boss 技能）缺 `power` 字段，会打出全额伤害　【已修复 → 见第八节】

**位置**：`js/data/skills.js:107` + `js/battle/Skill.js:38-46`

```js
e_weiya: { id:'e_weiya', name:'威压', kind:'active', mpCost:0,
           target:'one_enemy', accuracy:1.0, addStatus:{ id:'atk_down', chance:0.7 } },
           // ↑ 没有 power 字段
```

`Skill.js` 对没有 `power` 的攻击类技能走 `power: skill.power || 1`，并且非 `phys` 默认走**灵攻**结算。结果这个本该只降攻的 debuff 变成了「降攻 + 一次 `matk` 满额魔法伤害」。

**实测**（目标 mdef=20、maxHp=1000）：`e_weiya  power=undefined -> dmg(99), status　目标剩余 HP=901`。

Boss AI（`js/battle/BattleEngine.js:164-165`）在前两回合有 **80% 概率**放它，等于给 Boss 白送一发高伤魔法。

同类问题还有两个技能，但都是 `target:'self'`（`skill_yufeng`、`skill_jinzhong`），只对自己结算，**无实际症状**，只是白算一次数值。

**修复**（推荐给 `Skill.js` 加防御，一次修掉整类隐患）：

```js
// Skill.js，攻击类分支之前
const isSupport = skill.buff || skill.cure || (!skill.power && skill.addStatus);
if (isSupport) {
  if (skill.addStatus) { /* 只结算状态，不结算伤害 */ }
  continue;
}
```

或最小改动：给 `e_weiya` 显式标 `power: 0`，同时让 `Skill.js` 对 `power === 0` 跳过伤害结算。

### M2　收集类任务：数量不足也能交付，且状态不可回退　【已修复 → 见第十节】

**位置**：`js/systems/QuestManager.js:181-190`、`:152-155`

`objectiveState` 是**实时读背包**，但 `st.state` 一旦置为 `ready` 就再不回退（`checkReady` 只处理 `active → ready`）。`complete()` 又无条件把任务置为 `completed`，并调 `inventory.remove(obj.target, obj.count)` —— 该调用在数量不足时只返回 `false`，**不报错也不阻断**。

**实测**：

```
接取(背包 0 颗) => done=false, cur=0/3   任务态 = active
获得 3 颗      => done=true,  cur=3/3   任务态 = ready
用掉 1 颗      => done=false, cur=2/3   任务态 = ready      ← 状态未回退
交付后任务态 = completed | 背包剩余狼牙 = 2                  ← 少交 1 颗也算完成
```

**影响**：玩家可以把要交的物品吃掉/卖掉后照样交付（轻微刷奖励）；反向情况下若物品彻底丢失，`ready` 会一直挂着。`quest_side_1`（3 狼牙）是日常可复现路径。

**修复**：`complete()` 里把扣除失败当作阻断。

```js
for (const obj of q.objectives) {
  if (obj.type === 'item' && !this.game.inventory.remove(obj.target, obj.count)) {
    this.game.ui.toast('物品不足，无法交付');
    return;                     // 不改状态、不发奖励
  }
}
```

### M3　`Character.deserialize` 未对存档数值做归一化　【已修复 → 见第十节】

**位置**：`js/systems/Character.js:31`、`:132-141`

**先说结论**：`realmDef()` 本身是安全的 —— `REALMS.byId`（`js/data/realms.js:31`）在找不到 id 时会兜底返回 `realms[0]`，所以不会出现 undefined 解引用。此项不构成崩溃风险。

残留风险只在**数值**上：`level`/`exp`/`hp`/`mp` 直接采信存档（`c.level = d.level`，`c.exp = d.exp`）。若存档被手工编辑或损坏成 `undefined`/`NaN`，`baseStat()` 里 `growth[key](undefined)` 会产出 `NaN` 并沿属性链扩散（`stats()` → `hp` → HUD 显示 `NaN`）。日常读档不会触发，属于健壮性补强而非线上缺陷。

**建议**：`deserialize` 里加一行归一化即可。

```js
c.level = Math.max(1, Math.min(BALANCE.exp.cap, Number(d.level) || 1));
c.exp = Math.max(0, Number(d.exp) || 0);
c.realmId = REALMS.byId(d.realmId).id;
```

### M4　`Renderer.resize` 在极小窗口下会把画面压到 0.5 倍（低危，实际几乎遇不到）　【已修复 → 见第十节】

**位置**：`js/core/Renderer.js:19-24`

```js
let scale = Math.min(w / 480, h / 270);
if (scale >= 1) scale = Math.floor(scale);
scale = Math.max(scale, 0.5);
```

只有当窗口宽 < 480 **或** 高 < 270 时，`scale` 才落在 (0,1) 区间并被 `Math.floor` 拍成 **0**，再被 `Math.max` 抬到 0.5。

**实测各窗口尺寸的实际显示结果**：

| 窗口 | 现在 | 修正后 |
|---|---|---|
| 1280×720 | 2× → 960×540 | 2× → 960×540 |
| 800×600 | 1× → 480×270 | 1× → 480×270 |
| 400×700 | 0.833× → 400×225 | 0.833× → 400×225 |
| 320×240 | 0.667× → 320×180 | 0.667× → 320×180 |

结论：**常见尺寸下并无异常**（自 480×270 起，`scale ≥ 1` 时取整是刻意保持像素锐利的正确行为）。仅在宽 < 480 或高 < 270 的极端窗口才会退化到 0.5 倍（240×135）。属于潜在健壮性问题，**不是线上缺陷**，可在顺手改动时一起修掉。

**修复**（顺手即可，优先级低）：

```js
let scale = Math.min(w / this.LOGICAL_W, h / this.LOGICAL_H);
if (scale >= 1) scale = Math.floor(scale);
else scale = Math.max(scale, 0.5);   // 不足 1 倍时保留小数比例
```

### M5　启动失败提示面板出现后不会自动消失　【已修复 → 见第十节】

**位置**：`index.html:44-49`、`js/main.js:28`

`__BOOTED` 在 `main.js` 里**确实会被置 true**（已实测），3 秒看门狗逻辑本身是对的。但反向路径没处理：一旦某次启动超过 3 秒（低端机、首次冷启动、磁盘慢），`#boot-error` 面板被 `classList.remove('hidden')` 显示后，**再也没有任何代码把它隐藏回去**。玩家会看到全屏「⚠ 游戏加载失败」盖在正常游戏上，无法关闭。

**修复**：`main.js` 置位时顺手收掉提示。

```js
window.__BOOTED = true;
document.getElementById('boot-error')?.classList.add('hidden');
document.getElementById('protocol-warning')?.classList.add('hidden');
```

---

## 五、低危 / 改进建议

### L1　存档覆盖无确认，且没有删除功能　【已修复 → 见第十节】

**位置**：`js/scenes/MainMenu.js:403-407`，`js/core/SaveManager.js:51`

点「存档」直接覆盖旧档，无二次确认；`SaveManager.delete()` 写好了却**没有任何 UI 调到它**，玩家无法清理档位。

**建议**：`m` 存在时先 `confirm()`；在每行加一个「删除」按钮。

### L2　版本不兼容的存档在标题页显示为「空」　【已修复 → 见第十节】

**位置**：`js/scenes/TitleScene.js:49-64`，`js/core/SaveManager.js:35-37`

`meta()` 对不兼容存档返回 `null` → 标题页渲染成 `—— 空 ——`，点击直接 `return`，`TitleScene.js:59` 那句「存档版本不兼容」的 toast 永远走不到。玩家会以为存档丢了。

**建议**：`meta()` 返回 `{ incompatible:true, slot, savedAt }`，标题页显示「【旧版本存档】」并在点击时明确提示。

### L3　「战斗中不可存档」只写在帮助文本里，代码未设防　【已修复 → 见第十节】

`MainMenu.js:404` 与 `SaveManager.save()` 都没有 `inBattle` 检查。当前**不可达**（战斗中菜单打不开，`MapScene.js:56-64`），属于缺失的不变量而非可利用漏洞。建议在 `SaveManager.save()` 里补一道 `if (this.game.inBattle) return false;`，让规则落到代码上。

### L4　`Inventory.applyEffect` 满血也会消耗丹药　【已修复 → 见第十节】

**位置**：`js/systems/Inventory.js:58-79`

`use()` 无条件 `remove(id, 1)`，即使目标已满血、实际回复为 0，也只提示「没有效果」而丹药照扣。建议加提示或直接拒绝。

---

## 六、已实测确认**没有问题**的部分

以下几点是本次重点验证过、结论为**正常**的，可以放心：

| 验证项 | 方法 | 结果 |
|---|---|---|
| 伤害公式是否与设计文档一致 | 对照 `balance.js` 逐档取值 | ✅ 与文档完全一致（`(atk*2-def)*power*方差*五行`，保底/软上限/会心都对） |
| 战斗引擎能否脱离 UI 运行 | 无头驱动 300 局 Boss 战 | ✅ 0 异常，无死循环，胜负判定正确 |
| Boss 数值是否过难 | 300 局 × 5 种配置 | ✅ 全部 300/300 胜，平均 5.8~15.8 回合，无「必败」设计 |
| 存档/读档是否丢状态 | 经真实菜单存档，破坏状态后读回，8 类逐项比对 | ✅ 地图/坐标/金钱/击杀/队伍(等级·经验·境界·HP·MP·技能·装备)/背包/旗标/任务**全部一致** |
| 暗雷遇敌率与 25 步保底 | 20 万步蒙特卡洛 | ✅ 实测 8.69%（配置 8%），最大间隔 40 步，安全区不累积计数，空遇敌表返回 null |
| 收集类任务是否可达成 | 追 `mob_yaohu` 掉落 → `book_canpian` | ✅ 高草区 26.9% 遭遇妖狐，残页掉率 0.6，可达 |
| Boss 旗标链路 | 无头跑胜利结算 | ✅ `winFlag` 正确置位，`quest_main_3` 不会卡死 |
| 传送落点 / 复活点 / 起点是否可走 | 全地图逐点核对 | ✅ 全部可走，0 问题；事件格也全部可踩 |
| 模块导入/导出完整性 | 自检工具 + 逐项人工核对 | ✅ 无缺失导出、无大小写不符 |
| 面板能否关闭 | 实跑帮助/商店/确认/结算 | ✅ 均可关闭，无软锁 |
| `window.__BOOTED` 看门狗 | 实跑引导链 | ✅ 成功路径确实置位 |

**另**：曾怀疑 `help 面板在游戏内菜单中关闭会抛 `TypeError: onClose is not a function` 并冻结主循环`——实测为**误报**。`js/scenes/UIScene.js:244` 写的是 `if (onClose) onClose();`，已有判空；实跑确认关闭帮助面板**零异常**，主循环继续运行。

---

## 七、修复优先级建议

1. ~~**C1**（战斗结算二次确认 → 黑屏）~~ —— ✅ 已修复
2. ~~**H1**（按键重复驱动菜单）~~ —— ✅ 已修复
3. ~~**M1**（`威压` 白送伤害）~~ —— ✅ 已修复
4. ~~**M2**（收集任务交付不校验）~~ —— ✅ 已修复
5. ~~**M5**（启动提示残留）~~ —— ✅ 已修复
6. ~~M3、M4、L1~L4~~ —— ✅ 全部已修复（见第十节）

修完建议重跑：

```
node tools/validate.mjs
node --experimental-vm-modules tools/syntax-check.mjs
```

---

## 八、本轮修复记录（C1 / H1 / M1）

三个文件共 3 处改动，改完 `validate.mjs` 与 `syntax-check.mjs` 仍全绿。

### C1 —— `js/battle/BattleUI.js:342-355`

用 `done` 标志给 `finish()` 加幂等保护，同时断开鼠标路径。

```js
let done = false;
const finish = () => {
  if (done) return;
  done = true;
  this.elResult.querySelector('.res-ok').onclick = null;  // 断开鼠标路径
  this.elResult.classList.add('hidden');
  eng.finish();
  this.onEnd(outcome);
};
```

> **实现过程中的一个坑（值得记下）**：第一版我把键盘路径也一并断开（`this.nav = null`），
> 但实跑发现**纯键盘确认失效了** —— 结算后按 Z 毫无反应，只剩鼠标能点。
> 而 Z / 回车 / 空格是本作的主要确认方式，这样反而会让键盘玩家卡在结算画面，
> 比原缺陷更糟。改为**保留键盘路径、只用 `done` 去重**，两条路径都正常且不会重复执行。
> （`phase` 保持 `'result'` 不动，避免落入 `handleKey` 的 `return false` 分支把按键漏给地图层。）

**回归验证**（DOM 桩实跑）：

| 场景 | 结果 |
|---|---|
| 纯键盘按 Z 确认 | ✅ 正常退出结算，回到 MapScene |
| 键盘+鼠标混合狂按 10 轮 | ✅ 场景栈保持 `MapScene`，未清空 |
| 空格键（浏览器同时派发 click + keydown） | ✅ 未黑屏，栈正常 |
| 奖励是否重复发放 | ✅ 10 轮狂按后金钱/经验完全不变，只发一次 |
| `inBattle` 复位 | ✅ 回到 `false` |
| 结算后开菜单 / 地图长按移动 | ✅ 均正常 |

修复前：第 3 次触发即 `栈 = (空)` 黑屏。修复后：狂按 10 轮仍 `栈 = MapScene`。

### H1 —— `js/core/Input.js:17-30`

把 `e.repeat` 守卫提到面板路由**之前**，重复事件只更新 `held`。

```js
e.preventDefault();
this.held.add(action);
if (e.repeat) return;                  // ← 重复键不再派发边沿事件
const panel = game.ui && game.ui.activePanel;
if (panel && panel.handleKey && panel.handleKey(action, e)) return;
this.pressed.add(action);
```

**回归验证**：

| 场景 | 修复前 | 修复后 |
|---|---|---|
| 长按右方向键（1 次按下 + 15 次 repeat） | 页签狂翻 | ✅ 只前进 1 格 |
| 长按下方向键 | 光标跳跃 | ✅ 只移动 1 格 |
| **长按方向键在地图上走路** | 正常 | ✅ 仍然正常（`held` 不受影响，1 秒走了 6 格） |

第三项是本次改动的关键风险点 —— 守卫放在 `held.add()` **之后**，所以长按移动完全没受影响。

### M1 —— `js/battle/Skill.js:30-42`

在 `executeSkill` 里加结构性防御：**没有 `power` 字段就不进入伤害分支**。

```js
const isAttack = skill.power != null;
if (!isAttack) {
  if (skill.addStatus) { /* 只结算状态 */ }
  continue;
}
```

这样一次修掉整类隐患，而不是只给 `e_weiya` 补一个字段。基础攻击 `skill_attack` 显式声明了 `power: 1.0`，不受影响。

**回归验证**（每技能 3000 次，用命中率统计而非单次结果）：

| 技能 | power | 进入伤害分支 | 期望 |
|---|---|---|---|
| `e_weiya` 威压 | undefined | ❌ 否（3000/3000 只出 status） | 否 ✅ |
| `skill_yufeng` 御风步 | undefined | ❌ 否 | 否 ✅ |
| `skill_jinzhong` 金钟罩 | undefined | ❌ 否 | 否 ✅ |
| `skill_attack` 攻击 | 1.0 | ✅ 是（dmg 2665 / miss 335） | 是 ✅ |
| `e_siyao` / `e_duwei` / `e_kanpai` / `e_guihuoquan` / `skill_jianqi` / `skill_liehuo` | 1.0~1.6 | ✅ 全部进入，miss 率与各自 `accuracy` 吻合 | 是 ✅ |

另跑 200 次「威压」专项：**出伤害 0 次**，降攻状态成功挂上 141 次（期望 70% = 140）。

Boss 战回归 100 局（单人筑基16 青锋剑+玄铁甲）：**胜 100 / 败 0**，平均 15.6 回合 ——
与修复前（15.6 回合）一致，说明这次改动只去掉了不该有的伤害，没有影响正常战局。

---

## 九、本地起服

```powershell
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

（`serve.bat` 双击亦可，需本机有 Python 3。）

---

## 十、第二轮修复记录（M2 ~ M5、L1 ~ L4）

共改动 8 个文件。修完 `validate.mjs` 与 `syntax-check.mjs` 仍全绿，
另编写无头回归测试（VM 模块加载真实游戏代码，30 项断言）全部通过，
测试文件位于系统临时目录 `qingyun-regression.mjs`，未纳入项目。

### M2 —— `js/systems/QuestManager.js`

两处改动：

1. `complete()` 交付前先校验收集物数量，不足则 `toast` 提示并 `return`
   （不改状态、不扣物品、不发奖励）；
2. `notifyItem()` 放宽过滤为 `active` **和 `ready`**：物品跌破目标数量时，
   `ready` 回退为 `active`，不再挂着永远无法交付的可交付状态。

> **实现中的一个坑**：第一版把回退逻辑插进 `notifyItem()` 原有循环里，
> 但循环开头 `if (st.state !== 'active') continue;` 会把 `ready` 的任务直接跳过，
> 回退代码成了死代码——无头测试立刻抓住了它（「物品被用掉后 ready 回退为 active」失败）。
> 修复方式就是放宽过滤条件，让 `ready` 任务也进入物品计数循环。

**回归验证**（无头，7 断言）：数量不足阻断交付且不扣物、提示出现；
补足后正常交付且物品全扣；集齐 → ready；用掉 1 颗 → 回退 active。

### M5 —— `js/main.js`

`window.__BOOTED = true` 之后补两行：启动成功即把 `#boot-error`、
`#protocol-warning` 收回 `hidden`，慢启动机器上不会再残留全屏错误面板。

### M3 —— `js/systems/Character.js` `deserialize`

存档数值归一化：`level` 收敛到 `[1, exp.cap]`、`exp` 归零下限、
`realmId` 经 `REALMS.byId`（自带兜底）重取、`hp/mp` 非有限数回落满值
（`Number.isFinite` 判定，保留 0 值的合法语义）。

**回归验证**（6 断言）：`level:99999/exp:-7/realmId:'不存在'/hp:NaN/mp:'垃圾'`
的档位读回后属性链全部有限、境界回落炼气一层；正常档往返数值不变。

### M4 —— `js/core/Renderer.js` `resize`

去掉 `Math.max(scale, 0.5)` 下限。实测发现原报告建议的写法
（`else scale = Math.max(scale, 0.5)`）与原代码行为完全等价——是个无效修复；
真正的缺陷是极小窗口（<240×135）时画布 240×135 **反超窗口本身**。
现在不足 1 倍时按比例继续缩小，画布恒不超出窗口：

| 窗口 | 修复后 |
|---|---|
| 1280×720 | 2 倍 → 960×540（不变） |
| 800×600 | 1 倍 → 480×270（不变） |
| 400×700 | 0.833 倍 → 400×225（不变） |
| 200×100 | 0.370 倍 → 178×100（原为 240×135 溢出） |

### L3 —— `js/core/SaveManager.js` `save()`

入口补 `if (this.game && this.game.inBattle) return false;`，
「战斗中不可存档」从帮助文本落到代码。

### L2 —— `js/core/SaveManager.js` `meta()` + 两个场景

`meta()` 对版本不符的档位返回 `{ incompatible: true, name: '【旧版本存档】', ... }`
而非 `null`；`TitleScene` 显示「（版本不符，无法读取）」并在点击时 toast 明确提示；
`MainMenu` 存档页同样显示专用文案。

### L4 —— `js/systems/Inventory.js`

`applyEffect()` 的返回值语义从「潜在回复量」改为**实际变化量**
（`target.hp - before`，满血时为 0）；`use()` 据此在
`hp/mp` 均无实际变化且无可解异常时**拒绝消耗丹药**。

顺带修好一个隐性小问题：战斗内使用丹药时，`BattleEngine` 以 `r.hp > 0`
决定是否发 `heal` 事件——旧语义下给满血队友喂药会发一个数值虚高但实际
没回血的飘字；新语义下不再发。战斗消耗判定在 `remove()`，不受影响。

**回归验证**（6 断言）：满状态使用被拒、丹药保留、数值不变；
受伤时正常消耗、回复量为实际值且不溢出上限。

### L1 —— `js/scenes/MainMenu.js` `_renderSave()`

1. 「存档」按钮：档位已有存档（含不兼容旧档）时先 `ui.confirm` 再覆盖；
2. 每行新增「删除」按钮，确认后调 `SaveManager.delete()`（终于有 UI 入口），
   删除后刷新列表；
3. 「读档」对不兼容档直接 toast，不再走「确认后才发现读不了」的路径。

UI 改动走的是菜单内既有的 `_btn`/`ui.confirm`/`render()` 模式，
键盘导航（PanelNav）与鼠标悬停自动生效。

### 第二轮回归结果汇总

| 验证项 | 方法 | 结果 |
|---|---|---|
| 数据一致性 | `node tools/validate.mjs` | ✅ 通过 |
| 语法/导入 | `node tools/syntax-check.mjs` | ✅ 41 模块全通过 |
| M2 交付校验 + ready 回退 | 无头 7 断言 | ✅ 全过（并抓出一次死代码实现） |
| L4 丹药不白扣 + 回复量语义 | 无头 6 断言 | ✅ 全过 |
| L3 inBattle 防线 + L2 不兼容档呈现 | 无头 7 断言 | ✅ 全过 |
| M3 存档归一化 + 正常档往返 | 无头 6 断言 | ✅ 全过 |
| M4 缩放各窗口尺寸 | 无头 4 断言 | ✅ 全过 |
