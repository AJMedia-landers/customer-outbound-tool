import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { Chip, IconButton, Tooltip, Box } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import dayjs from "dayjs";
import { useState, useCallback } from "react";
import type { TrackingRecord } from "types";

function CopyableCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%", overflow: "hidden" }}>
      <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
        {value}
      </Box>
      <Tooltip title={copied ? "Copied!" : "Copy"} arrow>
        <IconButton size="small" onClick={handleCopy} sx={{ ml: 0.5, p: 0.25 }}>
          <ContentCopyIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

interface Props {
  records: TrackingRecord[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  onPaginationChange: (model: GridPaginationModel) => void;
}

const columns: GridColDef<TrackingRecord>[] = [
  {
    field: "order_id",
    headerName: "Order ID",
    width: 130,
    renderCell: ({ value }) => <CopyableCell value={value ?? ""} />,
  },
  {
    field: "email",
    headerName: "Email",
    width: 220,
    renderCell: ({ value }) => <CopyableCell value={value ?? ""} />,
  },
  {
    field: "campaign_name",
    headerName: "Campaign",
    width: 170,
    renderCell: ({ value }) => <CopyableCell value={value ?? ""} />,
  },
  {
    field: "store_name",
    headerName: "Store",
    width: 100,
    renderCell: ({ value }) => value || "-",
  },
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
