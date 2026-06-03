"use client";

import { useRouter } from "next/navigation";
import InvoiceDetail from "@/components/invoices/InvoiceDetail";
import { Invoice, InvoiceItem, CustomerPayment } from "@/types";

export default function InvoiceDetailWrapper({
  invoice,
  items,
  payments
}: {
  invoice: Invoice & { customers: { id: string; name: string; phone: string | null; address: string | null } | null };
  items: (InvoiceItem & { items: { name: string; unit: string } | null })[];
  payments: CustomerPayment[];
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <InvoiceDetail
      invoice={invoice}
      items={items}
      payments={payments}
      onRefresh={handleRefresh}
    />
  );
}
