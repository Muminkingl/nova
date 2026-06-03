"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getProfitByItemAction,
  getMonthlySalesTrendAction
} from "@/app/actions/reports";
import { getCustomersAction } from "@/app/actions/customers";
import { ProfitByItem } from "@/types";
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Percent,
  DollarSign,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function ProfitsPage() {
  const [profitItems, setProfitItems] = useState<ProfitByItem[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Sort State
  const [sortField, setSortField] = useState<keyof ProfitByItem>("profit");
  const [sortAsc, setSortAsc] = useState(false);

  // SVG Chart Hover State
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = {
        from: dateFrom || undefined,
        to: dateTo || undefined,
        customer_id: selectedCustomerId !== "all" ? selectedCustomerId : undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      };

      const [profitRes, trendRes, custRes] = await Promise.all([
        getProfitByItemAction(filters),
        getMonthlySalesTrendAction(),
        getCustomersAction()
      ]);

      if (profitRes.data) setProfitItems(profitRes.data);
      if (trendRes.data) setTrendData(trendRes.data);
      if (custRes.data) setCustomers(custRes.data);
    } catch (err) {
      console.error("Failed to load profitability reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, selectedCustomerId, selectedCategory]);

  // Unique categories list from profitItems
  const categories = Array.from(
    new Set(profitItems.map((item) => item.category).filter(Boolean))
  ) as string[];

  // Running aggregates
  const totalSales = profitItems.reduce((sum, item) => sum + item.revenue, 0);
  const totalDiscounts = profitItems.reduce((sum, item) => sum + item.discount, 0);
  const totalCost = profitItems.reduce((sum, item) => sum + item.cost, 0);
  const grossProfit = totalSales - totalCost;
  const marginPercent = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  // Sorting Handler
  const handleSort = (field: keyof ProfitByItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedItems = [...profitItems].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === "string") {
      return sortAsc 
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }

    return sortAsc
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  // Client-Side CSV Export
  const handleExportCSV = () => {
    if (profitItems.length === 0) return;

    // Headers
    const headers = [
      "Item Name",
      "Units Sold",
      "Revenue (IQD)",
      "COGS Cost (IQD)",
      "Discount Applied (IQD)",
      "Net Profit (IQD)",
      "Profit Margin (%)"
    ];

    // Rows
    const rows = sortedItems.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.units_sold,
      item.revenue,
      item.cost,
      item.discount,
      item.profit,
      item.margin.toFixed(2)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_and_profits_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom SVG Chart rendering helpers
  const svgWidth = 720;
  const svgHeight = 220;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // Find max value in monthly trend for Y scale
  const maxVal = trendData.length > 0 
    ? Math.max(...trendData.flatMap((d) => [d.sales, d.cost, d.profit]), 100000) 
    : 100000;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 overflow-y-auto pb-10 max-h-[calc(100vh-4rem)] px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales & Profits</h1>
          <p className="text-sm text-muted-foreground">
            Analysis of margins, COGS costings, volume discounts, and products profitability.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={profitItems.length === 0}
          className="inline-flex items-center h-9 px-4 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card/45 border border-border/80 rounded-xl p-4 flex flex-wrap gap-4 items-end select-none">
        {/* Date From */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Customer Select */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Customer</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-[150px]"
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Category Select */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-[120px]"
          >
            <option value="all">All Categories</option>
            <option value="device">Devices</option>
            <option value="consumable">Consumables</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Reset Buttons */}
        {(dateFrom || dateTo || selectedCustomerId !== "all" || selectedCategory !== "all") && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setSelectedCustomerId("all");
              setSelectedCategory("all");
            }}
            className="h-9 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Summary KPI Panel (5 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
        {/* KPI 1: Gross Sales */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gross Sales</span>
          <h3 className="text-lg font-bold text-foreground mt-2 truncate">
            {totalSales.toLocaleString()} IQD
          </h3>
          <span className="text-[9px] text-muted-foreground block mt-1">Sum of subtotal revenues</span>
        </div>

        {/* KPI 2: Discounts Allowed */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Discounts Logged</span>
          <h3 className="text-lg font-bold text-amber-500 mt-2 truncate">
            {totalDiscounts.toLocaleString()} IQD
          </h3>
          <span className="text-[9px] text-muted-foreground block mt-1">Sum of item discounts</span>
        </div>

        {/* KPI 3: COGS Cost */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cost of Sales (COGS)</span>
          <h3 className="text-lg font-bold text-red-500 mt-2 truncate">
            {totalCost.toLocaleString()} IQD
          </h3>
          <span className="text-[9px] text-muted-foreground block mt-1">Item wholesale costs</span>
        </div>

        {/* KPI 4: Gross Profit */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Net Profit</span>
          <h3 className={`text-lg font-extrabold mt-2 truncate ${grossProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {grossProfit.toLocaleString()} IQD
          </h3>
          <span className="text-[9px] text-muted-foreground block mt-1">Sales - COGS costings</span>
        </div>

        {/* KPI 5: Margin Percent */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Margin Margin %</span>
          <h3 className="text-lg font-extrabold text-primary mt-2">
            {marginPercent.toFixed(2)} %
          </h3>
          <span className="text-[9px] text-muted-foreground block mt-1">Average profitability index</span>
        </div>
      </div>

      {/* SVG Chart Trend Section */}
      <div className="bg-card border border-border rounded-xl p-6 relative">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6">Sales, COGS & Profit Trends</h3>
        
        {trendData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground select-none">
            <AlertCircle className="w-5 h-5 mr-2" />
            No monthly data to render.
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <svg width={svgWidth} height={svgHeight} className="overflow-visible select-none">
              {/* Dash gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingTop + chartInnerHeight * (1 - ratio);
                const labelVal = Math.round(maxVal * ratio);
                return (
                  <g key={idx} className="opacity-40">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="var(--color-border)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      fill="var(--color-muted-foreground)"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {labelVal >= 1000000 
                        ? `${(labelVal / 1000000).toFixed(1)}M` 
                        : `${(labelVal / 1000).toFixed(0)}k`}
                    </text>
                  </g>
                );
              })}

              {/* Grouped Bar columns */}
              {trendData.map((data, idx) => {
                const colWidth = chartInnerWidth / trendData.length;
                const groupX = paddingLeft + colWidth * idx;
                
                // Sub-bars dimensions
                const barSpacing = 3;
                const subBarWidth = (colWidth - paddingRight - barSpacing * 2) / 3;

                const salesH = (data.sales / maxVal) * chartInnerHeight;
                const costH = (data.cost / maxVal) * chartInnerHeight;
                const profitH = (Math.max(0, data.profit) / maxVal) * chartInnerHeight;

                const salesX = groupX + barSpacing;
                const costX = salesX + subBarWidth + barSpacing;
                const profitX = costX + subBarWidth + barSpacing;

                const salesY = paddingTop + chartInnerHeight - salesH;
                const costY = paddingTop + chartInnerHeight - costH;
                const profitY = paddingTop + chartInnerHeight - profitH;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer group/col"
                  >
                    {/* Hover column background */}
                    <rect
                      x={groupX}
                      y={paddingTop}
                      width={colWidth - paddingRight + 6}
                      height={chartInnerHeight}
                      fill="var(--color-secondary)"
                      className="opacity-0 group-hover/col:opacity-10 transition-all rounded"
                    />

                    {/* Sales Bar (Emerald) */}
                    <rect
                      x={salesX}
                      y={salesY}
                      width={subBarWidth}
                      height={salesH}
                      fill="#10b981"
                      rx="1"
                    />

                    {/* Cost Bar (Red) */}
                    <rect
                      x={costX}
                      y={costY}
                      width={subBarWidth}
                      height={costH}
                      fill="#ef4444"
                      rx="1"
                    />

                    {/* Profit Bar (Blue) */}
                    <rect
                      x={profitX}
                      y={profitY}
                      width={subBarWidth}
                      height={profitH}
                      fill="#3b82f6"
                      rx="1"
                    />

                    {/* Month Label */}
                    <text
                      x={groupX + (colWidth - paddingRight) / 2}
                      y={paddingTop + chartInnerHeight + 18}
                      fill="var(--color-muted-foreground)"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {data.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Floating tooltip */}
        {hoveredIdx !== null && trendData[hoveredIdx] && (
          <div className="absolute top-20 right-10 bg-secondary/95 border border-border text-foreground px-4 py-3 rounded-lg shadow-xl text-xs space-y-1 select-none animate-in fade-in duration-100 z-10 w-48 font-sans">
            <p className="font-extrabold text-[10px] text-muted-foreground uppercase border-b border-border/60 pb-1 tracking-wider">
              Month: {trendData[hoveredIdx].month}
            </p>
            <p className="flex justify-between font-semibold mt-1">
              <span>Sales:</span>
              <span className="text-emerald-500">{trendData[hoveredIdx].sales.toLocaleString()} IQD</span>
            </p>
            <p className="flex justify-between font-semibold">
              <span>Cost (COGS):</span>
              <span className="text-red-500">{trendData[hoveredIdx].cost.toLocaleString()} IQD</span>
            </p>
            <p className="flex justify-between font-bold">
              <span>Net Profit:</span>
              <span className="text-blue-500">{trendData[hoveredIdx].profit.toLocaleString()} IQD</span>
            </p>
          </div>
        )}
      </div>

      {/* Profit Margin table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-secondary/15 select-none">
          <h2 className="font-bold text-foreground text-xs uppercase tracking-wider">Itemized Profitability Matrix</h2>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium">Analyzing margins...</span>
          </div>
        ) : profitItems.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground space-y-2 select-none">
            <AlertCircle className="w-7 h-7 opacity-40" />
            <p className="text-xs font-medium">No sales recorded matching active parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px] select-none">
                  <th className="px-6 py-3.5 cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                    Item Name {sortField === "name" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th className="px-6 py-3.5 text-center cursor-pointer hover:text-foreground" onClick={() => handleSort("units_sold")}>
                    Units Sold {sortField === "units_sold" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th className="px-6 py-3.5 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("revenue")}>
                    Revenue (IQD) {sortField === "revenue" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th className="px-6 py-3.5 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("cost")}>
                    COGS Cost (IQD) {sortField === "cost" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th className="px-6 py-3.5 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("discount")}>
                    Discount Allowed {sortField === "discount" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th className="px-6 py-3.5 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("profit")}>
                    Net Profit (IQD) {sortField === "profit" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th className="px-6 py-3.5 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("margin")}>
                    Profit Margin % {sortField === "margin" && (sortAsc ? "▲" : "▼")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedItems.map((row) => (
                  <tr key={row.item_id} className="hover:bg-secondary/15 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-foreground">{row.name}</td>
                    <td className="px-6 py-3.5 text-center font-bold text-muted-foreground">{row.units_sold}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-foreground">{row.revenue.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-muted-foreground">{row.cost.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-amber-500/80">{row.discount.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-extrabold text-emerald-500">{row.profit.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-black text-primary">
                      {row.margin.toFixed(2)} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
