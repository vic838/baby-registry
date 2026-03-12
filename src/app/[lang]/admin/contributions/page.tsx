"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ContributionStatus =
  | "PENDING"
  | "REPORTED"
  | "PAID"
  | "CANCELLED"
  | "FAILED";

type ContributionRow = {
  id: string;
  item_id: string;
  name: string;
  email: string | null;
  message: string | null;
  amount_cents: number;
  reference: string;
  status: ContributionStatus;
  created_at: string;
  paid_at: string | null;
};

type ItemRow = {
  id: string;
  title: string;
};

type ParsedStatementLine = {
  raw: string;
  normalized: string;
  reference: string | null;
  amount_cents: number | null;
};

function euro(cents: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/\s/g, "");

  if (!cleaned) return null;

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;

  return Math.round(n * 100);
}

function parseStatementLine(line: string): ParsedStatementLine {
  const normalized = line.trim().toUpperCase();

  const referenceMatch = normalized.match(/BABY-[A-Z0-9-]+/);
  const amountMatch = normalized.match(/-?\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|-?\d+(?:,\d{2})|-?\d+(?:\.\d{2})/);

  return {
    raw: line,
    normalized,
    reference: referenceMatch?.[0] ?? null,
    amount_cents: amountMatch ? parseAmountToCents(amountMatch[0]) : null,
  };
}

