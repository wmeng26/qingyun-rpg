// 轻量事件总线：systems 之间只经 EventBus / Game 服务定位通信
export default class EventBus {
  constructor() { this._map = new Map(); }

  on(evt, fn) {
    if (!this._map.has(evt)) this._map.set(evt, []);
    this._map.get(evt).push(fn);
    return () => this.off(evt, fn);
  }

  off(evt, fn) {
    const arr = this._map.get(evt);
    if (!arr) return;
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  }

  emit(evt, payload) {
    const arr = this._map.get(evt);
    if (!arr) return;
    for (const fn of [...arr]) fn(payload);
  }
}
