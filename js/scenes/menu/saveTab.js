// 页签：存档（存 / 读 / 删）
import { esc } from '../../core/dom.js';

export function renderSave(menu) {
  const g = menu.game;
  for (const slot of g.save.slots()) {
    const m = g.save.meta(slot);
    const row = document.createElement('div');
    row.className = 'slot-row-big';
    const info = !m ? '—— 空 ——'
      : m.incompatible ? `【旧版本存档】· ${new Date(m.savedAt).toLocaleString('zh-CN')}（版本不符，无法读取）`
      : `${m.name} Lv${m.level} · ${m.realm} · ${m.mapName} · ${new Date(m.savedAt).toLocaleString('zh-CN')}`;
    row.innerHTML = `
      <div class="s-info">
        <div class="s-title">存档 ${slot}</div>
        <div>${esc(info)}</div>
      </div>`;
    const bSave = menu._btn('存档', () => {
      const doSave = () => {
        const ok = g.save.save(slot, g.serialize());
        g.ui.toast(ok ? `已存入档位 ${slot}` : '存档失败');
        menu.render();
      };
      // 档位上已有存档（含不兼容旧档）时先确认再覆盖
      if (m) g.ui.confirm(`档位 ${slot} 已有存档，覆盖？`, doSave);
      else doSave();
    });
    const bLoad = menu._btn('读档', () => {
      if (!m) { g.ui.toast('该档位为空'); return; }
      if (m.incompatible) { g.ui.toast('存档版本不兼容，无法读取'); return; }
      g.ui.confirm(`读取档位 ${slot}？当前进度将丢失。`, () => {
        const data = g.save.load(slot);
        if (!data) { g.ui.toast('读取存档失败'); return; }
        menu.close();
        g.applySave(data);
      });
    });
    const bDel = menu._btn('删除', () => {
      if (!m) { g.ui.toast('该档位为空'); return; }
      g.ui.confirm(`删除档位 ${slot} 的存档？此操作不可恢复。`, () => {
        g.save.delete(slot);
        g.ui.toast(`已删除档位 ${slot}`);
        menu.render();
      });
    });
    row.appendChild(bSave);
    row.appendChild(bLoad);
    row.appendChild(bDel);
    menu.elContent.appendChild(row);
  }
  menu.nav.setItems(menu.nav.items);
}
