import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

let instance: SupabaseClient<any> | null = null;

// Service-role client for server-only reads. RLS is bypassed on purpose here;
// ownership is enforced at the API layer via validated portal session tokens.
export function createServiceClient(): SupabaseClient<any> {
  if (instance) return instance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }

  instance = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return instance;
}
