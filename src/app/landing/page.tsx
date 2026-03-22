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
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {!showLanguageMenu ? (
          <section className="relative min-h-screen overflow-hidden">
            <img
              src="/landing-baby.webp"
              alt="Cleo"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />

            <div className="relative flex min-h-screen flex-col justify-end px-4 pb-8 sm:px-6">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowLanguageMenu(true)}
                  aria-label="Ga verder naar taalkeuze"
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/90 text-3xl text-[#5e6a50] shadow-lg backdrop-blur transition hover:bg-white active:scale-95"
                >
                  ↓
                </button>
              </div>

              <div className="mt-4 text-center text-xs tracking-wide text-white/95">
                Continue
              </div>
            </div>
          </section>
        ) : (
          <main className="min-h-screen bg-neutral-50 px-4 py-4 sm:px-6">
            <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowLanguageMenu(false)}
                  className="text-sm text-[#5e6a50] transition hover:opacity-80"
                >
                  ← Back
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
            </div>
          </main>
        )}
      </div>
    </main>
  );
}