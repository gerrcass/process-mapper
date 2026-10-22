"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, Eye, Link2, Plus, TriangleAlert } from "lucide-react";
import type { ProcessMap } from "@/domain/types";
import { decodeSharePayload } from "@/domain/share-link";
import { mapStats } from "@/domain/operations";
import { evaluateReadiness } from "@/domain/readiness";
import { formatLongDate } from "@/lib/time";
import { mapHref } from "@/lib/routes";
import { useWorkspace } from "@/store/workspace";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/pill";
import { SipocBoard } from "@/components/sipoc/sipoc-board";
import { ReadinessRing } from "@/components/readiness/readiness-badge";

function StaticFlowLoading() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-paper" aria-busy="true">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: "radial-gradient(var(--color-line) 0.6px, transparent 0.6px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-6">
        <div className="skeleton h-10 w-28 rounded-full" />
        <div className="skeleton h-24 w-56 rounded-card" />
        <div className="skeleton h-10 w-28 rounded-full" />
      </div>
      <span className="sr-only">Loading flow diagram</span>
    </div>
  );
}

const StaticFlowView = dynamic(
  () => import("./static-flow-view").then((module) => module.StaticFlowView),
  { ssr: false, loading: () => <StaticFlowLoading /> },
);

type LoadState =
  { status: "reading" } | { status: "error"; error: string } | { status: "ready"; map: ProcessMap };

/**
 * The read-only surface behind a share link: a snapshot of one process map
 * carried in the URL fragment. Decodes after mount so the first client
 * render matches the server render. Exposes no editing control; the only
 * store interaction is adopting the snapshot into the workspace.
 */
export function SharedMapView({ payload }: { payload: string }) {
  const [state, setState] = React.useState<LoadState>({ status: "reading" });

  React.useEffect(() => {
    let cancelled = false;
    void decodeSharePayload(payload).then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: "ready", map: result.value }
          : { status: "error", error: result.error },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (state.status === "reading") return <SharedSkeleton />;
  if (state.status === "error") return <SharedError error={state.error} />;
  return <SharedReadOnly map={state.map} />;
}

function SharedSkeleton() {
  return (
    <div aria-busy="true" aria-label="Reading share link">
      <AppHeader />
      <main className="mx-auto max-w-[1240px] px-6 py-10">
        <div className="skeleton mb-4 h-2.5 w-24 rounded-[4px]" />
        <div className="skeleton mb-3 h-10 w-[min(100%,420px)] rounded-[8px]" />
        <div className="skeleton h-4 w-[min(100%,520px)] rounded-[4px]" />
        <div className="mt-10 grid gap-3 md:grid-cols-5">
          {[0, 1, 2, 3, 4].map((lane) => (
            <div key={lane} className="skeleton h-64 rounded-card" />
          ))}
        </div>
      </main>
    </div>
  );
}

function SharedError({ error }: { error: string }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-[680px] flex-col items-start px-6 py-20">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-card border border-line bg-surface text-warning">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="eyebrow mt-6">Shared map</p>
        <h1 className="mt-2 font-display text-[44px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[54px]">
          This link cannot be read.
        </h1>
        <p className="mt-3 max-w-[54ch] text-[14px] leading-6 text-ink-soft">{error}</p>
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

function SharedReadOnly({ map }: { map: ProcessMap }) {
  const router = useRouter();
  const adoptDocument = useWorkspace((state) => state.adoptDocument);
  const [adopting, setAdopting] = React.useState(false);
  const stats = mapStats(map);
  const readiness = evaluateReadiness(map);
  const failedChecks = readiness.checks.filter((check) => !check.passed);

  const handleAdopt = async () => {
    setAdopting(true);
    try {
      const id = await adoptDocument(map);
      router.push(mapHref(id));
    } finally {
      setAdopting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-paper">
      <AppHeader />

      <div role="note" className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-1 px-3 py-2.5 text-[12px] text-ink-soft sm:px-6">
          <span className="inline-flex items-center gap-1.5 font-medium text-ink">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Shared snapshot
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Read-only
          </span>
          <span>Anyone with the link can read this map.</span>
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-3 py-6 sm:px-6">
        <section
          aria-label="Map details"
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div className="min-w-0">
            <p className="eyebrow">Shared map</p>
            <h1 className="mt-2 font-display text-[36px] leading-[1.05] tracking-[-0.01em] text-ink">
              {map.title}
            </h1>
            {map.description ? (
              <p className="mt-2 max-w-[80ch] text-[13px] leading-5 text-ink-soft">
                {map.description}
              </p>
            ) : null}
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              Updated {formatLongDate(map.updatedAt)} · {stats.steps} process steps ·{" "}
              {stats.entries} SIPOC entries
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" disabled={adopting} onClick={() => void handleAdopt()}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add to my workspace
            </Button>
            <StatusPill status={map.status} />
          </div>
        </section>

        <section
          aria-labelledby="shared-readiness-title"
          className="mt-6 rounded-panel border border-line bg-paper-raised p-5"
        >
          <div className="flex items-center gap-4">
            <ReadinessRing score={readiness.score} size={44} />
            <div>
              <h2 id="shared-readiness-title" className="text-[13px] font-semibold text-ink">
                Readiness
              </h2>
              <p className="mt-0.5 text-[15px] font-medium leading-5 text-ink">{readiness.level}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {readiness.score} of 100 · {readiness.passed} of {readiness.total} checks pass
              </p>
            </div>
          </div>
          {failedChecks.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {failedChecks.map((check) => (
                <li
                  key={check.id}
                  className="flex items-start gap-2.5 rounded-[8px] bg-warning-soft/50 px-3 py-2"
                >
                  <TriangleAlert
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium leading-4 text-ink">
                      {check.label}
                      <span className="sr-only">: needs work</span>
                    </p>
                    <p className="mt-0.5 text-[10.5px] leading-4 text-muted">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-success">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              All checks pass.
            </p>
          )}
        </section>

        <section aria-label="SIPOC sheet" className="mt-8">
          <h2 className="mb-4 font-display text-[24px] leading-tight tracking-[-0.01em] text-ink">
            SIPOC sheet
          </h2>
          <SipocBoard map={map} readOnly />
        </section>

        <section aria-label="Flow diagram" className="mt-8">
          <h2 className="mb-4 font-display text-[24px] leading-tight tracking-[-0.01em] text-ink">
            Flow
          </h2>
          <div className="h-[480px] overflow-hidden rounded-panel border border-line">
            <StaticFlowView map={map} />
          </div>
        </section>
      </main>
    </div>
  );
}
