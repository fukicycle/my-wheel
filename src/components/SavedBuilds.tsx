import { Trash2, Upload } from 'lucide-react';
import { calculateWheel } from '../lib/calc';
import type { Build } from '../lib/types';
import { useBuildStore } from '../store/useBuildStore';

function summarize(build: Build) {
  const f = calculateWheel(build.front);
  const r = calculateWheel(build.rear);
  return {
    front: f.mass.total,
    rear: r.mass.total,
    set: f.mass.total + r.mass.total,
    frontRatio: f.tensionRatio,
    rearRatio: r.tensionRatio,
    frontLat: f.lateralIndex,
    rearLat: r.lateralIndex,
    errors: f.findings.filter((x) => x.severity === 'error').length + r.findings.filter((x) => x.severity === 'error').length,
  };
}

/** 保存したビルドと編集中のビルドの比較表 */
export function SavedBuilds() {
  const { build, saved, replaceBuild, removeSaved } = useBuildStore();
  const rows = [{ id: 'current', label: '編集中', build }, ...saved.map((b) => ({ id: b.id, label: b.name, build: b as Build }))];
  const base = summarize(build);

  return (
    <section aria-labelledby="compare-title" className="mt-12">
      <h2 id="compare-title" className="m-0 text-2xl font-semibold tracking-tight">
        比較
      </h2>
      <p className="m-0 mt-1 text-sm text-muted">「保存」したビルドが並びます。差は編集中のビルドとの比較です。</p>

      {saved.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-rule p-5 text-sm text-muted">
          まだ保存したビルドはありません。上の「保存」で今の組みを残すと、別案と重量・張力比・横剛性指標を並べて比べられます。
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-rule bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th scope="col" className="px-4 py-2.5 font-normal">ビルド</th>
                <th scope="col" className="px-3 py-2.5 text-right font-normal">前輪</th>
                <th scope="col" className="px-3 py-2.5 text-right font-normal">後輪</th>
                <th scope="col" className="px-3 py-2.5 text-right font-normal">前後</th>
                <th scope="col" className="px-3 py-2.5 text-right font-normal">張力比 前 / 後</th>
                <th scope="col" className="px-3 py-2.5 text-right font-normal">横剛性指標 前 / 後</th>
                <th scope="col" className="px-4 py-2.5"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const s = summarize(row.build);
                const isCurrent = row.id === 'current';
                const diff = (v: number, b: number, digits = 0) => {
                  if (isCurrent) return null;
                  const d = v - b;
                  if (Math.abs(d) < 0.5 * 10 ** -digits) return null;
                  return (
                    <span className="block text-xs text-muted">
                      {d > 0 ? '+' : '−'}
                      {Math.abs(d).toFixed(digits)}
                    </span>
                  );
                };
                return (
                  <tr key={row.id} className={`border-t border-rule align-top ${isCurrent ? 'bg-sunken' : ''}`}>
                    <th scope="row" className="px-4 py-3 text-left font-medium">
                      {row.label}
                      {isCurrent && <span className="block text-xs font-normal text-muted">{build.name}</span>}
                      {s.errors > 0 && <span className="block text-xs font-normal text-bad">組めない箇所 {s.errors}件</span>}
                    </th>
                    <td className="num px-3 py-3 text-right">{s.front.toFixed(0)} g{diff(s.front, base.front)}</td>
                    <td className="num px-3 py-3 text-right">{s.rear.toFixed(0)} g{diff(s.rear, base.rear)}</td>
                    <td className="num px-3 py-3 text-right font-semibold">{s.set.toFixed(0)} g{diff(s.set, base.set)}</td>
                    <td className="num px-3 py-3 text-right">
                      {(s.frontRatio * 100).toFixed(0)}% / {(s.rearRatio * 100).toFixed(0)}%
                    </td>
                    <td className="num px-3 py-3 text-right">
                      {s.frontLat.toFixed(0)} / {s.rearLat.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isCurrent && (
                        <span className="inline-flex gap-1.5">
                          <button type="button" className="btn" onClick={() => replaceBuild(row.build)}>
                            <Upload size={14} aria-hidden />
                            読み込む
                          </button>
                          <button type="button" className="btn" onClick={() => removeSaved(row.id)} aria-label={`${row.label}を削除`}>
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
