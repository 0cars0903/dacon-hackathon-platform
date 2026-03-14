import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, "public", any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): SupabaseClient<any, "public", any> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "[Supabase] Missing env vars:",
      { hasUrl: !!url, hasKey: !!key }
    );
  }

  client = createSupabaseClient(url!, key!, {
    auth: {
      persistSession: true,
      storageKey: "dacon-auth-token",
      flowType: "pkce",
      detectSessionInUrl: true,
      // Navigator Lock API gets stuck in production, blocking all Supabase queries.
      // Bypass with a no-op lock since this is a single-tab MVP app.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lock: (name: string, acquireTimeout: number, fn: () => Promise<any>) => fn(),
    },
  });
  return client;
}
