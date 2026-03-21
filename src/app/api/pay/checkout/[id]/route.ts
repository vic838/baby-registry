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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing checkout id." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("id, name, email, message, total_cents, reference, status")
      .eq("id", id)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "Checkout not found." },
        { status: 404 }
      );
    }

    const { data: lines, error: linesError } = await supabase
      .from("checkout_lines")
      .select("id, line_type, item_id, title_snapshot, quantity, amount_cents")
      .eq("checkout_id", id)
      .order("created_at", { ascending: true });

    if (linesError) {
      return NextResponse.json(
        { error: linesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkout: session,
      lines: lines ?? [],
    });
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