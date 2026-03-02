import { useState, useEffect, useRef, useCallback } from "react";
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import type { RecoveryFilters } from "types";

interface Props {
  filters: RecoveryFilters;
  onFiltersChange: (filters: RecoveryFilters) => void;
}

export default function FiltersBar({ filters, onFiltersChange }: Props) {
  const [emailInput, setEmailInput] = useState(filters.email ?? "");
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;

  const stableOnChange = useCallback((value: string) => {
    onFiltersChangeRef.current({
      ...filtersRef.current,
      email: value || undefined,
      page: 1,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInput !== (filtersRef.current.email ?? "")) {
        stableOnChange(emailInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [emailInput, stableOnChange]);

  const handleClear = () => {
    setEmailInput("");
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
      <TextField
        size="small"
        label="Search email"
        value={emailInput}
        onChange={(e) => setEmailInput(e.target.value)}
        sx={{ minWidth: 200 }}
      />
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Completed</InputLabel>
        <Select
          label="Completed"
          value={filters.completed ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              completed: e.target.value || undefined,
              page: 1,
            })
          }
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Yes</MenuItem>
          <MenuItem value="false">No</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Coupon Used</InputLabel>
        <Select
          label="Coupon Used"
          value={filters.coupon_used ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              coupon_used: e.target.value || undefined,
              page: 1,
            })
          }
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Yes</MenuItem>
          <MenuItem value="false">No</MenuItem>
        </Select>
      </FormControl>
      <DatePicker
        label="From"
        value={filters.date_from ? dayjs(filters.date_from) : null}
        onChange={(val: Dayjs | null) =>
          onFiltersChange({
            ...filters,
            date_from: val?.toISOString() ?? undefined,
            page: 1,
          })
        }
        slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
      />
      <DatePicker
        label="To"
        value={filters.date_to ? dayjs(filters.date_to) : null}
        onChange={(val: Dayjs | null) =>
          onFiltersChange({
            ...filters,
            date_to: val?.toISOString() ?? undefined,
            page: 1,
          })
        }
        slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
      />
      <Tooltip title="Clear filters">
        <IconButton onClick={handleClear} size="small">
          <ClearIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
