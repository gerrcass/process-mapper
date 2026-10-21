import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export function MapNotFound() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-[680px] flex-col items-start px-6 py-20">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-card border border-line bg-surface text-muted">
          <Map className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="eyebrow mt-6">Map not found</p>
        <h1 className="mt-2 font-display text-[44px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[54px]">
          This map is not in this workspace.
        </h1>
        <p className="mt-3 max-w-[54ch] text-[14px] leading-6 text-ink-soft">
          The link may point to a map from another browser profile, or the map was deleted. Process
          maps live in this browser, not on a server.
        </p>
        <div className="mt-7">
          <Button asChild variant="primary" size="lg">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to workspace
            </Link>
          </Button>
        </div>
      </main>
    </>
  );
}
