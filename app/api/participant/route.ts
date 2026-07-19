import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Joins a session: assigns role A if the session has 0 participants,
// role B if it has 1. Rejects a 3rd distinct participant.
export async function POST(req: Request) {
  try {
    const { code, nickname } = await req.json();
    const supabase = getSupabaseAdmin();

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

    // Try the role suggested by the count first, but don't trust it blindly --
    // two requests can both read the same count before either insert commits.
    // The unique (session_id, role) constraint is the real source of truth:
    // if our first attempt loses the race, retry with the other role once.
    const firstTry: "A" | "B" = !existing || existing.length === 0 ? "A" : "B";
    const otherRole: "A" | "B" = firstTry === "A" ? "B" : "A";

    let participant = null;
    let lastErr = null;
    for (const role of [firstTry, otherRole]) {
      const { data, error } = await supabase
        .from("participants")
        .insert({ session_id: session.id, role, nickname: nickname || "" })
        .select()
        .single();
      if (!error) { participant = data; break; }
      lastErr = error;
      // Only retry on a unique-constraint conflict (role already taken);
      // any other error should surface immediately.
      if (error.code !== "23505") break;
    }

    if (!participant) {
      // Both roles are taken (or a real error occurred).
      if (lastErr?.code === "23505") {
        return NextResponse.json({ error: "Session already has two participants" }, { status: 409 });
      }
      return NextResponse.json({ error: lastErr?.message || "Could not join session" }, { status: 500 });
    }

    return NextResponse.json({ participantId: participant.id, role: participant.role });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}
