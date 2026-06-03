"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Item, Supplier } from "@/types";
import { createPurchaseAction } from "@/app/actions/purchases";
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Plus,
  Trash2,
  Info,
  Calendar,
  Layers,
  Calculator,
  Truck
} from "lucide-react";
import Link from "next/link";

type PurchaseFormRow = {
  item_id: string;
  quantity: number | "";
  buy_price: number | "";
  expiry_date: string;
};

export default function NewPurchaseForm({
  suppliers = [],
  catalogItems = []
}: {
  suppliers: Supplier[];
  catalogItems: Item[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1: Info states
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Step 2: Multi-Item rows state
  const [rows, setRows] = useState<PurchaseFormRow[]>([
    { item_id: "", quantity: "", buy_price: "", expiry_date: "" }
  ]);

  // Step 3: Payment state
  const [initialPayment, setInitialPayment] = useState<number | "">("");

  // Helper calculations
  const calculateTotal = () => {
    return rows.reduce((sum, row) => {
      const qty = Number(row.quantity || 0);
      const price = Number(row.buy_price || 0);
      return sum + qty * price;
    }, 0);
  };

  const orderTotal = calculateTotal();
  const payAmt = Number(initialPayment || 0);
  const remainingDebt = Math.max(0, orderTotal - payAmt);

  const handleAddRow = () => {
    setRows([...rows, { item_id: "", quantity: "", buy_price: "", expiry_date: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) {
      alert("A purchase order must contain at least one item.");
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof PurchaseFormRow, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill buy price if item changes
    if (field === "item_id") {
      const targetItem = catalogItems.find((item) => item.id === value);
      if (targetItem) {
        updated[index].buy_price = Number(targetItem.buy_price);
      }
    }

    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end Validations
    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    // Validate rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.item_id) {
        setError(`Row ${i + 1}: Please select an item.`);
        return;
      }
      if (!row.quantity || Number(row.quantity) <= 0) {
        setError(`Row ${i + 1}: Quantity must be greater than 0.`);
        return;
      }
      if (row.buy_price === "" || Number(row.buy_price) < 0) {
        setError(`Row ${i + 1}: Buy Price cannot be negative.`);
        return;
      }
    }

    if (payAmt < 0) {
      setError("Initial Payment amount cannot be negative.");
      return;
    }

    if (payAmt > orderTotal) {
      setError("Initial Payment cannot exceed the total purchase order amount.");
      return;
    }

    const payloadItems = rows.map((r) => ({
      item_id: r.item_id,
      quantity: Number(r.quantity),
      buy_price: Number(r.buy_price),
      expiry_date: r.expiry_date || null,
    }));

    startTransition(async () => {
      try {
        const { data: purchase, error: err } = await createPurchaseAction(
          supplierId,
          purchaseDate,
          payloadItems,
          payAmt,
          notes.trim() || null
        );

        if (err) {
          setError(err.message || "Failed to record purchase order.");
        } else if (purchase) {
          router.push(`/dashboard/purchases/${purchase.id}`);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="max-w-4xl bg-card border border-border rounded-xl shadow-md p-6 sm:p-8 select-none">
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          Record Supplier Purchase Order
        </h2>
        <Link
          href="/dashboard/purchases"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to list
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 mt-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PURCHASE INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Supplier Select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="supplier">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              id="supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer appearance-none"
            >
              <option value="">Select Supplier Source</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="date">
              Purchase Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="date"
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-semibold"
              />
            </div>
          </div>
        </div>

        {/* STEP 2: DYNAMIC ADD ITEMS LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 opacity-75" />
              Add Items Received
            </h3>
            <button
              type="button"
              onClick={handleAddRow}
              disabled={isPending}
              className="inline-flex items-center h-8 px-3 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Item Row
            </button>
          </div>

          <div className="border border-border/80 rounded-xl overflow-hidden bg-secondary/15 p-4 space-y-4">
            {rows.map((row, index) => {
              const qty = Number(row.quantity || 0);
              const price = Number(row.buy_price || 0);
              const subtotal = qty * price;

              return (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-card border border-border/60 p-4 rounded-lg relative group transition-all hover:border-border"
                >
                  {/* Select Item */}
                  <div className="flex-1 w-full space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block md:hidden">
                      Select Item
                    </label>
                    <select
                      value={row.item_id}
                      onChange={(e) => handleRowChange(index, "item_id", e.target.value)}
                      disabled={isPending}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer"
                    >
                      <option value="">Select Medical Item</option>
                      {catalogItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-full md:w-28 space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block md:hidden">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) =>
                        handleRowChange(
                          index,
                          "quantity",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      disabled={isPending}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-semibold"
                    />
                  </div>

                  {/* Buy Price */}
                  <div className="w-full md:w-36 space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block md:hidden">
                      Buy Price (IQD)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Buy Price"
                      value={row.buy_price}
                      onChange={(e) =>
                        handleRowChange(
                          index,
                          "buy_price",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      disabled={isPending}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-semibold"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="w-full md:w-40 space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block md:hidden">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={row.expiry_date}
                      onChange={(e) => handleRowChange(index, "expiry_date", e.target.value)}
                      disabled={isPending}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-semibold"
                    />
                  </div>

                  {/* Subtotal Display */}
                  <div className="w-full md:w-36 text-right px-2 py-2 select-none shrink-0 border-t md:border-t-0 border-border/40 mt-1 md:mt-0 pt-2 md:pt-0">
                    <span className="text-[10px] text-muted-foreground block md:hidden mb-0.5 text-left font-semibold uppercase tracking-wider">
                      Subtotal:
                    </span>
                    <span className="font-mono font-bold text-xs text-foreground block">
                      {subtotal.toLocaleString()} IQD
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    disabled={isPending}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer shrink-0 absolute top-3.5 right-4 md:static"
                    title="Remove Item Row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 3: INITIAL PAYMENT & STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Notes & Payments */}
          <div className="space-y-4">
            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground" htmlFor="notes">
                Purchase order Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Log shipping reference, invoice receipt number, delivery status, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground resize-none"
              />
            </div>

            {/* Initial Payment */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground" htmlFor="initial-payment">
                Initial Payment made now (IQD)
              </label>
              <input
                id="initial-payment"
                type="number"
                min="0"
                placeholder="0 (Leave empty if fully on credit)"
                value={initialPayment}
                onChange={(e) =>
                  setInitialPayment(e.target.value === "" ? "" : Number(e.target.value))
                }
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-bold text-emerald-500"
              />
            </div>
          </div>

          {/* Running Totals calculator ledger */}
          <div className="bg-secondary/35 border border-border/80 rounded-xl p-6 space-y-4 select-none">
            <div className="flex items-center space-x-2 text-foreground font-semibold border-b border-border pb-3">
              <Calculator className="w-4.5 h-4.5 text-primary" />
              <h4 className="text-xs uppercase tracking-wider">Purchase balance calculations</h4>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Total order subtotal:</span>
                <span className="font-mono font-bold text-foreground">
                  {orderTotal.toLocaleString()} IQD
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-500 font-medium">
                <span>Payment recorded now:</span>
                <span className="font-mono font-bold">
                  -{payAmt.toLocaleString()} IQD
                </span>
              </div>
              <div className="border-t border-border/80 my-2 pt-2 flex justify-between items-center text-base font-bold">
                <span className="text-muted-foreground">Owed supplier debt:</span>
                <span className={`font-mono ${remainingDebt > 0 ? "text-red-500" : "text-foreground"}`}>
                  {remainingDebt.toLocaleString()} IQD
                </span>
              </div>
            </div>

            {/* Status predictor tag */}
            <div className="flex justify-end pt-2 text-[10px] font-bold uppercase tracking-wider">
              {remainingDebt === 0 && orderTotal > 0 ? (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full">
                  Fully Paid
                </span>
              ) : payAmt > 0 && remainingDebt > 0 ? (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                  Partial Installment
                </span>
              ) : orderTotal > 0 ? (
                <span className="bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
                  Full Supplier Credit
                </span>
              ) : (
                <span className="text-muted-foreground/45 italic">Waiting for items</span>
              )}
            </div>
          </div>
        </div>

        {/* Warning about automatic triggers */}
        <div className="p-3.5 rounded-lg bg-secondary/50 border border-border/80 text-[11px] text-muted-foreground flex items-center space-x-2.5">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>Automatic Uptime triggers active:</strong> Submitting this purchase order will automatically increment warehouse stock counts for the catalog items in real-time.
          </span>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-border flex justify-end gap-3 select-none">
          <Link
            href="/dashboard/purchases"
            className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending || orderTotal <= 0}
            className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 cursor-pointer shadow-md select-none active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recording Order...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Record Purchase
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
