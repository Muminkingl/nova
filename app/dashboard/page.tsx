"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getFinancialOverviewAction,
  getTopCustomersByDebtAction,
  getTopSuppliersByDebtAction,
  getRecentActivityAction,
  getExpiryAlertsAction,
  getProfitByItemAction
} from "@/app/actions/reports";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  Users,
  ClipboardList,
  AlertTriangle,
  Flame,
  RefreshCw,
  ArrowUpRight,
  ArrowRight,
  ShoppingBag,
  FileText,
  BadgeAlert,
  HelpCircle
} from "lucide-react";
import { FinancialOverview, ProfitByItem, ExpiryAlert } from "@/types";

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [overview, setOverview] = useState<FinancialOverview>({
    total_revenue: 0,
    total_cost: 0,
    gross_profit: 0,
    customer_debt: 0,
    supplier_debt: 0,
    stock_value: 0,
    damage_losses: 0,
    net_position: 0,
  });

  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<ProfitByItem[]>([]);
  const [expiredCount, setExpiredCount] = useState(0);

  const fetchStats = async () => {
    try {
      const [
        overviewRes,
        topCustomersRes,
        topSuppliersRes,
        activityRes,
        expiryRes,
        profitsRes
      ] = await Promise.all([
        getFinancialOverviewAction(),
        getTopCustomersByDebtAction(5),
        getTopSuppliersByDebtAction(5),
        getRecentActivityAction(10),
        getExpiryAlertsAction(),
        getProfitByItemAction()
      ]);

      if (overviewRes.data) setOverview(overviewRes.data);
      if (topCustomersRes.data) setTopCustomers(topCustomersRes.data);
      if (topSuppliersRes.data) setTopSuppliers(topSuppliersRes.data);
      if (activityRes.data) setRecentActivity(activityRes.data);
      
      if (expiryRes.data) {
        const expired = expiryRes.data.filter((item: ExpiryAlert) => item.status === "expired").length;
        setExpiredCount(expired);
      }

      if (profitsRes.data) {
        setBestSellers(profitsRes.data.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetchStats();
    setTimeout(() => setSyncing(false), 500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 overflow-y-auto pb-10 max-h-[calc(100vh-4rem)] px-8 py-6">
      {/* 1. Header Banner Alert for Expired Stock */}
      {expiredCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-3">
            <BadgeAlert className="w-5 h-5 animate-pulse text-destructive" />
            <div>
              <p className="font-semibold text-sm">Critical: Expired Inventory Warning</p>
              <p className="text-xs opacity-90">
                You have {expiredCount} product batches that are currently expired. Please write them off in the Damages section to maintain warehouse audit compliance.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/reports/expiry"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            Review Expired
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      )}

      {/* 2. Welcome Bar */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Financial intelligence engine. Real-time liquidity, liabilities, and product performance.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={loading || syncing}
          className="inline-flex items-center h-9 px-4 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Node"}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-card/50 border border-border/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* 3. Primary Financial Deck (8 cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 select-none">
            {/* Card 1: Total Revenue */}
            <Link
              href="/dashboard/reports/profits"
              className="bg-card border border-border hover:border-emerald-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Total Revenue
                </span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {overview.total_revenue.toLocaleString()} IQD
                </h3>
                <span className="text-[10px] text-muted-foreground block font-medium mt-1">Sum of all billing invoices</span>
              </div>
            </Link>

            {/* Card 2: Total Cost */}
            <Link
              href="/dashboard/purchases"
              className="bg-card border border-border hover:border-red-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Total Cost
                </span>
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {overview.total_cost.toLocaleString()} IQD
                </h3>
                <span className="text-[10px] text-muted-foreground block font-medium mt-1">Sum of wholesale purchases</span>
              </div>
            </Link>

            {/* Card 3: Gross Profit */}
            <Link
              href="/dashboard/reports/profits"
              className="bg-card border border-border hover:border-emerald-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Gross Profit
                </span>
                <div className={`p-2 rounded-lg transition-all ${
                  overview.gross_profit >= 0 
                    ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white" 
                    : "bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white"
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className={`text-xl font-bold tracking-tight ${overview.gross_profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {overview.gross_profit.toLocaleString()} IQD
                </h3>
                <span className="text-[10px] text-muted-foreground block font-medium mt-1">Revenue - cost totals</span>
              </div>
            </Link>

            {/* Card 4: Net Liquidity Position */}
            <div className="bg-card border border-primary/25 rounded-xl p-5 flex flex-col justify-between shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  Net Position
                </span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-extrabold tracking-tight text-foreground">
                  {overview.net_position.toLocaleString()} IQD
                </h3>
                <span className="text-[10px] text-muted-foreground block font-medium mt-1">Profit - Payables + Receivables</span>
              </div>
            </div>

            {/* Card 5: Customer Debt */}
            <Link
              href="/dashboard/customers"
              className="bg-card border border-border hover:border-amber-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Customer Receivables
                </span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold tracking-tight text-amber-500">
                  {overview.customer_debt.toLocaleString()} IQD
                </h3>
                <span className="text-[10px] text-muted-foreground block font-medium mt-1">Owed by customers to us</span>
              </div>
            </Link>

            {/* Card 6: Supplier Debt */}
            <Link
              href="/dashboard/suppliers"
              className="bg-card border border-border hover:border-orange-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Supplier Liabilities
                </span>
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold tracking-tight text-orange-500">
                  {overview.supplier_debt.toLocaleString()} IQD
                </h3>
                <span className="text-[10px] text-muted-foreground block font-medium mt-1">Owed by us to suppliers</span>
              </div>
            </Link>

            {/* Card 7: Stock Value */}
            <Link
              href="/dashboard/stock"
              className="bg-card border border-border hover:border-blue-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Stock Value (Asset)
                </span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold tracking-tight text-blue-500">
                  {overview.stock_value.toLocaleString()} IQD
                </h3>
                <span className="text-[10px] text-muted-foreground block font-medium mt-1">Total items stock at cost</span>
              </div>
            </Link>

            {/* Card 8: Damage Losses */}
            <Link
              href="/dashboard/damages"
              className="bg-card border border-border hover:border-red-500/40 rounded-xl p-5 flex flex-col justify-between transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Damage Write-offs
                </span>
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold tracking-tight text-red-500">
                  {overview.damage_losses.toLocaleString()} IQD
                </h3>
                <span className="text-[10px] text-muted-foreground block font-medium mt-1">Accumulated write-off losses</span>
              </div>
            </Link>
          </div>

          {/* 4. Analytics Grid (Tables) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Best Selling Items */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-[350px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Top 5 Best Selling Items</h3>
                <Link href="/dashboard/reports/profits" className="text-[10px] text-primary font-medium hover:underline flex items-center">
                  Full Analytics <ArrowUpRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                {bestSellers.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No sales recorded yet.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/60 pb-2 font-medium">
                        <th className="py-2">Item</th>
                        <th className="py-2 text-right">Sold</th>
                        <th className="py-2 text-right">Revenue</th>
                        <th className="py-2 text-right text-emerald-500">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {bestSellers.map((item, idx) => (
                        <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-2.5 font-medium text-foreground truncate max-w-[120px]">{item.name}</td>
                          <td className="py-2.5 text-right font-medium text-muted-foreground">{item.units_sold}</td>
                          <td className="py-2.5 text-right font-medium text-muted-foreground">{item.revenue.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-bold text-emerald-500">{item.profit.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Top Debtors (Customers) */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-[350px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Top Customer Debts</h3>
                <Link href="/dashboard/customers" className="text-[10px] text-primary font-medium hover:underline flex items-center">
                  All Customers <ArrowUpRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                {topCustomers.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No debtor records.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/60 pb-2 font-medium">
                        <th className="py-2">Customer</th>
                        <th className="py-2 text-right">Invoiced</th>
                        <th className="py-2 text-right">Paid</th>
                        <th className="py-2 text-right text-amber-500">Owes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {topCustomers.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-2.5 font-medium text-foreground truncate max-w-[120px]">{cust.name}</td>
                          <td className="py-2.5 text-right font-medium text-muted-foreground">{cust.totalInvoiced.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-medium text-muted-foreground">{cust.totalPaid.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-bold text-amber-500">{cust.debt.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Top Supplier Debts */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-[350px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Top Supplier Debts</h3>
                <Link href="/dashboard/suppliers" className="text-[10px] text-primary font-medium hover:underline flex items-center">
                  All Suppliers <ArrowUpRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                {topSuppliers.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No supplier liabilities.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/60 pb-2 font-medium">
                        <th className="py-2">Supplier</th>
                        <th className="py-2 text-right">Purchased</th>
                        <th className="py-2 text-right">Paid</th>
                        <th className="py-2 text-right text-orange-500">Owe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {topSuppliers.map((supp, idx) => (
                        <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-2.5 font-medium text-foreground truncate max-w-[120px]">{supp.name}</td>
                          <td className="py-2.5 text-right font-medium text-muted-foreground">{supp.totalPurchased.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-medium text-muted-foreground">{supp.totalPaid.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-bold text-orange-500">{supp.debt.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* 5. Recent Activity Feed */}
          <div className="bg-card border border-border rounded-xl p-6 select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Recent Transactions Feed</h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent transaction records.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => {
                  let badgeBg = "bg-secondary text-foreground border-border";
                  let icon = <HelpCircle className="w-3.5 h-3.5" />;
                  
                  if (activity.type === "invoice") {
                    badgeBg = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                    icon = <FileText className="w-3.5 h-3.5" />;
                  } else if (activity.type === "customer_payment") {
                    badgeBg = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                    icon = <DollarSign className="w-3.5 h-3.5" />;
                  } else if (activity.type === "purchase") {
                    badgeBg = "bg-red-500/10 text-red-500 border-red-500/20";
                    icon = <ShoppingBag className="w-3.5 h-3.5" />;
                  } else if (activity.type === "supplier_payment") {
                    badgeBg = "bg-orange-500/10 text-orange-500 border-orange-500/20";
                    icon = <DollarSign className="w-3.5 h-3.5" />;
                  } else if (activity.type === "damage") {
                    badgeBg = "bg-red-500/15 text-red-500 border-red-500/30";
                    icon = <Flame className="w-3.5 h-3.5 animate-pulse" />;
                  }

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-3 border-b border-border/40 last:border-b-0 hover:bg-secondary/10 px-2 rounded-lg transition-all"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`p-2 rounded-lg border ${badgeBg}`}>
                          {icon}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-normal">{activity.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Entity: <span className="font-medium text-foreground">{activity.entity}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {activity.amount.toLocaleString()} IQD
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{activity.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
