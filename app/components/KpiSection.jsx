import { Wallet, TrendingUp, TrendingDown, Banknote, ArrowDown, ArrowUp } from "lucide-react";

export default function KpiSection({ currentBalance, balanceChange, totalIncome, incomeChange, totalExpense, expenseChange, formatRupiah }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Balance */}
      <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl relative">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-slate-400 text-sm font-medium mb-2">Current Balance</p>
            <h3 className="text-4xl font-bold text-white mb-4">{formatRupiah(currentBalance)}</h3>
            <p className={`text-sm font-medium flex items-center gap-1 ${balanceChange.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
              {balanceChange.startsWith('-') ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              {balanceChange} vs last month
            </p>
          </div>
          <Wallet size={48} className="text-blue-500 opacity-50 flex-shrink-0 ml-2" />
        </div>
      </div>
      {/* Income */}
      <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg relative">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-slate-400 text-sm font-medium mb-2">Total Income</p>
            <h3 className="text-3xl font-bold text-white mb-4">{formatRupiah(totalIncome)}</h3>
            <p className={`text-sm font-medium flex items-center gap-1 ${incomeChange.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
              {incomeChange.startsWith('-') ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              {incomeChange} vs last month
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <Banknote size={40} className="text-emerald-500 opacity-50" />
          </div>
        </div>
      </div>
      {/* Expense */}
      <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-lg relative">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-slate-400 text-sm font-medium mb-2">Total Expenses</p>
            <h3 className="text-3xl font-bold text-white mb-4">{formatRupiah(totalExpense)}</h3>
            <p className={`text-sm font-medium flex items-center gap-1 ${expenseChange.startsWith('-') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {expenseChange.startsWith('-') ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              {expenseChange} vs last month
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <Banknote size={40} className="text-rose-500 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
