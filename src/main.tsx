import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ENGINE_BASE, startEngine } from './domain/engine'
import './index.css'

// 計算は C#（WebAssembly）で行う。画面は待たずに描画し、エンジンは裏で読み込む
const engineReady = startEngine()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 2回目以降はエンジンをキャッシュから読む（sw.js）。読み込みに使ったファイルを渡して保存させる
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((e) => console.warn(e))
  void Promise.all([engineReady, navigator.serviceWorker.ready]).then(([, registration]) => {
    const urls = performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .filter((name) => new URL(name).pathname.startsWith(ENGINE_BASE))
    registration.active?.postMessage({ type: 'engine-loaded', base: ENGINE_BASE, urls })
  })
}
