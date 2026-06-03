import { getItemsAction } from "@/app/actions/items";
import ItemForm from "@/components/items/ItemForm";

export const metadata = {
  title: "Add New Item - Nova Medical ERP",
  description: "Register a new medical product entry in the catalog",
};

export default async function AddItemPage() {
  const { data: items } = await getItemsAction();
  
  // Extract unique categories for pre-filling dropdown options
  const existingCategories = Array.from(
    new Set(
      (items || [])
        .map((item) => item.category)
        .filter((cat): cat is string => !!cat)
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Add New Item</h1>
        <p className="text-sm text-muted-foreground">
          Register a new medical item, set prices, and record opening warehouse quantities
        </p>
      </div>

      <ItemForm existingCategories={existingCategories} />
    </div>
  );
}
