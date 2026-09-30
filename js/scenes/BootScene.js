// 引导场景：生成占位美术后短暂过渡到标题
import TitleScene from './TitleScene.js';

export default class BootScene {
  enter() { this.t = 0; }
  update(dt) {
    this.t += dt;
    if (this.t > 0.45) {
      this.game.scenes.replace(new TitleScene());
    }
  }
  render(ctx) {
    const bg = this.game.assets.get('bg_title');
    if (bg) ctx.drawImage(bg, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, 480, 270);
    ctx.fillStyle = '#e8dcc0';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('天 地 初 开 · 灵 气 初 显 ……', 240, 140);
    ctx.textAlign = 'left';
  }
}
