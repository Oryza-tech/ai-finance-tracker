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

  // Fungsi untuk menghapus baris data
  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Yakin mau hapus transaksi ini, Bro?");
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      // Update tampilan HMI dengan membuang data yang dihapus
      setTransactions(transactions.filter(trx => trx.id !== id));
    } catch (error) {
      alert("Gagal menghapus data: " + error.message);
    }
  };

  const total = transactions.reduce((sum, item) => sum + Number(item.nominal), 0);

  // Logika memproses data mentah menjadi format yang dibaca oleh Pie Chart
  const categoryData = transactions.reduce((acc, current) => {
    const kategori = current.kategori || "Lainnya";
    const existing = acc.find(item => item.name === kategori);
    if (existing) {
      existing.value += Number(current.nominal);
    } else {
      acc.push({ name: kategori, value: Number(current.nominal) });
    }
    return acc;
  }, []);

  // Palet warna untuk grafik
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Panel Indikator Total */}
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 md:col-span-1 flex flex-col justify-center">
            <h2 className="text-gray-500 font-semibold mb-2">Total Pengeluaran</h2>
            <p className="text-4xl font-bold text-gray-800 break-words">
              Rp {total.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Panel Visualisasi Grafik */}
          <div className="bg-white p-4 rounded-xl shadow-md md:col-span-2 h-64">
            <h2 className="text-gray-500 font-semibold mb-2 text-center">Distribusi Pengeluaran</h2>
            {transactions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data untuk grafik</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 bg-gray-800 text-white font-bold flex justify-between items-center">
            <span>Riwayat Transaksi</span>
            <span className="font-normal text-sm bg-gray-700 px-2 py-1 rounded">
              Total Data: {transactions.length}
            </span>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500 font-semibold animate-pulse">Menyinkronkan data...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Sistem belum merekam data transaksi apapun.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-4 font-semibold text-gray-600">Tanggal</th>
                    <th className="p-4 font-semibold text-gray-600">Deskripsi</th>
                    <th className="p-4 font-semibold text-gray-600">Kategori</th>
                    <th className="p-4 font-semibold text-gray-600">Metode</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Nominal</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx) => (
                    <tr key={trx.id} className="border-b hover:bg-blue-50 transition-colors">
                      <td className="p-4 font-medium text-gray-700">{trx.tanggal}</td>
                      <td className="p-4 text-gray-600">{trx.deskripsi}</td>
                      <td className="p-4">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded border border-blue-200">
                          {trx.kategori}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{trx.metode_pembayaran}</td>
                      <td className="p-4 text-right font-bold text-red-600">
                        Rp {Number(trx.nominal).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleDelete(trx.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                          title="Hapus Transaksi"
                        >
                          🗑️
                        </button>
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