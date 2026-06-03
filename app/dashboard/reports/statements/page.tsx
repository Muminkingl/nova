"use client";

import { useEffect, useState } from "react";
import { getCustomersAction } from "@/app/actions/customers";
import { getSuppliersAction } from "@/app/actions/suppliers";
import {
  getCustomerStatementAction,
  getSupplierStatementAction
} from "@/app/actions/reports";
import { StatementEntry } from "@/types";
import {
  BookOpen,
  Printer,
  Calendar,
  User,
  Building,
  Loader2,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  ArrowRightLeft
} from "lucide-react";

export default function StatementsPage() {
  const [entityType, setEntityType] = useState<"customer" | "supplier">("customer");
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [loading, setLoading] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Statement result
  const [statement, setStatement] = useState<{
    openingBalance: number;
    entries: StatementEntry[];
    closingBalance: number;
  } | null>(null);

  // Load selection lists
  const loadEntities = async () => {
    try {
      const [custRes, suppRes] = await Promise.all([
        getCustomersAction(),
        getSuppliersAction()
      ]);
      if (custRes.data) setCustomers(custRes.data);
      if (suppRes.data) setSuppliers(suppRes.data);
    } catch (err) {
      console.error("Failed to load entities:", err);
    }
  };

  useEffect(() => {
    loadEntities();
  }, []);

  // Reset selected entity when tab changes
  useEffect(() => {
    setSelectedEntityId("");
    setStatement(null);
  }, [entityType]);

  const loadStatement = async () => {
    if (!selectedEntityId) return;
    setLoading(true);
    try {
      const from = dateFrom || undefined;
      const to = dateTo || undefined;

      if (entityType === "customer") {
        const res = await getCustomerStatementAction(selectedEntityId, from, to);
        if (res.data) setStatement(res.data);
      } else {
        const res = await getSupplierStatementAction(selectedEntityId, from, to);
        if (res.data) setStatement(res.data);
      }
    } catch (err) {
      console.error("Failed to load statement ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatement();
  }, [selectedEntityId, dateFrom, dateTo]);

  // Selected Entity Name lookup
  const selectedName = entityType === "customer"
    ? customers.find((c) => c.id === selectedEntityId)?.name
    : suppliers.find((s) => s.id === selectedEntityId)?.name;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 overflow-y-auto pb-10 max-h-[calc(100vh-4rem)] px-8 py-6 print:overflow-visible print:max-h-none print:px-0 print:py-0 print:bg-white print:text-black">
      {/* Printable Style Overrides */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, header, button, .print\\:hidden {
            display: none !important;
          }
          .print-container {
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Page Header (Hidden on Print) */}
      <div className="flex justify-between items-center select-none print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Statements</h1>
          <p className="text-sm text-muted-foreground">
            Generate and print ledger statements of invoices, purchases, and cash payment receipts.
          </p>
        </div>
        <button
          onClick={handlePrint}
          disabled={!statement}
          className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Statement
        </button>
      </div>

      {/* Select Entity Type & filters (Hidden on Print) */}
      <div className="bg-card/45 border border-border/80 rounded-xl p-4 space-y-4 select-none print:hidden">
        {/* Entity Type Toggle */}
        <div className="flex space-x-2 border-b border-border/60 pb-3">
          <button
            onClick={() => setEntityType("customer")}
            className={`inline-flex items-center h-8 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              entityType === "customer"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <User className="w-3.5 h-3.5 mr-2" />
            Customer Statement
          </button>
          <button
            onClick={() => setEntityType("supplier")}
            className={`inline-flex items-center h-8 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              entityType === "supplier"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Building className="w-3.5 h-3.5 mr-2" />
            Supplier Statement
          </button>
        </div>

        {/* Entity Select dropdown and dates filter */}
        <div className="flex flex-wrap gap-4 items-end">
          {/* Dropdown list */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Select {entityType === "customer" ? "Customer" : "Supplier"}
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-[200px]"
            >
              <option value="">-- Choose Account Profile --</option>
              {entityType === "customer"
                ? customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                : suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
            </select>
          </div>

          {/* Date range from */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Start Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Date range to */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">End Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Reset Filters */}
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="h-9 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors cursor-pointer"
            >
              Reset Range
            </button>
          )}
        </div>
      </div>

      {/* Account Statement Sheet */}
      {loading ? (
        <div className="h-48 flex items-center justify-center space-x-2 text-muted-foreground print:hidden">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs font-medium">Compiling ledger history...</span>
        </div>
      ) : !selectedEntityId ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-xs select-none print:hidden">
          <ArrowRightLeft className="w-8 h-8 opacity-45 mx-auto mb-2" />
          Select a customer or supplier account above to view statement details.
        </div>
      ) : statement ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-md print-container print:border-none print:shadow-none">
          {/* Statement Header / Invoice Banner */}
          <div className="p-6 border-b border-border bg-secondary/15 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div>
              <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none">
                Official Account Statement
              </span>
              <h2 className="text-lg font-black text-foreground mt-2">{selectedName}</h2>
              <span className="text-[10px] text-muted-foreground block font-medium mt-0.5">
                Type: {entityType === "customer" ? "Customer Buyer" : "Wholesale Supplier"}
              </span>
            </div>
            <div className="text-left sm:text-right text-xs space-y-1">
              <p className="text-muted-foreground">
                Statement Date: <span className="font-semibold text-foreground">{new Date().toLocaleDateString()}</span>
              </p>
              <p className="text-muted-foreground">
                Period Filter: <span className="font-semibold text-foreground">
                  {dateFrom || "Inception"} &rarr; {dateTo || "Present"}
                </span>
              </p>
            </div>
          </div>

          {/* Opening & Closing summary cards */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5 select-none border-b border-border/60">
            {/* Opening Balance */}
            <div className="bg-secondary/35 border border-border/60 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Opening Balance</span>
                <span className="text-base font-extrabold text-foreground block mt-1">
                  {statement.openingBalance.toLocaleString()} IQD
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Debt before filter period</span>
            </div>

            {/* Total Balance Change */}
            <div className="bg-secondary/35 border border-border/60 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Net Period Activity</span>
                {(() => {
                  const netChange = statement.closingBalance - statement.openingBalance;
                  return (
                    <span className={`text-base font-extrabold block mt-1 ${
                      netChange > 0 
                        ? "text-red-500" 
                        : netChange < 0 
                        ? "text-emerald-500" 
                        : "text-foreground"
                    }`}>
                      {netChange > 0 ? "+" : ""}{netChange.toLocaleString()} IQD
                    </span>
                  );
                })()}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Activity total difference</span>
            </div>

            {/* Closing Balance (Outstanding Debt) */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">Closing Balance</span>
                <span className="text-lg font-black text-foreground block mt-1">
                  {statement.closingBalance.toLocaleString()} IQD
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-bold">Total remaining liability</span>
            </div>
          </div>

          {/* Statement Entries Table */}
          {statement.entries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs select-none">
              No transactions recorded in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-muted-foreground select-none font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-3.5">Transaction Date</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Reference</th>
                    <th className="px-6 py-3.5 text-right text-red-500/90">Debit (Increase Owed)</th>
                    <th className="px-6 py-3.5 text-right text-emerald-500/90">Credit (Decrease Owed)</th>
                    <th className="px-6 py-3.5 text-right">Outstanding Balance</th>
                    <th className="px-6 py-3.5 print:hidden">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {/* Ledger Rows */}
                  {statement.entries.map((row) => (
                    <tr key={row.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="px-6 py-3.5 text-foreground font-medium">{row.date}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider select-none ${
                          row.type === "invoice" || row.type === "purchase"
                            ? "bg-red-500/10 border-red-500/20 text-red-500"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        }`}>
                          {row.type === "invoice" 
                            ? "Invoice" 
                            : row.type === "purchase" 
                            ? "Purchase" 
                            : "Payment"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-foreground">{row.reference}</td>
                      <td className="px-6 py-3.5 text-right font-medium text-red-500">
                        {row.debit > 0 ? row.debit.toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-emerald-500">
                        {row.credit > 0 ? row.credit.toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-foreground">
                        {row.balance.toLocaleString()} IQD
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground truncate max-w-[150px] print:hidden" title={row.notes || ""}>
                        {row.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
