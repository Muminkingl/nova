import { getSuppliersAction } from "@/app/actions/suppliers";
import SuppliersTableWrapper from "./SuppliersTableWrapper";

export const metadata = {
  title: "Suppliers Directory - Nova Medical ERP",
  description: "View and manage active supply manufactures and crediting accounts",
};

export default async function SuppliersPage() {
  const { data: suppliers, error } = await getSuppliersAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Suppliers Directory</h1>
        <p className="text-sm text-muted-foreground">
          Track supplier contact details, outstanding debt owed, and purchase records
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          Error loading suppliers list: {error.message || "Unknown error"}
        </div>
      )}

      <SuppliersTableWrapper initialSuppliers={suppliers || []} />
    </div>
  );
}
