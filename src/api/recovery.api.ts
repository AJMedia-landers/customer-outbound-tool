import api from "./axios";
import type {
  TrackingStatsResponse,
  TrackingRecordsResponse,
  CompletionCheckResult,
  RecoveryFilters,
} from "types";

export const getStats = (filters?: Partial<RecoveryFilters>) =>
  api.get<TrackingStatsResponse>(
    "/checkout-campaign/recovery/tracking/stats",
    {
      params: {
        ...(filters?.email && { email: filters.email }),
        ...(filters?.completed && { completed: filters.completed }),
        ...(filters?.coupon_used && { coupon_used: filters.coupon_used }),
        ...(filters?.store_name && { store_name: filters.store_name }),
        ...(filters?.date_from && { date_from: filters.date_from }),
        ...(filters?.date_to && { date_to: filters.date_to }),
      },
    }
  );

export const getRecords = (filters: RecoveryFilters) =>
  api.get<TrackingRecordsResponse>(
    "/checkout-campaign/recovery/tracking/records",
    {
      params: {
        ...(filters.email && { email: filters.email }),
        ...(filters.completed && { completed: filters.completed }),
        ...(filters.coupon_used && { coupon_used: filters.coupon_used }),
        ...(filters.store_name && { store_name: filters.store_name }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
        page: filters.page,
        limit: filters.limit,
      },
    }
  );

export const checkCompletions = () =>
  api.post<CompletionCheckResult>(
    "/checkout-campaign/recovery/tracking/check-completions"
  );

export const sendRecoveryByEmail = (
  email: string,
  startDate?: string
) =>
  api.post("/checkout-campaign/recovery/by-email", {
    email,
    ...(startDate && { startDate }),
  });
