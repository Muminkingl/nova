"use server";

import * as db from "@/lib/supabase/suppliers";
import { Supplier } from "@/types";
import { revalidatePath } from "next/cache";

export async function getSuppliersAction() {
  return await db.getSuppliers();
}

export async function getSupplierByIdAction(id: string) {
  return await db.getSupplierById(id);
}

export async function createSupplierAction(
  data: Omit<Supplier, "id" | "is_active" | "created_at" | "updated_at">
) {
  const res = await db.createSupplier(data);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/suppliers");
  return res;
}

export async function updateSupplierAction(
  id: string,
  data: Partial<Omit<Supplier, "id" | "is_active" | "created_at" | "updated_at">>
) {
  const res = await db.updateSupplier(id, data);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/suppliers");
  revalidatePath(`/dashboard/suppliers/${id}`);
  return res;
}

export async function deactivateSupplierAction(id: string) {
  const res = await db.deactivateSupplier(id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/suppliers");
  return res;
}
