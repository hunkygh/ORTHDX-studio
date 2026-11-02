# ORTHDX Finance Studio — ClickUp persistence contract (v1)

## Objective
ClickUp Docs are the durable store for *hypothetical* financial models. Next.js route handlers are the only component allowed to communicate with ClickUp. Browser clients never receive ClickUp credentials.

## Document organization
One private ClickUp Doc per official scenario.
- **Current State** page: a single fenced JSON block with the envelope below. Replace this page when publishing a new revision.
- **Snapshots**: one immutable, timestamped page per published revision.
- **Share Settings**: private access metadata. Never place plaintext access codes or bearer tokens in a public Doc.

## Envelope
```json
{
  "schemaVersion": 1,
  "scenarioId": "uuid",
  "name": "Untitled scenario",
  "revision": 1,
  "updatedAt": "2026-11-02T00:00:00.000Z",
  "model": {
    "nodes": [],
    "edges": [],
    "months": 12
  },
  "published": true
}
```

Nodes and edges retain the Financial Canvas shape; amounts are **assumptions** rather than live transactions. All forecasts are recomputed by the model engine. The official version is never overwritten by a recipient's personal simulation.

## Read/write protocol
1. GET latest Current State page, parse the JSON envelope, validate schema and node/edge references.
2. Client edits a private draft.
3. Publish with `expectedRevision`; reject stale revisions rather than silently overwriting changes.
4. Create a snapshot page and update Current State; if either fails, report partial failure and reconcile before further publishing.
5. On load or explicit Resync, re-read ClickUp; do not treat localStorage as the canonical source.

## Access
- Owner/admin publishing is authenticated server-side.
- Share link uses a random unguessable identifier; 4-digit PIN is *secondary* protection, never the only secret.
- Rate limit PIN attempts, store salted hashes, set HttpOnly Secure SameSite cookies, and allow revocation.
- Shared recipients receive only role-scoped model data; never expose owner-only fields or ClickUp IDs/API tokens.
- A remembered device is a revocable server-issued session, not a permanent PIN in localStorage.

## Integration prerequisites
Configure `CLICKUP_API_TOKEN`, `CLICKUP_WORKSPACE_ID`, and the private scenario Doc/page IDs in Vercel environment variables. Confirm ClickUp Docs API read/write behavior and permissions before enabling publishing. A ClickUp connection available to ChatGPT does **not** automatically provide the deployed Vercel application with credentials.

## Limitations
ClickUp Docs are not transactional storage. Concurrent edits, multi-step snapshot writes, and access-code sessions require careful coordination. For heavier usage, a dedicated database may eventually be warranted.
