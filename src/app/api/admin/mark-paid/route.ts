import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { checkoutId } = await req.json();

  if (!checkoutId) {
    return NextResponse.json({ error: "Missing checkoutId" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔒 belangrijk
  );

  const { error } = await supabase
    .from("checkout_sessions")
    .update({ status: "PAID" })
    .eq("id", checkoutId)
    .neq("status", "PAID");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}