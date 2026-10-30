import type { WheelResult } from '../domain/engine';
import type { WheelBuild } from '../lib/types';

const W = 400;
const H = 270;
const CX = W / 2;
const RIM_Y = 46;
const AXLE_Y = 236;
/** 横方向の誇張倍率 */
const LATERAL_SCALE = 4;

/**
 * 正面から見たおちょこ断面図。支え角を横方向4倍で描き、
 * スポークの線の太さを張力に比例させる。
 */
export function DishDiagram({ build, result }: { build: WheelBuild; result: WheelResult }) {
  const R = build.rim.erd / 2;
  const v = (AXLE_Y - RIM_Y) / R;
  const h = v * LATERAL_SCALE;
  const rimX = CX - build.rim.offset * h;
  const maxT = Math.max(result.left.tensionKgf, result.right.tensionKgf, 1);

  const sides = [
    {
      key: 'left' as const,
      s: result.left,
      x: CX - build.hub.flangeLeft * h,
      top: AXLE_Y - (build.hub.pcdLeft / 2) * v,
      color: 'var(--left)',
      anchor: 'end' as const,
    },
    {
      key: 'right' as const,
      s: result.right,
      x: CX + build.hub.flangeRight * h,
      top: AXLE_Y - (build.hub.pcdRight / 2) * v,
      color: 'var(--right)',
      anchor: 'start' as const,
    },
  ];

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="おちょこ断面図。左右の支え角と張力">
        <line x1={CX} x2={CX} y1={RIM_Y - 30} y2={AXLE_Y + 22} stroke="var(--rule)" strokeDasharray="4 4" />

        {/* リム断面 */}
        <rect x={rimX - 26} y={RIM_Y - 30} width={52} height={30} rx={10} fill="var(--sunken)" stroke="var(--muted)" />
        <circle cx={rimX} cy={RIM_Y} r={3} fill="var(--ink)" />

        {/* ハブ軸 */}
        <line x1={sides[0].x - 34} x2={sides[1].x + 34} y1={AXLE_Y} y2={AXLE_Y} stroke="var(--ink)" strokeWidth={6} strokeLinecap="round" />

        {sides.map(({ key, s, x, top, color, anchor }) => {
          const width = 1.5 + 6 * (s.tensionKgf / maxT);
          // 支持線より外側（フランジの外）に置いて線と重ならないようにする
          const labelX = key === 'left' ? Math.min(x, rimX) - 10 : Math.max(x, rimX) + 10;
          const labelY = top - 54;
          const isRotor = build.hub.rotorSide === key;
          return (
            <g key={key}>
              <line x1={x} x2={x} y1={AXLE_Y + 2} y2={top} stroke="var(--ink)" strokeWidth={5} strokeLinecap="round" />
              {isRotor && (
                <line x1={x - 14} x2={x - 14} y1={AXLE_Y + 8} y2={AXLE_Y - 34} stroke="var(--muted)" strokeWidth={3} strokeLinecap="round" />
              )}
              <line x1={x} y1={top} x2={rimX} y2={RIM_Y} stroke={color} strokeWidth={width} strokeLinecap="round" />
              <text x={labelX} y={labelY} textAnchor={anchor} fill={color} fontSize={22} fontWeight={600} className="num">
                {s.tensionKgf.toFixed(0)}
                <tspan fontSize={12} fontWeight={500} dx={2}>kgf</tspan>
              </text>
              <text x={labelX} y={labelY + 18} textAnchor={anchor} fill="var(--muted)" fontSize={12} className="num">
                支え角 {s.bracingDeg.toFixed(2)}°
              </text>
              <text x={x} y={AXLE_Y + 22} textAnchor="middle" fill="var(--muted)" fontSize={11.5} className="num">
                {s.flangeDistance.toFixed(1)}mm
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-xs text-muted">
        正面から見た断面。横方向は{LATERAL_SCALE}倍に拡大し、線の太さは張力に比例
        {build.hub.rotorSide ? '。灰色の縦線がローター' : ''}
      </figcaption>
    </figure>
  );
}
