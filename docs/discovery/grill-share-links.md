# Discovery: share links

This document records the second `/grill-with-docs` session for Process Atlas, run autonomously at
the user's request. Each frontier question below shows the recommended answer and the decision that
followed. The durable outcomes live in [`GLOSSARY.md`](../../GLOSSARY.md) and
[`docs/adr/0003-share-links-carry-the-snapshot-in-the-fragment.md`](../adr/0003-share-links-carry-the-snapshot-in-the-fragment.md).

The first session is in [`grill-session.md`](./grill-session.md).

## Context

The shipped demo ends with "leave with something you can share". Today sharing means a JSON file, a
PNG, or a printed sheet: the recipient needs a download step, and the author cannot hand over a
process map in a chat message. The workspace is browser-local (ADR-0001) and the site is a static
export, so there is no server to store a shared map on.

## Round 1: the slice

**Q1. What is the next logical step for the product?**

The gap is not authoring. It is the hand-off. A facilitator who finishes a workshop wants to send
the map to a colleague, and the only path is "download this file, then import it".

➡️ **Decision:** Build **share links**: a URL the author copies from the editor that opens the map
read-only for anyone who has it. No account, no backend, no new hosting.

**Q2. What must the recipient be able to do?**

Reading is the floor. The interesting outcome is that a reviewer can keep the map: a link that can
only be read is a dead end, and re-exporting it as a file from the reader's side is impossible.

➡️ **Decision:** Two recipient actions: read the map, and **adopt** it into their own workspace as a
new process map they can edit.

**Q3. Where does the document live, with no backend?**

Three options were considered. (a) A query string: the payload reaches the host, its CDN logs, and
any analytics in between. (b) A separate storage service: violates ADR-0001 and needs credentials.
(c) The URL fragment: the browser never sends it to the server.

➡️ **Decision:** The fragment. The map is encoded into the part of the URL after `#`, so the link
carries the document and the host only ever sees the route. This becomes ADR-0003.

**Q4. What exactly is in the link?**

Options: a trimmed subset (title, lanes, nodes, edges) with its own schema, or the whole process map
document validated by the schema that already exists. A second schema is a second thing to keep in
step, and it would drift the first time the map model changes.

➡️ **Decision:** The link carries the complete process map document. Decoding runs the same
validation as a persisted payload or an imported file.

## Round 2: mechanics

**Q5. How is the document encoded?**

Measured against the seeded maps: about 4.4 KB of JSON each. Raw base64url would produce ~5.9 KB
links, which wrap in every chat client and read as noise. Compression is available in the browser
without a dependency, but it is not universal.

➡️ **Decision:** A version-prefixed payload. `z1.` is `deflate-raw` plus base64url, used when the
browser can compress; `u1.` is plain base64url and is both the fallback and the format an older
reader can still open. Decoding accepts both and rejects unknown prefixes with a specific message.

**Q6. Which route serves the shared map?**

A new `/share` route needs the Pages base path duplicated into the copied URL. Reusing the existing
`/maps` route means the link is derived from the browser's own location, so the base path is
inherited and the static export keeps one document route.

➡️ **Decision:** The shared view lives on the existing `/maps` route, selected by the fragment
(`#shared=…`) instead of the `?map=` query. The link is built from `window.location` by replacing
the search and hash.

**Q7. What does the read-only surface show?**

The SIPOC board already supports a read-only mode. The flow canvas does not: it is wired to the
store, the toolbar, drag, connect, and delete. Reusing it would mean threading a read-only flag
through the whole editor adapter.

➡️ **Decision:** Reuse the SIPOC board with `readOnly`. Add a static flow view that renders the
existing node and edge components with no editor affordances and no store access. Show the title,
description, status, and a read-only readiness summary, so a reviewer can see what is missing
without being offered a fix action they cannot take.

**Q8. What if the map is too large for a URL?**

A hard limit keeps the app from producing links that break in a chat client or a browser, and it
gives the author an honest fallback instead of a silent failure.

➡️ **Decision:** Refuse to build a link when the encoded payload exceeds 16,000 characters. The
dialog says so and points at the JSON export, which is the existing backup path.

**Q9. Where does sharing start?**

The editor header, next to Export, because that is where the document is. The dashboard cards could
carry a copy-link action too, but that widens the surface for no new capability.

➡️ **Decision:** A Share button in the editor header opens a dialog with the link, a copy action, a
preview action, and the snapshot caveat. Sharing from the dashboard is out of scope for this slice.

## Round 3: boundaries and quality

**Q10. What must the copy say about privacy?**

A share link is a document in a URL. Anyone who receives it can read the map, it can be forwarded,
and it cannot be revoked because no server holds it.

➡️ **Decision:** The dialog and the shared view both state it plainly: anyone with the link can read
this map, and the link is a snapshot, not a live document. Re-share after editing.

**Q11. How does an adopted map enter the workspace?**

It is an import in every way that matters: fresh identity, no collision with an existing title,
draft status, one undoable history step. Only the provenance differs.

➡️ **Decision:** A store action adopts the shared snapshot with a fresh identity, the `(imported)`
collision naming, and a new origin value `link`, labelled "From a link" on the dashboard. The user
lands in the editor with the new map open.

**Q12. Does this change the persisted schema?**

The map document does not change. The origin vocabulary gains one value, which is additive: every
document written by the current app stays valid, and no migration is needed.

➡️ **Decision:** Widen `MAP_ORIGINS` with `link` and keep `SCHEMA_VERSION` at 1. The shared payload
is validated by the unchanged map schema.

**Q13. What are the agreed test seams?**

The same four seams as the first slice, and no new ones.

➡️ **Decision:**

- **Domain seam:** encode/decode round trip, both payload formats, malformed input, unsupported
  prefixes, oversized payloads, and the size guard.
- **Store seam:** adopting a shared snapshot — fresh identity, collision naming, origin, undo.
- **UI seam:** the share dialog through user-visible behaviour, and the shared view proving it is
  read-only and that adopting works.
- **Browser seam:** copy a link in one profile, open it in a clean profile, read the map, adopt it,
  and edit it.

**Q14. What is deliberately out of scope?**

Live or updating links, expiry, revocation, access control, QR codes, link analytics, sharing a
single view or a single step, editing a shared snapshot in place, and a share action on the
dashboard.

➡️ **Decision:** A share link is a snapshot of a local-first document, nothing more. The README
carries the same caveat as the existing local-first note.

## Design tree, resolved

```text
Share links
├── Author (editor)
│   ├── Share button in the editor header
│   └── Dialog: link, copy, preview, snapshot caveat, size guard
├── Link
│   ├── Fragment payload on the /maps route
│   ├── z1. deflate-raw + base64url, u1. plain base64url
│   └── Validated by the existing map schema
├── Recipient (shared view)
│   ├── Read-only SIPOC board, static flow, readiness summary
│   ├── Clear states for malformed, unsupported, and oversized payloads
│   └── Adopt into the workspace → editor with the new map
└── Provenance
    ├── origin: link ("From a link")
    ├── Fresh identity, (imported) naming, draft status
    └── One undoable history step
```
