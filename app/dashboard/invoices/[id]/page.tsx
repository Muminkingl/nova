import { getInvoiceByIdAction } from "@/app/actions/invoices";
import InvoiceDetailWrapper from "./InvoiceDetailWrapper";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Invoice Details - Nova Medical ERP",
  description: "View itemized product list and print options",
};

export default async function InvoiceDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const res = await getInvoiceByIdAction(id);
  if (res.error || !res.data) {
    notFound();
  }

  const { invoice, items, payments } = res.data;

  return (
    <InvoiceDetailWrapper
      invoice={invoice}
      items={items}
      payments={payments}
    />
  );
}
