"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Item, Customer } from "@/types";
import { createInvoiceAction } from "@/app/actions/invoices";
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
  FileText
} from "lucide-react";
import Link from "next/link";

type InvoiceFormRow = {
  item_id: string;
  quantity: number | "";
  sell_price: number | "";
  discount_percent: number;
};

export default function NewInvoiceForm({
  customers = [],
  catalogItems = []
}: {
  customers: Customer[];
  catalogItems: Item[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1: Info states
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Step 2: Multi-Item rows state
  const [rows, setRows] = useState<InvoiceFormRow[]>([
    { item_id: "", quantity: "", sell_price: "", discount_percent: 0 }
  ]);

  // Step 3: Payment state
  const [initialPayment, setInitialPayment] = useState<number | "">("");

  // Filter catalog items to only show those with stock_qty > 0 (as per PRD)
  const itemsInStock = catalogItems.filter((item) => Number(item.stock_qty || 0) > 0);

  // Helpers
  const calculateTotals = () => {
    let subtotal = 0;
    let discount = 0;

    rows.forEach((row) => {
      const qty = Number(row.quantity || 0);
      const price = Number(row.sell_price || 0);
      const dPercent = Number(row.discount_percent || 0);

      const rowSub = qty * price;
      const rowDisc = rowSub * (dPercent / 100);

      subtotal += rowSub;
      discount += rowDisc;
    });

    const final = subtotal - discount;
    return { subtotal, discount, final };
  };

  const { subtotal: orderSubtotal, discount: orderDiscount, final: orderFinal } = calculateTotals();
  const payAmt = Number(initialPayment || 0);
  const remainingDebt = Math.max(0, orderFinal - payAmt);

  const handleAddRow = () => {
    setRows([...rows, { item_id: "", quantity: "", sell_price: "", discount_percent: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) {
      alert("An invoice must contain at least one item.");
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof InvoiceFormRow, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill sell price and set validation limit if item changes
    if (field === "item_id") {
      const targetItem = catalogItems.find((item) => item.id === value);
      if (targetItem) {
        updated[index].sell_price = Number(targetItem.sell_price);
      }
    }

    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end Validations
    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    // Validate rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.item_id) {
        setError(`Row ${i + 1}: Please select an item.`);
        return;
      }

      const targetItem = catalogItems.find((item) => item.id === row.item_id);
      const availableStock = targetItem ? Number(targetItem.stock_qty || 0) : 0;

      if (!row.quantity || Number(row.quantity) <= 0) {
        setError(`Row ${i + 1}: Quantity must be greater than 0.`);
        return;
      }

      if (Number(row.quantity) > availableStock) {
        setError(
          `Row ${i + 1}: Quantity entered (${row.quantity}) exceeds available stock (${availableStock} ${targetItem?.unit || "units"}).`
        );
        return;
      }

      if (row.sell_price === "" || Number(row.sell_price) < 0) {
        setError(`Row ${i + 1}: Sell Price cannot be negative.`);
        return;
      }

      if (Number(row.discount_percent) < 0 || Number(row.discount_percent) > 100) {
        setError(`Row ${i + 1}: Discount % must be between 0 and 100.`);
        return;
      }
    }

    if (payAmt < 0) {
      setError("Initial Payment amount cannot be negative.");
      return;
    }

    if (payAmt > orderFinal) {
      setError("Initial Payment cannot exceed the final invoice amount.");
      return;
    }

    const payloadItems = rows.map((r) => ({
      item_id: r.item_id,
      quantity: Number(r.quantity),
      sell_price: Number(r.sell_price),
      discount_percent: Number(r.discount_percent || 0),
    }));

    startTransition(async () => {
      try {
        const { data: invoice, error: err } = await createInvoiceAction(
          customerId,
          invoiceDate,
          payloadItems,
          payAmt,
          notes.trim() || null
        );

        if (err) {
          setError(err.message || "Failed to create sales invoice.");
        } else if (invoice) {
          router.push(`/dashboard/invoices/${invoice.id}`);
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
          <FileText className="w-5 h-5 text-primary" />
          Create New Sales Invoice
        </h2>
        <Link
          href="/dashboard/invoices"
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

        {/* STEP 1: INVOICE INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Customer select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="customer">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              id="customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer appearance-none"
            >
              <option value="">Select Customer / Facility</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="date">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="date"
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
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
              Invoice Item Lines
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
              const targetItem = catalogItems.find((item) => item.id === row.item_id);
              const availableStock = targetItem ? Number(targetItem.stock_qty || 0) : 0;

              const qty = Number(row.quantity || 0);
              const price = Number(row.sell_price || 0);
              const dPercent = Number(row.discount_percent || 0);

              const sub = qty * price;
              const rowSubtotal = sub * (1 - dPercent / 100);

              // Stock warning trigger
              const exceedsStock = qty > availableStock;

              return (
                <div
                  key={index}
                  className={`flex flex-col xl:flex-row gap-3 items-end xl:items-center bg-card border p-4 rounded-lg relative group transition-all ${
                    exceedsStock
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  {/* Select Item */}
                  <div className="flex-1 w-full space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block xl:hidden">
                      Select Item
                    </label>
                    <select
                      value={row.item_id}
                      onChange={(e) => handleRowChange(index, "item_id", e.target.value)}
                      disabled={isPending}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer"
                    >
                      <option value="">Select Catalog Item</option>
                      {/* Only list items that are in stock per PRD */}
                      {itemsInStock.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stock: {item.stock_qty} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-full xl:w-28 space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block xl:hidden">
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
                      className={`flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-semibold ${
                        exceedsStock ? "border-red-500 focus-visible:ring-red-500" : "border-input"
                      }`}
                    />
                  </div>

                  {/* Sell Price */}
                  <div className="w-full xl:w-32 space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block xl:hidden">
                      Sell Price (IQD)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Price"
                      value={row.sell_price}
                      onChange={(e) =>
                        handleRowChange(
                          index,
                          "sell_price",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      disabled={isPending}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-semibold"
                    />
                  </div>

                  {/* Discount % */}
                  <div className="w-full xl:w-24 space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block xl:hidden">
                      Discount %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0%"
                      value={row.discount_percent || ""}
                      onChange={(e) =>
                        handleRowChange(
                          index,
                          "discount_percent",
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      disabled={isPending}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-semibold"
                    />
                  </div>

                  {/* Subtotal Display */}
                  <div className="w-full xl:w-36 text-right px-2 py-2 select-none shrink-0 border-t xl:border-t-0 border-border/40 mt-1 xl:mt-0 pt-2 xl:pt-0">
                    <span className="text-[10px] text-muted-foreground block xl:hidden mb-0.5 text-left font-semibold uppercase tracking-wider">
                      Subtotal:
                    </span>
                    <span className="font-mono font-bold text-xs text-foreground block">
                      {rowSubtotal.toLocaleString()} IQD
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    disabled={isPending}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer shrink-0 absolute top-3.5 right-4 xl:static"
                    title="Remove Item Row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Stock warning message */}
                  {exceedsStock && (
                    <span className="text-[10px] font-bold text-red-500 absolute -bottom-4.5 left-4 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 animate-pulse" />
                      Exceeds available stock level ({availableStock} remaining)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 3: DISCOUNTS & INITIAL PAYMENT STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Notes & Payment */}
          <div className="space-y-4">
            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground" htmlFor="notes">
                Invoice billing Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Log purchase order reference, delivery details, payment agreements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground resize-none"
              />
            </div>

            {/* Initial Payment */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground" htmlFor="initial-payment">
                Initial Payment received now (IQD)
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
              <h4 className="text-xs uppercase tracking-wider font-bold">Billing Calculations</h4>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal before discount:</span>
                <span className="font-mono font-bold text-foreground">
                  {(orderSubtotal + orderDiscount).toLocaleString()} IQD
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-500 font-medium">
                <span>Discount applied:</span>
                <span className="font-mono font-bold">
                  -{orderDiscount.toLocaleString()} IQD
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Final Invoice Amount:</span>
                <span className="font-mono font-bold text-foreground">
                  {orderFinal.toLocaleString()} IQD
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-500 font-medium">
                <span>Payment received now:</span>
                <span className="font-mono font-bold">
                  -{payAmt.toLocaleString()} IQD
                </span>
              </div>
              <div className="border-t border-border/80 my-2 pt-2 flex justify-between items-center text-base font-bold">
                <span className="text-muted-foreground">Owed customer balance:</span>
                <span className={`font-mono ${remainingDebt > 0 ? "text-amber-500" : "text-foreground"}`}>
                  {remainingDebt.toLocaleString()} IQD
                </span>
              </div>
            </div>

            {/* Status predictor tag */}
            <div className="flex justify-end pt-2 text-[10px] font-bold uppercase tracking-wider">
              {remainingDebt === 0 && orderFinal > 0 ? (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full">
                  Fully Paid
                </span>
              ) : payAmt > 0 && remainingDebt > 0 ? (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold">
                  Partial Installment
                </span>
              ) : orderFinal > 0 ? (
                <span className="bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
                  Full Customer Credit
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
            <strong>Automatic inventory triggers active:</strong> Submitting this invoice will automatically decrease warehouse stock levels. Negative stock quantities are blocked by the database layer.
          </span>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-border flex justify-end gap-3 select-none">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending || orderFinal <= 0}
            className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 cursor-pointer shadow-md select-none active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Invoice...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
