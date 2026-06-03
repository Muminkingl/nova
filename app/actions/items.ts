"use server";

import * as db from "@/lib/supabase/items";
import { ItemFormData } from "@/types";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/supabase/activity";

export async function getStockSummaryAction() {
  return await db.getStockSummary();
}

export async function getItemsAction() {
  return await db.getItems();
}

export async function getItemByIdAction(id: string) {
  return await db.getItemById(id);
}

export async function createItemAction(data: ItemFormData) {
  const res = await db.createItem(data);
  
  if (res.data && !res.error) {
    await logActivity({
      action: "created",
      entity_type: "item",
      entity_id: res.data.id,
      entity_label: res.data.name,
      details: { category: data.category, buy_price: data.buy_price, sell_price: data.sell_price }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/items");
  revalidatePath("/dashboard/stock");
  return res;
}

export async function updateItemAction(id: string, data: Partial<ItemFormData>) {
  const res = await db.updateItem(id, data);
  
  if (res.data && !res.error) {
    await logActivity({
      action: "updated",
      entity_type: "item",
      entity_id: id,
      entity_label: res.data.name,
      details: { changes: Object.keys(data) }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/items");
  revalidatePath("/dashboard/stock");
  return res;
}

export async function deactivateItemAction(id: string) {
  const res = await db.deactivateItem(id);
  
  // We can fetch item details to get name for label, or use placeholder
  const itemDetails = await db.getItemById(id);
  const nameLabel = itemDetails.data?.name || `Item ${id.substring(0, 4)}`;

  if (!res.error) {
    await logActivity({
      action: "deactivated",
      entity_type: "item",
      entity_id: id,
      entity_label: nameLabel,
      details: { is_active: false }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/items");
  revalidatePath("/dashboard/stock");
  return res;
}

