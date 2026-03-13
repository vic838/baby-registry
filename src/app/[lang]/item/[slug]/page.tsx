"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "nl" | "ca" | "en" | "es";

type Item = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  is_open: boolean;
  category: string | null;
};

type TotalsRow = {
  item_id: string;
  paid_cents: number;
  reported_cents: number;
};

const categoryLabels: Record<Lang, Record<string, string>> = {
  nl: {
    sleeping: "Slapen",
    feeding: "Voeding",
    care: "Verzorging",
    travel: "Onderweg",
    toys: "Speelgoed",
    clothes: "Kleding",
    room: "Babykamer",
    essentials: "Must-haves",
    other: "Overig",
  },
  ca: {
    sleeping: "Dormir",
    feeding: "Alimentació",
    care: "Cura",
    travel: "Passeig",
    toys: "Joguines",
    clothes: "Roba",
    room: "Habitació",
    essentials: "Imprescindibles",
    other: "Altres",
  },
  en: {
    sleeping: "Sleeping",
    feeding: "Feeding",
    care: "Care",
    travel: "Travel",
    toys: "Toys",
    clothes: "Clothes",
    room: "Nursery",
    essentials: "Essentials",
    other: "Other",
  },
  es: {
    sleeping: "Dormir",
    feeding: "Alimentación",
    care: "Cuidado",
    travel: "Paseo",
    toys: "Juguetes",
    clothes: "Ropa",
    room: "Habitación",
    essentials: "Imprescindibles",
    other: "Otros",
  },
};

const uiText: Record<
  Lang,
  {
    back: string;
    loading: string;
    notFound: string;
    total: string;
    target: string;
    confirmed: string;
    reported: string;
    alreadyBought: string;
    full: string;
    available: string;
    noTarget: string;
    ofGoal: string;
    contribute: string;
  }
> = {
  nl: {
    back: "← Terug naar lijst",
    loading: "Laden…",
    notFound: "Item niet gevonden.",
    total: "Totaal",
    target: "Doel",
    confirmed: "bevestigd",
    reported: "gemeld",
    alreadyBought: "Al gekocht",
    full: "Volzet",
    available: "Beschikbaar",
    noTarget: "Geen doelbedrag ingesteld",
    ofGoal: "van doel",
    contribute: "Draag bij",
  },
  ca: {
    back: "← Tornar a la llista",
    loading: "Carregant…",
    notFound: "Article no trobat.",
    total: "Total",
    target: "Objectiu",
    confirmed: "confirmat",
    reported: "anunciat",
    alreadyBought: "Ja comprat",
    full: "Complet",
    available: "Disponible",
    noTarget: "No hi ha import objectiu",
    ofGoal: "de l’objectiu",
    contribute: "Contribuir",
  },
  en: {
    back: "← Back to list",
    loading: "Loading…",
    notFound: "Item not found.",
    total: "Total",
    target: "Target",
    confirmed: "confirmed",
    reported: "reported",
    alreadyBought: "Already bought",
    full: "Fully funded",
    available: "Available",
    noTarget: "No target amount set",
    ofGoal: "of goal",
    contribute: "Contribute",
  },
  es: {
    back: "← Volver a la lista",
    loading: "Cargando…",
    notFound: "Artículo no encontrado.",
    total: "Total",
    target: "Objetivo",
    confirmed: "confirmado",
    reported: "anunciado",
    alreadyBought: "Ya comprado",
    full: "Completo",
    available: "Disponible",
    noTarget: "No hay importe objetivo",
    ofGoal: "del objetivo",
    contribute: "Contribuir",
  },
};

