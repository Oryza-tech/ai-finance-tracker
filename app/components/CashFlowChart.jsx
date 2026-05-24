import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';

const timeRanges = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatXTick(value, range) {
  if (!value) return '';
  if (range === 'weekly') {
    // value: 'MM-DD'
    const now = new Date();
    const d = new Date(`${now.getFullYear()}-${value}`);
    return isNaN(d) ? value : d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  if (range === 'monthly') return `${parseInt(value, 10)}`; // '05' → '5'
  if (range === 'yearly') return MONTH_NAMES[parseInt(value, 10) - 1] || value;
  return value;
}

function formatYTick(value) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value;
}

export default function CashFlowChart({ chartData, CustomTooltip, onRangeChange, selectedRange }) {
  const hasData = chartData.length > 0;

  return (
    <div className="col-span-2 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col h-80">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h4 className="text-white font-bold text-lg">Cash Flow Analysis</h4>
          <p className="text-slate-400 text-xs mt-0.5">Income · Expense · Cumulative Net</p>
        </div>
        <div className="flex gap-2">
          {timeRanges.map(r => (
            <button
              key={r.value}
              onClick={() => onRangeChange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                selectedRange === r.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-[#1e293b] text-slate-400 border-slate-700 hover:bg-blue-500/20'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="tanggal"
                stroke="#475569"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatXTick(v, selectedRange)}
              />
              <YAxis
                stroke="#475569"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYTick}
              />
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b80' }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '4px' }}
              />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={32} opacity={0.9} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={32} opacity={0.9} />
              <Line
                type="monotone"
                dataKey="net"
                name="Net Balance"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm">No chart data available</div>
        )}
      </div>
    </div>
  );
}
