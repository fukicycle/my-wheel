import { Bookmark, Check, Link2, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SavedBuilds } from './components/SavedBuilds';
import { WheelPanel } from './components/WheelPanel';
import { calculateWheel } from './lib/calc';
import { decodeBuild, encodeBuild, useBuildStore } from './store/useBuildStore';

function App() {
  const { build, setName, saveCurrent, reset, replaceBuild } = useBuildStore();
  const [mobileView, setMobileView] = useState<'front' | 'rear'>('front');
  const [flash, setFlash] = useState<'saved' | 'copied' | null>(null);

  // 共有リンク（#b=...）から開いたときはそのビルドを読み込む
  useEffect(() => {
    const match = window.location.hash.match(/^#b=(.+)$/);
    if (!match) return;
    const shared = decodeBuild(match[1]);
    if (shared) replaceBuild(shared);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [replaceBuild]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1800);
    return () => clearTimeout(t);
  }, [flash]);

  const front = calculateWheel(build.front).mass.total;
  const rear = calculateWheel(build.rear).mass.total;

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#b=${encodeBuild(build)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('このリンクをコピーしてください', url);
    }
    setFlash('copied');
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8">
      <header className="z-10 md:sticky md:top-0 -mx-4 border-b border-rule bg-bg px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="min-w-0 flex-1 basis-64">
            <span className="sr-only">ビルド名</span>
            <input
              value={build.name}
              onChange={(e) => setName(e.target.value)}
              className="w-full truncate rounded-md border border-transparent bg-transparent px-1 py-0.5 text-lg font-semibold hover:border-rule focus:border-[var(--focus)] focus:outline-none"
            />
          </label>
          <p className="num m-0 flex items-baseline gap-4 text-sm text-muted">
            <span>
              前 <span className="text-ink">{front.toFixed(0)}</span>
            </span>
            <span>
              後 <span className="text-ink">{rear.toFixed(0)}</span>
            </span>
            <span>
              前後 <span className="text-2xl font-semibold text-ink">{(front + rear).toFixed(0)}</span> g
            </span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                saveCurrent();
                setFlash('saved');
              }}
            >
              {flash === 'saved' ? <Check size={15} aria-hidden /> : <Bookmark size={15} aria-hidden />}
              {flash === 'saved' ? '保存しました' : '保存'}
            </button>
            <button type="button" className="btn" onClick={copyLink}>
              {flash === 'copied' ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}
              {flash === 'copied' ? 'コピーしました' : 'リンクをコピー'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (window.confirm('編集中のビルドを初期値に戻します。保存したビルドは残ります。')) reset();
              }}
              aria-label="初期値に戻す"
              title="初期値に戻す"
            >
              <RotateCcw size={15} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div className="mt-4 flex rounded-lg border border-rule bg-surface p-1 lg:hidden" role="tablist" aria-label="表示するホイール">
        {(['front', 'rear'] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={mobileView === p}
            onClick={() => setMobileView(p)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium ${mobileView === p ? 'bg-ink text-surface' : 'text-muted'}`}
          >
            {p === 'front' ? '前輪' : '後輪'}
          </button>
        ))}
      </div>

      <main className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className={mobileView === 'front' ? '' : 'hidden lg:block'}>
          <WheelPanel position="front" />
        </div>
        <div className={mobileView === 'rear' ? '' : 'hidden lg:block'}>
          <WheelPanel position="rear" />
        </div>
      </main>

      <SavedBuilds />

      <footer className="mt-12 border-t border-rule pt-4 text-xs leading-relaxed text-muted">
        スポーク長は DT SWISS と同じ方式（ERD・PCD・フランジ距離・クロス数から幾何長を求め、ハブ穴径の半分を差し引く）で計算しています。
        張力はリム上の横方向の釣り合いから求めた理論値で、スポーク重量とニップル重量は概算です。入力内容はこのブラウザに保存されます。
      </footer>
    </div>
  );
}

export default App;
