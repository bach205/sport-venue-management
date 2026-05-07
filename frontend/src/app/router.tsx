import { createBrowserRouter } from "react-router-dom";
import { ShadcnLoginPage } from "@/features/auth/pages/ShadcnLoginPage";
import { ShadcnSignupPage } from "@/features/auth/pages/ShadcnSignupPage";
import Layout from "@/shared/layout/Layout";
import { NotFoundPage } from "@/shared/pages/NotFoundPage";
import { AssetManagementPage } from "@/features/asset-management/assets/pages/AssetManagementPage";
import { MaintenanceDashboardPage } from "@/features/asset-management/maintenance-schedules/pages/MaintenanceDashboardPage";
import { MaintenanceWorkPage } from "@/features/asset-management/maintenance-tasks/pages/MaintenanceWorkPage";
import { ChecklistPage } from "@/features/asset-management/technical-checklists/pages/ChecklistPage";
import { FireSafetyPage } from "@/features/asset-management/fire-safety/pages/FireSafetyPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout>Test layout</Layout>,
  },
  {
    path: "/login",
    element: <ShadcnLoginPage />,
  },
  {
    path: "/register",
    element: <ShadcnSignupPage />,
  },
  {
    path: "/dashboard",
    element: <Layout>Test layout</Layout>,
  },
  {
    path: "/asset-management/assets",
    element: (
      <Layout>
        <AssetManagementPage />
      </Layout>
    ),
  },
  {
    path: "/asset-management/maintenance-dashboard",
    element: (
      <Layout>
        <MaintenanceDashboardPage />
      </Layout>
    ),
  },
  {
    path: "/asset-management/maintenance-work",
    element: (
      <Layout>
        <MaintenanceWorkPage />
      </Layout>
    ),
  },
  {
    path: "/asset-management/checklists",
    element: (
      <Layout>
        <ChecklistPage />
      </Layout>
    ),
  },
  {
    path: "/asset-management/fire-safety",
    element: (
      <Layout>
        <FireSafetyPage />
      </Layout>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
