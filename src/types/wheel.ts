export type RimPresetId = 'carbon_50' | 'carbon_38' | 'carbon_24' | 'alu_30' | 'alu_24';

export interface RimPreset {
  id: RimPresetId;
  name: string;
  depth: number; // mm
  material: 'carbon' | 'aluminum';
  stiffness: number; // 0 - 100
  mass: number; // grams
}

export interface SimulationInput {
  hubType: 'front' | 'rear'; // 'front' or 'rear' (default: 'rear')
  rimPresetId: RimPresetId;
  riderWeightKg: number; // 0 - 120
  powerWatts: number; // 0 - 1400
  spokeCount: number; // default: 24
  initialTensionN: number; // default: 1100
  
  // Independent left and right hub specs
  dsPcdMm: number; // Drive-side PCD (e.g. 58mm)
  ndsPcdMm: number; // Non-drive-side PCD (e.g. 44mm)
  dsOffsetMm: number; // Drive-side Center-to-Flange (e.g. 19mm)
  ndsOffsetMm: number; // Non-drive-side Center-to-Flange (e.g. 37mm)
  
  dsCrossCount: number; // 0 (radial) to 4 (default: 3)
  ndsCrossCount: number; // 0 (radial) to 4 (default: 2)
  lacingRatio: '1:1' | '2:1'; // default: '1:1'
  isDiscBrake: boolean; // default: false (rim brake)
}

export interface SpokeState {
  id: number;
  angleRad: number;
  isLeading: boolean;
  isDriveSide: boolean;
  tensionN: number;
  colorHex: string;
  stressRatio: number; // 0.0 - 1.0+
}

export interface SimulationOutput {
  spokes: SpokeState[];
  maxTensionN: number;
  minTensionN: number;
  torqueNm: number;
  rimDeformationScale: number;
  isBucklingWarning: boolean;
  lateralDeflectionMaxMm: number;
  tensionRatioPercent: number;
}
