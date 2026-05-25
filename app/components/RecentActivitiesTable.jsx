import { Calendar, Tag, ArrowUpCircle, Pencil, Trash2 } from "lucide-react";

export default function RecentActivitiesTable({ transactions, formatRupiah, onEdit, onDelete }) {
  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-500"><ArrowUpCircle size={24} /></span> <span className="hidden sm:inline">Recent Activities</span><span className="sm:hidden">Activity</span>
        </h3>
        <a href="/transactions" className="text-xs sm:text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors">
          View Ledger ➔
        </a>
      </div>
      <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Date</th>
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Description</th>
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider hidden sm:table-cell">Category</th>
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider text-right">Amount</th>
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/10 transition-colors group">
                  <td className="py-4 text-xs text-slate-400 whitespace-nowrap">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {t.tanggal}</span>
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-white group-hover:text-blue-400 transition-colors text-sm line-clamp-2">{t.deskripsi}</span>
                  </td>
                  <td className="py-4 hidden sm:table-cell">
                    <span className="bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700/60 inline-flex items-center gap-1 capitalize">
                      <Tag size={12} className="text-slate-500" /> {t.kategori || "Umum"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`font-bold text-sm md:text-base ${t.tipe === 'pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(t.nominal)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1 md:gap-2">
                      <button onClick={() => onEdit(t)} className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-slate-500 hover:text-yellow-400 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800">
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Date</th>
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Description</th>
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Category</th>
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider text-right">Amount</th>
              <th className="pb-4 font-semibold uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/10 transition-colors group">
                  <td className="py-4 text-xs text-slate-400 whitespace-nowrap">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {t.tanggal}</span>
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-white group-hover:text-blue-400 transition-colors text-sm">{t.deskripsi}</span>
                  </td>
                  <td className="py-4">
                    <span className="bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700/60 inline-flex items-center gap-1 capitalize">
                      <Tag size={12} className="text-slate-500" /> {t.kategori || "Umum"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`font-bold text-base ${t.tipe === 'pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(t.nominal)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2 ">
                      <button onClick={() => onEdit(t)} className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-slate-500 hover:text-yellow-400 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
