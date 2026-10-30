import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** scripts/build-domain.mjs が作った public/dotnet/<ハッシュ>/ の名前 */
function engineDir(): string {
  const root = join(__dirname, 'public', 'dotnet')
  const dir = existsSync(root) ? readdirSync(root).find((d) => existsSync(join(root, d, 'dotnet.js'))) : undefined
  if (!dir) throw new Error('計算エンジンがありません。先に npm run build:domain を実行してください')
  return dir
}

export default defineConfig({
  base: '/my-wheel/', // Set to repository name for GitHub Pages explicit path resolution
  plugins: [react()],
  define: {
    __ENGINE_DIR__: JSON.stringify(engineDir()),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
