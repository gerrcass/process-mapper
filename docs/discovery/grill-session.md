# Discovery: Process Atlas

This document records the `/grill-with-docs` session for Process Atlas. The session was run autonomously at the user's request: each frontier question below shows the recommended answer and the decision that followed. The durable outcomes live in [`GLOSSARY.md`](../../GLOSSARY.md) and [`docs/adr/`](../adr/).

## Round 1: product shape

**Q1. What is the product?**
A workspace for framing a process as a SIPOC sheet and mapping the same process as an editable flow. One document, two synchronized views.

➡️ **Decision:** Build a local-first, single-user demo called **Process Atlas**. Its core object is a process map containing a SIPOC sheet and a flow graph.

**Q2. Who is it for?**
The primary user is an operations lead, product manager, or consultant running a process-improvement workshop. They need to frame a process quickly, see where it breaks, and leave with something they can share.

➡️ **Decision:** Optimize for a facilitator who is comfortable with diagramming tools but does not want a heavyweight BPMN suite. Copy and affordances speak to process improvement, not engineering modelling.

**Q3. What must the demo prove?**
That the two views are genuinely one system, not two disconnected diagrams. Editing a step in SIPOC must be visible in the flow, and adding a decision branch in the flow must leave the SIPOC process lane intact.

➡️ **Decision:** The flow graph owns process steps. The SIPOC process lane is a projection of step nodes. This becomes ADR-0002.

**Q4. What is the persistence story?**
No backend. A production-ready demo should not need credentials or infrastructure to run.

➡️ **Decision:** Browser-local persistence with a versioned schema, import/export, and safe resets. This becomes ADR-0001.

## Round 2: interaction model

**Q5. What is the primary editing surface?**
Both views must be editable, or one becomes a report. SIPOC favors fast text entry; the flow favors spatial editing.

➡️ **Decision:** Inline editing and drag-reordering in SIPOC; selection plus an inspector in the flow. Autosave after every committed edit, with undo and redo across both views.

**Q6. How do users start?**
An empty canvas is a bad first impression for a demo.

➡️ **Decision:** Seed the workspace with two complete maps and offer three practical templates plus a blank map. Templates are real documents, not screenshots.

**Q7. How do users know the map is any good?**
A SIPOC sheet can look complete while missing owners or disconnected steps.

➡️ **Decision:** Add a computed **readiness score** with a short, specific checklist. It is advisory, never blocking.

**Q8. What leaves the app?**
The map has to be shareable beyond the browser.

➡️ **Decision:** Export JSON, export the flow as PNG, and print/PDF the SIPOC sheet. Import JSON back into the workspace as a new map.

## Round 3: scope and quality bar

**Q9. What is deliberately out of scope?**
Real-time collaboration, accounts, server storage, AI generation, BPMN import/export, and per-step comments. Those turn a sharp demo into a half-built platform.

➡️ **Decision:** Keep the single-player, local-first boundary. Document it in the spec and README.

**Q10. What does "production-ready" mean here?**
Not just a pretty screen. Typed domain logic, validated persistence, tests at agreed seams, accessible controls, responsive layouts, error states, and CI.

➡️ **Decision:** A pure domain core, a tested store, component tests for the editor's critical interactions, browser tests for the end-to-end journey, and a CI workflow running lint, typecheck, tests, and build.

**Q11. What is the visual direction?**
Most process tools look like enterprise software. The demo should feel like a modern editorial workspace: warm paper, sharp ink, restrained lane colors, and one confident accent.

➡️ **Decision:** An "operations studio" aesthetic: bone paper background, ink typography, tangerine accent, serif display headings, geometric UI sans, and quiet motion. No dark mode in v1.

**Q12. What are the agreed test seams?**
Testing every component would be slow and brittle. Testing only the UI would miss domain regressions.

➡️ **Decision:**
- **Domain seam:** pure functions for map operations, readiness, auto-layout, and import validation.
- **Store seam:** one test file for persistence, undo/redo, and CRUD.
- **UI seam:** SIPOC lane editing and the flow inspector, through user-visible behaviour.
- **Browser seam:** the journey from dashboard to template to edit to reload to export.

## Design tree, resolved

```text
Process Atlas
├── Audience: facilitators, operators, PMs
├── Core object: process map
│   ├── SIPOC sheet (5 lanes)
│   │   ├── entries: inline edit, add, delete, reorder
│   │   └── process lane: projection of step nodes
│   └── flow graph
│       ├── nodes: start, step, decision, end
│       ├── edges: flow, exception
│       └── inspector, auto-layout, minimap
├── Persistence: localStorage + versioned schema
│   └── import/export JSON
├── Guidance: readiness score
├── Outputs: PNG, print/PDF, JSON
└── Quality: domain tests, store tests, UI tests, e2e, CI
```
