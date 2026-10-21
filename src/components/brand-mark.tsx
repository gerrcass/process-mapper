import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={cn("h-8 w-8", className)}>
      <rect x="1" y="1" width="38" height="38" rx="10" fill="currentColor" />
      <path
        d="M12.5 13.5H27.5L20 27.5L12.5 13.5Z"
        stroke="var(--color-paper)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12.5 13.5L20 27.5" stroke="var(--color-accent)" strokeWidth="1.6" />
      <circle cx="12.5" cy="13.5" r="3" fill="var(--color-paper)" />
      <circle cx="27.5" cy="13.5" r="3" fill="var(--color-paper)" />
      <circle cx="20" cy="27.5" r="3" fill="var(--color-accent)" />
    </svg>
  );
}
