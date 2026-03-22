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
  is_active: boolean;
  category: string | null;
  is_contribution_item: boolean;
};

type TotalsRow = {
  item_id: string;
  paid_cents: number;
  reported_cents: number;
};

type ItemViewRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  is_active: boolean;
  category: string | null;
  is_contribution_item: boolean;
  lang: Lang;
};

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

const CART_STORAGE_KEY = "birthlist_cart_v1";

const categoryLabels: Record<Lang, Record<string, string>> = {
  nl: {
    sleeping: "Slapen",
    feeding: "Voeding",
    care: "Verzorging",
    travel: "Onderweg",
    toys: "Speelgoed",
    clothes: "Textiel",
    room: "Meubels",
    essentials: "Must-haves",
    other: "Overig",
  },
  ca: {
    sleeping: "Dormir",
    feeding: "Alimentació",
    care: "Higiene i cura",
    travel: "Passeig",
    toys: "Joguines",
    clothes: "Tèxtil",
    room: "Mobles",
    essentials: "Imprescindibles",
    other: "Altres",
  },
  en: {
    sleeping: "Sleeping",
    feeding: "Feeding",
    care: "Care",
    travel: "Travel",
    toys: "Toys",
    clothes: "Textiles",
    room: "Furniture",
    essentials: "Essentials",
    other: "Other",
  },
  es: {
    sleeping: "Dormir",
    feeding: "Alimentación",
    care: "Cuidado",
    travel: "Paseo",
    toys: "Juguetes",
    clothes: "Textil",
    room: "Muebles",
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
    alreadyOffered: string;
    full: string;
    available: string;
    noTarget: string;
    ofGoal: string;
    offer: string;
    contribute: string;
    addedTitle: string;
    addedBody: string;
    viewCart: string;
    close: string;
    noImage: string;
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
    alreadyOffered: "Al aangeboden",
    full: "Volzet",
    available: "Beschikbaar",
    noTarget: "Geen doelbedrag ingesteld",
    ofGoal: "van doel",
    offer: "Ga verder om dit aan te bieden",
    contribute: "Ga verder om bij te dragen",
    addedTitle: "Toegevoegd aan mandje",
    addedBody: "Dit item werd toegevoegd aan je mandje.",
    viewCart: "Bekijk mandje",
    close: "Sluiten",
    noImage: "Geen afbeelding",
  },
  ca: {
    back: "← Tornar a la llista",
    loading: "Carregant…",
    notFound: "Article no trobat.",
    total: "Total",
    target: "Objectiu",
    confirmed: "confirmat",
    reported: "anunciat",
    alreadyOffered: "Ja ofert",
    full: "Complet",
    available: "Disponible",
    noTarget: "No hi ha import objectiu",
    ofGoal: "de l’objectiu",
    offer: "Continuar per oferir-ho",
    contribute: "Continuar per contribuir",
    addedTitle: "Afegit a la cistella",
    addedBody: "Aquest article s'ha afegit a la cistella.",
    viewCart: "Veure cistella",
    close: "Tancar",
    noImage: "Sense imatge",
  },
  en: {
    back: "← Back to list",
    loading: "Loading…",
    notFound: "Item not found.",
    total: "Total",
    target: "Target",
    confirmed: "confirmed",
    reported: "reported",
    alreadyOffered: "Already offered",
    full: "Fully funded",
    available: "Available",
    noTarget: "No target amount set",
    ofGoal: "of goal",
    offer: "Continue to offer this",
    contribute: "Continue to contribute",
    addedTitle: "Added to cart",
    addedBody: "This item was added to your cart.",
    viewCart: "View cart",
    close: "Close",
    noImage: "No image",
  },
  es: {
    back: "← Volver a la lista",
    loading: "Cargando…",
    notFound: "Artículo no encontrado.",
    total: "Total",
    target: "Objetivo",
    confirmed: "confirmado",
    reported: "anunciado",
    alreadyOffered: "Ya ofrecido",
    full: "Completo",
    available: "Disponible",
    noTarget: "No hay importe objetivo",
    ofGoal: "del objetivo",
    offer: "Continuar para ofrecerlo",
    contribute: "Continuar para contribuir",
    addedTitle: "Añadido al carrito",
    addedBody: "Este artículo se ha añadido al carrito.",
    viewCart: "Ver carrito",
    close: "Cerrar",
    noImage: "Sin imagen",
  },
};

