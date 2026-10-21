# Retro: Process Atlas build

Date: 2026-10-21
Session shape: setup → grill-with-docs → spec → tickets → writing-for-agents → fresh implement-spec session → code review → PR → verification.

## What worked

- **Native issue graph.** Publishing the spec as issue #1 and the tickets as #2–#10 with GitHub dependencies made the frontier explicit. The fresh session never had to infer ordering.
- **Pointers over prose.** AGENTS.md stayed small and pointed at the glossary, ADRs, design brief, standards, and issues. The implementation session found the rules without a long briefing.
- **A real visual brief.** Palette, type roles, lane tints, and component shapes were decided before implementation. The resulting UI has a consistent point of view.
- **Seams before code.** Domain, store, UI, and browser seams were named in the spec. The suite ended with 94 unit/component tests and 6 Playwright journeys.
- **Review had teeth.** The two-axis review found stale deep-link focus, keyboard selection, modal focus trapping, delete-key scope, reduced motion, SIPOC-order validation, and deterministic ID issues. Those were fixed before the PR was marked ready.
- **CI and local commands agree.** `pnpm verify` and the GitHub Actions job run the same checks, so a green local branch means a green PR.

## Candidates, most severe first

1. **Standards: event scope and determinism** (applied in this retro). The review surfaced two recurring classes: global keyboard handlers that need to ignore text fields/dialogs, and pure operations that must not invent random identities. Both are now explicit in `CODING_STANDARDS.md`.
2. **Screenshot capture is manual.** The README images were produced with ad-hoc Playwright scripts. A `pnpm screenshots` script against a production server would make visual evidence repeatable and keep the PR body current. Not added here to avoid another moving part at close-out.
3. **The skill bundle is wider than the workflow.** `.agents/skills` contains 38 skills, including in-progress and general-purpose ones. Only the engineering and productivity set is used by this repo. Pruning would reduce the always-loaded skill descriptions; keeping the full bundle preserves the user's requested install. Decide at the workspace level.
4. **No pre-commit hook.** CI is a real guardrail, so this is optional. A local hook running lint and typecheck would shorten the feedback loop but adds tooling. Prefer `pnpm verify` before every push.
5. **Keep the seeded demo deterministic.** The relative timestamps in screenshots drift by design. A future capture script should pin the clock if pixel-stable documentation matters.

## Recommendation

Keep the workflow. Add the screenshot script next time the dashboard changes substantially, and treat the two standards added here as review checklist items. Do not add a pre-commit framework until the local feedback loop proves too slow.
