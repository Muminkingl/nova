import { NextRequest, NextResponse } from "next/server";
import { verifyValue } from "@/lib/security";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get("session")?.value;
  const session = sessionCookie ? await verifyValue(sessionCookie) : null; // Verified: 'admin' | 'staff' | null

  const isDashboardRoute = path.startsWith("/dashboard");
  const isLoginRoute = path === "/login";

  // Redirect from root to dashboard
  if (path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect to login if user is not authenticated and trying to access dashboard
  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if user is authenticated and trying to access login page
  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based route protection for STAFF members
  if (isDashboardRoute && session === "staff") {
    // If they access the default overview page /dashboard or reports overview, redirect to Sales & Profits
    if (path === "/dashboard" || path === "/dashboard/reports/overview") {
      return NextResponse.redirect(new URL("/dashboard/reports/profits", request.url));
    }

    // List of admin-only sub-routes
    const isAdminOnlyRoute = 
      path.startsWith("/dashboard/users") ||
      path.startsWith("/dashboard/damages") ||
      path.startsWith("/dashboard/reports/statements") ||
      path.startsWith("/dashboard/activity") ||
      path.startsWith("/dashboard/settings") ||
      path.includes("/edit") ||
      (path.endsWith("/new") && 
       !path.startsWith("/dashboard/invoices/new") && 
       !path.startsWith("/dashboard/purchases/new"));

    // Check if it's admin-only and redirect to Sales & Profits
    if (isAdminOnlyRoute) {
      const redirectUrl = new URL("/dashboard/reports/profits", request.url);
      redirectUrl.searchParams.set("warning", "unauthorized");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

