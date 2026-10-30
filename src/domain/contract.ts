import { z } from 'zod';
import type { NippleSpec, Side, SpokeSpec, WheelBuild } from '../lib/types';

/**
 * C#（domain/MyWheel.Domain）との境界の契約。
 * 計算結果の型は手書きせず、このスキーマから導出する。WASM から返ってきた JSON は必ずここで検証し、
 * C# 側と形がズレていたら画面に出す前に例外にする。
 */

const side = z.enum(['left', 'right']);

const sideResult = z.strictObject({
  side,
  count: z.number(),
  /** フランジ上での穴のずれ角 (deg) */
  hubAngleDeg: z.number(),
  /** スポークがフランジを出る角度。0 = 放射、90 = 接線 (deg) */
  exitAngleDeg: z.number(),
  /** 接線を超えない最大クロス数 */
  maxCross: z.number().int(),
  /** 実効フランジ距離（リムオフセット込み, mm） */
  flangeDistance: z.number(),
  /** 幾何長（穴中心〜ERD, mm） */
  geometricLength: z.number(),
  /** スポーク長（穴径の半分を差し引いた値, mm） */
  length: z.number(),
  /** 支え角 (deg) */
  bracingDeg: z.number(),
  tensionKgf: z.number(),
  tensionN: z.number(),
  /** 1本の軸剛性 (N/mm) */
  axialStiffness: z.number(),
  /** 張力による伸び (mm) */
  elongation: z.number(),
  spokeMass: z.number(),
  nippleMass: z.number(),
});

const finding = z.strictObject({
  severity: z.enum(['error', 'warn', 'info']),
  message: z.string(),
});

export const wheelResultSchema = z.strictObject({
  left: sideResult,
  right: sideResult,
  /** 低張力側 ÷ 高張力側 (0〜1) */
  tensionRatio: z.number(),
  highSide: side,
  /** スポーク系の横剛性指標 (N/mm)。リム剛体仮定の全周合計 */
  lateralIndex: z.number(),
  /** スポーク系の縦（半径方向）剛性指標 (N/mm) */
  radialIndex: z.number(),
  mass: z.strictObject({
    rim: z.number(),
    hub: z.number(),
    spokes: z.number(),
    nipples: z.number(),
    extra: z.number(),
    total: z.number(),
  }),
  findings: z.array(finding),
});

export const wheelResultsSchema = z.array(wheelResultSchema);

export type WheelResult = z.infer<typeof wheelResultSchema>;
export type SideResult = z.infer<typeof sideResult>;
export type Finding = z.infer<typeof finding>;
export type Severity = Finding['severity'];

/** C# の CalculateRequest。部品は ID ではなく解決済みの寸法で渡す */
export interface CalculateRequest {
  wheel: WheelBuild;
  parts: Record<Side, { spoke: SpokeSpec; nipple: NippleSpec }>;
}
