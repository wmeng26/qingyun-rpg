// 程序化音频（WebAudio）：全部音效与 BGM 代码合成，零素材文件——与 PlaceholderArt 同一思路。
// 浏览器自动播放策略：首次用户手势（keydown/pointerdown/touchstart）unlock 后出声，
// 之前 music() 只记住意图，解锁后自动起播。
// 无 AudioContext 环境（无头测试等）所有 API 安全降级为 no-op，可在 Node 中 import。

const STORE_KEY = 'qingyun.audio.v1';
const VOL_LEVELS = [0, 0.35, 0.65, 1];
const VOL_NAMES = ['关', '低', '中', '高'];

// midi 音号 → 频率
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ================= 曲库 =================
// 全部使用五声音阶（宫调式 C D E G A / 羽调式 A C D E G），中式武侠风味且不刺耳。
// track: { wave, vol, attack?, release?, notes: [[起始拍, midi, 时值拍], ...] }
// drums: [[起始拍, 'kick'|'snare'|'hat'], ...]
// （导出供 validate.mjs / regression.mjs 做曲库完整性校验）
export const SONGS = {
  // 标题：A 羽调式，空灵悠远
  title: {
    bpm: 63, loopBeats: 16,
    tracks: [
      { wave: 'sine', vol: 0.42, attack: 0.08, release: 0.5, notes: [
        [0, 69, 3], [3, 72, 1], [4, 74, 2], [6, 76, 2],
        [8, 74, 1], [9, 72, 1], [10, 69, 3.5], [14, 67, 2],
      ] },
      { wave: 'sine', vol: 0.36, attack: 0.05, release: 0.6, notes: [
        [0, 45, 7.5], [8, 48, 3.5], [12, 43, 4],
      ] },
      { wave: 'triangle', vol: 0.1, attack: 0.4, release: 0.8, notes: [
        [0, 57, 8], [8, 60, 4], [12, 55, 4],
      ] },
    ],
  },

  // 地图：C 宫调式，轻快明亮
  map: {
    bpm: 88, loopBeats: 16,
    tracks: [
      { wave: 'triangle', vol: 0.34, attack: 0.01, release: 0.1, notes: [
        [0, 76, 0.5], [0.5, 79, 0.5], [1, 81, 1.5], [2.5, 79, 0.5], [3, 76, 1],
        [4, 74, 0.5], [4.5, 76, 0.5], [5, 79, 1.5], [6.5, 76, 0.5], [7, 74, 1],
        [8, 72, 0.5], [8.5, 74, 0.5], [9, 76, 1], [10, 72, 0.5], [10.5, 69, 0.5], [11, 72, 1],
        [12, 67, 1], [13, 69, 1], [14, 72, 2],
      ] },
      { wave: 'sine', vol: 0.34, attack: 0.02, release: 0.15, notes: [
        [0, 48, 2], [2, 43, 2], [4, 45, 2], [6, 43, 2],
        [8, 48, 2], [10, 50, 2], [12, 43, 2], [14, 48, 2],
      ] },
      { wave: 'square', vol: 0.05, attack: 0.01, release: 0.05, notes: (() => {
        const a = [];
        for (let b = 0; b < 16; b += 0.5) a.push([b, [64, 67, 72, 67][(b * 2) % 4], 0.22]);
        return a;
      })() },
    ],
  },

  // 洞窟/魔渊：A 羽调式低音持续，幽暗稀疏
  cave: {
    bpm: 58, loopBeats: 16,
    tracks: [
      { wave: 'sine', vol: 0.34, attack: 0.3, release: 0.8, notes: [
        [2, 69, 2], [5.5, 67, 1.5], [9, 72, 2.5], [13, 64, 2.5],
      ] },
      { wave: 'sine', vol: 0.3, attack: 0.5, release: 1, notes: [[0, 33, 15]] },
      { wave: 'triangle', vol: 0.09, attack: 0.5, release: 1, notes: [[0, 57, 16]] },
    ],
  },

  // 冰原：C 宫高音区，清冷闪烁
  ice: {
    bpm: 72, loopBeats: 16,
    tracks: [
      { wave: 'sine', vol: 0.3, attack: 0.06, release: 0.4, notes: [
        [0, 79, 2], [2, 76, 1], [3, 72, 1], [4, 74, 2], [6, 76, 2],
        [8, 79, 1.5], [9.5, 76, 0.5], [10, 72, 2], [12, 74, 1.5], [13.5, 72, 0.5], [14, 69, 2],
      ] },
      { wave: 'triangle', vol: 0.12, attack: 0.3, release: 0.8, notes: [
        [0, 72, 4], [4, 67, 4], [8, 72, 4], [12, 67, 4],
      ] },
      { wave: 'sine', vol: 0.3, attack: 0.1, release: 0.5, notes: [[0, 36, 7.5], [8, 43, 7.5]] },
    ],
  },

  // 普通战斗：A 羽调式，急促推进
  battle: {
    bpm: 118, loopBeats: 16,
    tracks: [
      { wave: 'square', vol: 0.11, attack: 0.005, release: 0.04, notes: [
        [0, 69, 0.5], [0.5, 69, 0.25], [0.75, 72, 0.25], [1, 74, 1], [2, 72, 0.5], [2.5, 69, 0.5], [3, 67, 1],
        [4, 72, 0.5], [4.5, 72, 0.25], [4.75, 74, 0.25], [5, 76, 1], [6, 74, 0.5], [6.5, 72, 0.5], [7, 69, 1],
        [8, 67, 0.5], [8.5, 67, 0.25], [8.75, 69, 0.25], [9, 72, 1], [10, 74, 0.5], [10.5, 76, 0.5], [11, 79, 1],
        [12, 76, 0.5], [12.5, 74, 0.5], [13, 72, 0.5], [13.5, 74, 0.5], [14, 76, 1], [15, 69, 1],
      ] },
      { wave: 'triangle', vol: 0.26, attack: 0.005, release: 0.05, notes: (() => {
        const roots = [45, 45, 43, 43, 45, 45, 48, 48, 45, 45, 43, 43, 40, 40, 43, 43];
        const a = [];
        for (let b = 0; b < 16; b++) a.push([b, roots[b], 0.4]);
        return a;
      })() },
    ],
    drums: (() => {
      const d = [[0, 'kick'], [2, 'snare'], [4, 'kick'], [6, 'snare'],
        [8, 'kick'], [10, 'snare'], [12, 'kick'], [14, 'snare']];
      for (let b = 0; b < 16; b += 0.5) d.push([b, 'hat']);
      return d;
    })(),
  },

  // Boss 战：A 羽调式低音区，沉重压迫
  boss: {
    bpm: 140, loopBeats: 16,
    tracks: [
      { wave: 'square', vol: 0.12, attack: 0.005, release: 0.04, notes: [
        [0, 57, 0.5], [0.5, 57, 0.5], [1, 60, 0.5], [1.5, 62, 0.5], [2, 64, 1],
        [3, 62, 0.5], [3.5, 60, 0.5], [4, 57, 1.5], [6, 60, 0.5], [6.5, 62, 0.5], [7, 64, 1],
        [8, 67, 0.5], [8.5, 67, 0.5], [9, 69, 0.5], [9.5, 67, 0.5], [10, 64, 1],
        [11, 62, 0.5], [11.5, 60, 0.5], [12, 62, 1], [13, 64, 0.5], [13.5, 62, 0.5],
        [14, 60, 1], [15, 57, 0.5], [15.5, 60, 0.5],
      ] },
      { wave: 'triangle', vol: 0.28, attack: 0.005, release: 0.04, notes: (() => {
        const roots = [33, 33, 31, 31, 36, 36, 33, 33, 33, 33, 31, 31, 40, 40, 31, 31];
        const a = [];
        for (let b = 0; b < 16; b += 0.5) a.push([b, roots[b | 0], 0.2]);
        return a;
      })() },
    ],
    drums: (() => {
      const d = [[0, 'kick'], [1.5, 'kick'], [2, 'snare'], [4, 'kick'], [5.5, 'kick'], [6, 'snare'],
        [8, 'kick'], [9.5, 'kick'], [10, 'snare'], [12, 'kick'], [13.5, 'kick'], [14, 'snare']];
      for (let b = 0; b < 16; b += 0.5) d.push([b, 'hat']);
      return d;
    })(),
  },

  // 章节结算：C 宫调式，庄重温暖
  chapter: {
    bpm: 76, loopBeats: 16,
    tracks: [
      { wave: 'triangle', vol: 0.34, attack: 0.03, release: 0.25, notes: [
        [0, 72, 1.5], [1.5, 76, 0.5], [2, 79, 2], [4, 81, 1.5], [5.5, 79, 0.5], [6, 76, 2],
        [8, 74, 1.5], [9.5, 76, 0.5], [10, 79, 2], [12, 76, 1.5], [13.5, 72, 0.5], [14, 74, 2],
      ] },
      { wave: 'sine', vol: 0.3, attack: 0.04, release: 0.3, notes: [
        [0, 48, 4], [4, 45, 4], [8, 50, 4], [12, 43, 4],
      ] },
      { wave: 'sine', vol: 0.1, attack: 0.3, release: 0.6, notes: [[0, 64, 8], [8, 62, 8]] },
    ],
  },

  // 终章/大结局：C 宫调式，舒缓悠长
  ending: {
    bpm: 72, loopBeats: 24,
    tracks: [
      { wave: 'sine', vol: 0.36, attack: 0.05, release: 0.35, notes: [
        [0, 76, 1], [1, 79, 1], [2, 81, 2], [4, 79, 1], [5, 76, 1], [6, 74, 2],
        [8, 76, 1], [9, 79, 1], [10, 81, 1], [11, 84, 1], [12, 81, 2], [14, 79, 1], [15, 76, 2],
        [17, 74, 1], [18, 76, 1], [19, 72, 2], [21, 69, 1], [22, 67, 1], [23, 72, 1],
      ] },
      { wave: 'triangle', vol: 0.12, attack: 0.01, release: 0.1, notes: (() => {
        const a = [];
        for (let b = 0; b < 24; b += 0.5) a.push([b, [60, 64, 67, 72][(b * 2) % 4], 0.22]);
        return a;
      })() },
      { wave: 'sine', vol: 0.32, attack: 0.05, release: 0.4, notes: [
        [0, 36, 4], [4, 43, 4], [8, 45, 4], [12, 40, 4], [16, 43, 4], [20, 48, 4],
      ] },
    ],
  },
};

