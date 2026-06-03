"use client";

import { useState } from "react";
import Link from "next/link";
import { Customer, Invoice, CustomerPayment } from "@/types";
import CustomerPaymentModal from "./CustomerPaymentModal";
import {
  ArrowLeft,
  Edit,
  Plus,
  CreditCard,
  ClipboardList,
  AlertTriangle,
  History,
  TrendingUp,
  Info,
  Calendar,
  Layers,
  Inbox
} from "lucide-react";

export default function CustomerDetail({
  customer,
  totalInvoiced,
  totalPaid,
  outstandingDebt,
  invoices = [],
  payments = [],
  onRefresh
}: {
  customer: Customer;
  totalInvoiced: number;
  totalPaid: number;
  outstandingDebt: number;
  invoices: Invoice[];
  payments: CustomerPayment[];
  onRefresh: () => void;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Extract unpaid or partially paid invoices to seed payment modal
  const unpaidInvoices = invoices
    .filter((inv) => inv.status === "unpaid" || inv.status === "partial")
    .map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      final_amount: Number(inv.final_amount),
      amount_paid: Number(inv.amount_paid),
    }));

  const hasDebt = outstandingDebt > 0;

  return (
    <div className="space-y-8 select-none animate-in fade-in duration-300">
      {/* CustomerPaymentModal popup */}
      {showPaymentModal && (
        <CustomerPaymentModal
          customerId={customer.id}
          customerName={customer.name}
          unpaidInvoices={unpaidInvoices}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            onRefresh();
          }}
        />
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/dashboard/customers" className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Customers Directory
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.name}</h1>
          <p className="text-xs text-muted-foreground max-w-xl">
            Facility Type: <span className="capitalize font-semibold text-foreground">{customer.type}</span>
            {customer.address && ` • Address: ${customer.address}`}
            {customer.phone && ` • Phone: ${customer.phone}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 select-none">
          <Link
            href={`/dashboard/customers/${customer.id}/edit`}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center h-9 px-4 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-all cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Link>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Internal Notes card */}
      {customer.notes && (
        <div className="bg-secondary/20 border border-border/80 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="w-4.5 h-4.5 text-primary shrink-0" />
          <div>
            <strong className="text-foreground block mb-0.5">Customer Terms / Notes:</strong>
            {customer.notes}
          </div>
        </div>
      )}

      {/* 1. FINANCIAL SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Invoiced */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Total Invoiced
            </span>
            <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {totalInvoiced.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Accumulated sales volume</span>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Total Paid
            </span>
            <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {totalPaid.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Recorded receipts collected</span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className={`bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all group ${
          hasDebt 
            ? "border-amber-500/35 hover:border-amber-500/50" 
            : "border-border hover:border-border/80"
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Outstanding Receivables
            </span>
            <div className={`p-2 rounded-lg transition-all ${
              hasDebt 
                ? "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white" 
                : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground"
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className={`text-2xl font-bold tracking-tight ${hasDebt ? "text-amber-500" : "text-foreground"}`}>
              {outstandingDebt.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Owed by customer to us</span>
          </div>
        </div>
      </div>

      {/* 2. INVOICE HISTORY TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-card/60">
          <h3 className="font-semibold text-foreground text-sm tracking-tight flex items-center">
            <History className="w-4.5 h-4.5 mr-2 text-muted-foreground" />
            Invoice Billing History
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Logs of all invoices generated for this buyer account
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-6 font-semibold">Invoice #</th>
                <th className="py-3 px-6 font-semibold">Billing Date</th>
                <th className="py-3 px-6 font-semibold text-right">Final Amount</th>
                <th className="py-3 px-6 font-semibold text-right">Amount Paid</th>
                <th className="py-3 px-6 font-semibold text-right">Remaining Due</th>
                <th className="py-3 px-6 font-semibold text-center">Status</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground">
              {invoices.length > 0 ? (
                invoices.map((inv) => {
                  const finalAmt = Number(inv.final_amount || 0);
                  const paidAmt = Number(inv.amount_paid || 0);
                  const remaining = Math.max(0, finalAmt - paidAmt);

                  const isUnpaid = inv.status === "unpaid";
                  const isPartial = inv.status === "partial";
                  const isPaid = inv.status === "paid";

                  let rowBg = "hover:bg-secondary/10 transition-colors";
                  if (isUnpaid) rowBg = "bg-red-500/5 hover:bg-red-500/10 transition-colors";
                  else if (isPartial) rowBg = "bg-amber-500/5 hover:bg-amber-500/10 transition-colors";

                  return (
                    <tr key={inv.id} className={rowBg}>
                      <td className="py-3.5 px-6 font-semibold text-foreground font-mono">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-muted-foreground">
                        {inv.invoice_date}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-medium text-muted-foreground">
                        {finalAmt.toLocaleString()} IQD
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-medium text-muted-foreground">
                        {paidAmt.toLocaleString()} IQD
                      </td>
                      <td className={`py-3.5 px-6 text-right font-mono font-bold ${remaining > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {remaining.toLocaleString()} IQD
                      </td>
                      <td className="py-3.5 px-6 text-center">
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
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="inline-flex items-center justify-center h-7 px-2.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer text-[11px] font-medium"
                        >
                          View Invoice
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No sales invoices recorded for this customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. PAYMENT RECEIPTS HISTORY TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-card/60">
          <h3 className="font-semibold text-foreground text-sm tracking-tight flex items-center">
            <CreditCard className="w-4.5 h-4.5 mr-2 text-muted-foreground" />
            Payment Collection logs
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log records of cash installments and bank transfers received from this buyer
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-6 font-semibold">Payment Date</th>
                <th className="py-3 px-6 font-semibold text-right">Amount Received</th>
                <th className="py-3 px-6 font-semibold">Linked Invoice #</th>
                <th className="py-3 px-6 font-semibold">Payment Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground">
              {payments.length > 0 ? (
                payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-muted-foreground select-all">
                      {pay.payment_date}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-emerald-500">
                      {Number(pay.amount).toLocaleString()} IQD
                    </td>
                    <td className="py-3.5 px-6">
                      {pay.invoice_id ? (
                        <Link
                          href={`/dashboard/invoices/${pay.invoice_id}`}
                          className="font-mono text-primary hover:underline font-medium text-[11px]"
                        >
                          Invoice Link
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/45 italic">General Account Advance</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-muted-foreground max-w-sm truncate">
                      {pay.notes || <span className="italic text-muted-foreground/35">No notes recorded</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No installment collections logged for this customer.
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
