import SupplierForm from "@/components/suppliers/SupplierForm";

export const metadata = {
  title: "Add Supplier - Nova Medical ERP",
  description: "Register a new medical supplier source",
};

export default function AddSupplierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Register New Supplier</h1>
        <p className="text-sm text-muted-foreground">
          Create a new supplier profile. Purchase records and debt will aggregate automatically.
        </p>
      </div>

      <SupplierForm />
    </div>
  );
}
