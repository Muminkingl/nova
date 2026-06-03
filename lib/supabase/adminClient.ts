import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SERVICE_ROLE_KEY || "";

// Supabase Admin client to perform user management operations (e.g. invites)
// CRITICAL: This file must ONLY be executed on the server.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
