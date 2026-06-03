"use client";

import { useState } from "react";
import { Item } from "@/types";
import {
  ClipboardList,
  AlertTriangle,
  Flame,
  CalendarDays,
  Search,
  Inbox,
  Calendar
} from "lucide-react";

export default function StockTable({ items }: { items: Item[] }) {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "low" | "out" | "expiring">("all");

  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Calculate summary statistics
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiringSoonCount = 0;

  items.forEach((item) => {
    const qty = Number(item.stock_qty || 0);
    const threshold = Number(item.min_stock_alert ?? 10);
    const expiry = item.expiry_date;

    if (qty === 0) {
      outOfStockCount++;
    } else if (qty <= threshold) {
      lowStockCount++;
    }

    if (expiry && expiry >= todayStr && expiry <= thirtyDaysLater) {
      expiringSoonCount++;
    }
  });

  // Filter items based on search and selected summary card filter
  const filteredItems = items.filter((item) => {
    const qty = Number(item.stock_qty || 0);
    const threshold = Number(item.min_stock_alert ?? 10);
    const expiry = item.expiry_date;

    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (filterMode === "low") {
      matchesFilter = qty > 0 && qty <= threshold;
    } else if (filterMode === "out") {
      matchesFilter = qty === 0;
    } else if (filterMode === "expiring") {
      matchesFilter = !!(expiry && expiry >= todayStr && expiry <= thirtyDaysLater);
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 select-none">
      {/* 1. SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Items */}
        <div
          onClick={() => setFilterMode("all")}
          className={`bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all cursor-pointer group ${
            filterMode === "all" ? "border-primary ring-1 ring-ring" : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Total Items
            </span>
            <div className={`p-2 rounded-lg transition-all ${
              filterMode === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground"
            }`}>
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{items.length}</h3>
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">
              Show All Products
            </span>
          </div>
        </div>

        {/* Low Stock count */}
        <div
          onClick={() => setFilterMode("low")}
          className={`bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all cursor-pointer group ${
            filterMode === "low" ? "border-amber-500 ring-1 ring-amber-500" : "border-border hover:border-border/80"
          } ${lowStockCount > 0 ? "border-amber-500/35" : ""}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Low Stock
            </span>
            <div className={`p-2 rounded-lg transition-all ${
              filterMode === "low" ? "bg-amber-500 text-white" : "bg-secondary text-foreground group-hover:bg-amber-500 group-hover:text-white"
            } ${lowStockCount > 0 && filterMode !== "low" ? "bg-amber-500/10 text-amber-500" : ""}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className={`text-2xl font-bold tracking-tight ${lowStockCount > 0 ? "text-amber-500" : "text-foreground"}`}>
              {lowStockCount}
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">
              Filter Low Stock
            </span>
          </div>
        </div>

        {/* Out of stock count */}
        <div
          onClick={() => setFilterMode("out")}
          className={`bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all cursor-pointer group ${
            filterMode === "out" ? "border-red-500 ring-1 ring-red-500" : "border-border hover:border-border/80"
          } ${outOfStockCount > 0 ? "border-red-500/35" : ""}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Out of Stock
            </span>
            <div className={`p-2 rounded-lg transition-all ${
              filterMode === "out" ? "bg-red-500 text-white" : "bg-secondary text-foreground group-hover:bg-red-500 group-hover:text-white"
            } ${outOfStockCount > 0 && filterMode !== "out" ? "bg-red-500/10 text-red-500" : ""}`}>
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className={`text-2xl font-bold tracking-tight ${outOfStockCount > 0 ? "text-red-500" : "text-foreground"}`}>
              {outOfStockCount}
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">
              Filter Out of Stock
            </span>
          </div>
        </div>

        {/* Expiring count */}
        <div
          onClick={() => setFilterMode("expiring")}
          className={`bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all cursor-pointer group ${
            filterMode === "expiring" ? "border-orange-500 ring-1 ring-orange-500" : "border-border hover:border-border/80"
          } ${expiringSoonCount > 0 ? "border-orange-500/35" : ""}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Expiring Soon
            </span>
            <div className={`p-2 rounded-lg transition-all ${
              filterMode === "expiring" ? "bg-orange-500 text-white" : "bg-secondary text-foreground group-hover:bg-orange-500 group-hover:text-white"
            } ${expiringSoonCount > 0 && filterMode !== "expiring" ? "bg-orange-500/10 text-orange-500" : ""}`}>
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className={`text-2xl font-bold tracking-tight ${expiringSoonCount > 0 ? "text-orange-500" : "text-foreground"}`}>
              {expiringSoonCount}
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">
              Filter Expiring
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter stock level by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 rounded-lg border border-input bg-background/50 pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors text-foreground placeholder:text-muted-foreground/75"
        />
      </div>

      {/* 3. STOCK TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-6 font-semibold">Item Name</th>
                <th className="py-3.5 px-6 font-semibold">Unit</th>
                <th className="py-3.5 px-6 font-semibold text-center">Current Stock</th>
                <th className="py-3.5 px-6 font-semibold text-center">Min Alert</th>
                <th className="py-3.5 px-6 font-semibold text-center">Status</th>
                <th className="py-3.5 px-6 font-semibold">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const qty = Number(item.stock_qty || 0);
                  const threshold = Number(item.min_stock_alert ?? 10);
                  const expiry = item.expiry_date;

                  const isOutOfStock = qty === 0;
                  const isLowStock = qty > 0 && qty <= threshold;
                  const isExpiringSoon = !!(expiry && expiry >= todayStr && expiry <= thirtyDaysLater);

                  // Row background warning highlighting
                  let rowBg = "hover:bg-secondary/10";
                  if (isOutOfStock) {
                    rowBg = "bg-red-500/5 hover:bg-red-500/10";
                  } else if (isExpiringSoon) {
                    rowBg = "bg-orange-500/5 hover:bg-orange-500/10";
                  } else if (isLowStock) {
                    rowBg = "bg-amber-500/5 hover:bg-amber-500/10";
                  }

                  return (
                    <tr key={item.id} className={`transition-colors ${rowBg}`}>
                      <td className="py-4 px-6 font-semibold text-foreground max-w-sm truncate">
                        {item.name}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground font-medium">
                        {item.unit}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-sm">
                        {qty}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-semibold text-muted-foreground">
                        {threshold}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-500">
                            Out of Stock
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 text-orange-500">
                            Expiring
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-medium text-muted-foreground">
                        {expiry ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 opacity-60" />
                            {expiry}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/45 italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="p-3 bg-secondary/40 border border-border/80 rounded-xl text-muted-foreground">
                        <Inbox className="w-6 h-6 opacity-60" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground text-sm">No inventory matched</h4>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          {search
                            ? "No products match the filter keyword."
                            : "There are no inventory logs present in this filtered category."}
                        </p>
                      </div>
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
