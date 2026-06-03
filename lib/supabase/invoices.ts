import { supabaseAdmin as supabase } from "./adminClient";
import { Invoice, InvoiceItem, CustomerPayment } from "@/types";

export type InvoiceWithCustomer = Invoice & {
  customers: { name: string } | null;
  items_count?: number;
};

/**
 * Get all invoices across all customers.
 */
export async function getInvoices(): Promise<{
  data: InvoiceWithCustomer[] | null;
  error: any;
}> {
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*, customers(name)")
    .order("invoice_number", { ascending: false });

  if (error || !invoices) {
    return { data: null, error };
  }

  // Retrieve item counts per invoice
  const { data: itemCounts } = await supabase
    .from("invoice_items")
    .select("invoice_id");

  const countMap = new Map<string, number>();
  if (itemCounts) {
    itemCounts.forEach((item) => {
      countMap.set(item.invoice_id, (countMap.get(item.invoice_id) || 0) + 1);
    });
  }

  const invoicesWithStats = invoices.map((i) => ({
    ...i,
    items_count: countMap.get(i.id) || 0,
  }));

  return { data: invoicesWithStats, error: null };
}

/**
 * Get a single sales invoice by ID.
 */
export async function getInvoiceById(id: string): Promise<{
  data: {
    invoice: Invoice & { customers: { id: string; name: string; phone: string | null; address: string | null } | null };
    items: (InvoiceItem & { items: { name: string; unit: string } | null })[];
    payments: CustomerPayment[];
  } | null;
  error: any;
}> {
  const { data: invoice, error: iError } = await supabase
    .from("invoices")
    .select("*, customers(*)")
    .eq("id", id)
    .single();

  if (iError || !invoice) {
    return { data: null, error: iError };
  }

  // Query invoice items joined with details
  const { data: items, error: itemsError } = await supabase
    .from("invoice_items")
    .select("*, items(name, unit)")
    .eq("invoice_id", id);

  // Query payments recorded against this invoice
  const { data: payments, error: payError } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("invoice_id", id)
    .order("payment_date", { ascending: false });

  return {
    data: {
      invoice: invoice as any,
      items: (items || []) as any,
      payments: (payments || []) as CustomerPayment[],
    },
    error: null,
  };
}

/**
 * Record a new sales invoice.
 */
export async function createInvoice(
  customerId: string,
  invoiceDate: string,
  items: { item_id: string; quantity: number; sell_price: number; discount_percent: number }[],
  initialPayment: number,
  notes: string | null
): Promise<{ data: Invoice | null; error: any }> {
  // 1. Calculate totals
  let totalAmount = 0;
  let discountAmount = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.sell_price);
    const dPercent = Number(item.discount_percent || 0);

    const sub = qty * price;
    const itemDiscount = sub * (dPercent / 100);

    totalAmount += sub;
    discountAmount += itemDiscount;
  });

  const finalAmount = totalAmount - discountAmount;

  // Determine payment status
  let status: "unpaid" | "partial" | "paid" = "unpaid";
  if (initialPayment >= finalAmount) {
    status = "paid";
  } else if (initialPayment > 0) {
    status = "partial";
  }

  // 2. Generate invoice number via Supabase function
  const { data: invoiceNumber, error: numError } = await supabase
    .rpc("generate_invoice_number");

  if (numError || !invoiceNumber) {
    return { data: null, error: numError || new Error("Failed to generate invoice number") };
  }

  // 3. Insert into invoices table
  const { data: invoice, error: iError } = await supabase
    .from("invoices")
    .insert([
      {
        invoice_number: invoiceNumber,
        customer_id: customerId,
        invoice_date: invoiceDate,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        amount_paid: initialPayment,
        status: status,
        notes: notes || null,
      },
    ])
    .select()
    .single();

  if (iError || !invoice) {
    return { data: null, error: iError };
  }

  const invoiceId = invoice.id;

  // 4. Insert items into invoice_items table
  const mappedItems = items.map((item) => ({
    invoice_id: invoiceId,
    item_id: item.item_id,
    quantity: Number(item.quantity),
    sell_price: Number(item.sell_price),
    discount_percent: Number(item.discount_percent || 0),
  }));

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(mappedItems);

  if (itemsError) {
    // Attempt rolling back invoice
    await supabase.from("invoices").delete().eq("id", invoiceId);
    return { data: null, error: itemsError };
  }

  // 5. Record initial payment if > 0
  if (initialPayment > 0) {
    const { error: paymentError } = await supabase.from("customer_payments").insert([
      {
        customer_id: customerId,
        invoice_id: invoiceId,
        amount: initialPayment,
        payment_date: invoiceDate,
        notes: `Initial payment recorded upon invoice ${invoiceNumber} creation.`,
      },
    ]);

    if (paymentError) {
      console.warn("Initial payment logging encountered an error:", paymentError);
    }
  }

  return { data: invoice as Invoice, error: null };
}

/**
 * Record a payment from a customer.
 */
export async function recordCustomerPayment(
  customerId: string,
  invoiceId: string | null,
  amount: number,
  paymentDate: string,
  notes: string | null
): Promise<{ data: CustomerPayment | null; error: any }> {
  // 1. Insert customer payment row
  const { data: payment, error: payError } = await supabase
    .from("customer_payments")
    .insert([
      {
        customer_id: customerId,
        invoice_id: invoiceId || null,
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

  // 2. If payment is linked to an invoice, update its amount_paid and recalculate status
  if (invoiceId) {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("final_amount, amount_paid")
      .eq("id", invoiceId)
      .single();

    if (invoice) {
      const currentPaid = Number(invoice.amount_paid || 0);
      const finalAmt = Number(invoice.final_amount || 0);
      const newPaid = Math.min(finalAmt, currentPaid + Number(amount));

      let newStatus: "unpaid" | "partial" | "paid" = "unpaid";
      if (newPaid >= finalAmt) {
        newStatus = "paid";
      } else if (newPaid > 0) {
        newStatus = "partial";
      }

      await supabase
        .from("invoices")
        .update({
          amount_paid: newPaid,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);
    }
  }

  return { data: payment as CustomerPayment, error: null };
}

/**
 * Retrieve outstanding receivables.
 */
export async function getOutstandingCustomerDebtTotal(): Promise<number> {
  const { data: invoices } = await supabase.from("invoices").select("final_amount");
  const { data: payments } = await supabase.from("customer_payments").select("amount");

  let totalInvoiced = 0;
  let totalPaid = 0;

  if (invoices) {
    invoices.forEach((inv) => {
      totalInvoiced += Number(inv.final_amount);
    });
  }

  if (payments) {
    payments.forEach((pay) => {
      totalPaid += Number(pay.amount);
    });
  }

  return Math.max(0, totalInvoiced - totalPaid);
}
