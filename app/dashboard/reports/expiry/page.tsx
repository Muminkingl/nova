"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getExpiryAlertsAction } from "@/app/actions/reports";
import { ExpiryAlert } from "@/types";
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  BadgeAlert,
  Flame,
  Loader2,
  ArrowRight,
  TrendingDown,
  Info
} from "lucide-react";

export default function ExpiryAlertsPage() {
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await getExpiryAlertsAction();
      if (res.data) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error("Failed to load expiry warnings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // Filter lists
  const filteredAlerts = filterStatus === "all"
    ? alerts
    : alerts.filter((a) => a.status === filterStatus);

  // Group counts
  const expiredCount = alerts.filter((a) => a.status === "expired").length;
  const criticalCount = alerts.filter((a) => a.status === "critical").length;
  const warningCount = alerts.filter((a) => a.status === "warning").length;
  const cautionCount = alerts.filter((a) => a.status === "caution").length;

  // Sum value at risk
  const totalValueAtRisk = alerts.reduce((sum, item) => sum + Number(item.value_at_risk), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 overflow-y-auto pb-10 max-h-[calc(100vh-4rem)] px-8 py-6">
      {/* Page Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Expiry Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Monitor soon-to-expire batch stocks. Take preventive action or write off expired items.
          </p>
        </div>
        <button
          onClick={loadAlerts}
          className="inline-flex items-center h-9 px-3.5 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-colors cursor-pointer"
        >
          Refresh Alerts
        </button>
      </div>

      {/* Urgency Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 select-none">
        {/* Card 1: Already Expired */}
        <div
          onClick={() => setFilterStatus(filterStatus === "expired" ? "all" : "expired")}
          className={`bg-card border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] ${
            filterStatus === "expired" ? "border-red-500 ring-1 ring-red-500" : "border-border"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Already Expired</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500 animate-pulse">
              <BadgeAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-red-500">{expiredCount}</h3>
            <span className="text-[10px] text-muted-foreground block font-medium mt-1">Must be written off immediately</span>
          </div>
        </div>

        {/* Card 2: Critical (<7 days) */}
        <div
          onClick={() => setFilterStatus(filterStatus === "critical" ? "all" : "critical")}
          className={`bg-card border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] ${
            filterStatus === "critical" ? "border-orange-500 ring-1 ring-orange-500" : "border-border"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Critical (&le; 7 Days)</span>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-orange-500">{criticalCount}</h3>
            <span className="text-[10px] text-muted-foreground block font-medium mt-1">Expiring within a week</span>
          </div>
        </div>

        {/* Card 3: Warning (<30 days) */}
        <div
          onClick={() => setFilterStatus(filterStatus === "warning" ? "all" : "warning")}
          className={`bg-card border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] ${
            filterStatus === "warning" ? "border-amber-500 ring-1 ring-amber-500" : "border-border"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Warning (&le; 30 Days)</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-amber-500">{warningCount}</h3>
            <span className="text-[10px] text-muted-foreground block font-medium mt-1">Expiring within a month</span>
          </div>
        </div>

        {/* Card 4: Caution (<90 days) */}
        <div
          onClick={() => setFilterStatus(filterStatus === "caution" ? "all" : "caution")}
          className={`bg-card border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] ${
            filterStatus === "caution" ? "border-yellow-500 ring-1 ring-yellow-500" : "border-border"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Caution (&le; 90 Days)</span>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-yellow-500">{cautionCount}</h3>
            <span className="text-[10px] text-muted-foreground block font-medium mt-1">Expiring within 3 months</span>
          </div>
        </div>
      </div>

      {/* Global Assets Value at Risk Banner */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between select-none shadow-sm max-w-lg">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-500">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">Stock Assets at Risk</span>
            <span className="text-lg font-extrabold text-foreground block mt-0.5">
              {totalValueAtRisk.toLocaleString()} IQD
            </span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground font-medium text-right">
          Total value of all items <br /> expiring within 90 days
        </div>
      </div>

      {/* Expiry Alerts Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-secondary/15 flex justify-between items-center select-none">
          <h2 className="font-bold text-foreground text-xs uppercase tracking-wider">
            {filterStatus === "all" ? "All Warnings" : `${filterStatus.toUpperCase()} Items`} Registry
          </h2>
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              className="text-[10px] text-primary hover:underline font-bold"
            >
              Clear Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium">Checking expiry periods...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground space-y-2 select-none">
            <CalendarDays className="w-8 h-8 opacity-45" />
            <p className="text-xs font-medium">No expiring items found matching selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px] select-none">
                  <th className="px-6 py-3.5">Item Name</th>
                  <th className="px-6 py-3.5 text-center">Warehouse Stock</th>
                  <th className="px-6 py-3.5">Expiry Date</th>
                  <th className="px-6 py-3.5">Days Remaining</th>
                  <th className="px-6 py-3.5 text-right">Value at Risk (IQD)</th>
                  <th className="px-6 py-3.5 text-center">Urgency</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAlerts.map((row, idx) => {
                  let alertPill = "bg-secondary text-foreground border-border";
                  let daysColor = "text-foreground";
                  
                  if (row.status === "expired") {
                    alertPill = "bg-red-500/15 border-red-500/35 text-red-500";
                    daysColor = "text-red-500 font-extrabold";
                  } else if (row.status === "critical") {
                    alertPill = "bg-orange-500/15 border-orange-500/35 text-orange-500";
                    daysColor = "text-orange-500 font-bold";
                  } else if (row.status === "warning") {
                    alertPill = "bg-amber-500/10 border-amber-500/30 text-amber-500";
                    daysColor = "text-amber-500 font-medium";
                  } else if (row.status === "caution") {
                    alertPill = "bg-yellow-500/10 border-yellow-500/30 text-yellow-500";
                    daysColor = "text-yellow-500";
                  }

                  return (
                    <tr key={idx} className="hover:bg-secondary/15 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-foreground">{row.name}</td>
                      <td className="px-6 py-3.5 text-center font-bold text-muted-foreground">{row.stock_qty}</td>
                      <td className="px-6 py-3.5 font-medium text-foreground">{row.expiry_date || "—"}</td>
                      <td className="px-6 py-3.5">
                        <span className={daysColor}>
                          {row.days_until_expiry <= 0 
                            ? `Expired (${Math.abs(row.days_until_expiry)} days ago)` 
                            : `${row.days_until_expiry} days`}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-foreground">
                        {row.value_at_risk.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider select-none ${alertPill}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/dashboard/damages?preselect_item_id=${row.item_id}&preselect_reason=expired`}
                          className="inline-flex items-center px-2.5 py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-semibold border border-red-500/20 shadow-sm"
                        >
                          <Flame className="w-3 h-3 mr-1" />
                          Write-off
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Warning Footer */}
      <div className="p-4 rounded-lg bg-secondary/40 border border-border/60 text-xs text-muted-foreground flex items-center space-x-3 max-w-2xl select-none">
        <Info className="w-4.5 h-4.5 text-primary shrink-0 animate-pulse" />
        <span>
          <strong>Loss Prevention:</strong> The value at risk calculates current units in stock multiplied by their buy price. Expired items still sitting in stock present direct financial losses. Write them off as Damages to maintain proper stock accounting.
        </span>
      </div>
    </div>
  );
}
