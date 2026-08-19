import { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { WheelScene } from './components/WheelScene';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { BarChart2, Ruler } from 'lucide-react';
import { useWheelStore } from './store/useWheelStore';

function App() {
  const { input, updateInput } = useWheelStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAnalyticsCollapsed, setIsAnalyticsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'rider' | 'rim' | 'hub' | 'spoking'>('rider');

  // Automatically collapse both drawers by default on mobile devices
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsCollapsed(true);
      setIsAnalyticsCollapsed(true);
    }
  }, []);

  // Coordinated collapsing on mobile to prevent overlapping sheets
  const handleToggleControl = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (!collapsed && window.innerWidth < 768) {
      setIsAnalyticsCollapsed(true); // Auto-collapse analytics if control is opened
    }
  };

  const handleToggleAnalytics = (collapsed: boolean) => {
    setIsAnalyticsCollapsed(collapsed);
    if (!collapsed && window.innerWidth < 768) {
      setIsCollapsed(true); // Auto-collapse control if analytics is opened
    }
  };

  return (
    <div className="relative w-screen h-dvh overflow-hidden bg-slate-950 text-slate-100 font-sans select-none flex">
      
      {/* 100% IMMERSIVE FULL-SCREEN 3D CANVAS BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0">
        <WheelScene />
      </div>

      {/* 📐 FLOATING CAD DIMENSIONS TOGGLE (Permanently visible outside panels) */}
      <div 
        className={`absolute z-20 safe-right-pos safe-top-pos items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-900 shadow-2xl backdrop-blur-md bg-slate-950/65 select-none text-xs text-slate-300 font-medium transition-all duration-350 hover:bg-slate-950/80 hover:border-slate-800
          ${isCollapsed ? 'flex' : 'hidden md:flex'}
        `}
      >
        <span className="flex items-center gap-1.5 font-sans tracking-wide">
          <Ruler size={13} className="text-cyan-400" />
          <span className="hidden sm:inline">CAD寸法線を表示</span>
          <span className="sm:hidden">CAD寸法</span>
        </span>
        <button
          onClick={() => updateInput('showDimensions', !input.showDimensions)}
          className={`relative inline-flex items-center w-9 h-5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
            input.showDimensions ? 'bg-cyan-500' : 'bg-slate-900'
          }`}
          title="寸法線表示切り替え"
        >
          <span 
            className={`w-4 h-4 rounded-full shadow-md transition-transform duration-300 ${
              input.showDimensions 
                ? 'translate-x-4 bg-slate-950' 
                : 'translate-x-0 bg-slate-400'
            }`}
          />
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* CONTROL PANEL WIDGET (Left-anchored Figma-Style Sliding Dock Panel) */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <div 
        className={`absolute z-10 transition-all duration-500 ease-in-out flex flex-col overflow-hidden
          safe-left-pos
          safe-top-pos
          ${isCollapsed 
            ? 'w-[52px] h-[52px] max-h-[52px] md:safe-height-desktop md:max-h-none md:w-[64px]' 
            : 'safe-width-mobile safe-height-mobile md:w-[350px] lg:w-[390px] md:safe-height-desktop md:max-h-none'
          }
        `}
      >
        <ControlPanel 
          isCollapsed={isCollapsed} 
          onToggleCollapse={handleToggleControl} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* ANALYTICS PANEL WIDGET (Bottom-Right Decoupled Glassmorphic Panel) */}
      {/* ──────────────────────────────────────────────────────────────── */}

      {/* A. Collapsed State: Symmetrical circular button trigger (Always rendered for smooth transitions!) */}
      <button
        onClick={() => handleToggleAnalytics(false)}
        className={`absolute z-10 safe-right-pos safe-bottom-pos w-[52px] h-[52px] rounded-2xl flex items-center justify-center bg-slate-950/80 border border-slate-900 shadow-2xl backdrop-blur-md text-cyan-400 hover:text-cyan-300 transition-all duration-500 ease-in-out hover:scale-105 active:scale-95 ${
          isAnalyticsCollapsed 
            ? 'opacity-100 scale-100 pointer-events-auto' 
            : 'opacity-0 scale-50 pointer-events-none'
        }`}
        title="テレメトリ解析を開く"
      >
        <BarChart2 size={20} className="animate-pulse" />
      </button>

      {/* B. Expanded State: Right-bottom anchored floating card, height fits content (Math.min) with parent overflow limit */}
      <div 
        className={`absolute z-10 safe-right-pos safe-bottom-pos safe-width-mobile md:w-[500px] lg:w-[540px] safe-height-mobile md:safe-height-desktop flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${
          !isAnalyticsCollapsed 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        <AnalyticsPanel isCollapsed={isAnalyticsCollapsed} onToggleCollapse={handleToggleAnalytics} />
      </div>

    </div>
  );
}

export default App;
