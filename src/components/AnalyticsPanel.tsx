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

  // Format data for Recharts
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
          message: 'スポークの完全弛緩（0N）が発生しています。座屈およびホイールの振れが極めて発生しやすい危険状態です。',
          color: 'text-red-400 border-red-900/50 bg-red-950/20',
          icon: <ShieldAlert className="text-red-400 shrink-0" size={18} />,
        };
      }
      return {
        status: 'WARNING',
        message: '最大張力が高すぎるか、極度の張力低下が発生しています。ニップル緩みやスポーク破損リスクがあります。',
        color: 'text-amber-400 border-amber-900/50 bg-amber-950/20',
        icon: <ShieldAlert className="text-amber-400 shrink-0" size={18} />,
      };
    }
    return {
      status: 'STABLE',
      message: '張力バランスは安全圏内です。理想的な応力伝達性能を維持しています。',
      color: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/20',
      icon: <CheckCircle className="text-emerald-400 shrink-0" size={18} />,
    };
  };

  const health = getStabilityStatus();

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-5 backdrop-blur-md flex flex-col gap-4 h-full overflow-y-auto">
      {/* Real-time Indicators Grid */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <Activity size={14} className="text-cyan-400" />
          リアルタイム・テレメトリ解析
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Max Tension Indicator */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">最大スポーク張力 (右)</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-mono font-bold ${output.maxTensionN > 1500 ? 'text-red-400' : 'text-slate-100'}`}>
                {Math.round(output.maxTensionN)}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">N</span>
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              限界許容: 1800 N
            </div>
          </div>

          {/* Min Tension Indicator */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">最小スポーク張力 (左)</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-mono font-bold ${output.minTensionN < 200 ? 'text-amber-400' : 'text-slate-100'}`}>
                {Math.round(output.minTensionN)}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">N</span>
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              座屈限界: &gt;100 N
            </div>
          </div>

          {/* Tension Balance Ratio */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">左右張力バランス比</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-mono font-bold ${output.tensionRatioPercent < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {output.tensionRatioPercent}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">%</span>
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              目標推奨: &gt;60%
            </div>
          </div>

          {/* Torque Output */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">ハブ入力トルク</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-mono font-bold text-amber-400">
                {output.torqueNm.toFixed(1)}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">N·m</span>
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              ペダリング駆動力
            </div>
          </div>

          {/* Torque-induced Lateral Deflection */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">駆動時横たわみ量</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-mono font-bold ${output.lateralDeflectionMaxMm > 0.5 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {output.lateralDeflectionMaxMm.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">mm</span>
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              許容限界: &lt;1.0 mm
            </div>
          </div>

          {/* Vertical Squashing deflection */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] text-slate-400">接地時縦つぶれ量</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-mono font-bold text-cyan-400">
                {((input.riderWeightKg * 9.81 * 0.5) / Math.max(1, output.rimDeformationScale * 1000 + 100)).toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">mm</span>
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              荷重たわみ量
            </div>
          </div>
        </div>
      </div>

      {/* Structural Health Alert Banner */}
      <div className={`border p-2.5 rounded-lg flex items-start gap-2.5 transition-all text-xs leading-relaxed ${health.color}`}>
        {health.icon}
        <div>
          <span className="font-bold block mb-0.5">構造ステータス: {health.status}</span>
          {health.message}
        </div>
      </div>

      {/* Spoke Tension Graph */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info size={13} className="text-slate-400" />
          全スポーク張力分配分布グラフ (手組みビルダー用CADチャート)
        </h3>
        <div className="flex-1 min-h-[140px] w-full bg-slate-950/40 border border-slate-900/60 rounded-lg p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                domain={[0, 1800]} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#f8fafc',
                }}
                labelClassName="font-bold text-slate-300"
              />
              <ReferenceLine y={input.initialTensionN} stroke="#475569" strokeDasharray="4 4" label={{ value: '初期値', fill: '#94a3b8', position: 'insideTopLeft', fontSize: 9 }} />
              <Bar dataKey="tension" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.colorHex} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-1">
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
