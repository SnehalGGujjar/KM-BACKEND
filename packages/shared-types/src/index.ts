/**
 * Kabadi Man — Shared TypeScript Interfaces
 * Mirrors Django models exactly for type safety across all JS/TS apps.
 */

// ── Enums / Union Types ─────────────────────────────

export type OrderStatus =
  | "NEW"
  | "ASSIGNED"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "COLLECTING"
  | "AWAITING_INVOICE"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "CANCELLED";

export type PartnerApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DISABLED";

export type CustomerType = "B2C" | "B2B";

export type WalletTransactionType =
  | "COMMISSION_DEDUCTION"
  | "TOP_UP"
  | "ADMIN_ADJUSTMENT";

export type NotificationType =
  | "ORDER_UPDATE"
  | "INVOICE"
  | "WALLET"
  | "SYSTEM"
  | "BROADCAST";

export type OTPPurpose = "LOGIN" | "ARRIVAL_VERIFY";

export type InvoiceStatus = "PENDING_APPROVAL" | "APPROVED";

export type CancelledBy = "CUSTOMER" | "ADMIN";

export type RecipientType = "CUSTOMER" | "PARTNER" | "ADMIN";

export type RateRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

// ── Data Interfaces ─────────────────────────────────

export interface City {
  id: number;
  name: string;
  slug: string;
  state: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomerProfile {
  id: number;
  user_id: number;
  phone: string;
  name: string;
  address: string;
  city: City;
  latitude: number;
  longitude: number;
  email?: string;
  customer_type: CustomerType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerProfile {
  id: number;
  user_id: number;
  phone: string;
  name: string;
  city: City;
  aadhaar_doc_url: string;
  vehicle_doc_url: string;
  license_doc_url: string;
  godown_address?: string;
  godown_latitude?: number;
  godown_longitude?: number;
  approval_status: PartnerApprovalStatus;
  rejection_reason?: string;
  is_online: boolean;
  rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

export interface ScrapCategory {
  id: number;
  name: string;
  slug: string;
  icon_url?: string;
  is_active: boolean;
}

export interface Order {
  id: number;
  order_id: string;
  customer: CustomerProfile;
  partner: PartnerProfile | null;
  city: City;
  status: OrderStatus;
  pickup_date: string;
  pickup_slot: string;
  pickup_slot_start?: string;
  scrap_photos: string[];
  scrap_description?: string;
  arrival_otp?: string;
  arrival_otp_verified: boolean;
  rejection_reason?: string;
  cancelled_by?: CancelledBy;
  cancellation_reason?: string;
  // TAT timestamps
  created_at: string;
  assigned_at?: string;
  on_the_way_at?: string;
  arrived_at?: string;
  otp_verified_at?: string;
  scrap_submitted_at?: string;
  invoice_approved_at?: string;
  payment_confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  updated_at: string;
}

export interface ScrapItem {
  id: number;
  order_id: number;
  category: ScrapCategory;
  weight_kg: number;
  customer_rate: number;
  partner_rate: number;
  customer_amount: number;
  partner_amount: number;
}

export interface OrderRating {
  id: number;
  order_id: number;
  customer_id: number;
  rating: number;
  feedback?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  order_id: number;
  customer_total: number;
  partner_total: number;
  commission: number;
  status: InvoiceStatus;
  admin_notes?: string;
  approved_by?: number;
  created_at: string;
  approved_at?: string;
}

export interface PartnerWallet {
  id: number;
  partner_id: number;
  balance: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  type: WalletTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_order_id?: number;
  notes: string;
  created_at: string;
}

export interface Notification {
  id: number;
  recipient_type: RecipientType;
  recipient_id: number;
  title: string;
  body: string;
  type: NotificationType;
  reference_id?: string;
  is_read: boolean;
  city_id?: number;
  created_at: string;
}

export interface ScrapRate {
  category_id: number;
  category_name: string;
  price_per_kg: number;
}

export interface CustomerRate {
  id: number;
  category: ScrapCategory;
  city: City;
  price_per_kg: number;
  updated_by?: number;
  updated_at: string;
}

export interface PartnerDefaultRate {
  id: number;
  category: ScrapCategory;
  city: City;
  price_per_kg: number;
  updated_by?: number;
  updated_at: string;
}

export interface PartnerCustomRate {
  id: number;
  partner_id: number;
  category: ScrapCategory;
  price_per_kg: number;
  updated_by?: number;
  updated_at: string;
}

export interface PartnerRateRequest {
  id: number;
  partner: PartnerProfile;
  category: ScrapCategory;
  requested_rate: number;
  current_rate: number;
  reason?: string;
  status: RateRequestStatus;
  reviewed_by?: number;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface NotificationTemplate {
  id: number;
  name: string;
  title_template: string;
  body_template: string;
  is_active: boolean;
}

// ── API Response Wrapper ────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Auth Types ──────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  is_new_user: boolean;
}

// ── Dashboard / KPI Types ───────────────────────────

export interface DashboardStats {
  new_orders_today: number;
  scheduled_today: number;
  ongoing_now: number;
  completed_today: number;
  cancelled_today: number;
  pending_invoices: number;
  active_partners: number;
  todays_revenue: number;
  // Trends vs yesterday
  new_orders_trend: number;
  scheduled_trend: number;
  completed_trend: number;
  cancelled_trend: number;
  revenue_trend: number;
}
