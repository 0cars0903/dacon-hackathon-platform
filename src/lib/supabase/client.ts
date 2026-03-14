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
      autoRefreshToken: false,
      detectSessionInUrl: false,
      // Navigator Lock + autoRefresh cause auth initialization to hang indefinitely,
      // blocking all Supabase queries. Disabled for MVP — AuthProvider handles session.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lock: (name: string, acquireTimeout: number, fn: () => Promise<any>) => fn(),
    },
  });
  return client;
}
