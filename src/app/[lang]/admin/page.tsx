"use client";

import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang ?? "nl";

  async function logout() {
    await supabase.auth.signOut();
    router.push(`/${lang}/admin/login`);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Admin</h1>

          <button
            type="button"
            className="rounded-xl border px-4 py-2 text-sm"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            className="rounded-2xl border bg-white px-4 py-4 text-left shadow-sm hover:shadow-md"
            onClick={() => router.push(`/${lang}/admin/contributions`)}
          >
            <div className="font-medium">Contributions beheren</div>
            <div className="mt-1 text-sm text-gray-600">
              Bekijk bijdragen, filter op status en pas statussen aan.
            </div>
          </button>

          <button
            type="button"
            className="rounded-2xl border bg-white px-4 py-4 text-left shadow-sm hover:shadow-md"
            onClick={() => router.push(`/${lang}/admin/mark-paid`)}
          >
            <div className="font-medium">Mark paid</div>
            <div className="mt-1 text-sm text-gray-600">
              Snel een bijdrage als betaald markeren.
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}