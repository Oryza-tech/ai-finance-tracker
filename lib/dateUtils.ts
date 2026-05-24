/**
 * Timezone utilities for handling dates in WIB (Western Indonesia Time)
 * Replaces manual offset calculations with proper timezone handling
 */

/**
 * Get current date in WIB timezone
 * @returns Date object representing current time in WIB
 */
export function getTodayWIB(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

/**
 * Get previous day in WIB timezone
 * @returns Date object representing yesterday in WIB
 */
export function getYesterdayWIB(): Date {
  const today = getTodayWIB();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return yesterday;
}

/**
 * Convert any date to WIB timezone
 * @param date - Date to convert
 * @returns Date in WIB timezone
 */
export function toWIB(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

/**
 * Format date as YYYY-MM-DD string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date in WIB as ISO string (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Formatted date string in WIB
 */
export function formatDateWIB(date: Date): string {
  return formatDateISO(toWIB(date));
}

/**
 * Get today's date as YYYY-MM-DD string in WIB
 * @returns Date string
 */
export function getTodayISO(): string {
  return formatDateISO(getTodayWIB());
}

/**
 * Get yesterday's date as YYYY-MM-DD string in WIB
 * @returns Date string
 */
export function getYesterdayISO(): string {
  return formatDateISO(getYesterdayWIB());
}

/**
 * Parse date string and return WIB date
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in WIB
 */
export function parseDateWIB(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return toWIB(date);
}

/**
 * Check if a date is today in WIB timezone
 * @param date - Date to check
 * @returns True if date is today in WIB
 */
export function isToday(date: Date): boolean {
  return formatDateISO(toWIB(date)) === getTodayISO();
}

/**
 * Check if a date is yesterday in WIB timezone
 * @param date - Date to check
 * @returns True if date is yesterday in WIB
 */
export function isYesterday(date: Date): boolean {
  return formatDateISO(toWIB(date)) === getYesterdayISO();
}

/**
 * Format date for display (short format like "24 May 2026")
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateDisplay(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format date for chart (short format like "24 May")
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateChart(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
  });
}
