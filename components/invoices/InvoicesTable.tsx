"use client";

import { useState } from "react";
import Link from "next/link";
import { InvoiceWithCustomer } from "@/lib/supabase/invoices";
import CustomerPaymentModal from "../customers/CustomerPaymentModal";
import {
  Eye,
  CreditCard,
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Inbox,
  AlertTriangle
} from "lucide-react";

export default function InvoicesTable({
  initialInvoices,
  customers = [],
  onRefresh
}: {
  initialInvoices: InvoiceWithCustomer[];
  customers: { id: string; name: string }[];
  onRefresh: () => void;
}) {
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>(initialInvoices);
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof InvoiceWithCustomer>("invoice_number");
  const [sortAscending, setSortAscending] = useState(false); // Default: newest first

  // Payment modal state
  const [payingInvoice, setPayingInvoice] = useState<InvoiceWithCustomer | null>(null);

  // Calculate total outstanding receivables
  let totalOutstandingReceivables = 0;
  initialInvoices.forEach((i) => {
    totalOutstandingReceivables += Math.max(0, Number(i.final_amount) - Number(i.amount_paid));
  });

  const handleSort = (field: keyof InvoiceWithCustomer) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  // Filter
  const filteredInvoices = invoices.filter((i) => {
    const matchesCustomer =
      customerFilter === "all" || i.customer_id === customerFilter;
    const matchesStatus =
      statusFilter === "all" || i.status === statusFilter;
    return matchesCustomer && matchesStatus;
  });

  // Sort
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];

    if (valueA === null || valueA === undefined) return 1;
    if (valueB === null || valueB === undefined) return -1;

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortAscending
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortAscending ? valueA - valueB : valueB - valueA;
    }

    return 0;
  });

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      {/* 1. OUTSTANDING DEBT BAR */}
      {totalOutstandingReceivables > 0 && (
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 max-w-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
          <div className="text-xs">
            <span className="text-muted-foreground font-semibold block uppercase tracking-wider text-[10px]">
              Active Receivables Alert
            </span>
            <span className="text-foreground font-bold text-sm block mt-0.5">
              Owed by customers to us: <span className="font-mono text-amber-500">{totalOutstandingReceivables.toLocaleString()} IQD</span>
            </span>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payingInvoice && (
        <CustomerPaymentModal
          customerId={payingInvoice.customer_id}
          customerName={payingInvoice.customers?.name || "Customer"}
          unpaidInvoices={[{
            id: payingInvoice.id,
            invoice_number: payingInvoice.invoice_number,
            final_amount: Number(payingInvoice.final_amount),
            amount_paid: Number(payingInvoice.amount_paid),
          }]}
          onClose={() => setPayingInvoice(null)}
          onSuccess={() => {
            setPayingInvoice(null);
            onRefresh();
          }}
        />
      )}

      {/* 2. FILTER & TOOLBAR */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Customer filter */}
          <div className="relative flex-1">
            <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full h-10 pl-10 pr-8 rounded-lg border border-input bg-background/50 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer pr-10"
            >
              <option value="all">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div className="relative w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg border border-input bg-background/50 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <Link
          href="/dashboard/invoices/new"
          className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-md shrink-0 w-full lg:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Link>
      </div>

      {/* 3. TABLE GRID */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th
                  onClick={() => handleSort("invoice_number")}
                  className="py-3.5 px-6 font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Invoice #
                    {sortField === "invoice_number" && (
                      sortAscending ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-6 font-semibold">Customer</th>
                <th
                  onClick={() => handleSort("invoice_date")}
                  className="py-3.5 px-6 font-semibold cursor-pointer hover:text-foreground transition-colors text-center"
                >
                  <div className="flex items-center gap-1 justify-center">
                    Date
                    {sortField === "invoice_date" && (
                      sortAscending ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-6 font-semibold text-center">Items</th>
                <th className="py-3.5 px-6 font-semibold text-right">Final Amount</th>
                <th className="py-3.5 px-6 font-semibold text-right">Amount Paid</th>
                <th className="py-3.5 px-6 font-semibold text-right">Remaining Due</th>
                <th className="py-3.5 px-6 font-semibold text-center">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground">
              {sortedInvoices.length > 0 ? (
                sortedInvoices.map((inv) => {
                  const final = Number(inv.final_amount || 0);
                  const paid = Number(inv.amount_paid || 0);
                  const remaining = Math.max(0, final - paid);

                  const isUnpaid = inv.status === "unpaid";
                  const isPartial = inv.status === "partial";
                  const isPaid = inv.status === "paid";

                  let rowBg = "hover:bg-secondary/10 transition-colors";
                  if (isUnpaid) {
                    rowBg = "bg-red-500/5 hover:bg-red-500/10 transition-colors";
                  } else if (isPartial) {
                    rowBg = "bg-amber-500/5 hover:bg-amber-500/10 transition-colors";
                  }

                  return (
                    <tr key={inv.id} className={rowBg}>
                      <td className="py-4 px-6 font-bold text-foreground font-mono">
                        {inv.invoice_number}
                      </td>
                      <td className="py-4 px-6 font-semibold text-foreground max-w-xs truncate">
                        {inv.customers?.name || <span className="italic text-muted-foreground/45">Unknown Customer</span>}
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-muted-foreground">
                        {inv.invoice_date}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-semibold">
                        {inv.items_count || 0}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium text-muted-foreground">
                        {final.toLocaleString()} IQD
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium text-muted-foreground">
                        {paid.toLocaleString()} IQD
                      </td>
                      <td className={`py-4 px-6 text-right font-mono font-bold ${remaining > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {remaining.toLocaleString()} IQD
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                            Paid
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-500">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/dashboard/invoices/${inv.id}`}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
                            title="View Invoice details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {remaining > 0 && (
                            <button
                              onClick={() => setPayingInvoice(inv)}
                              className="p-1.5 rounded bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition-all cursor-pointer"
                              title="Record Payment installment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="p-3 bg-secondary/40 border border-border/80 rounded-xl text-muted-foreground">
                        <Inbox className="w-6 h-6 opacity-60" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground text-sm">No sales invoices</h4>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          There are no sales invoices logged. Log an invoice to process customer shipments.
                        </p>
                      </div>
                      <Link
                        href="/dashboard/invoices/new"
                        className="inline-flex items-center justify-center h-8 px-3.5 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow cursor-pointer"
                      >
                        Create First Invoice
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
