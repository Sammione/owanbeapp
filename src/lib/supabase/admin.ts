import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses row level security, so only use it on the
 * server for trusted work such as creating bookings and confirming payments.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
