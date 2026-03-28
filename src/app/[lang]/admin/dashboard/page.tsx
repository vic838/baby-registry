"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type DashboardStats = {
  total_received_cents: number;
  total_open_cents: number;
  checkout_paid_count: number;
  checkout_open_count: number;
  contribution_paid_count: number;
  contribution_open_count: number;
  total_paid_count: number;
  total_open_count: number;
};

type CheckoutItem = {
  line_id: string;
  item_id: string | null;
  title: string;
  quantity: number;
  amount_cents: number;
  line_type: string | null;
  slug: string | null;
};

type CheckoutRow = {
  kind: "checkout";
  id: string;
  name: string;
  email: string;
  amount_cents: number;
  reference: string;
  status: string;
  created_at: string;
  payment_provider: string;
  items: CheckoutItem[];
};

type ContributionRow = {
  kind: "contribution";
  id: string;
  name: string;
  email: string;
  amount_cents: number;
  reference: string;
  status: string;
  created_at: string;
  payment_provider: string | null;
  paid_at?: string | null;
  item: {
    item_id: string;
    slug: string | null;
  } | null;
};

type AdminRow = CheckoutRow | ContributionRow;

type DashboardResponse = {
  stats: DashboardStats;
  rows: AdminRow[];
};

function euro(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang ?? "nl";

  const [rows, setRows] = useState<AdminRow[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<
    "all" | "checkout" | "contribution"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "PAID" | "open"
  >("all");

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("No active admin session found");
      }

      const res = await fetch("/api/admin/dashboard-data", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const json = (await res.json()) as DashboardResponse & { error?: string };

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load dashboard data");
      }

      setRows(json.rows ?? []);
      setStats(json.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    kind: "checkout" | "contribution",
    id: string,
    targetStatus: "PAID" | "REPORTED"
  ) {
    const key = `${kind}-${id}-${targetStatus}`;

    try {
      setBusyKey(key);
      setError(null);

      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("No active admin session found");
      }

      const res = await fetch("/api/admin/update-payment-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          kind,
          id,
          targetStatus,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to update payment status");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusyKey(null);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push(`/${lang}/admin/login`);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.kind !== typeFilter) {
        return false;
      }

      if (statusFilter === "PAID" && row.status !== "PAID") {
        return false;
      }

      if (statusFilter === "open" && row.status === "PAID") {
        return false;
      }

      return true;
    });
  }, [rows, typeFilter, statusFilter]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Admin dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Checkouts en contributions beheren, betalingen bevestigen en
              corrigeren.
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

        {stats ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Total received</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900">
                {euro(stats.total_received_cents)}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Open / not paid</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900">
                {euro(stats.total_open_cents)}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Paid records</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900">
                {stats.total_paid_count}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Open records</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-900">
                {stats.total_open_count}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-neutral-500">Checkout payments</div>
            <div className="mt-2 text-sm text-neutral-700">
              Paid: {stats?.checkout_paid_count ?? 0} · Open:{" "}
              {stats?.checkout_open_count ?? 0}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-neutral-500">Contributions</div>
            <div className="mt-2 text-sm text-neutral-700">
              Paid: {stats?.contribution_paid_count ?? 0} · Open:{" "}
              {stats?.contribution_open_count ?? 0}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row">
          <div>
            <label className="mb-1 block text-sm text-neutral-700">Type</label>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value as "all" | "checkout" | "contribution"
                )
              }
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="checkout">Checkouts</option>
              <option value="contribution">Contributions</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "PAID" | "open")
              }
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="PAID">Paid</option>
              <option value="open">Open / not paid</option>
            </select>
          </div>
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
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            Geen resultaten gevonden.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRows.map((row) => {
              const paidKey = `${row.kind}-${row.id}-PAID`;
              const unpaidKey = `${row.kind}-${row.id}-REPORTED`;
              const isPaid = row.status === "PAID";

              return (
                <div
                  key={`${row.kind}-${row.id}`}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                          {row.kind === "checkout"
                            ? "Checkout"
                            : "Contribution"}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isPaid
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>

                      <div className="text-base font-medium text-neutral-900">
                        {row.name}
                      </div>

                      <div className="text-sm text-neutral-600">
                        {row.email}
                      </div>

                      <div className="text-sm text-neutral-600">
                        Amount: {euro(row.amount_cents)}
                      </div>

                      <div className="text-sm text-neutral-600">
                        Reference: {row.reference}
                      </div>

                      <div className="text-sm text-neutral-500">
                        Created: {formatDate(row.created_at)}
                      </div>

                      <div className="text-sm text-neutral-500">
                        Provider:{" "}
                        {row.kind === "checkout"
                          ? "checkout"
                          : row.payment_provider || "unknown"}
                      </div>

                      {row.kind === "checkout" ? (
                        <div className="pt-2">
                          <div className="text-sm font-medium text-neutral-800">
                            Items purchased
                          </div>

                          <div className="mt-2 space-y-2">
                            {row.items.length === 0 ? (
                              <div className="text-sm text-neutral-500">
                                No lines found.
                              </div>
                            ) : (
                              row.items.map((item) => (
                                <div
                                  key={item.line_id}
                                  className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
                                >
                                  <div>
                                    {item.title}
                                    {item.quantity > 1
                                      ? ` × ${item.quantity}`
                                      : ""}
                                  </div>

                                  <div className="text-neutral-500">
                                    {euro(item.amount_cents)}
                                    {item.slug ? ` · slug: ${item.slug}` : ""}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <div className="text-sm font-medium text-neutral-800">
                            Linked item
                          </div>

                          <div className="mt-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                            {row.item
                              ? row.item.slug
                                ? `slug: ${row.item.slug}`
                                : `item_id: ${row.item.item_id}`
                              : "No linked item"}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:min-w-[180px]">
                      <button
                        type="button"
                        onClick={() => updateStatus(row.kind, row.id, "PAID")}
                        disabled={busyKey === paidKey || isPaid}
                        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyKey === paidKey ? "Updating..." : "Mark as paid"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(row.kind, row.id, "REPORTED")
                        }
                        disabled={busyKey === unpaidKey || !isPaid}
                        className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyKey === unpaidKey
                          ? "Updating..."
                          : "Mark as unpaid"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}