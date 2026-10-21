import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[680px] flex-col items-start justify-center px-6 py-20">
      <BrandMark className="h-10 w-10 text-ink" />
      <p className="eyebrow mt-8">404</p>
      <h1 className="mt-2 font-display text-[48px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[60px]">
        There is nothing at this address.
      </h1>
      <p className="mt-3 max-w-[52ch] text-[14px] leading-6 text-ink-soft">
        The page may have moved, or the link was mistyped. The workspace is still where you left it.
      </p>
      <div className="mt-7">
        <Button asChild variant="primary" size="lg">
          <Link href="/">Back to workspace</Link>
        </Button>
      </div>
    </main>
  );
}
