/**
 * Kabadi Man — Shared Utility Functions
 * Common helpers used across admin panel and mobile apps.
 */

// ── Currency Formatting ─────────────────────────────

/**
 * Format a number as Indian Rupees.
 * @example formatCurrency(1500) → "₹1,500.00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as Indian Rupees without decimals.
 * @example formatCurrencyShort(1500) → "₹1,500"
 */
export function formatCurrencyShort(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Date / Time Formatting ──────────────────────────

/**
 * Format an ISO date string to a readable date.
 * @example formatDate("2024-06-15T10:30:00Z") → "15 Jun 2024"
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format an ISO date string to date + time.
 * @example formatDateTime("2024-06-15T10:30:00Z") → "15 Jun 2024, 4:00 PM"
 */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format an ISO date string to time only.
 * @example formatTime("2024-06-15T10:30:00Z") → "4:00 PM"
 */
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get relative time string (e.g., "5 minutes ago", "2 hours ago").
 */
export function getRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(isoString);
}

// ── Phone Number Formatting ─────────────────────────

/**
 * Format Indian phone number for display.
 * @example formatPhone("9876543210") → "+91 98765 43210"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.length === 12 ? cleaned.slice(2) : cleaned;
  if (number.length !== 10) return phone;
  return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
}

/**
 * Validate Indian phone number (10 digits, starting with 6-9).
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

// ── Weight Formatting ───────────────────────────────

/**
 * Format weight in kg with appropriate suffix.
 * @example formatWeight(1500) → "1.5 tonnes"
 * @example formatWeight(5.2) → "5.2 kg"
 */
export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} tonnes`;
  }
  return `${kg.toFixed(1)} kg`;
}

// ── TAT Duration Formatting ─────────────────────────

/**
 * Calculate duration between two ISO timestamps.
 * Returns human-readable string.
 * @example calculateTAT("2024-06-15T10:00:00Z", "2024-06-15T10:30:00Z") → "30 min"
 */
export function calculateTAT(
  startIso: string | undefined,
  endIso: string | undefined
): string | null {
  if (!startIso || !endIso) return null;
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) return `${Math.abs(diffMins)} min early`;
  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

// ── Order ID Formatting ─────────────────────────────

/**
 * Truncate order ID for compact display.
 * @example truncateOrderId("KM-BEL-2024-00001") → "KM-..00001"
 */
export function truncateOrderId(orderId: string): string {
  if (orderId.length <= 12) return orderId;
  return `${orderId.slice(0, 3)}..${orderId.slice(-5)}`;
}

// ── Miscellaneous ───────────────────────────────────

/**
 * Capitalize first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generate a random 6-digit OTP (for display/testing).
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array).
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
