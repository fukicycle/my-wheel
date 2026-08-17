自転車ホイール物理シミュレーター アプリケーション詳細設計書
1. プロジェクト概要
1.1 目的
本アプリケーションは、自転車ホイールにおけるスポーク組み・素材・ハイトの違いが、静的荷重（ライダーの体重）および動的トルク（スプリント時のペダリングパワー：最大1400W）にどのように影響するかを3D上でリアルタイムに可視化・シミュレーションするWebアプリケーションである。
厳密な有限要素法（FEM）による重い計算ではなく、**「リアルタイム性と直感的な理解（60fpsのインタラクティブ体験）」**を最優先とし、プリセットベースの構造力学近似モデルを採用する。
1.2 主要機能
リム・ハブ・スポークの3D描画機能: Three.js (React Three Fiber) によるリアルタイム3Dホイール表示。
プリセット選択機能: カーボン (24mm / 38mm / 50mm)、アルミ (24mm / 30mm) のプリセット切替。
インタラクティブな荷重・トルク制御:  
ライダー重量スライダー（0 kg 〜 120 kg）
ペダリングトルクスライダー（0 W 〜 1400 W）
ケイデンス設定（60 rpm 〜 130 rpm）
リアルタイム視覚効果 (Visual Effects):  
張力ヒートマップ: スポークの張力変化（増大・減少）を動的なカラーグラデーションで表現。
デフォルメ変形: 微小なリムの歪みやトルクによる「よじれ」を誇張描画（10倍〜50倍）。
ベクトルアロー演出: ハブの回転トルクおよびタイヤ接地面の駆動力を矢印オブジェクトで立体表示。
リアルタイムテレメトリ表示: 各スポークの最小/最大張力、歪み量、座屈危険度のグラフ/数値インジケーター表示。

2. システムアーキテクチャ & 技術スタック
2.1 技術スタック
レイヤー
採用技術
選定理由
フロントエンド
React 18 / TypeScript
状態管理の明確化および型安全性の確保
3Dグラフィックス
Three.js / React Three Fiber (R3F) / @react-three/drei
Reactの状態（State）と3Dシーンの宣言的同期
スタイル・UI components
Tailwind CSS / Lucide React / shadcn/ui
高速かつ洗練されたコントロールパネルUI構築
状態管理
Zustand
60fpsのアニメーションループ内での軽量かつ高速な状態伝播
チャート・数値描画
Recharts
スポーク張力分布グラフの描画
2.2 システムデータフロー
[ UI Control Panel ] (スライダー / プリセット選択)
        │
        ▼ (Zustand Store)
[ Physics Simulation Engine ] (毎フレームまたはState更新時に計算)
        │
        ├──> [ Tension & Deformation Data ]
        │
        ▼ (R3F Render Loop)
[ Three.js Canvas Scene ]
   ├── Wheel Rim Mesh (変形Vertexアニメーション)
   ├── Spoke Line/Cylinder Instanced Mesh (色/太さ更新)
   └── Vector Arrow Helpers (トルク・荷重矢印)

3. 物理演算 ＆ パラメータモデル
3.1 リムプリセット仕様
リムの剛性（Stiffness Index）は、静的荷重を受けた際の「変形領域の広さ（荷重分散度）」および動的トルクを受けた際の「回転方向のよじれ抵抗」に直接影響する。
プリセットID
名称
リムハイト
素材
剛性指数 ()
質量
特徴
carbon_50
Carbon 50mm
50 mm
カーボン
100
450 g
変形しにくくトルク伝達性が極めて高い。荷重が広く分散。
carbon_38
Carbon 38mm
38 mm
カーボン
80
400 g
万能型の高剛性リム。
carbon_24
Carbon 24mm
24 mm
カーボン
60
350 g
超軽量ローハイト。ややたわみやすい。
alu_30
Aluminum 30mm
30 mm
アルミ
50
500 g
アルミの中では高剛性だがカーボンには及ばない。
alu_24
Aluminum 24mm
24 mm
アルミ
30
420 g
変形しやすく、荷重直下のスポークテンションが大きく低下。

3.2 物理計算ロジック
1. 初期条件
スポーク本数  （リアホイール標準）
初期スポーク張力 
クロス組み設定: ドライブ側 3クロス / 反ドライブ側 2クロス（または交互Leading/Trailing配置）
2. 静的荷重（ライダー重量）の影響
地面接地面（、最下部）における荷重  による各スポーク  （角度 ）の張力変化 :

効果:  が低い（アルミ24mmなど）ほど、局所的（最下部直近の1〜2本）に極端な張力低下（たわみ）が発生する。
3. 1400W スプリントトルクの影響
ペダリングパワー  (W) とケイデンス  (rad/s) から入力トルク  (N·m) を算出：

例: 
各スポークの配置方向（Leading: 駆動を牽引 / Trailing: 後追い）に応じてトルク効果  が付加される：

