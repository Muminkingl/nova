"use client";

import { useRouter } from "next/navigation";
import CustomersTable from "@/components/customers/CustomersTable";
import { CustomerWithStats } from "@/app/actions/customers";

export default function CustomersTableWrapper({
  initialCustomers
}: {
  initialCustomers: CustomerWithStats[];
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <CustomersTable
      initialCustomers={initialCustomers}
      onRefresh={handleRefresh}
    />
  );
}
