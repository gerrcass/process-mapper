"use client";

import { cn } from "@/lib/cn";
import type { ReadinessLevel } from "@/domain/readiness";

function readinessColor(score: number): string {
  if (score === 100) return "var(--color-success)";
  if (score >= 70) return "var(--color-warning)";
  return "var(--color-accent)";
}

export function ReadinessRing({
  score,
  size = 28,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const stroke = 2.4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color = readinessColor(score);

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 180ms ease-out, stroke 180ms ease-out" }}
        />
      </svg>
      <span
        className="absolute font-mono font-medium leading-none"
        style={{ color, fontSize: size <= 30 ? 8 : 11 }}
      >
        {score}
      </span>
    </span>
  );
}

export function ReadinessBadge({
  score,
  level,
  onClick,
}: {
  score: number;
  level: ReadinessLevel;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Readiness ${score} of 100, ${level}. Review map`}
      className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-surface pl-1 pr-2 transition-colors hover:border-line-strong hover:bg-paper-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:pr-2.5"
    >
      <ReadinessRing score={score} size={24} />
      <span className="hidden flex-col items-start leading-none sm:flex">
        <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
          Readiness
        </span>
        <span className="mt-1 text-[10.5px] font-medium text-ink-soft">{level}</span>
      </span>
    </button>
  );
}
