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
import FeedPage from "../features/feed/pages/FeedPage";
import FeedPostDetailPage from "../features/feed/pages/FeedPostDetailPage";
import WalletPage from "../features/wallet/pages/WalletPage";
import AdminWalletPage from "../features/wallet/pages/AdminWalletPage";
import AppLayout from "@/shared/components/AppLayout";
import AdminLayout from "@/shared/components/AdminLayout";
import OwnerLayout from "@/shared/components/OwnerLayout";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },

  {
    element: <ProtectedRoute />,
    children: [
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
          { path: "wallet", element: <WalletPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "feed", element: <FeedPage /> },
          { path: "feed/:postId", element: <FeedPostDetailPage /> },
        ],
      },

      {
        element: <RoleGuard allowedRoles={["owner", "admin"]} />,
        children: [
          {
            path: "/owner",
            element: <OwnerLayout />,
            children: [
              { index: true, element: <Navigate to="/owner/venues" replace /> },
              { path: "venues", element: <VenueOwnerDashboard /> },
              { path: "venues/:venueId", element: <VenueManagePage /> },
              { path: "wallet", element: <WalletPage /> },
              { path: "bookings", element: <VenueOwnerDashboard /> },
              { path: "analytics", element: <VenueOwnerDashboard /> },
              { path: "settings", element: <VenueOwnerDashboard /> },
            ],
          },
        ],
      },

      {
        element: <RoleGuard allowedRoles={["admin"]} />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: "wallet", element: <AdminWalletPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
