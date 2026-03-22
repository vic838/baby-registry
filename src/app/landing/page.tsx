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
    <main className="min-h-screen bg-neutral-50 overflow-hidden">
      <div className="relative mx-auto min-h-screen w-full max-w-md">
        {/* HERO IMAGE LAYER */}
        <div
          className={[
            "absolute inset-0 z-10 transition-transform duration-700 ease-in-out",
            showLanguageMenu ? "-translate-y-[58vh]" : "translate-y-0",
          ].join(" ")}
        >
          <section className="relative h-screen overflow-hidden">
            <img
              src="/landing-baby.webp"
              alt="Cleo"
              className="absolute inset-0 h-full w-full object-contain bg-neutral-50"
            />

            <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLanguageMenu(true)}
                aria-label="Ga verder naar taalkeuze"
                className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#cfd5c7] bg-white/95 text-3xl text-[#5e6a50] shadow-lg backdrop-blur transition hover:bg-white active:scale-95"
              >
                ↓
              </button>

              <div className="text-xs tracking-wide text-[#5e6a50]">
                Continue
              </div>
            </div>
          </section>
        </div>

        {/* LANGUAGE MENU LAYER */}
        <div
          className={[
            "relative z-0 flex min-h-screen flex-col justify-end px-4 pb-8 pt-24 sm:px-6",
            "transition-opacity duration-500",
            showLanguageMenu ? "opacity-100" : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowLanguageMenu(false)}
              className="text-sm text-[#5e6a50] transition hover:opacity-80"
            >
              ← Back
            </button>
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
  );
}