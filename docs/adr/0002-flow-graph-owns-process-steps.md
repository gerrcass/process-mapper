# The flow graph owns process steps

A process map has two editable views. Duplicating the process in a SIPOC step list and a flow graph would let the views drift, so the flow graph is the single source of truth. Nodes of kind `step` are projected into the SIPOC Process lane, ordered by SIPOC order. Start, decision, and end nodes live only in the flow.

Canvas position and SIPOC order are deliberately independent: moving a node expresses layout, while reordering the Process lane expresses the sequence being summarized. Users can reconcile the two with **Tidy flow**.

## Consequences

- Adding, renaming, or deleting a process step in either view updates the other view.
- Decision branches never add noise to the SIPOC summary.
- Reordering SIPOC steps does not move nodes on the canvas, and moving nodes does not silently reorder the summary.
- Step membership is a simple predicate (`kind === 'step'`), not a second collection to synchronize.
