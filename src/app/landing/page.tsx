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
    <main className="min-h-screen overflow-hidden bg-neutral-50">
      <div className="relative mx-auto min-h-screen w-full max-w-6xl">
        {/* HERO IMAGE LAYER */}
        <div
          className={[
            "absolute inset-0 z-10 transition-transform duration-700 ease-in-out",
            showLanguageMenu ? "-translate-y-[58vh]" : "translate-y-0",
          ].join(" ")}
        >
          <section className="flex min-h-screen flex-col items-center bg-neutral-50 px-4 pt-4 pb-8 sm:px-6 md:pt-6 md:pb-10">
            <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
              <img
                src="/landing-baby.webp"
                alt="Cleo"
                className="max-h-full w-full object-contain"
              />
            </div>

            <div className="mt-4 flex flex-col items-center gap-3 md:mt-6">
              <button
                type="button"
                onClick={() => setShowLanguageMenu(true)}
                aria-label="Ga verder naar taalkeuze"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#cfd5c7] bg-white/95 text-3xl text-[#5e6a50] shadow-lg backdrop-blur transition hover:bg-white active:scale-95 md:h-16 md:w-16"
              >
                ↓
              </button>

              <div className="text-xs tracking-wide text-[#5e6a50]">Continue</div>
            </div>
          </section>
        </div>

        {/* LANGUAGE MENU LAYER */}
        <div
          className={[
            "relative z-0 flex min-h-screen flex-col justify-end px-4 pb-8 pt-24 sm:px-6",
            "transition-opacity duration-500",
            showLanguageMenu ? "opacity-100" : "pointer-events-none opacity-0",
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