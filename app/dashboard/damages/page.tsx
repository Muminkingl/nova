"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getDamagesAction, createDamageAction } from "@/app/actions/damages";
import { getItemsAction } from "@/app/actions/items";
import { DamageWithItem } from "@/lib/supabase/damages";
import { Item } from "@/types";
import {
  Flame,
  PlusCircle,
  Search,
  Calendar,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
  Info
} from "lucide-react";

function DamagesPageContent() {
  const [damages, setDamages] = useState<DamageWithItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const preselectItemId = searchParams.get("preselect_item_id");
  const preselectReason = searchParams.get("preselect_reason");

  // Filters state
  const [reasonFilter, setReasonFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Form state
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<"expired" | "damaged" | "lost" | "other">("damaged");
  const [notes, setNotes] = useState("");
  const [damageDate, setDamageDate] = useState(new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (preselectItemId) {
      setSelectedItemId(preselectItemId);
      if (preselectReason === "expired" || preselectReason === "damaged" || preselectReason === "lost" || preselectReason === "other") {
        setReason(preselectReason);
      }
      setShowModal(true);
    }
  }, [preselectItemId, preselectReason]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = {
        reason: reasonFilter !== "all" ? reasonFilter : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      };
      const [dmgRes, itemsRes] = await Promise.all([
        getDamagesAction(filters),
        getItemsAction(),
      ]);

      if (dmgRes.data) setDamages(dmgRes.data);
      if (itemsRes.data) {
        // Only show items with stock > 0 in the write-off selector
        setItems(itemsRes.data.filter((item) => item.stock_qty > 0));
      }
    } catch (err) {
      console.error("Failed to load damages log:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reasonFilter, dateFrom, dateTo]);

  // Selected item info for live validation
  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleCreateDamage = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!selectedItemId) {
      setFormError("Please select an item.");
      return;
    }
    const writeOffQty = Number(qty);
    if (!qty || writeOffQty <= 0 || isNaN(writeOffQty)) {
      setFormError("Please enter a valid write-off quantity.");
      return;
    }

    if (selectedItem && selectedItem.stock_qty < writeOffQty) {
      setFormError(`Cannot write off ${writeOffQty} units; only ${selectedItem.stock_qty} units are in stock.`);
      return;
    }

    startTransition(async () => {
      const res = await createDamageAction({
        item_id: selectedItemId,
        quantity: writeOffQty,
        reason,
        notes: notes || null,
        damage_date: damageDate,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to record damage log.");
      } else {
        setSuccessMsg("Write-off logged successfully. Stock decremented.");
        // Clear form
        setSelectedItemId("");
        setQty("");
        setNotes("");
        setDamageDate(new Date().toISOString().split("T")[0]);
        
        // Reload list
        loadData();
        
        // Close modal after short delay
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg("");
        }, 1500);
      }
    });
  };

  // Total Losses calculation
  const totalLossVal = damages.reduce((sum, d) => sum + Number(d.cost || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 overflow-y-auto pb-10 max-h-[calc(100vh-4rem)] px-8 py-6">
      {/* Page Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Damages & Losses</h1>
          <p className="text-sm text-muted-foreground">
            Inventory write-offs due to expiration, damage, or loss. Stock levels decrement automatically.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Record Damage
        </button>
      </div>

      {/* Loss Summary Card */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between max-w-md select-none shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500 animate-pulse">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Cumulative Loss (In IQD)
            </span>
            <span className="text-2xl font-black text-red-500 block mt-1">
              {totalLossVal.toLocaleString()} IQD
            </span>
          </div>
        </div>
        <div className="text-right text-[10px] text-muted-foreground font-medium">
          Based on cost of goods <br /> written off permanently
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-card/45 border border-border/80 rounded-xl p-4 flex flex-wrap gap-4 items-end select-none">
        {/* Filter by Reason */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Reason Category
          </label>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
          >
            <option value="all">All Reasons</option>
            <option value="expired">Expired</option>
            <option value="damaged">Damaged</option>
            <option value="lost">Lost</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Filter from Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary pr-8"
            />
          </div>
        </div>

        {/* Filter to Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary pr-8"
            />
          </div>
        </div>

        {/* Reset Filters */}
        {(reasonFilter !== "all" || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setReasonFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
            className="h-9 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid Table Layout */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-48 flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium">Loading write-off registry...</span>
          </div>
        ) : damages.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground space-y-2 select-none">
            <Trash2 className="w-8 h-8 opacity-40 text-muted-foreground" />
            <p className="text-xs font-medium">No inventory write-off records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-muted-foreground select-none font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3.5">Write-off Date</th>
                  <th className="px-6 py-3.5">Item Name</th>
                  <th className="px-6 py-3.5 text-center">Qty Logged</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5 text-right text-red-500">Loss Cost (IQD)</th>
                  <th className="px-6 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {damages.map((row) => (
                  <tr key={row.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-foreground">{row.damage_date}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-foreground">{row.items?.name || "Unknown Item"}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Unit: {row.items?.unit || "Piece"}</div>
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-muted-foreground">
                      {row.quantity}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider select-none ${
                        row.reason === "expired"
                          ? "bg-red-500/15 border-red-500/30 text-red-500"
                          : row.reason === "damaged"
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-500"
                          : row.reason === "lost"
                          ? "bg-orange-500/15 border-orange-500/30 text-orange-500"
                          : "bg-secondary text-foreground border-border/80"
                      }`}>
                        {row.reason}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-black text-red-500">
                      {Number(row.cost || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground truncate max-w-[200px]" title={row.notes || ""}>
                      {row.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Damage Write-off Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Modal Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-secondary/30">
              <div className="flex items-center space-x-2">
                <Flame className="w-4.5 h-4.5 text-red-500 animate-pulse" />
                <span className="font-bold text-foreground text-sm uppercase tracking-tight">Record Damage Log</span>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormError("");
                  setSuccessMsg("");
                }}
                className="p-1 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateDamage} className="p-6 space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 rounded-lg text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-lg text-xs font-semibold">
                  {successMsg}
                </div>
              )}

              {/* Item selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Select Stocked Item
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">-- Choose Item in Catalog --</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.stock_qty} {item.unit} available)
                    </option>
                  ))}
                </select>
                {selectedItem && (
                  <div className="p-2.5 bg-secondary/40 border border-border/60 rounded-lg text-[10px] text-muted-foreground space-y-1">
                    <span className="block">Item Category: <strong className="text-foreground">{selectedItem.category || "General"}</strong></span>
                    <span className="block">Current Buy Price: <strong className="text-foreground">{selectedItem.buy_price.toLocaleString()} IQD</strong></span>
                  </div>
                )}
              </div>

              {/* Quantity Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Write-off Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Number of units to scrap"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Scrap Reason
                </label>
                <select
                  value={reason}
                  onChange={(e: any) => setReason(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="damaged">Physical Damage</option>
                  <option value="expired">Batch Expiration</option>
                  <option value="lost">Lost / Misplaced</option>
                  <option value="other">Other / Correction</option>
                </select>
              </div>

              {/* Damage Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Action Date
                </label>
                <input
                  type="date"
                  value={damageDate}
                  onChange={(e) => setDamageDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Description Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Audit Notes / Remarks
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain why this item is written off..."
                  rows={3}
                  className="w-full p-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-2 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError("");
                    setSuccessMsg("");
                  }}
                  className="flex-1 h-9 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-colors cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedItemId || !qty}
                  className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-md cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 inline-flex items-center justify-center"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    "Save Write-off"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DamagesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center space-x-2 text-muted-foreground bg-background">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs font-medium font-sans">Loading damages log...</span>
      </div>
    }>
      <DamagesPageContent />
    </Suspense>
  );
}

