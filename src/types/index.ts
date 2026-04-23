export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "user" | "admin" | "super-admin";
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    verification_required: boolean;
  };
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

export interface ProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface TrackingStats {
  total_recovery_emails_sent: number;
  recovered_amount: string;
  orders_completed: number;
  coupons_used: number;
  conversion_rate_percent: string;
  coupon_usage_rate_percent: string;
}

export interface TrackingStatsResponse {
  success: boolean;
  stats: TrackingStats;
}

export interface TrackingRecord {
  id: number;
  order_id: string;
  email: string;
  campaign_id: string | null;
  campaign_name: string | null;
  coupon_code: string | null;
  discount_percent: number;
  total_amount: string | null;
  checkout_url: string | null;
  store_name: string | null;
  emails_sent: number;
  order_status: string;
  order_completed: boolean;
  coupon_used: boolean;
  recovery_sent_at: string;
  order_completed_at: string | null;
  last_status_check_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackingRecordsResponse {
  success: boolean;
  records: TrackingRecord[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface CompletionCheckResult {
  success: boolean;
  total_checked: number;
  newly_completed: number;
  coupons_confirmed: number;
  errors: number;
  details: {
    orderId: string;
    status: string;
    completed: boolean;
    couponUsed: boolean;
    error?: string;
  }[];
}

export interface RecoveryFilters {
  email?: string;
  completed?: string;
  coupon_used?: string;
  store_name?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
}

export interface ApiError {
  success: false;
  message: string;
  data?: {
    email?: string;
    verification_required?: boolean;
  };
}
