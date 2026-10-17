export type Side = 'left' | 'right';
export type Position = 'front' | 'rear';

/** 左右のスポーク本数の配分。2:1 は多い側を指定する */
export type Lacing = '1:1' | '2:1-left' | '2:1-right';

export interface RimSpec {
  presetId: string;
  name: string;
  /** 有効リム径 (mm) */
  erd: number;
  /** リム単体重量 (g) */
  mass: number;
  /** スポーク穴の左右オフセット (mm)。+ で穴が左側に寄る */
  offset: number;
  /** リムの許容最大張力 (kgf)。不明なら null */
  maxTensionKgf: number | null;
}

export interface HubSpec {
  presetId: string;
  name: string;
  pcdLeft: number;
  pcdRight: number;
  /** センターからフランジまでの距離 (mm) */
  flangeLeft: number;
  flangeRight: number;
  /** スポーク穴径 (mm) */
  holeDiameter: number;
  mass: number;
  /** ディスクローターが付く側。リムブレーキなら null */
  rotorSide: Side | null;
}

export interface SideSpec {
  spokeId: string;
  nippleId: string;
  cross: number;
}

export interface WheelBuild {
  position: Position;
  holes: number;
  lacing: Lacing;
  rim: RimSpec;
  hub: HubSpec;
  left: SideSpec;
  right: SideSpec;
  /** 張力が高い側に掛ける目標張力 (kgf) */
  targetTensionKgf: number;
  /** リムテープ・バルブなどの追加重量 (g) */
  extraMass: number;
}

export interface Build {
  name: string;
  front: WheelBuild;
  rear: WheelBuild;
}

export interface SpokeSpec {
  id: string;
  name: string;
  /** 両端（バテッド部）の径 (mm) */
  endDiameter: number;
  /** 中央部の丸断面換算径 (mm)。扁平スポークは断面積から換算 */
  centerDiameter: number;
  /** ネジ径 (mm) */
  thread: number;
  bladed: boolean;
}

export interface NippleSpec {
  id: string;
  name: string;
  thread: number;
  mass: number;
}
