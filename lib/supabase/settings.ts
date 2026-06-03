import { supabaseAdmin } from "./adminClient";
import { Settings } from "@/types";

/**
 * Get company settings (always row ID = 1).
 * Auto-creates default configuration if none exist (self-healing database).
 */
export async function getSettings(): Promise<{ data: Settings | null; error: any }> {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    // If table exists but row is missing, insert defaults
    if (error.code === "PGRST116" || error.message.includes("0 rows")) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("settings")
        .insert([
          {
            id: 1,
            company_name: "Nova Portal",
            address: "Erbil, Kurdistan Region, Iraq",
            phone: "0750-000-0000",
            currency: "IQD",
          },
        ])
        .select()
        .single();
      return { data: inserted as Settings | null, error: insertError };
    }
    return { data: null, error };
  }

  return { data: data as Settings | null, error: null };
}

/**
 * Update company settings row.
 */
export async function updateSettings(data: {
  company_name: string;
  address: string | null;
  phone: string | null;
  currency: string;
}): Promise<{ data: Settings | null; error: any }> {
  const { data: updated, error } = await supabaseAdmin
    .from("settings")
    .update({
      company_name: data.company_name,
      address: data.address || null,
      phone: data.phone || null,
      currency: data.currency || "IQD",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select()
    .single();

  return { data: updated as Settings | null, error };
}

