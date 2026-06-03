import { getSuppliersAction } from "@/app/actions/suppliers";
import { getPurchasesAction } from "@/app/actions/purchases";
import PurchasesTableWrapper from "./PurchasesTableWrapper";

export const metadata = {
  title: "Purchases Ledger - Nova Medical ERP",
  description: "View and record incoming supplier purchase orders",
};

export default async function PurchasesPage() {
  const [purchasesRes, suppliersRes] = await Promise.all([
    getPurchasesAction(),
    getSuppliersAction(),
  ]);

  const purchases = purchasesRes.data || [];
  const suppliers = (suppliersRes.data || []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Purchases Orders</h1>
        <p className="text-sm text-muted-foreground">
          Record received medical inventory shipments, payments, and outstanding vendor credits
        </p>
      </div>

      {purchasesRes.error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          Error loading purchases record ledger: {purchasesRes.error.message || "Unknown error"}
        </div>
      )}

      <PurchasesTableWrapper initialPurchases={purchases} suppliers={suppliers} />
    </div>
  );
}
