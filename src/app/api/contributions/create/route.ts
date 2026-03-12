import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      item_id,
      name,
      email,
      message,
      amount_cents,
      reference,
    } = body ?? {};

    if (!item_id || !name || !amount_cents || !reference) {
      return NextResponse.json(
        { error: "Ontbrekende velden." },
        { status: 400 }
      );
    }

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

    const { data, error } = await admin
      .from("contributions")
      .insert({
        item_id,
        name,
        email: email || null,
        message: message || null,
        amount_cents,
        reference,
        status: "PENDING",
      })
      .select("id, access_token")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Kon bijdrage niet opslaan." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      access_token: data.access_token,
    });
  } catch {
    return NextResponse.json(
      { error: "Ongeldige request." },
      { status: 400 }
    );
  }
}