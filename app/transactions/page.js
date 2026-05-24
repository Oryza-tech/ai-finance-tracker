import { ArrowLeft, Calendar, Tag, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import { APP_CONFIG, formatRupiah } from "../../lib/config";

export default async function TransactionsPage() {
  // Tarik SEMUA data transaksi tanpa limit slice
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .order('tanggal', { ascending: false });

  if (error) {
    console.error("Gagal menarik data ledger:", error);
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans">
      <Sidebar userName={APP_CONFIG.userName} currentPage="transactions" />

      {/* --- KONTEN UTAMA --- */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex flex-col gap-2 mb-10">
          <a href="/" className="text-slate-400 hover:text-blue-500 text-sm font-medium flex items-center gap-1.5 transition-colors mb-2 w-max">
            <ArrowLeft size={16} /> Back to Dashboard
          </a>
          <h2 className="text-3xl font-bold text-white">Transactions Detail</h2>
          <p className="text-slate-400 text-sm">Full archive of your income and expense transactions.</p>
        </header>

        {/* BUKU BESAR TABLE PANEL */}
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Date</th>
                  <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Description</th>
                  <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Category</th>
                  <th className="pb-4 font-semibold uppercase text-xs tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {transactions && transactions.length > 0 ? (
                  transactions.map((t, index) => (
                    <tr key={index} className="hover:bg-slate-800/10 transition-colors group">
                      <td className="py-5 text-slate-400 text-sm whitespace-nowrap">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {t.tanggal}</span>
                      </td>
                      <td className="py-5">
                        <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">{t.deskripsi}</span>
                      </td>
                      <td className="py-5">
                        <span className="bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700/60 inline-flex items-center gap-1 capitalize">
                          <Tag size={12} className="text-slate-500" /> {t.kategori || "Umum"}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`font-bold text-base ${t.tipe === 'pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {t.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(t.nominal)}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 flex items-center gap-1">
                            {t.tipe === 'pemasukan' ? (
                              <span className="text-emerald-500 flex items-center gap-0.5"><ArrowUpCircle size={10}/> IN</span>
                            ) : (
                              <span className="text-rose-500 flex items-center gap-0.5"><ArrowDownCircle size={10}/> OUT</span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                      No transactions recorded yet. Start logging your income and expenses!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}