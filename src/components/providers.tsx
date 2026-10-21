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
            background: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            borderRadius: "14px",
            color: "var(--color-ink)",
            fontFamily: "var(--font-geist-sans)",
            boxShadow: "var(--shadow-soft)",
          },
        }}
      />
    </TooltipProvider>
  );
}
