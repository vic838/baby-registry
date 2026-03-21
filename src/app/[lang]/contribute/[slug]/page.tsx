"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "nl" | "ca" | "en" | "es";

type ItemViewRow = {
  id: string;
  slug: string;
  image_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  is_active: boolean;
  category: string | null;
  is_contribution_item: boolean;
  lang: Lang;
  title: string;
  description: string | null;
};

type TotalsRow = {
  item_id: string;
  paid_cents: number;
  reported_cents: number;
};

type ItemView = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  category: string | null;
  is_contribution_item: boolean;
  paid_cents: number;
  reported_cents: number;
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

const uiText: Record<
  Lang,
  {
    back: string;
    backToList: string;
    loading: string;
    notFound: string;
    contributeTitle: string;
    amount: string;
    submit: string;
    submitting: string;
    invalidAmount: string;
    unavailable: string;
    remaining: string;
    tooHighAmount: string;
    suggestedAmounts: string;
    noImage: string;
    addedTitle: string;
    addedBody: string;
    viewCart: string;
    close: string;
  }
> = {
  nl: {
    back: "← Terug naar item",
    backToList: "← Terug naar lijst",
    loading: "Laden…",
    notFound: "Item niet gevonden.",
    contributeTitle: "Bijdragen aan dit item",
    amount: "Bedrag",
    submit: "Toevoegen aan mandje",
    submitting: "Bezig…",
    invalidAmount: "Geef een geldig bedrag in.",
    unavailable: "Bijdragen is voor dit item niet beschikbaar.",
    remaining: "Nog nodig",
    tooHighAmount: "Bedrag is hoger dan het resterende bedrag.",
    suggestedAmounts: "Snelle keuzes",
    noImage: "Geen afbeelding",
    addedTitle: "Toegevoegd aan mandje",
    addedBody: "Je bijdrage werd toegevoegd aan je mandje.",
    viewCart: "Bekijk mandje",
    close: "Sluiten",
  },
  ca: {
    back: "← Tornar a l’article",
    backToList: "← Tornar a la llista",
    loading: "Carregant…",
    notFound: "Article no trobat.",
    contributeTitle: "Contribuir a aquest article",
    amount: "Import",
    submit: "Afegir a la cistella",
    submitting: "En curs…",
    invalidAmount: "Introdueix un import vàlid.",
    unavailable: "La contribució no està disponible per a aquest article.",
    remaining: "Encara falta",
    tooHighAmount: "L'import és superior al que queda pendent.",
    suggestedAmounts: "Imports suggerits",
    noImage: "Sense imatge",
    addedTitle: "Afegit a la cistella",
    addedBody: "La teva contribució s'ha afegit a la cistella.",
    viewCart: "Veure cistella",
    close: "Tancar",
  },
  en: {
    back: "← Back to item",
    backToList: "← Back to list",
    loading: "Loading…",
    notFound: "Item not found.",
    contributeTitle: "Contribute to this item",
    amount: "Amount",
    submit: "Add to cart",
    submitting: "Submitting…",
    invalidAmount: "Please enter a valid amount.",
    unavailable: "Contribution is not available for this item.",
    remaining: "Still needed",
    tooHighAmount: "Amount is higher than the remaining amount.",
    suggestedAmounts: "Suggested amounts",
    noImage: "No image",
    addedTitle: "Added to cart",
    addedBody: "Your contribution was added to your cart.",
    viewCart: "View cart",
    close: "Close",
  },
  es: {
    back: "← Volver al artículo",
    backToList: "← Volver a la lista",
    loading: "Cargando…",
    notFound: "Artículo no encontrado.",
    contributeTitle: "Contribuir a este artículo",
    amount: "Importe",
    submit: "Añadir al carrito",
    submitting: "Enviando…",
    invalidAmount: "Introduce un importe válido.",
    unavailable: "La contribución no está disponible para este artículo.",
    remaining: "Aún falta",
    tooHighAmount: "El importe es superior al importe restante.",
    suggestedAmounts: "Importes sugeridos",
    noImage: "Sin imagen",
    addedTitle: "Añadido al carrito",
    addedBody: "Tu contribución se ha añadido al carrito.",
    viewCart: "Ver carrito",
    close: "Cerrar",
  },
};

