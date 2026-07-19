import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Saves (or updates) one participant's answers. Call with completed:true
// when they finish the questionnaire.
export async function POST(req: Request) {
  try {
    const { participantId, answers, completed } = await req.json();
    const supabase = getSupabaseAdmin();

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
