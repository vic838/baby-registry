import { requireAdminFromBearerToken } from "@/lib/adminApiAuth";
import { NextResponse } from "next/server";

type CheckoutSessionRow = {
  id: string;
  name: string;
  email: string;
  total_cents: number;
  reference: string;
  status: string;
  created_at: string;
};

type CheckoutLineRow = {
  id: string;
  checkout_id: string;
  line_type: string | null;
  item_id: string | null;
  title_snapshot: string | null;
  quantity: number | null;
  amount_cents: number;
  created_at: string;
};

type ContributionRow = {
  id: string;
  item_id: string | null;
  name: string;
  email: string;
  message: string | null;
  amount_cents: number;
  reference: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  is_anonymous: boolean | null;
  payment_provider: string | null;
  provider_payment_id: string | null;
  paid_at: string | null;
  access_token: string | null;
};

type ItemRow = {
  id: string;
  slug: string;
};

export async function GET(req: Request) {
  try {
    const auth = await requireAdminFromBearerToken(
      req.headers.get("authorization")
    );

    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { supabase } = auth;

    const [
      checkoutSessionsResult,
      checkoutLinesResult,
      contributionsResult,
      itemsResult,
    ] = await Promise.all([
      supabase
        .from("checkout_sessions")
        .select("id, name, email, total_cents, reference, status, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("checkout_lines")
        .select(
          "id, checkout_id, line_type, item_id, title_snapshot, quantity, amount_cents, created_at"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("contributions")
        .select(
          "id, item_id, name, email, message, amount_cents, reference, status, created_at, updated_at, is_anonymous, payment_provider, provider_payment_id, paid_at, access_token"
        )
        .order("created_at", { ascending: false }),

      supabase.from("items").select("id, slug"),
    ]);

    if (checkoutSessionsResult.error) {
      return NextResponse.json(
        { error: checkoutSessionsResult.error.message },
        { status: 500 }
      );
    }

    if (checkoutLinesResult.error) {
      return NextResponse.json(
        { error: checkoutLinesResult.error.message },
        { status: 500 }
      );
    }

    if (contributionsResult.error) {
      return NextResponse.json(
        { error: contributionsResult.error.message },
        { status: 500 }
      );
    }

    if (itemsResult.error) {
      return NextResponse.json(
        { error: itemsResult.error.message },
        { status: 500 }
      );
    }

    const checkoutSessions = (checkoutSessionsResult.data ??
      []) as CheckoutSessionRow[];
    const checkoutLines = (checkoutLinesResult.data ?? []) as CheckoutLineRow[];
    const contributions = (contributionsResult.data ?? []) as ContributionRow[];
    const items = (itemsResult.data ?? []) as ItemRow[];

    const itemSlugById = new Map(items.map((item) => [item.id, item.slug]));

    const linesByCheckoutId = new Map<string, CheckoutLineRow[]>();

    for (const line of checkoutLines) {
      const existing = linesByCheckoutId.get(line.checkout_id) ?? [];
      existing.push(line);
      linesByCheckoutId.set(line.checkout_id, existing);
    }

    const checkoutRows = checkoutSessions.map((session) => {
      const lines = linesByCheckoutId.get(session.id) ?? [];

      return {
        kind: "checkout" as const,
        id: session.id,
        name: session.name,
        email: session.email,
        amount_cents: session.total_cents,
        reference: session.reference,
        status: session.status,
        created_at: session.created_at,
        payment_provider: "checkout",
        items: lines.map((line) => ({
          line_id: line.id,
          item_id: line.item_id,
          title:
            line.title_snapshot ||
            (line.item_id
              ? itemSlugById.get(line.item_id) ?? "Unknown item"
              : "Unknown item"),
          quantity: line.quantity ?? 1,
          amount_cents: line.amount_cents,
          line_type: line.line_type,
          slug: line.item_id ? itemSlugById.get(line.item_id) ?? null : null,
        })),
      };
    });

    const contributionRows = contributions.map((contribution) => {
      const slug = contribution.item_id
        ? itemSlugById.get(contribution.item_id) ?? null
        : null;

      return {
        kind: "contribution" as const,
        id: contribution.id,
        name: contribution.name,
        email: contribution.email,
        amount_cents: contribution.amount_cents,
        reference: contribution.reference,
        status: contribution.status,
        created_at: contribution.created_at,
        payment_provider: contribution.payment_provider,
        paid_at: contribution.paid_at,
        item: contribution.item_id
          ? {
              item_id: contribution.item_id,
              slug,
            }
          : null,
      };
    });

    const combined = [...checkoutRows, ...contributionRows].sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    const checkoutPaidCents = checkoutRows
      .filter((row) => row.status === "PAID")
      .reduce((sum, row) => sum + row.amount_cents, 0);

    const checkoutOpenCents = checkoutRows
      .filter((row) => row.status !== "PAID")
      .reduce((sum, row) => sum + row.amount_cents, 0);

    const contributionPaidCents = contributionRows
      .filter((row) => row.status === "PAID")
      .reduce((sum, row) => sum + row.amount_cents, 0);

    const contributionOpenCents = contributionRows
      .filter((row) => row.status !== "PAID")
      .reduce((sum, row) => sum + row.amount_cents, 0);

    const stats = {
      total_received_cents: checkoutPaidCents + contributionPaidCents,
      total_open_cents: checkoutOpenCents + contributionOpenCents,
      checkout_paid_count: checkoutRows.filter((row) => row.status === "PAID")
        .length,
      checkout_open_count: checkoutRows.filter((row) => row.status !== "PAID")
        .length,
      contribution_paid_count: contributionRows.filter(
        (row) => row.status === "PAID"
      ).length,
      contribution_open_count: contributionRows.filter(
        (row) => row.status !== "PAID"
      ).length,
      total_paid_count:
        checkoutRows.filter((row) => row.status === "PAID").length +
        contributionRows.filter((row) => row.status === "PAID").length,
      total_open_count:
        checkoutRows.filter((row) => row.status !== "PAID").length +
        contributionRows.filter((row) => row.status !== "PAID").length,
    };

    return NextResponse.json({
      stats,
      rows: combined,
    });
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