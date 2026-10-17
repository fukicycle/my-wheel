import { findNipple, findSpoke } from './parts';
import type { Side, SpokeSpec, WheelBuild } from './types';

/** ステンレススポークのヤング率 (N/mm²) */
const E_STEEL = 200_000;
/** ステンレスの密度 (g/mm³) */
const DENSITY_STEEL = 7.9e-3;
/** バテッドスポークの太い部分の合計長（頭側＋ネジ側, mm） */
const BUTT_LENGTH = 70;
export const KGF = 9.80665;

const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;
const area = (d: number) => (Math.PI * d * d) / 4;

export type Severity = 'error' | 'warn' | 'info';
export interface Finding {
  severity: Severity;
  message: string;
}

export interface SideResult {
  side: Side;
  count: number;
  /** フランジ上での穴のずれ角 (deg) */
  hubAngleDeg: number;
  /** スポークがフランジを出る角度。0 = 放射、90 = 接線 (deg) */
  exitAngleDeg: number;
  /** 接線を超えない最大クロス数 */
  maxCross: number;
  /** 実効フランジ距離（リムオフセット込み, mm） */
  flangeDistance: number;
  /** 幾何長（穴中心〜ERD, mm） */
  geometricLength: number;
  /** スポーク長（穴径の半分を差し引いた値, mm） */
  length: number;
  /** 支え角 (deg) */
  bracingDeg: number;
  tensionKgf: number;
  tensionN: number;
  /** 1本の軸剛性 (N/mm) */
  axialStiffness: number;
  /** 張力による伸び (mm) */
  elongation: number;
  spokeMass: number;
  nippleMass: number;
}

export interface WheelResult {
  left: SideResult;
  right: SideResult;
  /** 低張力側 ÷ 高張力側 (0〜1) */
  tensionRatio: number;
  highSide: Side;
  /** スポーク系の横剛性指標 (N/mm)。リム剛体仮定の全周合計 */
  lateralIndex: number;
  /** スポーク系の縦（半径方向）剛性指標 (N/mm) */
  radialIndex: number;
  mass: {
    rim: number;
    hub: number;
    spokes: number;
    nipples: number;
    extra: number;
    total: number;
  };
  findings: Finding[];
}

export function sideCounts(holes: number, lacing: WheelBuild['lacing']): Record<Side, number> {
  if (lacing === '1:1' || holes % 3 !== 0) return { left: holes / 2, right: holes / 2 };
  const many = (holes * 2) / 3;
  const few = holes / 3;
  return lacing === '2:1-left' ? { left: many, right: few } : { left: few, right: many };
}

export function spokeMass(spoke: SpokeSpec, length: number): number {
  const butt = spoke.endDiameter === spoke.centerDiameter ? length : Math.min(length, BUTT_LENGTH);
  const volume = area(spoke.endDiameter) * butt + area(spoke.centerDiameter) * (length - butt);
  return volume * DENSITY_STEEL;
}

export function spokeAxialStiffness(spoke: SpokeSpec, length: number): number {
  const butt = spoke.endDiameter === spoke.centerDiameter ? length : Math.min(length, BUTT_LENGTH);
  const compliance = butt / (E_STEEL * area(spoke.endDiameter)) + (length - butt) / (E_STEEL * area(spoke.centerDiameter));
  return 1 / compliance;
}

interface Geometry {
  hubAngleDeg: number;
  exitAngleDeg: number;
  maxCross: number;
  geometricLength: number;
  length: number;
  sinBracing: number;
}

export function sideGeometry(erd: number, pcd: number, flangeDistance: number, count: number, cross: number, holeDiameter: number): Geometry {
  const R = erd / 2;
  const r = pcd / 2;
  const alpha = count > 0 ? (2 * Math.PI * cross) / count : 0;
  const chord = Math.sqrt(R * R + r * r - 2 * R * r * Math.cos(alpha));
  const geometricLength = Math.sqrt(chord * chord + flangeDistance * flangeDistance);
  const cosExit = (R * Math.cos(alpha) - r) / chord;
  const exitAngle = deg(Math.acos(Math.max(-1, Math.min(1, cosExit))));
  const tangentAlpha = Math.acos(r / R);
  // 接線角を超えない最大の整数クロス数
  const maxCross = count > 0 ? Math.max(0, Math.ceil((tangentAlpha * count) / (2 * Math.PI)) - 1) : 0;
  return {
    hubAngleDeg: deg(alpha),
    exitAngleDeg: exitAngle,
    maxCross,
    geometricLength,
    length: geometricLength - holeDiameter / 2,
    sinBracing: flangeDistance / geometricLength,
  };
}

