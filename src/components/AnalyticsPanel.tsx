import React from 'react';
import { useWheelStore } from '../store/useWheelStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { ShieldAlert, CheckCircle, Activity, Info } from 'lucide-react';

export const AnalyticsPanel: React.FC = () => {
  const { input, output } = useWheelStore();

  // Format data for Recharts with unified zinc aesthetic
  const chartData = output.spokes.map((spoke) => ({
    name: `#${spoke.id + 1}`,
    tension: Math.round(spoke.tensionN),
    side: spoke.isDriveSide ? 'DS (右)' : 'NDS (左)',
    type: spoke.isLeading ? 'Leading' : 'Trailing',
    colorHex: spoke.colorHex,
  }));

  // Analyze wheel structural health
  const getStabilityStatus = () => {
    if (output.isBucklingWarning) {
      if (output.minTensionN === 0) {
        return {
          status: 'CRITICAL',
          message: 'スポークの完全弛緩（0N）が発生。座屈および振れの発生リスクが極めて高い危険状態です。',
          color: 'text-zinc-200 border-zinc-700/80 bg-zinc-950/40 shadow-inner',
          icon: <ShieldAlert className="text-zinc-400 shrink-0" size={18} />,
        };
      }
      return {
        status: 'WARNING',
        message: '最大張力が高すぎるか、極度の張力低下が発生中。ニップル緩みや破損リスクがあります。',
        color: 'text-zinc-300 border-zinc-800/80 bg-zinc-950/30',
        icon: <ShieldAlert className="text-zinc-400 shrink-0" size={18} />,
      };
    }
    return {
      status: 'STABLE',
      message: '張力バランスは安全圏内です。極めて理想的な応力伝達性能を維持しています。',
      color: 'text-zinc-300 border-zinc-900 bg-zinc-950/15',
      icon: <CheckCircle className="text-zinc-400 shrink-0" size={18} />,
    };
  };

  const health = getStabilityStatus();

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 md:p-5 backdrop-blur-md flex flex-col gap-4 h-full overflow-y-auto select-none font-sans">
      {/* Real-time Indicators Grid */}
      <div>
        <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <Activity size={13} className="text-zinc-400" />
          リアルタイム・テレメトリ解析
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Max Tension Indicator */}
          <div className="bg-zinc-950/30 border border-zinc-900 p-2.5 rounded-lg flex flex-col justify-between shadow-sm">
            <span className="text-[10px] text-zinc-400">最大スポーク張力 (右)</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-mono font-bold ${output.maxTensionN > 1500 ? 'text-zinc-100 underline decoration-zinc-500' : 'text-zinc-200'}`}>
                {Math.round(output.maxTensionN)}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">N</span>
            </div>
            <div className="text-[8px] text-zinc-500 mt-0.5">
              限界許容: 1800 N
            </div>
          </div>

          {/* Min Tension Indicator */}
          <div className="bg-zinc-950/30 border border-zinc-900 p-2.5 rounded-lg flex flex-col justify-between shadow-sm">
            <span className="text-[10px] text-zinc-400">最小スポーク張力 (左)</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-mono font-bold ${output.minTensionN < 200 ? 'text-zinc-400 font-semibold' : 'text-zinc-200'}`}>
                {Math.round(output.minTensionN)}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">N</span>
            </div>
            <div className="text-[8px] text-zinc-500 mt-0.5">
              座屈限界: &gt;100 N
            </div>
          </div>

          {/* Tension Balance Ratio */}
          <div className="bg-zinc-950/30 border border-zinc-900 p-2.5 rounded-lg flex flex-col justify-between shadow-sm">
            <span className="text-[10px] text-zinc-400">左右張力バランス比</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-mono font-bold ${output.tensionRatioPercent < 60 ? 'text-zinc-400' : 'text-zinc-200'}`}>
                {output.tensionRatioPercent}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">%</span>
            </div>
            <div className="text-[8px] text-zinc-500 mt-0.5">
              目標推奨: &gt;60%
            </div>
          </div>

          {/* Torque Output */}
          <div className="bg-zinc-950/30 border border-zinc-900 p-2.5 rounded-lg flex flex-col justify-between shadow-sm">
            <span className="text-[10px] text-zinc-400">ハブ入力トルク</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-mono font-bold text-zinc-200">
                {output.torqueNm.toFixed(1)}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">N·m</span>
            </div>
            <div className="text-[8px] text-zinc-500 mt-0.5">
              ペダリング駆動力
            </div>
          </div>

          {/* Torque-induced Lateral Deflection */}
          <div className="bg-zinc-950/30 border border-zinc-900 p-2.5 rounded-lg flex flex-col justify-between shadow-sm">
            <span className="text-[10px] text-zinc-400">駆動時横たわみ量</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-mono font-bold ${output.lateralDeflectionMaxMm > 0.5 ? 'text-zinc-300' : 'text-zinc-200'}`}>
                {output.lateralDeflectionMaxMm.toFixed(2)}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">mm</span>
            </div>
            <div className="text-[8px] text-zinc-500 mt-0.5">
              許容限界: &lt;1.0 mm
            </div>
          </div>

          {/* Vertical Squashing deflection */}
          <div className="bg-zinc-950/30 border border-zinc-900 p-2.5 rounded-lg flex flex-col justify-between shadow-sm">
            <span className="text-[10px] text-zinc-400">接地時縦つぶれ量</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-mono font-bold text-zinc-200">
                {(output.rimDeformationScale / 0.16).toFixed(2)}
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">mm</span>
            </div>
            <div className="text-[8px] text-zinc-500 mt-0.5">
              荷重物理たわみ量
            </div>
          </div>
        </div>
      </div>

      {/* Structural Health Alert Banner */}
      <div className={`border p-2.5 rounded-lg flex items-start gap-2.5 transition-all text-xs leading-relaxed border-zinc-800/80 bg-zinc-950/20 text-zinc-300`}>
        {health.icon}
        <div>
          <span className="font-bold block mb-0.5">構造ステータス: {health.status}</span>
          {health.message}
        </div>
      </div>

      {/* Spoke Tension Graph */}
      <div className="flex-1 flex flex-col min-h-[200px]">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info size={13} className="text-zinc-400" />
          全スポーク張力分配分布グラフ
        </h3>
        <div className="flex-1 min-h-[140px] w-full bg-zinc-950/20 border border-zinc-900 rounded-lg p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#71717a" 
                fontSize={9} 
                tickLine={false} 
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={9} 
                tickLine={false} 
                domain={[0, 1800]} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#f4f4f5',
                }}
                labelClassName="font-bold text-zinc-300"
              />
              <ReferenceLine y={input.initialTensionN} stroke="#52525b" strokeDasharray="4 4" label={{ value: '初期設定値', fill: '#a1a1aa', position: 'insideTopLeft', fontSize: 9 }} />
              <Bar dataKey="tension" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.colorHex} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-2 px-1">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span> 完全弛緩 (0-100N)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> 正常安全 (800-1300N)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span> 過過重 (1500N+)
          </span>
        </div>
      </div>
    </div>
  );
};