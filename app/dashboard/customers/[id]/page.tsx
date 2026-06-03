import { getCustomerByIdAction } from "@/app/actions/customers";
import CustomerDetailWrapper from "./CustomerDetailWrapper";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const res = await getCustomerByIdAction(id);
  return {
    title: res.data ? `${res.data.customer.name} - Nova Medical ERP` : "Customer Ledger - Nova Medical ERP",
    description: "Detailed customer billing invoices, payments receipts, and debt statements",
  };
}

export default async function CustomerDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const res = await getCustomerByIdAction(id);
  if (res.error || !res.data) {
    notFound();
  }

  const { customer, total_invoiced, total_paid, outstanding_debt, invoices, payments } = res.data;

  return (
    <CustomerDetailWrapper
      customer={customer}
      totalInvoiced={total_invoiced}
      totalPaid={total_paid}
      outstandingDebt={outstanding_debt}
      invoices={invoices}
      payments={payments}
    />
  );
}
