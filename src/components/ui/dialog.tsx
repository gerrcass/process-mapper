"use client";

import * as React from "react";
import { Dialog as RadixDialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & { size?: "sm" | "md" | "lg" }
>(function DialogContent({ className, children, size = "md", ...props }, ref) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/25 data-[state=open]:animate-fade-in" />
      <RadixDialog.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
          "rounded-panel border border-line bg-paper-raised p-6 shadow-lift",
          "data-[state=open]:animate-fade-up focus:outline-none sm:p-7",
          size === "sm" && "max-w-[420px]",
          size === "md" && "max-w-[560px]",
          size === "lg" && "max-w-[720px]",
          className,
        )}
        {...props}
      >
        {children}
        <RadixDialog.Close
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-control text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});

export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Title>) {
  return (
    <RadixDialog.Title
      className={cn(
        "font-display text-[30px] leading-[1.1] tracking-[-0.01em] text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Description>) {
  return (
    <RadixDialog.Description
      className={cn("mt-2 max-w-[52ch] text-[13.5px] leading-6 text-ink-soft", className)}
      {...props}
    />
  );
}

export function DialogActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-7 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
      {children}
    </div>
  );
}
