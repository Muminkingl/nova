"use server";

import { revalidatePath } from "next/cache";
import { getSettings, updateSettings } from "@/lib/supabase/settings";
import { getUserRole } from "@/lib/supabase/users";
import { logActivity } from "@/lib/supabase/activity";

export async function getSettingsAction() {
  try {
    const res = await getSettings();
    return { data: res.data, error: res.error ? String(res.error.message || res.error) : null };
  } catch (err: any) {
    return { data: null, error: err.message || "An unexpected error occurred." };
  }
}

export async function updateSettingsAction(data: {
  company_name: string;
  address: string | null;
  phone: string | null;
  currency: string;
}) {
  try {
    const role = await getUserRole();
    if (role !== "admin") {
      return { success: false, error: "Access denied. Admin role required." };
    }

    const res = await updateSettings(data);
    if (res.error) {
      return { success: false, error: String(res.error.message || res.error) };
    }

    // Log settings update activity
    await logActivity({
      action: "settings_updated",
      entity_type: "user", // Log settings change under admin/user domain
      entity_id: "1",
      entity_label: "Company Configuration Settings",
      details: { updated_fields: Object.keys(data) },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/invoices/[id]", "page");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update configuration settings." };
  }
}
