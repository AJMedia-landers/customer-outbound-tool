import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Container,
  Tabs,
  Tab,
} from "@mui/material";
import { useAuth } from "context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/" },
  { label: "Order Entry", path: "/order-entry" },
  { label: "Order Entries", path: "/order-entries" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const initials = user
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : "";

  const currentTab = NAV_ITEMS.findIndex(
    (item) => item.path === location.pathname
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Customer Outbound Tool
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: "secondary.main", width: 36, height: 36, fontSize: 14 }}>
              {initials}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem disabled>
              {user?.first_name} {user?.last_name}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                logout();
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Tabs
            value={currentTab === -1 ? 0 : currentTab}
            onChange={(_, idx) => navigate(NAV_ITEMS[idx].path)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            }}
          >
            {NAV_ITEMS.map((item) => (
              <Tab key={item.path} label={item.label} />
            ))}
          </Tabs>
        </Container>
      </Box>
      <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
