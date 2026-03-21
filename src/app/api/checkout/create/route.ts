import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

type CartLine =
  | {
      type: "item";
      itemId: string;
      slug: string;
      title: string;
      image_url: string | null;
      quantity: number;
      unit_cents: number;
      addedAt: string;
    }
  | {
      type: "contribution";
      itemId: string;
      slug: string;
      title: string;
      image_url: string | null;
      amount_cents: number;
      addedAt: string;
    };

type CheckoutBody = {
  name?: string;
  email?: string;
  message?: string | null;
  lang?: string;
  cart?: CartLine[];
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

function buildReference() {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CLEO-CHK-${random}`;
}

function buildToken() {
  return crypto.randomBytes(24).toString("hex");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeLang(value?: string) {
  return value === "nl" || value === "ca" || value === "en" || value === "es"
    ? value
    : "nl";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody;

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const message = (body.message ?? "").trim() || null;
    const lang = normalizeLang(body.lang);
    const cart = Array.isArray(body.cart) ? body.cart : [];

    if (!name) {
      return NextResponse.json(
        { error: "Missing customer name." },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    if (cart.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const itemIds = Array.from(
      new Set(
        cart
          .map((line) => line.itemId)
          .filter((v): v is string => typeof v === "string" && !!v)
      )
    );

    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id, slug, is_active, is_contribution_item, already_owned, target_cents")
      .in("id", itemIds);

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    const itemMap = new Map((items ?? []).map((item) => [item.id, item]));

    let totalCents = 0;

    const linesToInsert: {
      line_type: "item" | "contribution";
      item_id: string;
      title_snapshot: string;
      quantity: number;
      amount_cents: number;
    }[] = [];

    for (const line of cart) {
      const dbItem = itemMap.get(line.itemId);

      if (!dbItem) {
        return NextResponse.json(
          { error: "One or more items no longer exist." },
          { status: 400 }
        );
      }

      if (!dbItem.is_active || dbItem.already_owned) {
        return NextResponse.json(
          { error: `Item "${line.title}" is no longer available.` },
          { status: 400 }
        );
      }

      if (line.type === "item") {
        if (dbItem.is_contribution_item) {
          return NextResponse.json(
            { error: `Item "${line.title}" is not a classic item.` },
            { status: 400 }
          );
        }

        const amountCents = Math.max(0, Number(dbItem.target_cents ?? line.unit_cents ?? 0));
        if (amountCents <= 0) {
          return NextResponse.json(
            { error: `Item "${line.title}" has no valid amount.` },
            { status: 400 }
          );
        }

        totalCents += amountCents;

        linesToInsert.push({
          line_type: "item",
          item_id: dbItem.id,
          title_snapshot: line.title,
          quantity: 1,
          amount_cents: amountCents,
        });
      } else {
        if (!dbItem.is_contribution_item) {
          return NextResponse.json(
            { error: `Item "${line.title}" is not available for contribution.` },
            { status: 400 }
          );
        }

        const amountCents = Math.max(0, Number(line.amount_cents ?? 0));
        if (amountCents <= 0) {
          return NextResponse.json(
            { error: `Contribution for "${line.title}" has an invalid amount.` },
            { status: 400 }
          );
        }

        if (
          typeof dbItem.target_cents === "number" &&
          dbItem.target_cents > 0 &&
          amountCents > dbItem.target_cents
        ) {
          return NextResponse.json(
            { error: `Contribution for "${line.title}" is too high.` },
            { status: 400 }
          );
        }

        totalCents += amountCents;

        linesToInsert.push({
          line_type: "contribution",
          item_id: dbItem.id,
          title_snapshot: line.title,
          quantity: 1,
          amount_cents: amountCents,
        });
      }
    }

    if (totalCents <= 0) {
      return NextResponse.json(
        { error: "Invalid checkout total." },
        { status: 400 }
      );
    }

    const reference = buildReference();
    const token = buildToken();

    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .insert({
        name,
        email,
        message,
        total_cents: totalCents,
        reference,
        access_token: token,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: sessionError?.message ?? "Could not create checkout session." },
        { status: 500 }
      );
    }

    const payload = linesToInsert.map((line) => ({
      checkout_id: session.id,
      ...line,
    }));

    const { error: linesError } = await supabase
      .from("checkout_lines")
      .insert(payload);

    if (linesError) {
      return NextResponse.json(
        { error: linesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: session.id,
      token,
      redirectUrl: `/${lang}/pay/checkout/${session.id}?t=${encodeURIComponent(token)}`,
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