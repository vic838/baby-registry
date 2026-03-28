import { createClient } from "@supabase/supabase-js";

export async function requireAdminFromBearerToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false as const,
      status: 401,
      error: "Missing or invalid Authorization header",
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: "Missing access token",
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid or expired token",
    };
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return {
      ok: false as const,
      status: 500,
      error: adminError.message,
    };
  }

  if (!adminRow) {
    return {
      ok: false as const,
      status: 403,
      error: "Not an admin",
    };
  }

  return {
    ok: true as const,
    user,
    supabase,
  };
}