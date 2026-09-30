// 入口：组装 Game + UI + 场景工厂，启动主循环
import Game from './core/Game.js';
import TouchControls from './core/TouchControls.js';
import UIScene from './scenes/UIScene.js';
import BootScene from './scenes/BootScene.js';
import MapScene from './scenes/MapScene.js';
import BattleScene from './scenes/BattleScene.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

// 调试/测试入口（控制台可用 window.game）
window.game = game;

// UI 总管
game.ui = new UIScene(game);
game.ui.init();

// 触屏虚拟按键（非触屏设备不显示）
if (game.input.touch) game.touch = new TouchControls(game);

// 占位美术（程序化生成）
game.assets.buildPlaceholders();

// 场景工厂（Game 不直接依赖 scenes 模块）
game.makeMapScene = (mapId, x, y, dir) => new MapScene(game, mapId, x, y, dir);
game.makeBattleScene = (cfg) => new BattleScene(cfg);

// 引导场景 → 标题
game.scenes.push(new BootScene());

window.__BOOTED = true;
// 看门狗可能在慢启动（低端机/冷启动超 3 秒）时已亮出错误面板，启动成功后收掉
for (const id of ['boot-error', 'protocol-warning']) {
  document.getElementById(id)?.classList.add('hidden');
}
game.start();
