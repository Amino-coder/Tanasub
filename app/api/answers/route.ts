import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key, which must NEVER be
// exposed to the browser (no NEXT_PUBLIC_ prefix) -- it bypasses RLS,
// which is exactly why it's safe to use only here, in a server route.
function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Saves (or updates) one participant's answers. Call with completed:true
// when they finish the questionnaire.
export async function POST(req: Request) {
  const { participantId, answers, completed } = await req.json();
  const supabase = admin();

  const { error } = await supabase
    .from("participants")
    .update({ answers, completed: !!completed })
    .eq("id", participantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
