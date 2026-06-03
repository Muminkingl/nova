"use server";

import {
  getFinancialOverview,
  getProfitByItem,
  getMonthlySalesTrend,
  getTopCustomersByDebt,
  getTopSuppliersByDebt,
  getCustomerStatement,
  getSupplierStatement,
  getExpiryAlerts,
  getRecentActivity
} from "@/lib/supabase/reports";

export async function getFinancialOverviewAction() {
  try {
    const data = await getFinancialOverview();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to load financial overview." };
  }
}

export async function getProfitByItemAction(filters?: {
  from?: string;
  to?: string;
  category?: string;
  customer_id?: string;
}) {
  try {
    const data = await getProfitByItem(filters);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to load profit margins." };
  }
}

export async function getMonthlySalesTrendAction() {
  try {
    const data = await getMonthlySalesTrend();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to load sales trend." };
  }
}

export async function getTopCustomersByDebtAction(limit?: number) {
  try {
    const data = await getTopCustomersByDebt(limit);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to load top customer debts." };
  }
}

export async function getTopSuppliersByDebtAction(limit?: number) {
  try {
    const data = await getTopSuppliersByDebt(limit);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to load top supplier liabilities." };
  }
}

export async function getCustomerStatementAction(
  customerId: string,
  from?: string,
  to?: string
) {
  try {
    const data = await getCustomerStatement(customerId, from, to);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to compile customer statement." };
  }
}

export async function getSupplierStatementAction(
  supplierId: string,
  from?: string,
  to?: string
) {
  try {
    const data = await getSupplierStatement(supplierId, from, to);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to compile supplier statement." };
  }
}

export async function getExpiryAlertsAction() {
  try {
    const data = await getExpiryAlerts();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to fetch expiry warnings." };
  }
}

export async function getRecentActivityAction(limit?: number) {
  try {
    const data = await getRecentActivity(limit);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to load recent activity feed." };
  }
}
