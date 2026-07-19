import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// This route reports live session status and is polled every few seconds
// while participants wait for each other to finish. Without these two
// exports, Next.js can treat it as a static route (no dynamic APIs like
// cookies/headers are used) and cache the response indefinitely -- which
// would mean bothDone never updates no matter how many times it's called,
// even though the underlying data has changed. Never remove these.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Returns session status. Answers are only included once BOTH
// participants have completed -- enforced here, not just in the UI.
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = getSupabaseAdmin();
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
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}
