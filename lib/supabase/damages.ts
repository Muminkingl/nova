import { supabase } from "./client";
import { Damage, DamageFormData } from "@/types";

export type DamageWithItem = Damage & {
  items: {
    name: string;
    unit: string;
    buy_price: number;
  } | null;
};

/**
 * Get all damage logs with item info, filtered by reason and date range.
 */
export async function getDamages(filters?: {
  reason?: string;
  from?: string;
  to?: string;
}): Promise<{ data: DamageWithItem[] | null; error: any }> {
  let query = supabase
    .from("damages")
    .select("*, items(name, unit, buy_price)")
    .order("damage_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.reason && filters.reason !== "all") {
    query = query.eq("reason", filters.reason);
  }
  if (filters?.from) {
    query = query.gte("damage_date", filters.from);
  }
  if (filters?.to) {
    query = query.lte("damage_date", filters.to);
  }

  const { data, error } = await query;
  return { data: data as DamageWithItem[] | null, error };
}

/**
 * Record a new damage write-off.
 * Automatically fetches the item's buy price to record the correct financial cost.
 */
export async function createDamage(
  data: DamageFormData
): Promise<{ data: Damage | null; error: any }> {
  // 1. Get the item's current buy price
  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("buy_price, stock_qty")
    .eq("id", data.item_id)
    .single();

  if (itemError || !item) {
    return { data: null, error: itemError || new Error("Item not found") };
  }

  // 2. Validate quantity boundaries
  if (item.stock_qty < data.quantity) {
    return { data: null, error: new Error(`Cannot write off ${data.quantity} units; only ${item.stock_qty} available in stock`) };
  }

  // 3. Compute cost: quantity * buy_price
  const cost = data.quantity * Number(item.buy_price);

  // 4. Insert the damage record
  const { data: inserted, error: insertError } = await supabase
    .from("damages")
    .insert([
      {
        item_id: data.item_id,
        quantity: Number(data.quantity),
        reason: data.reason,
        notes: data.notes || null,
        cost: cost,
        damage_date: data.damage_date,
      },
    ])
    .select()
    .single();

  return { data: inserted as Damage | null, error: insertError };
}
