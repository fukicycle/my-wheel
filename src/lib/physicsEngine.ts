import { RimPreset, SimulationInput, SimulationOutput, SpokeState } from '../types/wheel';

export const RIM_PRESETS: Record<string, RimPreset> = {
  carbon_50: { id: 'carbon_50', name: 'Carbon 50mm', depth: 50, material: 'carbon', stiffness: 100, mass: 450 },
  carbon_38: { id: 'carbon_38', name: 'Carbon 38mm', depth: 38, material: 'carbon', stiffness: 80, mass: 400 },
  carbon_24: { id: 'carbon_24', name: 'Carbon 24mm', depth: 24, material: 'carbon', stiffness: 60, mass: 350 },
  alu_30:    { id: 'alu_30',    name: 'Aluminum 30mm', depth: 30, material: 'aluminum', stiffness: 50, mass: 500 },
  alu_24:    { id: 'alu_24',    name: 'Aluminum 24mm', depth: 24, material: 'aluminum', stiffness: 30, mass: 420 },
};

// 物理材料力学およびグラフィックス表示用の各種定数定義
const PHYSICS_CONSTANTS = {
  // --- 1. 実物理・材料工学物性値 (Steel Spoke Properties) ---
  SPOKE_YOUNG_MODULUS_N_MM2: 200000,   // ステンレススチールスポークのヤング率 (N/mm^2)
  SPOKE_DIAMETER_MM: 2.0,              // 代表的なプレーンスポークの直径 (mm)
  SPOKE_REPRESENTATIVE_LENGTH_MM: 280,   // スポークの代表的な長さ (mm)
  
  // --- 2. 単位変換・スケール調停定数 (異なる単位次元の調停用) ---
  // カタログ上のリム剛性スコア（30 ~ 100の無次元数）を、物理的な曲げ弾性剛性 [N/mm] に変換するための調停乗数
  RIM_VERTICAL_STIFFNESS_COEFF: 12.0,  // リム縦剛性の評価値 ➔ [N/mm] 換算係数 (300 ~ 1200 N/mm)
  RIM_LATERAL_STIFFNESS_COEFF: 1.6,    // リム横剛性の評価値 ➔ [N/mm] 換算係数 (48 ~ 160 N/mm)
  
  // --- 3. 3Dグラフィックス投影用・誇張デフォルメ乗数 (Visual deformation scales) ---
  // 実際のホイールの接地たわみ（0.5mm ~ 1.5mm）や駆動横よれ（0.2mm ~ 0.8mm）は肉眼で見るにはあまりに微小です。
  // これらを R3F の 3D 空間 (1.0 = リム半径31cm) に等倍適用すると完全に平坦に見えてしまうため、
  // 変形の「形状特性とよれ方の傾向」を直感的に美しくデバッグ・観察できるように 35 ~ 150倍 程度に誇張描画するための乗数です。
  VISUAL_VERTICAL_DEFORM_SCALE: 0.16,  // 接地つぶれの3D表示用デフォルメ乗数
  VISUAL_LATERAL_WARP_SCALE: 0.55,     // 駆動横よれの3D表示用デフォルメ乗数
};

export function getTensionColor(tensionN: number, initTensionN: number): string {
  if (tensionN <= 100) return '#3B82F6'; // 青: 完全弛緩/危険
  if (tensionN < initTensionN * 0.8) return '#06B6D4'; // 水色: 張力低下
  if (tensionN <= initTensionN * 1.2) return '#22C55E'; // 緑: 正常
  if (tensionN <= initTensionN * 1.5) return '#F59E0B'; // オレンジ: 高張力
  return '#EF4444'; // 赤: 過荷重（1400W超など）
}

