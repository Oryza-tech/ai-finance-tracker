"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Tag, ArrowUpCircle, ArrowDownCircle, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import TransactionModal from "../components/TransactionModal";
import { APP_CONFIG, formatRupiah } from "../../lib/config";
import { validateTransaction, sanitizeInput } from "../../lib/validation";

const EMPTY_FORM = { deskripsi: '', nominal: '', tanggal: '', tipe: 'pengeluaran', kategori: '' };

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTransactions = async () => {
    const { data, error } = await supabase.from("transactions").select("*").order('tanggal', { ascending: false });
    if (!error && data) setTransactions(data);
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleEdit = (t) => {
    setEditingId(t.id);
    setFormData({ deskripsi: t.deskripsi, nominal: t.nominal, tanggal: t.tanggal, tipe: t.tipe, kategori: t.kategori || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) fetchTransactions();
  };

  const handleSave = async () => {
    if (!formData.deskripsi || !formData.nominal || !formData.tanggal) return;
    setIsSaving(true);
    try {
      const payload = validateTransaction({
        tanggal: formData.tanggal,
        deskripsi: sanitizeInput(formData.deskripsi),
        nominal: Math.abs(Number(formData.nominal)),
        kategori: formData.kategori || APP_CONFIG.defaultCategory,
        tipe: formData.tipe,
        metode_pembayaran: APP_CONFIG.defaultPaymentMethod,
      });
      if (editingId) {
        await supabase.from("transactions").update(payload).eq("id", editingId);
      } else {
        await supabase.from("transactions").insert([payload]);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      fetchTransactions();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans">
      <Sidebar userName={APP_CONFIG.userName} currentPage="transactions" />
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex flex-col gap-2 mb-10">
          <a href="/" className="text-slate-400 hover:text-blue-500 text-sm font-medium flex items-center gap-1.5 transition-colors mb-2 w-max">
            <ArrowLeft size={16} /> Back to Dashboard
          </a>
          <h2 className="text-3xl font-bold text-white">Transactions Detail</h2>
          <p className="text-slate-400 text-sm">Full archive of your income and expense transactions.</p>
        </header>

        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl p-8">
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
                {transactions.length > 0 ? transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/10 transition-colors group">
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
                          {t.tipe === 'pemasukan'
                            ? <span className="text-emerald-500 flex items-center gap-0.5"><ArrowUpCircle size={10} /> IN</span>
                            : <span className="text-rose-500 flex items-center gap-0.5"><ArrowDownCircle size={10} /> OUT</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex items-center justify-end gap-2 ">
                        <button onClick={() => handleEdit(t)} className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-slate-500 hover:text-yellow-400 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                      No transactions recorded yet. Start logging your income and expenses!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingId(null); setFormData(EMPTY_FORM); }}
        isSaving={isSaving}
        isAnalyzing={false}
        formData={formData}
        onInputChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        onImageUpload={() => {}}
        onSave={handleSave}
        triggerFileInput={() => {}}
        editingId={editingId}
      />
    </div>
  );
}
