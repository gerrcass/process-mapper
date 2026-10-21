# Process Atlas

Local-first SIPOC and process-mapping demo. Next.js App Router, TypeScript, Tailwind CSS v4, React Flow, Zustand.

## Start here

- **Spec:** GitHub issue #1. **Tickets:** #2–#10. Read with `gh issue view <n>`; the blocker graph is native.
- **Domain language:** `GLOSSARY.md`. Use its terms in code, tests, copy, and commits.
- **Decisions:** `docs/adr/`. Read the two ADRs before changing persistence or the two-view model.
- **Visual direction:** `docs/design/brief.md`. Use its tokens and patterns instead of inventing a local style.
- **Review standards:** `CODING_STANDARDS.md`. The reviewer reads this; implementers should too.
- **Tracker conventions:** `docs/agents/issue-tracker.md`.

## Commands

- `pnpm dev` — local development.
- `pnpm verify` — lint, typecheck, unit/component tests, and production build. This is the definition of a clean branch.
- `pnpm test:e2e` — Playwright journeys; run when touching the editor, persistence, or exports.

No environment variables, backend, or accounts. Map data lives in the browser; see ADR-0001.

## Rules that are easy to miss

- The **flow graph owns process steps**; the SIPOC Process lane is derived. Do not add a second step collection. See ADR-0002.
- Map mutations go through **pure operations** and then the store. Components do not edit document internals.
- Validate every boundary: persisted payloads, imported files, and parsed form values.
- The editor is client-side and hydration-safe: no `localStorage` reads during render, and a stable skeleton until rehydration finishes.
- Use the existing UI primitives and design tokens. New dependencies need a reason in the ticket.
- Interactive controls need an accessible name, visible focus, and a keyboard path.

## Skill workflow

User-invoked skills are in `.agents/skills/`. The working sequence for this repo is `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement-spec`, with `/pr`, `/code-review`, and `/retro` at close-out. Do not re-run `/setup-matt-pocock-skills`; its output is already in `docs/agents/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
