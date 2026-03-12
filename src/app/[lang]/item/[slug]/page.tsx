"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Item = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  details: string | null;
  image_url: string | null;
  external_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  is_open: boolean;
};

type TotalsRow = {
  item_id: string;
  paid_cents: number;
  reported_cents: number;
};

function euro(cents: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function centsFromEuroInput(v: string) {
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function makeReference(itemSlug: string) {
  const clean = itemSlug.replace(/[^a-z0-9]/gi, "").toUpperCase();
  const short = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `BABY-${clean}-${short}`;
}

export default function ItemPage() {
  const router = useRouter();
  const params = useParams<{ lang: string; slug: string }>();
  const lang = params.lang ?? "nl";
  const slug = params.slug;

  const [item, setItem] = useState<Item | null>(null);
  const [totals, setTotals] = useState<TotalsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [amountEuro, setAmountEuro] = useState("25");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select(
            "id,slug,title,description,details,image_url,external_url,already_owned,target_cents,is_open"
          )
          .eq("slug", slug)
          .eq("is_open", true)
          .single();

        if (itemError) throw itemError;
        if (!itemData) throw new Error("Item niet gevonden.");

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
        setLoadError(err instanceof Error ? err.message : "Onbekende fout");
        setItem(null);
        setTotals(null);
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
    const total = paid + reported;
    const target = item.target_cents ?? 0;

    const totalProgress = target > 0 ? clamp01(total / target) : 0;
    const paidProgress = target > 0 ? clamp01(paid / target) : 0;
    const pct = Math.round(totalProgress * 100);
    const reached = target > 0 && total >= target;
    const disabled = item.already_owned || reached;

    return {
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
  }, [item, totals]);

  const quickButtons = useMemo(() => ["10", "25", "50", "100"], []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !view || view.disabled) return;

    setSubmitError(null);

    const nm = name.trim();
    if (!nm) {
      setSubmitError("Naam is verplicht.");
      return;
    }

    const cents = centsFromEuroInput(amountEuro);
    if (!cents) {
      setSubmitError("Vul een geldig bedrag in (bv. 25).");
      return;
    }

    setSubmitting(true);

    try {
      const ref = makeReference(item.slug);

      const res = await fetch("/api/contributions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: item.id,
          name: nm,
          email: email.trim() || null,
          message: message.trim() || null,
          amount_cents: cents,
          reference: ref,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.id || !json?.access_token) {
        throw new Error(json?.error ?? "Kon bijdrage niet opslaan.");
      }

      router.push(`/${lang}/pay/${json.id}?t=${json.access_token}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Kon bijdrage niet opslaan."
      );
      setSubmitting(false);
    }
  }

  if (loading) return <main className="p-6">Laden…</main>;
  if (loadError)
    return <main className="p-6 text-red-600">Fout: {loadError}</main>;
  if (!item || !view) return <main className="p-6">Item niet gevonden.</main>;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          className="text-sm text-gray-600 hover:underline"
          onClick={() => router.push(`/${lang}/registry`)}
          type="button"
        >
          ← Terug naar lijst
        </button>

        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="mt-4 h-72 w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="mt-4 h-72 w-full rounded-2xl bg-gray-100" />
        )}

        <div className="mt-5 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold">{item.title}</h1>

          {item.already_owned ? (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              Al gekocht
            </span>
          ) : view.reached ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
              Volzet
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
              Beschikbaar
            </span>
          )}
        </div>

        {item.description ? (
          <p className="mt-3 text-gray-600">{item.description}</p>
        ) : null}

        <div className="mt-6 rounded-2xl border bg-white p-4">
          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="text-gray-600">
              <div>
                Totaal:{" "}
                <span className="font-medium text-gray-900">
                  {euro(view.total)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {euro(view.paid)} bevestigd
                {view.reported > 0 ? ` · ${euro(view.reported)} gemeld` : ""}
              </div>
            </div>

            <div className="text-right text-gray-600">
              <div>
                Doel:{" "}
                <span className="font-medium text-gray-900">
                  {view.target > 0 ? euro(view.target) : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-3 bg-gray-300"
              style={{ width: `${Math.round(view.totalProgress * 100)}%` }}
            />
            <div
              className="-mt-3 h-3 bg-gray-900"
              style={{ width: `${Math.round(view.paidProgress * 100)}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              {view.target > 0
                ? `${view.pct}% van het doelbedrag`
                : "Geen doelbedrag ingesteld"}
            </span>
            <span>donker = bevestigd</span>
          </div>
        </div>

        {item.details ? (
          <details className="mt-6 rounded-xl border bg-white p-4">
            <summary className="cursor-pointer font-medium">Meer info</summary>
            <div className="mt-3 whitespace-pre-line text-sm text-gray-600">
              {item.details}
            </div>
          </details>
        ) : null}

        {item.external_url ? (
          <div className="mt-4">
            <a
              href={item.external_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-gray-700 underline"
            >
              Bekijk origineel product
            </a>
          </div>
        ) : null}

        <div id="contribute" className="mt-10">
          <h2 className="text-lg font-semibold">Bijdragen</h2>

          {view.disabled ? (
            <div className="mt-4 rounded-2xl border bg-gray-50 p-5 text-sm text-gray-600">
              {item.already_owned
                ? "Dit item is al gekocht. Bijdragen zijn niet meer mogelijk."
                : "Dit item is volledig volzet. Bijdragen zijn niet meer mogelijk."}
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-4 space-y-4 rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div>
                <label className="text-sm font-medium">Naam *</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  E-mail (optioneel)
                </label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Bericht (optioneel)
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-3"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Bedrag (€) *</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-3"
                  value={amountEuro}
                  onChange={(e) => setAmountEuro(e.target.value)}
                  inputMode="decimal"
                  required
                />
                <div className="mt-2 flex gap-2">
                  {quickButtons.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="rounded-xl border px-3 py-2 text-sm"
                      onClick={() => setAmountEuro(v)}
                    >
                      €{v}
                    </button>
                  ))}
                </div>
              </div>

              {submitError ? (
                <p className="text-sm text-red-600">{submitError}</p>
              ) : null}

              <button
                disabled={submitting}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-white disabled:opacity-60"
                type="submit"
              >
                {submitting ? "Opslaan…" : "Bevestig bijdrage"}
              </button>

              <p className="text-xs text-gray-500">
                Na bevestigen tonen we betaalinstructies met een unieke
                referentie.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}