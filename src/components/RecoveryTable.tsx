import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { Chip } from "@mui/material";
import dayjs from "dayjs";
import type { TrackingRecord } from "types";

interface Props {
  records: TrackingRecord[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  onPaginationChange: (model: GridPaginationModel) => void;
}

const columns: GridColDef<TrackingRecord>[] = [
  { field: "order_id", headerName: "Order ID", width: 110 },
  { field: "email", headerName: "Email", width: 200 },
  { field: "campaign_name", headerName: "Campaign", width: 150 },
  { field: "coupon_code", headerName: "Coupon", width: 110 },
  { field: "emails_sent", headerName: "Emails Sent", width: 100, type: "number" },
  { field: "order_status", headerName: "Status", width: 110 },
  {
    field: "order_completed",
    headerName: "Completed",
    width: 110,
    renderCell: ({ value }) => (
      <Chip
        label={value ? "Yes" : "No"}
        color={value ? "success" : "default"}
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    field: "coupon_used",
    headerName: "Coupon Used",
    width: 110,
    renderCell: ({ value }) => (
      <Chip
        label={value ? "Yes" : "No"}
        color={value ? "warning" : "default"}
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    field: "recovery_sent_at",
    headerName: "Sent At",
    width: 160,
    valueFormatter: (value: string) => (value ? dayjs(value).format("MMM D, YYYY h:mm A") : ""),
  },
  {
    field: "order_completed_at",
    headerName: "Completed At",
    width: 160,
    valueFormatter: (value: string | null) =>
      value ? dayjs(value).format("MMM D, YYYY h:mm A") : "",
  },
];

export default function RecoveryTable({
  records,
  total,
  page,
  limit,
  loading,
  onPaginationChange,
}: Props) {
  return (
    <DataGrid
      rows={records}
      columns={columns}
      rowCount={total}
      loading={loading}
      paginationMode="server"
      paginationModel={{ page: page - 1, pageSize: limit }}
      onPaginationModelChange={(model) =>
        onPaginationChange({ page: model.page + 1, pageSize: model.pageSize })
      }
      pageSizeOptions={[25, 50, 100]}
      disableRowSelectionOnClick
      autoHeight
      sx={{
        border: 1,
        borderColor: "divider",
        "& .MuiDataGrid-cell": { py: 1 },
      }}
    />
  );
}
