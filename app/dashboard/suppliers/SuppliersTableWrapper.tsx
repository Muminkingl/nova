"use client";

import { useRouter } from "next/navigation";
import SuppliersTable from "@/components/suppliers/SuppliersTable";
import { SupplierWithStats } from "@/app/actions/suppliers";

export default function SuppliersTableWrapper({
  initialSuppliers
}: {
  initialSuppliers: SupplierWithStats[];
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <SuppliersTable
      initialSuppliers={initialSuppliers}
      onRefresh={handleRefresh}
    />
  );
}
