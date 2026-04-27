import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SendIcon from "@mui/icons-material/Send";
import ReplayIcon from "@mui/icons-material/Replay";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "context/AuthContext";
import {
  getOrderEntries,
  getOrderEntryCreators,
  sendInvoice,
} from "api/order-entry.api";
import type { OrderEntriesFilters } from "api/order-entry.api";

const STATUS_COLORS: Record<string, "warning" | "success" | "error" | "info" | "default"> = {
  pending: "warning",
  completed: "success",
  failed: "error",
};

export default function OrderEntriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<OrderEntriesFilters>({
    page: 1,
    limit: 25,
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const [sendingId, setSendingId] = useState<number | null>(null);
  const [confirmResendId, setConfirmResendId] = useState<number | null>(null);

  const sendInvoiceMutation = useMutation({
    mutationFn: (id: number) => sendInvoice(id),
    onSuccess: (res) => {
      setSnackbar({
        open: true,
        message: res.data.message || "Invoice sent successfully",
        severity: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["order-entries"] });
      setSendingId(null);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || error?.message || "Failed to send invoice";
      setSnackbar({ open: true, message: msg, severity: "error" });
      setSendingId(null);
    },
  });

  const [emailInput, setEmailInput] = useState("");
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const setFiltersRef = useRef(setFilters);
  setFiltersRef.current = setFilters;

  const stableEmailChange = useCallback((value: string) => {
    setFiltersRef.current((prev) => ({
      ...prev,
      email: value || undefined,
      page: 1,
    }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInput !== (filtersRef.current.email ?? "")) {
        stableEmailChange(emailInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [emailInput, stableEmailChange]);

  // Fetch order entries
  const { data, isLoading } = useQuery({
    queryKey: ["order-entries", filters],
    queryFn: () => getOrderEntries(filters).then((r) => r.data),
  });

  // Fetch creators list for admin filter
  const { data: creatorsData } = useQuery({
    queryKey: ["order-entry-creators"],
    queryFn: () => getOrderEntryCreators().then((r) => r.data),
    enabled: isAdmin,
  });
  const creators = creatorsData?.creators ?? [];

  const handleClear = () => {
    setEmailInput("");
    setFilters({ page: 1, limit: filters.limit });
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 70,
    },
    {
      field: "checkout_order_id",
      headerName: "Order ID",
      width: 100,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "order_status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={STATUS_COLORS[params.value] ?? "default"}
          variant="outlined"
        />
      ),
    },
    {
      field: "campaign_name",
      headerName: "Campaign",
      width: 180,
      renderCell: (params) => params.value || `ID: ${params.row.campaign_id}`,
    },
    {
      field: "customer",
      headerName: "Customer",
      width: 160,
      valueGetter: (_value, row) => `${row.first_name} ${row.last_name}`,
    },
    {
      field: "email_address",
      headerName: "Email",
      width: 200,
    },
    {
      field: "total_amount",
      headerName: "Total",
      width: 100,
      renderCell: (params) =>
        params.value ? `$${parseFloat(params.value).toFixed(2)}` : "-",
    },
    {
      field: "applied_coupon_code",
      headerName: "Coupon",
      width: 160,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "creator_name",
      headerName: "Agent",
      width: 130,
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 160,
      valueFormatter: (value: string) =>
        value ? dayjs(value).format("MMM D, YYYY h:mm A") : "",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isSending = sendingId === params.row.id;
        const alreadySent = Boolean(params.row.invoice_number);
        const label = isSending
          ? alreadySent
            ? "Resending..."
            : "Sending..."
          : alreadySent
            ? "Resend"
            : "Send";
        return (
          <Button
            size="small"
            variant="contained"
            color={alreadySent ? "warning" : "primary"}
            startIcon={alreadySent ? <ReplayIcon /> : <SendIcon />}
            disabled={isSending || sendInvoiceMutation.isPending}
            onClick={() => {
              if (alreadySent) {
                setConfirmResendId(params.row.id);
              } else {
                setSendingId(params.row.id);
                sendInvoiceMutation.mutate(params.row.id);
              }
            }}
          >
            {label}
          </Button>
        );
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Order Entries
      </Typography>

      {/* Filters */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 3 }}
      >
        <TextField
          size="small"
          label="Search email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          sx={{ minWidth: 200 }}
        />

        {isAdmin && creators.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Created By</InputLabel>
            <Select
              label="Created By"
              value={filters.user_id ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  user_id: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <MenuItem value="">All Users</MenuItem>
              {creators.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={filters.order_status ?? ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                order_status: e.target.value || undefined,
                page: 1,
              })
            }
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>

        <DatePicker
          label="From"
          value={filters.date_from ? dayjs(filters.date_from) : null}
          onChange={(val: Dayjs | null) =>
            setFilters({
              ...filters,
              date_from: val?.toISOString() ?? undefined,
              page: 1,
            })
          }
          slotProps={{
            textField: { size: "small", sx: { minWidth: 150 } },
          }}
        />
        <DatePicker
          label="To"
          value={filters.date_to ? dayjs(filters.date_to) : null}
          onChange={(val: Dayjs | null) =>
            setFilters({
              ...filters,
              date_to: val?.toISOString() ?? undefined,
              page: 1,
            })
          }
          slotProps={{
            textField: { size: "small", sx: { minWidth: 150 } },
          }}
        />

        <Tooltip title="Clear filters">
          <IconButton onClick={handleClear} size="small">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Data Table */}
      <DataGrid
        rows={data?.records ?? []}
        columns={columns}
        rowCount={data?.total ?? 0}
        loading={isLoading}
        paginationMode="server"
        paginationModel={{
          page: (filters.page || 1) - 1,
          pageSize: filters.limit,
        }}
        onPaginationModelChange={(model) =>
          setFilters((prev) => ({
            ...prev,
            page: model.page + 1,
            limit: model.pageSize,
          }))
        }
        pageSizeOptions={[25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "background.paper",
          },
        }}
      />

      <Dialog
        open={confirmResendId !== null}
        onClose={() => setConfirmResendId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Resend invoice email?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            We have already sent the invoice email for this order. Are you sure
            you want to resend it?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmResendId(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<ReplayIcon />}
            onClick={() => {
              if (confirmResendId !== null) {
                setSendingId(confirmResendId);
                sendInvoiceMutation.mutate(confirmResendId);
                setConfirmResendId(null);
              }
            }}
          >
            Resend
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
