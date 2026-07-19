import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key, which must NEVER be
// exposed to the browser (no NEXT_PUBLIC_ prefix) -- it bypasses RLS,
// which is exactly why it's safe to use only here, in a server route,
// after we've done our own checks in code.
function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. " +
      "Set these (server-side, no NEXT_PUBLIC_ prefix) and redeploy."
    );
  }
  return createClient(url, key);
}

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST() {
  try {
    const supabase = admin();
    const code = makeCode();
    const { data, error } = await supabase
      .from("sessions")
      .insert({ code })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ code: data.code });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}
