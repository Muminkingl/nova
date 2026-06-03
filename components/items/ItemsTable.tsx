"use client";

import { useState } from "react";
import Link from "next/link";
import { Item } from "@/types";
import { deactivateItemAction } from "@/app/actions/items";
import {
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
  Inbox
} from "lucide-react";

export default function ItemsTable({
  initialItems,
  onRefresh
}: {
  initialItems: Item[];
  onRefresh: () => void;
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof Item>("name");
  const [sortAscending, setSortAscending] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Extract unique categories for filtering
  const categories = Array.from(
    new Set(
      initialItems
        .map((item) => item.category)
        .filter((cat): cat is string => !!cat)
    )
  );

  // Date range calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const handleDeactivate = async (id: string) => {
    if (confirm("Are you sure you want to deactivate this item? It will be hidden from the catalog.")) {
      setIsDeleting(id);
      try {
        const { error } = await deactivateItemAction(id);
        if (error) {
          alert("Failed to deactivate item: " + error.message);
        } else {
          // Update local state and trigger refresh
          setItems(items.filter((item) => item.id !== id));
          onRefresh();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleSort = (field: keyof Item) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
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
    <div className="space-y-4 select-none">
      {/* Search, Filter, Actions Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search items by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background/50 pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors text-foreground placeholder:text-muted-foreground/75"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 pl-10 pr-8 rounded-lg border border-input bg-background/50 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer pr-10"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Link
          href="/dashboard/items/new"
          className="inline-flex items-center justify-center h-10 px-4 py-2 font-medium text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-md shrink-0 w-full md:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Link>
      </div>

      {/* Table grid */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th
                  onClick={() => handleSort("name")}
                  className="py-3.5 px-6 font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortField === "name" && (
                      sortAscending ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-6 font-semibold">Category</th>
                <th className="py-3.5 px-6 font-semibold">Unit</th>
                <th
                  onClick={() => handleSort("buy_price")}
                  className="py-3.5 px-6 font-semibold cursor-pointer hover:text-foreground transition-colors text-right"
                >
                  <div className="flex items-center gap-1 justify-end">
                    Buy Price
                    {sortField === "buy_price" && (
                      sortAscending ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("sell_price")}
                  className="py-3.5 px-6 font-semibold cursor-pointer hover:text-foreground transition-colors text-right"
                >
                  <div className="flex items-center gap-1 justify-end">
                    Sell Price
                    {sortField === "sell_price" && (
                      sortAscending ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("stock_qty")}
                  className="py-3.5 px-6 font-semibold cursor-pointer hover:text-foreground transition-colors text-center"
                >
                  <div className="flex items-center gap-1 justify-center">
                    Stock
                    {sortField === "stock_qty" && (
                      sortAscending ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("expiry_date")}
                  className="py-3.5 px-6 font-semibold cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Expiry Date
                    {sortField === "expiry_date" && (
                      sortAscending ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-6 font-semibold text-center">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground">
              {sortedItems.length > 0 ? (
                sortedItems.map((item) => {
                  const qty = Number(item.stock_qty || 0);
                  const threshold = Number(item.min_stock_alert ?? 10);
                  const expiry = item.expiry_date;
                  
                  const isOutOfStock = qty === 0;
                  const isLowStock = qty > 0 && qty <= threshold;
                  const isExpiringSoon = !!(expiry && expiry >= todayStr && expiry <= thirtyDaysLater);

                  // Row styling based on alerts
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
                      <td className="py-3.5 px-6 font-semibold text-foreground max-w-xs truncate">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-6 text-muted-foreground font-medium">
                        {item.category || <span className="italic text-muted-foreground/50">None</span>}
                      </td>
                      <td className="py-3.5 px-6 text-muted-foreground font-medium">
                        {item.unit}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-medium text-muted-foreground">
                        {Number(item.buy_price).toLocaleString()} IQD
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-semibold">
                        {Number(item.sell_price).toLocaleString()} IQD
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono font-semibold">
                        {qty}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-muted-foreground">
                        {expiry ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 opacity-60" />
                            {expiry}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/45 italic">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center">
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
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/dashboard/items/${item.id}/edit`}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeactivate(item.id)}
                            disabled={isDeleting === item.id}
                            className="p-1.5 rounded bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive transition-all cursor-pointer disabled:opacity-50"
                            title="Deactivate Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                        <h4 className="font-semibold text-foreground text-sm">No items cataloged</h4>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          There are no active items in the system. Get started by adding your first product.
                        </p>
                      </div>
                      <Link
                        href="/dashboard/items/new"
                        className="inline-flex items-center justify-center h-8 px-3.5 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow cursor-pointer"
                      >
                        Add First Item
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
