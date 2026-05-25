export default function ExpenseCategories({ sortedCategories, totalExpense, formatRupiah }) {
  return (
    <div className="col-span-1 bg-[#0f172a] p-4 md:p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between h-80 md:h-full">
      <div>
        <h4 className="text-white font-bold text-base md:text-lg">Expense Categories</h4>
        <p className="text-slate-400 text-xs mt-0.5">Your biggest spending categories.</p>
      </div>
      <div className="flex flex-col gap-3 md:gap-4 mt-4 justify-end flex-1">
        {sortedCategories.length > 0 ? (
          sortedCategories.map(([cat, val], idx) => {
            const percentage = Math.min((val / totalExpense) * 100, 100) || 0;
            return (
              <div key={idx} className="w-full">
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1 capitalize gap-2">
                  <span className="truncate">{cat}</span>
                  <span className="text-slate-400 flex-shrink-0">{formatRupiah(val)}</span>
                </div>
                <div className="w-full h-2 md:h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-slate-500 text-xs text-center py-6">No expense categories yet.</p>
        )}
      </div>
    </div>
  );
}
