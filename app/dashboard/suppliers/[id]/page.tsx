import { getSupplierByIdAction } from "@/app/actions/suppliers";
import SupplierDetailWrapper from "./SupplierDetailWrapper";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const res = await getSupplierByIdAction(id);
  return {
    title: res.data ? `${res.data.supplier.name} - Nova Medical ERP` : "Supplier Ledger - Nova Medical ERP",
    description: "Detailed supplier transactions, payments, and outstanding balances",
  };
}

export default async function SupplierDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const res = await getSupplierByIdAction(id);
  if (res.error || !res.data) {
    notFound();
  }

  const { supplier, total_purchased, total_paid, outstanding_debt, purchases, payments } = res.data;

  return (
    <SupplierDetailWrapper
      supplier={supplier}
      totalPurchased={total_purchased}
      totalPaid={total_paid}
      outstandingDebt={outstanding_debt}
      purchases={purchases}
      payments={payments}
    />
  );
}
