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
    essentials: "Essentials",
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
    essentials: "Essencials",
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
    essentials: "Esenciales",
    other: "Otros",
  },
};

const uiText: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    empty: string;
    loading: string;
    total: string;
    target: string;
    confirmed: string;
    reported: string;
    alreadyBought: string;
    full: string;
    available: string;
    noTarget: string;
    ofGoal: string;
    darkConfirmed: string;
  }
> = {
  nl: {
    title: "Geboortelijst",
    subtitle: "Kies een cadeau en draag bij aan een item.",
    empty: "Er staan momenteel geen open items op de geboortelijst.",
    loading: "Laden…",
    total: "Totaal",
    target: "Doel",
    confirmed: "bevestigd",
    reported: "gemeld",
    alreadyBought: "Al gekocht",
    full: "Volzet",
    available: "Beschikbaar",
    noTarget: "Geen doelbedrag ingesteld",
    ofGoal: "van doel",
    darkConfirmed: "donker = bevestigd",
  },
  ca: {
    title: "Llista de naixement",
    subtitle: "Tria un regal i contribueix a un article.",
    empty: "Actualment no hi ha articles oberts a la llista de naixement.",
    loading: "Carregant…",
    total: "Total",
    target: "Objectiu",
    confirmed: "confirmat",
    reported: "anunciat",
    alreadyBought: "Ja comprat",
    full: "Complet",
    available: "Disponible",
    noTarget: "No hi ha import objectiu",
    ofGoal: "de l’objectiu",
    darkConfirmed: "fosc = confirmat",
  },
  en: {
    title: "Baby Registry",
    subtitle: "Choose a gift and contribute to an item.",
    empty: "There are currently no open items on the baby registry.",
    loading: "Loading…",
    total: "Total",
    target: "Target",
    confirmed: "confirmed",
    reported: "reported",
    alreadyBought: "Already bought",
    full: "Fully funded",
    available: "Available",
    noTarget: "No target amount set",
    ofGoal: "of goal",
    darkConfirmed: "dark = confirmed",
  },
  es: {
    title: "Lista de nacimiento",
    subtitle: "Elige un regalo y contribuye a un artículo.",
    empty: "Actualmente no hay artículos abiertos en la lista de nacimiento.",
    loading: "Cargando…",
    total: "Total",
    target: "Objetivo",
    confirmed: "confirmado",
    reported: "anunciado",
    alreadyBought: "Ya comprado",
    full: "Completo",
    available: "Disponible",
    noTarget: "No hay importe objetivo",
    ofGoal: "del objetivo",
    darkConfirmed: "oscuro = confirmado",
  },
};

const categoryOrder = [
  "essentials",
  "sleeping",
  "feeding",
  "care",
  "travel",
  "room",
  "clothes",
  "toys",
  "other",
];

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
  return value || "other";
}

