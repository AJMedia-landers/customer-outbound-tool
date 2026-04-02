import { useState, useCallback } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useQuery } from "@tanstack/react-query";
import type { RecoveryFilters, TrackingRecord } from "types";
import { getRecords } from "api/recovery.api";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { useAuth } from "context/AuthContext";
import StatsCards from "components/StatsCards";
import FiltersBar from "components/FiltersBar";
import RecoveryTable from "components/RecoveryTable";
import SendRecoveryDialog from "components/SendRecoveryDialog";
import CheckCompletionsButton from "components/CheckCompletionsButton";
import type { GridPaginationModel } from "@mui/x-data-grid";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [filters, setFilters] = useState<RecoveryFilters>({
    page: 1,
    limit: 50,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await getRecords({ ...filters, page: 1, limit: 999999 });
      const records = res.data.records;

      const columns: { key: keyof TrackingRecord; label: string; width: number }[] = [
        { key: "order_id", label: "Order ID", width: 18 },
        { key: "email", label: "Email", width: 30 },
        { key: "campaign_name", label: "Campaign", width: 25 },
        { key: "store_name", label: "Store", width: 14 },
        { key: "total_amount", label: "Total Amount", width: 16 },
        { key: "order_status", label: "Status", width: 14 },
        { key: "order_completed", label: "Completed", width: 14 },
        { key: "coupon_used", label: "Coupon Used", width: 14 },
        { key: "recovery_sent_at", label: "Sent At", width: 22 },
        { key: "order_completed_at", label: "Completed At", width: 22 },
      ];

      const rows = records.map((r) => {
        const row: Record<string, string | number> = {};
        for (const col of columns) {
          const v = r[col.key];
          if (v == null) { row[col.label] = ""; continue; }
          if (typeof v === "boolean") { row[col.label] = v ? "Yes" : "No"; continue; }
          if (col.key === "total_amount") { row[col.label] = v ? `$${parseFloat(v as string).toFixed(2)}` : ""; continue; }
          if (col.key === "recovery_sent_at" || col.key === "order_completed_at") {
            row[col.label] = v ? dayjs(v as string).format("YYYY-MM-DD hh:mm A") : "";
            continue;
          }
          row[col.label] = String(v);
        }
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = columns.map((c) => ({ wch: c.width }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Recovery Tracking");
      XLSX.writeFile(wb, `recovery-tracking-${dayjs().format("YYYY-MM-DD")}.xlsx`);
    } finally {
      setExporting(false);
    }
  }, [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ["recovery-records", filters],
    queryFn: () => getRecords(filters).then((r) => r.data),
  });

  const handlePaginationChange = (model: GridPaginationModel) => {
    setFilters((prev) => ({
      ...prev,
      page: model.page,
      limit: model.pageSize,
    }));
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={700}>
          Recovery Tracking Dashboard
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Excel"}
          </Button>
          <CheckCompletionsButton />
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Send Recovery Email
            </Button>
          )}
        </Stack>
      </Stack>

      <StatsCards filters={filters} />

      <Box my={3}>
        <FiltersBar filters={filters} onFiltersChange={setFilters} />
      </Box>

      <RecoveryTable
        records={data?.records ?? []}
        total={data?.total ?? 0}
        page={filters.page}
        limit={filters.limit}
        loading={isLoading}
        onPaginationChange={handlePaginationChange}
      />
      {isAdmin && (
        <SendRecoveryDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </Box>
  );
}
