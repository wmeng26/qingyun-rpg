// 浏览器冒烟测试：加载游戏 → 进图 → 开菜单 → 逐页签点选 → 淬炼面板，收集控制台错误
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/A/AppData/Local/npm-cache/_npx/423231821c231c73/node_modules/');
const { chromium } = require('playwright-core');

const URL = 'http://127.0.0.1:8099/index.html';
const errors = [];

// 本机已装的 Chromium 版本号与 playwright-core 期望的不一致，直接指定可执行文件
const EXE = 'C:/Users/A/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(1500);
const booted = await page.evaluate(() => !!(window.game && window.game.scenes));
console.log('booted:', booted, '| scene:', await page.evaluate(() => window.game && window.game.scenes ? window.game.scenes.top?.constructor?.name : 'n/a'));
await page.screenshot({ path: '.playwright-cli/smoke-1-title.png' });

// 直接开新档并跳过序章对话，进入地图
await page.evaluate(() => {
  window.game.newGame();
  if (window.game.dialog && window.game.dialog.active) window.game.dialog.close();
});
await page.waitForTimeout(1200);
const mapId = await page.evaluate(() => window.game.mapId);
const partyLen = await page.evaluate(() => window.game.party.length);
console.log('map:', mapId, '| party:', partyLen);
await page.screenshot({ path: '.playwright-cli/smoke-2-map.png' });

// HUD 两次 tick 后检查是否生成卡片
await page.waitForTimeout(700);
const hud = await page.evaluate(() => {
  const el = document.getElementById('hud');
  return { cards: el ? el.querySelectorAll('.hud-card').length : -1, html: el ? el.innerHTML.length : 0 };
});
console.log('hud cards:', hud.cards);

// 打开主菜单，检查六个页签
await page.evaluate(() => window.game.ui.openMenu());
await page.waitForTimeout(300);
const tabs = await page.evaluate(() => [...document.querySelectorAll('#menu-tabs .tab')].map(t => t.textContent));
console.log('tabs:', tabs.join('/'));
await page.screenshot({ path: '.playwright-cli/smoke-3-menu-char.png' });

// 逐页签点击
for (const name of ['背包', '任务', '图鉴', '存档', '系统', '角色']) {
  await page.click(`#menu-tabs .tab:text-is("${name}")`);
  await page.waitForTimeout(200);
  const h = await page.evaluate(() => document.getElementById('menu-content').innerHTML.length);
  console.log(`tab ${name} content len:`, h);
}

// 淬炼面板（角色页）
const forgeBtn = page.locator('#menu-content button', { hasText: '淬炼装备' }).first();
if (await forgeBtn.count()) {
  await forgeBtn.click();
  await page.waitForTimeout(250);
  const forgeTitle = await page.evaluate(() => {
    const t = [...document.querySelectorAll('#menu-body .sec-title')].map(e => e.textContent);
    return t.join(' | ');
  });
  console.log('forge panel:', forgeTitle);
  await page.screenshot({ path: '.playwright-cli/smoke-4-forge.png' });
} else {
  console.log('forge button missing!');
}

// 心魔试炼按钮存在性（等级不足时不应出现，仅记录）
const trial = await page.locator('#menu-content button', { hasText: '心魔试炼' }).count();
console.log('trial buttons:', trial);

// 关闭菜单，检查 HUD 恢复正常
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
await page.evaluate(() => window.game.ui.menu.close());
await page.waitForTimeout(400);
const hudAfter = await page.evaluate(() => document.querySelectorAll('#hud .hud-card').length);
console.log('hud after menu:', hudAfter, '| gold text:', await page.evaluate(() => (document.querySelector('#hud-gold') || {}).textContent));

console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
await browser.close();
