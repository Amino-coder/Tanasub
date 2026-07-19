import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Joins a session: assigns role A if the session has 0 participants,
// role B if it has 1. Rejects a 3rd distinct participant.
export async function POST(req: Request) {
  const { code, nickname } = await req.json();
  const supabase = admin();

  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("id")
    .eq("code", code)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("participants")
    .select("id, role")
    .eq("session_id", session.id);

  if (existing && existing.length >= 2) {
    return NextResponse.json({ error: "Session already has two participants" }, { status: 409 });
  }

  const role = !existing || existing.length === 0 ? "A" : "B";

  const { data: participant, error: insertErr } = await supabase
    .from("participants")
    .insert({ session_id: session.id, role, nickname: nickname || "" })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ participantId: participant.id, role });
}
