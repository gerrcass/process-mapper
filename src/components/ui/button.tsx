import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "border border-ink bg-ink text-paper hover:bg-ink-soft hover:border-ink-soft active:bg-ink",
  secondary:
    "border border-line bg-surface text-ink hover:border-line-strong hover:bg-paper-raised active:bg-paper",
  ghost:
    "border border-transparent bg-transparent text-ink-soft hover:bg-paper-raised hover:text-ink",
  danger:
    "border border-line bg-surface text-accent hover:border-accent/40 hover:bg-accent-soft active:bg-accent-soft",
  accent:
    "border border-accent bg-accent text-paper hover:border-accent-strong hover:bg-accent-strong",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-control px-3 text-[12.5px]",
  md: "h-9 gap-2 rounded-control px-3.5 text-[13px]",
  lg: "h-11 gap-2 rounded-control px-5 text-[14px]",
  icon: "h-8 w-8 rounded-control p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", type = "button", asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      {...(asChild ? {} : { type })}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow] duration-150 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
