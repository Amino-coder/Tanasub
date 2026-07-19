import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST() {
  const supabase = admin();
  const code = makeCode();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ code })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data.code });
}
