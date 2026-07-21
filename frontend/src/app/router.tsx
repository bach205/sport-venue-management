import { createBrowserRouter, Navigate } from "react-router";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";

import DiscoverPage from "../features/discover/pages/DiscoverPage";
import MessagesPage from "../features/messages/pages/MessagesPage";
import GuestHomePage from "../features/home/pages/GuestHomePage";

import VenuesPage from "../features/venues/pages/VenuesPage";
import VenueDetailPage from "../features/venues/pages/VenueDetailPage";
import BookingsPage from "../features/venues/pages/BookingsPage";

import VenueOwnerDashboard from "../features/owner/pages/VenueOwnerDashboard";
import VenueManagePage from "../features/owner/pages/VenueManagePage";

import ProfilePage from "../features/profile/pages/ProfilePage";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import AdminStatisticsPage from "../features/admin/pages/AdminStatisticsPage";
import FeedPage from "../features/feed/pages/FeedPage";
import FeedPostDetailPage from "../features/feed/pages/FeedPostDetailPage";
import FeedbackPage from "../features/feedback/pages/FeedbackPage";
import AdminFeedbackPage from "../features/feedback/pages/AdminFeedbackPage";
import WalletPage from "../features/wallet/pages/WalletPage";
import AdminWalletPage from "../features/wallet/pages/AdminWalletPage";
import AppLayout from "@/shared/components/AppLayout";
import AdminLayout from "@/shared/components/AdminLayout";
import OwnerLayout from "@/shared/components/OwnerLayout";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import AuthRequiredRoute from "./AuthRequiredRoute";

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
          { index: true, element: <Navigate to="/home" replace /> },
          { path: "home", element: <GuestHomePage /> },
          { path: "discover", element: <DiscoverPage /> },
          { path: "messages", element: <AuthRequiredRoute><MessagesPage /></AuthRequiredRoute> },
          { path: "venues", element: <VenuesPage /> },
          { path: "venues/:venueId", element: <VenueDetailPage /> },
          { path: "bookings", element: <AuthRequiredRoute><BookingsPage /></AuthRequiredRoute> },
          { path: "wallet", element: <AuthRequiredRoute><WalletPage /></AuthRequiredRoute> },
          { path: "profile", element: <AuthRequiredRoute><ProfilePage /></AuthRequiredRoute> },
          { path: "feed", element: <FeedPage /> },
          { path: "feed/:postId", element: <FeedPostDetailPage /> },
          { path: "feedback", element: <AuthRequiredRoute><FeedbackPage /></AuthRequiredRoute> },
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
              { path: "statistics", element: <AdminStatisticsPage /> },
              { path: "wallet", element: <AdminWalletPage /> },
              { path: "feedback", element: <AdminFeedbackPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
