import Link from "next/link";
import { HardDrive } from "lucide-react";
import { BrandMark } from "./brand-mark";

export function AppHeader() {
  return (
    <header className="app-header sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <BrandMark className="h-8 w-8 text-ink transition-transform duration-150 group-hover:-translate-y-px" />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              Process Atlas
            </span>
            <span className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
              Operations studio
            </span>
          </span>
        </Link>
        <div className="hidden items-center gap-2 text-[12px] text-muted sm:flex">
          <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Stored in this browser</span>
        </div>
      </div>
    </header>
  );
}