export default function AdminContributionsPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang ?? "nl";

  const [rows, setRows] = useState<ContributionRow[]>([]);
  const [itemMap, setItemMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | ContributionStatus
  >("ALL");
  const [searchRef, setSearchRef] = useState("");
  const [statementInput, setStatementInput] = useState("");

  async function logout() {
    await supabase.auth.signOut();
    router.push(`/${lang}/admin/login`);
  }

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [
        { data: contributionsData, error: e1 },
        { data: itemsData, error: e2 },
      ] = await Promise.all([
        supabase
          .from("contributions")
          .select(
            "id,item_id,name,email,message,amount_cents,reference,status,created_at,paid_at"
          )
          .order("created_at", { ascending: false }),
        supabase.from("items").select("id,title"),
      ]);

      if (e1) throw e1;
      if (e2) throw e2;

      const contributions = (contributionsData ?? []) as ContributionRow[];
      const items = (itemsData ?? []) as ItemRow[];

      const map: Record<string, string> = {};
      items.forEach((item) => {
        map[item.id] = item.title;
      });

      setRows(contributions);
      setItemMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function updateStatus(id: string, nextStatus: ContributionStatus) {
    try {
      setBusyId(id);

      const { error } = await supabase
        .from("contributions")
        .update({ status: nextStatus })
        .eq("id", id);

      if (error) throw error;

      await loadData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Kon status niet aanpassen."
      );
    } finally {
      setBusyId(null);
    }
  }

  const parsedLines = useMemo(() => {
    return statementInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseStatementLine);
  }, [statementInput]);

  const statementSuggestions = useMemo(() => {
    return parsedLines.map((line) => {
      const exactReferenceMatch = line.reference
        ? rows.find(
            (row) => row.reference.toUpperCase() === line.reference
          ) ?? null
        : null;

      const fallbackAmountMatch =
        !exactReferenceMatch && line.amount_cents !== null
          ? rows.find(
              (row) =>
                row.amount_cents === line.amount_cents &&
                row.status !== "PAID"
            ) ?? null
          : null;

      const match = exactReferenceMatch ?? fallbackAmountMatch;

      return {
        ...line,
        match,
        itemTitle: match ? itemMap[match.item_id] ?? "—" : null,
        amountMatches: match
          ? line.amount_cents === null || line.amount_cents === match.amount_cents
          : false,
        matchedBy: exactReferenceMatch
          ? "reference"
          : fallbackAmountMatch
          ? "amount"
          : null,
      };
    });
  }, [parsedLines, rows, itemMap]);

  const statementMatchedIds = useMemo(() => {
    return new Set(
      statementSuggestions
        .filter((entry) => entry.match)
        .map((entry) => entry.match!.id)
    );
  }, [statementSuggestions]);

  const highlightedReference = useMemo(() => {
    if (searchRef.trim()) return searchRef.trim().toUpperCase();

    const firstReferenceMatch = statementSuggestions.find(
      (entry) => entry.reference && entry.match
    );

    return firstReferenceMatch?.reference ?? "";
  }, [searchRef, statementSuggestions]);

  const filteredRows = useMemo(() => {
    let list = rows;

    if (statusFilter !== "ALL") {
      list = list.filter((row) => row.status === statusFilter);
    }

    if (searchRef.trim()) {
      const needle = searchRef.trim().toUpperCase();
      list = list.filter((row) =>
        row.reference.toUpperCase().includes(needle)
      );
    }

    return list;
  }, [rows, statusFilter, searchRef]);

  if (loading) {
    return <main className="p-6">Laden…</main>;
  }

  if (error) {
    return <main className="p-6 text-red-600">Fout: {error}</main>;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Admin · Contributions</h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm"
              onClick={() => router.push(`/${lang}/admin`)}
            >
              Admin home
            </button>

            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["ALL", "PENDING", "REPORTED", "PAID", "CANCELLED", "FAILED"].map(
            (value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setStatusFilter(value as "ALL" | ContributionStatus)
                }
                className={[
                  "rounded-full border px-3 py-2 text-sm",
                  statusFilter === value
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-700",
                ].join(" ")}
              >
                {value}
              </button>
            )
          )}
        </div>

        <div className="mt-4">
          <input
            type="text"
            placeholder="Zoek referentie (bv. BABY-...)"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value.toUpperCase())}
            className="w-full rounded-xl border px-3 py-3 text-sm"
          />
        </div>

        <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-900">
            Bank statement matcher
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Plak hier één of meerdere lijnen uit een bankuittreksel. We zoeken
            eerst op referentie en anders op bedrag.
          </div>

          <textarea
            className="mt-3 min-h-[140px] w-full rounded-xl border px-3 py-3 text-sm"
            placeholder={`50,00 BABY-LUIERBUDGET-335207AE\n25,00 BABY-KINDERWAGEN-4AD3172D`}
            value={statementInput}
            onChange={(e) => setStatementInput(e.target.value)}
          />

          {statementSuggestions.length > 0 ? (
            <div className="mt-4 space-y-3">
              {statementSuggestions.map((entry, idx) => (
                <div
                  key={`${entry.raw}-${idx}`}
                  className="rounded-xl border bg-gray-50 p-3 text-sm"
                >
                  <div className="font-medium text-gray-900">{entry.raw}</div>

                  <div className="mt-2 text-xs text-gray-600">
                    Referentie: {entry.reference ?? "—"} · Bedrag:{" "}
                    {entry.amount_cents !== null
                      ? euro(entry.amount_cents)
                      : "—"}
                  </div>

                  {entry.match ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Match via{" "}
                        {entry.matchedBy === "reference"
                          ? "referentie"
                          : "bedrag"}
                      </span>

                      <span className="text-xs text-gray-700">
                        {entry.match.name} · {entry.itemTitle} ·{" "}
                        {euro(entry.match.amount_cents)} · {entry.match.reference}
                      </span>

                      {entry.amount_cents !== null &&
                      entry.match.amount_cents !== entry.amount_cents ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          Bedrag wijkt af
                        </span>
                      ) : null}

                      {entry.match.status !== "PAID" ? (
                        <button
                          type="button"
                          disabled={busyId === entry.match.id}
                          onClick={() => updateStatus(entry.match!.id, "PAID")}
                          className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                        >
                          Zet op PAID
                        </button>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          Reeds PAID
                        </span>
                      )}

                      {entry.reference ? (
                        <button
                          type="button"
                          className="rounded-lg border px-3 py-2 text-xs"
                          onClick={() => setSearchRef(entry.reference ?? "")}
                        >
                          Toon in tabel
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      Geen match gevonden
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Datum
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Naam
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Item
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Bedrag
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Referentie
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Betaald op
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Acties
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRows.map((row) => {
                const exactHighlight =
                  highlightedReference &&
                  row.reference.toUpperCase() === highlightedReference;

                const statementHighlight = statementMatchedIds.has(row.id);

                return (
                  <tr
                    key={row.id}
                    className={[
                      "align-top",
                      exactHighlight
                        ? "bg-yellow-50"
                        : statementHighlight
                        ? "bg-green-50"
                        : "",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(row.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{row.name}</div>
                      {row.email ? (
                        <div className="text-xs text-gray-500">{row.email}</div>
                      ) : null}
                      {row.message ? (
                        <div className="mt-1 text-xs text-gray-500">
                          {row.message}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {itemMap[row.item_id] ?? "—"}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {euro(row.amount_cents)}
                    </td>

                    <td className="px-4 py-3">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {row.reference}
                      </code>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {row.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(row.paid_at)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.status !== "PAID" ? (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => updateStatus(row.id, "PAID")}
                            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                          >
                            Zet op PAID
                          </button>
                        ) : null}

                        {row.status !== "REPORTED" ? (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => updateStatus(row.id, "REPORTED")}
                            className="rounded-lg border px-3 py-2 text-xs disabled:opacity-60"
                          >
                            Zet op REPORTED
                          </button>
                        ) : null}

                        {row.status !== "PENDING" ? (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => updateStatus(row.id, "PENDING")}
                            className="rounded-lg border px-3 py-2 text-xs disabled:opacity-60"
                          >
                            Zet op PENDING
                          </button>
                        ) : null}

                        {row.status !== "CANCELLED" ? (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => updateStatus(row.id, "CANCELLED")}
                            className="rounded-lg border px-3 py-2 text-xs text-red-600 disabled:opacity-60"
                          >
                            Annuleer
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Geen bijdragen gevonden voor deze filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}