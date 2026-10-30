import { useState } from 'react';
import type { WheelResult } from '../domain/engine';
import type { Side, WheelBuild } from '../lib/types';

interface SpokeLine {
  side: Side;
  rim: number;
  hub: number;
}

function buildSpokes(build: WheelBuild, result: WheelResult): SpokeLine[] {
  const n = build.holes;
  const counts = { left: result.left.count, right: result.right.count };
  const many: Side | null = counts.left === counts.right ? null : counts.left > counts.right ? 'left' : 'right';
  const seen: Record<Side, number> = { left: 0, right: 0 };
  const lines: SpokeLine[] = [];
  for (let i = 0; i < n; i++) {
    let side: Side;
    if (many === null) side = i % 2 === 0 ? 'left' : 'right';
    else side = i % 3 === 1 ? (many === 'left' ? 'right' : 'left') : many;
    const k = seen[side]++;
    const rimAngle = -Math.PI / 2 + (2 * Math.PI * (i + 0.5)) / n;
    const alpha = (result[side].hubAngleDeg * Math.PI) / 180;
    const dir = k % 2 === 0 ? 1 : -1;
    lines.push({ side, rim: rimAngle, hub: rimAngle + dir * alpha });
  }
  return lines;
}

const COLOR: Record<Side, string> = { left: 'var(--left)', right: 'var(--right)' };

/** ホイール正面の組み図と、ハブ周りの拡大図 */
export function LacingDiagram({ build, result }: { build: WheelBuild; result: WheelResult }) {
  const [focus, setFocus] = useState<Side | 'both'>('both');
  const spokes = buildSpokes(build, result);
  const R = build.rim.erd / 2;
  const scale = 138 / R;
  const pcd: Record<Side, number> = { left: build.hub.pcdLeft / 2, right: build.hub.pcdRight / 2 };
  const zoom = 46 / Math.max(pcd.left, pcd.right);

  const visible = (s: Side) => focus === 'both' || focus === s;
  const opacity = (s: Side) => (visible(s) ? 1 : 0.12);

  return (
    <div>
      <div className="mb-2 flex items-center gap-1" role="group" aria-label="表示するスポーク">
        {(['both', 'left', 'right'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFocus(f)}
            aria-pressed={focus === f}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${focus === f ? 'bg-ink text-surface' : 'text-muted hover:text-ink'}`}
          >
            {f === 'both' ? '左右' : f === 'left' ? '左だけ' : '右だけ'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <svg viewBox="-150 -150 300 300" className="block w-full" role="img" aria-label="ホイール正面の組み図">
          <circle r={R * scale + 6} fill="none" stroke="var(--ink)" strokeWidth={7} />
          <circle r={R * scale} fill="none" stroke="var(--rule)" strokeDasharray="2 3" />
          <circle cx={0} cy={-(R * scale + 6)} r={3} fill="var(--surface)" stroke="var(--muted)" />
          {spokes.map((sp, i) => (
            <line
              key={i}
              x1={Math.cos(sp.hub) * pcd[sp.side] * scale}
              y1={Math.sin(sp.hub) * pcd[sp.side] * scale}
              x2={Math.cos(sp.rim) * R * scale}
              y2={Math.sin(sp.rim) * R * scale}
              stroke={COLOR[sp.side]}
              strokeWidth={1.1}
              opacity={opacity(sp.side)}
            />
          ))}
          <circle r={Math.max(pcd.left, pcd.right) * scale} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.2} />
        </svg>

        <figure className="m-0 w-[132px]">
          <svg viewBox="-66 -66 132 132" className="block w-full rounded-full bg-sunken" role="img" aria-label="ハブ周りの拡大図">
            <defs>
              <clipPath id={`hub-clip-${build.position}`}>
                <circle r={64} />
              </clipPath>
            </defs>
            <g clipPath={`url(#hub-clip-${build.position})`}>
              {spokes.map((sp, i) => {
                const hx = Math.cos(sp.hub) * pcd[sp.side];
                const hy = Math.sin(sp.hub) * pcd[sp.side];
                const rx = Math.cos(sp.rim) * R;
                const ry = Math.sin(sp.rim) * R;
                return (
                  <line
                    key={i}
                    x1={hx * zoom}
                    y1={hy * zoom}
                    x2={(hx + (rx - hx) * 0.3) * zoom}
                    y2={(hy + (ry - hy) * 0.3) * zoom}
                    stroke={COLOR[sp.side]}
                    strokeWidth={1.6}
                    opacity={opacity(sp.side)}
                  />
                );
              })}
              {(['left', 'right'] as Side[]).map((s) => (
                <circle key={s} r={pcd[s] * zoom} fill="none" stroke={COLOR[s]} strokeWidth={1} opacity={visible(s) ? 0.9 : 0.2} />
              ))}
              <circle r={6} fill="var(--ink)" />
            </g>
          </svg>
          <figcaption className="mt-1.5 text-center text-xs leading-snug text-muted">
            ハブ拡大
            <br />
            <span className="num">
              出口角 <span className="text-side-l">{result.left.exitAngleDeg.toFixed(0)}°</span> /{' '}
              <span className="text-side-r">{result.right.exitAngleDeg.toFixed(0)}°</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
