import { supabase } from "./client";
import { Item, ItemFormData } from "@/types";

/**
 * Get all active items ordered by name.
 */
export async function getItems(): Promise<{ data: Item[] | null; error: any }> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return { data: data as Item[] | null, error };
}

/**
 * Get a single active item by ID.
 */
export async function getItemById(id: string): Promise<{ data: Item | null; error: any }> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  return { data: data as Item | null, error };
}

/**
 * Create a new item.
 */
export async function createItem(data: ItemFormData): Promise<{ data: Item | null; error: any }> {
  const { data: inserted, error } = await supabase
    .from("items")
    .insert([
      {
        name: data.name,
        category: data.category || null,
        unit: data.unit,
        buy_price: Number(data.buy_price),
        sell_price: Number(data.sell_price),
        stock_qty: Number(data.stock_qty),
        expiry_date: data.expiry_date || null,
        min_stock_alert: Number(data.min_stock_alert ?? 10),
        is_active: true,
      },
    ])
    .select()
    .single();

  return { data: inserted as Item | null, error };
}

/**
 * Update an existing item (excluding stock quantity to adhere to Phase 1 specs).
 */
export async function updateItem(
  id: string,
  data: Partial<ItemFormData>
): Promise<{ data: Item | null; error: any }> {
  // Enforce removal of stock_qty from the update payload
  const { stock_qty, ...updatePayload } = data as any;
  
  const { data: updated, error } = await supabase
    .from("items")
    .update({
      ...updatePayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_active", true)
    .select()
    .single();

  return { data: updated as Item | null, error };
}

/**
 * Soft delete an item (deactivate it).
 */
export async function deactivateItem(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("items")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return { error };
}

/**
 * Retrieve summary statistics count of stock levels for cards.
 */
export async function getStockSummary() {
  const { data: items, error } = await supabase
    .from("items")
    .select("stock_qty, min_stock_alert, expiry_date")
    .eq("is_active", true);

  if (error || !items) {
    return {
      totalItems: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      expiringSoonCount: 0,
      error,
    };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiringSoonCount = 0;

  items.forEach((item) => {
    const qty = Number(item.stock_qty || 0);
    const alertThreshold = Number(item.min_stock_alert ?? 10);
    const expiry = item.expiry_date;

    // Out of Stock check
    if (qty === 0) {
      outOfStockCount++;
    }
    // Low Stock check
    else if (qty <= alertThreshold) {
      lowStockCount++;
    }

    // Expiring within 30 days check
    if (expiry && expiry >= todayStr && expiry <= thirtyDaysFromNow) {
      expiringSoonCount++;
    }
  });

  return {
    totalItems: items.length,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
    error: null,
  };
}
