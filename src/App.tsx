import { ControlPanel } from './components/ControlPanel';
import { WheelScene } from './components/WheelScene';
import { AnalyticsPanel } from './components/AnalyticsPanel';

function App() {
  return (
    <div className="w-screen min-h-screen md:h-screen bg-slate-950 text-slate-100 p-3 md:p-4 flex flex-col md:flex-row gap-4 overflow-y-auto md:overflow-hidden">
      {/* Left Column: Control Panel */}
      <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 h-auto md:h-full flex flex-col bg-slate-900/30 border border-slate-900 rounded-2xl p-4 md:p-5 shadow-2xl overflow-hidden">
        <ControlPanel />
      </div>

      {/* Right Column: Visualization & Analytics */}
      <div className="flex-1 h-auto md:h-full flex flex-col gap-4 overflow-y-auto md:overflow-hidden">
        {/* Top Section: Interactive 3D Visualizer */}
        <div className="w-full h-[340px] md:flex-1 relative shrink-0 md:shrink">
          <WheelScene />
        </div>

        {/* Bottom Section: Numerical Telemetry & Graphs */}
        <div className="w-full h-auto md:h-[360px] lg:h-[390px] shrink-0">
          <AnalyticsPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
