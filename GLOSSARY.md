# Process Atlas

The domain language for the Process Atlas workspace. Use these terms in code, issues, tests, and interface copy.

## Language

**Process map**:
A complete working document: its identity, its SIPOC sheet, and its flow graph. Users open one map at a time in the editor.
_Avoid_: Project, board, canvas, diagram

**SIPOC sheet**:
The five-lane summary of a process: Suppliers, Inputs, Process, Outputs, Customers.
_Avoid_: SIPOC diagram, table

**Lane**:
One of the five columns of a SIPOC sheet. The Process lane is special because it is generated from step nodes.
_Avoid_: Column, category, bucket

**Entry**:
A single item in a non-Process SIPOC lane, such as one supplier or one output. An entry has a label and optional detail.
_Avoid_: Card, item, record

**Process step**:
A flow node of kind `step`. Every process step appears in the SIPOC Process lane. A process step can have an owner, a system, a duration, and a description.
_Avoid_: Task, activity, stage

**Flow node**:
Any node in the process graph: a start marker, a process step, a decision, or an end marker. Only process steps appear in the SIPOC sheet.
_Avoid_: Shape, block, box

**Flow edge**:
A directed connection between two flow nodes. A flow edge is either a normal flow or an exception path, and may carry a short label such as "No".
_Avoid_: Arrow, link, connection

**SIPOC order**:
The position of a process step in the SIPOC Process lane. SIPOC order is independent of a node's position on the flow canvas.
_Avoid_: Sequence, rank, step number

**Readiness**:
A computed, advisory measure of how complete and coherent a process map is. Readiness is a score plus a checklist, never a gate.
_Avoid_: Score, health, completeness

**Template**:
A complete starting document that a user can instantiate as a new process map. Templates are seed data, not wireframes.
_Avoid_: Preset, example, sample

**Workspace**:
The local collection of process maps in one browser. There is no account or shared workspace.
_Avoid_: Account, organization, team

**Tidy flow**:
The explicit action that repositions flow nodes using the auto-layout algorithm. It changes canvas positions, never SIPOC order.
_Avoid_: Auto-arrange, layout, format
