"use client";

import * as React from "react";
import { DropdownMenu as RadixDropdown } from "radix-ui";
import { cn } from "@/lib/cn";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[190px] overflow-hidden rounded-card border border-line bg-surface p-1.5 shadow-[0_2px_4px_rgba(25,24,19,.05),0_24px_50px_-28px_rgba(25,24,19,.35)]",
          "data-[state=open]:animate-fade-up",
          className,
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
});

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Item>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Item> & { variant?: "default" | "danger" }
>(function DropdownMenuItem({ className, variant = "default", ...props }, ref) {
  return (
    <RadixDropdown.Item
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13px] outline-none transition-colors",
        "data-[highlighted]:bg-paper-raised focus-visible:outline-2 focus-visible:outline-accent",
        variant === "default" && "text-ink data-[highlighted]:text-ink",
        variant === "danger" && "text-accent-strong data-[highlighted]:bg-accent-soft",
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <RadixDropdown.Separator
      ref={ref}
      className={cn("my-1.5 h-px bg-line", className)}
      {...props}
    />
  );
});

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Label>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <RadixDropdown.Label
      ref={ref}
      className={cn(
        "px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted",
        className,
      )}
      {...props}
    />
  );
});
