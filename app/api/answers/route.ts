import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
