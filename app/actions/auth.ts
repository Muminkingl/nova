"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/supabase/users";
import { signValue } from "@/lib/security";

export interface FormState {
  error?: string;
  success?: boolean;
}

/**
 * Server Action to handle user login.
 * Supports environment-configured admin/root and Supabase Auth.
 */
export async function loginAction(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { error: "Please fill in all fields." };
  }

  // 1. Environment-configured validation: admin / rootadmin365123
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "rootadmin365123";

  if (username === adminUsername && password === adminPassword) {
    const cookieStore = await cookies();
    const signedSession = await signValue("admin");
    cookieStore.set("session", signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
      path: "/",
    });
    
    // Redirect to dashboard upon success
    redirect("/dashboard");
  }

  // 2. Supabase Auth validation
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (authError || !authData.user) {
      return { error: "Invalid username, email or password." };
    }

    // 3. Verify user profile state in database
    const userId = authData.user.id;
    const profile = await getUserProfile(userId);

    if (!profile) {
      // Cleanup auth session since profile is missing
      await supabase.auth.signOut();
      return { error: "A profile was not found for this account. Contact your admin." };
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      return { error: "This user account has been deactivated." };
    }

    // 4. Set session cookies (signed to prevent client-side manipulation)
    const cookieStore = await cookies();
    const signedSession = await signValue(profile.role);
    cookieStore.set("session", signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
      path: "/",
    });
    
    const signedUserId = await signValue(userId);
    cookieStore.set("session_user_id", signedUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
      path: "/",
    });

    // Success redirect
    redirect("/dashboard");
  } catch (err: any) {
    // Next.js redirect calls throw an internal error, which must bubble up to perform redirect
    if (err.digest && err.digest.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: err.message || "Failed to authenticate." };
  }
}

/**
 * Server Action to handle user logout.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("session_user_id");
  
  // Best effort Supabase sign out
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("Supabase auth sign out error:", e);
  }
  
  redirect("/login");
}