const suggestionEuros = [10, 25, 50, 100];

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
  window.dispatchEvent(new Event("birthlist-cart-updated"));
}

function addContributionToCart(params: {
  itemId: string;
  slug: string;
  title: string;
  image_url: string | null;
  amount_cents: number;
}) {
  const current = readCart();

  current.push({
    type: "contribution",
    itemId: params.itemId,
    slug: params.slug,
    title: params.title,
    image_url: params.image_url,
    amount_cents: params.amount_cents,
    addedAt: new Date().toISOString(),
  });

  writeCart(current);
}

export default function ContributePage() {
  const router = useRouter();
  const params = useParams<{ lang: string; slug: string }>();
  const routeLang = params.lang ?? "nl";
  const lang: Lang = ["nl", "ca", "en", "es"].includes(routeLang)
    ? (routeLang as Lang)
    : "nl";
  const slug = params.slug;
  const t = uiText[lang];

  const [item, setItem] = useState<ItemView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amountEuros, setAmountEuros] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadItem() {
      try {
        setLoading(true);
        setError(null);

        const [{ data: itemData, error: itemError }, { data: totalsData, error: totalsError }] =
          await Promise.all([
            supabase
              .from("items_with_translations")
              .select(
                "id,slug,image_url,already_owned,target_cents,is_active,category,is_contribution_item,lang,title,description"
              )
              .eq("slug", slug)
              .eq("lang", lang)
              .eq("is_active", true)
              .maybeSingle(),
            supabase.from("item_totals").select("item_id,paid_cents,reported_cents"),
          ]);

        if (itemError) throw itemError;
        if (totalsError) throw totalsError;

        if (!itemData) {
          if (!active) return;
          setItem(null);
          return;
        }

        const row = itemData as ItemViewRow;
        const totalsRow = ((totalsData ?? []) as TotalsRow[]).find(
          (entry) => entry.item_id === row.id
        );

        if (!active) return;

        setItem({
          id: row.id,
          slug: row.slug,
          title: row.title ?? row.slug,
          description: row.description ?? null,
          image_url: row.image_url,
          already_owned: row.already_owned,
          target_cents: row.target_cents,
          category: row.category,
          is_contribution_item: row.is_contribution_item,
          paid_cents: Number(totalsRow?.paid_cents ?? 0),
          reported_cents: Number(totalsRow?.reported_cents ?? 0),
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    loadItem();

    return () => {
      active = false;
    };
  }, [slug, lang]);

  const progress = useMemo(() => {
    if (!item?.target_cents || item.target_cents <= 0) return 0;
    return clamp01((item.paid_cents + item.reported_cents) / item.target_cents);
  }, [item]);

  const remaining = useMemo(() => {
    if (!item?.target_cents) return null;

    const value = item.target_cents - (item.paid_cents + item.reported_cents);
    return value > 0 ? value : 0;
  }, [item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = Number((amountEuros || "").replace(",", "."));
    if (!parsed || parsed <= 0) {
      window.alert(t.invalidAmount);
      return;
    }

    if (!item) return;

    const parsedCents = Math.round(parsed * 100);

    if (remaining !== null && parsedCents > remaining) {
      window.alert(t.tooHighAmount);
      return;
    }

    try {
      setSubmitting(true);

      addContributionToCart({
        itemId: item.id,
        slug: item.slug,
        title: item.title,
        image_url: item.image_url,
        amount_cents: parsedCents,
      });

      setShowAddedToast(true);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
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

  if (!item) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-4 py-8 text-[#5e6a50]">
        {t.notFound}
      </main>
    );
  }

  if (!item.is_contribution_item || item.already_owned) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-4 py-8 text-[#5e6a50]">
        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          <button
            type="button"
            onClick={() => router.push(`/${lang}`)}
            className="text-[#5e6a50]"
          >
            {t.backToList}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${lang}/item/${item.slug}`)}
            className="text-[#5e6a50]"
          >
            {t.back}
          </button>
        </div>

        <div className="rounded-2xl border border-[#d8ddd1] bg-white p-6 shadow-sm">
          {t.unavailable}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          <button
            type="button"
            onClick={() => router.push(`/${lang}`)}
            className="text-[#5e6a50] transition hover:opacity-80"
          >
            {t.backToList}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${lang}/item/${item.slug}`)}
            className="text-[#5e6a50] transition hover:opacity-80"
          >
            {t.back}
          </button>
        </div>

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
            <div className="flex h-64 items-center justify-center rounded-2xl bg-[#f3f1eb] text-[#8d9484]">
              {t.noImage}
            </div>
          )}

          <h1 className="mt-5 text-3xl text-[#5e6a50]">{item.title}</h1>

          {item.description ? (
            <p className="mt-3 text-base leading-7 text-[#7c8570]">
              {item.description}
            </p>
          ) : null}

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-[#7c8570]">
              <span>{euro(item.paid_cents + item.reported_cents, lang)}</span>
              <span>{item.target_cents ? euro(item.target_cents, lang) : "—"}</span>
            </div>

            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#e8ebe3]">
              <div
                className="h-3 bg-[#5e6a50]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>

            {remaining !== null ? (
              <p className="mt-2 text-sm text-[#7c8570]">
                {t.remaining}: {euro(remaining, lang)}
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-[#5e6a50]">
                {t.amount}
              </label>

              <div className="mb-3">
                <div className="mb-2 text-xs text-[#7c8570]">
                  {t.suggestedAmounts}
                </div>

                <div className="flex flex-wrap gap-2">
                  {suggestionEuros.map((value) => {
                    const cents = value * 100;

                    if (remaining !== null && cents > remaining) {
                      return null;
                    }

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAmountEuros(String(value))}
                        className="rounded-full border border-[#d8ddd1] px-4 py-2 text-sm text-[#5e6a50] transition hover:bg-[#f3f1eb]"
                      >
                        €{value}
                      </button>
                    );
                  })}

                  {remaining !== null &&
                  remaining > 0 &&
                  !suggestionEuros.includes(Math.round(remaining / 100)) ? (
                    <button
                      type="button"
                      onClick={() =>
                        setAmountEuros(
                          ((remaining || 0) / 100).toFixed(2).replace(".", ",")
                        )
                      }
                      className="rounded-full border border-[#5e6a50] px-4 py-2 text-sm text-[#5e6a50] transition hover:bg-[#f3f1eb]"
                    >
                      {euro(remaining, lang)}
                    </button>
                  ) : null}
                </div>
              </div>

              <input
                type="text"
                inputMode="decimal"
                value={amountEuros}
                onChange={(e) => setAmountEuros(e.target.value)}
                placeholder="25"
                required
                className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-3 text-[#5e6a50] outline-none focus:border-[#5e6a50]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={[
                "w-full rounded-2xl px-5 py-4 text-center transition",
                submitting
                  ? "cursor-not-allowed bg-[#e8ebe3] text-[#9ba292]"
                  : "bg-[#5e6a50] text-white hover:opacity-90",
              ].join(" ")}
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        </div>
      </div>

      {showAddedToast ? (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100%-2rem)] max-w-[420px] rounded-[22px] border border-[#d8ddd1] bg-white p-4 shadow-lg">
          <div className="mb-1 text-[18px] font-medium text-[#5e6a50]">
            {t.addedTitle}
          </div>
          <div className="mb-3 text-[15px] text-[#5e6a50]">{t.addedBody}</div>
          <div className="mb-3 text-[15px] text-[#7c8570]">
            {item.title} — {amountEuros ? `€${amountEuros}` : ""}
          </div>

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