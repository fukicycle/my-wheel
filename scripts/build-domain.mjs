// C# のドメイン層を WebAssembly にビルドし、Vite の public/dotnet/<ハッシュ>/ に配置する。
//   node scripts/build-domain.mjs              常にビルド
//   node scripts/build-domain.mjs --if-missing まだ無いときだけビルド（npm run dev 用）
//
// ディレクトリ名を中身のハッシュにするのは、Service Worker（public/sw.js）で
// 「同じ URL なら中身も同じ」としてキャッシュから読ませるため。
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'domain', '.publish');
const engineRoot = join(root, 'public', 'dotnet');

export function currentEngineDir() {
  if (!existsSync(engineRoot)) return null;
  return readdirSync(engineRoot).find((d) => existsSync(join(engineRoot, d, 'dotnet.js'))) ?? null;
}

if (process.argv.includes('--if-missing') && currentEngineDir()) process.exit(0);

rmSync(out, { recursive: true, force: true });
execFileSync('dotnet', ['publish', join(root, 'domain', 'MyWheel.Wasm'), '-c', 'Release', '-o', out, '--nologo'], {
  stdio: 'inherit',
});

const framework = join(out, 'wwwroot', '_framework');
if (!existsSync(join(framework, 'dotnet.js'))) {
  throw new Error(`dotnet.js が見つかりません: ${framework}`);
}

// GitHub Pages は事前圧縮ファイル（.gz / .br）を使わないので配置しない
const files = readdirSync(framework)
  .filter((f) => !f.endsWith('.gz') && !f.endsWith('.br'))
  .sort();
const hash = createHash('sha256');
for (const f of files) hash.update(f).update(readFileSync(join(framework, f)));
const dir = hash.digest('hex').slice(0, 12);

rmSync(engineRoot, { recursive: true, force: true });
mkdirSync(join(engineRoot, dir), { recursive: true });
for (const f of files) cpSync(join(framework, f), join(engineRoot, dir, f));

const total = files.reduce((sum, f) => sum + statSync(join(framework, f)).size, 0);
for (const f of files) console.log(`${(statSync(join(framework, f)).size / 1024).toFixed(1).padStart(9)} KB  ${f}`);
console.log(`${(total / 1024).toFixed(1).padStart(9)} KB  合計（非圧縮） → public/dotnet/${dir}/`);
