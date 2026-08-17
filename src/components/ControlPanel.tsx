import React from 'react';
import { useWheelStore } from '../store/useWheelStore';
import { RIM_PRESETS } from '../lib/physicsEngine';
import { RimPresetId } from '../types/wheel';
import { Weight, Zap, Settings2, RefreshCw } from 'lucide-react';

export const ControlPanel: React.FC = () => {
  const { input, updateInput, setPreset, resetToDefaults } = useWheelStore();

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1 pb-6 font-sans select-none">
      {/* App Header */}
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent tracking-tight">
          Bicycle Wheel CAD Studio
        </h1>
        <p className="text-[11px] text-zinc-400 mt-1">
          手組みスポーク張力とねじれ剛性の構造力学シミュレーター
        </p>
      </div>

      {/* Rim Preset Selector */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 backdrop-blur-md">
        <h2 className="text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
          1. リム・プリセット選択
        </h2>
        
        <div className="flex flex-col gap-2">
          {(Object.keys(RIM_PRESETS) as RimPresetId[]).map((id) => {
            const preset = RIM_PRESETS[id];
            const isSelected = input.rimPresetId === id;
            return (
              <button
                key={id}
                onClick={() => setPreset(id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-zinc-800/40 border-zinc-500 shadow-md'
                    : 'bg-zinc-950/20 border-zinc-900/60 hover:bg-zinc-800/20 hover:border-zinc-800'
                }`}
              >
                <div>
                  <div className="font-medium text-sm text-zinc-200">{preset.name}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {preset.material === 'carbon' ? 'カーボン' : 'アルミ'} • {preset.depth}mmハイト • {preset.mass}g
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    preset.stiffness >= 80 
                      ? 'bg-zinc-100/10 text-zinc-300' 
                      : preset.stiffness >= 50 
                        ? 'bg-zinc-500/10 text-zinc-400' 
                        : 'bg-zinc-800/20 text-zinc-500'
                  }`}>
                    剛性 {preset.stiffness}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Physics Control Sliders */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 backdrop-blur-md flex flex-col gap-5">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
          2. パラメータ制御
        </h2>

        {/* Rider Weight Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300 flex items-center gap-1.5">
              <Weight size={13} className="text-zinc-400" />
              ライダー体重
            </span>
            <span className="text-xs font-mono font-bold text-zinc-200">{input.riderWeightKg} kg</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="1"
            value={input.riderWeightKg}
            onChange={(e) => updateInput('riderWeightKg', Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-zinc-300"
          />
          <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
            <span>0 kg</span>
            <span>60 kg</span>
            <span>120 kg</span>
          </div>
        </div>

        {/* Power Slider */}
        <div className={`flex flex-col gap-1.5 transition-opacity ${input.hubType === 'front' ? 'opacity-30 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300 flex items-center gap-1.5">
              <Zap size={13} className="text-zinc-400" />
              ペダリングパワー
            </span>
            <span className="text-xs font-mono font-bold text-zinc-200">{input.powerWatts} W</span>
          </div>
          <input
            type="range"
            min="0"
            max="1400"
            step="50"
            value={input.powerWatts}
            disabled={input.hubType === 'front'}
            onChange={(e) => updateInput('powerWatts', Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-zinc-300"
          />
          <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
            <span>0 W</span>
            <span>700 W (スプリント)</span>
            <span>1400 W (プロ)</span>
          </div>
        </div>

        {input.hubType === 'front' && (
          <div className="text-[10px] text-zinc-500 italic text-center border border-zinc-800/40 bg-zinc-950/20 py-1.5 rounded-md">
            ※フロントハブはペダリング駆動（トルク）を受けません。
          </div>
        )}
      </div>

      {/* Advanced Wheel Specs */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 backdrop-blur-md flex flex-col gap-4">
        <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <Settings2 size={13} className="text-zinc-400" />
          3. ホイール詳細仕様
        </h2>

        {/* Hub Type Selector (Front vs Rear) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-zinc-400">ハブ配置区分 (前後切り替え)</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateInput('hubType', 'front')}
              className={`text-xs py-1.5 rounded border transition-all ${
                input.hubType === 'front'
                  ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200 font-bold'
                  : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
              }`}
            >
              フロントハブ
            </button>
            <button
              onClick={() => updateInput('hubType', 'rear')}
              className={`text-xs py-1.5 rounded border transition-all ${
                input.hubType === 'rear'
                  ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200 font-bold'
                  : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
              }`}
            >
              リアハブ
            </button>
          </div>
        </div>

        {/* Spoke Count Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-300 flex justify-between">
            <span>スポーク本数</span>
            <span className="font-mono text-zinc-100 font-bold">{input.spokeCount} 本</span>
          </label>
          <div className="grid grid-cols-5 gap-1">
            {[20, 24, 28, 32, 36].map((count) => (
              <button
                key={count}
                onClick={() => updateInput('spokeCount', count)}
                className={`text-[10px] py-1.5 rounded font-mono border transition-all ${
                  input.spokeCount === count
                    ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200 font-bold'
                    : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                }`}
              >
                {count}H
              </button>
            ))}
          </div>
        </div>

        {/* Initial Tension Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300">初期スポーク張力</span>
            <span className="text-xs font-mono font-bold text-zinc-200">{input.initialTensionN} N</span>
          </div>
          <input
            type="range"
            min="800"
            max="1400"
            step="50"
            value={input.initialTensionN}
            onChange={(e) => updateInput('initialTensionN', Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-zinc-300"
          />
          <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
            <span>800 N (低)</span>
            <span>1100 N (標準)</span>
            <span>1400 N (高)</span>
          </div>
        </div>

        {/* Lacing Ratio Selector (1:1 vs 2:1) */}
        {input.hubType === 'rear' && (
          <div className="flex flex-col gap-1.5 border-t border-zinc-800/40 pt-3">
            <span className="text-xs text-zinc-300">スポーク本数比率 (左右配分)</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateInput('lacingRatio', '1:1')}
                className={`text-xs py-1.5 rounded border transition-all ${
                  input.lacingRatio === '1:1'
                    ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200 font-bold'
                    : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                }`}
              >
                1:1 等間隔組み
              </button>
              <button
                onClick={() => updateInput('lacingRatio', '2:1')}
                className={`text-xs py-1.5 rounded border transition-all ${
                  input.lacingRatio === '2:1'
                    ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200 font-bold'
                    : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                }`}
              >
                2:1 Triplet (G3風)
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              ※2:1組みは右側（DS）に2本のスポーク、左側（NDS）に1本を配置し、おちょこによる張力不均衡を解消します。
            </p>
          </div>
        )}

        {/* Hub Preset Buttons */}
        <div className="flex flex-col gap-1.5 border-t border-zinc-800/40 pt-3">
          <span className="text-xs text-zinc-300">ハブ設計規格 (一括適用プリセット)</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                updateInput('isDiscBrake', false);
                const isFr = input.hubType === 'front';
                updateInput('dsPcdMm', isFr ? 38 : 58);
                updateInput('ndsPcdMm', isFr ? 38 : 44);
                updateInput('dsOffsetMm', isFr ? 38 : 19);
                updateInput('ndsOffsetMm', isFr ? 38 : 37);
              }}
              className={`text-xs py-1.5 rounded border transition-all ${
                !input.isDiscBrake
                  ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200 font-bold'
                  : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
              }`}
            >
              {input.hubType === 'front' 
                ? 'フロントリム' 
                : 'リアリム'}
            </button>
            <button
              onClick={() => {
                updateInput('isDiscBrake', true);
                const isFr = input.hubType === 'front';
                updateInput('dsPcdMm', isFr ? 40 : 58);
                updateInput('ndsPcdMm', isFr ? 56 : 52);
                updateInput('dsOffsetMm', isFr ? 34 : 21);
                updateInput('ndsOffsetMm', isFr ? 22 : 32);
              }}
              className={`text-xs py-1.5 rounded border transition-all ${
                input.isDiscBrake
                  ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200 font-bold'
                  : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
              }`}
            >
              {input.hubType === 'front' 
                ? 'フロントディスク' 
                : 'リアディスク'}
            </button>
          </div>
        </div>

        {/* DS and NDS Flange PCD Sliders */}
        <div className="flex flex-col gap-3 border-t border-zinc-800/40 pt-3">
          <span className="text-xs font-semibold text-zinc-300">ハブ穴径 (PCD) の左右設計</span>
          
          {/* DS PCD */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>DS (右: ドライブ側) PCD</span>
              <span className="text-zinc-200 font-bold">{input.dsPcdMm.toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="0.1"
              value={input.dsPcdMm}
              onChange={(e) => updateInput('dsPcdMm', Number(e.target.value))}
              className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-zinc-300"
            />
          </div>

          {/* NDS PCD */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>NDS (左: 反ドライブ側) PCD</span>
              <span className="text-zinc-200 font-bold">{input.ndsPcdMm.toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="0.1"
              value={input.ndsPcdMm}
              onChange={(e) => updateInput('ndsPcdMm', Number(e.target.value))}
              className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-zinc-300"
            />
          </div>
        </div>

        {/* DS and NDS Flange Offsets (Center to Flange) Sliders */}
        <div className="flex flex-col gap-3 border-t border-zinc-800/40 pt-3">
          <span className="text-xs font-semibold text-zinc-300">ハブ中心〜フランジ間隔 (オチョアオフセット)</span>
          
          {/* DS Offset */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>DS (右: ドライブ側) オフセット</span>
              <span className="text-zinc-200 font-bold">{input.dsOffsetMm.toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min="15"
              max="35"
              step="0.1"
              value={input.dsOffsetMm}
              onChange={(e) => updateInput('dsOffsetMm', Number(e.target.value))}
              className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-zinc-300"
            />
          </div>

          {/* NDS Offset */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>NDS (左: 反ドライブ側) オフセット</span>
              <span className="text-zinc-200 font-bold">{input.ndsOffsetMm.toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              step="0.1"
              value={input.ndsOffsetMm}
              onChange={(e) => updateInput('ndsOffsetMm', Number(e.target.value))}
              className="w-full h-1 bg-zinc-950 rounded appearance-none cursor-pointer accent-zinc-300"
            />
          </div>
        </div>

        {/* DS Lacing Pattern */}
        <div className="flex flex-col gap-1.5 border-t border-zinc-800/40 pt-3">
          <span className="text-xs text-zinc-300 flex justify-between">
            <span>ドライブ側 (右) 組み方</span>
            <span className="font-mono text-zinc-200 font-bold">{input.dsCrossCount === 0 ? 'ラジアル (0X)' : `${input.dsCrossCount}クロス (${input.dsCrossCount}X)`}</span>
          </span>
          <div className="grid grid-cols-5 gap-1">
            {[0, 1, 2, 3, 4].map((cross) => (
              <button
                key={cross}
                onClick={() => updateInput('dsCrossCount', cross)}
                className={`text-[10px] py-1 rounded font-mono border transition-all ${
                  input.dsCrossCount === cross
                    ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200 font-bold'
                    : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                }`}
              >
                {cross === 0 ? 'Radial' : `${cross}X`}
              </button>
            ))}
          </div>
        </div>

        {/* NDS Lacing Pattern */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-zinc-300 flex justify-between">
            <span>反ドライブ側 (左) 組み方</span>
            <span className="font-mono text-zinc-200 font-bold">{input.ndsCrossCount === 0 ? 'ラジアル (0X)' : `${input.ndsCrossCount}クロス (${input.ndsCrossCount}X)`}</span>
          </span>
          <div className="grid grid-cols-5 gap-1">
            {[0, 1, 2, 3, 4].map((cross) => (
              <button
                key={cross}
                onClick={() => updateInput('ndsCrossCount', cross)}
                className={`text-[10px] py-1 rounded font-mono border transition-all ${
                  input.ndsCrossCount === cross
                    ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200 font-bold'
                    : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                }`}
              >
                {cross === 0 ? 'Radial' : `${cross}X`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset & Help Buttons */}
      <button
        onClick={resetToDefaults}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-zinc-850 bg-zinc-950/40 hover:bg-zinc-900/60 text-xs text-zinc-300 transition-all font-medium"
      >
        <RefreshCw size={12} />
        シミュレータの初期化
      </button>

      {/* Quick Theory Panel */}
      <div className="text-[10px] text-zinc-500 leading-relaxed bg-zinc-950/20 p-3 rounded-lg border border-zinc-900/60">
        <span className="font-bold text-zinc-400 block mb-1">【簡易構造力学近似の仕組み】</span>
        • <strong>静的たわみ:</strong> ライダー重量が最下部の接地面にかかることで、接地直近のスポーク張力が低下（たわみ）します。剛性の低いリムほど局所的なたわみ量が大きくなります。<br />
        • <strong>トルクねじれ:</strong> 駆動トルクによりLeading（駆動）スポークの張力が増加し、Trailing（後追い）スポークの張力が低下します。剛性の低いリムは「よじれ角」が大きくなります。
      </div>
    </div>
  );
};