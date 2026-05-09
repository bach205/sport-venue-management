import { createBrowserRouter, Navigate } from "react-router";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";

import DiscoverPage from "../features/discover/pages/DiscoverPage";
import MessagesPage from "../features/messages/pages/MessagesPage";

import VenuesPage from "../features/venues/pages/VenuesPage";
import VenueDetailPage from "../features/venues/pages/VenueDetailPage";
import BookingsPage from "../features/venues/pages/BookingsPage";

import VenueOwnerDashboard from "../features/owner/pages/VenueOwnerDashboard";
import VenueManagePage from "../features/owner/pages/VenueManagePage";

import ProfilePage from "../features/profile/pages/ProfilePage";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import AppLayout from "@/shared/components/AppLayout";
import AdminLayout from "@/shared/components/AdminLayout";
import OwnerLayout from "@/shared/components/OwnerLayout";

export const router = createBrowserRouter([
  // ─── Auth (no layout) ──────────────────────────────────────────────────────
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },

  // ─── Player / General (AppLayout) ──────────────────────────────────────────
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/discover" replace /> },
      { path: "discover", element: <DiscoverPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "venues", element: <VenuesPage /> },
      { path: "venues/:venueId", element: <VenueDetailPage /> },
      { path: "bookings", element: <BookingsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },

  // ─── Venue Owner Portal (OwnerLayout) ──────────────────────────────────────
  {
    path: "/owner",
    element: <OwnerLayout />,
    children: [
      { index: true, element: <Navigate to="/owner/venues" replace /> },
      { path: "venues", element: <VenueOwnerDashboard /> },
      { path: "venues/:venueId", element: <VenueManagePage /> },
      { path: "bookings", element: <VenueOwnerDashboard /> },
      { path: "analytics", element: <VenueOwnerDashboard /> },
      { path: "settings", element: <VenueOwnerDashboard /> },
    ],
  },

  // ─── Admin Portal (AdminLayout) ────────────────────────────────────────────
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <AdminDashboard /> },
      { path: "reports", element: <AdminDashboard /> },
      { path: "analytics", element: <AdminDashboard /> },
      { path: "settings", element: <AdminDashboard /> },
    ],
  },
]);
