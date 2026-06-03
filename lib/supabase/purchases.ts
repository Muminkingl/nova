import { supabase } from "./client";
import { Purchase, PurchaseItem, SupplierPayment } from "@/types";

export type PurchaseWithSupplier = Purchase & {
  suppliers: { name: string } | null;
  items_count?: number;
};

/**
 * Get all purchases across all suppliers.
 */
export async function getPurchases(): Promise<{
  data: PurchaseWithSupplier[] | null;
  error: any;
}> {
  // Retrieve purchase orders joined with supplier name
  const { data: purchases, error } = await supabase
    .from("purchases")
    .select("*, suppliers(name)")
    .order("purchase_date", { ascending: false });

  if (error || !purchases) {
    return { data: null, error };
  }

  // Retrieve item counts per purchase to populate lists
  const { data: itemCounts } = await supabase
    .from("purchase_items")
    .select("purchase_id");

  const countMap = new Map<string, number>();
  if (itemCounts) {
    itemCounts.forEach((item) => {
      countMap.set(item.purchase_id, (countMap.get(item.purchase_id) || 0) + 1);
    });
  }

  const purchasesWithStats = purchases.map((p) => ({
    ...p,
    items_count: countMap.get(p.id) || 0,
  }));

  return { data: purchasesWithStats, error: null };
}

/**
 * Get a single purchase order by ID with details.
 */
export async function getPurchaseById(id: string): Promise<{
  data: {
    purchase: Purchase & { suppliers: { id: string; name: string } | null };
    items: (PurchaseItem & { items: { name: string; unit: string } | null })[];
    payments: SupplierPayment[];
  } | null;
  error: any;
}> {
  // Query purchase record
  const { data: purchase, error: pError } = await supabase
    .from("purchases")
    .select("*, suppliers(*)")
    .eq("id", id)
    .single();

  if (pError || !purchase) {
    return { data: null, error: pError };
  }

  // Query purchase items joined with details
  const { data: items, error: iError } = await supabase
    .from("purchase_items")
    .select("*, items(name, unit)")
    .eq("purchase_id", id);

  // Query payments recorded against this purchase
  const { data: payments, error: payError } = await supabase
    .from("supplier_payments")
    .select("*")
    .eq("purchase_id", id)
    .order("payment_date", { ascending: false });

  return {
    data: {
      purchase: purchase as any,
      items: (items || []) as any,
      payments: (payments || []) as SupplierPayment[],
    },
    error: null,
  };
}

/**
 * Record a new purchase order.
 */
export async function createPurchase(
  supplierId: string,
  purchaseDate: string,
  items: { item_id: string; quantity: number; buy_price: number; expiry_date: string | null }[],
  initialPayment: number,
  notes: string | null
): Promise<{ data: Purchase | null; error: any }> {
  // 1. Calculate total order value
  let totalAmount = 0;
  items.forEach((item) => {
    totalAmount += Number(item.quantity) * Number(item.buy_price);
  });

  // Determine initial payment status
  let status: "unpaid" | "partial" | "paid" = "unpaid";
  if (initialPayment >= totalAmount) {
    status = "paid";
  } else if (initialPayment > 0) {
    status = "partial";
  }

  // 2. Insert into purchases table
  const { data: purchase, error: pError } = await supabase
    .from("purchases")
    .insert([
      {
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        total_amount: totalAmount,
        amount_paid: initialPayment,
        status: status,
        notes: notes || null,
      },
    ])
    .select()
    .single();

  if (pError || !purchase) {
    return { data: null, error: pError };
  }

  const purchaseId = purchase.id;

  // 3. Insert items into purchase_items table
  const mappedItems = items.map((item) => ({
    purchase_id: purchaseId,
    item_id: item.item_id,
    quantity: Number(item.quantity),
    buy_price: Number(item.buy_price),
    expiry_date: item.expiry_date || null,
  }));

  const { error: itemsError } = await supabase.from("purchase_items").insert(mappedItems);

  if (itemsError) {
    // Attempt rolling back purchase (soft cleanup)
    await supabase.from("purchases").delete().eq("id", purchaseId);
    return { data: null, error: itemsError };
  }

  // 4. Record initial payment if > 0
  if (initialPayment > 0) {
    const { error: paymentError } = await supabase.from("supplier_payments").insert([
      {
        supplier_id: supplierId,
        purchase_id: purchaseId,
        amount: initialPayment,
        payment_date: purchaseDate,
        notes: "Initial payment recorded upon purchase order creation.",
      },
    ]);

    if (paymentError) {
      console.warn("Initial payment logging encountered an error, but purchase items were saved:", paymentError);
    }
  }

  return { data: purchase as Purchase, error: null };
}

/**
 * Record a payment against a supplier purchase ledger.
 */
export async function recordPayment(
  supplierId: string,
  purchaseId: string | null,
  amount: number,
  paymentDate: string,
  notes: string | null
): Promise<{ data: SupplierPayment | null; error: any }> {
  // 1. Insert supplier payment row
  const { data: payment, error: payError } = await supabase
    .from("supplier_payments")
    .insert([
      {
        supplier_id: supplierId,
        purchase_id: purchaseId || null,
        amount: Number(amount),
        payment_date: paymentDate,
        notes: notes || null,
      },
    ])
    .select()
    .single();

  if (payError || !payment) {
    return { data: null, error: payError };
  }

  // 2. If payment is linked to a purchase, update its amount_paid and recalculate status
  if (purchaseId) {
    // Get purchase details
    const { data: purchase } = await supabase
      .from("purchases")
      .select("total_amount, amount_paid")
      .eq("id", purchaseId)
      .single();

    if (purchase) {
      const currentPaid = Number(purchase.amount_paid || 0);
      const totalAmt = Number(purchase.total_amount || 0);
      const newPaid = Math.min(totalAmt, currentPaid + Number(amount));

      let newStatus: "unpaid" | "partial" | "paid" = "unpaid";
      if (newPaid >= totalAmt) {
        newStatus = "paid";
      } else if (newPaid > 0) {
        newStatus = "partial";
      }

      await supabase
        .from("purchases")
        .update({
          amount_paid: newPaid,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchaseId);
    }
  }

  return { data: payment as SupplierPayment, error: null };
}

/**
 * Retrieve outstanding liabilities.
 */
export async function getOutstandingSupplierDebtTotal(): Promise<number> {
  // Total liabilities across all active purchases and payments
  const { data: purchases } = await supabase.from("purchases").select("total_amount");
  const { data: payments } = await supabase.from("supplier_payments").select("amount");

  let totalPurchased = 0;
  let totalPaid = 0;

  if (purchases) {
    purchases.forEach((p) => {
      totalPurchased += Number(p.total_amount);
    });
  }

  if (payments) {
    payments.forEach((pay) => {
      totalPaid += Number(pay.amount);
    });
  }

  return Math.max(0, totalPurchased - totalPaid);
}
