import * as React from "react";
import { Link, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/shared/components/ui/sidebar";
import {
  BriefcaseBusinessIcon,
  ClipboardCheckIcon,
  DatabaseIcon,
  FileTextIcon,
  GalleryVerticalEndIcon,
  HeadphonesIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  UserCogIcon,
  WrenchIcon,
} from "lucide-react";

export type SidebarSubItem = {
  title: string;
  url: string;
  isActive?: boolean;
};

export type SidebarMainItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items?: SidebarSubItem[];
};

export type SidebarData = {
  navMain: SidebarMainItem[];
};

const data: SidebarData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Data Management",
      url: "/data-management",
      icon: DatabaseIcon,
      items: [
        { title: "Buildings", url: "/data-management/buildings" },
        { title: "Residents", url: "/data-management/residents" },
        { title: "Vehicles", url: "/data-management/vehicles" },
        {
          title: "Internal Contacts",
          url: "/data-management/internal-contacts",
        },
      ],
    },
    {
      title: "Service Management",
      url: "/service-management",
      icon: WrenchIcon,
      items: [
        { title: "Services", url: "/service-management/services" },
        { title: "Access Cards", url: "/service-management/access-cards" },
        { title: "Fee Formulas", url: "/service-management/fee-formulas" },
        {
          title: "Service Contracts",
          url: "/service-management/service-contracts",
        },
        {
          title: "Service Operations",
          url: "/service-management/service-operations",
        },
      ],
    },
    {
      title: "Asset Management",
      url: "/asset-management",
      icon: BriefcaseBusinessIcon,
      items: [
        { title: "Assets", url: "/asset-management/assets" },
        { title: "Fire Safety", url: "/asset-management/fire-safety" },
        {
          title: "Maintenance Work",
          url: "/asset-management/maintenance-work",
        },
        {
          title: "Maintenance Dashboard",
          url: "/asset-management/maintenance-dashboard",
        },
        {
          title: "Technical Checklists",
          url: "/asset-management/checklists",
        },
      ],
    },
    {
      title: "Financial Management",
      url: "/finance-management",
      icon: LandmarkIcon,
      items: [
        { title: "Cashbook", url: "/finance-management/cashbook" },
        { title: "Fee Notices", url: "/finance-management/fee-notices" },
        { title: "Payments", url: "/finance-management/payments" },
        {
          title: "Financial Reports",
          url: "/finance-management/financial-reports",
        },
      ],
    },
    {
      title: "Customer Service",
      url: "/customer-care",
      icon: HeadphonesIcon,
      items: [
        { title: "Complaints", url: "/customer-care/complaints" },
        { title: "Feedback", url: "/customer-care/feedback" },
        { title: "Greetings", url: "/customer-care/greetings" },
        { title: "Notifications", url: "/customer-care/notifications" },
      ],
    },
    {
      title: "Task Management",
      url: "/task-management",
      icon: ClipboardCheckIcon,
      items: [
        { title: "Internal Tasks", url: "/task-management/internal-tasks" },
        { title: "KPI Tracking", url: "/task-management/kpi-tracking" },
      ],
    },
    {
      title: "Document Management",
      url: "/document-management",
      icon: FileTextIcon,
      items: [
        {
          title: "Internal Documents",
          url: "/document-management/internal-documents",
        },
        {
          title: "Project Documents",
          url: "/document-management/project-documents",
        },
        {
          title: "Resident Documents",
          url: "/document-management/resident-documents",
        },
      ],
    },
    {
      title: "HR & Admin",
      url: "/system-management",
      icon: UserCogIcon,
      items: [
        {
          title: "Building Settings",
          url: "/system-management/building-settings",
        },
        {
          title: "Centralized Management",
          url: "/system-management/centralized-management",
        },
        { title: "Departments", url: "/system-management/departments" },
        { title: "Employees", url: "/system-management/employees" },
        { title: "Permissions", url: "/system-management/permissions" },
      ],
    },
  ],
};

function isRouteActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEndIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Matchill</span>
                  <span>Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isRouteActive(pathname, item.url)}
                  tooltip={item.title}
                >
                  <Link to={item.url} className="font-medium">
                    {item?.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={subItem.isActive || isRouteActive(pathname, subItem.url)}
                        >
                          <Link to={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
