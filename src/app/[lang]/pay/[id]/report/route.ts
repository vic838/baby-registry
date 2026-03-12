import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Serverconfiguratie ontbreekt." },
      { status: 500 }
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: findError } = await admin
    .from("contributions")
    .select("id,status")
    .eq("id", id)
    .single();

  if (findError || !existing) {
    return NextResponse.json(
      { error: "Bijdrage niet gevonden." },
      { status: 404 }
    );
  }

  if (
    existing.status === "REPORTED" ||
    existing.status === "PAID" ||
    existing.status === "CANCELLED"
  ) {
    return NextResponse.json(
      { error: "Deze bijdrage kan niet meer als gemeld worden gezet." },
      { status: 400 }
    );
  }

  const { error: updateError } = await admin
    .from("contributions")
    .update({ status: "REPORTED" })
    .eq("id", id)
    .in("status", ["PENDING", "FAILED"]);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}