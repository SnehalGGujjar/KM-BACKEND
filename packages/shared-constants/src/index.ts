/**
 * Kabadi Man — Shared Constants
 * Used across admin panel, customer app, and partner app.
 */

import type { OrderStatus } from "@kabadiman/shared-types";

// ── Order Status Labels ─────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Waiting for Assignment",
  ASSIGNED: "Partner Assigned",
  ON_THE_WAY: "Partner On The Way",
  ARRIVED: "Partner Arrived",
  COLLECTING: "Collecting Scrap",
  AWAITING_INVOICE: "Processing",
  PAYMENT_PENDING: "Payment Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// ── Order Status Colors (for UI badges) ─────────────

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: "#3B82F6",          // blue
  ASSIGNED: "#8B5CF6",     // purple
  ON_THE_WAY: "#F59E0B",  // amber
  ARRIVED: "#10B981",      // green
  COLLECTING: "#06B6D4",   // cyan
  AWAITING_INVOICE: "#F97316", // orange
  PAYMENT_PENDING: "#EAB308",  // yellow
  COMPLETED: "#22C55E",   // green
  CANCELLED: "#EF4444",   // red
};

// ── Scrap Categories ────────────────────────────────

export const SCRAP_CATEGORIES = [
  "PAPER",
  "PLASTIC",
  "METAL",
  "EWASTE",
  "OTHER",
] as const;

export const SCRAP_CATEGORY_LABELS: Record<string, string> = {
  PAPER: "Paper",
  PLASTIC: "Plastic",
  METAL: "Metal",
  EWASTE: "E-Waste",
  OTHER: "Other",
};

// ── Time Slots ──────────────────────────────────────

export const DEFAULT_TIME_SLOTS = [
  "8:00-9:00",
  "9:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
  "17:00-18:00",
] as const;

// ── API Configuration ───────────────────────────────

export const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ??
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ??
  "http://localhost:8000/api/v1";

// ── Thresholds & Timings ────────────────────────────

export const WALLET_LOW_BALANCE_THRESHOLD = 200; // ₹
export const OTP_EXPIRY_SECONDS = 300;           // 5 minutes
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_RATE_LIMIT_PER_HOUR = 3;
export const POLL_INTERVAL_MS = 30000;           // 30 seconds
export const DASHBOARD_REFRESH_MS = 30000;       // 30 seconds

// ── Partner Approval Statuses ───────────────────────

export const PARTNER_STATUS_LABELS = {
  PENDING: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DISABLED: "Disabled",
} as const;

// ── Customer Types ──────────────────────────────────

export const CUSTOMER_TYPE_LABELS = {
  B2C: "Individual (B2C)",
  B2B: "Business (B2B)",
} as const;

// ── Wallet Transaction Types ────────────────────────

export const WALLET_TX_TYPE_LABELS = {
  COMMISSION_DEDUCTION: "Commission Deduction",
  TOP_UP: "Admin Top-Up",
  ADMIN_ADJUSTMENT: "Admin Adjustment",
} as const;

// ── Notification Types ──────────────────────────────

export const NOTIFICATION_TYPE_LABELS = {
  ORDER_UPDATE: "Order Update",
  INVOICE: "Invoice",
  WALLET: "Wallet",
  SYSTEM: "System",
  BROADCAST: "Broadcast",
} as const;

// ── Cities (initial seed — also seeded in Django) ───

export const INITIAL_CITIES = [
  { name: "Belgaum", slug: "belgaum", state: "Karnataka" },
  { name: "Kolhapur", slug: "kolhapur", state: "Maharashtra" },
  { name: "Hubli", slug: "hubli", state: "Karnataka" },
  { name: "Dharwad", slug: "dharwad", state: "Karnataka" },
  { name: "Nippani", slug: "nippani", state: "Karnataka" },
] as const;
