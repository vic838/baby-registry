import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Payload = {
  kind?: "checkout" | "contribution";
  id?: string;
  targetStatus?: "PAID" | "REPORTED";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const kind = body.kind;
    const id = body.id;
    const targetStatus = body.targetStatus;

    if (!kind || !id || !targetStatus) {
      return NextResponse.json(
        { error: "Missing kind, id or targetStatus" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (kind === "checkout") {
      const { data, error } = await supabase
        .from("checkout_sessions")
        .update({ status: targetStatus })
        .eq("id", id)
        .select("id, reference, status");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, updated: data ?? [] });
    }

    if (kind === "contribution") {
      const updatePayload =
        targetStatus === "PAID"
          ? {
              status: "PAID",
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : {
              status: "REPORTED",
              paid_at: null,
              updated_at: new Date().toISOString(),
            };

      const { data, error } = await supabase
        .from("contributions")
        .update(updatePayload)
        .eq("id", id)
        .select("id, reference, status, paid_at");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, updated: data ?? [] });
    }

    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}