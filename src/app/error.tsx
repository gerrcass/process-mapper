"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[680px] flex-col items-start justify-center px-6 py-20">
      <BrandMark className="h-10 w-10 text-ink" />
      <p className="eyebrow mt-8">Something went wrong</p>
      <h1 className="mt-2 font-display text-[44px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[54px]">
        This view hit an unexpected error.
      </h1>
      <p className="mt-3 max-w-[56ch] text-[14px] leading-6 text-ink-soft">
        Your maps are still in this browser. Try rendering the view again, or return to the
        workspace and export anything you want to keep.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          Reference {error.digest}
        </p>
      ) : null}
      <div className="mt-7 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="lg" onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <Button asChild size="lg">
          <Link href="/">Back to workspace</Link>
        </Button>
      </div>
    </main>
  );
}
