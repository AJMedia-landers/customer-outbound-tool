import api from "./axios";

export interface Campaign {
  campaignId: number;
  campaignName: string;
  campaignType: string;
  campaignStatus: string;
  orderEntry: number;
  listSalesEntry: boolean | number | string;
}

export interface CampaignsResponse {
  success: boolean;
  total: number;
  campaigns: Campaign[];
}

export interface CampaignProduct {
  campaignProductId: number;
  productId: number;
  productName: string;
  productPrice: string;
  productQty: number;
  shippingPrice: string;
  offerId: number;
  offerName: string;
  offerLabel: string;
  [key: string]: unknown;
}

export interface ShippingProfile {
  shippingId: number;
  shippingName: string;
  shippingPrice: string;
  [key: string]: unknown;
}

export interface CampaignCoupon {
  couponCode: string;
  applyTo: string;
  discountPrice: string | null;
  discountPerc: string | null;
  isRecurring: number;
  campaignProductId: number | null;
}

export interface CampaignProductsResponse {
  success: boolean;
  campaignId: number;
  total: number;
  products: CampaignProduct[];
  shippingProfiles: ShippingProfile[];
  coupons: CampaignCoupon[];
}

export interface OrderImportPayload {
  campaignId: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber?: string;
  companyName?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  shipFirstName?: string;
  shipLastName?: string;
  shipAddress1?: string;
  shipAddress2?: string;
  shipCity?: string;
  shipState?: string;
  shipCountry?: string;
  shipPostalCode?: string;
  shippingId?: number;
  paySource: string;
  offers?: string;
  couponCode?: string;
  notes?: string;
  campaignName?: string;
  totalAmount?: number;
}

export interface OrderImportResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export const getOrderEntryCampaigns = () =>
  api.get<CampaignsResponse>("/checkout-campaign/campaigns/order-entry");

export const getCampaignProducts = (campaignId: number) =>
  api.get<CampaignProductsResponse>(
    `/checkout-campaign/campaigns/${campaignId}/products`
  );

export const importOrder = (payload: OrderImportPayload) =>
  api.post<OrderImportResponse>("/checkout-campaign/orders/import", payload);

// --- Order Entries List ---

export interface OrderEntryRecord {
  id: number;
  user_id: number;
  creator_name: string;
  campaign_id: number;
  campaign_name: string | null;
  checkout_order_id: string | null;
  order_status: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string | null;
  offers: string | null;
  coupon_code: string | null;
  total_amount: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrderEntriesFilters {
  user_id?: number;
  email?: string;
  order_status?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
}

export interface OrderEntriesResponse {
  success: boolean;
  records: OrderEntryRecord[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface OrderEntryCreator {
  id: number;
  name: string;
}

export interface CreatorsResponse {
  success: boolean;
  creators: OrderEntryCreator[];
}

export const getOrderEntries = (filters: OrderEntriesFilters) => {
  const params: Record<string, string> = {
    page: String(filters.page),
    limit: String(filters.limit),
  };
  if (filters.user_id) params.user_id = String(filters.user_id);
  if (filters.email) params.email = filters.email;
  if (filters.order_status) params.order_status = filters.order_status;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  return api.get<OrderEntriesResponse>("/checkout-campaign/order-entries", { params });
};

export const getOrderEntryCreators = () =>
  api.get<CreatorsResponse>("/checkout-campaign/order-entries/creators");
