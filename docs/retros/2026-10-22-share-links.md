# Retro: share links

Date: 2026-10-22
Session shape: grill-with-docs → spec (#12) → tickets (#13–#16) → writing-for-agents → fresh implement-spec session → two-axis review → fix pass → PR #17.

## What worked

- **The ADR did the design work.** The fragment rule, the `z1.`/`u1.` format, the 16,000-character budget, and "adopting is an import" reached the implementers as decisions, not questions. The codec landed matching ADR-0003 on the first pass.
- **The native blocker graph kept the frontier obvious.** #14 and #15 ran in parallel once #13 merged; #16 waited for all three. No implementer had to infer ordering.
- **Browser verification found a real bug.** The #13 implementer discovered that a fragment-only navigation does not reload the document, so a second share link opened in the same tab kept showing the first map. The view now listens for `hashchange`. No unit test would have caught it.
- **The two-axis review caught a spec gap that the tickets missed.** All four tickets passed their own acceptance criteria while the spec's copy → open → adopt → edit → reload journey was still missing. The Spec axis found it, and the fix pass added it.
- **Vocabulary held.** Share link, snapshot, and adopt appear consistently in code, tests, copy, and docs; the readiness review and the shared view now render one summary component instead of two drifting copies.

## Candidates, most severe first

1. **Browser verification is not discoverable** (applied in this retro). The #13 implementer spent about twenty minutes installing a Chrome build through `agent-browser`, then fought the `chrome-devtools` server, while Playwright's Chromium was already installed and later ran the whole journey suite. `AGENTS.md` now names the installed browser as the one to drive.
2. **A spec's browser seam needs an owner** (applied in this retro). The spec named the end-to-end journey; no ticket acceptance criterion carried it. Every ticket was "done" and the seam was still open. `CODING_STANDARDS.md` now tells the reviewer to check the spec's Testing Decisions against the ticket set.
3. **A long delegated session ends near the provider cap** (open). The implementation session did the four tickets, the review, and most of the fix pass before hitting a usage limit; the orchestrator finished the fixes. Not a repo fix: keep the final fix pass short, or run it in the orchestrator.
4. **Screenshot capture is still manual** (open, third appearance). Ticket #16 captured the shared view with an ad-hoc call. A `pnpm screenshots` script against a production server remains the improvement; it was not added here to keep the close-out small.
5. **A bare `/maps` now reads as an empty share link** (accepted). It used to show the missing-map state. The failure-state ticket chose "this link carries no map", and the journey asserts it. It is a deliberate behaviour change, worth remembering if the route grows another entry point.

## Recommendation

Keep the workflow. The two applied changes are cheap and target the two failure modes that actually cost time: a blind browser install and an unowned seam. Add the screenshot script when the visual surface changes again.
