# Together — web app

No-AI, rule-based pre-marriage conversation-starter app. Next.js (App Router) + Supabase.

## Local setup
1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL +
   **service role key** (Project Settings → API → `service_role` secret —
   not the "anon public" key).
3. In Supabase, run `supabase-schema.sql` once (SQL Editor).
4. `npm run dev` → http://localhost:3000

## Deploy
Push this folder to a GitHub repo, then import it in Vercel and add the two
environment variables from `.env.local.example` as **server-side** env vars
(not ones marked for browser exposure). See the chat walkthrough for exact
steps.

## Data access model
All reads/writes go through the Next.js API routes (`app/api/*`), which use
the Supabase **service role key** on the server. Row Level Security is
enabled on both tables with no public policies, so the database itself
rejects any direct access from the browser's anon key — the only way in is
through the app's own routes, which enforce things like "only show both
people's answers once both are done." Don't add public RLS policies back;
that would let anyone with the (publicly visible) anon key bypass the app
and read or overwrite raw answers.
