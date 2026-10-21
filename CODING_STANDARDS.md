# Coding Standards

These are judgement calls for review. Mechanical rules belong in lint, types, or tests, not here.

## Domain and boundaries

- Use the vocabulary in `GLOSSARY.md`. A “process step” is a flow node of kind `step`; do not introduce synonyms such as task, activity, or stage.
- Domain operations are pure functions over a process map. They return new documents, update timestamps, and never touch browser APIs, React, or the store.
- The store is the only mutation path. Components call store actions; they do not assemble partial documents or mutate nested objects.
- Validate at the edge: persisted state, imported JSON, and file input. Once validated, internal code can trust the document type.
- Keep the flow/node adapter separate from the domain model so React Flow types do not leak into domain tests.
- Entity IDs inside pure operations are deterministic (`nextEntityId(...)`) or injected. Random identity belongs to the store or import boundary, never to a pure map operation.

## React and Next.js

- Prefer server components until an interaction or browser API requires a client component. Keep the client boundary low in the tree.
- Never read `localStorage` during render. Hydrate through the store, render a stable skeleton first, and keep server and first client markup identical.
- Treat React Flow as a browser-only library. Load it client-side and keep its state adapter narrow.
- Effects are for synchronization with the outside world, not for deriving state. Compute derived values during render.
- Keep state close to its use; lift it only when two views genuinely share it (the map document is the deliberate exception).
- Keyboard behaviour must be deliberate. Destructive keys require selection or confirmation, and text fields must not lose normal editing shortcuts.
- Global keyboard handlers ignore text fields, selects, contenteditable regions, and open dialogs. Scope a destructive shortcut to the surface that owns the selection where practical.

## Naming and structure

- Name by behaviour and domain meaning, not by UI accident: `reorderSteps`, not `handleDrop2`; `readiness`, not `scoreThing`.
- A module should hide a decision worth hiding. If a module mostly forwards calls, remove it or give it real responsibility.
- Co-locate tests with the behaviour they verify, except browser journeys. Keep fixture builders small and explicit.
- No barrel files unless they fix a real import problem. Prefer direct imports.

## Styling

- Use design tokens from the global theme. Do not scatter raw hex values through components.
- Follow the visual brief (`docs/design/brief.md`) for hierarchy, spacing, lane tints, and typography. New visual patterns should feel like they belong to the same studio.
- Style with Tailwind utilities; extract a component when the same pattern repeats with behaviour attached.
- Every interactive element needs hover, focus-visible, active, and disabled states. Focus must remain visible on tinted and canvas backgrounds.
- Motion is short and functional. Respect `prefers-reduced-motion`.
- Do not encode meaning in color alone; pair lane tints and statuses with labels or icons.

## Accessibility

- Targets at least WCAG 2.2 AA for text contrast and keyboard operation.
- Icon-only buttons need an accessible name and, where the icon is ambiguous, a tooltip.
- Dialogs use a real dialog primitive with a title and description, trap focus, close on Escape, and restore focus.
- Live regions announce save state, import/export results, and destructive outcomes. Do not announce every keystroke.
- The SIPOC board and flow canvas need a non-pointer path for their primary actions. Drag handles must support keyboard reordering.

## Testing

- Test external behaviour, not implementation shape. A refactor that preserves behaviour should not break tests.
- Derive expected values independently: known-good literals, worked examples, or the spec. Never recompute an expected value with the same algorithm as the implementation.
- Prefer the highest seam available: pure domain functions first, store second, component third, browser last.
- Every bug fix starts with a test that fails for the right reason.
- Avoid snapshots of whole pages or trees. Assert what the user can observe.
- Keep the full suite fast enough to run before every commit; put slow journeys behind the e2e command.

## Error handling and copy

- Fail visibly and specifically. “Could not import this file: nodes[2].position.x must be a number” is better than “Something went wrong”.
- Never leave a partial write after a failed import or failed persistence rehydration.
- Copy is short, concrete, and calm. No exclamation marks, no “seamless”, “unlock”, “supercharge”, or “effortless”.
- Empty states teach the expected content with realistic examples; they do not apologise.

## Performance

- Keep the dashboard light. Load React Flow only where it is rendered.
- Avoid effect loops and whole-store subscriptions in leaf components; select the smallest state needed.
- Do not optimise speculatively. Measure the obvious risks: editor bundle size, canvas re-renders during drag, and large imported documents.
