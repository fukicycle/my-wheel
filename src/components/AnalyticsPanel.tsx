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
import { 
  ShieldAlert, 
  CheckCircle, 
  Activity, 
  Info, 
  ChevronRight 
} from 'lucide-react';

interface AnalyticsPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ isCollapsed: _isCollapsed, onToggleCollapse }) => {
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
          color: 'text-zinc-200 border-zinc-900 bg-zinc-950/40 shadow-inner',
          icon: <ShieldAlert className="text-red-400 shrink-0 animate-bounce" size={16} />,
        };
      }
      return {
        status: 'WARNING',
        message: '最大張力過多、または極度のテンション低下。ニップル緩みや破損リスクがあります。',
        color: 'text-zinc-300 border-zinc-900 bg-zinc-950/30',
        icon: <ShieldAlert className="text-amber-400 shrink-0" size={16} />,
      };
    }
    return {
      status: 'STABLE',
      message: '張力バランスは安全圏内です。理想的な応力伝達性能を維持しています。',
      color: 'text-zinc-300 border-zinc-900 bg-zinc-950/20',
      icon: <CheckCircle className="text-emerald-400 shrink-0" size={16} />,
    };
  };

  const health = getStabilityStatus();

  return (
    <div className="bg-slate-950/85 border border-slate-900 rounded-2xl p-4 md:p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4 md:gap-5 h-full overflow-y-auto select-none font-sans">
      
      {/* Header with Minimizer Chevron */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
        <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Activity size={13} className="text-cyan-400 animate-pulse" />
          リアルタイム・テレメトリ解析
        </h2>
        <button
          onClick={() => onToggleCollapse(true)}
          className="p-1 rounded-md border border-zinc-900 bg-zinc-950/30 hover:bg-zinc-900 text-zinc-400 transition-all"
          title="テレメトリを閉じる"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      
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
            <span className={`text-base font-mono font-bold ${output.minTensionN < 200 ? 'text-amber-500 font-extrabold' : 'text-zinc-200'}`}>
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
            <span className={`text-base font-mono font-bold ${output.tensionRatioPercent < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
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
            <span className="text-base font-mono font-bold text-amber-500">
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
            <span className={`text-base font-mono font-bold ${output.lateralDeflectionMaxMm > 0.5 ? 'text-amber-450' : 'text-cyan-400'}`}>
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
            <span className="text-base font-mono font-bold text-cyan-400">
              {((input.riderWeightKg * 9.81 * 0.5) / Math.max(1, output.rimDeformationScale * 1000 + 100)).toFixed(2)}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">mm</span>
          </div>
          <div className="text-[8px] text-zinc-500 mt-0.5">
            荷重たわみ量
          </div>
        </div>
      </div>

      {/* Structural Health Alert Banner */}
      <div className={`border p-2.5 rounded-xl flex items-start gap-2.5 transition-all text-xs leading-relaxed ${health.color}`}>
        {health.icon}
        <div>
          <span className="font-bold block mb-0.5">構造ステータス: {health.status}</span>
          {health.message}
        </div>
      </div>

      {/* Spoke Tension Graph */}
      <div className="flex flex-col gap-1">
        <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info size={12} className="text-zinc-400" />
          全スポーク張力分配分布グラフ (手組みビルダー用CADチャート)
        </h3>
        <div className="h-[140px] md:h-[160px] w-full bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-2 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                domain={[0, 1800]} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#f4f4f5',
                }}
                labelClassName="font-bold text-zinc-300"
              />
              <ReferenceLine y={input.initialTensionN} stroke="#3f3f46" strokeDasharray="4 4" label={{ value: '初期値', fill: '#71717a', position: 'insideTopLeft', fontSize: 9 }} />
              <Bar dataKey="tension" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.colorHex} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center text-[9px] text-zinc-500 mt-2 px-1 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span> 完全弛緩 (0-100N)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> 正常安全 (800-1300N)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span> 過荷重 (1500N+)
          </span>
        </div>
      </div>
    </div>
  );
};
