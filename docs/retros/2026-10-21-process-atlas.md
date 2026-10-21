# Retro: Process Atlas build

Date: 2026-10-21
Session shape: setup → grill-with-docs → spec → tickets → writing-for-agents → fresh implement-spec session → code review → PR → verification.

## What worked

- **Native issue graph.** Publishing the spec as issue #1 and the tickets as #2–#10 with GitHub dependencies made the frontier explicit. The fresh session never had to infer ordering.
- **Pointers over prose.** AGENTS.md stayed small and pointed at the glossary, ADRs, design brief, standards, and issues. The implementation session found the rules without a long briefing.
- **A real visual brief.** Palette, type roles, lane tints, and component shapes were decided before implementation. The resulting UI has a consistent point of view.
- **Seams before code.** Domain, store, UI, and browser seams were named in the spec. The suite ended with 94 unit/component tests and 6 Playwright journeys.
- **Review had teeth.** The two-axis review found stale deep-link focus, keyboard selection, modal focus trapping, delete-key scope, reduced motion, SIPOC-order validation, and deterministic ID issues. Those were fixed before the PR was marked ready.
- **CI and local commands agree.** `pnpm verify` covers both the server build and the static export; CI repeats those checks and adds the browser journeys.

## Candidates, most severe first

1. **Standards: event scope and determinism** (applied in this retro). The review surfaced two recurring classes: global keyboard handlers that need to ignore text fields/dialogs, and pure operations that must not invent random identities. Both are now explicit in `CODING_STANDARDS.md`.
2. **Screenshot capture is manual.** The README images were produced with ad-hoc Playwright scripts. A `pnpm screenshots` script against a production server would make visual evidence repeatable and keep the PR body current. Not added here to avoid another moving part at close-out.
3. **The skill bundle is wider than the workflow.** `.agents/skills` contains 38 skills, including in-progress and general-purpose ones. Only the engineering and productivity set is used by this repo. Pruning would reduce the always-loaded skill descriptions; keeping the full bundle preserves the user's requested install. Decide at the workspace level.
4. **No pre-commit hook.** CI is a real guardrail, so this is optional. A local hook running lint and typecheck would shorten the feedback loop but adds tooling. Prefer `pnpm verify` before every push.
5. **Keep the seeded demo deterministic.** The relative timestamps in screenshots drift by design. A future capture script should pin the clock if pixel-stable documentation matters.

## Follow-up: GitHub Pages deployment

The demo was later merged and published at <https://gerrcass.github.io/process-mapper/>. Static hosting exposed a category of failure the original CI missed:

1. **Static export was not checked before merge** (applied). `pnpm build` tested the server build only; the Pages workflow tested the export only after a push to `main`. Added `pnpm build:static`, made `pnpm verify` run it, and added a CI step for it.
2. **Browser journeys were not in CI** (applied). Added a separate Playwright job with Chromium, failure-report upload, and a 15-minute timeout.
3. **Static hosting constraints were not in the steering files** (applied). `AGENTS.md` now points at the export rules, and `CODING_STANDARDS.md` names the route, prerender, and base-path constraints reviewers should enforce.
4. **Screenshot capture is still manual** (open). The README image now comes from the live Pages site, but refreshing it still needs an ad-hoc Playwright call. A `pnpm screenshots` script remains the next tooling improvement.
5. **Local production verification still needs one extra command** (open, low severity). `pnpm verify` covers the export, but a human preview of `/process-mapper/` on a plain static server is still manual.

## Recommendation

Keep the workflow. The deployment guardrails are now in place: both builds run locally and in CI, and the browser journeys gate PRs. Add the screenshot script when the visual surface changes again; do not add a pre-commit framework until the local feedback loop proves too slow.
