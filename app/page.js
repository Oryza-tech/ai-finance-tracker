"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Plus } from "lucide-react";
import { supabase } from "./supabase";
import Sidebar from "./components/Sidebar";
import KpiSection from "./components/KpiSection";
import CashFlowChart from "./components/CashFlowChart";
import ExpenseCategories from "./components/ExpenseCategories";
import RecentActivitiesTable from "./components/RecentActivitiesTable";
import TransactionModal from "./components/TransactionModal";
import { APP_CONFIG, formatRupiah, calculateMoM } from "../lib/config";
import { validateTransaction, sanitizeInput, safeParseJSON } from "../lib/validation";
import { logError, createLogger } from "../lib/logger";

export default function Dashboard() {
  const logger = createLogger("DashboardPage");
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ deskripsi: '', nominal: '', tanggal: '', tipe: 'pengeluaran', kategori: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // --- 1. TARIK DATA DARI SUPABASE ---
  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order('tanggal', { ascending: false });

    if (!error && data) setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // --- 2. LOGIKA KEUANGAN & KOMPUTASI ---
  const {
    totalIncome, totalExpense, currentBalance,
    balanceThisMonth, balanceLastMonth,
    incomeThisMonth, incomeLastMonth,
    expenseThisMonth, expenseLastMonth,
    sortedCategories,
  } = useMemo(() => {
    let totalIncome = 0, totalExpense = 0;
    const categoryMap = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let incomeThisMonth = 0, expenseThisMonth = 0, incomeLastMonth = 0, expenseLastMonth = 0;
    transactions.forEach((t) => {
      const nominal = Number(t.nominal) || 0;
      if (t.tipe === "pemasukan") totalIncome += nominal;
      if (t.tipe === "pengeluaran") {
        totalExpense += nominal;
        const kat = t.kategori || "Umum";
        categoryMap[kat] = (categoryMap[kat] || 0) + nominal;
      }
      const tDate = new Date(t.tanggal);
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();
      if (tYear === currentYear && tMonth === currentMonth) {
        if (t.tipe === "pemasukan") incomeThisMonth += nominal;
        if (t.tipe === "pengeluaran") expenseThisMonth += nominal;
      }
      const isLastMonth = currentMonth === 0
        ? (tYear === currentYear - 1 && tMonth === 11)
        : (tYear === currentYear && tMonth === currentMonth - 1);
      if (isLastMonth) {
        if (t.tipe === "pemasukan") incomeLastMonth += nominal;
        if (t.tipe === "pengeluaran") expenseLastMonth += nominal;
      }
    });
    return {
      totalIncome, totalExpense,
      currentBalance: totalIncome - totalExpense,
      balanceThisMonth: incomeThisMonth - expenseThisMonth,
      balanceLastMonth: incomeLastMonth - expenseLastMonth,
      incomeThisMonth, incomeLastMonth,
      expenseThisMonth, expenseLastMonth,
      sortedCategories: Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, APP_CONFIG.topCategoriesCount),
    };
  }, [transactions]);

  const balanceChange = calculateMoM(balanceThisMonth, balanceLastMonth);
  const incomeChange = calculateMoM(incomeThisMonth, incomeLastMonth);
  const expenseChange = calculateMoM(expenseThisMonth, expenseLastMonth);

  // --- 2B. DATA CHART & FILTER ---
  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const buckets = {};

    const getKey = (t) => {
      if (selectedRange === 'weekly') return t.tanggal.slice(5); // MM-DD
      if (selectedRange === 'monthly') return t.tanggal.slice(8, 10); // DD
      return ("0" + (new Date(t.tanggal).getMonth() + 1)).slice(-2); // MM
    };

    const inRange = (t) => {
      const d = new Date(t.tanggal);
      if (selectedRange === 'weekly') {
        const cutoff = new Date(now); cutoff.setDate(now.getDate() - 6);
        return d >= cutoff;
      }
      if (selectedRange === 'monthly') return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      return d.getFullYear() === currentYear;
    };

    transactions.filter(inRange).forEach(t => {
      const key = getKey(t);
      if (!buckets[key]) buckets[key] = { tanggal: key, income: 0, expense: 0 };
      if (t.tipe === 'pemasukan') buckets[key].income += Number(t.nominal);
      else buckets[key].expense += Number(t.nominal);
    });

    let cumulative = 0;
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, d]) => {
        cumulative += d.income - d.expense;
        return { ...d, net: cumulative };
      });
  }, [transactions, selectedRange]);

  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-700 p-3 rounded-lg shadow-xl min-w-[160px]">
          <p className="text-slate-400 text-xs mb-2 font-medium">{label}</p>
          {payload.map((p) => (
            <p key={p.dataKey} className="text-xs font-semibold mb-0.5" style={{ color: p.color }}>
              {p.name}: {formatRupiah(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // --- 3. FUNGSI HANDLE MODAL & DATA ---
  const handleRangeChange = (range) => setSelectedRange(range);
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const triggerFileInput = (ref) => ref.current && ref.current.click();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/process-receipt", {
        method: "POST",
        body: body,
      });
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to process receipt");
      }

      if (result.data) {
        setFormData({
          deskripsi: sanitizeInput(result.data.deskripsi || ''),
          nominal: result.data.nominal || '',
          tanggal: result.data.tanggal || new Date().toISOString().split('T')[0],
          tipe: result.data.tipe || 'pengeluaran',
          kategori: result.data.kategori || APP_CONFIG.defaultCategory
        });
        logger.info("Receipt processed successfully");
      } else {
        throw new Error("Invalid response format from AI");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      logger.error(err, { file: file.name });
      setError(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    setError(null);
    
    if (!formData.deskripsi || !formData.nominal || !formData.tanggal) {
      setError("Please fill in all required fields: description, amount, and date");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        tanggal: formData.tanggal,
        deskripsi: sanitizeInput(formData.deskripsi),
        nominal: Math.abs(Number(formData.nominal)), // Ensure positive
        kategori: formData.kategori || APP_CONFIG.defaultCategory,
        tipe: formData.tipe,
        metode_pembayaran: APP_CONFIG.defaultPaymentMethod
      };

      // Validate payload before sending
      const validatedPayload = validateTransaction(payload);

      const { error: dbError } = await supabase.from("transactions").insert([validatedPayload]);

      if (dbError) {
        throw new Error(dbError.message || "Failed to save to database");
      }

      logger.info("Transaction saved successfully", { amount: payload.nominal });
      setIsModalOpen(false);
      setFormData({ deskripsi: '', nominal: '', tanggal: '', tipe: 'pengeluaran', kategori: '' });
      fetchTransactions();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      logger.error(err);
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans relative overflow-hidden">
      <Sidebar userName={APP_CONFIG.userName} currentPage="dashboard" />
      {/* KONTEN UTAMA */}
      <main className="flex-1 p-10 overflow-y-auto relative z-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Financial Overview</h2>
            <p className="text-slate-400 text-sm">Welcome back, {APP_CONFIG.userName}! Here's your financial summary.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            <Plus size={20} /> New Transaction
          </button>
        </header>
        {/* KPI Section */}
        <KpiSection
          currentBalance={currentBalance}
          balanceChange={balanceChange}
          totalIncome={totalIncome}
          incomeChange={incomeChange}
          totalExpense={totalExpense}
          expenseChange={expenseChange}
          formatRupiah={formatRupiah}
        />
        {/* Charts Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <CashFlowChart
            chartData={chartData}
            CustomTooltip={CustomTooltip}
            onRangeChange={handleRangeChange}
            selectedRange={selectedRange}
          />
          <ExpenseCategories
            sortedCategories={sortedCategories}
            totalExpense={totalExpense}
            formatRupiah={formatRupiah}
          />
        </div>
        {/* Recent Activities Table */}
        <RecentActivitiesTable
          transactions={transactions}
          formatRupiah={formatRupiah}
        />
      </main>
      {/* Modal Transaction */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAnalyzing={isAnalyzing}
        isSaving={isSaving}
        formData={formData}
        onInputChange={handleInputChange}
        onImageUpload={handleImageUpload}
        onSave={handleSaveToDatabase}
        triggerFileInput={triggerFileInput}
      />
    </div>
  );
}