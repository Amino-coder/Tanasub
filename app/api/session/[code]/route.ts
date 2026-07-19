import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Returns session status. Answers are only included once BOTH
// participants have completed -- enforced here, not just in the UI.
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const supabase = admin();
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, code")
    .eq("code", params.code)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: participants } = await supabase
    .from("participants")
    .select("id, role, nickname, completed, answers")
    .eq("session_id", session.id);

  const a = participants?.find(p => p.role === "A");
  const b = participants?.find(p => p.role === "B");
  const bothDone = !!a?.completed && !!b?.completed;

  return NextResponse.json({
    code: session.code,
    participants: {
      A: a ? { nickname: a.nickname, completed: a.completed, answers: bothDone ? a.answers : undefined } : null,
      B: b ? { nickname: b.nickname, completed: b.completed, answers: bothDone ? b.answers : undefined } : null,
    },
    bothDone,
  });
}
