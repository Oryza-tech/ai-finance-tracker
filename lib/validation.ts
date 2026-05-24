import { z } from "zod";
import { APP_CONFIG } from "./config";

/**
 * Zod schema for transaction validation
 * Ensures all transaction data is valid before saving to database
 */
export const TransactionSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use YYYY-MM-DD"),
  deskripsi: z
    .string()
    .min(1, "Description cannot be empty")
    .max(APP_CONFIG.validation.maxDescriptionLength, `Description too long (max ${APP_CONFIG.validation.maxDescriptionLength} chars)`),
  nominal: z
    .number()
    .positive("Amount must be greater than 0")
    .max(APP_CONFIG.validation.maxAmount, `Amount exceeds maximum (${APP_CONFIG.validation.maxAmount})`),
  kategori: z.string().min(1, "Category cannot be empty").max(50, "Category too long"),
  tipe: z.enum(["pemasukan", "pengeluaran"], {
    errorMap: () => ({ message: "Type must be either 'pemasukan' or 'pengeluaran'" }),
  }),
  metode_pembayaran: z.string().default(APP_CONFIG.defaultPaymentMethod),
});

/**
 * Zod schema for receipt extraction results from AI
 */
export const ReceiptSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  deskripsi: z.string().min(1, "Description required"),
  nominal: z
    .number()
    .positive("Amount must be positive")
    .or(z.string().regex(/^\d+$/).transform(Number)),
  kategori: z.string().min(1, "Category required"),
  metode_pembayaran: z.string().default(APP_CONFIG.defaultPaymentMethod),
  tipe: z.enum(["pemasukan", "pengeluaran"]),
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;

/**
 * Validates and coerces receipt data from AI response
 * @param data - Raw data from AI
 * @returns Validated receipt or throws ZodError
 */
export function validateReceipt(data: unknown): Receipt {
  return ReceiptSchema.parse(data);
}

/**
 * Validates transaction before database insert
 * @param data - Transaction data
 * @returns Validated transaction or throws ZodError
 */
export function validateTransaction(data: unknown): Transaction {
  return TransactionSchema.parse(data);
}

/**
 * Safely parses JSON string with error handling
 * @param jsonString - JSON string from API response
 * @returns Parsed object or throws error
 */
export function safeParseJSON(jsonString: string): unknown {
  try {
    // Remove markdown code blocks if present
    const cleaned = jsonString
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    if (!cleaned) {
      throw new Error("Empty JSON string");
    }

    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Sanitizes user input to prevent XSS
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .substring(0, APP_CONFIG.validation.maxDescriptionLength);
}

/**
 * Type guard for transaction
 */
export function isTransaction(data: unknown): data is Transaction {
  try {
    TransactionSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
