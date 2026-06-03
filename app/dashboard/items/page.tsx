import { getItemsAction } from "@/app/actions/items";
import ItemsTableWrapper from "./ItemsTableWrapper";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Items Catalog - Nova Medical ERP",
  description: "View and manage active medical supply products in the catalog",
};

export default async function ItemsPage() {
  const { data: items, error } = await getItemsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Items Catalog</h1>
        <p className="text-sm text-muted-foreground">
          View all registered medical products, buy/sell prices, and current warehouse stock counts
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          Error loading catalog items: {error.message || "Unknown error"}
        </div>
      )}

      <ItemsTableWrapper initialItems={items || []} />
    </div>
  );
}
