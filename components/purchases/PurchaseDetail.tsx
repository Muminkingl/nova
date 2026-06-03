"use client";

import { useState } from "react";
import Link from "next/link";
import { Purchase, PurchaseItem, SupplierPayment } from "@/types";
import SupplierPaymentModal from "../suppliers/SupplierPaymentModal";
import {
  ArrowLeft,
  CreditCard,
  Layers,
  History,
  Info,
  Calendar,
  DollarSign,
  ClipboardList
} from "lucide-react";

export default function PurchaseDetail({
  purchase,
  items = [],
  payments = [],
  onRefresh
}: {
  purchase: Purchase & { suppliers: { id: string; name: string } | null };
  items: (PurchaseItem & { items: { name: string; unit: string } | null })[];
  payments: SupplierPayment[];
  onRefresh: () => void;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const total = Number(purchase.total_amount || 0);
  const paid = Number(purchase.amount_paid || 0);
  const remaining = Math.max(0, total - paid);
  const isPaid = purchase.status === "paid";
  const isPartial = purchase.status === "partial";

  const supplier = purchase.suppliers;

  return (
    <div className="space-y-8 select-none animate-in fade-in duration-300">
      {/* Payment Modal */}
      {showPaymentModal && supplier && (
        <SupplierPaymentModal
          supplierId={supplier.id}
          supplierName={supplier.name}
          unpaidPurchases={[{
            id: purchase.id,
            purchase_date: purchase.purchase_date,
            total_amount: total,
            amount_paid: paid,
          }]}
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
            <Link href="/dashboard/purchases" className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Purchases List
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Purchase Order Details
          </h1>
          <p className="text-xs text-muted-foreground">
            Supplier:{" "}
            {supplier ? (
              <Link
                href={`/dashboard/suppliers/${supplier.id}`}
                className="font-semibold text-primary hover:underline underline-offset-2"
              >
                {supplier.name}
              </Link>
            ) : (
              <span className="italic">Unknown</span>
            )}
            {" • Date: "}
            <span className="font-semibold">{purchase.purchase_date}</span>
          </p>
        </div>

        {remaining > 0 && supplier && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-[0.98] shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Record Payment
          </button>
        )}
      </div>

      {/* 1. FINANCIAL KPI DECKS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Cost */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Total Amount
            </span>
            <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {total.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Invoice order total cost</span>
          </div>
        </div>

        {/* Amount Paid */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Amount Paid
            </span>
            <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {paid.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Recorded payment installments</span>
          </div>
        </div>

        {/* Remaining Liabilities */}
        <div className={`bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all group ${
          remaining > 0 
            ? "border-red-500/30 hover:border-red-500/50" 
            : "border-border hover:border-border/80"
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Remaining Balance
            </span>
            <div className={`p-2 rounded-lg transition-all ${
              remaining > 0 
                ? "bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white" 
                : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground"
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className={`text-2xl font-bold tracking-tight ${remaining > 0 ? "text-red-500" : "text-foreground"}`}>
              {remaining.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Outstanding credit liabilities</span>
          </div>
        </div>
      </div>

      {/* 2. ITEMS RECEIVED TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-card/60">
          <h3 className="font-semibold text-foreground text-sm tracking-tight flex items-center">
            <Layers className="w-4.5 h-4.5 mr-2 text-muted-foreground" />
            Purchased Batch Items
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            List of batch items received and added to warehouse inventories
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-6 font-semibold">Medical Item</th>
                <th className="py-3 px-6 font-semibold">Unit Type</th>
                <th className="py-3 px-6 font-semibold text-center">Quantity</th>
                <th className="py-3 px-6 font-semibold text-right">Buy Price</th>
                <th className="py-3 px-6 font-semibold">Expiry Date</th>
                <th className="py-3 px-6 font-semibold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground font-medium">
              {items.map((row) => {
                const sub = Number(row.quantity || 0) * Number(row.buy_price || 0);

                return (
                  <tr key={row.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-foreground">
                      {row.items?.name || <span className="italic text-muted-foreground/35">Uncataloged Product</span>}
                    </td>
                    <td className="py-3.5 px-6 text-muted-foreground">
                      {row.items?.unit || <span className="italic text-muted-foreground/35">N/A</span>}
                    </td>
                    <td className="py-3.5 px-6 text-center font-mono font-bold">
                      {row.quantity}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-muted-foreground">
                      {Number(row.buy_price).toLocaleString()} IQD
                    </td>
                    <td className="py-3.5 px-6 text-muted-foreground font-medium">
                      {row.expiry_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          {row.expiry_date}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/45 italic">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-foreground">
                      {sub.toLocaleString()} IQD
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. PAYMENTS ON THIS PURCHASE HISTORY */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-card/60">
          <h3 className="font-semibold text-foreground text-sm tracking-tight flex items-center">
            <History className="w-4.5 h-4.5 mr-2 text-muted-foreground" />
            Installment Payment History
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log records of payments recorded directly against this purchase order
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-6 font-semibold">Payment Date</th>
                <th className="py-3 px-6 font-semibold text-right">Amount Paid</th>
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
                    <td className="py-3.5 px-6 text-muted-foreground max-w-lg truncate">
                      {pay.notes || <span className="italic text-muted-foreground/35">No notes recorded</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    No installment records logged for this purchase order yet.
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