function euro(cents: number, lang: Lang) {
  const locale =
    lang === "nl" ? "nl-BE" : lang === "ca" ? "ca-ES" : lang === "es" ? "es-ES" : "en-GB";

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
    dormir: "sleeping",

    feeding: "feeding",
    food: "feeding",
    voeding: "feeding",
    alimentació: "feeding",
    alimentación: "feeding",

    care: "care",
    hygiene: "care",
    care_hygiene: "care",
    oral_care_teething: "care",
    verzorging: "care",
    cura: "care",
    cuidado: "care",

    travel: "travel",
    onderweg: "travel",
    outdoor_travel: "travel",
    desplaçaments: "travel",
    passeig: "travel",
    paseo: "travel",

    toys: "toys",
    speelgoed: "toys",
    play_development: "toys",
    play: "toys",
    joguines: "toys",
    juguetes: "toys",

    clothes: "clothes",
    clothing: "clothes",
    kleding: "clothes",
    textiles: "clothes",
    textiel: "clothes",
    tèxtil: "clothes",
    textil: "clothes",
    roba: "clothes",
    ropa: "clothes",

    room: "room",
    nursery: "room",
    furniture: "room",
    meubels: "room",
    muebles: "room",
    mobles: "room",
    babykamer: "room",
    habitació: "room",
    habitación: "room",

    essentials: "essentials",
    musthaves: "essentials",
    must_haves: "essentials",
    "must-haves": "essentials",
    imprescindibles: "essentials",

    other: "other",
    overig: "other",
    altres: "other",
    otros: "other",
  };

  return aliases[value] ?? (value || "other");
}

function getCategoryBadgeClass(categoryKey: string) {
  const map: Record<string, string> = {
    essentials: "bg-amber-100 text-amber-800",
    sleeping: "bg-sky-100 text-sky-800",
    feeding: "bg-yellow-100 text-yellow-800",
    care: "bg-emerald-100 text-emerald-800",
    travel: "bg-indigo-100 text-indigo-800",
    room: "bg-rose-100 text-rose-800",
    clothes: "bg-pink-100 text-pink-800",
    toys: "bg-violet-100 text-violet-800",
    other: "bg-stone-100 text-stone-700",
  };

  return map[categoryKey] ?? map.other;
}

function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
}

