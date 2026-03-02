import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendRecoveryByEmail } from "api/recovery.api";
import { useState } from "react";
import { AxiosError } from "axios";
import type { ApiError } from "types";

const schema = z.object({
  email: z.string().email("Valid email is required"),
  startDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SendRecoveryDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", startDate: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      sendRecoveryByEmail(data.email, data.startDate || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recovery-records"] });
      reset();
      setError("");
      onClose();
    },
    onError: (err: AxiosError<ApiError>) => {
      setError(err.response?.data?.message ?? "Failed to send recovery email");
    },
  });

  const handleClose = () => {
    reset();
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <DialogTitle>Send Recovery Email</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            autoFocus
            margin="dense"
          />
          <TextField
            label="Start Date (MM/DD/YY)"
            {...register("startDate")}
            placeholder="MM/DD/YY"
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
