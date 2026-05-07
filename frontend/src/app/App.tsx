import { RouterProvider } from "react-router-dom";
import { ReduxProvider } from "@/app/providers/ReduxProvider";
import { router } from "@/app/router";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Toaster } from "@/shared/components/ui/sonner";

export function App() {
  return (
    <ReduxProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </ReduxProvider>
  );
}
