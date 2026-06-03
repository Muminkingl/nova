"use client";

import { useRouter } from "next/navigation";
import PurchaseDetail from "@/components/purchases/PurchaseDetail";
import { Purchase, PurchaseItem, SupplierPayment } from "@/types";

export default function PurchaseDetailWrapper({
  purchase,
  items,
  payments
}: {
  purchase: Purchase & { suppliers: { id: string; name: string } | null };
  items: (PurchaseItem & { items: { name: string; unit: string } | null })[];
  payments: SupplierPayment[];
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <PurchaseDetail
      purchase={purchase}
      items={items}
      payments={payments}
      onRefresh={handleRefresh}
    />
  );
}
