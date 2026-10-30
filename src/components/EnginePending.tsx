import { CircleAlert, LoaderCircle, RotateCw } from 'lucide-react';
import type { EngineState } from '../domain/engine';

/**
 * 計算エンジンの準備ができるまで、結果の代わりに置く。
 * 見に来たのは結果なので、「待てば出る」ことと進み具合だけを、断面図が出る位置に出す。
 */
export function EnginePending({ engine, className = '' }: { engine: EngineState; className?: string }) {
  if (engine.status === 'error') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`} role="alert">
        <CircleAlert size={28} className="text-bad" aria-hidden />
        <p className="m-0 text-sm">計算エンジンを読み込めませんでした</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          <RotateCw size={14} aria-hidden />
          再読み込み
        </button>
      </div>
    );
  }

  const ratio = engine.status === 'loading' && engine.total > 0 ? engine.loaded / engine.total : null;
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`} role="status" aria-live="polite">
      <LoaderCircle size={28} className="animate-spin text-muted" aria-hidden />
      <p className="m-0 text-sm">
        計算エンジンを読み込んでいます
        <span className="block text-xs text-muted">初回のみ時間がかかります</span>
      </p>
      {ratio !== null && (
        <div className="h-1 w-40 overflow-hidden rounded-full bg-sunken" aria-hidden>
          <div className="h-full bg-ink transition-[width] duration-200" style={{ width: `${Math.round(ratio * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
