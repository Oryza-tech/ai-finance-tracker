"use client";

import { useState, useEffect, useMemo } from "react";
import { Filter, ArrowDownToLine, ArrowUpFromLine, Percent, Flame, TrendingDown, PieChart as PieIcon, AlertTriangle } from "lucide-react";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import { APP_CONFIG, formatRupiah } from "../../lib/config";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState([]);
  const [timeRange, setTimeRange] = useState("this_month");

  useEffect(() => {
    supabase.from("transactions").select("*").order('tanggal', { ascending: true })
      .then(({ data, error }) => { if (!error && data) setTransactions(data); });
  }, []);

  const filteredData = useMemo(() => {
    const now = new Date();
    const cy = now.getFullYear(), cm = now.getMonth();
    return transactions.filter((t) => {
      const d = new Date(t.tanggal);
      if (timeRange === "this_month") return d.getFullYear() === cy && d.getMonth() === cm;
      if (timeRange === "last_month") {
        const lm = cm === 0 ? 11 : cm - 1, ly = cm === 0 ? cy - 1 : cy;
        return d.getFullYear() === ly && d.getMonth() === lm;
      }
      if (timeRange === "this_year") return d.getFullYear() === cy;
      return true;
    });
  }, [transactions, timeRange]);

  const metrics = useMemo(() => {
    let totalIncome = 0, totalExpense = 0;
    const categoryMap = {}, trendMap = {}, monthMap = {};
    let largestExpense = 0, largestExpenseDesc = "—";

    filteredData.forEach((t) => {
      const nominal = Number(t.nominal) || 0;
      const dateLabel = new Date(t.tanggal).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const monthLabel = new Date(t.tanggal).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!trendMap[dateLabel]) trendMap[dateLabel] = { tanggal: dateLabel, income: 0, expense: 0 };
      if (!monthMap[monthLabel]) monthMap[monthLabel] = { month: monthLabel, income: 0, expense: 0 };

      if (t.tipe === "pemasukan") {
        totalIncome += nominal;
        trendMap[dateLabel].income += nominal;
        monthMap[monthLabel].income += nominal;
      } else {
        totalExpense += nominal;
        trendMap[dateLabel].expense += nominal;
        monthMap[monthLabel].expense += nominal;
        categoryMap[t.kategori || "Umum"] = (categoryMap[t.kategori || "Umum"] || 0) + nominal;
        if (nominal > largestExpense) { largestExpense = nominal; largestExpenseDesc = t.deskripsi; }
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRatio = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;
    const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0;

    // Burn rate: avg daily expense over days that had transactions
    const expenseDays = Object.values(trendMap).filter(d => d.expense > 0).length || 1;
    const burnRate = totalExpense / expenseDays;

    // Top category
    const topCat = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
    const topCatName = topCat ? topCat[0] : "—";
    const topCatPct = topCat && totalExpense > 0 ? ((topCat[1] / totalExpense) * 100).toFixed(1) : 0;

    const pieChartData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const barChartData = Object.values(trendMap);
    const monthlyData = Object.values(monthMap).map(m => ({ ...m, net: m.income - m.expense }));

    return {
      totalIncome, totalExpense, netSavings, savingsRatio, expenseRatio,
      burnRate, largestExpense, largestExpenseDesc,
      topCatName, topCatPct,
      pieChartData, barChartData, monthlyData,
    };
  }, [filteredData]);

  const CustomTooltipBar = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0f172a] border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-300 text-xs mb-2">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="font-bold text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatRupiah(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans relative overflow-hidden">
      <Sidebar userName={APP_CONFIG.userName} currentPage="analytics" />
      <main className="flex-1 p-10 overflow-y-auto relative z-10">

        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Financial Analytics</h2>
            <p className="text-slate-400 text-sm">Professional breakdown of your financial health and spending behavior.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-800 px-4 py-2.5 rounded-xl shadow-lg">
            <Filter size={18} className="text-slate-400" />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#0f172a] text-white text-sm font-medium focus:outline-none cursor-pointer">
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </header>

        {/* ROW 1: Core KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm font-medium">Total Income</p>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownToLine size={20} className="text-emerald-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white">{formatRupiah(metrics.totalIncome)}</h3>
          </div>
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm font-medium">Total Expenses</p>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <ArrowUpFromLine size={20} className="text-rose-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white">{formatRupiah(metrics.totalExpense)}</h3>
          </div>
          <div className={`p-6 rounded-2xl border shadow-xl ${metrics.netSavings >= 0 ? 'bg-gradient-to-br from-blue-900/40 to-[#0f172a] border-blue-500/30' : 'bg-gradient-to-br from-rose-900/40 to-[#0f172a] border-rose-500/30'}`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-medium ${metrics.netSavings >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>Net Savings</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metrics.netSavings >= 0 ? 'bg-blue-500/10' : 'bg-rose-500/10'}`}>
                <Percent size={20} className={metrics.netSavings >= 0 ? 'text-blue-400' : 'text-rose-400'} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{formatRupiah(metrics.netSavings)}</h3>
            <p className="text-slate-400 text-xs">Savings rate: <span className={`font-bold ${metrics.netSavings >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>{metrics.savingsRatio}%</span> of income</p>
          </div>
        </div>

        {/* ROW 2: Advanced KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm font-medium">Daily Burn Rate</p>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame size={20} className="text-orange-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">{formatRupiah(metrics.burnRate)}</h3>
            <p className="text-slate-500 text-xs mt-1">Avg. spend per active day</p>
          </div>
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm font-medium">Expense-to-Income Ratio</p>
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <TrendingDown size={20} className="text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">{metrics.expenseRatio}%</h3>
            <p className="text-slate-500 text-xs mt-1">{metrics.expenseRatio > 80 ? '⚠ High — consider reducing expenses' : metrics.expenseRatio > 50 ? 'Moderate spending level' : '✓ Healthy spending level'}</p>
          </div>
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm font-medium">Top Spending Category</p>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <PieIcon size={20} className="text-purple-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white capitalize">{metrics.topCatName}</h3>
            <p className="text-slate-500 text-xs mt-1">{metrics.topCatPct}% of total expenses</p>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg h-96 flex flex-col">
            <h4 className="text-white font-bold text-lg">Income vs Expense Trend</h4>
            <p className="text-slate-400 text-xs mt-0.5 mb-6">Daily inflow vs outflow for the selected period.</p>
            <div className="flex-1 w-full">
              {metrics.barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.barChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="tanggal" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip content={<CustomTooltipBar />} cursor={{ fill: '#1e293b' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">No data for this period.</div>
              )}
            </div>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg h-96 flex flex-col">
            <h4 className="text-white font-bold text-lg">Expense Distribution</h4>
            <p className="text-slate-400 text-xs mt-0.5 mb-6">Breakdown of spending by category.</p>
            <div className="flex-1 w-full flex items-center justify-center overflow-visible">
              {metrics.pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 50, right: 10, bottom: 20, left: 10 }}>
                    <Pie data={metrics.pieChartData} cx="50%" cy="45%" innerRadius={70} outerRadius={105}
                      paddingAngle={5} dataKey="value" stroke="none"
                      label={({ percent }) => `${(percent * 100).toFixed(1)}%`} labelLine={false}>
                      {metrics.pieChartData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatRupiah(value)}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#cbd5e1' }} />
                    <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right"
                      wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">No expense data yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* MONTHLY BREAKDOWN TABLE */}
        {metrics.monthlyData.length > 0 && (
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-lg p-6 mb-8">
            <h4 className="text-white font-bold text-lg mb-1">Monthly Breakdown</h4>
            <p className="text-slate-400 text-xs mb-6">Month-by-month income, expenses, and net position.</p>
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase tracking-wider">
                  <th className="pb-3">Month</th>
                  <th className="pb-3 text-emerald-500">Income</th>
                  <th className="pb-3 text-rose-500">Expenses</th>
                  <th className="pb-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {metrics.monthlyData.map((m, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-3 font-medium text-white">{m.month}</td>
                    <td className="py-3 text-emerald-500">{formatRupiah(m.income)}</td>
                    <td className="py-3 text-rose-500">{formatRupiah(m.expense)}</td>
                    <td className={`py-3 text-right font-bold ${m.net >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                      {m.net >= 0 ? '+' : ''}{formatRupiah(m.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LARGEST EXPENSE CALLOUT */}
        {metrics.largestExpense > 0 && (
          <div className="bg-[#0f172a] border border-yellow-500/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-0.5">Largest Single Expense</p>
              <p className="text-white font-bold">{metrics.largestExpenseDesc} — <span className="text-rose-400">{formatRupiah(metrics.largestExpense)}</span></p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
