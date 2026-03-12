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
