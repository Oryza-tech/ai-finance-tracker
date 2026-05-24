/**
 * Centralized configuration for the AI-Finance application
 * All hardcoded values, constants, and configurable settings in one place
 */

export const APP_CONFIG = {
  // User configuration
  userName: process.env.NEXT_PUBLIC_USER_NAME || "Oryza",
  workspaceName: `${process.env.NEXT_PUBLIC_USER_NAME || "Oryza"} Workspace`,

  // Dashboard configuration
  topCategoriesCount: 3,
  recentTransactionsCount: 5,

  // AI Model configuration
  aiModel: "gemini-3.1-flash-lite",
  aiLimits: {
    requestsPerHour: 500,
    description: "Free tier limit - upgrade for higher limits",
  },

  // Database configuration
  defaultCategory: "Umum",
  defaultPaymentMethod: "Cash",
  transactionTypes: ["pemasukan", "pengeluaran"] as const,
  categories: [
    "Makanan",
    "Transportasi",
    "Gaji",
    "Belanja",
    "Transfer",
    "Lainnya",
    "Umum",
  ],

  // Chart configuration
  chartRanges: ["weekly", "monthly", "yearly"] as const,
  chartColors: [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
  ],

  // API timeouts (in milliseconds)
  apiTimeouts: {
    receiptProcessing: 30000,
    telegramMessage: 5000,
    databaseQuery: 10000,
  },

  // Validation rules
  validation: {
    maxDescriptionLength: 500,
    maxCategoryLength: 50,
    minAmount: 0,
    maxAmount: 999999999,
  },
};

/**
 * Get a currency formatter for Rupiah
 */
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate month-over-month percentage change
 */
export const calculateMoM = (
  currentValue: number,
  previousValue: number
): string => {
  if (previousValue === 0 && currentValue === 0) return "0.0%";
  if (previousValue === 0) return "+100.0%";
  const pct = ((currentValue - previousValue) / previousValue) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
};
