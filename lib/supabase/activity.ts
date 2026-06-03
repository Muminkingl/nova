import { supabaseAdmin as supabase } from "./adminClient";
import { cookies } from "next/headers";
import { getUserProfile } from "./users";
import { ActivityLog } from "@/types";
import { verifyValue } from "@/lib/security";

export type ActivityLogFilters = {
  userName?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
};

/**
 * Record a user action in the database audit log.
 * Resolves user profile name from session cookies.
 */
export async function logActivity(params: {
  action: string;
  entity_type: 'invoice' | 'purchase' | 'item' | 'customer' | 'supplier' | 'damage' | 'payment' | 'user';
  entity_id: string | null;
  entity_label: string | null;
  details?: Record<string, any> | null;
}): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const userIdCookie = cookieStore.get("session_user_id")?.value;

    const sessionRole = await verifyValue(sessionCookie);
    const sessionUserId = await verifyValue(userIdCookie);

    let userId: string | null = null;
    let userName = "system";

    if (sessionRole === "admin" && !sessionUserId) {
      userName = "admin";
    } else if (sessionUserId) {
      userId = sessionUserId;
      const profile = await getUserProfile(sessionUserId);
      if (profile) {
        userName = profile.full_name;
      } else {
        userName = "User (" + sessionUserId.substring(0, 4) + ")";
      }
    }

    const { error } = await supabase.from("activity_log").insert([
      {
        user_id: userId,
        user_name: userName,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        entity_label: params.entity_label,
        details: params.details || null,
      },
    ]);

    if (error) {
      console.warn("Failed to insert activity log record:", error);
    }
  } catch (err) {
    console.error("Activity logging error:", err);
  }
}

/**
 * Query recent activity logs with optional filters, capped at 500 entries.
 */
export async function getActivityLogs(
  filters?: ActivityLogFilters
): Promise<{ data: ActivityLog[] | null; error: any }> {
  let query = supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters?.userName && filters.userName !== "all") {
    query = query.eq("user_name", filters.userName);
  }
  if (filters?.action && filters.action !== "all") {
    query = query.eq("action", filters.action);
  }
  if (filters?.entityType && filters.entityType !== "all") {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters?.from) {
    query = query.gte("created_at", `${filters.from}T00:00:00Z`);
  }
  if (filters?.to) {
    query = query.lte("created_at", `${filters.to}T23:59:59Z`);
  }

  const { data, error } = await query;
  return { data: data as ActivityLog[] | null, error };
}
