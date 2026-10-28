# Novum

## Subjects and syllabus checklists

Open **Subjects** using the center navigation button, then add a subject and a PDF syllabus (up to 3 MB). The PDF is sent through the server to Google Gemini for processing. Google notes that free-tier content may be used to improve its products; check its terms before uploading sensitive documents. The resulting subjects and checklist progress currently remain in this browser's localStorage, not synced across devices. The PDF itself is not stored. AI output can be incomplete or inaccurate, so check it against the original syllabus.

## Backend setup

The shared Gemini key and database connection must be configured on the server, never in frontend code or a `VITE_` variable. For local development, put the following server-only variables in the ignored `.env.local` (see `.env.example`):

- `GEMINI_API_KEY`: the application's Gemini key.
- `DATABASE_URL`: the Supabase **transaction pooler** PostgreSQL connection string (Dashboard → Connect → Transaction pooler). Use the table owner initially; do not add `sslmode`, `sslrootcert`, `sslcert`, or `sslkey` parameters.
- `DATABASE_CA_CERT`: the project's Supabase root CA certificate in PEM format, with line breaks encoded as `\n`. Download it from the project database settings. TLS certificate verification is required.
- `GEMINI_DAILY_LIMIT`: global UTC-day analysis limit (optional, defaults to 20).

Create a Supabase project and run [server/schema.sql](server/schema.sql) once in its SQL Editor as the project owner. Keep `app_private` out of exposed API schemas. Run `npm install`, then run `npm run dev:api` and `npm run dev` in separate terminals. For Vercel, set the same server-side environment variables in the project settings and redeploy. Never commit keys or database credentials. The app refuses analysis if the key or database is unavailable so the global quota cannot be bypassed. Free-tier Gemini availability and quotas depend on your account and region; check Google's [pricing](https://ai.google.dev/gemini-api/docs/pricing) and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

Supabase PostgreSQL stores the global usage counter. Server-only user-record helpers are provided for future integration, but do not create accounts or expose an HTTP user API. The suggested owner connection is privileged and bypasses RLS; a narrower database role with explicit grants and RLS policies should be configured before production. Authentication, authorization and migration of existing local data are not implemented; do not expose user data or accept a user ID as proof of identity until authenticated accounts are added. The global cap limits total use but does not prevent one visitor consuming the entire allowance. Add per-user rate limits and authentication before relying on this endpoint in production.

Run `npm run build` and `node --test src/lib/*.test.js api/*.test.js server/*.test.js` to check the app and backend without a live API key.
