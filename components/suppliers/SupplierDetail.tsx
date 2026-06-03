"use client";

import { useState } from "react";
import Link from "next/link";
import { Supplier, Purchase, SupplierPayment } from "@/types";
import SupplierPaymentModal from "./SupplierPaymentModal";
import {
  ArrowLeft,
  Edit,
  Plus,
  CreditCard,
  ClipboardList,
  AlertTriangle,
  History,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  Inbox
} from "lucide-react";

export default function SupplierDetail({
  supplier,
  totalPurchased,
  totalPaid,
  outstandingDebt,
  purchases = [],
  payments = [],
  onRefresh
}: {
  supplier: Supplier;
  totalPurchased: number;
  totalPaid: number;
  outstandingDebt: number;
  purchases: Purchase[];
  payments: SupplierPayment[];
  onRefresh: () => void;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Extract unpaid or partially paid purchases to seed payment modal
  const unpaidPurchases = purchases
    .filter((p) => p.status === "unpaid" || p.status === "partial")
    .map((p) => ({
      id: p.id,
      purchase_date: p.purchase_date,
      total_amount: Number(p.total_amount),
      amount_paid: Number(p.amount_paid),
    }));

  const hasDebt = outstandingDebt > 0;

  return (
    <div className="space-y-8 select-none animate-in fade-in duration-300">
      {/* SupplierPaymentModal popup */}
      {showPaymentModal && (
        <SupplierPaymentModal
          supplierId={supplier.id}
          supplierName={supplier.name}
          unpaidPurchases={unpaidPurchases}
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
            <Link href="/dashboard/suppliers" className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Suppliers List
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{supplier.name}</h1>
          <p className="text-xs text-muted-foreground max-w-xl">
            {supplier.address ? `${supplier.address}` : "No address specified."}
            {supplier.phone && ` • Phone: ${supplier.phone}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 select-none">
          <Link
            href={`/dashboard/suppliers/${supplier.id}/edit`}
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
      {supplier.notes && (
        <div className="bg-secondary/20 border border-border/80 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="w-4.5 h-4.5 text-primary shrink-0" />
          <div>
            <strong className="text-foreground block mb-0.5">Supplier Contract Notes:</strong>
            {supplier.notes}
          </div>
        </div>
      )}

      {/* 1. FINANCIAL SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Purchased */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Total Purchased
            </span>
            <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {totalPurchased.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Accumulated purchase orders</span>
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
            <span className="text-xs text-muted-foreground block font-medium">Instalments & advance paid</span>
          </div>
        </div>

        {/* Outstanding Liabilities (Primary alert highlights) */}
        <div className={`bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all group ${
          hasDebt 
            ? "border-red-500/30 hover:border-red-500/50" 
            : "border-border hover:border-border/80"
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Outstanding Debt
            </span>
            <div className={`p-2 rounded-lg transition-all ${
              hasDebt 
                ? "bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white" 
                : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground"
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className={`text-2xl font-bold tracking-tight ${hasDebt ? "text-red-500" : "text-foreground"}`}>
              {outstandingDebt.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Pending outstanding balances</span>
          </div>
        </div>
      </div>

      {/* 2. PURCHASE HISTORY TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-card/60">
          <h3 className="font-semibold text-foreground text-sm tracking-tight flex items-center">
            <History className="w-4.5 h-4.5 mr-2 text-muted-foreground" />
            Purchase History
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Logs of all purchases recorded from this supplier source
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-6 font-semibold">Date</th>
                <th className="py-3 px-6 font-semibold text-right">Total Amount</th>
                <th className="py-3 px-6 font-semibold text-right">Amount Paid</th>
                <th className="py-3 px-6 font-semibold text-right">Remaining Due</th>
                <th className="py-3 px-6 font-semibold text-center">Payment Status</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground">
              {purchases.length > 0 ? (
                purchases.map((p) => {
                  const totalAmt = Number(p.total_amount || 0);
                  const paidAmt = Number(p.amount_paid || 0);
                  const remaining = Math.max(0, totalAmt - paidAmt);

                  const isUnpaid = p.status === "unpaid";
                  const isPartial = p.status === "partial";
                  const isPaid = p.status === "paid";

                  let rowBg = "hover:bg-secondary/10 transition-colors";
                  if (isUnpaid) rowBg = "bg-red-500/5 hover:bg-red-500/10 transition-colors";
                  else if (isPartial) rowBg = "bg-amber-500/5 hover:bg-amber-500/10 transition-colors";

                  return (
                    <tr key={p.id} className={rowBg}>
                      <td className="py-3.5 px-6 font-medium text-muted-foreground select-all">
                        {p.purchase_date}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-medium text-muted-foreground">
                        {totalAmt.toLocaleString()} IQD
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-medium text-muted-foreground">
                        {paidAmt.toLocaleString()} IQD
                      </td>
                      <td className={`py-3.5 px-6 text-right font-mono font-bold ${remaining > 0 ? "text-red-500" : "text-muted-foreground"}`}>
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
                          href={`/dashboard/purchases/${p.id}`}
                          className="inline-flex items-center justify-center h-7 px-2.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer text-[11px] font-medium"
                        >
                          View Order
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No purchase orders recorded for this supplier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. PAYMENT INSTALMENTS HISTORY TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-card/60">
          <h3 className="font-semibold text-foreground text-sm tracking-tight flex items-center">
            <CreditCard className="w-4.5 h-4.5 mr-2 text-muted-foreground" />
            Payment Installment Logs
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log records of cash installments and bank transfers paid to this supplier
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-6 font-semibold">Payment Date</th>
                <th className="py-3 px-6 font-semibold text-right">Amount Paid</th>
                <th className="py-3 px-6 font-semibold">Linked Purchase Order ID</th>
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
                      {pay.purchase_id ? (
                        <Link
                          href={`/dashboard/purchases/${pay.purchase_id}`}
                          className="font-mono text-primary hover:underline font-medium text-[11px]"
                        >
                          {pay.purchase_id.substring(0, 8)}...
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/45 italic">General Advance Account</span>
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
                    No installment records logged for this supplier.
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
