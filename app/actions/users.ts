"use server";

import { revalidatePath } from "next/cache";
import {
  getUsers,
  inviteUser,
  updateUserRole,
  setUserActive,
  getUserRole
} from "@/lib/supabase/users";
import { logActivity } from "@/lib/supabase/activity";

export async function getUsersAction() {
  try {
    const role = await getUserRole();
    if (role !== "admin") {
      return { data: null, error: "Access denied. Admin role required." };
    }
    const res = await getUsers();
    return { data: res.data, error: res.error ? String(res.error.message || res.error) : null };
  } catch (err: any) {
    return { data: null, error: err.message || "An unexpected error occurred." };
  }
}

export async function inviteUserAction(
  email: string,
  fullName: string,
  role: 'admin' | 'staff',
  password?: string
) {
  try {
    const currentRole = await getUserRole();
    if (currentRole !== "admin") {
      return { success: false, error: "Access denied. Admin role required." };
    }

    const res = await inviteUser(email, fullName, role, password);
    if (res.error) {
      return { success: false, error: String(res.error.message || res.error) };
    }

    // Log the user invitation or direct creation activity
    await logActivity({
      action: password ? "user_created" : "user_invited",
      entity_type: "user",
      entity_id: res.data.id,
      entity_label: `${fullName} (${email})`,
      details: { role, created_by_role: currentRole },
    });

    revalidatePath("/dashboard/users");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to register user." };
  }
}

export async function updateUserRoleAction(userId: string, role: 'admin' | 'staff', userLabel: string) {
  try {
    const currentRole = await getUserRole();
    if (currentRole !== "admin") {
      return { success: false, error: "Access denied. Admin role required." };
    }

    const res = await updateUserRole(userId, role);
    if (res.error) {
      return { success: false, error: String(res.error.message || res.error) };
    }

    // Log the role change activity
    await logActivity({
      action: "role_changed",
      entity_type: "user",
      entity_id: userId,
      entity_label: userLabel,
      details: { new_role: role },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to change user role." };
  }
}

export async function setUserActiveAction(userId: string, active: boolean, userLabel: string) {
  try {
    const currentRole = await getUserRole();
    if (currentRole !== "admin") {
      return { success: false, error: "Access denied. Admin role required." };
    }

    const res = await setUserActive(userId, active);
    if (res.error) {
      return { success: false, error: String(res.error.message || res.error) };
    }

    // Log user deactivation/activation
    await logActivity({
      action: active ? "user_activated" : "user_deactivated",
      entity_type: "user",
      entity_id: userId,
      entity_label: userLabel,
      details: { is_active: active },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to change account status." };
  }
}

export async function getUserRoleAction(): Promise<'admin' | 'staff'> {
  return await getUserRole();
}

