import { useState } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import { useQuery } from "@tanstack/react-query";
import type { RecoveryFilters } from "types";
import { getRecords } from "api/recovery.api";
import { useAuth } from "context/AuthContext";
import StatsCards from "components/StatsCards";
import FiltersBar from "components/FiltersBar";
import RecoveryTable from "components/RecoveryTable";
import SendRecoveryDialog from "components/SendRecoveryDialog";
import CheckCompletionsButton from "components/CheckCompletionsButton";
import type { GridPaginationModel } from "@mui/x-data-grid";

const ADMIN_EMAIL = "ivan.plametiuk@ajmedia.io";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [filters, setFilters] = useState<RecoveryFilters>({
    page: 1,
    limit: 50,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

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

      <StatsCards />

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
