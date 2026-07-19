import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
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
