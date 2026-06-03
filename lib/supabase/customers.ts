import { supabase } from "./client";
import { Customer } from "@/types";

export type CustomerWithStats = Customer & {
  outstanding_debt: number;
  invoices_count: number;
};

/**
 * Get all active customers with outstanding debt and invoice count details.
 */
export async function getCustomers(): Promise<{
  data: CustomerWithStats[] | null;
  error: any;
}> {
  // Fetch active customers
  const { data: customers, error: cError } = await supabase
    .from("customers")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (cError || !customers) {
    return { data: null, error: cError };
  }

  // Fetch all invoices to compute outstanding balances
  const { data: invoices, error: iError } = await supabase
    .from("invoices")
    .select("customer_id, final_amount, amount_paid");

  // Fetch all customer payments to compute paid totals
  const { data: payments, error: payError } = await supabase
    .from("customer_payments")
    .select("customer_id, amount");

  const customerStatsMap = new Map<string, { totalInvoiced: number; totalPaid: number; count: number }>();

  customers.forEach((c) => {
    customerStatsMap.set(c.id, { totalInvoiced: 0, totalPaid: 0, count: 0 });
  });

  if (invoices) {
    invoices.forEach((inv) => {
      const stats = customerStatsMap.get(inv.customer_id);
      if (stats) {
        stats.totalInvoiced += Number(inv.final_amount);
        stats.count += 1;
      }
    });
  }

  if (payments) {
    payments.forEach((pay) => {
      const stats = customerStatsMap.get(pay.customer_id);
      if (stats) {
        stats.totalPaid += Number(pay.amount);
      }
    });
  }

  const customersWithStats: CustomerWithStats[] = customers.map((c) => {
    const stats = customerStatsMap.get(c.id) || { totalInvoiced: 0, totalPaid: 0, count: 0 };
    const debt = stats.totalInvoiced - stats.totalPaid;
    return {
      ...c,
      outstanding_debt: Math.max(0, debt),
      invoices_count: stats.count,
    };
  });

  return { data: customersWithStats, error: null };
}

/**
 * Get a single customer by ID with complete invoice, payment, and debt ledger profiles.
 */
export async function getCustomerById(id: string): Promise<{
  data: {
    customer: Customer;
    total_invoiced: number;
    total_paid: number;
    outstanding_debt: number;
    invoices: any[];
    payments: any[];
  } | null;
  error: any;
}> {
  // Query customer details
  const { data: customer, error: cError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (cError || !customer) {
    return { data: null, error: cError };
  }

  // Fetch invoice history (ordered by date descending)
  const { data: invoices, error: iError } = await supabase
    .from("invoices")
    .select("*, invoice_items(count)")
    .eq("customer_id", id)
    .order("invoice_date", { ascending: false });

  // Fetch payment history (ordered by date descending)
  const { data: payments, error: payError } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("customer_id", id)
    .order("payment_date", { ascending: false });

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

  const outstandingDebt = Math.max(0, totalInvoiced - totalPaid);

  return {
    data: {
      customer: customer as Customer,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      outstanding_debt: outstandingDebt,
      invoices: invoices || [],
      payments: payments || [],
    },
    error: null,
  };
}

/**
 * Create a new customer profile.
 */
export async function createCustomer(data: Omit<Customer, "id" | "is_active" | "created_at" | "updated_at">): Promise<{
  data: Customer | null;
  error: any;
}> {
  const { data: inserted, error } = await supabase
    .from("customers")
    .insert([
      {
        name: data.name,
        type: data.type || "hospital",
        contact_person: data.contact_person || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        is_active: true,
      },
    ])
    .select()
    .single();

  return { data: inserted as Customer | null, error };
}

/**
 * Update an existing customer profile.
 */
export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, "id" | "is_active" | "created_at" | "updated_at">>
): Promise<{
  data: Customer | null;
  error: any;
}> {
  const { data: updated, error } = await supabase
    .from("customers")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_active", true)
    .select()
    .single();

  return { data: updated as Customer | null, error };
}

/**
 * Soft delete (deactivate) a customer.
 */
export async function deactivateCustomer(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("customers")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return { error };
}
