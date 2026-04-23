import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { theme } from "theme";
import { AuthProvider } from "context/AuthContext";
import ProtectedRoute from "components/ProtectedRoute";
import Layout from "components/Layout";
import LoginPage from "pages/LoginPage";
import SignupPage from "pages/SignupPage";
import VerifyPage from "pages/VerifyPage";
import DashboardPage from "pages/DashboardPage";
import OrderEntryPage from "pages/OrderEntryPage";
import OrderEntriesPage from "pages/OrderEntriesPage";
import UserStatsPage from "pages/UserStatsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/order-entry" element={<OrderEntryPage />} />
                    <Route path="/order-entries" element={<OrderEntriesPage />} />
                    <Route path="/user-stats" element={<UserStatsPage />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
