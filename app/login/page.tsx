"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Lock, User, ShieldAlert, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Logo and header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary border border-border shadow-inner text-foreground">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your admin panel to manage the system
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-card border border-border rounded-xl shadow-2xl p-6 sm:p-8 space-y-6">
          <form action={action} className="space-y-4">
            {/* Error Message */}
            {state?.error && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium leading-none text-muted-foreground"
              >
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="*********"
                  required
                  autoComplete="username"
                  disabled={pending}
                  className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none text-muted-foreground"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={pending}
                  className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center w-full h-10 px-4 py-2 font-medium text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-all cursor-pointer shadow-md select-none mt-2 active:scale-[0.98]"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
