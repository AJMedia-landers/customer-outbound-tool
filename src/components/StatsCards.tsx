import { useQuery } from "@tanstack/react-query";
import { Grid2 as Grid, Paper, Typography, Skeleton, Box } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PercentIcon from "@mui/icons-material/Percent";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { getStats } from "api/recovery.api";
import type { RecoveryFilters } from "types";

const cards = [
  { key: "total_recovery_emails_sent", label: "Emails Sent", icon: EmailIcon, color: "#BF8E71" },
  { key: "recovered_amount", label: "Recovered Amount", icon: AttachMoneyIcon, color: "#6E4E3B", prefix: "$" },
  { key: "orders_completed", label: "Completed", icon: CheckCircleIcon, color: "#2E7D32" },
  { key: "coupons_used", label: "Coupons Used", icon: LocalOfferIcon, color: "#8A5B0A" },
  { key: "conversion_rate_percent", label: "Conversion Rate", icon: PercentIcon, color: "#1565C0", suffix: "%" },
  { key: "coupon_usage_rate_percent", label: "Coupon Rate", icon: TrendingUpIcon, color: "#7B1FA2", suffix: "%" },
] as const;

interface StatsCardsProps {
  filters?: RecoveryFilters;
}

export default function StatsCards({ filters }: StatsCardsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["recovery-stats", filters],
    queryFn: () => getStats(filters).then((r) => r.data.stats),
  });

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid key={card.key} size={{ xs: 6, sm: 4, md: 2 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              <card.icon sx={{ fontSize: 32, color: card.color }} />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {card.label}
            </Typography>
            {isLoading ? (
              <Skeleton width={60} sx={{ mx: "auto" }} />
            ) : (
              <Typography variant="h5" fontWeight={700}>
                {"prefix" in card ? card.prefix : ""}
                {data?.[card.key] ?? 0}
                {"suffix" in card ? card.suffix : ""}
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
