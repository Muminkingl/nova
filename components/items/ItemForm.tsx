"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Item, ItemFormData } from "@/types";
import { createItemAction, updateItemAction } from "@/app/actions/items";
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingUp,
  Tag
} from "lucide-react";
import Link from "next/link";

const UNITS = ["Box", "Piece", "Vial", "Pack", "Bottle", "Roll", "Other"];

export default function ItemForm({
  item,
  existingCategories = []
}: {
  item?: Item; // If provided, we are in EDIT mode
  existingCategories?: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(item?.name || "");
  const [categoryMode, setCategoryMode] = useState<"select" | "custom">(
    item?.category && !existingCategories.includes(item.category) ? "custom" : "select"
  );
  const [selectedCategory, setSelectedCategory] = useState(item?.category || "");
  const [customCategory, setCustomCategory] = useState(
    item?.category && !existingCategories.includes(item.category) ? item.category : ""
  );
  const [unit, setUnit] = useState(item?.unit || "Box");
  const [buyPrice, setBuyPrice] = useState<number | "">(item?.buy_price ?? "");
  const [sellPrice, setSellPrice] = useState<number | "">(item?.sell_price ?? "");
  const [openingStock, setOpeningStock] = useState<number | "">(item?.stock_qty ?? 0);
  const [expiryDate, setExpiryDate] = useState(item?.expiry_date || "");
  const [minStockAlert, setMinStockAlert] = useState<number>(item?.min_stock_alert ?? 10);

  // Helpers
  const isEditMode = !!item;
  const currentCategory = categoryMode === "custom" ? customCategory.trim() : selectedCategory;

  // Live profit calculations
  const buyNum = Number(buyPrice || 0);
  const sellNum = Number(sellPrice || 0);
  const profit = sellNum - buyNum;
  const hasNegativeProfit = sellNum > 0 && profit < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    if (!name.trim()) {
      setError("Item Name is required.");
      return;
    }
    if (buyNum < 0 || sellNum < 0) {
      setError("Prices cannot be negative.");
      return;
    }
    if (sellNum < buyNum) {
      setError("Sell price must be greater than or equal to the buy price.");
      return;
    }
    if (!isEditMode && Number(openingStock) < 0) {
      setError("Opening Stock cannot be negative.");
      return;
    }

    const payload: ItemFormData = {
      name: name.trim(),
      category: currentCategory || null,
      unit,
      buy_price: buyNum,
      sell_price: sellNum,
      stock_qty: isEditMode ? item.stock_qty : Number(openingStock || 0),
      expiry_date: expiryDate || null,
      min_stock_alert: Number(minStockAlert),
    };

    startTransition(async () => {
      try {
        if (isEditMode) {
          const { error: err } = await updateItemAction(item.id, payload);
          if (err) {
            setError(err.message || "Failed to update item.");
          } else {
            router.push("/dashboard/items");
          }
        } else {
          const { error: err } = await createItemAction(payload);
          if (err) {
            setError(err.message || "Failed to create item.");
          } else {
            router.push("/dashboard/items");
          }
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="max-w-2xl bg-card border border-border rounded-xl shadow-md p-6 sm:p-8 select-none">
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">
          {isEditMode ? `Edit Product: ${item.name}` : "Create New Medical Item"}
        </h2>
        <Link
          href="/dashboard/items"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to list
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {/* Error message card */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Item Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground" htmlFor="item-name">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            id="item-name"
            type="text"
            required
            placeholder="e.g. Sodium Chloride 0.9% IV 500ml"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-colors disabled:opacity-50"
          />
        </div>

        {/* 2. Category & Unit (Row Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-muted-foreground" htmlFor="category">
                Category
              </label>
              <button
                type="button"
                onClick={() =>
                  setCategoryMode(categoryMode === "select" ? "custom" : "select")
                }
                className="text-[11px] font-semibold text-primary hover:underline underline-offset-4 cursor-pointer"
              >
                {categoryMode === "select" ? "+ Add Custom" : "Select List"}
              </button>
            </div>

            {categoryMode === "select" ? (
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isPending}
                  className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-8 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer"
                >
                  <option value="">Uncategorized</option>
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Enter custom category..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm placeholder:text-muted-foreground/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground transition-colors"
              />
            )}
          </div>

          {/* Unit selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="unit">
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Pricing Grid & Profit Preview */}
        <div className="p-4 rounded-xl bg-secondary/35 border border-border/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Buy Price */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground" htmlFor="buy-price">
                Buy Price (IQD) <span className="text-red-500">*</span>
              </label>
              <input
                id="buy-price"
                type="number"
                step="0.01"
                required
                placeholder="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-semibold"
              />
            </div>

            {/* Sell Price */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground" htmlFor="sell-price">
                Sell Price (IQD) <span className="text-red-500">*</span>
              </label>
              <input
                id="sell-price"
                type="number"
                step="0.01"
                required
                placeholder="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-semibold"
              />
            </div>
          </div>

          {/* Profit Live Calculation Banner */}
          <div className="border-t border-border/60 pt-3.5 flex justify-between items-center text-xs font-semibold">
            <span className="text-muted-foreground flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 opacity-70" />
              Live Profit Preview:
            </span>
            {hasNegativeProfit ? (
              <span className="text-destructive font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                Negative Profit (-{Math.abs(profit).toLocaleString()} IQD)
              </span>
            ) : buyNum > 0 && sellNum > 0 ? (
              <span className="text-emerald-500 font-bold font-mono">
                +{profit.toLocaleString()} IQD / unit
              </span>
            ) : (
              <span className="text-muted-foreground italic">Fill in buy & sell price</span>
            )}
          </div>
        </div>

        {/* 4. Stock Levels & Lock indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Opening Stock */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="stock-qty">
              Opening Stock quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="stock-qty"
              type="number"
              required
              disabled={isEditMode || isPending}
              placeholder="e.g. 100"
              value={openingStock}
              onChange={(e) => setOpeningStock(e.target.value === "" ? "" : Number(e.target.value))}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-semibold disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-secondary/40"
            />
          </div>

          {/* Min Stock Alert */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="min-alert">
              Min Stock Alert threshold
            </label>
            <input
              id="min-alert"
              type="number"
              placeholder="10"
              value={minStockAlert}
              onChange={(e) => setMinStockAlert(Number(e.target.value))}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-mono font-semibold"
            />
          </div>
        </div>

        {/* Edit lock warning banner */}
        {isEditMode && (
          <div className="p-3.5 rounded-lg bg-secondary/50 border border-border/80 text-[11px] text-muted-foreground flex items-center space-x-2.5">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Stock locked:</strong> Stock quantity is managed automatically through purchases and sales.
            </span>
          </div>
        )}

        {/* 5. Expiry Date */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground" htmlFor="expiry-date">
            Expiry Date (Optional)
          </label>
          <input
            id="expiry-date"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={isPending}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-semibold"
          />
        </div>

        {/* Submit action panel */}
        <div className="pt-4 border-t border-border flex justify-end gap-3 select-none">
          <Link
            href="/dashboard/items"
            className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 cursor-pointer shadow-md select-none active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? "Save Changes" : "Create Item"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