function addClassicItemToCart(item: Item) {
  const current = readCart();

  const alreadyExists = current.some(
    (line) => line.type === "item" && line.itemId === item.id
  );

  if (alreadyExists) {
    writeCart(current);
    return;
  }

  current.push({
    type: "item",
    itemId: item.id,
    slug: item.slug,
    title: item.title,
    image_url: item.image_url,
    quantity: 1,
    unit_cents: Math.max(0, Number(item.target_cents ?? 0)),
    addedAt: new Date().toISOString(),
  });

  writeCart(current);
}

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams<{ lang: string; slug: string }>();
  const routeLang = params.lang ?? "nl";
  const lang: Lang = ["nl", "ca", "en", "es"].includes(routeLang)
    ? (routeLang as Lang)
    : "nl";
  const slug = params.slug;
  const t = uiText[lang];

  const [item, setItem] = useState<Item | null>(null);
  const [totals, setTotals] = useState<TotalsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddedToast, setShowAddedToast] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: itemData, error: itemError } = await supabase
          .from("items_with_translations")
          .select(
            "id,slug,title,description,image_url,already_owned,target_cents,is_active,category,is_contribution_item,lang"
          )
          .eq("slug", slug)
          .eq("lang", lang)
          .eq("is_active", true)
          .maybeSingle();

        if (itemError) throw itemError;

        if (!itemData) {
          if (!isMounted) return;
          setItem(null);
          setTotals(null);
          return;
        }

        const typedItem = itemData as ItemViewRow;

        const { data: totalsData, error: totalsError } = await supabase
          .from("item_totals")
          .select("item_id,paid_cents,reported_cents")
          .eq("item_id", typedItem.id)
          .maybeSingle();

        if (totalsError) throw totalsError;
        if (!isMounted) return;

        setItem({
          id: typedItem.id,
          slug: typedItem.slug,
          title: typedItem.title,
          description: typedItem.description ?? null,
          image_url: typedItem.image_url,
          already_owned: typedItem.already_owned,
          target_cents: typedItem.target_cents,
          is_active: typedItem.is_active,
          category: typedItem.category,
          is_contribution_item: typedItem.is_contribution_item,
        });

        setTotals(
          totalsData
            ? {
                item_id: totalsData.item_id,
                paid_cents: Number(totalsData.paid_cents ?? 0),
                reported_cents: Number(totalsData.reported_cents ?? 0),
              }
            : {
                item_id: typedItem.id,
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
  }, [slug, lang]);

  const view = useMemo(() => {
    if (!item) return null;

    const paid = totals?.paid_cents ?? 0;
    const reported = totals?.reported_cents ?? 0;
    const target = item.target_cents ?? 0;
    const total = paid + reported;
    const totalProgress = target > 0 ? clamp01(total / target) : 0;
    const paidProgress = target > 0 ? clamp01(paid / target) : 0;
    const pct = Math.round(totalProgress * 100);
    const reached = item.is_contribution_item && target > 0 && total >= target;
    const disabled = item.already_owned || reached;
    const categoryKey = normalizeCategory(item.category);
    const categoryLabel = categoryLabels[lang][categoryKey] ?? categoryLabels[lang].other;
    const categoryBadgeClass = getCategoryBadgeClass(categoryKey);

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
      categoryBadgeClass,
    };
  }, [item, totals, lang]);

  function handleMainAction() {
    if (!item || !view) return;

    if (view.disabled) return;

    if (item.is_contribution_item) {
      router.push(`/${lang}/contribute/${item.slug}`);
      return;
    }

    addClassicItemToCart(item);
    setShowAddedToast(true);
  }

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
          onClick={() => router.push(`/${lang}/registry`)}
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

  const statusText = item.already_owned
    ? t.alreadyOffered
    : view.reached
    ? t.full
    : t.available;

  const statusClass = item.already_owned
    ? "bg-[#ecefe7] text-[#5e6a50]"
    : view.reached
    ? "bg-[#dfe7d7] text-[#4f5a44]"
    : "bg-[#f4efe3] text-[#8a7753]";

  const ctaText = item.is_contribution_item ? t.contribute : t.offer;

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/registry`)}
          className="mb-6 text-sm text-[#5e6a50] transition hover:opacity-80"
        >
          {t.back}
        </button>

        <div className="rounded-3xl border border-[#d8ddd1] bg-white p-5 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[minmax(320px,420px)_1fr] lg:items-start">
            <div>
              {item.image_url ? (
                <div className="rounded-2xl bg-[#f8f6f2] p-4">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="mx-auto max-h-[380px] w-full rounded-xl object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-2xl bg-[#f3f1eb] text-[#8d9484]">
                  {t.noImage}
                </div>
              )}
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs ${view.categoryBadgeClass}`}
                >
                  {view.categoryLabel}
                </span>

                <span className={`inline-flex rounded-full px-3 py-1 text-sm ${statusClass}`}>
                  {statusText}
                </span>
              </div>

              <h1 className="text-3xl text-[#5e6a50]">{item.title}</h1>

              {item.description ? (
                <p className="mt-3 text-base leading-7 text-[#7c8570]">
                  {item.description}
                </p>
              ) : null}

              {item.is_contribution_item ? (
                <>
                  <div className="mt-6 grid gap-4 rounded-2xl bg-[#fbfaf7] p-4 sm:grid-cols-2">
                    <div>
                      <div className="text-sm text-[#7c8570]">{t.total}</div>
                      <div className="mt-1 text-xl text-[#5e6a50]">
                        {euro(view.total, lang)}
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
                </>
              ) : item.target_cents ? (
                <div className="mt-6 rounded-2xl bg-[#fbfaf7] p-4">
                  <div className="text-sm text-[#7c8570]">{t.target}</div>
                  <div className="mt-1 text-xl text-[#5e6a50]">
                    {euro(item.target_cents, lang)}
                  </div>
                </div>
              ) : null}

              <div className="mt-8">
                <button
                  type="button"
                  disabled={view.disabled}
                  onClick={handleMainAction}
                  className={[
                    "w-full rounded-2xl px-5 py-4 text-center transition",
                    view.disabled
                      ? "cursor-not-allowed bg-[#e8ebe3] text-[#9ba292]"
                      : "bg-[#5e6a50] text-white hover:opacity-90",
                  ].join(" ")}
                >
                  {view.disabled ? statusText : ctaText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddedToast ? (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100%-2rem)] max-w-[420px] rounded-[22px] border border-[#d8ddd1] bg-white p-4 shadow-lg">
          <div className="mb-1 text-[18px] font-medium text-[#5e6a50]">
            {t.addedTitle}
          </div>
          <div className="mb-3 text-[15px] text-[#5e6a50]">{t.addedBody}</div>
          <div className="mb-3 text-[15px] text-[#7c8570]">{item.title}</div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/${lang}/cart`)}
              className="rounded-[14px] bg-[#5e6a50] px-4 py-2 text-sm text-white transition hover:opacity-90"
            >
              {t.viewCart}
            </button>

            <button
              type="button"
              onClick={() => setShowAddedToast(false)}
              className="rounded-[14px] border border-[#d8ddd1] px-4 py-2 text-sm text-[#5e6a50] transition hover:bg-[#f7f5ef]"
            >
              {t.close}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}