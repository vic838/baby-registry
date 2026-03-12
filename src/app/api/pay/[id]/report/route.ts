import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("REPORT ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Bijdrage-id ontbreekt." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("t");

    console.log("REPORT TOKEN PRESENT:", !!token);

    if (!token) {
      return NextResponse.json(
        { error: "Token ontbreekt." },
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
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: existing, error: findError } = await admin
      .from("contributions")
      .select("id, status, access_token")
      .eq("id", id)
      .single();

    console.log("DB RESULT:", existing);
    console.log("DB ERROR:", findError);

    if (findError || !existing) {
      return NextResponse.json(
        { error: "Bijdrage niet gevonden." },
        { status: 404 }
      );
    }

    if (existing.access_token !== token) {
      return NextResponse.json(
        { error: "Ongeldige link." },
        { status: 403 }
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
      console.log("UPDATE ERROR:", updateError);

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("REPORT ROUTE ERROR:", error);

    return NextResponse.json(
      { error: "Interne serverfout." },
      { status: 500 }
    );
  }
}