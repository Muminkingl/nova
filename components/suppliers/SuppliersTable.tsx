"use client";

import { useState } from "react";
import Link from "next/link";
import { SupplierWithStats, deactivateSupplierAction } from "@/app/actions/suppliers";
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  Inbox,
  AlertTriangle,
  User,
  Phone
} from "lucide-react";

export default function SuppliersTable({
  initialSuppliers,
  onRefresh
}: {
  initialSuppliers: SupplierWithStats[];
  onRefresh: () => void;
}) {
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>(initialSuppliers);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeactivate = async (id: string) => {
    if (confirm("Are you sure you want to deactivate this supplier? Historical purchase orders will remain intact.")) {
      setIsDeleting(id);
      try {
        const { error } = await deactivateSupplierAction(id);
        if (error) {
          alert("Failed to deactivate supplier: " + error.message);
        } else {
          setSuppliers(suppliers.filter((s) => s.id !== id));
          onRefresh();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 select-none animate-in fade-in duration-300">
      {/* Search and Add Suppliers Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search suppliers by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-background/50 pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors text-foreground placeholder:text-muted-foreground/75"
          />
        </div>

        <Link
          href="/dashboard/suppliers/new"
          className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-md shrink-0 w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Link>
      </div>

      {/* Grid table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-6 font-semibold">Supplier Name</th>
                <th className="py-3.5 px-6 font-semibold">Contact Person</th>
                <th className="py-3.5 px-6 font-semibold">Phone</th>
                <th className="py-3.5 px-6 font-semibold text-right">Total Debt</th>
                <th className="py-3.5 px-6 font-semibold text-center">Purchases Count</th>
                <th className="py-3.5 px-6 font-semibold text-center">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((s) => {
                  const debt = Number(s.total_debt || 0);
                  const hasDebt = debt > 0;

                  // Highlighting: Red if total debt > 0
                  const rowBg = hasDebt
                    ? "bg-red-500/5 hover:bg-red-500/10 transition-colors"
                    : "hover:bg-secondary/10 transition-colors";

                  return (
                    <tr key={s.id} className={rowBg}>
                      <td className="py-4 px-6 font-semibold text-foreground max-w-xs truncate">
                        {s.name}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-medium">
                        {s.contact_person ? (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 opacity-60" />
                            {s.contact_person}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/35 italic">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-medium">
                        {s.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 opacity-60" />
                            {s.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/35 italic">N/A</span>
                        )}
                      </td>
                      <td className={`py-4 px-6 text-right font-mono font-bold ${hasDebt ? "text-red-500" : "text-muted-foreground"}`}>
                        {debt.toLocaleString()} IQD
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-semibold">
                        {s.purchases_count || 0}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {hasDebt ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Owes Debt
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
                            href={`/dashboard/suppliers/${s.id}`}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
                            title="View Ledger Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/dashboard/suppliers/${s.id}/edit`}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
                            title="Edit Supplier Profile"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeactivate(s.id)}
                            disabled={isDeleting === s.id}
                            className="p-1.5 rounded bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive transition-all cursor-pointer disabled:opacity-50"
                            title="Deactivate Supplier"
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
                  <td colSpan={7} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="p-3 bg-secondary/40 border border-border/80 rounded-xl text-muted-foreground">
                        <Inbox className="w-6 h-6 opacity-60" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground text-sm">No suppliers registered</h4>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          There are no registered supplier sources in this ERP catalog yet.
                        </p>
                      </div>
                      <Link
                        href="/dashboard/suppliers/new"
                        className="inline-flex items-center justify-center h-8 px-3.5 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow cursor-pointer"
                      >
                        Register Supplier
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
