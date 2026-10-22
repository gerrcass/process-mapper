# Process Atlas

Local-first SIPOC and process-mapping demo. Next.js App Router, TypeScript, Tailwind CSS v4, React Flow, Zustand.

## Start here

- **Live demo:** https://gerrcass.github.io/process-mapper/
- **Spec:** GitHub issue #12. **Tickets:** #13–#16. Read with `gh issue view <n>`; the blocker graph is native. The first slice is issue #1 with tickets #2–#10.
- **Domain language:** `GLOSSARY.md`. Use its terms in code, tests, copy, and commits.
- **Decisions:** `docs/adr/`. Read them before changing persistence, the two-view model, or share links.
- **Visual direction:** `docs/design/brief.md`. Use its tokens and patterns instead of inventing a local style.
- **Review standards:** `CODING_STANDARDS.md`. The reviewer reads this; implementers should too.
- **Tracker conventions:** `docs/agents/issue-tracker.md`.

## Commands

- `pnpm dev` — local development.
- `pnpm verify` — lint, typecheck, unit/component tests, server build, and static export. This is the definition of a clean branch.
- `pnpm build:static` — reproduce the GitHub Pages static export locally.
- `pnpm test:e2e` — Playwright journeys; run when touching the editor, persistence, exports, or routes. For UI verification, drive the installed Playwright Chromium (`pnpm exec playwright ...`); it is already there.

There are no runtime environment variables, backend, or accounts. Map data lives in the browser; see ADR-0001. Deployment-only Pages variables are documented in `README.md`.

## Rules that are easy to miss

- The **flow graph owns process steps**; the SIPOC Process lane is derived. Do not add a second step collection. See ADR-0002.
- Map mutations go through **pure operations** and then the store. Components do not edit document internals.
- Validate every boundary: persisted payloads, imported files, share link payloads, and parsed form values.
- The editor is client-side and hydration-safe: no `localStorage` reads during render, and a stable skeleton until rehydration finishes.
- Use the existing UI primitives and design tokens. New dependencies need a reason in the ticket.
- Share links ride the fragment of the `/maps` route and are validated like any other boundary. A link carries a fixed snapshot; recipients adopt it into their workspace. See ADR-0003 and the glossary terms.
- Interactive controls need an accessible name, visible focus, and a keyboard path.
- **Static hosting:** GitHub Pages serves a static export and the editor is the `/maps?map=<id>` route. Read the static-export rules in `CODING_STANDARDS.md` before changing routes, metadata, or assets.

## Skill workflow

User-invoked skills are in `.agents/skills/`. The working sequence for this repo is `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement-spec`, with `/pr`, `/code-review`, and `/retro` at close-out. Do not re-run `/setup-matt-pocock-skills`; its output is already in `docs/agents/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
