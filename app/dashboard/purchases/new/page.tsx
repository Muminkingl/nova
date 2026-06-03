import { getSuppliersAction } from "@/app/actions/suppliers";
import { getItemsAction } from "@/app/actions/items";
import NewPurchaseForm from "@/components/purchases/NewPurchaseForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Purchase - Nova Medical ERP",
  description: "Record items shipment received from a supplier",
};

export default async function NewPurchasePage() {
  const [suppliersRes, itemsRes] = await Promise.all([
    getSuppliersAction(),
    getItemsAction(),
  ]);

  const suppliers = suppliersRes.data || [];
  const catalogItems = itemsRes.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Record New Purchase</h1>
        <p className="text-sm text-muted-foreground">
          Log received product inventories from supplier and credit debt transactions
        </p>
      </div>

      <NewPurchaseForm suppliers={suppliers} catalogItems={catalogItems} />
    </div>
  );
}
