// 资源管理：key -> canvas/Image。
// 当前版本全部由 PlaceholderArt 程序化生成；未来替换 AI 素材时，
// 在 manifest 里加 { key: 'assets/images/xxx.png' } 即可自动加载覆盖。
import PlaceholderArt from './PlaceholderArt.js';

export default class Assets {
  constructor() {
    this.map = new Map();
  }

  put(key, canvasOrImg) { this.map.set(key, canvasOrImg); }
  has(key) { return this.map.has(key); }

  get(key) {
    const v = this.map.get(key);
    if (!v) console.warn('[Assets] 缺少资源:', key);
    return v;
  }

  // 程序化占位美术（同步生成，无需网络）
  buildPlaceholders() {
    PlaceholderArt.build(this);
  }

  // 预留：加载真实素材覆盖占位图（替换素材 = 丢 PNG + 改 manifest 一行）
  async loadManifest(manifest = {}) {
    const jobs = Object.entries(manifest).map(([key, path]) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.put(key, img); resolve(); };
      img.onerror = () => { console.warn('[Assets] 素材加载失败，保留占位图:', key, path); resolve(); };
      img.src = path;
    }));
    await Promise.all(jobs);
  }
}
