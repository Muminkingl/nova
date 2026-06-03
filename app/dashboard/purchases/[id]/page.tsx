import { getPurchaseByIdAction } from "@/app/actions/purchases";
import PurchaseDetailWrapper from "./PurchaseDetailWrapper";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Purchase Order Details - Nova Medical ERP",
  description: "View purchased medical products list and historical installments",
};

export default async function PurchaseDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const res = await getPurchaseByIdAction(id);
  if (res.error || !res.data) {
    notFound();
  }

  const { purchase, items, payments } = res.data;

  return (
    <PurchaseDetailWrapper
      purchase={purchase}
      items={items}
      payments={payments}
    />
  );
}
