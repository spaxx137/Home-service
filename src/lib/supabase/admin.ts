import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

/**
 * Service-role client. Bypasses Row Level Security — only use from trusted
 * server code (API routes, webhooks), never expose to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
