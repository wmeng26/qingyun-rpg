// DOM 小工具：innerHTML 拼接统一转义入口
// 项目内文本均来自本地静态数据，无 XSS 实害；统一走此函数是为了风格一致，
// 避免个别数据文案（含 & < > " 字符）破坏 HTML 结构
export function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
