import type { HubSpec, NippleSpec, RimSpec, SpokeSpec } from './types';

/**
 * リムのプリセット。ERD・重量はメーカー / 販売店の公表値。
 * note に出典の性質（公称・推定）を残し、画面にも表示する。
 */
export interface RimPreset extends Omit<RimSpec, 'presetId' | 'offset'> {
  id: string;
  depth: number;
  holes: number[];
  note: string;
}

export const RIM_PRESETS: RimPreset[] = [
  {
    id: 'ganwell-tu38',
    name: 'GAN WELL GW-TU38MT（チューブラー 38mm）',
    depth: 38,
    erd: 569,
    mass: 320,
    holes: [20, 24, 28],
    maxTensionKgf: null,
    note: 'ERD非公表。38mmカーボンの代表値569mmを仮置き。実測値に置き換えてください',
  },
  {
    id: 'carbonal-rt38d',
    name: 'Carbonal RT38D（チューブラー 38mm 非対称）',
    depth: 38,
    erd: 569,
    mass: 360,
    holes: [20, 24, 28],
    maxTensionKgf: null,
    note: 'メーカー公表値',
  },
  {
    id: 'carbonal-rt38w',
    name: 'Carbonal RT38W（チューブラー 38mm）',
    depth: 38,
    erd: 570,
    mass: 330,
    holes: [20, 24, 28],
    maxTensionKgf: null,
    note: 'メーカー公表値',
  },
  {
    id: 'origin8-bolt38',
    name: 'Origin8 Bolt Low Profile（TLR 38mm）',
    depth: 38,
    erd: 569,
    mass: 470,
    holes: [24],
    maxTensionKgf: null,
    note: '販売店掲載値',
  },
  {
    id: 'hunt-36',
    name: 'HUNT 36 Carbon（TLR 36mm）',
    depth: 36,
    erd: 568.2,
    mass: 418,
    holes: [16],
    maxTensionKgf: 115,
    note: 'メーカー公表値（推奨張力100〜115kgf）',
  },
  {
    id: 'tni-road38',
    name: 'TNI ROAD 38 TU（チューブラー 38mm）',
    depth: 38,
    erd: 584,
    mass: 395,
    holes: [20, 24],
    maxTensionKgf: null,
    note: '販売店掲載値。他の38mmより大きく、測定基準が異なる可能性あり',
  },
];

export interface HubPreset extends Omit<HubSpec, 'presetId'> {
  id: string;
  position: 'front' | 'rear';
  holes: number[];
}

/** ハブ寸法は DT SWISS Spoke Calculator の登録値 */
export const HUB_PRESETS: HubPreset[] = [
  {
    id: 'dt350-f-100-cl',
    position: 'front',
    name: 'DT SWISS 350 100mm センターロック',
    pcdLeft: 44,
    pcdRight: 44,
    flangeLeft: 22.4,
    flangeRight: 35,
    holeDiameter: 2.6,
    mass: 136,
    rotorSide: 'left',
    holes: [24, 28, 32],
  },
  {
    id: 'dt350-r-142-cl',
    position: 'rear',
    name: 'DT SWISS 350 135/142mm センターロック',
    pcdLeft: 46,
    pcdRight: 46,
    flangeLeft: 33,
    flangeRight: 20.2,
    holeDiameter: 2.6,
    mass: 272,
    rotorSide: 'left',
    holes: [24, 28, 32],
  },
];

export const SPOKES: SpokeSpec[] = [
  { id: 'dt-champion-20', name: 'DT Champion 2.0', endDiameter: 2.0, centerDiameter: 2.0, thread: 2.0, bladed: false },
  { id: 'dt-champion-18', name: 'DT Champion 1.8', endDiameter: 1.8, centerDiameter: 1.8, thread: 1.8, bladed: false },
  { id: 'dt-competition-2018', name: 'DT Competition 2.0/1.8', endDiameter: 2.0, centerDiameter: 1.8, thread: 2.0, bladed: false },
  { id: 'dt-competition-race-1816', name: 'DT Competition Race 1.8/1.6', endDiameter: 1.8, centerDiameter: 1.6, thread: 1.8, bladed: false },
  { id: 'dt-revolution-2015', name: 'DT Revolution 2.0/1.5', endDiameter: 2.0, centerDiameter: 1.5, thread: 2.0, bladed: false },
  { id: 'dt-aerolite', name: 'DT Aerolite 2.0/2.3×0.9', endDiameter: 2.0, centerDiameter: 1.5, thread: 2.0, bladed: true },
  { id: 'sapim-race', name: 'Sapim Race 2.0/1.8', endDiameter: 2.0, centerDiameter: 1.8, thread: 2.0, bladed: false },
  { id: 'sapim-laser', name: 'Sapim Laser 2.0/1.5', endDiameter: 2.0, centerDiameter: 1.5, thread: 2.0, bladed: false },
  { id: 'sapim-cxray', name: 'Sapim CX-Ray 2.0/2.3×0.9', endDiameter: 2.0, centerDiameter: 1.5, thread: 2.0, bladed: true },
];

export const NIPPLES: NippleSpec[] = [
  { id: 'alu-20-12', name: 'アルミ 2.0 / 12mm', thread: 2.0, mass: 0.4 },
  { id: 'alu-18-12', name: 'アルミ 1.8 / 12mm', thread: 1.8, mass: 0.35 },
  { id: 'brass-20-12', name: '真鍮 2.0 / 12mm', thread: 2.0, mass: 1.0 },
  { id: 'brass-18-12', name: '真鍮 1.8 / 12mm', thread: 1.8, mass: 0.95 },
];

export const findSpoke = (id: string) => SPOKES.find((s) => s.id === id) ?? SPOKES[0];
export const findNipple = (id: string) => NIPPLES.find((n) => n.id === id) ?? NIPPLES[0];
