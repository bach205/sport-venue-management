import { AppSidebar } from "@/shared/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/shared/components/ui/sidebar";
import LayoutHeader from "./LayoutHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <LayoutHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
