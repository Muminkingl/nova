"use server";

import * as db from "@/lib/supabase/invoices";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/supabase/activity";

export async function getInvoicesAction() {
  return await db.getInvoices();
}

export async function getInvoiceByIdAction(id: string) {
  return await db.getInvoiceById(id);
}

export async function createInvoiceAction(
  customerId: string,
  invoiceDate: string,
  items: { item_id: string; quantity: number; sell_price: number; discount_percent: number }[],
  initialPayment: number,
  notes: string | null
) {
  const res = await db.createInvoice(customerId, invoiceDate, items, initialPayment, notes);
  
  if (res.data && !res.error) {
    await logActivity({
      action: "created",
      entity_type: "invoice",
      entity_id: res.data.id,
      entity_label: res.data.invoice_number,
      details: {
        customer_id: customerId,
        final_amount: res.data.final_amount,
        items_count: items.length
      }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/stock");
  return res;
}

export async function recordCustomerPaymentAction(
  customerId: string,
  invoiceId: string | null,
  amount: number,
  paymentDate: string,
  notes: string | null
) {
  const res = await db.recordCustomerPayment(customerId, invoiceId, amount, paymentDate, notes);
  
  if (res.data && !res.error) {
    await logActivity({
      action: "payment_recorded",
      entity_type: "payment",
      entity_id: res.data.id,
      entity_label: invoiceId ? `Invoice Payment` : `General Credit Collection`,
      details: {
        customer_id: customerId,
        invoice_id: invoiceId,
        amount: Number(amount)
      }
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  if (invoiceId) {
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
  }
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${customerId}`);
  return res;
}

export async function getOutstandingCustomerDebtTotalAction() {
  return await db.getOutstandingCustomerDebtTotal();
}

