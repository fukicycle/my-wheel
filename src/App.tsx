import { useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { WheelScene } from './components/WheelScene';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { useWheelStore } from './store/useWheelStore';
import { Eye, Settings2, BarChart3 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'settings' | 'analytics'>('visualizer');
  const { output } = useWheelStore();

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      
      {/* PC Layout: Professional Golden 2-Column Split */}
      <div className="hidden md:flex flex-row w-full h-full p-4 gap-4 overflow-hidden">
        {/* Left Column: Control Panel (Dedicated Settings Column) */}
        <div className="w-[340px] lg:w-[380px] shrink-0 h-full flex flex-col bg-slate-900/30 border border-slate-900 rounded-2xl p-4 lg:p-5 shadow-2xl overflow-hidden">
          <ControlPanel />
        </div>

        {/* Right Column: 3D Visualizer on top (Square) & Analytics on bottom (Full Width) */}
        <div className="flex-1 h-full flex flex-col gap-4 overflow-hidden">
          {/* Top: 3D Visualizer, centered and dynamically scaled to remain perfectly square */}
          <div className="flex-1 min-h-[250px] w-full flex items-center justify-center relative overflow-hidden bg-slate-950 rounded-2xl border border-slate-900/40">
            <div className="h-full aspect-square max-w-full max-h-full relative">
              <WheelScene />
            </div>
          </div>

          {/* Bottom: Analytics Panel, gets the entire remaining width for rich details */}
          <div className="h-[360px] lg:h-[390px] shrink-0 w-full overflow-hidden">
            <AnalyticsPanel />
          </div>
        </div>
      </div>

      {/* Mobile Layout: 3-Tab Viewport to completely eliminate scroll lock issues and touch conflicts */}
      <div className="flex md:hidden flex-col w-full h-full overflow-hidden relative pb-[64px]">
        {/* Tab Content Areas */}
        <div className="flex-1 w-full h-full overflow-hidden">
          
          {/* Tab 1: 3D Visualizer */}
          {activeTab === 'visualizer' && (
            <div className="w-full h-full flex flex-col p-4 gap-4 overflow-hidden">
              {/* Context Header */}
              <div className="shrink-0 flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-sans">
                  3D Studio Viewport
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Drag 360° • Zoom Pinch</span>
              </div>
              
              {/* 3D Wheel Canvas (Takes remaining space, perfectly square) */}
              <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-900 shadow-2xl relative">
                <WheelScene />
              </div>
              
              {/* Live Overlay Telemetry HUD (Displays vital stats in real-time under the 3D model) */}
              <div className="shrink-0 bg-slate-900/50 border border-slate-900/60 rounded-xl p-3.5 text-[11px] flex justify-around items-center font-mono backdrop-blur-md">
                <div className="text-center">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider">Max Tension</div>
                  <div className={`font-bold text-xs mt-1 ${output.maxTensionN > 1500 ? 'text-red-400' : 'text-slate-200'}`}>
                    {Math.round(output.maxTensionN)} N
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-800/80"></div>
                <div className="text-center">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider">NDS/DS Ratio</div>
                  <div className={`font-bold text-xs mt-1 ${output.tensionRatioPercent < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {output.tensionRatioPercent}%
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-800/80"></div>
                <div className="text-center">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider">Max Warp</div>
                  <div className="text-cyan-400 font-bold text-xs mt-1">
                    {output.lateralDeflectionMaxMm.toFixed(2)} mm
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Settings (Control Panel) */}
          {activeTab === 'settings' && (
            <div className="w-full h-full p-4 overflow-hidden">
              <ControlPanel />
            </div>
          )}

          {/* Tab 3: Detailed Analytics (Analytics Panel) */}
          {activeTab === 'analytics' && (
            <div className="w-full h-full p-4 overflow-hidden">
              <AnalyticsPanel />
            </div>
          )}

        </div>

        {/* Bottom Tab Bar (Beautiful Glassmorphic Design) */}
        <div className="absolute bottom-0 left-0 right-0 h-[64px] bg-slate-950/80 border-t border-slate-900 backdrop-blur-lg flex justify-around items-center px-4 z-50">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === 'visualizer'
                ? 'text-cyan-400 bg-cyan-500/10 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye size={18} />
            <span className="text-[10px] font-sans">3D View</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-cyan-400 bg-cyan-500/10 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings2 size={18} />
            <span className="text-[10px] font-sans">Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === 'analytics'
                ? 'text-cyan-400 bg-cyan-500/10 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 size={18} />
            <span className="text-[10px] font-sans">Analytics</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;