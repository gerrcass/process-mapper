"use client";

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={220}>
      {children}
      <Toaster
        position="bottom-right"
        gap={10}
        toastOptions={{
          style: {
            background: "#FFFFFF",
            border: "1px solid #DFD9CB",
            borderRadius: "14px",
            color: "#191813",
            fontFamily: "var(--font-geist-sans)",
            boxShadow: "0 1px 2px rgba(25,24,19,.04), 0 16px 40px -24px rgba(25,24,19,.28)",
          },
        }}
      />
    </TooltipProvider>
  );
}
