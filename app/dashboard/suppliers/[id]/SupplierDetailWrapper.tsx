"use client";

import { useRouter } from "next/navigation";
import SupplierDetail from "@/components/suppliers/SupplierDetail";
import { Supplier, Purchase, SupplierPayment } from "@/types";

export default function SupplierDetailWrapper({
  supplier,
  totalPurchased,
  totalPaid,
  outstandingDebt,
  purchases,
  payments
}: {
  supplier: Supplier;
  totalPurchased: number;
  totalPaid: number;
  outstandingDebt: number;
  purchases: Purchase[];
  payments: SupplierPayment[];
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <SupplierDetail
      supplier={supplier}
      totalPurchased={totalPurchased}
      totalPaid={totalPaid}
      outstandingDebt={outstandingDebt}
      purchases={purchases}
      payments={payments}
      onRefresh={handleRefresh}
    />
  );
}