// ================= 音效 =================
// 每个音效是接收引擎的小函数，用 tone()/noise() 基元组合；when 为相对当前时刻的秒数。
const SFX = {
  cursor(e) { e.tone({ freq: 900, freqEnd: 640, dur: 0.06, wave: 'square', vol: 0.1 }); },
  confirm(e) {
    e.tone({ freq: 660, dur: 0.07, wave: 'sine', vol: 0.22 });
    e.tone({ freq: 990, dur: 0.09, when: 0.06, wave: 'sine', vol: 0.22 });
  },
  cancel(e) { e.tone({ freq: 440, freqEnd: 290, dur: 0.12, wave: 'sine', vol: 0.22 }); },
  advance(e) { e.tone({ freq: 520, dur: 0.05, wave: 'sine', vol: 0.14 }); },
  text(e) { e.tone({ freq: 1150, dur: 0.025, wave: 'square', vol: 0.05 }); },

  attack(e) {
    e.noise({ dur: 0.1, vol: 0.3, type: 'lowpass', freq: 1200 });
    e.tone({ freq: 180, freqEnd: 70, dur: 0.12, wave: 'square', vol: 0.22 });
  },
  crit(e) {
    e.noise({ dur: 0.12, vol: 0.36, type: 'lowpass', freq: 1600 });
    e.tone({ freq: 240, freqEnd: 60, dur: 0.14, wave: 'square', vol: 0.26 });
    e.tone({ freq: 1250, dur: 0.12, when: 0.02, wave: 'square', vol: 0.16 });
  },
  miss(e) { e.noise({ dur: 0.14, vol: 0.16, type: 'highpass', freq: 2500 }); },
  skill(e) {
    [523, 659, 784].forEach((f, i) =>
      e.tone({ freq: f, dur: 0.08, when: i * 0.055, wave: 'sine', vol: 0.2 }));
  },
  heal(e) {
    e.tone({ freq: 523, freqEnd: 784, dur: 0.28, wave: 'sine', vol: 0.24 });
    e.tone({ freq: 1046, dur: 0.2, when: 0.08, wave: 'sine', vol: 0.1 });
  },
  mpheal(e) { e.tone({ freq: 659, freqEnd: 880, dur: 0.18, wave: 'sine', vol: 0.16 }); },
  buff(e) { e.tone({ freq: 392, freqEnd: 523, dur: 0.16, wave: 'triangle', vol: 0.24 }); },
  debuff(e) { e.tone({ freq: 392, freqEnd: 262, dur: 0.2, wave: 'triangle', vol: 0.24 }); },
  resist(e) { e.tone({ freq: 220, dur: 0.08, wave: 'sine', vol: 0.15 }); },
  dot(e) { e.noise({ dur: 0.08, vol: 0.14, type: 'lowpass', freq: 500 }); },
  die(e) { e.tone({ freq: 300, freqEnd: 55, dur: 0.45, wave: 'square', vol: 0.2 }); },

  levelup(e) {
    [523, 659, 784, 1046].forEach((f, i) =>
      e.tone({ freq: f, dur: i === 3 ? 0.24 : 0.1, when: i * 0.09, wave: 'triangle', vol: 0.28 }));
  },
  breakthrough(e) {
    e.tone({ freq: 880, dur: 1.1, wave: 'sine', vol: 0.3, release: 0.9 });
    e.tone({ freq: 1318, dur: 0.9, wave: 'sine', vol: 0.12, release: 0.8 });
    [660, 784, 880, 1046].forEach((f, i) =>
      e.tone({ freq: f, dur: 0.12, when: 0.1 + i * 0.1, wave: 'triangle', vol: 0.2 }));
  },
  quest(e) {
    e.tone({ freq: 784, dur: 0.1, wave: 'triangle', vol: 0.25 });
    e.tone({ freq: 1046, dur: 0.16, when: 0.09, wave: 'triangle', vol: 0.25 });
  },
  item(e) { e.tone({ freq: 1175, dur: 0.09, wave: 'triangle', vol: 0.2 }); },
  gold(e) {
    e.tone({ freq: 1319, dur: 0.05, wave: 'square', vol: 0.14 });
    e.tone({ freq: 1760, dur: 0.09, when: 0.05, wave: 'square', vol: 0.14 });
  },
  ally(e) {
    [587, 659, 784].forEach((f, i) =>
      e.tone({ freq: f, dur: 0.1, when: i * 0.08, wave: 'triangle', vol: 0.26 }));
  },
  chest(e) {
    e.noise({ dur: 0.12, vol: 0.15, type: 'lowpass', freq: 800 });
    [523, 659, 784].forEach((f, i) =>
      e.tone({ freq: f, dur: 0.09, when: 0.08 + i * 0.07, wave: 'triangle', vol: 0.22 }));
  },
  encounter(e) {
    e.tone({ freq: 233, dur: 0.09, wave: 'square', vol: 0.3 });
    e.tone({ freq: 196, dur: 0.14, when: 0.1, wave: 'square', vol: 0.3 });
  },
  teleport(e) { e.tone({ freq: 300, freqEnd: 1400, dur: 0.4, wave: 'sine', vol: 0.2 }); },
  flee(e) {
    e.noise({ dur: 0.3, vol: 0.16, type: 'highpass', freq: 1200 });
    e.tone({ freq: 220, freqEnd: 660, dur: 0.28, wave: 'sine', vol: 0.18 });
  },

  victory(e) {
    const seq = [[0, 523, 0.14], [0.14, 659, 0.14], [0.28, 784, 0.14], [0.42, 1046, 0.3],
      [0.8, 784, 0.14], [0.94, 1046, 0.45]];
    for (const [t, f, d] of seq) {
      e.tone({ freq: f, dur: d, when: t, wave: 'triangle', vol: 0.3 });
      if (d > 0.2) e.tone({ freq: f / 2, dur: d, when: t, wave: 'square', vol: 0.07 });
    }
  },
  defeat(e) {
    [[0, 220, 0.45], [0.5, 185, 0.45], [1, 147, 0.9]].forEach(([t, f, d]) =>
      e.tone({ freq: f, dur: d, when: t, wave: 'sine', vol: 0.28, release: d * 0.6 }));
  },
};