export function calculateWheel(build: WheelBuild): WheelResult {
  const { rim, hub } = build;
  const counts = sideCounts(build.holes, build.lacing);
  const flange: Record<Side, number> = {
    left: hub.flangeLeft - rim.offset,
    right: hub.flangeRight + rim.offset,
  };
  const pcd: Record<Side, number> = { left: hub.pcdLeft, right: hub.pcdRight };

  const geo = {
    left: sideGeometry(rim.erd, pcd.left, flange.left, counts.left, build.left.cross, hub.holeDiameter),
    right: sideGeometry(rim.erd, pcd.right, flange.right, counts.right, build.right.cross, hub.holeDiameter),
  };

  // リム上の横方向の釣り合い: n_L · T_L · sinβ_L = n_R · T_R · sinβ_R
  const lateralPull = {
    left: counts.left * geo.left.sinBracing,
    right: counts.right * geo.right.sinBracing,
  };
  const highSide: Side = lateralPull.left <= lateralPull.right ? 'left' : 'right';
  const lowSide: Side = highSide === 'left' ? 'right' : 'left';
  const tensionRatio = lateralPull[lowSide] > 0 ? lateralPull[highSide] / lateralPull[lowSide] : 0;
  const tension: Record<Side, number> = {
    [highSide]: build.targetTensionKgf,
    [lowSide]: build.targetTensionKgf * tensionRatio,
  } as Record<Side, number>;

  const sideResult = (side: Side): SideResult => {
    const g = geo[side];
    const spoke = findSpoke(build[side].spokeId);
    const nipple = findNipple(build[side].nippleId);
    const tensionN = tension[side] * KGF;
    const k = spokeAxialStiffness(spoke, g.length);
    return {
      side,
      count: counts[side],
      hubAngleDeg: g.hubAngleDeg,
      exitAngleDeg: g.exitAngleDeg,
      maxCross: g.maxCross,
      flangeDistance: flange[side],
      geometricLength: g.geometricLength,
      length: g.length,
      bracingDeg: deg(Math.asin(g.sinBracing)),
      tensionKgf: tension[side],
      tensionN,
      axialStiffness: k,
      elongation: tensionN / k,
      spokeMass: spokeMass(spoke, g.length),
      nippleMass: nipple.mass,
    };
  };

  const left = sideResult('left');
  const right = sideResult('right');

  const lateralIndex = [left, right].reduce((sum, s) => sum + s.count * s.axialStiffness * Math.sin(rad(s.bracingDeg)) ** 2, 0);
  const radialIndex = [left, right].reduce((sum, s) => sum + s.count * s.axialStiffness * Math.cos(rad(s.bracingDeg)) ** 2, 0) / 2;

  const spokesMass = left.count * left.spokeMass + right.count * right.spokeMass;
  const nipplesMass = left.count * left.nippleMass + right.count * right.nippleMass;
  const mass = {
    rim: rim.mass,
    hub: hub.mass,
    spokes: spokesMass,
    nipples: nipplesMass,
    extra: build.extraMass,
    total: rim.mass + hub.mass + spokesMass + nipplesMass + build.extraMass,
  };

  return {
    left,
    right,
    tensionRatio,
    highSide,
    lateralIndex,
    radialIndex,
    mass,
    findings: collectFindings(build, { left, right }, tensionRatio, highSide),
  };
}

const SIDE_LABEL: Record<Side, string> = { left: '左', right: '右' };

function sideName(build: WheelBuild, side: Side): string {
  const tags: string[] = [];
  if (build.hub.rotorSide === side) tags.push('ローター側');
  if (build.position === 'rear' && side === 'right') tags.push('ドライブ側');
  return tags.length ? `${SIDE_LABEL[side]}（${tags.join('・')}）` : SIDE_LABEL[side];
}

function collectFindings(build: WheelBuild, sides: Record<Side, SideResult>, ratio: number, highSide: Side): Finding[] {
  const out: Finding[] = [];

  if (build.lacing !== '1:1' && build.holes % 3 !== 0) {
    out.push({ severity: 'error', message: `2:1組みは穴数が3の倍数のときだけ組めます（${build.holes}H）。1:1として計算しています` });
  }

  for (const side of ['left', 'right'] as Side[]) {
    const s = sides[side];
    const spec = build[side];
    const name = sideName(build, side);
    if (spec.cross > s.maxCross) {
      out.push({
        severity: 'error',
        message: `${name}の${spec.cross}クロスはスポークがフランジの接線を越えます（出口角${s.exitAngleDeg.toFixed(0)}°）。この寸法では${s.maxCross}クロスまでです`,
      });
    } else if (s.exitAngleDeg > 88) {
      out.push({ severity: 'warn', message: `${name}はほぼ接線方向に出ます（${s.exitAngleDeg.toFixed(0)}°）。隣のスポーク頭との干渉を確認してください` });
    }

    const rotorRadial = build.hub.rotorSide === side && spec.cross === 0;
    const driveRadial = build.position === 'rear' && side === 'right' && spec.cross === 0;
    if (rotorRadial) out.push({ severity: 'error', message: `${name}がラジアル組みです。制動トルクを伝えられないため交差組みが必要です` });
    if (driveRadial) out.push({ severity: 'error', message: `${name}がラジアル組みです。駆動トルクを伝えられないため交差組みが必要です` });

    const spoke = findSpoke(spec.spokeId);
    const nipple = findNipple(spec.nippleId);
    if (spoke.thread !== nipple.thread) {
      out.push({ severity: 'error', message: `${name}のスポーク（ネジ径${spoke.thread}mm）とニップル（${nipple.thread}mm）のネジ径が合いません` });
    }
  }

  const max = build.rim.maxTensionKgf;
  if (max !== null && build.targetTensionKgf > max) {
    out.push({ severity: 'error', message: `目標張力${build.targetTensionKgf}kgfがリムの上限${max}kgfを超えています` });
  }

  const low = sides[highSide === 'left' ? 'right' : 'left'];
  if (ratio < 0.5) {
    out.push({ severity: 'warn', message: `張力比が${(ratio * 100).toFixed(0)}%です。低張力側（${low.tensionKgf.toFixed(0)}kgf）が荷重で緩みやすくなります` });
  }

  if (build.rim.maxTensionKgf === null) {
    out.push({ severity: 'info', message: 'リムの許容張力が未入力です。メーカー値か、元の組みで使っていた張力を上限の目安にしてください' });
  }
  return out;
}
