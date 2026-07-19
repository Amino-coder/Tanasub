# Together — web app

No-AI, rule-based pre-marriage conversation-starter app. Next.js (App Router) + Supabase.

## Local setup
1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL + anon key.
3. In Supabase, run `supabase-schema.sql` once (SQL Editor).
4. `npm run dev` → http://localhost:3000

## Deploy
Push this folder to a GitHub repo, then import it in Vercel and add the two
environment variables from `.env.local.example`. See the chat walkthrough
for exact steps.
