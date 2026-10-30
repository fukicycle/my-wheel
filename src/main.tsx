import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initEngine } from './domain/engine'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)

// 計算は C#（WebAssembly）で行う。ランタイムの読み込みが終わってから描画する
initEngine()
  .then(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
  .catch((error: unknown) => {
    console.error(error)
    root.render(
      <p className="mx-auto max-w-xl p-8 text-sm">
        計算エンジンを読み込めませんでした。ページを再読み込みしてください。
      </p>,
    )
  })
