"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Invoice, InvoiceItem, CustomerPayment, Settings } from "@/types";
import CustomerPaymentModal from "../customers/CustomerPaymentModal";
import { getSettingsAction } from "@/app/actions/settings";
import { InvoicePDF } from "./InvoicePDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  ArrowLeft,
  CreditCard,
  Layers,
  History,
  Info,
  Calendar,
  DollarSign,
  ClipboardList,
  Printer,
  ShieldCheck,
  Download
} from "lucide-react";

export default function InvoiceDetail({
  invoice,
  items = [],
  payments = [],
  onRefresh
}: {
  invoice: Invoice & { customers: { id: string; name: string; phone: string | null; address: string | null } | null };
  items: (InvoiceItem & { items: { name: string; unit: string } | null })[];
  payments: CustomerPayment[];
  onRefresh: () => void;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    getSettingsAction().then((res) => {
      if (res.data) setSettings(res.data);
    });
  }, []);

  const total = Number(invoice.total_amount || 0);
  const discount = Number(invoice.discount_amount || 0);
  const final = Number(invoice.final_amount || 0);
  const paid = Number(invoice.amount_paid || 0);
  const remaining = Math.max(0, final - paid);

  const isPaid = invoice.status === "paid";
  const isPartial = invoice.status === "partial";

  const customer = invoice.customers;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Payment Modal */}
      {showPaymentModal && customer && (
        <CustomerPaymentModal
          customerId={customer.id}
          customerName={customer.name}
          unpaidInvoices={[{
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            final_amount: final,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border print:hidden select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/dashboard/invoices" className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Invoices List
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 font-mono">
            Invoice details: {invoice.invoice_number}
          </h1>
          <p className="text-xs text-muted-foreground">
            Customer:{" "}
            {customer ? (
              <Link
                href={`/dashboard/customers/${customer.id}`}
                className="font-semibold text-primary hover:underline underline-offset-2"
              >
                {customer.name}
              </Link>
            ) : (
              <span className="italic">Unknown</span>
            )}
            {" • Billing Date: "}
            <span className="font-semibold">{invoice.invoice_date}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 select-none">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center h-9 px-4 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Invoice
          </button>
          
          {isClient && (
            <PDFDownloadLink
              document={<InvoicePDF invoice={invoice} items={items} settings={settings} />}
              fileName={`invoice_${invoice.invoice_number}.pdf`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center h-9 px-4 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-semibold transition-all cursor-pointer"
            >
              {({ loading }) => (
                <>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {loading ? "Generating..." : "Download PDF"}
                </>
              )}
            </PDFDownloadLink>
          )}

          {remaining > 0 && customer && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-[0.98]"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block space-y-6 font-sans select-text">
        <div className="flex justify-between items-start border-b border-zinc-200 pb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">NOVA MEDICAL</h2>
            <span className="text-xs text-zinc-500 font-bold block mt-1">Erbil, Kurdistan Region, Iraq</span>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold text-zinc-900 font-mono">{invoice.invoice_number}</h3>
            <span className="text-xs text-zinc-500 font-medium block mt-1">Date: {invoice.invoice_date}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-xs">
          <div>
            <span className="text-zinc-500 font-bold uppercase tracking-wider block mb-1">Billed To:</span>
            <strong className="text-zinc-900 text-sm block">{customer?.name}</strong>
            <span className="text-zinc-700 block mt-1">{customer?.address || "No address on record."}</span>
            <span className="text-zinc-700 block font-semibold">{customer?.phone}</span>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 font-bold uppercase tracking-wider block mb-1">Status:</span>
            <span className="inline-block px-3 py-1 rounded bg-zinc-100 text-zinc-950 font-bold uppercase tracking-wider scale-95 border border-zinc-200 mt-1">
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* 1. FINANCIAL SUMMARY DECK */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 print:hidden">
        {/* Subtotal */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Subtotal
            </span>
            <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {total.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Sales value before discount</span>
          </div>
        </div>

        {/* Discount */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Discount
            </span>
            <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-amber-500">
              {discount.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Volume-based discount</span>
          </div>
        </div>

        {/* Final Amount */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Final Amount
            </span>
            <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {final.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Final billing total</span>
          </div>
        </div>

        {/* Remaining Receivables */}
        <div className={`bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all group ${
          remaining > 0 
            ? "border-amber-500/35 hover:border-amber-500/50" 
            : "border-border hover:border-border/80"
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
              Remaining Due
            </span>
            <div className={`p-2 rounded-lg transition-all ${
              remaining > 0 
                ? "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white" 
                : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground"
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className={`text-2xl font-bold tracking-tight ${remaining > 0 ? "text-amber-500" : "text-foreground"}`}>
              {remaining.toLocaleString()} IQD
            </h3>
            <span className="text-xs text-muted-foreground block font-medium">Customer outstanding balance</span>
          </div>
        </div>
      </div>

      {/* 2. INVOICE ITEMS RECEIVED TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden print:border-zinc-200">
        <div className="px-6 py-5 border-b border-border bg-card/60 print:bg-white print:border-zinc-200">
          <h3 className="font-semibold text-foreground text-sm tracking-tight flex items-center print:text-zinc-900">
            <Layers className="w-4.5 h-4.5 mr-2 text-muted-foreground print:hidden" />
            Billing Item Lines
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 print:text-zinc-500">
            List of medical products sold and billed on this invoice
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left print:text-zinc-900">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground print:bg-zinc-50 print:border-zinc-200 print:text-zinc-500">
                <th className="py-3 px-6 font-semibold">Medical Product</th>
                <th className="py-3 px-6 font-semibold">Unit Type</th>
                <th className="py-3 px-6 font-semibold text-center">Quantity</th>
                <th className="py-3 px-6 font-semibold text-right">Sell Price</th>
                <th className="py-3 px-6 font-semibold text-center">Discount %</th>
                <th className="py-3 px-6 font-semibold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground font-medium print:divide-zinc-200">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-secondary/10 transition-colors print:hover:bg-transparent">
                  <td className="py-3.5 px-6 font-semibold text-foreground print:text-zinc-900">
                    {row.items?.name || <span className="italic text-muted-foreground/35">Uncataloged Product</span>}
                  </td>
                  <td className="py-3.5 px-6 text-muted-foreground print:text-zinc-700">
                    {row.items?.unit || <span className="italic text-muted-foreground/35">N/A</span>}
                  </td>
                  <td className="py-3.5 px-6 text-center font-mono font-bold">
                    {row.quantity}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono text-muted-foreground print:text-zinc-700">
                    {Number(row.sell_price).toLocaleString()} IQD
                  </td>
                  <td className="py-3.5 px-6 text-center font-mono font-medium text-amber-500 print:text-zinc-700">
                    {Number(row.discount_percent || 0)}%
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono font-bold text-foreground print:text-zinc-900">
                    {Number(row.subtotal).toLocaleString()} IQD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PRINT ONLY TOTALS LEDGER */}
        <div className="hidden print:block border-t border-zinc-200 p-6 text-xs select-text">
          <div className="w-64 ml-auto space-y-2 font-semibold">
            <div className="flex justify-between text-zinc-500">
              <span>Gross Subtotal:</span>
              <span className="font-mono text-zinc-800">{(total).toLocaleString()} IQD</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Total Discount:</span>
              <span className="font-mono text-zinc-800">-{discount.toLocaleString()} IQD</span>
            </div>
            <div className="flex justify-between text-zinc-900 font-bold border-t border-zinc-200 pt-2 text-sm">
              <span>Invoice Total:</span>
              <span className="font-mono">{final.toLocaleString()} IQD</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Amount Paid:</span>
              <span className="font-mono">-{paid.toLocaleString()} IQD</span>
            </div>
            <div className="flex justify-between text-zinc-900 border-t border-zinc-200 pt-2">
              <span>Remaining Balance:</span>
              <span className="font-mono">{remaining.toLocaleString()} IQD</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PAYMENTS ON THIS INVOICE HISTORY (Print Hidden) */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden print:hidden select-none">
        <div className="px-6 py-5 border-b border-border bg-card/60">
          <h3 className="font-semibold text-foreground text-sm tracking-tight flex items-center">
            <History className="w-4.5 h-4.5 mr-2 text-muted-foreground" />
            Installment Receipt History
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log records of cash installments received directly against this sales invoice
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-6 font-semibold">Payment Date</th>
                <th className="py-3 px-6 font-semibold text-right">Amount Received</th>
                <th className="py-3 px-6 font-semibold">Notes</th>
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
                    No payment collections recorded against this sales invoice.
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
