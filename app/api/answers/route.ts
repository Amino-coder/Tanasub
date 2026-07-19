import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key, which must NEVER be
// exposed to the browser (no NEXT_PUBLIC_ prefix) -- it bypasses RLS,
// which is exactly why it's safe to use only here, in a server route.
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

// Saves (or updates) one participant's answers. Call with completed:true
// when they finish the questionnaire.
export async function POST(req: Request) {
  try {
    const { participantId, answers, completed } = await req.json();
    const supabase = admin();

    const { error } = await supabase
      .from("participants")
      .update({ answers, completed: !!completed })
      .eq("id", participantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}
