import { getItemsAction } from "@/app/actions/items";
import StockTable from "@/components/items/StockTable";

export const metadata = {
  title: "Stock Balance - Nova Medical ERP",
  description: "View current medical stock levels, warnings, and expiry timelines",
};

export default async function StockPage() {
  const { data: items, error } = await getItemsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Stock Balance</h1>
        <p className="text-sm text-muted-foreground">
          Monitor real-time warehouse inventory volumes, low stock flags, and expiring batch dates
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          Error loading stock inventory records: {error.message || "Unknown error"}
        </div>
      )}

      <StockTable items={items || []} />
    </div>
  );
}
