"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ lang: string }>();
  const lang = params.lang ?? "nl";

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const isLoginPage = pathname === `/${lang}/admin/login`;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (!isLoginPage) {
            router.replace(`/${lang}/admin/login`);
          }
          return;
        }

        const { data: isAdmin, error } = await supabase.rpc("is_admin");

        if (error || !isAdmin) {
          await supabase.auth.signOut();

          if (!isLoginPage) {
            router.replace(`/${lang}/admin/login`);
          }
          return;
        }

        if (isLoginPage) {
          router.replace(`/${lang}/admin`);
          return;
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [lang, pathname, router]);

  if (checking) {
    return <main className="p-6">Toegang controleren…</main>;
  }

  return <>{children}</>;
}