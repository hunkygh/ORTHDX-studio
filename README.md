# ORTHDX Finance Studio

Next.js App Router scenario-planning application. Uses server-rendered GET forms and server-side financial calculations; no browser JavaScript is required for core functionality.

Run: `npm install && npm run dev`.

No sample financial data, API keys, database, or live integrations. Financial assumptions are URL query parameters and are not stored on a server. The compensation allocation is 60% reps / 12% Matt / 3% management / 25% ORTHDX.

Future integrations can provide inputs through a separate adapter layer without changing `lib/model.js`.
