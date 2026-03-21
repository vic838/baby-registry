import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const token = url.searchParams.get("t") ?? "";

    if (!id) {
      return NextResponse.json(
        { error: "Missing checkout id." },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing token." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data: session, error: fetchError } = await supabase
      .from("checkout_sessions")
      .select("id, access_token, status")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "Checkout not found." },
        { status: 404 }
      );
    }

    if (session.access_token !== token) {
      return NextResponse.json(
        { error: "Invalid token." },
        { status: 403 }
      );
    }

    if (
      session.status === "REPORTED" ||
      session.status === "PAID" ||
      session.status === "CANCELLED"
    ) {
      return NextResponse.json({ ok: true });
    }

    const { error: updateError } = await supabase
      .from("checkout_sessions")
      .update({ status: "REPORTED" })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}