// ================= BGM 音序器 =================
// 标准 lookahead 调度：interval 扫描 + 提前排入 AudioContext 时钟，循环无缝。
class MusicPlayer {
  constructor(engine) {
    this.eng = engine;
    this.songId = null;
    this._timer = null;
    this._playing = false;
  }

  music(id) {
    if (this.songId === id) return;
    this.stop();
    this.songId = id; // 含未解锁时的意图记录，解锁后 onCtxReady 起播
    this._start();
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._playing = false;
  }

  onCtxReady() { if (this.songId && SONGS[this.songId]) this._start(); }

  _start() {
    this._playing = false;
    const ctx = this.eng.ctx;
    const song = SONGS[this.songId];
    if (!ctx || !song) return;
    this.song = song;
    this.spb = 60 / song.bpm;
    this.loopDur = song.loopBeats * this.spb;
    this.t0 = ctx.currentTime + 0.06;
    this.loopN = 0;
    this._playing = true;
    this._schedule();
    this._timer = setInterval(() => this._schedule(), 50);
  }

  _schedule() {
    if (!this._playing || !this.eng.ctx) return;
    const horizon = this.eng.ctx.currentTime + 0.2;
    while (this.t0 + this.loopN * this.loopDur < horizon) {
      this._scheduleLoop(this.t0 + this.loopN * this.loopDur);
      this.loopN++;
    }
  }

