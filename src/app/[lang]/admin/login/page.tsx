"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang ?? "nl";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const user = signInData.user;

      if (!user) {
        await supabase.auth.signOut();
        setError("Geen geldige gebruiker gevonden na login.");
        setLoading(false);
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        await supabase.auth.signOut();
        setError(`Admin-check mislukt: ${adminError.message}`);
        setLoading(false);
        return;
      }

      if (!adminRow) {
        await supabase.auth.signOut();
        setError("Deze gebruiker heeft geen admin-toegang.");
        setLoading(false);
        return;
      }

      router.push(`/${lang}/admin/dashboard`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onverwachte fout");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={login}
        className="w-full max-w-sm rounded-2xl border p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Admin login</h1>

        <div className="mt-4">
          <label className="text-sm">Email</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mt-3">
          <label className="text-sm">Password</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

        <button
          className="mt-5 w-full rounded-xl bg-gray-900 px-4 py-3 text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Inloggen…" : "Login"}
        </button>
      </form>
    </main>
  );
}