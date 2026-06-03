import { getItemByIdAction, getItemsAction } from "@/app/actions/items";
import ItemForm from "@/components/items/ItemForm";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Edit Item - Nova Medical ERP",
  description: "Modify medical product parameters in the catalog",
};

export default async function EditItemPage({ params }: { params: Params }) {
  const { id } = await params;

  // Retrieve item by ID
  const { data: item, error } = await getItemByIdAction(id);
  if (error || !item) {
    notFound();
  }

  // Retrieve existing active catalog items to seed categories dropdown
  const { data: items } = await getItemsAction();
  const existingCategories = Array.from(
    new Set(
      (items || [])
        .map((i) => i.category)
        .filter((cat): cat is string => !!cat && cat !== item.category)
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Item</h1>
        <p className="text-sm text-muted-foreground">
          Modify catalog details for `{item.name}`. Stock levels are locked for integrity.
        </p>
      </div>

      <ItemForm item={item} existingCategories={existingCategories} />
    </div>
  );
}
