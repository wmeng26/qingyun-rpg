// 场景栈：push/pop/replace，只有栈顶 update/render
export default class SceneManager {
  constructor(game) {
    this.game = game;
    this.stack = [];
  }

  top() { return this.stack[this.stack.length - 1] || null; }

  push(scene) {
    const prev = this.top();
    if (prev && prev.onPause) prev.onPause();
    scene.game = this.game;
    this.stack.push(scene);
    if (scene.enter) scene.enter();
  }

  pop() {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    const top = this.top();
    if (top && top.onResume) top.onResume();
    return s;
  }

  replace(scene) {
    this.pop();
    this.push(scene);
  }

  update(dt) {
    const top = this.top();
    if (top && top.update) top.update(dt);
  }

  render(ctx) {
    const top = this.top();
    if (top && top.render) top.render(ctx);
  }
}
