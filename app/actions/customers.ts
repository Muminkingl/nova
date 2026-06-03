"use server";

import * as db from "@/lib/supabase/customers";
import { Customer } from "@/types";
import { revalidatePath } from "next/cache";

export type { CustomerWithStats } from "@/lib/supabase/customers";

export async function getCustomersAction() {
  return await db.getCustomers();
}

export async function getCustomerByIdAction(id: string) {
  return await db.getCustomerById(id);
}

export async function createCustomerAction(
  data: Omit<Customer, "id" | "is_active" | "created_at" | "updated_at">
) {
  const res = await db.createCustomer(data);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/customers");
  return res;
}

export async function updateCustomerAction(
  id: string,
  data: Partial<Omit<Customer, "id" | "is_active" | "created_at" | "updated_at">>
) {
  const res = await db.updateCustomer(id, data);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  return res;
}

export async function deactivateCustomerAction(id: string) {
  const res = await db.deactivateCustomer(id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/customers");
  return res;
}
