import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={cn("h-8 w-8", className)}>
      <rect x="1" y="1" width="38" height="38" rx="10" fill="currentColor" />
      <path
        d="M12.5 13.5H27.5L20 27.5L12.5 13.5Z"
        stroke="#F4F1E9"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12.5 13.5L20 27.5" stroke="#D14A24" strokeWidth="1.6" />
      <circle cx="12.5" cy="13.5" r="3" fill="#F4F1E9" />
      <circle cx="27.5" cy="13.5" r="3" fill="#F4F1E9" />
      <circle cx="20" cy="27.5" r="3" fill="#D14A24" />
    </svg>
  );
}
