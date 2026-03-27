"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Checkout = {
  id: string;
  name: string;
  email: string;
  total_cents: number;
  reference: string;
  status: string;
  created_at: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang ?? "nl";

  const [rows, setRows] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRows() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/get-reported", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load reported payments");
      }

      setRows(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function markPaid(checkoutId: string) {
    try {
      setBusyId(checkoutId);
      setError(null);

      const res = await fetch("/api/admin/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checkoutId }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to mark payment as paid");
      }

      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push(`/${lang}/admin/login`);
  }

  useEffect(() => {
    loadRows();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Reported payments
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Confirm manually received payments and mark them as paid.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
          >
            Logout
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            No reported payments found.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-medium text-neutral-900">
                      {row.name}
                    </div>

                    <div className="text-sm text-neutral-600">
                      {row.email}
                    </div>

                    <div className="text-sm text-neutral-600">
                      Reference: {row.reference}
                    </div>

                    <div className="text-sm text-neutral-600">
                      Amount: €{(row.total_cents / 100).toFixed(2)}
                    </div>

                    <div className="text-sm text-neutral-500">
                      Created: {new Date(row.created_at).toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => markPaid(row.id)}
                    disabled={busyId === row.id || row.status === "PAID"}
                    className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyId === row.id
                      ? "Updating..."
                      : row.status === "PAID"
                      ? "Paid"
                      : "Mark as paid"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}