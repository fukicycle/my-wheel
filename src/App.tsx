import { ControlPanel } from './components/ControlPanel';
import { WheelScene } from './components/WheelScene';
import { AnalyticsPanel } from './components/AnalyticsPanel';

function App() {
  return (
    <div className="w-full min-h-screen md:h-screen bg-slate-950 text-slate-100 p-3 md:p-4 flex flex-col md:flex-row gap-4 overflow-y-auto md:overflow-hidden">
      {/* Left Column: Control Panel (Second on Mobile) */}
      <div className="w-full md:w-[320px] lg:w-[360px] shrink-0 h-auto md:h-full flex flex-col bg-slate-900/30 border border-slate-900 rounded-2xl p-4 md:p-5 shadow-2xl overflow-visible md:overflow-hidden order-2 md:order-1">
        <ControlPanel />
      </div>

      {/* Center Column: Interactive 3D Visualizer (First on Mobile, Square Aspect Ratio on PC) */}
      <div className="w-full h-[340px] md:h-full md:aspect-square md:max-w-[calc(100vh-2rem)] md:max-h-[calc(100vh-2rem)] relative shrink-0 order-1 md:order-2">
        <WheelScene />
      </div>

      {/* Right Column: Numerical Telemetry & Graphs (Third on Mobile) */}
      <div className="w-full md:flex-1 h-auto md:h-full flex flex-col shrink-0 order-3">
        <AnalyticsPanel />
      </div>
    </div>
  );
}

export default App;
