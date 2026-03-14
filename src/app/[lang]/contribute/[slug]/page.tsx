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

const uiText: Record<
  Lang,
  {
    back: string;
    loading: string;
    notFound: string;
    contributeTitle: string;
    name: string;
    email: string;
    message: string;
    amount: string;
    submit: string;
    submitting: string;
    placeholderName: string;
    placeholderEmail: string;
    placeholderMessage: string;
    invalidAmount: string;
    unavailable: string;
    remaining: string;
    tooHighAmount: string;
    suggestedAmounts: string;
  }
> = {
  nl: {
    back: "← Terug naar item",
    loading: "Laden…",
    notFound: "Item niet gevonden.",
    contributeTitle: "Bijdragen aan dit item",
    name: "Naam",
    email: "E-mail",
    message: "Bericht",
    amount: "Bedrag",
    submit: "Ga naar betalen",
    submitting: "Bezig…",
    placeholderName: "Je naam",
    placeholderEmail: "je@email.com",
    placeholderMessage: "Optioneel bericht",
    invalidAmount: "Geef een geldig bedrag in.",
    unavailable: "Bijdragen is voor dit item niet beschikbaar.",
    remaining: "Nog nodig",
    tooHighAmount: "Bedrag is hoger dan het resterende bedrag.",
    suggestedAmounts: "Snelle keuzes",
  },
  ca: {
    back: "← Tornar a l’article",
    loading: "Carregant…",
    notFound: "Article no trobat.",
    contributeTitle: "Contribuir a aquest article",
    name: "Nom",
    email: "Correu electrònic",
    message: "Missatge",
    amount: "Import",
    submit: "Continuar al pagament",
    submitting: "En curs…",
    placeholderName: "El teu nom",
    placeholderEmail: "tu@email.com",
    placeholderMessage: "Missatge opcional",
    invalidAmount: "Introdueix un import vàlid.",
    unavailable: "La contribució no està disponible per a aquest article.",
    remaining: "Encara falta",
    tooHighAmount: "L'import és superior al que queda pendent.",
    suggestedAmounts: "Imports suggerits",
  },
  en: {
    back: "← Back to item",
    loading: "Loading…",
    notFound: "Item not found.",
    contributeTitle: "Contribute to this item",
    name: "Name",
    email: "Email",
    message: "Message",
    amount: "Amount",
    submit: "Continue to payment",
    submitting: "Submitting…",
    placeholderName: "Your name",
    placeholderEmail: "you@email.com",
    placeholderMessage: "Optional message",
    invalidAmount: "Please enter a valid amount.",
    unavailable: "Contribution is not available for this item.",
    remaining: "Still needed",
    tooHighAmount: "Amount is higher than the remaining amount.",
    suggestedAmounts: "Suggested amounts",
  },
  es: {
    back: "← Volver al artículo",
    loading: "Cargando…",
    notFound: "Artículo no encontrado.",
    contributeTitle: "Contribuir a este artículo",
    name: "Nombre",
    email: "Correo electrónico",
    message: "Mensaje",
    amount: "Importe",
    submit: "Continuar al pago",
    submitting: "Enviando…",
    placeholderName: "Tu nombre",
    placeholderEmail: "tu@email.com",
    placeholderMessage: "Mensaje opcional",
    invalidAmount: "Introduce un importe válido.",
    unavailable: "La contribución no está disponible para este artículo.",
    remaining: "Aún falta",
    tooHighAmount: "El importe es superior al importe restante.",
    suggestedAmounts: "Importes sugeridos",
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

export default function ContributePage() {
  const router = useRouter();
  const params = useParams<{ lang: string; slug: string }>();
  const routeLang = params.lang ?? "nl";
  const lang: Lang = ["nl", "ca", "en", "es"].includes(routeLang)
    ? (routeLang as Lang)
    : "nl";
  const slug = params.slug;
  const t = uiText[lang];
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const [item, setItem] = useState<ItemView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [amountEuros, setAmountEuros] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function scrollToForm() {
    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

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

      const res = await fetch("/api/contributions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemSlug: item.slug,
          name: name.trim(),
          email: email.trim() || null,
          message: message.trim() || null,
          amountCents: parsedCents,
          lang,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error ?? "Kon bijdrage niet aanmaken.");
      }

      const contributionId = json?.id;
      const token = json?.token;

      if (!contributionId || !token) {
        throw new Error("Onvolledig antwoord van server.");
      }

      router.push(`/${lang}/pay/${contributionId}?t=${encodeURIComponent(token)}`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Onbekende fout");
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
        <button
          type="button"
          onClick={() => router.push(`/${lang}/item/${item.slug}`)}
          className="mb-6 text-sm text-[#5e6a50]"
        >
          {t.back}
        </button>

        <div className="rounded-2xl border border-[#d8ddd1] bg-white p-6 shadow-sm">
          {t.unavailable}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/item/${item.slug}`)}
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
            <div className="flex h-64 items-center justify-center rounded-2xl bg-[#f3f1eb] text-[#8d9484]">
              No image
            </div>
          )}

          <h1 className="mt-5 text-3xl text-[#5e6a50]">{item.title}</h1>

          {item.description ? (
            <p className="mt-3 text-base leading-7 text-[#7c8570]">
              {item.description}
            </p>
          ) : null}

          {item.target_cents ? (
            <>
              <div className="mt-6 flex items-center justify-between text-sm text-[#7c8570]">
                <span>{euro(item.paid_cents + item.reported_cents, lang)}</span>
                <span>{euro(item.target_cents, lang)}</span>
              </div>

              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#e8ebe3]">
                <div
                  className="h-3 bg-[#5e6a50]"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </>
          ) : null}

          <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-[#5e6a50]">
                {t.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.placeholderName}
                required
                className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-3 text-[#5e6a50] outline-none focus:border-[#5e6a50]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#5e6a50]">
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.placeholderEmail}
                className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-3 text-[#5e6a50] outline-none focus:border-[#5e6a50]"
              />
            </div>

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
                        onClick={() => {
                          setAmountEuros(String(value));
                          scrollToForm();
                        }}
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
                      onClick={() => {
                        setAmountEuros(
                          ((remaining || 0) / 100).toFixed(2).replace(".", ",")
                        );
                        scrollToForm();
                      }}
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

              {remaining !== null ? (
                <p className="mt-2 text-xs text-[#7c8570]">
                  {t.remaining}: {euro(remaining, lang)}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#5e6a50]">
                {t.message}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.placeholderMessage}
                rows={4}
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
    </main>
  );
}