import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  Snackbar,
  Divider,
  FormControlLabel,
  Checkbox,
  Radio,
  Autocomplete,
  CircularProgress,
  InputLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SendIcon from "@mui/icons-material/Send";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  importOrder,
  getOrderEntryCampaigns,
  getCampaignProducts,
} from "api/order-entry.api";
import type {
  OrderImportPayload,
  Campaign,
  CampaignProduct,
  CampaignCoupon,
  ShippingProfile,
} from "api/order-entry.api";
import { AxiosError } from "axios";
import type { ApiError } from "types";

// --- Country list ---
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IL", name: "Israel" },
  { code: "ZA", name: "South Africa" },
  { code: "AE", name: "United Arab Emirates" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
];

const schema = z.object({
  campaignId: z.string().min(1, "Campaign is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().optional(),
  emailAddress: z.string().email("Valid email is required"),
  phoneNumber: z.string().optional(),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  sameAsShipping: z.boolean(),
  shipFirstName: z.string().optional(),
  shipLastName: z.string().optional(),
  shipAddress1: z.string().optional(),
  shipAddress2: z.string().optional(),
  shipCity: z.string().optional(),
  shipState: z.string().optional(),
  shipCountry: z.string().optional(),
  shipPostalCode: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
  campaignId: "",
  firstName: "",
  lastName: "",
  companyName: "",
  emailAddress: "",
  phoneNumber: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  country: "US",
  postalCode: "",
  sameAsShipping: true,
  shipFirstName: "",
  shipLastName: "",
  shipAddress1: "",
  shipAddress2: "",
  shipCity: "",
  shipState: "",
  shipCountry: "US",
  shipPostalCode: "",
  couponCode: "",
  notes: "",
};

// --- Product quantity state per offerId ---
interface OfferQty {
  [offerId: number]: number;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <InputLabel
      sx={{ mb: 0.5, fontWeight: 600, fontSize: "0.85rem", color: "text.primary" }}
    >
      {children}
      {required && <span style={{ color: "#d32f2f" }}> *</span>}
    </InputLabel>
  );
}

// --- Orange accent color to match screenshot ---
const ORANGE = "#e8700a";

export default function OrderEntryPage() {
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [offerQtys, setOfferQtys] = useState<OfferQty>({});
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<CampaignCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Fetch campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ["order-entry-campaigns"],
    queryFn: () => getOrderEntryCampaigns().then((r) => r.data),
  });
  const campaigns: Campaign[] = campaignsData?.campaigns ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const sameAsShipping = watch("sameAsShipping");
  const selectedCampaignId = watch("campaignId");

  // Fetch products when campaign changes
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["campaign-products", selectedCampaignId],
    queryFn: () =>
      getCampaignProducts(Number(selectedCampaignId)).then((r) => r.data),
    enabled: !!selectedCampaignId,
  });
  const products: CampaignProduct[] = productsData?.products ?? [];
  const shippingProfiles: ShippingProfile[] = productsData?.shippingProfiles ?? [];
  const coupons: CampaignCoupon[] = productsData?.coupons ?? [];

  const MAX_VISIBLE_PRODUCTS = 50;

  const filteredProducts = useMemo(() => {
    let result = products;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      result = products.filter((p) => {
        const name = (p.offerName || p.offerLabel || p.productName || "").toLowerCase();
        return name.includes(q);
      });
    }
    // Limit rendered products to prevent browser freeze
    return result.slice(0, MAX_VISIBLE_PRODUCTS);
  }, [products, productSearch]);

  // Compute totals
  const totals = useMemo(() => {
    let totalPrice = 0;
    let totalShipping = 0;
    for (const p of products) {
      const qty = offerQtys[p.campaignProductId] || 0;
      if (qty > 0) {
        totalPrice += qty * parseFloat(p.price || "0");
        totalShipping += qty * parseFloat(p.shippingPrice || "0");
      }
    }
    // Add shipping profile price if selected
    if (selectedShippingId) {
      const sp = shippingProfiles.find(
        (s) => String(s.shippingId) === selectedShippingId
      );
      if (sp) {
        totalShipping += parseFloat(sp.shippingPrice || "0");
      }
    }
    // Calculate discount from applied coupon
    let discount = 0;
    if (appliedCoupon) {
      const applyTo = appliedCoupon.applyTo?.toUpperCase() || "";
      let baseAmount = totalPrice;
      if (applyTo === "SHIPPING") {
        baseAmount = totalShipping;
      } else if (applyTo === "TOTAL") {
        baseAmount = totalPrice + totalShipping;
      }
      if (appliedCoupon.discountPerc) {
        const pct = parseFloat(appliedCoupon.discountPerc);
        // API returns decimal (0.10 = 10%) or whole number (10 = 10%)
        discount = baseAmount * (pct < 1 ? pct : pct / 100);
      } else if (appliedCoupon.discountPrice) {
        discount = parseFloat(appliedCoupon.discountPrice);
      }
      // Don't let discount exceed the base amount
      discount = Math.min(discount, totalPrice + totalShipping);
    }
    const salesTax = 0;
    return {
      totalPrice,
      totalShipping,
      discount,
      salesTax,
      grandTotal: totalPrice + totalShipping - discount + salesTax,
    };
  }, [products, offerQtys, selectedShippingId, shippingProfiles, appliedCoupon]);

  // Build offers string: campaignProductId,productId,qty;...
  // CheckoutChamp import uses campaignProductId, checkout URL uses campaignProductId.productId
  function buildOffersString(): string {
    const parts: string[] = [];
    for (const p of products) {
      const qty = offerQtys[p.campaignProductId] || 0;
      if (qty > 0) {
        parts.push(`${p.campaignProductId},${p.productId},${qty}`);
      }
    }
    return parts.join(";");
  }

  // Coupon apply handler — validates against campaign coupons
  const handleApplyCoupon = (couponCode: string) => {
    setCouponError("");
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    const found = coupons.find(
      (c) => c.couponCode.toUpperCase() === couponCode.trim().toUpperCase()
    );
    if (!found) {
      setCouponError("Invalid coupon code");
      return;
    }
    setAppliedCoupon(found);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const setQty = (offerId: number, delta: number) => {
    setOfferQtys((prev) => {
      const current = prev[offerId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [offerId]: next };
    });
  };

  const setQtyDirect = (offerId: number, value: number) => {
    setOfferQtys((prev) => ({
      ...prev,
      [offerId]: Math.max(0, value),
    }));
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const offersStr = buildOffersString();

      const selectedCampaign = campaigns.find(
        (c) => String(c.campaignId) === data.campaignId
      );

      const payload: OrderImportPayload = {
        campaignId: Number(data.campaignId),
        campaignName: selectedCampaign?.campaignName || undefined,
        campaignCategoryName: selectedCampaign?.campaignCategoryName || undefined,
        totalAmount: totals.grandTotal > 0 ? totals.grandTotal : undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.emailAddress,
        phoneNumber: data.phoneNumber || undefined,
        companyName: data.companyName || undefined,
        address1: data.address1,
        address2: data.address2 || undefined,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        paySource: "PREPAID",
        offers: offersStr || undefined,
        couponCode: data.couponCode || undefined,
        notes: data.notes || undefined,
        shippingId: selectedShippingId ? Number(selectedShippingId) : undefined,
      };

      if (data.sameAsShipping) {
        // Copy billing address to shipping
        payload.shipFirstName = data.firstName;
        payload.shipLastName = data.lastName;
        payload.shipAddress1 = data.address1;
        payload.shipAddress2 = data.address2 || undefined;
        payload.shipCity = data.city;
        payload.shipState = data.state;
        payload.shipCountry = data.country;
        payload.shipPostalCode = data.postalCode;
      } else {
        payload.shipFirstName = data.shipFirstName || undefined;
        payload.shipLastName = data.shipLastName || undefined;
        payload.shipAddress1 = data.shipAddress1 || undefined;
        payload.shipAddress2 = data.shipAddress2 || undefined;
        payload.shipCity = data.shipCity || undefined;
        payload.shipState = data.shipState || undefined;
        payload.shipCountry = data.shipCountry || undefined;
        payload.shipPostalCode = data.shipPostalCode || undefined;
      }

      return importOrder(payload);
    },
    onSuccess: (res) => {
      setSuccessMsg(res.data.message || "Order created successfully");
      setSuccessOpen(true);
      setError("");
      setOfferQtys({});
      setSelectedShippingId("");
      setAppliedCoupon(null);
      setCouponError("");
      reset();
    },
    onError: (err: AxiosError<ApiError>) => {
      setError(err.response?.data?.message ?? "Failed to create order");
    },
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Order Entry
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        {/* Campaign selector */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Typography fontWeight={600} sx={{ minWidth: 80 }}>
            Campaign
          </Typography>
          <Controller
            name="campaignId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={campaigns}
                getOptionLabel={(opt) => opt.campaignName}
                loading={campaignsLoading}
                value={
                  campaigns.find(
                    (c) => String(c.campaignId) === field.value
                  ) ?? null
                }
                onChange={(_, val) => {
                  field.onChange(val ? String(val.campaignId) : "");
                  setOfferQtys({});
                  setSelectedShippingId("");
                  setAppliedCoupon(null);
                  setCouponError("");
                  setProductSearch("");
                }}
                sx={{ minWidth: 300 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Select campaign..."
                    error={!!errors.campaignId}
                    helperText={errors.campaignId?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {campaignsLoading ? (
                            <CircularProgress size={18} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
          />
        </Box>

        {/* Billing Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2.5} color="primary.dark">
            Billing Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FieldLabel required>First Name</FieldLabel>
              <TextField {...register("firstName")} error={!!errors.firstName} helperText={errors.firstName?.message} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel required>Last Name</FieldLabel>
              <TextField {...register("lastName")} error={!!errors.lastName} helperText={errors.lastName?.message} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel>Company Name</FieldLabel>
              <TextField {...register("companyName")} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel required>Address Line 1</FieldLabel>
              <TextField {...register("address1")} error={!!errors.address1} helperText={errors.address1?.message} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel>Address Line 2</FieldLabel>
              <TextField {...register("address2")} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel required>City</FieldLabel>
              <TextField {...register("city")} error={!!errors.city} helperText={errors.city?.message} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel required>Postal Code</FieldLabel>
              <TextField {...register("postalCode")} error={!!errors.postalCode} helperText={errors.postalCode?.message} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel required>State</FieldLabel>
              <TextField {...register("state")} error={!!errors.state} helperText={errors.state?.message} fullWidth size="small" select defaultValue="">
                <MenuItem value="" disabled>Select state...</MenuItem>
                {US_STATES.map((s) => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel required>Country</FieldLabel>
              <TextField {...register("country")} error={!!errors.country} helperText={errors.country?.message} fullWidth size="small" select defaultValue="US">
                {COUNTRIES.map((c) => (<MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel>Phone</FieldLabel>
              <TextField {...register("phoneNumber")} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FieldLabel required>Email</FieldLabel>
              <TextField type="email" {...register("emailAddress")} error={!!errors.emailAddress} helperText={errors.emailAddress?.message} fullWidth size="small" />
            </Grid>
          </Grid>
        </Paper>

        {/* Shipping Address */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="primary.dark">
            Shipping Address
          </Typography>
          <Controller
            name="sameAsShipping"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label="Same as billing address"
                sx={{ mb: 1 }}
              />
            )}
          />
          {!sameAsShipping && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FieldLabel>First Name</FieldLabel>
                <TextField {...register("shipFirstName")} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Last Name</FieldLabel>
                <TextField {...register("shipLastName")} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Address Line 1</FieldLabel>
                <TextField {...register("shipAddress1")} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Address Line 2</FieldLabel>
                <TextField {...register("shipAddress2")} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>City</FieldLabel>
                <TextField {...register("shipCity")} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Postal Code</FieldLabel>
                <TextField {...register("shipPostalCode")} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>State</FieldLabel>
                <TextField {...register("shipState")} fullWidth size="small" select defaultValue="">
                  <MenuItem value="" disabled>Select state...</MenuItem>
                  {US_STATES.map((s) => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Country</FieldLabel>
                <TextField {...register("shipCountry")} fullWidth size="small" select defaultValue="US">
                  {COUNTRIES.map((c) => (<MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>))}
                </TextField>
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* Payment Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="primary.dark">
            Payment Information (CC or Checking)
          </Typography>
          <Divider sx={{ mb: 2, borderStyle: "dashed" }} />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <FormControlLabel control={<Radio disabled />} label="Credit Card" sx={{ color: "text.secondary" }} />
            <FormControlLabel control={<Radio disabled />} label="eCheck" sx={{ color: "text.secondary" }} />
            <FormControlLabel control={<Radio checked />} label="External Payment" />
          </Box>
        </Paper>

        {/* Select Products */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2.5} color="primary.dark">
            Select Products
          </Typography>

          {!selectedCampaignId ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              Please select a campaign to view available products.
            </Typography>
          ) : productsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : products.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No products found for this campaign.
            </Typography>
          ) : (
            <>
              {/* Product search */}
              <TextField
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                fullWidth
                size="small"
                placeholder="Search products..."
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: productSearch ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setProductSearch("")}>
                        <ClearIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />

              {/* Offers table */}
              <TableContainer
                sx={{
                  border: `2px solid ${ORANGE}`,
                  borderRadius: 1,
                  maxHeight: 400,
                  mb: 3,
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: ORANGE, fontSize: "0.85rem", bgcolor: "background.paper", width: "45%" }}>
                        Offers
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: ORANGE, fontSize: "0.85rem", bgcolor: "background.paper", width: "25%" }}>
                        Quantity
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: ORANGE, fontSize: "0.85rem", bgcolor: "background.paper", width: "15%" }}>
                        Price
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: ORANGE, fontSize: "0.85rem", bgcolor: "background.paper", width: "15%" }}>
                        Shipping
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProducts.map((p) => {
                      const qty = offerQtys[p.campaignProductId] || 0;
                      const displayName = p.offerName || p.offerLabel || p.productName || `Product ${p.productId}`;
                      return (
                        <TableRow key={p.campaignProductId ?? p.productId} hover>
                          <TableCell sx={{ fontSize: "0.85rem", fontStyle: "italic" }}>
                            {displayName}
                            {" "}
                            <Tooltip title={`Product ID: ${p.productId}, Offer ID: ${p.campaignProductId}`} arrow>
                              <InfoOutlinedIcon sx={{ fontSize: 15, color: "#5ba3cf", verticalAlign: "middle", cursor: "pointer" }} />
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => setQty(p.campaignProductId, -1)}
                                sx={{ bgcolor: ORANGE, color: "#fff", width: 28, height: 28, "&:hover": { bgcolor: "#c95e00" } }}
                              >
                                <RemoveIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <TextField
                                value={qty}
                                onChange={(e) => setQtyDirect(p.campaignProductId, parseInt(e.target.value, 10) || 0)}
                                size="small"
                                inputProps={{ style: { textAlign: "center", width: 36, padding: "4px 0" } }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => setQty(p.campaignProductId, 1)}
                                sx={{ bgcolor: ORANGE, color: "#fff", width: 28, height: 28, "&:hover": { bgcolor: "#c95e00" } }}
                              >
                                <AddIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              value={parseFloat(p.price || "0").toFixed(2)}
                              size="small"
                              InputProps={{ readOnly: true }}
                              inputProps={{ style: { textAlign: "center", width: 60, padding: "4px 8px" } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              value={parseFloat(p.shippingPrice || "0").toFixed(2)}
                              size="small"
                              InputProps={{ readOnly: true }}
                              inputProps={{ style: { textAlign: "center", width: 60, padding: "4px 8px" } }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              {products.length > MAX_VISIBLE_PRODUCTS && !productSearch.trim() && (
                <Typography variant="body2" sx={{ p: 1, textAlign: "center", color: "text.secondary" }}>
                  Showing {MAX_VISIBLE_PRODUCTS} of {products.length} products. Use search to find more.
                </Typography>
              )}
              </TableContainer>

              {/* Coupon + Shipping + Totals */}
              <Grid container spacing={3}>
                {/* Left column: Coupon + Shipping */}
                <Grid item xs={12} md={5}>
                  <FieldLabel>Coupon</FieldLabel>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 1 }}>
                    <TextField
                      {...register("couponCode")}
                      fullWidth
                      size="small"
                      placeholder="Enter coupon code"
                      disabled={!!appliedCoupon}
                      error={!!couponError}
                      helperText={couponError}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleApplyCoupon(watch("couponCode") || "")}
                      disabled={!!appliedCoupon}
                      sx={{
                        bgcolor: "primary.main",
                        color: "#fff",
                        minWidth: 80,
                        height: 40,
                        "&:hover": { bgcolor: "primary.dark" },
                      }}
                    >
                      Apply
                    </Button>
                  </Box>
                  {appliedCoupon && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            color: "#d32f2f",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                          }}
                          onClick={handleRemoveCoupon}
                        >
                          X
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ color: "#2e7d32", fontWeight: 700, fontSize: "0.85rem" }}
                        >
                          {appliedCoupon.couponCode}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ fontSize: "0.85rem" }}
                        >
                          {(() => {
                            const target = appliedCoupon.applyTo === "SHIPPING" ? "Shipping" : appliedCoupon.applyTo === "TOTAL" ? "Total" : "Price";
                            if (appliedCoupon.discountPerc) {
                              const pct = parseFloat(appliedCoupon.discountPerc);
                              const display = pct < 1 ? (pct * 100).toFixed(0) : pct.toFixed(0);
                              return `${display}% off on Order ${target}`;
                            }
                            if (appliedCoupon.discountPrice) {
                              return `$${parseFloat(appliedCoupon.discountPrice).toFixed(2)} off on Order ${target}`;
                            }
                            return "";
                          })()}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <FieldLabel>Shipping</FieldLabel>
                  <TextField
                    value={selectedShippingId}
                    onChange={(e) => setSelectedShippingId(e.target.value)}
                    fullWidth
                    size="small"
                    select
                    SelectProps={{ displayEmpty: true }}
                  >
                    <MenuItem value="">
                      Default Shipping
                    </MenuItem>
                    {shippingProfiles.map((sp) => (
                      <MenuItem key={sp.shippingId} value={String(sp.shippingId)}>
                        {sp.shippingName || `Shipping ${sp.shippingId}`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Right column: Totals */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                      <Typography fontWeight={600} sx={{ minWidth: 130 }}>
                        Total Price
                      </Typography>
                      <TextField
                        value={totals.totalPrice.toFixed(2)}
                        size="small"
                        InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        sx={{ width: 140 }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                      <Typography fontWeight={600} sx={{ minWidth: 130 }}>
                        Total Shipping
                      </Typography>
                      <TextField
                        value={totals.totalShipping.toFixed(2)}
                        size="small"
                        InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        sx={{ width: 140 }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                      <Typography fontWeight={600} sx={{ minWidth: 130 }}>
                        Sales Tax
                      </Typography>
                      <TextField
                        value={totals.salesTax.toFixed(2)}
                        size="small"
                        InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        sx={{ width: 140 }}
                      />
                    </Box>
                    {appliedCoupon && totals.discount > 0 && (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                        <Typography fontWeight={600} sx={{ minWidth: 130, color: "#2e7d32" }}>
                          Discount
                        </Typography>
                        <TextField
                          value={totals.discount.toFixed(2)}
                          size="small"
                          InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          sx={{ width: 140 }}
                        />
                      </Box>
                    )}
                    <Divider />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                      <Typography fontWeight={700} sx={{ minWidth: 130 }}>
                        Grand Total
                      </Typography>
                      <TextField
                        value={totals.grandTotal.toFixed(2)}
                        size="small"
                        InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        sx={{ width: 140, "& .MuiOutlinedInput-root": { fontWeight: 700 } }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </Paper>

        {/* Notes */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2.5} color="primary.dark">
            Notes
          </Typography>
          <TextField
            {...register("notes")}
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="Optional notes for this order"
          />
        </Paper>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="flex-end">
          <Button
            type="button"
            color="inherit"
            onClick={() => {
              reset();
              setOfferQtys({});
              setSelectedShippingId("");
              setAppliedCoupon(null);
              setCouponError("");
              setProductSearch("");
            }}
            sx={{ mr: 2 }}
            disabled={mutation.isPending}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Submitting..." : "Submit Order"}
          </Button>
        </Box>
      </form>

      <Snackbar
        open={successOpen}
        autoHideDuration={5000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccessOpen(false)}
          variant="filled"
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