  _scheduleLoop(base) {
    const ctx = this.eng.ctx, spb = this.spb;
    for (const tr of this.song.tracks) {
      for (const [b, m, d] of tr.notes) {
        const t = base + b * spb;
        if (t < ctx.currentTime - 0.02) continue;
        this.eng.tone({
          freq: hz(m), dur: Math.max(0.06, d * spb * 0.94), wave: tr.wave, vol: tr.vol,
          when: t - ctx.currentTime, attack: tr.attack, release: tr.release, bus: 'music',
        });
      }
    }
    for (const [b, k] of this.song.drums || []) {
      const t = base + b * spb;
      if (t < ctx.currentTime - 0.02) continue;
      this.eng.drum(k, t - ctx.currentTime);
    }
  }
}

// ================= 引擎 =================
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.settings = { music: 2, sfx: 2 }; // 音量档位索引（0~3）
    this._loadSettings();
    this.musicPlayer = new MusicPlayer(this);
    this._noiseBuf = null;
  }

  // 首次用户手势调用；随后在后台持续兜底（iOS 锁屏后 ctx 可能再次 suspended）
  unlock() {
    if (!this.ctx) {
      const AC = typeof AudioContext === 'function' ? AudioContext
        : (typeof window !== 'undefined' && window.webkitAudioContext) || null;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      this._buildGraph();
      this._applyVolumes();
      this.musicPlayer.onCtxReady();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  _buildGraph() {
    const ctx = this.ctx;
    this.sfxBus = ctx.createGain();
    this.musicBus = ctx.createGain();
    const musicLp = ctx.createBiquadFilter(); // 音乐总线柔化，压低方波毛刺
    musicLp.type = 'lowpass';
    musicLp.frequency.value = 5200;
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor(); // 防多音叠加削波
    this.sfxBus.connect(this.master);
    this.musicBus.connect(musicLp);
    musicLp.connect(this.master);
    this.master.connect(comp);
    comp.connect(ctx.destination);
  }

  _bindGestures() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const unlock = () => this.unlock();
    for (const evt of ['pointerdown', 'touchstart', 'keydown']) {
      window.addEventListener(evt, unlock, { capture: true, passive: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend().catch(() => {});
      else this.ctx.resume().catch(() => {});
    });
  }

  // ===== 音量设置 =====
  _loadSettings() {
    try {
      if (typeof localStorage === 'undefined') return;
      const d = JSON.parse(localStorage.getItem(STORE_KEY));
      if (d && Number.isInteger(d.music)) this.settings.music = Math.max(0, Math.min(3, d.music));
      if (d && Number.isInteger(d.sfx)) this.settings.sfx = Math.max(0, Math.min(3, d.sfx));
    } catch (e) { /* 无存储/坏数据用默认档 */ }
  }

  _saveSettings() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORE_KEY, JSON.stringify(this.settings));
    } catch (e) { /* 存储不可用时静默 */ }
  }

  _cycleVol(key) {
    this.settings[key] = (this.settings[key] + 1) % VOL_LEVELS.length;
    this._applyVolumes();
    this._saveSettings();
    return this.settings[key];
  }

  _applyVolumes() {
    if (!this.ctx) return;
    this.musicBus.gain.value = VOL_LEVELS[this.settings.music] * 0.9;
    this.sfxBus.gain.value = VOL_LEVELS[this.settings.sfx];
  }

  // ===== 合成基元 =====
  tone({ freq, freqEnd, dur = 0.15, wave = 'sine', vol = 0.3, when = 0,
    attack = 0.005, release, pan = 0, bus = 'sfx' }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (when < -0.03) return;
    const t0 = ctx.currentTime + Math.max(0, when);
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(Math.max(1, freq), t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    const g = ctx.createGain();
    const rel = release != null ? release : Math.min(0.12, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(Math.max(0.0001, vol), t0 + attack);
    g.gain.setValueAtTime(Math.max(0.0001, vol), Math.max(t0 + attack, t0 + dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    this._route(g, pan, bus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  noise({ dur = 0.1, vol = 0.2, when = 0, type = 'lowpass', freq = 1000, pan = 0, bus = 'sfx' }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (when < -0.03) return;
    const t0 = ctx.currentTime + Math.max(0, when);
    const src = ctx.createBufferSource();
    if (!this._noiseBuf) {
      const buf = ctx.createBuffer(1, ctx.sampleRate | 0, ctx.sampleRate | 0);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this._noiseBuf = buf;
    }
    src.buffer = this._noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.0001, vol), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    this._route(g, pan, bus);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  drum(kind, when = 0) {
    if (kind === 'kick') {
      this.tone({ freq: 150, freqEnd: 48, dur: 0.13, wave: 'sine', vol: 0.5, when, bus: 'music' });
    } else if (kind === 'snare') {
      this.noise({ dur: 0.09, vol: 0.22, type: 'bandpass', freq: 1800, when, bus: 'music' });
      this.tone({ freq: 190, dur: 0.05, wave: 'triangle', vol: 0.15, when, bus: 'music' });
    } else if (kind === 'hat') {
      this.noise({ dur: 0.03, vol: 0.09, type: 'highpass', freq: 6500, when, bus: 'music' });
    }
  }

  _route(node, pan, bus) {
    let out = node;
    if (pan && this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      out.connect(p);
      out = p;
    }
    out.connect(bus === 'music' ? this.musicBus : this.sfxBus);
  }

  // ===== 对外播放 =====
  sfx(name) {
    const f = SFX[name];
    if (f && this.ctx) f(this);
  }

  music(id) { this.musicPlayer.music(id); }
}

// ================= 单例与服务门面 =================
// 模块级引擎指针：任何模块 import { sfx } 即用；引擎未初始化（无头测试）或
// AudioContext 不可用时全部 no-op，绝不抛错。
let engine = null;

export function initAudio() {
  if (!engine) {
    engine = new AudioEngine();
    engine._bindGestures();
  }
  return engine;
}

export const sfx = {
  play: (name) => engine && engine.sfx(name),
  music: (id) => engine && engine.music(id),
  musicVolName: () => (engine ? VOL_NAMES[engine.settings.music] : VOL_NAMES[2]),
  sfxVolName: () => (engine ? VOL_NAMES[engine.settings.sfx] : VOL_NAMES[2]),
  cycleMusicVol: () => (engine ? engine._cycleVol('music') : 2),
  cycleSfxVol: () => (engine ? engine._cycleVol('sfx') : 2),
};

// 测试/校验工具导出（validate.mjs 检查曲库数据完整性用）
export const SONG_NAMES = Object.keys(SONGS);
export const SFX_NAMES = Object.keys(SFX);
