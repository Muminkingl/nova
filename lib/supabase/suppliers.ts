import { supabase } from "./client";
import { Supplier } from "@/types";

export type SupplierWithStats = Supplier & {
  total_debt: number;
  purchases_count: number;
};

/**
 * Get all active suppliers with aggregate debt and purchases metrics.
 */
export async function getSuppliers(): Promise<{
  data: SupplierWithStats[] | null;
  error: any;
}> {
  // Fetch active suppliers
  const { data: suppliers, error: sError } = await supabase
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (sError || !suppliers) {
    return { data: null, error: sError };
  }

  // Fetch all purchases to aggregate debt
  const { data: purchases, error: pError } = await supabase
    .from("purchases")
    .select("supplier_id, total_amount, amount_paid");

  // Fetch all supplier payments to aggregate total paid
  const { data: payments, error: payError } = await supabase
    .from("supplier_payments")
    .select("supplier_id, amount");

  const supplierStatsMap = new Map<string, { totalPurchased: number; totalPaid: number; count: number }>();

  suppliers.forEach((s) => {
    supplierStatsMap.set(s.id, { totalPurchased: 0, totalPaid: 0, count: 0 });
  });

  if (purchases) {
    purchases.forEach((p) => {
      const stats = supplierStatsMap.get(p.supplier_id);
      if (stats) {
        stats.totalPurchased += Number(p.total_amount);
        stats.count += 1;
      }
    });
  }

  if (payments) {
    payments.forEach((pay) => {
      const stats = supplierStatsMap.get(pay.supplier_id);
      if (stats) {
        stats.totalPaid += Number(pay.amount);
      }
    });
  }

  const suppliersWithStats: SupplierWithStats[] = suppliers.map((s) => {
    const stats = supplierStatsMap.get(s.id) || { totalPurchased: 0, totalPaid: 0, count: 0 };
    const debt = stats.totalPurchased - stats.totalPaid;
    return {
      ...s,
      total_debt: Math.max(0, debt),
      purchases_count: stats.count,
    };
  });

  return { data: suppliersWithStats, error: null };
}

/**
 * Get a single supplier by ID with complete purchase, payment, and debt ledger profiles.
 */
export async function getSupplierById(id: string): Promise<{
  data: {
    supplier: Supplier;
    total_purchased: number;
    total_paid: number;
    outstanding_debt: number;
    purchases: any[];
    payments: any[];
  } | null;
  error: any;
}> {
  // Query supplier details
  const { data: supplier, error: sError } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (sError || !supplier) {
    return { data: null, error: sError };
  }

  // Fetch purchase history (ordered by date descending)
  const { data: purchases, error: pError } = await supabase
    .from("purchases")
    .select("*, purchase_items(count)")
    .eq("supplier_id", id)
    .order("purchase_date", { ascending: false });

  // Fetch payment history (ordered by date descending)
  const { data: payments, error: payError } = await supabase
    .from("supplier_payments")
    .select("*")
    .eq("supplier_id", id)
    .order("payment_date", { ascending: false });

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

  const outstandingDebt = Math.max(0, totalPurchased - totalPaid);

  return {
    data: {
      supplier: supplier as Supplier,
      total_purchased: totalPurchased,
      total_paid: totalPaid,
      outstanding_debt: outstandingDebt,
      purchases: purchases || [],
      payments: payments || [],
    },
    error: null,
  };
}

/**
 * Create a new supplier profile.
 */
export async function createSupplier(data: Omit<Supplier, "id" | "is_active" | "created_at" | "updated_at">): Promise<{
  data: Supplier | null;
  error: any;
}> {
  const { data: inserted, error } = await supabase
    .from("suppliers")
    .insert([
      {
        name: data.name,
        contact_person: data.contact_person || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        is_active: true,
      },
    ])
    .select()
    .single();

  return { data: inserted as Supplier | null, error };
}

/**
 * Update an existing supplier profile.
 */
export async function updateSupplier(
  id: string,
  data: Partial<Omit<Supplier, "id" | "is_active" | "created_at" | "updated_at">>
): Promise<{
  data: Supplier | null;
  error: any;
}> {
  const { data: updated, error } = await supabase
    .from("suppliers")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_active", true)
    .select()
    .single();

  return { data: updated as Supplier | null, error };
}

/**
 * Soft delete (deactivate) a supplier.
 */
export async function deactivateSupplier(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("suppliers")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return { error };
}
