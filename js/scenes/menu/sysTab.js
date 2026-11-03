// 页签：系统（音量 / 帮助 / 返回标题）
import { sfx } from '../../core/Audio.js';
import TitleScene from '../TitleScene.js';

export function renderSys(menu) {
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;flex-direction:column;gap:8px;max-width:260px;margin:10px auto;';
  // 音量档位（关/低/中/高），独立于存档持久化在 localStorage
  box.appendChild(menu._btn(`音乐音量：${sfx.musicVolName()}`, () => { sfx.cycleMusicVol(); sfx.play('confirm'); menu.render(); }));
  box.appendChild(menu._btn(`音效音量：${sfx.sfxVolName()}`, () => { sfx.cycleSfxVol(); sfx.play('confirm'); menu.render(); }));
  const b1 = menu._btn('操作说明', () => menu.game.ui.openHelp());
  const b2 = menu._btn('返回标题画面', () => {
    menu.game.ui.confirm('返回标题？（未存档的进度将丢失）', () => {
      menu.close();
      menu.game.scenes.replace(new TitleScene());
    });
  });
  const b3 = menu._btn('关闭菜单', () => menu.close());
  box.appendChild(b1); box.appendChild(b2); box.appendChild(b3);
  menu.elContent.appendChild(box);
  menu.nav.setItems(menu.nav.items);
}
