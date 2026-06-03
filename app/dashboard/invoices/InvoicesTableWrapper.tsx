"use client";

import { useRouter } from "next/navigation";
import InvoicesTable from "@/components/invoices/InvoicesTable";
import { InvoiceWithCustomer } from "@/lib/supabase/invoices";

export default function InvoicesTableWrapper({
  initialInvoices,
  customers
}: {
  initialInvoices: InvoiceWithCustomer[];
  customers: { id: string; name: string }[];
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <InvoicesTable
      initialInvoices={initialInvoices}
      customers={customers}
      onRefresh={handleRefresh}
    />
  );
}
