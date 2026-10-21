"use client";

import { ArrowUpRight, FilePlus2 } from "lucide-react";
import { MAP_TEMPLATES } from "@/domain/templates";
import { mapStats } from "@/domain/operations";
import { cn } from "@/lib/cn";

const TINTS = [
  "bg-suppliers-tint",
  "bg-inputs-tint",
  "bg-process-tint",
  "bg-outputs-tint",
  "bg-customers-tint",
];

function TemplatePreview({ steps }: { steps: number }) {
  return (
    <span className="flex h-8 items-end gap-1" aria-hidden="true">
      {TINTS.map((tint, index) => (
        <span
          key={tint}
          className={cn("relative h-full flex-1 overflow-hidden rounded-[3px]", tint)}
        >
          {Array.from({ length: index === 2 ? Math.min(Math.max(steps, 1), 4) : 2 }).map(
            (_, line) => (
              <span
                key={line}
                className="absolute left-1 right-1 h-[2px] rounded-full bg-ink/15"
                style={{ top: `${7 + line * 7}px` }}
              />
            ),
          )}
        </span>
      ))}
    </span>
  );
}

export function TemplateGallery({
  onUseTemplate,
}: {
  onUseTemplate: (templateId: string) => void;
}) {
  return (
    <section className="mt-14 border-t border-line pt-8" aria-labelledby="templates-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Templates</p>
          <h2
            id="templates-heading"
            className="mt-1 font-display text-[30px] leading-none text-ink"
          >
            Start from a proven shape.
          </h2>
        </div>
        <p className="max-w-[40ch] text-[12px] leading-5 text-muted">
          Each template is a complete SIPOC frame and flow. Use it as-is, then make it yours.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => onUseTemplate("blank")}
          aria-label="Start a blank map"
          className="group flex min-h-[168px] flex-col rounded-card border border-dashed border-line-strong bg-paper-raised p-4 text-left transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-ink/30 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-line bg-surface text-muted">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="mt-3 font-display text-[22px] leading-tight text-ink">Blank map</span>
          <span className="mt-1 text-[12px] leading-5 text-muted">
            Empty lanes and an empty flow. For your own process.
          </span>
          <span className="mt-auto inline-flex items-center gap-1 pt-4 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
            Start blank
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </span>
        </button>

        {MAP_TEMPLATES.map((template) => {
          const stats = mapStats(template.document);
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onUseTemplate(template.id)}
              aria-label={`Use ${template.name} template`}
              className="group flex min-h-[168px] flex-col rounded-card border border-line bg-surface p-4 text-left shadow-card transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <TemplatePreview steps={stats.steps} />
              <span className="mt-3 font-display text-[22px] leading-tight text-ink">
                {template.name}
              </span>
              <span className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted">
                {template.summary}
              </span>
              <span className="mt-auto flex items-center gap-1.5 pt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                {stats.steps} steps
                <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />
                {stats.entries} entries
                <ArrowUpRight
                  className="ml-auto h-3 w-3 text-muted transition-colors group-hover:text-ink"
                  aria-hidden="true"
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
