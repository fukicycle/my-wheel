import React from 'react';
import { useWheelStore, getMaxCrossCount } from '../store/useWheelStore';
import { RIM_PRESETS } from '../lib/physicsEngine';
import { 
  Weight, 
  Zap, 
  Settings2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  User, 
  Disc, 
  Maximize2,
  Circle,
  Ruler
} from 'lucide-react';

interface ControlPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  activeTab: 'rider' | 'rim' | 'hub' | 'spoking';
  setActiveTab: (tab: 'rider' | 'rim' | 'hub' | 'spoking') => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  isCollapsed, 
  onToggleCollapse,
  activeTab,
  setActiveTab
}) => {
  const { input, updateInput, setPreset, resetToDefaults } = useWheelStore();

  const is2to1 = input.lacingRatio === '2:1';
  const dsSpokes = is2to1 ? Math.round(input.spokeCount * 2 / 3) : input.spokeCount / 2;
  const ndsSpokes = is2to1 ? Math.round(input.spokeCount / 3) : input.spokeCount / 2;

  const maxDsCross = getMaxCrossCount(dsSpokes);
  const maxNdsCross = getMaxCrossCount(ndsSpokes);

  // Switch tab and expand
  const handleTabClick = (tab: 'rider' | 'rim' | 'hub' | 'spoking') => {
    setActiveTab(tab);
    if (isCollapsed) {
      onToggleCollapse(false); // Animate open
    }
  };

  // Figma-Style Glassmorphism Sidebar
  return (
    <div 
      className={`w-full relative flex flex-col justify-between transition-all duration-500 ease-in-out select-none border border-slate-900 shadow-2xl backdrop-blur-md bg-slate-950/80 rounded-2xl ${
        isCollapsed 
          ? 'h-full max-h-full md:h-full' 
          : 'h-fit max-h-full md:h-full'
      }`}
    >
      {/* ──────────────────────────────────────────────────────────────── */}
      {/* MINIMIZED SIDEBAR: Figma Floating Tool-Bar with Glassmorphism */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div 
        className={`absolute inset-0 flex flex-col items-center py-0 md:py-4 h-full justify-center md:justify-between w-full transition-all duration-500 ease-in-out ${
          isCollapsed 
            ? 'opacity-100 scale-100 pointer-events-auto' 
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
          <div className="flex flex-col items-center gap-5 w-full justify-center">
            {/* Expand Chevron */}
            <button
              onClick={() => onToggleCollapse(false)}
              className="p-2.5 rounded-full md:rounded-xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900 text-cyan-400 transition-all shadow-md flex items-center justify-center animate-pulse"
              title="詳細設定を開く"
            >
              <ChevronRight size={16} />
            </button>

            {/* Desktop Only: Full Vertical Glass Tool Dock */}
            <div className="hidden md:flex flex-col items-center gap-4 w-full">
              <div className="w-8 h-px bg-slate-900 my-1" />

              {/* Tab 1: Rider Weight / Power Icon */}
              <button
                onClick={() => handleTabClick('rider')}
                className={`p-2 rounded-xl border transition-all shadow-sm flex items-center justify-center ${
                  activeTab === 'rider'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-bold scale-110'
                    : 'bg-slate-950/40 border-transparent hover:border-slate-900 text-slate-400'
                }`}
                title="基本荷重・パワー設定"
              >
                <User size={18} />
              </button>

              {/* Tab 2: Rim Specs Icon */}
              <button
                onClick={() => handleTabClick('rim')}
                className={`p-2 rounded-xl border transition-all shadow-sm flex items-center justify-center ${
                  activeTab === 'rim'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-bold scale-110'
                    : 'bg-slate-950/40 border-transparent hover:border-slate-900 text-slate-400'
                }`}
                title="リム仕様設計"
              >
                <Circle size={15} />
              </button>

              {/* Tab 3: Hub Geometry Icon */}
              <button
                onClick={() => handleTabClick('hub')}
                className={`p-2 rounded-xl border transition-all shadow-sm flex items-center justify-center ${
                  activeTab === 'hub'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-bold scale-110'
                    : 'bg-slate-950/40 border-transparent hover:border-slate-900 text-slate-400'
                }`}
                title="ハブ寸法設計"
              >
                <Settings2 size={18} />
              </button>

              {/* Tab 4: Spoking Options Icon */}
              <button
                onClick={() => handleTabClick('spoking')}
                className={`p-2 rounded-xl border transition-all shadow-sm flex items-center justify-center ${
                  activeTab === 'spoking'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-bold scale-110'
                    : 'bg-slate-950/40 border-transparent hover:border-slate-900 text-slate-400'
                }`}
                title="スポーク組み方仕様"
              >
                <Disc size={18} />
              </button>
            </div>
          </div>

          {/* Desktop Only: Reset Button at Bottom */}
          <div className="hidden md:flex flex-col items-center gap-4">
            <button
              onClick={resetToDefaults}
              className="p-2 rounded-xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-all shadow-sm"
              title="初期化"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* EXPANDED SIDEBAR: Tabbed, highly organised dashboard layout */}
        {/* ──────────────────────────────────────────────────────────────── */}
        <div 
          className={`flex flex-col justify-between gap-4 overflow-y-auto w-full p-4 md:p-6 transition-all duration-500 ease-in-out ${
            !isCollapsed 
              ? 'relative h-fit max-h-full md:h-full opacity-100 scale-100 pointer-events-auto' 
              : 'absolute inset-0 h-full opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex flex-col gap-4 md:gap-5">
            {/* Sidebar Header with Collapse Button */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h1 className="text-sm md:text-base font-bold uppercase tracking-wider text-slate-200">
                  Wheel CAD Studio 1.0
                </h1>
              </div>
              <button
                onClick={() => onToggleCollapse(true)}
                className="p-1 md:p-1.5 rounded-md border border-slate-900 bg-slate-950/30 hover:bg-slate-900 text-slate-400 transition-all"
                title="最小化"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            {/* Figma-Style Segmented Tab Controllers */}
            <div className="grid grid-cols-4 gap-0.5 bg-slate-950/60 p-0.5 rounded-xl border border-slate-900 shadow-inner">
              <button
                onClick={() => setActiveTab('rider')}
                className={`text-[9px] md:text-xs py-1.5 md:py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                  activeTab === 'rider'
                    ? 'bg-slate-900 text-cyan-400 font-bold shadow-sm border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User size={12} />
                荷重
              </button>
              <button
                onClick={() => setActiveTab('rim')}
                className={`text-[9px] md:text-xs py-1.5 md:py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                  activeTab === 'rim'
                    ? 'bg-slate-900 text-cyan-400 font-bold shadow-sm border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Circle size={11} />
                リム
              </button>
              <button
                onClick={() => setActiveTab('hub')}
                className={`text-[9px] md:text-xs py-1.5 md:py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                  activeTab === 'hub'
                    ? 'bg-slate-900 text-cyan-400 font-bold shadow-sm border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings2 size={12} />
                ハブ設計
              </button>
              <button
                onClick={() => setActiveTab('spoking')}
                className={`text-[9px] md:text-xs py-1.5 md:py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                  activeTab === 'spoking'
                    ? 'bg-slate-900 text-cyan-400 font-bold shadow-sm border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Disc size={12} />
                スポーク
              </button>
            </div>

            {/* ──────────────────────────────────────────────────────── */}
            {/* TAB CONTENT 1: Rider weight, Pedaling Power, Deform Amp */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'rider' && (
              <div className="flex flex-col gap-4 md:gap-5 animate-fadeIn">
                {/* Rider Weight Slider */}
                <div className="flex flex-col gap-2 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-slate-300 flex items-center gap-1.5">
                      <Weight size={13} className="text-slate-400" />
                      ライダー体重
                    </span>
                    <span className="text-xs md:text-sm font-mono font-bold text-cyan-400">{input.riderWeightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="1"
                    value={input.riderWeightKg}
                    onChange={(e) => updateInput('riderWeightKg', Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[8px] md:text-[9px] text-zinc-500 font-mono">
                    <span>0 kg (無負荷)</span>
                    <span>60 kg</span>
                    <span>120 kg</span>
                  </div>
                </div>

                {/* Power Slider */}
                <div className={`flex flex-col gap-2 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner transition-opacity ${input.hubType === 'front' ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-slate-300 flex items-center gap-1.5">
                      <Zap size={13} className="text-slate-400" />
                      ペダリングパワー
                    </span>
                    <span className="text-xs md:text-sm font-mono font-bold text-amber-400">{input.powerWatts} W</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1400"
                    step="50"
                    value={input.powerWatts}
                    disabled={input.hubType === 'front'}
                    onChange={(e) => updateInput('powerWatts', Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[8px] md:text-[9px] text-zinc-500 font-mono">
                    <span>0 W</span>
                    <span>700 W (スプリント)</span>
                    <span>1400 W (プロ)</span>
                  </div>
                </div>

                {input.hubType === 'front' && (
                  <div className="text-[10px] md:text-xs text-zinc-500 italic text-center border border-zinc-900/60 bg-zinc-950/20 py-2 rounded-md">
                    ※フロントハブはペダリング駆動（トルク）を受けません。
                  </div>
                )}

                {/* Visual Deformation Magnification Slider */}
                <div className="flex flex-col gap-2 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-slate-300 flex items-center gap-1.5">
                      <Maximize2 size={13} className="text-slate-400" />
                      変形可視化倍率
                    </span>
                    <span className="text-xs md:text-sm font-mono font-bold text-cyan-400">
                      {input.deformAmp} 倍
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={input.deformAmp}
                    onChange={(e) => updateInput('deformAmp', Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[8px] md:text-[9px] text-zinc-500 font-mono">
                    <span>1 倍 (標準)</span>
                    <span>5 倍 (よれ判別)</span>
                    <span>10 倍 (最大強調)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* TAB CONTENT 2: Rim Specifications (Completely Isolated!) */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'rim' && (
              <div className="flex flex-col gap-4 md:gap-5 animate-fadeIn text-slate-100">
                {/* Rim Selection */}
                <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-xs md:text-sm font-semibold text-slate-300">リムハイト規格プリセット</span>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {Object.values(RIM_PRESETS).map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setPreset(preset.id)}
                        className={`text-xs md:text-sm py-2 md:py-2.5 px-3.5 rounded-lg border text-left flex justify-between transition-all ${
                          input.rimPresetId === preset.id
                            ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                            : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>{preset.name}</span>
                        <span className="font-mono text-[9px] md:text-xs text-slate-500">
                          {preset.depth}mm / {preset.mass}g
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Note on Rim Stiffness */}
                <div className="text-[10px] md:text-xs text-zinc-500 leading-relaxed bg-zinc-950/20 p-3.5 rounded-xl border border-zinc-900">
                  <span className="font-bold text-zinc-400 block mb-1">【リム仕様と力学的関係】</span>
                  カーボン製50mmハイトなどの「ディープリム」は縦横の構造剛性が極めて高く、荷重つぶれや駆動時のよじれに対して非常に強い特性を持ちます。対して24mmアルミなどの「シャローリム」は、柔軟性に優れ軽量ですが、同じ荷重・トルク下での変形幅が大きくなります。
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* TAB CONTENT 3: Hub configurations, PCD, Offsets */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'hub' && (
              <div className="flex flex-col gap-4 md:gap-5 animate-fadeIn text-slate-100">
                {/* CAD寸法線表示切り替え */}
                <div className="flex items-center justify-between bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-xs md:text-sm text-slate-300 flex items-center gap-1.5 font-medium">
                    <Ruler size={13} className="text-cyan-400" />
                    CAD寸法線を表示
                  </span>
                  <label className="relative flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={input.showDimensions}
                      onChange={() => updateInput('showDimensions', !input.showDimensions)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950"></div>
                  </label>
                </div>

                {/* Hub配置区分 (前後切り替え) */}
                <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-xs text-slate-300">ハブ配置区分 (前後切り替え)</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => updateInput('hubType', 'front')}
                      className={`text-xs md:text-sm py-1.5 md:py-2.5 rounded-lg border transition-all ${
                        input.hubType === 'front'
                          ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                          : 'bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                      }`}
                    >
                      フロントハブ
                    </button>
                    <button
                      onClick={() => updateInput('hubType', 'rear')}
                      className={`text-xs md:text-sm py-1.5 md:py-2.5 rounded-lg border transition-all ${
                        input.hubType === 'rear'
                          ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                          : 'bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                      }`}
                    >
                      リアハブ
                    </button>
                  </div>
                </div>

                {/* Hub Presets (Automatic) */}
                <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-xs text-slate-300">ハブ設計規格 (一括適用プリセット)</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => {
                        updateInput('isDiscBrake', false);
                        const isFr = input.hubType === 'front';
                        updateInput('dsPcdMm', isFr ? 38 : 58);
                        updateInput('ndsPcdMm', isFr ? 38 : 44);
                        updateInput('dsOffsetMm', isFr ? 38 : 19);
                        updateInput('ndsOffsetMm', isFr ? 38 : 37);
                      }}
                      className={`text-xs md:text-sm py-1.5 md:py-2.5 rounded-lg border transition-all ${
                        !input.isDiscBrake
                          ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                          : 'bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {input.hubType === 'front' ? 'フロントリム' : 'リアリム'}
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
                      className={`text-xs md:text-sm py-1.5 md:py-2.5 rounded-lg border transition-all ${
                        input.isDiscBrake
                          ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                          : 'bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {input.hubType === 'front' ? 'フロントディスク' : 'リアディスク'}
                    </button>
                  </div>
                </div>

                {/* PCD Sliders */}
                <div className="flex flex-col gap-4 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-xs md:text-sm font-semibold text-slate-300">ハブ穴径 (PCD) の左右設計</span>
                  
                  {/* DS PCD */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] md:text-xs text-zinc-400 font-mono">
                      <span>DS (右) PCD</span>
                      <span className="text-cyan-400 font-bold">{input.dsPcdMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      step="2"
                      value={input.dsPcdMm}
                      onChange={(e) => updateInput('dsPcdMm', Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* NDS PCD */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] md:text-xs text-zinc-400 font-mono">
                      <span>NDS (左) PCD</span>
                      <span className="text-cyan-400 font-bold">{input.ndsPcdMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      step="2"
                      value={input.ndsPcdMm}
                      onChange={(e) => updateInput('ndsPcdMm', Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>

                {/* Offsets Sliders */}
                <div className="flex flex-col gap-4 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-xs md:text-sm font-semibold text-slate-300">ハブ中心〜フランジ間隔</span>
                  
                  {/* DS Offset */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] md:text-xs text-zinc-400 font-mono">
                      <span>DS (右) オフセット</span>
                      <span className="text-cyan-400 font-bold">{input.dsOffsetMm.toFixed(1)} mm</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="45"
                      step="0.5"
                      value={input.dsOffsetMm}
                      onChange={(e) => updateInput('dsOffsetMm', Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* NDS Offset */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] md:text-xs text-zinc-400 font-mono">
                      <span>NDS (左) オフセット</span>
                      <span className="text-cyan-400 font-bold">{input.ndsOffsetMm.toFixed(1)} mm</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="50"
                      step="0.5"
                      value={input.ndsOffsetMm}
                      onChange={(e) => updateInput('ndsOffsetMm', Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* TAB CONTENT 4: Spoking options, spoke ratio, cross counts */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'spoking' && (
              <div className="flex flex-col gap-4 md:gap-5 animate-fadeIn text-slate-100">
                {/* Spoke Count Selector */}
                <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <label className="text-xs md:text-sm text-slate-300 flex justify-between font-medium">
                    <span>スポーク本数</span>
                    <span className="font-mono text-cyan-400 font-bold">{input.spokeCount} 本</span>
                  </label>
                  <div className="grid grid-cols-6 gap-1 mt-1">
                    {[20, 21, 24, 28, 32, 36].map((count) => (
                      <button
                        key={count}
                        onClick={() => updateInput('spokeCount', count)}
                        className={`text-[10px] md:text-xs py-1.5 md:py-2 rounded-lg font-mono border transition-all ${
                          input.spokeCount === count
                            ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                            : 'bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {count}H
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spoke Ratio Selector (1:1 vs 2:1) */}
                {input.hubType === 'rear' && (
                  <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                    <span className="text-xs md:text-sm text-slate-300">スポーク本数比率 (左右配分)</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={() => updateInput('lacingRatio', '1:1')}
                        className={`text-xs md:text-sm py-1.5 md:py-2.5 rounded-lg border transition-all ${
                          input.lacingRatio === '1:1'
                            ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                            : 'bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                        }`}
                      >
                        1:1 等間隔組み
                      </button>
                      <button
                        onClick={() => updateInput('lacingRatio', '2:1')}
                        disabled={input.spokeCount % 3 !== 0}
                        className={`text-xs md:text-sm py-1.5 md:py-2.5 rounded-lg border transition-all ${
                          input.spokeCount % 3 !== 0
                            ? 'opacity-30 cursor-not-allowed border-zinc-900 text-zinc-600'
                            : input.lacingRatio === '2:1'
                            ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                            : 'bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                        }`}
                      >
                        2:1 Triplet (G3風)
                      </button>
                    </div>
                    {input.spokeCount % 3 !== 0 ? (
                      <p className="text-[10px] text-amber-500 font-semibold leading-tight mt-1">
                        ※2:1組みは本数が3の倍数の時のみ選択可能です。（現在は{input.spokeCount}Hのため無効）
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-400 leading-tight mt-1">
                        ※2:1組みは右側（DS）に2本のスポーク、左側（NDS）に1本を配置し、おちょこによる張力不均衡を解消します。
                      </p>
                    )}
                  </div>
                )}

                {/* Initial Tension Slider */}
                <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-slate-300 font-medium">初期スポーク張力</span>
                    <span className="text-xs md:text-sm font-mono font-bold text-cyan-400">{input.initialTensionN} N</span>
                  </div>
                  <input
                    type="range"
                    min="800"
                    max="1400"
                    step="50"
                    value={input.initialTensionN}
                    onChange={(e) => updateInput('initialTensionN', Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[8px] md:text-[9px] text-zinc-500 font-mono">
                    <span>800 N (低)</span>
                    <span>1100 N (標準)</span>
                    <span>1400 N (高)</span>
                  </div>
                </div>

                {/* DS Lacing Pattern */}
                <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-xs md:text-sm text-slate-300 flex justify-between">
                    <span>ドライブ側 (右) 組み方</span>
                    <span className="font-mono text-cyan-400 font-bold">{input.dsCrossCount === 0 ? 'ラジアル (0X)' : `${input.dsCrossCount}クロス (${input.dsCrossCount}X)`}</span>
                  </span>
                  <div className="grid grid-cols-5 gap-1 mt-1">
                    {[0, 1, 2, 3, 4].map((cross) => {
                      const isDisabled = cross > maxDsCross;
                      return (
                        <button
                          key={cross}
                          disabled={isDisabled}
                          onClick={() => updateInput('dsCrossCount', cross)}
                          className={`text-[10px] md:text-xs py-1.5 rounded-lg font-mono border transition-all ${
                            isDisabled
                              ? 'opacity-25 cursor-not-allowed border-zinc-950/40 bg-zinc-950/20 text-zinc-600'
                              : input.dsCrossCount === cross
                              ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                              : 'bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {cross === 0 ? 'Radial' : `${cross}X`}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-tight mt-1">
                    ※右側本数 ({dsSpokes}本) に対する物理限界: 最大 {maxDsCross}X
                  </p>
                </div>

                {/* NDS Lacing Pattern */}
                <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <span className="text-xs md:text-sm text-slate-300 flex justify-between font-medium">
                    <span>反ドライブ側 (左) 組み方</span>
                    <span className="font-mono text-cyan-400 font-bold">{input.ndsCrossCount === 0 ? 'ラジアル (0X)' : `${input.ndsCrossCount}クロス (${input.ndsCrossCount}X)`}</span>
                  </span>
                  <div className="grid grid-cols-5 gap-1 mt-1">
                    {[0, 1, 2, 3, 4].map((cross) => {
                      const isDisabled = cross > maxNdsCross;
                      return (
                        <button
                          key={cross}
                          disabled={isDisabled}
                          onClick={() => updateInput('ndsCrossCount', cross)}
                          className={`text-[10px] md:text-xs py-1.5 rounded-lg font-mono border transition-all ${
                            isDisabled
                              ? 'opacity-25 cursor-not-allowed border-zinc-950/40 bg-zinc-950/20 text-zinc-600'
                              : input.ndsCrossCount === cross
                              ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 font-bold shadow-md'
                              : 'bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {cross === 0 ? 'Radial' : `${cross}X`}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-tight mt-1">
                    ※左側本数 ({ndsSpokes}本) に対する物理限界: {maxNdsCross === 0 ? '奇数のため Radial(0X) 限定' : `最大 ${maxNdsCross}X`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Expanded Bottom Panel Buttons */}
          <div className="flex flex-col gap-1.5 border-t border-slate-900 pt-3">
            <button
              onClick={resetToDefaults}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-slate-900 bg-slate-950/40 hover:bg-slate-900/60 text-xs md:text-sm text-slate-300 transition-all font-medium shadow-sm"
            >
              <RefreshCw size={12} />
              シミュレータの初期化
            </button>
          </div>
        </div>
    </div>
  );
};
