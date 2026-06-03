"use client";

import { useRouter } from "next/navigation";
import PurchasesTable from "@/components/purchases/PurchasesTable";
import { PurchaseWithSupplier } from "@/lib/supabase/purchases";

export default function PurchasesTableWrapper({
  initialPurchases,
  suppliers
}: {
  initialPurchases: PurchaseWithSupplier[];
  suppliers: { id: string; name: string }[];
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <PurchasesTable
      initialPurchases={initialPurchases}
      suppliers={suppliers}
      onRefresh={handleRefresh}
    />
  );
}
