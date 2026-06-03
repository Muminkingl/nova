import { getSupplierByIdAction } from "@/app/actions/suppliers";
import SupplierForm from "@/components/suppliers/SupplierForm";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Edit Supplier - Nova Medical ERP",
  description: "Modify supplier contact settings and logs parameters",
};

export default async function EditSupplierPage({ params }: { params: Params }) {
  const { id } = await params;

  const res = await getSupplierByIdAction(id);
  if (res.error || !res.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Supplier Profile</h1>
        <p className="text-sm text-muted-foreground">
          Modify contact card parameters for `{res.data.supplier.name}`
        </p>
      </div>

      <SupplierForm supplier={res.data.supplier} />
    </div>
  );
}
