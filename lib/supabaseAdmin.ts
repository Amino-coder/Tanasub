import { createClient } from "@supabase/supabase-js";

// Checks a list of possible env var names and returns the first one that's
// actually set. This exists because hosting platforms (Vercel included)
// can end up with stale or partially-saved env vars across deploys --
// rather than hard-failing on one exact name, we check a few reasonable
// aliases so a mismatch doesn't take the whole app down.
function firstDefined(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

// Server-only client. Uses the service role key, which must NEVER be
// exposed to the browser (no NEXT_PUBLIC_ prefix) -- it bypasses RLS,
// which is exactly why it's safe to use only here, in a server route.
export function getSupabaseAdmin() {
  const url = firstDefined("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = firstDefined("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY");
  const anonKey = firstDefined("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");

  if (!url) {
    throw new Error(
      "No Supabase URL found. Set SUPABASE_URL as a server-side environment " +
      "variable in your hosting platform (e.g. Vercel -> Project -> Settings " +
      "-> Environment Variables), then redeploy."
    );
  }

  if (serviceKey) {
    return createClient(url, serviceKey);
  }

  if (anonKey) {
    // This will work for reads but almost certainly fail on writes, because
    // the database's Row Level Security has no public policies -- only the
    // service role key can bypass RLS. Surface a clear signal about this
    // instead of a confusing raw Postgres error later.
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY is not set -- falling back to the anon key. " +
      "Writes (creating sessions, joining, saving answers) will likely fail " +
      "with a row-level security error. Set SUPABASE_SERVICE_ROLE_KEY " +
      "(Supabase -> Project Settings -> API -> service_role secret, NOT the " +
      "anon public key) as a server-side env var and redeploy."
    );
    return createClient(url, anonKey);
  }

  throw new Error(
    "No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY as a server-side " +
    "environment variable (Supabase -> Project Settings -> API -> " +
    "service_role secret) in your hosting platform, then redeploy."
  );
}
