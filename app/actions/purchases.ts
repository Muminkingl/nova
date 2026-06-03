"use server";

import * as db from "@/lib/supabase/purchases";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/supabase/activity";

export async function getPurchasesAction() {
  return await db.getPurchases();
}

export async function getPurchaseByIdAction(id: string) {
  return await db.getPurchaseById(id);
}

export async function createPurchaseAction(
  supplierId: string,
  purchaseDate: string,
  items: { item_id: string; quantity: number; buy_price: number; expiry_date: string | null }[],
  initialPayment: number,
  notes: string | null
) {
  const res = await db.createPurchase(supplierId, purchaseDate, items, initialPayment, notes);
  
  if (res.data && !res.error) {
    await logActivity({
      action: "created",
      entity_type: "purchase",
      entity_id: res.data.id,
      entity_label: `PUR-${res.data.id.substring(0, 4).toUpperCase()}`,
      details: {
        supplier_id: supplierId,
        total_amount: res.data.total_amount,
        items_count: items.length
      }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/suppliers");
  revalidatePath(`/dashboard/suppliers/${supplierId}`);
  revalidatePath("/dashboard/stock");
  return res;
}

export async function recordPaymentAction(
  supplierId: string,
  purchaseId: string | null,
  amount: number,
  paymentDate: string,
  notes: string | null
) {
  const res = await db.recordPayment(supplierId, purchaseId, amount, paymentDate, notes);
  
  if (res.data && !res.error) {
    await logActivity({
      action: "payment_recorded",
      entity_type: "payment",
      entity_id: res.data.id,
      entity_label: purchaseId ? `Supplier Invoice Payment` : `Supplier General Payment`,
      details: {
        supplier_id: supplierId,
        purchase_id: purchaseId,
        amount: Number(amount)
      }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/purchases");
  if (purchaseId) {
    revalidatePath(`/dashboard/purchases/${purchaseId}`);
  }
  revalidatePath("/dashboard/suppliers");
  revalidatePath(`/dashboard/suppliers/${supplierId}`);
  return res;
}

export async function getOutstandingSupplierDebtTotalAction() {
  return await db.getOutstandingSupplierDebtTotal();
}

