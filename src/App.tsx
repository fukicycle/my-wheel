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
    <div className="w-full h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden relative font-sans">
      
      {/* PC Layout: Hyper-Modern Floating Glassmorphic Workspace */}
      <div className="hidden md:block w-full h-full relative overflow-hidden">
        
        {/* Fullscreen 3D Viewport as the background layer */}
        <div className="absolute inset-0 w-full h-full z-0">
          <WheelScene />
        </div>

        {/* Floating Left Column: Glassmorphic Control Panel */}
        <div className="absolute left-6 top-6 bottom-6 w-[340px] lg:w-[380px] bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden z-10 flex flex-col p-5">
          <ControlPanel />
        </div>

        {/* Floating Right Column: Glassmorphic Analytics Panel */}
        <div className="absolute right-6 top-6 bottom-6 w-[420px] lg:w-[480px] xl:w-[520px] bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden z-10 flex flex-col">
          <AnalyticsPanel />
        </div>

      </div>

      {/* Mobile Layout: 3-Tab Viewport to completely eliminate scroll lock issues and touch conflicts */}
      <div className="flex md:hidden flex-col w-full h-full overflow-hidden relative pb-[64px] bg-zinc-950">
        {/* Tab Content Areas */}
        <div className="flex-1 w-full h-full overflow-hidden">
          
          {/* Tab 1: 3D Visualizer */}
          {activeTab === 'visualizer' && (
            <div className="w-full h-full flex flex-col p-4 gap-4 overflow-hidden">
              {/* Context Header */}
              <div className="shrink-0 flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-sm font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent font-sans">
                  3D Studio Viewport
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Drag 360° • Zoom Pinch</span>
              </div>
              
              {/* 3D Wheel Canvas (Takes remaining space, perfectly square) */}
              <div className="flex-1 w-full rounded-2xl overflow-hidden border border-zinc-900 shadow-2xl relative">
                <WheelScene />
              </div>
              
              {/* Live Overlay Telemetry HUD (Displays vital stats in real-time under the 3D model) */}
              <div className="shrink-0 bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3.5 text-[11px] flex justify-around items-center font-mono backdrop-blur-md">
                <div className="text-center">
                  <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Max Tension</div>
                  <div className={`font-bold text-xs mt-1 ${output.maxTensionN > 1500 ? 'text-red-400' : 'text-zinc-200'}`}>
                    {Math.round(output.maxTensionN)} N
                  </div>
                </div>
                <div className="w-px h-6 bg-zinc-800/80"></div>
                <div className="text-center">
                  <div className="text-zinc-500 text-[9px] uppercase tracking-wider">NDS/DS Ratio</div>
                  <div className={`font-bold text-xs mt-1 ${output.tensionRatioPercent < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {output.tensionRatioPercent}%
                  </div>
                </div>
                <div className="w-px h-6 bg-zinc-800/80"></div>
                <div className="text-center">
                  <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Max Warp</div>
                  <div className="text-zinc-300 font-bold text-xs mt-1">
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
        <div className="absolute bottom-0 left-0 right-0 h-[64px] bg-zinc-950/80 border-t border-zinc-900 backdrop-blur-lg flex justify-around items-center px-4 z-50">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === 'visualizer'
                ? 'text-zinc-200 bg-zinc-800/40 font-semibold border border-zinc-800/50'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Eye size={18} />
            <span className="text-[10px] font-sans">3D View</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-zinc-200 bg-zinc-800/40 font-semibold border border-zinc-800/50'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Settings2 size={18} />
            <span className="text-[10px] font-sans">Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === 'analytics'
                ? 'text-zinc-200 bg-zinc-800/40 font-semibold border border-zinc-800/50'
                : 'text-zinc-500 hover:text-zinc-300'
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