# Share links carry the snapshot in the URL fragment

Process Atlas has no backend (ADR-0001), so a share link cannot point at a stored copy of a map. The
link carries the document itself: the complete process map, encoded into the URL fragment on the
existing `/maps` route. The fragment never reaches the host, so a shared process map does not appear
in server or CDN logs, and the static export keeps a single document route.

The payload is version-prefixed. `z1.` is `deflate-raw` plus base64url, used when the browser can
compress; `u1.` is plain base64url and remains decodable for browsers without compression support.
Decoding validates the document with the same schema as a persisted workspace or an imported file,
so a share link is never a second, weaker path into the store.

A share link is a **snapshot**: it is fixed at the moment it is copied and never updates. There is no
expiry, revocation, or access control, and anyone who has the link can read the map. The dialog that
produces a link and the view that opens one both say so.

## Consequences

- A map that is too large to encode within the link budget cannot be shared as a link; the author is
  pointed at the JSON export instead.
- Reusing the `/maps` route means the copied link inherits the Pages base path from the browser's own
  location rather than from duplicated build configuration.
- Adopting a shared snapshot is an import: fresh identity, collision-safe title, draft status, and
  one undoable history step.
- Links are a distribution channel for a document, not a synchronization channel. A future backend
  could add live links without changing the map model, the editor, or the shared view.