export default function RegistryPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = ((params.lang ?? "nl") as Lang) || "nl";
  const t = uiText[lang];

  const [items, setItems] = useState<Item[]>([]);
  const [totals, setTotals] = useState<Record<string, TotalsRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        if (!isMounted) return;

        setLoading(true);
        setError(null);

        const [{ data: itemsData, error: e1 }, { data: totalsData, error: e2 }] =
          await Promise.all([
            supabase
              .from("items")
              .select(
                "id,slug,title,description,image_url,already_owned,target_cents,is_open,category"
              )
              .eq("is_open", true)
              .order("sort_order", { ascending: true }),
            supabase
              .from("item_totals")
              .select("item_id,paid_cents,reported_cents"),
          ]);

        if (e1) throw e1;
        if (e2) throw new Error(`Kan totals niet laden: ${e2.message}`);

        const list = (itemsData ?? []) as Item[];

        const map: Record<string, TotalsRow> = {};
        ((totalsData ?? []) as TotalsRow[]).forEach((row) => {
          map[row.item_id] = {
            item_id: row.item_id,
            paid_cents: Number(row.paid_cents ?? 0),
            reported_cents: Number(row.reported_cents ?? 0),
          };
        });

        if (!isMounted) return;

        setItems(list);
        setTotals(map);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Onbekende fout");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    return items.map((it) => {
      const t = totals[it.id];

      const paid = t?.paid_cents ?? 0;
      const reported = t?.reported_cents ?? 0;
      const target = it.target_cents ?? 0;
      const total = paid + reported;

      const totalProgress = target > 0 ? clamp01(total / target) : 0;
      const paidProgress = target > 0 ? clamp01(paid / target) : 0;

      const pct = Math.round(totalProgress * 100);
      const reached = target > 0 && total >= target;
      const disabled = it.already_owned || reached;

      return {
        it,
        paid,
        reported,
        total,
        target,
        totalProgress,
        paidProgress,
        pct,
        reached,
        disabled,
      };
    });
  }, [items, totals]);

  const groupedCards = useMemo(() => {
    const groups: Record<string, typeof cards> = {};

    for (const card of cards) {
      const key = normalizeCategory(card.it.category);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(card);
    }

    return Object.entries(groups).sort(([a], [b]) => {
      const ia = categoryOrder.indexOf(a);
      const ib = categoryOrder.indexOf(b);

      const va = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
      const vb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;

      if (va !== vb) return va - vb;
      return a.localeCompare(b);
    });
  }, [cards]);

  if (loading) {
    return <main className="p-6">{t.loading}</main>;
  }

  if (error) {
    return <main className="p-6 text-red-600">Fout: {error}</main>;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">{t.title}</h1>

        <div className="mt-2 text-sm text-gray-600">{t.subtitle}</div>

        {cards.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
            {t.empty}
          </div>
        ) : (
          <div className="mt-6 space-y-10">
            {groupedCards.map(([category, group]) => (
              <section key={category}>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  {categoryLabels[lang][category] ?? category}
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map(
                    ({
                      it,
                      paid,
                      reported,
                      total,
                      target,
                      totalProgress,
                      paidProgress,
                      pct,
                      reached,
                      disabled,
                    }) => (
                      <button
                        key={it.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (!disabled) {
                            router.push(`/${lang}/item/${it.slug}`);
                          }
                        }}
                        className={[
                          "text-left rounded-2xl border bg-white p-4 shadow-sm transition",
                          disabled
                            ? "cursor-not-allowed opacity-60"
                            : "hover:-translate-y-0.5 hover:shadow-md",
                        ].join(" ")}
                      >
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt={it.title}
                            className="h-40 w-full rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-40 w-full rounded-xl bg-gray-100" />
                        )}

                        <div className="mt-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold">{it.title}</div>

                            {it.description ? (
                              <div className="mt-1 line-clamp-2 text-sm text-gray-600">
                                {it.description}
                              </div>
                            ) : null}
                          </div>

                          {it.already_owned ? (
                            <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              {t.alreadyBought}
                            </span>
                          ) : reached ? (
                            <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                              {t.full}
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              {t.available}
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-start justify-between gap-4 text-sm">
                            <div className="text-gray-600">
                              <div>
                                {t.total}:{" "}
                                <span className="font-medium text-gray-900">
                                  {euro(total, lang)}
                                </span>
                              </div>

                              <div className="mt-1 text-xs text-gray-500">
                                {euro(paid, lang)} {t.confirmed}
                                {reported > 0
                                  ? ` · ${euro(reported, lang)} ${t.reported}`
                                  : ""}
                              </div>
                            </div>

                            <div className="text-right text-gray-600">
                              <div>
                                {t.target}:{" "}
                                <span className="font-medium text-gray-900">
                                  {target > 0 ? euro(target, lang) : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-2 bg-gray-300"
                              style={{ width: `${Math.round(totalProgress * 100)}%` }}
                            />
                            <div
                              className="-mt-2 h-2 bg-gray-900"
                              style={{ width: `${Math.round(paidProgress * 100)}%` }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {target > 0
                                ? `${pct}% ${t.ofGoal}`
                                : t.noTarget}
                            </span>
                            <span>{t.darkConfirmed}</span>
                          </div>
                        </div>
                      </button>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}