import { cookies } from "next/headers";
import { supabaseAdmin as supabase, supabaseAdmin } from "./adminClient";
import { UserProfile } from "@/types";
import { verifyValue } from "@/lib/security";

export type UserDirectoryEntry = UserProfile & {
  email: string;
};

/**
 * Get profile for a specific user ID.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }
  return data as UserProfile;
}

/**
 * Resolve user role from active session cookies.
 * Supports hardcoded admin as root.
 */
export async function getUserRole(): Promise<'admin' | 'staff'> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  const sessionRole = await verifyValue(sessionCookie);
  if (sessionRole === "admin") return "admin";
  if (sessionRole === "staff") return "staff";

  const userIdCookie = cookieStore.get("session_user_id")?.value;
  const sessionUserId = await verifyValue(userIdCookie);
  if (sessionUserId) {
    const profile = await getUserProfile(sessionUserId);
    if (profile && profile.is_active) {
      return profile.role;
    }
  }

  return "staff";
}

/**
 * Retrieve the full list of users and their profile attributes.
 * Combines user_profiles with auth.users data.
 */
export async function getUsers(): Promise<{ data: UserDirectoryEntry[] | null; error: any }> {
  // 1. Fetch user profiles
  const { data: profiles, error: pError } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (pError || !profiles) {
    return { data: null, error: pError };
  }

  // 2. Fetch auth users using admin client to get emails
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError || !users) {
    return { data: null, error: authError || new Error("Failed to list auth users") };
  }

  // Map email addresses
  const userMap = new Map<string, string>();
  users.forEach((u) => {
    if (u.email) userMap.set(u.id, u.email);
  });

  const directory: UserDirectoryEntry[] = profiles.map((p) => ({
    ...p,
    email: userMap.get(p.id) || "No email logged",
  }));

  return { data: directory, error: null };
}

/**
 * Invite a new user by email.
 * Triggers auth invitation and creates the profile.
 */
export async function inviteUser(
  email: string,
  fullName: string,
  role: 'admin' | 'staff',
  password?: string
): Promise<{ data: any; error: any }> {
  let newUserId: string;

  if (password) {
    // 1. Directly create the confirmed user with password
    const { data: createRes, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (createError || !createRes.user) {
      return { data: null, error: createError || new Error("Failed to create user account.") };
    }

    newUserId = createRes.user.id;
  } else {
    // 1. Trigger invitation email via Supabase admin Auth (fallback)
    const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { data: inviteRes, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${host}/login` }
    );

    if (inviteError || !inviteRes || !inviteRes.user) {
      return { data: null, error: inviteError || new Error("Failed to create invitation link") };
    }

    newUserId = inviteRes.user.id;
  }

  // 2. Insert new profile record in user_profiles
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .insert([
      {
        id: newUserId,
        full_name: fullName,
        role: role,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (profileError) {
    // Cleanup auth record if profile fails
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return { data: null, error: profileError };
  }

  return { data: profile, error: null };
}

/**
 * Update role for a user account.
 */
export async function updateUserRole(
  userId: string,
  role: 'admin' | 'staff'
): Promise<{ error: any }> {
  const { error } = await supabase
    .from("user_profiles")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return { error };
}

/**
 * Activate or Deactivate user accounts.
 */
export async function setUserActive(
  userId: string,
  active: boolean
): Promise<{ error: any }> {
  const { error } = await supabase
    .from("user_profiles")
    .update({
      is_active: active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return { error };
}
