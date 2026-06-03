"use server";

import { revalidatePath } from "next/cache";
import { getDamages, createDamage } from "@/lib/supabase/damages";
import { DamageFormData } from "@/types";

export async function getDamagesAction(filters?: {
  reason?: string;
  from?: string;
  to?: string;
}) {
  try {
    const res = await getDamages(filters);
    return { data: res.data, error: res.error ? String(res.error.message || res.error) : null };
  } catch (err: any) {
    return { data: null, error: err.message || "An unexpected error occurred." };
  }
}

export async function createDamageAction(data: DamageFormData) {
  try {
    const res = await createDamage(data);
    
    if (res.error) {
      return { success: false, error: String(res.error.message || res.error) };
    }
    
    // Revalidate paths affected by stock changes or financial changes
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/damages");
    revalidatePath("/dashboard/stock");
    revalidatePath("/dashboard/items");
    revalidatePath("/dashboard/reports/overview");
    revalidatePath("/dashboard/reports/expiry");
    revalidatePath("/dashboard/reports/profits");
    
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to record write-off." };
  }
}
