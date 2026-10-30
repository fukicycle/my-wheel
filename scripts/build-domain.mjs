// C# のドメイン層を WebAssembly にビルドし、Vite の public/dotnet/ に配置する。
//   node scripts/build-domain.mjs              常にビルド
//   node scripts/build-domain.mjs --if-missing public/dotnet が無いときだけビルド（npm run dev 用）
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'domain', '.publish');
const target = join(root, 'public', 'dotnet');

if (process.argv.includes('--if-missing') && existsSync(join(target, 'dotnet.js'))) process.exit(0);

rmSync(out, { recursive: true, force: true });
execFileSync('dotnet', ['publish', join(root, 'domain', 'MyWheel.Wasm'), '-c', 'Release', '-o', out, '--nologo'], {
  stdio: 'inherit',
});

const framework = join(out, 'wwwroot', '_framework');
if (!existsSync(join(framework, 'dotnet.js'))) {
  throw new Error(`dotnet.js が見つかりません: ${framework}`);
}

// GitHub Pages（Jekyll）は _ で始まるディレクトリを配信しないので、_framework ではなく dotnet/ に置く
rmSync(target, { recursive: true, force: true });
cpSync(framework, target, { recursive: true });

const files = readdirSync(target).filter((f) => !f.endsWith('.gz') && !f.endsWith('.br'));
const total = files.reduce((sum, f) => sum + statSync(join(target, f)).size, 0);
for (const f of files.sort()) console.log(`${(statSync(join(target, f)).size / 1024).toFixed(1).padStart(9)} KB  ${f}`);
console.log(`${(total / 1024).toFixed(1).padStart(9)} KB  合計（非圧縮）`);
