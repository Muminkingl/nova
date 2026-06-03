"use client";

import { useState, useTransition } from "react";
import { recordPaymentAction } from "@/app/actions/purchases";
import {
  X,
  CreditCard,
  Loader2,
  AlertTriangle,
  Calendar,
  FileText
} from "lucide-react";

export default function SupplierPaymentModal({
  supplierId,
  supplierName,
  unpaidPurchases = [],
  onClose,
  onSuccess
}: {
  supplierId: string;
  supplierName: string;
  unpaidPurchases: { id: string; purchase_date: string; total_amount: number; amount_paid: number }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchaseId, setPurchaseId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const selectedPurchase = unpaidPurchases.find((p) => p.id === purchaseId);
  const maxAllowed = selectedPurchase
    ? Number(selectedPurchase.total_amount) - Number(selectedPurchase.amount_paid)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payAmount = Number(amount || 0);

    if (payAmount <= 0) {
      setError("Payment amount must be greater than 0.");
      return;
    }

    if (maxAllowed && payAmount > maxAllowed) {
      setError(
        `Payment exceeds the remaining balance on this purchase order (${maxAllowed.toLocaleString()} IQD).`
      );
      return;
    }

    startTransition(async () => {
      try {
        const { error: err } = await recordPaymentAction(
          supplierId,
          purchaseId || null,
          payAmount,
          paymentDate,
          notes.trim() || null
        );

        if (err) {
          setError(err.message || "Failed to record payment.");
        } else {
          onSuccess();
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-secondary/20">
          <div className="flex items-center space-x-2 text-foreground">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm">Record Supplier Payment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Supplier Display */}
          <div className="bg-secondary/40 rounded-lg p-3 border border-border/40 text-xs">
            <span className="text-muted-foreground block font-medium">Paying Supplier:</span>
            <span className="text-foreground font-bold text-sm mt-0.5 block">{supplierName}</span>
          </div>

          {/* 1. Linked Purchase Order */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="link-purchase">
              Link to Purchase Order (Optional)
            </label>
            <select
              id="link-purchase"
              value={purchaseId}
              onChange={(e) => setPurchaseId(e.target.value)}
              disabled={isPending}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer appearance-none"
            >
              <option value="">General Payment / Advance Account</option>
              {unpaidPurchases.map((p) => {
                const remaining = Number(p.total_amount) - Number(p.amount_paid);
                return (
                  <option key={p.id} value={p.id}>
                    {p.purchase_date} — Due: {remaining.toLocaleString()} IQD (Total: {Number(p.total_amount).toLocaleString()})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="pay-amount">
              Payment Amount (IQD) <span className="text-red-500">*</span>
            </label>
            <input
              id="pay-amount"
              type="number"
              required
              min="1"
              placeholder={maxAllowed ? `Max: ${maxAllowed}` : "Enter amount in dinars"}
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={isPending}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-bold"
            />
          </div>

          {/* 3. Payment Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="pay-date">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="pay-date"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={isPending}
                className="flex h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-semibold"
              />
            </div>
          </div>

          {/* 4. Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="pay-notes">
              Payment Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <textarea
                id="pay-notes"
                rows={2}
                placeholder="e.g. Paid in cash, bank transfer reference, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                className="flex w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex justify-end gap-2.5 select-none">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="inline-flex items-center justify-center h-9 px-3.5 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Record Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
