import { getCustomersAction } from "@/app/actions/customers";
import { getItemsAction } from "@/app/actions/items";
import NewInvoiceForm from "@/components/invoices/NewInvoiceForm";

export const metadata = {
  title: "New Sales Invoice - Nova Medical ERP",
  description: "Create sales billing invoice and deduct stock levels",
};

export default async function NewInvoicePage() {
  const [customersRes, itemsRes] = await Promise.all([
    getCustomersAction(),
    getItemsAction(),
  ]);

  const customers = customersRes.data || [];
  const catalogItems = itemsRes.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Invoice</h1>
        <p className="text-sm text-muted-foreground">
          Generate sales billing log, apply line item discounts, and decrement inventory stock levels
        </p>
      </div>

      <NewInvoiceForm customers={customers} catalogItems={catalogItems} />
    </div>
  );
}
