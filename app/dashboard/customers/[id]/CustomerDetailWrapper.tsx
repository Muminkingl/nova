"use client";

import { useRouter } from "next/navigation";
import CustomerDetail from "@/components/customers/CustomerDetail";
import { Customer, Invoice, CustomerPayment } from "@/types";

export default function CustomerDetailWrapper({
  customer,
  totalInvoiced,
  totalPaid,
  outstandingDebt,
  invoices,
  payments
}: {
  customer: Customer;
  totalInvoiced: number;
  totalPaid: number;
  outstandingDebt: number;
  invoices: Invoice[];
  payments: CustomerPayment[];
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <CustomerDetail
      customer={customer}
      totalInvoiced={totalInvoiced}
      totalPaid={totalPaid}
      outstandingDebt={outstandingDebt}
      invoices={invoices}
      payments={payments}
      onRefresh={handleRefresh}
    />
  );
}
