"use client";

import { useEffect, useState } from "react";
import { getActivityLogsAction } from "@/app/actions/activity";
import { ActivityLog } from "@/types";
import {
  History,
  Search,
  Filter,
  Calendar,
  Loader2,
  Trash2,
  AlertCircle,
  HelpCircle,
  FileText,
  DollarSign,
  ShoppingBag,
  Flame,
  UserCheck,
  ClipboardList
} from "lucide-react";

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter parameters
  const [userName, setUserName] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filters = {
        userName: userName.trim() || undefined,
        action: actionFilter !== "all" ? actionFilter : undefined,
        entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      };

      const res = await getActivityLogsAction(filters);
      if (res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error("Failed to load activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [userName, actionFilter, entityTypeFilter, dateFrom, dateTo]);

  // Unique list of user names for filter suggestion
  const uniqueUsers = Array.from(new Set(logs.map((l) => l.user_name))).filter(Boolean);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 overflow-y-auto pb-10 max-h-[calc(100vh-4rem)] px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity Log</h1>
          <p className="text-sm text-muted-foreground">
            Administrative audit trail. Review timestamps, operations, and entities changed by team members.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center h-9 px-3.5 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-colors cursor-pointer"
        >
          Refresh Logs
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-card/45 border border-border/80 rounded-xl p-4 flex flex-wrap gap-4 items-end select-none">
        {/* User Filter (Input / Dropdown suggestion) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Operator</label>
          <input
            type="text"
            list="usernames"
            placeholder="Search by operator name..."
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-[170px]"
          />
          <datalist id="usernames">
            {uniqueUsers.map((name, idx) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        {/* Action Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-[130px]"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="voided">Voided</option>
            <option value="payment_recorded">Payment Recorded</option>
            <option value="damage_recorded">Damage Recorded</option>
            <option value="user_invited">User Invited</option>
            <option value="role_changed">Role Changed</option>
            <option value="user_deactivated">User Deactivated</option>
            <option value="settings_updated">Settings Updated</option>
          </select>
        </div>

        {/* Entity Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Module Domain</label>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-[130px]"
          >
            <option value="all">All Modules</option>
            <option value="item">Items Catalog</option>
            <option value="invoice">Sales Invoice</option>
            <option value="purchase">Purchase Order</option>
            <option value="customer">Customers</option>
            <option value="supplier">Suppliers</option>
            <option value="damage">Write-offs</option>
            <option value="payment">Cash Payments</option>
            <option value="user">User Domain</option>
          </select>
        </div>

        {/* Date From */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-sans">Start Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-sans">End Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Reset Filters */}
        {(userName || actionFilter !== "all" || entityTypeFilter !== "all" || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setUserName("");
              setActionFilter("all");
              setEntityTypeFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
            className="h-9 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid List Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-48 flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs font-medium">Querying audit trail logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground space-y-2 select-none">
            <History className="w-8 h-8 opacity-45" />
            <p className="text-xs font-medium">No activity log records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px] select-none">
                  <th className="px-6 py-3.5">Log Timestamp</th>
                  <th className="px-6 py-3.5">Operator Identity</th>
                  <th className="px-6 py-3.5">Operation</th>
                  <th className="px-6 py-3.5">Entity Reference</th>
                  <th className="px-6 py-3.5">Log Details Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {logs.map((row) => {
                  let badgeBg = "bg-secondary text-foreground border-border";
                  let moduleIcon = <HelpCircle className="w-3.5 h-3.5" />;
                  
                  // Color action category
                  if (row.action.includes("create") || row.action === "user_invited") {
                    badgeBg = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                  } else if (row.action.includes("update") || row.action === "role_changed" || row.action === "settings_updated") {
                    badgeBg = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                  } else if (row.action.includes("deactivate") || row.action.includes("void")) {
                    badgeBg = "bg-red-500/10 text-red-500 border-red-500/20";
                  } else if (row.action.includes("payment")) {
                    badgeBg = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                  }

                  // Resolve Icon
                  if (row.entity_type === "invoice") moduleIcon = <FileText className="w-3.5 h-3.5" />;
                  else if (row.entity_type === "purchase") moduleIcon = <ShoppingBag className="w-3.5 h-3.5" />;
                  else if (row.entity_type === "payment") moduleIcon = <DollarSign className="w-3.5 h-3.5" />;
                  else if (row.entity_type === "damage") moduleIcon = <Flame className="w-3.5 h-3.5 text-red-500" />;
                  else if (row.entity_type === "user") moduleIcon = <UserCheck className="w-3.5 h-3.5 text-primary" />;
                  else if (row.entity_type === "item") moduleIcon = <ClipboardList className="w-3.5 h-3.5" />;

                  // Human readable action text
                  const readableAction = row.action.replace(/_/g, " ").toUpperCase();

                  return (
                    <tr key={row.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-foreground capitalize">
                        {row.user_name}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold border tracking-wider select-none ${badgeBg}`}>
                          {readableAction}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="p-1 rounded bg-secondary text-muted-foreground border border-border/50">
                            {moduleIcon}
                          </span>
                          <span className="font-semibold text-foreground">{row.entity_label || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground font-medium">
                        {row.details ? (
                          <div className="space-y-0.5 max-w-[320px] truncate">
                            {Object.entries(row.details).map(([key, val]) => (
                              <span key={key} className="inline-block mr-2.5">
                                <span className="font-semibold text-[10px] uppercase text-muted-foreground">{key}:</span>{" "}
                                <span className="text-foreground font-semibold">{String(val)}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          "No detail parameters recorded"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
