import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("[Supabase] Missing env vars:", { hasUrl: !!url, hasKey: !!key });
  }
  return { url: url!, key: key! };
}

// ─── Auth Client (for login/signup/session — has persistSession) ────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authClient: SupabaseClient<any, "public", any> | null = null;

/**
 * Auth client — used ONLY by AuthProvider for login, signup, getSession, onAuthStateChange.
 * Has `persistSession: true` so tokens survive page reloads.
 * WARNING: .from() queries on this client WILL hang until auth init completes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): SupabaseClient<any, "public", any> {
  if (authClient) return authClient;
  const { url, key } = getEnv();

  authClient = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      storageKey: "codearena-auth-token",
      autoRefreshToken: false,
      detectSessionInUrl: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lock: (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
    },
  });
  return authClient;
}

// ─── Data Client (for reads/writes — NO auth init blocking) ─────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dataClient: SupabaseClient<any, "public", any> | null = null;

/**
 * Data client — used for all .from() queries (SELECT, INSERT, UPDATE).
 * Has `persistSession: false` so it initializes INSTANTLY without waiting
 * for auth session recovery. RLS policies with `SELECT: true` work with anon key.
 * For authenticated writes (INSERT), we set the auth header manually.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDataClient(): SupabaseClient<any, "public", any> {
  if (dataClient) return dataClient;
  const { url, key } = getEnv();

  dataClient = createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return dataClient;
}

/**
 * Set the auth session on the data client so INSERT/UPDATE operations
 * pass RLS policies that require auth.uid(). Called after successful login.
 */
export async function syncAuthToDataClient(): Promise<void> {
  try {
    const { data: { session } } = await createClient().auth.getSession();
    if (session) {
      await createDataClient().auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  } catch {
    // Ignore — data client will work for reads without auth
  }
}
