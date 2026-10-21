# Local-first persistence for the demo

Process Atlas must run as a credible product demo without accounts, a database, or environment variables. We keep the workspace in browser `localStorage` behind a versioned, validated schema, with JSON import/export as the escape hatch. This makes the demo deployable anywhere and keeps domain logic testable, while accepting that data lives in one browser and is lost if storage is cleared without an export.

## Consequences

- Persistence is an adapter, not a domain concern. The pure map operations never read storage.
- Every persisted or imported document is validated before it reaches the store.
- A future backend can replace the adapter without changing the map model or editor.
