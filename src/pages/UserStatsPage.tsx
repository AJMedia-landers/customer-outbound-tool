import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "context/AuthContext";
import {
  getOrderEntryUserStats,
  type UserStatsFilters,
} from "api/order-entry.api";

export default function UserStatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  const [filters, setFilters] = useState<UserStatsFilters>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["order-entry-user-stats", filters],
    queryFn: () => getOrderEntryUserStats(filters).then((r) => r.data),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <Box>
        <Alert severity="error" action={
          <Typography
            component="span"
            sx={{ cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/")}
          >
            Go back
          </Typography>
        }>
          You don't have access to this page.
        </Alert>
      </Box>
    );
  }

  const rows = (data?.stats ?? []).map((s, idx) => ({
    id: s.user_id ?? `unknown-${idx}`,
    ...s,
  }));

  const totalOrders = rows.reduce((sum, r) => sum + (r.total_orders || 0), 0);
  const totalAmount = rows.reduce(
    (sum, r) => sum + (parseFloat(r.total_amount) || 0),
    0,
  );

  const columns: GridColDef[] = [
    {
      field: "user_name",
      headerName: "User",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 220,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "total_orders",
      headerName: "Total Orders",
      width: 140,
      type: "number",
      align: "left",
      headerAlign: "left",
    },
    {
      field: "total_amount",
      headerName: "Total Amount",
      width: 160,
      align: "left",
      headerAlign: "left",
      renderCell: (params) =>
        params.value ? `$${parseFloat(params.value).toFixed(2)}` : "$0.00",
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Order Entry User Stats
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 3 }}
      >
        <DatePicker
          label="From"
          value={filters.date_from ? dayjs(filters.date_from) : null}
          onChange={(val: Dayjs | null) =>
            setFilters((prev) => ({
              ...prev,
              date_from: val?.startOf("day").toISOString() ?? undefined,
            }))
          }
          slotProps={{
            textField: { size: "small", sx: { minWidth: 150 } },
          }}
        />
        <DatePicker
          label="To"
          value={filters.date_to ? dayjs(filters.date_to) : null}
          onChange={(val: Dayjs | null) =>
            setFilters((prev) => ({
              ...prev,
              date_to: val?.endOf("day").toISOString() ?? undefined,
            }))
          }
          slotProps={{
            textField: { size: "small", sx: { minWidth: 150 } },
          }}
        />
        <Tooltip title="Clear filters">
          <IconButton onClick={() => setFilters({})} size="small">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as Error).message}
        </Alert>
      )}

      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        disableRowSelectionOnClick
        autoHeight
        initialState={{
          pagination: { paginationModel: { pageSize: 25, page: 0 } },
        }}
        pageSizeOptions={[25, 50, 100]}
        sx={{
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "background.paper",
          },
        }}
      />
    </Box>
  );
}
