import { useState } from "react";
import { Button, Snackbar, Alert, CircularProgress } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkCompletions } from "api/recovery.api";

export default function CheckCompletionsButton() {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const mutation = useMutation({
    mutationFn: checkCompletions,
    onSuccess: (res) => {
      const d = res.data;
      queryClient.invalidateQueries({ queryKey: ["recovery-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recovery-records"] });
      setSnackbar({
        open: true,
        severity: "success",
        message: `Checked ${d.total_checked} orders: ${d.newly_completed} newly completed, ${d.coupons_confirmed} coupons confirmed, ${d.errors} errors`,
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to check completions",
      });
    },
  });

  return (
    <>
      <Button
        variant="outlined"
        startIcon={
          mutation.isPending ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <SyncIcon />
          )
        }
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        Check Completions
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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
    </>
  );
}
