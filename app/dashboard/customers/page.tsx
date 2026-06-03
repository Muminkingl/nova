import { getCustomersAction } from "@/app/actions/customers";
import CustomersTableWrapper from "./CustomersTableWrapper";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customers Directory - Nova Medical ERP",
  description: "View and manage registered customers and active credit invoices",
};

export default async function CustomersPage() {
  const { data: customers, error } = await getCustomersAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers Directory</h1>
        <p className="text-sm text-muted-foreground">
          Track customer accounts details, outstanding receivables owed, and active sales invoices
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          Error loading customers list: {error.message || "Unknown error"}
        </div>
      )}

      <CustomersTableWrapper initialCustomers={customers || []} />
    </div>
  );
}