function euro(cents: number, lang: Lang) {
  const locale =
    lang === "nl"
      ? "nl-BE"
      : lang === "ca"
      ? "ca-ES"
      : lang === "es"
      ? "es-ES"
      : "en-GB";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function normalizeCategory(category: string | null | undefined) {
  const value = (category ?? "").trim().toLowerCase();

  const aliases: Record<string, string> = {
    sleep: "sleeping",
    sleeping: "sleeping",

    feeding: "feeding",
    food: "feeding",

    care: "care",
    hygiene: "care",
    care_hygiene: "care",
    oral_care_teething: "care",
    verzorging: "care",

    travel: "travel",
    onderweg: "travel",
    outdoor_travel: "travel",

    toys: "toys",
    speelgoed: "toys",
    play_development: "toys",

    clothes: "clothes",
    clothing: "clothes",
    kleding: "clothes",
    textiles: "clothes",

    room: "room",
    nursery: "room",
    babykamer: "room",

    essentials: "essentials",
    musthaves: "essentials",
    must_haves: "essentials",

    other: "other",
    overig: "other",
  };

  return aliases[value] ?? (value || "other");
}

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams<{ lang: string; slug: string }>();
  const lang = ((params.lang ?? "nl") as Lang) || "nl";
  const slug = params.slug;
  const t = uiText[lang];

  const [item, setItem] = useState<Item | null>(null);
  const [totals, setTotals] = useState<TotalsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select(
            "id,slug,title,description,image_url,already_owned,target_cents,is_open,category"
          )
          .eq("slug", slug)
          .eq("is_open", true)
          .maybeSingle();

        if (itemError) throw itemError;
        if (!itemData) {
          if (!isMounted) return;
          setItem(null);
          return;
        }

        const { data: totalsData, error: totalsError } = await supabase
          .from("item_totals")
          .select("item_id,paid_cents,reported_cents")
          .eq("item_id", itemData.id)
          .maybeSingle();

        if (totalsError) throw totalsError;

        if (!isMounted) return;

        setItem(itemData as Item);
        setTotals(
          totalsData
            ? {
                item_id: totalsData.item_id,
                paid_cents: Number(totalsData.paid_cents ?? 0),
                reported_cents: Number(totalsData.reported_cents ?? 0),
              }
            : {
                item_id: itemData.id,
                paid_cents: 0,
                reported_cents: 0,
              }
        );
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const view = useMemo(() => {
    if (!item) return null;

    const paid = totals?.paid_cents ?? 0;
    const reported = totals?.reported_cents ?? 0;
    const target = item.target_cents ?? 0;
    const total = paid + reported;

    const totalProgress = target > 0 ? clamp01(total / target) : 0;
    const paidProgress = target > 0 ? clamp01(paid / target) : 0;
    const pct = Math.round(totalProgress * 100);
    const reached = target > 0 && total >= target;
    const disabled = item.already_owned || reached;
    const categoryKey = normalizeCategory(item.category);
    const categoryLabel =
      categoryLabels[lang][categoryKey] ?? categoryLabels[lang].other;

    return {
      paid,
      reported,
      target,
      total,
      totalProgress,
      paidProgress,
      pct,
      reached,
      disabled,
      categoryLabel,
    };
  }, [item, totals, lang]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-4 py-8 text-[#5e6a50]">
        {t.loading}
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-4 py-8 text-red-600">
        {error}
      </main>
    );
  }

  if (!item || !view) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-4 py-8 text-[#5e6a50]">
        <button
          type="button"
          onClick={() => router.push(`/${lang}`)}
          className="mb-6 text-sm text-[#5e6a50]"
        >
          {t.back}
        </button>

        <div className="rounded-2xl border border-[#d8ddd1] bg-white p-6 shadow-sm">
          {t.notFound}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          type="button"
          onClick={() => router.push(`/${lang}`)}
          className="mb-6 text-sm text-[#5e6a50] transition hover:opacity-80"
        >
          {t.back}
        </button>

        <div className="rounded-3xl border border-[#d8ddd1] bg-white p-5 shadow-sm">
          {item.image_url ? (
            <div className="rounded-2xl bg-[#f8f6f2] p-4">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full rounded-xl object-contain"
              />
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-2xl bg-[#f3f1eb] text-[#8d9484]">
              No image
            </div>
          )}

          <div className="mt-5">
            <span className="inline-flex rounded-full bg-[#ecefe7] px-3 py-1 text-xs text-[#5e6a50]">
              {view.categoryLabel}
            </span>
          </div>

          <h1 className="mt-4 text-3xl text-[#5e6a50]">{item.title}</h1>

          {item.description ? (
            <p className="mt-3 text-base leading-7 text-[#7c8570]">
              {item.description}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4 rounded-2xl bg-[#fbfaf7] p-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-[#7c8570]">{t.total}</div>
              <div className="mt-1 text-xl text-[#5e6a50]">
                {euro(view.total, lang)}
              </div>
              <div className="mt-1 text-xs text-[#9ba292]">
                {euro(view.paid, lang)} {t.confirmed}
                {view.reported > 0
                  ? ` · ${euro(view.reported, lang)} ${t.reported}`
                  : ""}
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-sm text-[#7c8570]">{t.target}</div>
              <div className="mt-1 text-xl text-[#5e6a50]">
                {view.target > 0 ? euro(view.target, lang) : "—"}
              </div>
              <div className="mt-1 text-xs text-[#9ba292]">
                {view.target > 0 ? `${view.pct}% ${t.ofGoal}` : t.noTarget}
              </div>
            </div>
          </div>

          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#e8ebe3]">
            <div
              className="h-3 bg-[#cfd5c7]"
              style={{ width: `${Math.round(view.totalProgress * 100)}%` }}
            />
            <div
              className="-mt-3 h-3 bg-[#5e6a50]"
              style={{ width: `${Math.round(view.paidProgress * 100)}%` }}
            />
          </div>

          <div className="mt-4">
            {item.already_owned ? (
              <span className="inline-flex rounded-full bg-[#ecefe7] px-3 py-1 text-sm text-[#5e6a50]">
                {t.alreadyBought}
              </span>
            ) : view.reached ? (
              <span className="inline-flex rounded-full bg-[#dfe7d7] px-3 py-1 text-sm text-[#4f5a44]">
                {t.full}
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-[#f4efe3] px-3 py-1 text-sm text-[#8a7753]">
                {t.available}
              </span>
            )}
          </div>

          <div className="mt-8">
            <button
              type="button"
              disabled={view.disabled}
              onClick={() => router.push(`/${lang}/pay/${item.id}`)}
              className={[
                "w-full rounded-2xl px-5 py-4 text-center transition",
                view.disabled
                  ? "cursor-not-allowed bg-[#e8ebe3] text-[#9ba292]"
                  : "bg-[#5e6a50] text-white hover:opacity-90",
              ].join(" ")}
            >
              {t.contribute}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}