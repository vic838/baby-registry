"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  function go(lang: string) {
    router.push(`/${lang}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-4 sm:px-6">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
        {!showLanguageMenu ? (
          <>
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full">
                <div className="rounded-2xl bg-white p-4 shadow-lg">
                  <img
                    src="/landing-baby.webp"
                    alt="Cleo"
                    className="block w-full h-auto object-contain"
                  />
                </div>

                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowLanguageMenu(true)}
                    aria-label="Ga verder naar taalkeuze"
                    className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#cfd5c7] bg-white text-2xl text-[#5e6a50] shadow-sm transition hover:bg-neutral-100 active:scale-95"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>

            <div className="pb-3 text-center text-xs text-[#5e6a50]">
              Tik om verder te gaan
            </div>
          </>
        ) : (
          <>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowLanguageMenu(false)}
                className="text-sm text-[#5e6a50] transition hover:opacity-80"
              >
                ← Terug
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <div className="mb-6 rounded-2xl bg-white p-4 shadow-lg">
                <img
                  src="/landing-baby.webp"
                  alt="Cleo"
                  className="block w-full h-auto object-contain"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => go("nl")}
                  className="rounded-xl border border-[#8a9478] bg-white p-4 text-[#5e6a50] shadow-sm transition hover:bg-neutral-100"
                >
                  Nederlands
                </button>

                <button
                  type="button"
                  onClick={() => go("ca")}
                  className="rounded-xl border border-[#8a9478] bg-white p-4 text-[#5e6a50] shadow-sm transition hover:bg-neutral-100"
                >
                  Català
                </button>

                <button
                  type="button"
                  onClick={() => go("en")}
                  className="rounded-xl border border-[#8a9478] bg-white p-4 text-[#5e6a50] shadow-sm transition hover:bg-neutral-100"
                >
                  English
                </button>

                <button
                  type="button"
                  onClick={() => go("es")}
                  className="rounded-xl border border-[#8a9478] bg-white p-4 text-[#5e6a50] shadow-sm transition hover:bg-neutral-100"
                >
                  Español
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}