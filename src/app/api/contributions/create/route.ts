import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

type CreateBody = {
  itemSlug?: string;
  name?: string;
  email?: string | null;
  message?: string | null;
  amountCents?: number;
  lang?: string;
};

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

function normalizeAmount(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return Math.round(n);
}

function buildReference() {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CLEO-${random}`;
}

function buildToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBody;

    const itemSlug = (body.itemSlug ?? "").trim();
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim() || null;
    const message = (body.message ?? "").trim() || null;
    const amountCents = normalizeAmount(body.amountCents);

    if (!itemSlug) {
      return NextResponse.json(
        { error: "Missing item slug." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Missing contributor name." },
        { status: 400 }
      );
    }

    if (!amountCents) {
      return NextResponse.json(
        { error: "Invalid amount." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id, slug, is_active, is_contribution_item, already_owned")
      .eq("slug", itemSlug)
      .maybeSingle();

    if (itemError) {
      return NextResponse.json(
        { error: itemError.message },
        { status: 500 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { error: "Item not found." },
        { status: 404 }
      );
    }

    if (!item.is_active || !item.is_contribution_item || item.already_owned) {
      return NextResponse.json(
        { error: "This item is not available for contribution." },
        { status: 400 }
      );
    }

    const token = buildToken();
    const reference = buildReference();

    const insertPayload = {
      item_id: item.id,
      name,
      email,
      message,
      amount_cents: amountCents,
      reference,
      status: "PENDING",
      access_token: token,
    };

    const { data: contribution, error: insertError } = await supabase
      .from("contributions")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: contribution.id,
      token,
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