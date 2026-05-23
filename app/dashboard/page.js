"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("tanggal", { ascending: false });

      if (error) throw error;
      setTransactions(data);
    } catch (error) {
      alert("Gagal menarik data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Yakin mau hapus transaksi ini, Bro?");
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      setTransactions(transactions.filter(trx => trx.id !== id));
    } catch (error) {
      alert("Gagal menghapus data: " + error.message);
    }
  };

  // LOGIKA MATEMATIKA ARUS KAS
  const totalPemasukan = transactions
    .filter(item => item.tipe?.toLowerCase() === "pemasukan")
    .reduce((sum, item) => sum + Number(item.nominal), 0);

  const totalPengeluaran = transactions
    .filter(item => item.tipe?.toLowerCase() === "pengeluaran")
    .reduce((sum, item) => sum + Number(item.nominal), 0);

  const sisaSaldo = totalPemasukan - totalPengeluaran;

  // Memfilter grafik HANYA untuk melihat distribusi pengeluaran
  const expenseTransactions = transactions.filter(item => item.tipe?.toLowerCase() === "pengeluaran");
  const categoryData = expenseTransactions.reduce((acc, current) => {
    const kategori = current.kategori || "Lainnya";
    const existing = acc.find(item => item.name === kategori);
    if (existing) {
      existing.value += Number(current.nominal);
    } else {
      acc.push({ name: kategori, value: Number(current.nominal) });
    }
    return acc;
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#e84118'];

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Dashboard Keuangan</h1>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
            + Input Transaksi Baru
          </Link>
        </div>

        {/* 3 PANEL INDIKATOR UTAMA (ARUS KAS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-green-500">
            <h2 className="text-gray-400 text-sm font-semibold">Total Pemasukan</h2>
            <p className="text-2xl font-bold text-green-600 mt-1">Rp {totalPemasukan.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-red-500">
            <h2 className="text-gray-400 text-sm font-semibold">Total Pengeluaran</h2>
            <p className="text-2xl font-bold text-red-600 mt-1">Rp {totalPengeluaran.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-500">
            <h2 className="text-gray-400 text-sm font-semibold">Sisa Saldo (Efisiensi)</h2>
            <p className={`text-2xl font-bold mt-1 ${sisaSaldo >= 0 ? "text-blue-600" : "text-amber-600"}`}>
              Rp {sisaSaldo.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* PANEL GRAFIK */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 h-80">
          <h2 className="text-gray-500 font-semibold mb-2 text-center">Persentase Alokasi Pengeluaran</h2>
          {expenseTransactions.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Legend verticalAlign="bottom" height={40}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data pengeluaran</div>
          )}
        </div>

        {/* LOG DATA LOGGER TABLE */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 bg-gray-800 text-white font-bold flex justify-between items-center">
            <span>Riwayat Transaksi Campuran</span>
            <span className="font-normal text-sm bg-gray-700 px-2 py-1 rounded">Log: {transactions.length}</span>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500 font-semibold animate-pulse">Menyinkronkan...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada records log data.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-4 font-semibold text-gray-600">Tanggal</th>
                    <th className="p-4 font-semibold text-gray-600">Jenis</th>
                    <th className="p-4 font-semibold text-gray-600">Deskripsi</th>
                    <th className="p-4 font-semibold text-gray-600">Kategori</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Nominal</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx) => (
                    <tr key={trx.id} className="border-b hover:bg-blue-50 transition-colors">
                      <td className="p-4 text-gray-700">{trx.tanggal}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                          trx.tipe?.toLowerCase() === 'pemasukan' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {trx.tipe || 'pengeluaran'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{trx.deskripsi}</td>
                      <td className="p-4 text-sm text-gray-600">{trx.kategori}</td>
                      <td className={`p-4 text-right font-bold ${
                        trx.tipe?.toLowerCase() === 'pemasukan' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trx.tipe?.toLowerCase() === 'pemasukan' ? '+' : '-'} Rp {Number(trx.nominal).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDelete(trx.id)} className="text-red-500 hover:text-red-700 p-2">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}