ここで、
 （Leading スポーク: 引っ張り張力が増大）
 （Trailing スポーク: 弛緩方向に作用）
: ハブフランジ半径・交差角に依存する変換定数
4. 最終張力の算出
各スポーク  の最終張力 :

※ スポークは「引っ張り」のみに抗するプレストレスト構造のため、物理的に 0 N 未満にはならない（完全ゆるみ状態）。

4. 3D可視化 & UI/UX 設計
4.1 カラーマッピング (張力ヒートマップ)
各スポークの色  は、現在の張力  に応じて以下のように動的に補間・変化させる。
  0 N (座屈/弛緩)      800 N               1100 N (初期)       1500 N+ (過荷重)
   [ 青: Blue ] ────── [ 水色: Cyan ] ────── [ 緑: Green ] ────── [ 赤: Red ]
青 (#3B82F6): 危険（張力が完全または大幅に抜けている）。リムの振れや折れの原因。
緑 (#22C55E): 正常・安全範囲。
赤 (#EF4444): 1400Wなどのトルクによりスポークが過度に引っぱられている状態（レッドゾーン）。

4.2 変形アニメーションの演出（デフォルメ）
実際のホイールの歪み量は数ミリ（0.1mm〜2mm）程度で画面上では判別が難しいため、**ビジュアル誇張倍率（Deformation Scale: 20x 〜 50x）**を乗算して表現する。
ラジアル方向変形 (接地面の潰れ): 最下部（）付近のリム頂点座標を、荷重に比例してハブの中心方向へ押し込む。
ねじり変形 (Torque Twist): 1400Wトルク印加時、ハブに対してリム全体を円周方向に数度回転（よじれ）させ、剛性が低いリム（アルミ24mm）ほどよじれ角を大きく描画する。

4.3 UIレイアウト構造
画面は「3D viewportメイン」＋「左側コントロールパネル」＋「右側/下部リアルタイムアナリティクス」の3エリアで構成する。
+-----------------------------------------------------------------------+
| Header: 自転車ホイール物理シミュレーター (Three.js Visualizer)         |
+--------------------------+--------------------------------------------+
| [ Control Panel ]        | [ 3D Viewport (React Three Fiber) ]        |
|                          |                                            |
| ■ リムプリセット選択     |    - 3D Wheel Interactive Model           |
|   ( ) Carbon 50mm        |    - Tension Heatmap Color                |
|   (*) Carbon 38mm        |    - Torque Vector Arrows (Orange/Red)     |
|   ( ) Alu 24mm etc.      |    - Realtime Load Indicators             |
|                          |                                            |
| ■ パラメータ制御         +--------------------------------------------+
|  ・ライダー体重 (kg)     | [ Realtime Analytics ]                     |
|    [===|-------] 70kg    |  - Spoke Tension Distribution Chart        |
|  ・ペダリングパワー (W)  |  - Max Tension: 1420 N  Min Tension: 120 N   |
|    [======|----] 1400W   |  - Rim Torsional Stiffness Status: OK      |
|  ・ケイデンス (rpm)      |                                            |
+--------------------------+--------------------------------------------+

5. データ構造 & コード設計
5.1 TypeScript 型定義 (types/wheel.ts)
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
  rimPresetId: RimPresetId;
  riderWeightKg: number; // 0 - 120
  powerWatts: number; // 0 - 1400
  cadenceRpm: number; // 60 - 130
  spokeCount: number; // default: 24
  initialTensionN: number; // default: 1100
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
}

5.2 物理計算コアエンジン (lib/physicsEngine.ts)
import { RimPreset, SimulationInput, SimulationOutput, SpokeState } from '../types/wheel';

export const RIM_PRESETS: Record<string, RimPreset> = {
  carbon_50: { id: 'carbon_50', name: 'Carbon 50mm', depth: 50, material: 'carbon', stiffness: 100, mass: 450 },
  carbon_38: { id: 'carbon_38', name: 'Carbon 38mm', depth: 38, material: 'carbon', stiffness: 80, mass: 400 },
  carbon_24: { id: 'carbon_24', name: 'Carbon 24mm', depth: 24, material: 'carbon', stiffness: 60, mass: 350 },
  alu_30:    { id: 'alu_30',    name: 'Aluminum 30mm', depth: 30, material: 'aluminum', stiffness: 50, mass: 500 },
  alu_24:    { id: 'alu_24',    name: 'Aluminum 24mm', depth: 24, material: 'aluminum', stiffness: 30, mass: 420 },
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

  // 1. トルク(Nm)計算: P / omega
  const omega = (input.cadenceRpm * 2 * Math.PI) / 60;
  const torqueNm = omega > 0 ? input.powerWatts / omega : 0;

  // 2. 重力荷重(N)
  const loadForceN = input.riderWeightKg * 9.81 * 0.5; // リアへの荷重分（約50%）

  const spokes: SpokeState[] = [];
  let maxTensionN = 0;
  let minTensionN = Infinity;

  for (let i = 0; i < spokeCount; i++) {
    const angleRad = (i / spokeCount) * Math.PI * 2;
    const isLeading = i % 2 === 0;
    const isDriveSide = i < spokeCount / 2;

    // A. 静的荷重による張力変化 (最下部付近 angleRad = PI で張力低下)
    const cosTheta = Math.cos(angleRad - Math.PI / 2);
    const staticEffect = cosTheta > 0 
      ? cosTheta * (100 / rim.stiffness) * (loadForceN * 0.6)
      : 0;

    // B. トルクによる張力変化 (Leadingは増加, Trailingは減少)
    const directionFactor = isLeading ? 1 : -1;
    const torqueEffect = torqueNm * directionFactor * (120 / rim.stiffness);

    // C. 最終張力算出
    const calculatedTension = initTension - staticEffect + torqueEffect;
    const finalTension = Math.max(0, calculatedTension);

    if (finalTension > maxTensionN) maxTensionN = finalTension;
    if (finalTension < minTensionN) minTensionN = finalTension;

    spokes.push({
      id: i,
      angleRad,
      isLeading,
      isDriveSide,
      tensionN: finalTension,
      colorHex: getTensionColor(finalTension, initTension),
      stressRatio: finalTension / (initTension * 1.5),
    });
  }

  const isBucklingWarning = minTensionN === 0 || maxTensionN > 1800;

  return {
    spokes,
    maxTensionN,
    minTensionN,
    torqueNm,
    rimDeformationScale: (110 - rim.stiffness) * 0.05,
    isBucklingWarning,
  };
}

5.3 R3F 3D描画コンポーネント仕様 (components/WheelScene.tsx)
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SimulationOutput } from '../types/wheel';

interface WheelSceneProps {
  simulationData: SimulationOutput;
}

export const WheelScene: React.FC<WheelSceneProps> = ({ simulationData }) => {
  const wheelGroupRef = useRef<THREE.Group>(null);
  const hubRadius = 0.05;
  const rimRadius = 0.31; // 700c相当の半径表現

  // トルクに応じたスピン・微振動演出
  useFrame((state, delta) => {
    if (wheelGroupRef.current && simulationData.torqueNm > 0) {
      // 微小なよじれ振動効果
      const twistAmount = (simulationData.torqueNm / 2000) * simulationData.rimDeformationScale;
      wheelGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * twistAmount * 0.05;
    }
  });

  return (
    <group ref={wheelGroupRef}>
      {/* 1. ハブ Mesh */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[hubRadius, hubRadius, 0.07, 32]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 2. リム Mesh */}
      <mesh>
        <torusGeometry args={[rimRadius, 0.015, 16, 100]} />
        <meshStandardMaterial color="#111111" roughness={0.4} />
      </mesh>

      {/* 3. 各スポーク Lines / Cylinders */}
      {simulationData.spokes.map((spoke) => {
        const hubX = Math.cos(spoke.angleRad) * hubRadius;
        const hubY = Math.sin(spoke.angleRad) * hubRadius;
        
        // クロス組のズレ表現
        const rimAngle = spoke.angleRad + (spoke.isLeading ? 0.2 : -0.2);
        const rimX = Math.cos(rimAngle) * rimRadius;
        const rimY = Math.sin(rimAngle) * rimRadius;

        const points = [
          new THREE.Vector3(hubX, hubY, spoke.isDriveSide ? 0.02 : -0.02),
          new THREE.Vector3(rimX, rimY, 0),
        ];

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <line key={spoke.id} geometry={lineGeometry}>
            <lineBasicMaterial color={spoke.colorHex} linewidth={2} />
          </line>
        );
      })}

      {/* 4. トルク可視化アロー (トルク発生時) */}
      {simulationData.torqueNm > 10 && (
        <mesh position={[0, 0, 0.08]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.07, 0.09, 32, 1, 0, Math.PI * 1.5]} />
          <meshBasicMaterial color="#FF5500" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

6. パフォーマンス最適化 & 将来の拡張性
6.1 パフォーマンス最適化
InstancedMesh の利用: スポーク描画を単一の InstancedMesh に集約することで、描画コール（Draw Calls）を最小化し、モバイルブラウザでも60fpsを維持する。
計算と描画の分離: 物理演算ロジック（calculateWheelPhysics）は計算量が極めて軽いためメインスレッドで即座に実行可能だが、パラメータ更新時のみ再計算するようメモ化（useMemo）を適用する。
6.2 将来の拡張アプローチ
スポーク組みパターン切り替え: ラジアル組み、2:1組み（Optbal）、4クロスなどの比較機能の追加。
Web Worker / WASM 化: 厳密な二次元2D/3D FEM（有限要素法）エンジンを Rust / C++ から WebAssembly にビルドして組み込み、より学術的な解析モードへの拡張。

