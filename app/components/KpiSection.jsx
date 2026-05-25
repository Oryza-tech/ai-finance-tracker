import { Wallet, TrendingUp, TrendingDown, Banknote, ArrowDown, ArrowUp } from "lucide-react";

export default function KpiSection({ currentBalance, balanceChange, totalIncome, incomeChange, totalExpense, expenseChange, formatRupiah }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Balance */}
      <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4 md:p-6 rounded-2xl border border-slate-800 shadow-xl relative">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs md:text-sm font-medium mb-2">Current Balance</p>
            <h3 className="text-2xl md:text-4xl font-bold text-white mb-3 truncate">{formatRupiah(currentBalance)}</h3>
            <p className={`text-xs md:text-sm font-medium flex items-center gap-1 ${balanceChange.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
              {balanceChange.startsWith('-') ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              <span className="truncate">{balanceChange} vs last month</span>
            </p>
          </div>
          <Wallet size={32} className="md:w-12 md:h-12 text-blue-500 opacity-50 flex-shrink-0" />
        </div>
      </div>
      {/* Income */}
      <div className="bg-[#0f172a] p-4 md:p-6 rounded-2xl border border-slate-800 shadow-lg relative">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs md:text-sm font-medium mb-2">Total Income</p>
            <h3 className="text-xl md:text-3xl font-bold text-white mb-3 truncate">{formatRupiah(totalIncome)}</h3>
            <p className={`text-xs md:text-sm font-medium flex items-center gap-1 ${incomeChange.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
              {incomeChange.startsWith('-') ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              <span className="truncate">{incomeChange} vs last month</span>
            </p>
          </div>
          <Banknote size={28} className="md:w-10 md:h-10 text-emerald-500 opacity-50 flex-shrink-0" />
        </div>
      </div>
      {/* Expense */}
      <div className="bg-[#0f172a] p-4 md:p-6 rounded-2xl border border-slate-800 shadow-lg relative">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs md:text-sm font-medium mb-2">Total Expenses</p>
            <h3 className="text-xl md:text-3xl font-bold text-white mb-3 truncate">{formatRupiah(totalExpense)}</h3>
            <p className={`text-xs md:text-sm font-medium flex items-center gap-1 ${expenseChange.startsWith('-') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {expenseChange.startsWith('-') ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              <span className="truncate">{expenseChange} vs last month</span>
            </p>
          </div>
          <Banknote size={28} className="md:w-10 md:h-10 text-rose-500 opacity-50 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
