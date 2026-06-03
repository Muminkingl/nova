"use server";

import { getActivityLogs, ActivityLogFilters } from "@/lib/supabase/activity";
import { getUserRole } from "@/lib/supabase/users";

export async function getActivityLogsAction(filters?: ActivityLogFilters) {
  try {
    const role = await getUserRole();
    if (role !== "admin") {
      return { data: null, error: "Access denied. Admin role required." };
    }
    const res = await getActivityLogs(filters);
    return { data: res.data, error: res.error ? String(res.error.message || res.error) : null };
  } catch (err: any) {
    return { data: null, error: err.message || "An unexpected error occurred." };
  }
}
