import { getInvoicesAction } from "@/app/actions/invoices";
import { getCustomersAction } from "@/app/actions/customers";
import InvoicesTableWrapper from "./InvoicesTableWrapper";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invoices Directory - Nova Medical ERP",
  description: "View and create customer sales billing invoices",
};

export default async function InvoicesPage() {
  const [invoicesRes, customersRes] = await Promise.all([
    getInvoicesAction(),
    getCustomersAction(),
  ]);

  const invoices = invoicesRes.data || [];
  const customers = (customersRes.data || []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View billing numbers generated, discounts applied, and payments receipts from customers
        </p>
      </div>

      {invoicesRes.error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          Error loading billing invoice records: {invoicesRes.error.message || "Unknown error"}
        </div>
      )}

      <InvoicesTableWrapper initialInvoices={invoices} customers={customers} />
    </div>
  );
}
