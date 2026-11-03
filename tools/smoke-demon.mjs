// 心魔试炼端到端冒烟：5 人队伍 + 金丹门槛 → 菜单开试炼 → 确定 → 进入镜像战
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/A/AppData/Local/npm-cache/_npx/423231821c231c73/node_modules/');
const { chromium } = require('playwright-core');

const EXE = 'C:/Users/A/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const errors = [];
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });

await page.goto('http://127.0.0.1:8099/index.html', { waitUntil: 'load' });
await page.waitForTimeout(1200);

// 造一个接近真实的档：全员筑基满级、楚红缨入队、备好筑基丹
await page.evaluate(() => {
  const g = window.game;
  g.newGame();
  if (g.dialog.active) g.dialog.close();
  for (const id of ['liu', 'luo', 'shen', 'chu']) g.joinParty(id);
  for (const c of g.party) {
    c.level = 16; c.realmId = 'lianqi_9'; c.syncSkills();
    c.equipment.weapon = c.def.wtype === 'spear' ? 'spear_huoying'
      : c.def.wtype === 'qin' ? 'qin_wutong'
        : c.def.wtype === 'brush' ? 'bi_qingzhu'
          : c.def.wtype === 'blade' ? 'dao_liuye' : 'sword_iron';
    c.fullHeal();
  }
  g.obtainItem('pill_zhuji', 3, true);
  g.gold = 50000;
  g.obtainItem('xuan_jing', 10, true);
});
await page.waitForTimeout(600);
const party = await page.evaluate(() => window.game.party.map(c => c.name));
console.log('party:', party.join('/'));
const hudCards = await page.evaluate(() => document.querySelectorAll('#hud .hud-card').length);
console.log('hud cards (5 人):', hudCards);

// 淬炼：打开菜单 → 角色页 → 淬炼装备 → 点第一件 → 确定
await page.evaluate(() => window.game.ui.openMenu());
await page.waitForTimeout(250);
await page.locator('#menu-content button', { hasText: '淬炼装备' }).first().click();
await page.waitForTimeout(200);
// 淬炼面板是覆盖层，按钮要限定在覆盖层内取（否则会点到被遮住的「换武器」）
const overlay = page.locator('#menu-body > div').last();
const forgeRows = await overlay.locator('button').allTextContents();
console.log('forge rows:', JSON.stringify(forgeRows.slice(0, 4)));
await overlay.locator('button').first().click(); // 武器行 → 直接精炼
await page.waitForTimeout(400);
const afterForge = await page.evaluate(() => document.querySelector('#menu-body') ? document.querySelector('#menu-body').textContent.match(/\+[0-9]/g) : null);
console.log('forge result marks:', JSON.stringify(afterForge));
await page.evaluate(() => window.game.ui.menu.close());
await page.waitForTimeout(200);

// 心魔试炼：重新打开菜单 → 点「心魔试炼」→ 确定
await page.evaluate(() => window.game.ui.openMenu());
await page.waitForTimeout(250);
const trialCount = await page.locator('#menu-content button', { hasText: '心魔试炼' }).count();
console.log('trial buttons:', trialCount);
if (trialCount) {
  await page.locator('#menu-content button', { hasText: '心魔试炼' }).first().click();
  await page.waitForTimeout(250);
  const confirmText = await page.evaluate(() => { const el = document.querySelector('#confirm-panel .c-text'); return el ? el.textContent : 'none'; });
  console.log('confirm:', (confirmText || '').replace(/\n/g, ' / '));
  await page.locator('#confirm-panel .c-ok').click();
  await page.waitForTimeout(1200);
  const st = await page.evaluate(() => ({
    inBattle: window.game.inBattle,
    enemies: window.game.scenes.top && window.game.scenes.top.engine
      ? window.game.scenes.top.engine.enemyUnits.map(u => u.displayName) : null,
    partyHp: window.game.party.map(c => `${c.name}:${c.hp}`),
  }));
  console.log('battle:', JSON.stringify(st));
  await page.screenshot({ path: '.playwright-cli/smoke-5-demon-battle.png' });
}

console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
await browser.close();
