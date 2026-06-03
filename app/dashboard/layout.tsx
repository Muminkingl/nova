"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { logoutAction } from "@/app/actions/auth";
import { getUserRoleAction } from "@/app/actions/users";
import {
  LayoutDashboard,
  Database,
  Cpu,
  Layers,
  Settings as SettingsIcon,
  LogOut,
  Search,
  Bell,
  Terminal,
  Shield,
  ClipboardList,
  PlusCircle,
  TrendingUp,
  ShoppingBag,
  Truck,
  FileText,
  Users,
  PieChart,
  BarChart3,
  BookOpen,
  CalendarDays,
  Flame,
  UserCheck,
  History,
  Loader2,
  Menu,
  X
} from "lucide-react";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'admin' | 'staff' | null>(null);
  const [userName, setUserName] = useState("admin");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close mobile sidebar on route transition
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const [notifications, setNotifications] = useState(2);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Fetch user role and name
  useEffect(() => {
    async function loadRole() {
      const currentRole = await getUserRoleAction();
      setRole(currentRole);
      setUserName(currentRole === "admin" ? "admin" : "staff");
    }
    loadRole();
  }, []);

  // Monitor unauthorized warning redirect parameters
  useEffect(() => {
    const warning = searchParams.get("warning");
    if (warning === "unauthorized") {
      triggerToast("Access denied. Admin privileges required.");
    }
  }, [searchParams]);

  // Check active state
  const isActive = (path: string) => pathname === path;
  const isPartiallyActive = (path: string) => pathname.startsWith(path);

  // If role is not yet loaded, render a clean loading spinner
  if (role === null) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center space-y-3 bg-background text-muted-foreground font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider">Nova Portal loading...</span>
      </div>
    );
  }

  const isAdmin = role === "admin";

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans relative antialiased print:bg-white print:text-black">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-secondary border border-border text-foreground px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Terminal className="w-4 h-4 text-destructive" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. LEFT SIDEBAR (Hidden on Print) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col shrink-0 select-none print:hidden transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-border space-x-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-foreground tracking-tight text-sm uppercase">Nova Portal</span>
            <span className="block text-[10px] text-muted-foreground font-semibold leading-none mt-0.5">
              {isAdmin ? "Admin Workspace" : "Staff Account"}
            </span>
          </div>
          {/* Close Sidebar Button (Mobile only) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground lg:hidden ml-auto cursor-pointer"
            title="Close Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
          {/* Main Workspace (Admin only) */}
          {isAdmin && (
            <div className="space-y-1.5">
              <Link
                href="/dashboard"
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/dashboard")
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-3" />
                Overview
              </Link>
            </div>
          )}

          {/* INVENTORY MODULE */}
          <div className="space-y-2">
            <span className="px-3 text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider block">
              Inventory
            </span>
            <div className="space-y-1.5">
              <Link
                href="/dashboard/items"
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/dashboard/items") || (isPartiallyActive("/dashboard/items") && !pathname.endsWith("/new") && !pathname.includes("/edit"))
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <ClipboardList className="w-4 h-4 mr-3" />
                Items List
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/items/new"
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/items/new")
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <PlusCircle className="w-4 h-4 mr-3" />
                  Add Item
                </Link>
              )}
              <Link
                href="/dashboard/stock"
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/dashboard/stock")
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-3" />
                Stock Balance
              </Link>
            </div>
          </div>

          {/* TRANSACTIONS MODULE */}
          <div className="space-y-2">
            <span className="px-3 text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider block">
              Transactions
            </span>
            <div className="space-y-1.5">
              <Link
                href="/dashboard/purchases"
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/dashboard/purchases") || isPartiallyActive("/dashboard/purchases")
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <ShoppingBag className="w-4 h-4 mr-3" />
                Purchases
              </Link>
              <Link
                href="/dashboard/suppliers"
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/dashboard/suppliers") || isPartiallyActive("/dashboard/suppliers")
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <Truck className="w-4 h-4 mr-3" />
                Suppliers
              </Link>
              <Link
                href="/dashboard/invoices"
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/dashboard/invoices") || isPartiallyActive("/dashboard/invoices")
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <FileText className="w-4 h-4 mr-3" />
                Sales & Invoices
              </Link>
              <Link
                href="/dashboard/customers"
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/dashboard/customers") || isPartiallyActive("/dashboard/customers")
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <Users className="w-4 h-4 mr-3" />
                Customers
              </Link>
            </div>
          </div>

          {/* REPORTS & FINANCE MODULE */}
          <div className="space-y-2">
            <span className="px-3 text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider block">
              Reports & Finance
            </span>
            <div className="space-y-1.5">
              {isAdmin && (
                <Link
                  href="/dashboard/reports/overview"
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/reports/overview")
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <PieChart className="w-4 h-4 mr-3" />
                  Financial Overview
                </Link>
              )}
              <Link
                href="/dashboard/reports/profits"
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/dashboard/reports/profits")
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Sales & Profits
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/reports/statements"
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/reports/statements")
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <BookOpen className="w-4 h-4 mr-3" />
                  Account Statements
                </Link>
              )}
              <Link
                href="/dashboard/reports/expiry"
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive("/dashboard/reports/expiry")
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <CalendarDays className="w-4 h-4 mr-3 text-amber-500/80" />
                Expiry Alerts
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/damages"
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/damages") || isPartiallyActive("/dashboard/damages")
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <Flame className="w-4 h-4 mr-3 text-red-500/80" />
                  Damages & Losses
                </Link>
              )}
            </div>
          </div>

          {/* ADMIN SETTINGS & AUDITING MODULE */}
          {isAdmin && (
            <div className="space-y-2">
              <span className="px-3 text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider block">
                Administration
              </span>
              <div className="space-y-1.5">
                <Link
                  href="/dashboard/users"
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/users") || isPartiallyActive("/dashboard/users")
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <UserCheck className="w-4 h-4 mr-3" />
                  User Accounts
                </Link>
                <Link
                  href="/dashboard/activity"
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/activity")
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <History className="w-4 h-4 mr-3" />
                  Activity Log
                </Link>
                <Link
                  href="/dashboard/settings"
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/settings")
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <SettingsIcon className="w-4 h-4 mr-3" />
                  Settings
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 border-t border-border bg-card/60">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer select-none active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {/* TOP NAVBAR (Hidden on Print) */}
        <header className="h-16 border-b border-border bg-card/45 flex items-center justify-between px-4 sm:px-8 shrink-0 select-none print:hidden">
          {/* Mobile hamburger menu & Breadcrumbs */}
          <div className="flex items-center space-x-3 text-sm select-none">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground lg:hidden cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Nova</span>
              <span className="text-muted-foreground">/</span>
            </div>
            <span className="text-foreground font-medium capitalize">
              {pathname === "/dashboard"
                ? "Overview"
                : pathname.split("/").slice(2).join(" / ")}
            </span>
          </div>

          {/* User profile and notification center */}
          <div className="flex items-center space-x-4">
            {/* Notification Center */}
            <button
              onClick={() => {
                if (notifications > 0) {
                  setNotifications(0);
                  triggerToast("All notifications marked as read.");
                } else {
                  setNotifications(2);
                }
              }}
              className="relative p-2 rounded-lg hover:bg-secondary/60 border border-transparent hover:border-border transition-all cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </button>

            <div className="h-6 w-px bg-border" />

            {/* Active User profile details */}
            <div className="flex items-center space-x-2.5 select-none bg-secondary/40 px-3 py-1.5 rounded-lg border border-border/40">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs shadow-sm uppercase">
                {userName.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-foreground capitalize">{userName}</span>
              <span className={`text-[10px] border px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90 ${
                isAdmin 
                  ? "bg-primary/10 border-primary/20 text-foreground" 
                  : "bg-secondary border-border text-muted-foreground"
              }`}>
                {role}
              </span>
            </div>
          </div>
        </header>

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto bg-background/60 p-8 print:p-0 print:bg-white print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex flex-col items-center justify-center space-y-3 bg-background text-muted-foreground font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider">Loading Workspace Shell...</span>
      </div>
    }>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
