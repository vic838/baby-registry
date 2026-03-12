import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
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

  const { data: contribution, error: contributionError } = await admin
    .from("contributions")
    .select("id,item_id,name,message,amount_cents,reference,status")
    .eq("id", id)
    .single();

  if (contributionError || !contribution) {
    return NextResponse.json(
      { error: "Bijdrage niet gevonden." },
      { status: 404 }
    );
  }

  const { data: item } = await admin
    .from("items")
    .select("id,title,slug")
    .eq("id", contribution.item_id)
    .maybeSingle();

  return NextResponse.json({
    contribution: {
      id: contribution.id,
      name: contribution.name,
      message: contribution.message,
      amount_cents: contribution.amount_cents,
      reference: contribution.reference,
      status: contribution.status,
    },
    item: item
      ? {
          id: item.id,
          title: item.title,
          slug: item.slug,
        }
      : null,
  });
}