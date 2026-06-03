"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerWithStats, deactivateCustomerAction } from "@/app/actions/customers";
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  Inbox,
  AlertTriangle,
  User,
  Phone,
  Building
} from "lucide-react";

export default function CustomersTable({
  initialCustomers,
  onRefresh
}: {
  initialCustomers: CustomerWithStats[];
  onRefresh: () => void;
}) {
  const [customers, setCustomers] = useState<CustomerWithStats[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeactivate = async (id: string) => {
    if (confirm("Are you sure you want to deactivate this customer? All historical records remain intact.")) {
      setIsDeleting(id);
      try {
        const { error } = await deactivateCustomerAction(id);
        if (error) {
          alert("Failed to deactivate customer: " + error.message);
        } else {
          setCustomers(customers.filter((c) => c.id !== id));
          onRefresh();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4 select-none animate-in fade-in duration-300">
      {/* Search, Filter, Action Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search customers by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background/50 pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors text-foreground placeholder:text-muted-foreground/75"
            />
          </div>

          {/* Type Filter */}
          <div className="relative w-full sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg border border-input bg-background/50 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer appearance-none"
            >
              <option value="all">All Buyer Types</option>
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <Link
          href="/dashboard/customers/new"
          className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-md shrink-0 w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Link>
      </div>

      {/* Grid table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-6 font-semibold">Customer Name</th>
                <th className="py-3.5 px-6 font-semibold text-center">Type</th>
                <th className="py-3.5 px-6 font-semibold">Contact Person</th>
                <th className="py-3.5 px-6 font-semibold">Phone</th>
                <th className="py-3.5 px-6 font-semibold text-right">Outstanding Debt</th>
                <th className="py-3.5 px-6 font-semibold text-center">Invoices Count</th>
                <th className="py-3.5 px-6 font-semibold text-center">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => {
                  const debt = Number(c.outstanding_debt || 0);
                  const hasDebt = debt > 0;

                  // Highlighting: Yellow row if outstanding debt > 0
                  const rowBg = hasDebt
                    ? "bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                    : "hover:bg-secondary/10 transition-colors";

                  return (
                    <tr key={c.id} className={rowBg}>
                      <td className="py-4 px-6 font-semibold text-foreground max-w-xs truncate">
                        {c.name}
                      </td>
                      <td className="py-4 px-6 text-center capitalize">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border font-medium text-[10px]">
                          <Building className="w-3 h-3" />
                          {c.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-medium">
                        {c.contact_person ? (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 opacity-60" />
                            {c.contact_person}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/35 italic">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-medium">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 opacity-60" />
                            {c.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/35 italic">N/A</span>
                        )}
                      </td>
                      <td className={`py-4 px-6 text-right font-mono font-bold ${hasDebt ? "text-amber-500" : "text-muted-foreground"}`}>
                        {debt.toLocaleString()} IQD
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-semibold">
                        {c.invoices_count || 0}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {hasDebt ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Owes Balance
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                            Clear
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/customers/${c.id}`}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
                            title="View Ledger Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/dashboard/customers/${c.id}/edit`}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
                            title="Edit Customer Profile"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeactivate(c.id)}
                            disabled={isDeleting === c.id}
                            className="p-1.5 rounded bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive transition-all cursor-pointer disabled:opacity-50"
                            title="Deactivate Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="p-3 bg-secondary/40 border border-border/80 rounded-xl text-muted-foreground">
                        <Inbox className="w-6 h-6 opacity-60" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground text-sm">No customers registered</h4>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          There are no registered buyer profiles registered in this medical ERP database yet.
                        </p>
                      </div>
                      <Link
                        href="/dashboard/customers/new"
                        className="inline-flex items-center justify-center h-8 px-3.5 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow cursor-pointer"
                      >
                        Register Customer
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