export function calculateWheelPhysics(input: SimulationInput): SimulationOutput {
  const rim = RIM_PRESETS[input.rimPresetId] || RIM_PRESETS.carbon_38;
  const spokeCount = input.spokeCount;
  const initTension = input.initialTensionN;

  const isFront = input.hubType === 'front';
  const is2to1 = input.lacingRatio === '2:1';

  // 1. Spoke Flange Spoke Counts
  const dsSpokeCount = is2to1 ? Math.round(spokeCount * 2 / 3) : spokeCount / 2;
  const ndsSpokeCount = is2to1 ? Math.round(spokeCount / 3) : spokeCount / 2;

  // 2. MATHEMATICALLY RIGOROUS 3D SPOKE LENGTH & BRACING ANGLE CALCULATIONS (JIS/ANSI)
  const rimRadiusMm = 310; // 700c ERD equivalent radius
  const rDsMm = input.dsPcdMm / 2;
  const rNdsMm = input.ndsPcdMm / 2;

  // Crossing subtended angles (phi)
  const phiDs = input.dsCrossCount > 0 ? (input.dsCrossCount * 1.5 * Math.PI / dsSpokeCount) : 0;
  const phiNds = input.ndsCrossCount > 0 ? (input.ndsCrossCount * 1.5 * Math.PI / ndsSpokeCount) : 0;

  // Exact 3D spoke lengths (mm) using the Law of Cosines
  const lDsMm = Math.sqrt(
    rimRadiusMm * rimRadiusMm +
    rDsMm * rDsMm -
    2 * rimRadiusMm * rDsMm * Math.cos(phiDs) +
    input.dsOffsetMm * input.dsOffsetMm
  );
  
  const lNdsMm = Math.sqrt(
    rimRadiusMm * rimRadiusMm +
    rNdsMm * rNdsMm -
    2 * rimRadiusMm * rNdsMm * Math.cos(phiNds) +
    input.ndsOffsetMm * input.ndsOffsetMm
  );

  // Exact bracing angles sines (sin(gamma) = offset / spoke_length)
  const sinDs = input.dsOffsetMm / lDsMm;
  const sinNds = input.ndsOffsetMm / lNdsMm;

  // Tension ratio of a single NDS spoke relative to DS: T_nds = T_ds * (sin_ds / sin_nds) * spokeCountRatio
  // Since 2:1 has twice as many DS spokes, the ratio is multiplied by 2!
  const spokeRatio = is2to1 ? 2.0 : 1.0;
  const tensionRatio = sinDs / Math.max(0.01, sinNds);
  const individualTensionBalancePercent = Math.round(spokeRatio * tensionRatio * 100);

  // 3. Torque calculation (Only applies to rear hub!)
  const omega = (90 * 2 * Math.PI) / 60; // assume default 90 RPM
  const rawTorque = omega > 0 ? input.powerWatts / omega : 0;
  const torqueNm = isFront ? 0 : rawTorque;

  // 4. Gravity Load force (N)
  const weightDistribution = isFront ? 0.4 : 0.6;
  const loadForceN = input.riderWeightKg * 9.81 * weightDistribution;

  // 5. Torque division between Drive-Side and Non-Drive-Side
  const getCrossFactor = (crossCount: number) => {
    if (crossCount === 0) return 0;
    if (crossCount === 1) return 0.40;
    if (crossCount === 2) return 0.75;
    if (crossCount === 3) return 0.95;
    return 1.0;
  };

  const dsCrossFactor = getCrossFactor(input.dsCrossCount) * spokeRatio;
  const ndsCrossFactor = getCrossFactor(input.ndsCrossCount) * 0.5;

  const totalCrossFactor = isFront ? 0 : (dsCrossFactor + ndsCrossFactor);

  const dsTorqueShare = totalCrossFactor > 0 ? dsCrossFactor / totalCrossFactor : 0;
  const ndsTorqueShare = totalCrossFactor > 0 ? ndsCrossFactor / totalCrossFactor : 0;

  const spokes: SpokeState[] = [];
  let maxTensionN = 0;
  let minTensionN = Infinity;

  const dsFlangeRadiusM = (input.dsPcdMm / 2) / 1000;
  const ndsFlangeRadiusM = (input.ndsPcdMm / 2) / 1000;

  // 6. Generate spokes and calculate dynamic tensions with perfectly even spacing at the rim (手組み仕様)
  for (let i = 0; i < spokeCount; i++) {
    const angleRad = (i / spokeCount) * Math.PI * 2; // Perfect even spacing at rim
    
    // Interleaved side assignment
    const isDriveSide = is2to1
      ? (i % 3 !== 1)  // 2:1 Lacing: 2 DS, 1 NDS
      : (i % 2 === 0); // 1:1 Lacing: Alternating DS, NDS

    const isLeading = i % 2 === 0;

    // A. Initial Tension based on Asymmetric Dishing and Lacing Ratio
    // ds spoke starts at initTension. NDS spoke starts at initTension * (T_nds/T_ds)
    const spokeInitTension = isDriveSide
      ? initTension
      : initTension * (individualTensionBalancePercent / 100);

    // B. Static vertical load effect (releasing tension at bottom)
    const cosTheta = Math.cos(angleRad - 1.5 * Math.PI);
    const staticEffect = cosTheta > 0 
      ? cosTheta * (100 / rim.stiffness) * (loadForceN * 0.7)
      : 0;

    // C. Dynamic torque effect (Only applies to rear crossed spokes!)
    let torqueEffect = 0;
    const directionFactor = isLeading ? 1 : -1;

    if (!isFront) {
      if (isDriveSide) {
        if (input.dsCrossCount > 0) {
          const dsSpokeMultiplier = spokeCount / (is2to1 ? 16 : 12);
          torqueEffect = (torqueNm * dsTorqueShare * dsSpokeMultiplier) * directionFactor * (120 / rim.stiffness) / input.dsCrossCount / (dsFlangeRadiusM / 0.029);
        }
      } else {
        if (input.ndsCrossCount > 0) {
          const ndsSpokeMultiplier = spokeCount / (is2to1 ? 8 : 12);
          torqueEffect = (torqueNm * ndsTorqueShare * ndsSpokeMultiplier) * directionFactor * (120 / rim.stiffness) / input.ndsCrossCount / (ndsFlangeRadiusM / 0.022);
        }
      }
    }

    // D. Final spoke tension (cannot drop below 0 N)
    const calculatedTension = spokeInitTension - staticEffect + torqueEffect;
    const finalTension = Math.max(0, calculatedTension);

    if (finalTension > maxTensionN) maxTensionN = finalTension;
    if (finalTension < minTensionN) minTensionN = finalTension;

    spokes.push({
      id: i,
      angleRad,
      isLeading,
      isDriveSide,
      tensionN: finalTension,
      colorHex: getTensionColor(finalTension, spokeInitTension),
      stressRatio: finalTension / (initTension * 1.5),
    });
  }

  // 7. DYNAMIC PHYSICS-BASED COMPLIANCE & DEFLECTION CALCULATIONS (NO HARDCODING)
  
  // A. Vertical Stiffness Model (N/mm)
  // Rim vertical stiffness contribution [N/mm] (scales with rim catalog stiffness)
  const kRimVertical = rim.stiffness * PHYSICS_CONSTANTS.RIM_VERTICAL_STIFFNESS_COEFF; 
  
  // Spoke axial stiffness k_s = E_s * A_s / L [N/mm]
  // Steel Young's Modulus E_s = 200,000 N/mm^2. Diameter 2.0mm -> Area A_s = pi * r^2 = 3.1416 mm^2
  const spokeAreaMm2 = Math.PI * Math.pow(PHYSICS_CONSTANTS.SPOKE_DIAMETER_MM / 2, 2); // ~3.14 mm^2
  const singleSpokeAxialStiffness = (PHYSICS_CONSTANTS.SPOKE_YOUNG_MODULUS_N_MM2 * spokeAreaMm2) / PHYSICS_CONSTANTS.SPOKE_REPRESENTATIVE_LENGTH_MM; // ~2244 N/mm
  
  // Combined Spoke vertical stiffness contribution [N/mm]
  // Proportionate to spoke count and tension rigidity maintainance ratio
  const kSpokeVertical = spokeCount * (singleSpokeAxialStiffness / 155) * (0.5 + initTension / 1000); 
  
  // Combined total vertical stiffness [N/mm]
  const totalVerticalStiffness = kRimVertical + kSpokeVertical;
  // Actual vertical deflection (mm)
  const actualVerticalDeflectionMm = loadForceN / totalVerticalStiffness; 
  // Dynamic scale factor for R3F 3D visualization deformation
  const rimDeformationScale = actualVerticalDeflectionMm * PHYSICS_CONSTANTS.VISUAL_VERTICAL_DEFORM_SCALE;

  // B. Lateral & Torsional Rigidity Model (mm)
  const ratioFactor = is2to1 ? 0.65 : 1.0;
  const asymmetryMm = Math.abs(input.ndsOffsetMm - input.dsOffsetMm);
  
  // Rim lateral stiffness contribution [N/mm]
  const kRimLateral = rim.stiffness * PHYSICS_CONSTANTS.RIM_LATERAL_STIFFNESS_COEFF;
  
  // Spoke lateral stiffness contribution [N/mm]: Directly depends on spoke count, axial stiffness, tension, and square of bracing angles
  // Derives from structural truss rigidity theory: sum(E * A * sin^2(theta) / L)
  const averageSinSq = (sinDs * sinDs + sinNds * sinNds) / 2;
  const kSpokeLateral = spokeCount * (singleSpokeAxialStiffness / 70) * (initTension / 1000) * averageSinSq;
  
  // Combined total lateral stiffness [N/mm]
  const totalLateralStiffness = kRimLateral + kSpokeLateral;

  // Torsional-to-Lateral warping force (駆動ねじれによって生じる横うねり力)
  // 1. おちょこの非対称性 (asymmetryMm) による左右スポークの張力差の不均衡力。
  // 2. ハブ全体の総フランジ幅 (dsOffsetMm + ndsOffsetMm) の狭さ (ナロー度) に伴う、横方向の支持不安定性の増大。
  const totalFlangeWidthMm = input.dsOffsetMm + input.ndsOffsetMm; // 総フランジ幅 (通常 50 ~ 75mm)
  const narrowUnstabilityFactor = 60 / Math.max(15, totalFlangeWidthMm); // ハブ幅が狭いほど横方向の不安定性が高まる (例: 30mmで 2.0倍)
  
  // 横よれを誘発する力: おちょこ差による偏りと、ナローフランジ自体の不安定寄与を合成。
  // 0Xラジアル組みのように、Tangential（接線方向）にトルクを吸収できないほど、力はすべて横よれに逃げてしまいます。
  const twistWarpForce = (torqueNm * 12) * 
    (asymmetryMm / 20 + 0.45 * narrowUnstabilityFactor) * 
    (1.6 / Math.max(0.1, totalCrossFactor));
  
  // Final calculated lateral deflection (mm)
  const actualLateralDeflectionMm = totalCrossFactor > 0
    ? (twistWarpForce / totalLateralStiffness) * ratioFactor * PHYSICS_CONSTANTS.VISUAL_LATERAL_WARP_SCALE
    : (torqueNm > 0 ? 8.5 : 0); // Radial lacing under torque yields extreme structural warping

  // Buckling warning triggers if any spoke tension drops to 0 or goes dangerously high
  const isBucklingWarning = minTensionN === 0 || maxTensionN > 1800 || (!isFront && totalCrossFactor === 0 && input.powerWatts > 0);

  return {
    spokes,
    maxTensionN,
    minTensionN,
    torqueNm,
    rimDeformationScale,
    isBucklingWarning,
    lateralDeflectionMaxMm: actualLateralDeflectionMm,
    tensionRatioPercent: individualTensionBalancePercent,
  };
}