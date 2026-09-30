// 语法检查全部 JS 模块（node --experimental-vm-modules tools/syntax-check.mjs）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.js') || name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

const files = walk(path.join(root, 'js'));
const errors = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  try {
    new vm.SourceTextModule(src, { identifier: path.relative(root, f) });
  } catch (e) {
    errors.push(`${path.relative(root, f)}: ${e.message}`);
  }
}

// 相对导入路径存在性检查
const importRe = /import\s+(?:[\s\S]*?from\s+)?['"](\.[^'"]+)['"]/g;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = importRe.exec(src))) {
    const target = path.resolve(path.dirname(f), m[1]);
    if (!fs.existsSync(target)) {
      errors.push(`${path.relative(root, f)}: 导入不存在 -> ${m[1]}`);
    }
  }
}

if (errors.length) {
  console.log(`❌ ${errors.length} 个问题:`);
  for (const e of errors) console.log('  ' + e);
  process.exit(1);
} else {
  console.log(`✅ ${files.length} 个 JS 文件语法与导入路径检查通过`);
}
