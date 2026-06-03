import { supabase } from "./client";
import { FinancialOverview, ProfitByItem, StatementEntry, ExpiryAlert } from "@/types";

/**
 * Get financial overview summary stats.
 */
export async function getFinancialOverview(): Promise<FinancialOverview> {
  const [
    { data: invoices },
    { data: payments },
    { data: purchases },
    { data: supplierPayments },
    { data: items },
    { data: damages },
  ] = await Promise.all([
    supabase.from("invoices").select("final_amount"),
    supabase.from("customer_payments").select("amount"),
    supabase.from("purchases").select("total_amount"),
    supabase.from("supplier_payments").select("amount"),
    supabase.from("items").select("stock_qty, buy_price").eq("is_active", true),
    supabase.from("damages").select("cost"),
  ]);

  let total_revenue = 0;
  if (invoices) {
    invoices.forEach((inv) => (total_revenue += Number(inv.final_amount)));
  }

  let total_cost = 0;
  if (purchases) {
    purchases.forEach((pur) => (total_cost += Number(pur.total_amount)));
  }

  const gross_profit = total_revenue - total_cost;

  let totalCustomerPaid = 0;
  if (payments) {
    payments.forEach((pay) => (totalCustomerPaid += Number(pay.amount)));
  }
  const customer_debt = Math.max(0, total_revenue - totalCustomerPaid);

  let totalSupplierPaid = 0;
  if (supplierPayments) {
    supplierPayments.forEach((pay) => (totalSupplierPaid += Number(pay.amount)));
  }
  const supplier_debt = Math.max(0, total_cost - totalSupplierPaid);

  let stock_value = 0;
  if (items) {
    items.forEach((item) => {
      stock_value += Number(item.stock_qty || 0) * Number(item.buy_price || 0);
    });
  }

  let damage_losses = 0;
  if (damages) {
    damages.forEach((dmg) => (damage_losses += Number(dmg.cost || 0)));
  }

  // Net Position = Gross Profit - Supplier Debt + Customer Debt
  const net_position = gross_profit - supplier_debt + customer_debt;

  return {
    total_revenue,
    total_cost,
    gross_profit,
    customer_debt,
    supplier_debt,
    stock_value,
    damage_losses,
    net_position,
  };
}

/**
 * Get profit margins per item with optional filters.
 * Implements historical purchase price cross-referencing.
 */
export async function getProfitByItem(filters?: {
  from?: string;
  to?: string;
  category?: string;
  customer_id?: string;
}): Promise<ProfitByItem[]> {
  // 1. Fetch sales items
  let salesQuery = supabase
    .from("invoice_items")
    .select("*, invoices!inner(*), items!inner(*)");

  if (filters?.from) {
    salesQuery = salesQuery.gte("invoices.invoice_date", filters.from);
  }
  if (filters?.to) {
    salesQuery = salesQuery.lte("invoices.invoice_date", filters.to);
  }
  if (filters?.customer_id) {
    salesQuery = salesQuery.eq("invoices.customer_id", filters.customer_id);
  }
  if (filters?.category) {
    salesQuery = salesQuery.eq("items.category", filters.category);
  }

  const { data: salesItems, error: salesError } = await salesQuery;
  if (salesError || !salesItems) {
    console.error("Sales fetch error in profitability:", salesError);
    return [];
  }

  // 2. Fetch purchase items to resolve historical costs
  const { data: purchaseItems, error: purchaseError } = await supabase
    .from("purchase_items")
    .select("*, purchases!inner(purchase_date)");

  if (purchaseError) {
    console.error("Purchases fetch error in profitability:", purchaseError);
  }

  // Group purchases by item_id sorted by date descending to find matching price
  const purchasesByItem = new Map<string, any[]>();
  if (purchaseItems) {
    purchaseItems.forEach((p) => {
      const itemId = p.item_id;
      if (!purchasesByItem.has(itemId)) {
        purchasesByItem.set(itemId, []);
      }
      purchasesByItem.get(itemId)!.push({
        date: p.purchases.purchase_date,
        buy_price: Number(p.buy_price),
      });
    });

    // Sort purchase items by date descending
    purchasesByItem.forEach((list) => {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }

  // 3. Aggregate profit per item in memory
  const profitMap = new Map<string, {
    name: string;
    units_sold: number;
    revenue: number;
    cost: number;
    discount: number;
  }>();

  salesItems.forEach((sale) => {
    const item = sale.items;
    const invoice = sale.invoices;
    const itemId = sale.item_id;
    const qty = Number(sale.quantity || 0);
    const sellPrice = Number(sale.sell_price || 0);
    const discPercent = Number(sale.discount_percent || 0);
    
    const subtotal = Number(sale.subtotal || 0);
    const discountAmount = qty * sellPrice * (discPercent / 100);

    // Resolve buy price at time of sale
    let buyPrice = Number(item.buy_price || 0);
    const itemPurchases = purchasesByItem.get(itemId);
    if (itemPurchases && invoice.invoice_date) {
      // Find the most recent purchase on or before sale date
      const matchedPurchase = itemPurchases.find(
        (p) => new Date(p.date).getTime() <= new Date(invoice.invoice_date).getTime()
      );
      if (matchedPurchase) {
        buyPrice = matchedPurchase.buy_price;
      }
    }

    const calculatedCost = qty * buyPrice;

    if (!profitMap.has(itemId)) {
      profitMap.set(itemId, {
        name: item.name,
        units_sold: 0,
        revenue: 0,
        cost: 0,
        discount: 0,
      });
    }

    const stats = profitMap.get(itemId)!;
    stats.units_sold += qty;
    stats.revenue += subtotal;
    stats.cost += calculatedCost;
    stats.discount += discountAmount;
  });

  // Convert map to list and calculate margins
  const results: ProfitByItem[] = [];
  profitMap.forEach((stats, itemId) => {
    const profit = stats.revenue - stats.cost;
    const margin = stats.revenue > 0 ? (profit / stats.revenue) * 100 : 0;

    results.push({
      item_id: itemId,
      name: stats.name,
      units_sold: stats.units_sold,
      revenue: stats.revenue,
      cost: stats.cost,
      discount: stats.discount,
      profit,
      margin: Math.round(margin * 100) / 100, // round to 2 decimals
    });
  });

  // Sort by profit descending
  return results.sort((a, b) => b.profit - a.profit);
}

/**
 * Get monthly sales trends (sales vs cogs vs profit) for the chart.
 */
export async function getMonthlySalesTrend(): Promise<{
  month: string;
  sales: number;
  cost: number;
  profit: number;
}[]> {
  const [
    { data: salesItems },
    { data: purchaseItems }
  ] = await Promise.all([
    supabase.from("invoice_items").select("*, invoices!inner(invoice_date), items!inner(buy_price)"),
    supabase.from("purchase_items").select("*, purchases!inner(purchase_date)"),
  ]);

  if (!salesItems) return [];

  // Group purchases by item
  const purchasesByItem = new Map<string, any[]>();
  if (purchaseItems) {
    purchaseItems.forEach((p) => {
      const itemId = p.item_id;
      if (!purchasesByItem.has(itemId)) {
        purchasesByItem.set(itemId, []);
      }
      purchasesByItem.get(itemId)!.push({
        date: p.purchases.purchase_date,
        buy_price: Number(p.buy_price),
      });
    });

    purchasesByItem.forEach((list) => {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }

  // Aggregate monthly totals
  const monthlyData = new Map<string, { sales: number; cost: number }>();

  salesItems.forEach((sale) => {
    const dateStr = sale.invoices.invoice_date;
    if (!dateStr) return;
    
    const monthKey = dateStr.substring(0, 7); // "YYYY-MM"
    const qty = Number(sale.quantity || 0);
    const subtotal = Number(sale.subtotal || 0);
    const itemId = sale.item_id;

    // Resolve buy price at purchase time
    let buyPrice = Number(sale.items.buy_price || 0);
    const itemPurchases = purchasesByItem.get(itemId);
    if (itemPurchases) {
      const matchedPurchase = itemPurchases.find(
        (p) => new Date(p.date).getTime() <= new Date(dateStr).getTime()
      );
      if (matchedPurchase) {
        buyPrice = matchedPurchase.buy_price;
      }
    }

    const calculatedCost = qty * buyPrice;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { sales: 0, cost: 0 });
    }

    const m = monthlyData.get(monthKey)!;
    m.sales += subtotal;
    m.cost += calculatedCost;
  });

  // Map to array, sort chronologically
  const results = Array.from(monthlyData.entries()).map(([month, data]) => ({
    month,
    sales: data.sales,
    cost: data.cost,
    profit: data.sales - data.cost,
  }));

  return results.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get top 5 customers with largest outstanding debt.
 */
export async function getTopCustomersByDebt(limit: number = 5): Promise<any[]> {
  const [
    { data: customers },
    { data: invoices },
    { data: payments }
  ] = await Promise.all([
    supabase.from("customers").select("id, name").eq("is_active", true),
    supabase.from("invoices").select("customer_id, final_amount"),
    supabase.from("customer_payments").select("customer_id, amount"),
  ]);

  if (!customers) return [];

  const invoiceMap = new Map<string, number>();
  const paymentMap = new Map<string, number>();

  if (invoices) {
    invoices.forEach((inv) => {
      invoiceMap.set(inv.customer_id, (invoiceMap.get(inv.customer_id) || 0) + Number(inv.final_amount));
    });
  }

  if (payments) {
    payments.forEach((pay) => {
      paymentMap.set(pay.customer_id, (paymentMap.get(pay.customer_id) || 0) + Number(pay.amount));
    });
  }

  const list = customers.map((c) => {
    const totalInvoiced = invoiceMap.get(c.id) || 0;
    const totalPaid = paymentMap.get(c.id) || 0;
    const debt = Math.max(0, totalInvoiced - totalPaid);
    return {
      id: c.id,
      name: c.name,
      totalInvoiced,
      totalPaid,
      debt,
    };
  });

  return list.sort((a, b) => b.debt - a.debt).slice(0, limit);
}

/**
 * Get top 5 suppliers we owe the most.
 */
export async function getTopSuppliersByDebt(limit: number = 5): Promise<any[]> {
  const [
    { data: suppliers },
    { data: purchases },
    { data: supplierPayments }
  ] = await Promise.all([
    supabase.from("suppliers").select("id, name").eq("is_active", true),
    supabase.from("purchases").select("supplier_id, total_amount"),
    supabase.from("supplier_payments").select("supplier_id, amount"),
  ]);

  if (!suppliers) return [];

  const purchaseMap = new Map<string, number>();
  const paymentMap = new Map<string, number>();

  if (purchases) {
    purchases.forEach((pur) => {
      purchaseMap.set(pur.supplier_id, (purchaseMap.get(pur.supplier_id) || 0) + Number(pur.total_amount));
    });
  }

  if (supplierPayments) {
    supplierPayments.forEach((pay) => {
      paymentMap.set(pay.supplier_id, (paymentMap.get(pay.supplier_id) || 0) + Number(pay.amount));
    });
  }

  const list = suppliers.map((s) => {
    const totalPurchased = purchaseMap.get(s.id) || 0;
    const totalPaid = paymentMap.get(s.id) || 0;
    const debt = Math.max(0, totalPurchased - totalPaid);
    return {
      id: s.id,
      name: s.name,
      totalPurchased,
      totalPaid,
      debt,
    };
  });

  return list.sort((a, b) => b.debt - a.debt).slice(0, limit);
}

/**
 * Compile account statement for a customer.
 */
export async function getCustomerStatement(
  customerId: string,
  from?: string,
  to?: string
): Promise<{
  openingBalance: number;
  entries: StatementEntry[];
  closingBalance: number;
}> {
  const [
    { data: invoices },
    { data: payments }
  ] = await Promise.all([
    supabase.from("invoices").select("*").eq("customer_id", customerId),
    supabase.from("customer_payments").select("*").eq("customer_id", customerId),
  ]);

  const rawEntries: StatementEntry[] = [];

  if (invoices) {
    invoices.forEach((inv) => {
      rawEntries.push({
        id: inv.id,
        date: inv.invoice_date,
        type: "invoice",
        reference: inv.invoice_number,
        debit: Number(inv.final_amount),
        credit: 0,
        balance: 0,
        notes: inv.notes,
      });
    });
  }

  if (payments) {
    payments.forEach((pay) => {
      rawEntries.push({
        id: pay.id,
        date: pay.payment_date,
        type: "payment",
        reference: `PMT-${pay.id.substring(0, 4).toUpperCase()}`,
        debit: 0,
        credit: Number(pay.amount),
        balance: 0,
        notes: pay.notes,
      });
    });
  }

  // Sort chronological
  rawEntries.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    // Invoices before payments on the same day
    return a.type === "invoice" ? -1 : 1;
  });

  // Calculate opening balance before `from` date
  let openingBalance = 0;
  const filteredEntries: StatementEntry[] = [];

  const fromDate = from ? new Date(from).getTime() : null;
  const toDate = to ? new Date(to).getTime() : null;

  let running = 0;

  rawEntries.forEach((entry) => {
    const entryTime = new Date(entry.date).getTime();
    
    if (fromDate && entryTime < fromDate) {
      openingBalance += entry.debit - entry.credit;
    } else {
      // If we are starting entries, we set the initial running balance
      if (filteredEntries.length === 0) {
        running = openingBalance;
      }
      running += entry.debit - entry.credit;
      entry.balance = running;

      if (!toDate || entryTime <= toDate) {
        filteredEntries.push(entry);
      }
    }
  });

  // If fromDate was null, the opening balance is 0 and running is the final balance of the last entry.
  // If filteredEntries is empty, closing balance equals opening balance.
  const closingBalance = filteredEntries.length > 0 
    ? filteredEntries[filteredEntries.length - 1].balance 
    : openingBalance;

  return {
    openingBalance,
    entries: filteredEntries,
    closingBalance,
  };
}

/**
 * Compile account statement for a supplier.
 */
export async function getSupplierStatement(
  supplierId: string,
  from?: string,
  to?: string
): Promise<{
  openingBalance: number;
  entries: StatementEntry[];
  closingBalance: number;
}> {
  const [
    { data: purchases },
    { data: supplierPayments }
  ] = await Promise.all([
    supabase.from("purchases").select("*").eq("supplier_id", supplierId),
    supabase.from("supplier_payments").select("*").eq("supplier_id", supplierId),
  ]);

  const rawEntries: StatementEntry[] = [];

  if (purchases) {
    purchases.forEach((pur) => {
      rawEntries.push({
        id: pur.id,
        date: pur.purchase_date,
        type: "purchase",
        reference: `PUR-${pur.id.substring(0, 4).toUpperCase()}`,
        debit: Number(pur.total_amount),
        credit: 0,
        balance: 0,
        notes: pur.notes,
      });
    });
  }

  if (supplierPayments) {
    supplierPayments.forEach((pay) => {
      rawEntries.push({
        id: pay.id,
        date: pay.payment_date,
        type: "supplier_payment",
        reference: `PAY-${pay.id.substring(0, 4).toUpperCase()}`,
        debit: 0,
        credit: Number(pay.amount),
        balance: 0,
        notes: pay.notes,
      });
    });
  }

  // Sort chronological
  rawEntries.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.type === "purchase" ? -1 : 1;
  });

  let openingBalance = 0;
  const filteredEntries: StatementEntry[] = [];

  const fromDate = from ? new Date(from).getTime() : null;
  const toDate = to ? new Date(to).getTime() : null;

  let running = 0;

  rawEntries.forEach((entry) => {
    const entryTime = new Date(entry.date).getTime();
    
    if (fromDate && entryTime < fromDate) {
      openingBalance += entry.debit - entry.credit;
    } else {
      if (filteredEntries.length === 0) {
        running = openingBalance;
      }
      running += entry.debit - entry.credit;
      entry.balance = running;

      if (!toDate || entryTime <= toDate) {
        filteredEntries.push(entry);
      }
    }
  });

  const closingBalance = filteredEntries.length > 0 
    ? filteredEntries[filteredEntries.length - 1].balance 
    : openingBalance;

  return {
    openingBalance,
    entries: filteredEntries,
    closingBalance,
  };
}

/**
 * Get item expiry alerts grouped by urgency.
 */
export async function getExpiryAlerts(): Promise<ExpiryAlert[]> {
  const { data: items } = await supabase
    .from("items")
    .select("id, name, stock_qty, buy_price, expiry_date")
    .eq("is_active", true);

  if (!items) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results: ExpiryAlert[] = [];

  items.forEach((item) => {
    if (!item.expiry_date) return;

    const expiry = new Date(item.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status: 'expired' | 'critical' | 'warning' | 'caution' | 'ok' = 'ok';
    if (diffDays <= 0) {
      status = 'expired';
    } else if (diffDays <= 7) {
      status = 'critical';
    } else if (diffDays <= 30) {
      status = 'warning';
    } else if (diffDays <= 90) {
      status = 'caution';
    }

    if (status !== 'ok') {
      results.push({
        item_id: item.id,
        name: item.name,
        stock_qty: item.stock_qty,
        expiry_date: item.expiry_date,
        days_until_expiry: diffDays,
        value_at_risk: item.stock_qty * Number(item.buy_price),
        status,
      });
    }
  });

  // Sort soonest expiry first (expired first, then ascending diffDays)
  return results.sort((a, b) => a.days_until_expiry - b.days_until_expiry);
}

/**
 * Get recent activity feed across all transaction entities.
 */
export async function getRecentActivity(limit: number = 10): Promise<any[]> {
  const [
    { data: invoices },
    { data: customerPayments },
    { data: purchases },
    { data: supplierPayments },
    { data: damages },
  ] = await Promise.all([
    supabase.from("invoices").select("id, invoice_number, invoice_date, final_amount, created_at, customers(name)").order("created_at", { ascending: false }).limit(limit),
    supabase.from("customer_payments").select("id, payment_date, amount, created_at, customers(name)").order("created_at", { ascending: false }).limit(limit),
    supabase.from("purchases").select("id, purchase_date, total_amount, created_at, suppliers(name)").order("created_at", { ascending: false }).limit(limit),
    supabase.from("supplier_payments").select("id, payment_date, amount, created_at, suppliers(name)").order("created_at", { ascending: false }).limit(limit),
    supabase.from("damages").select("id, damage_date, quantity, cost, reason, created_at, items(name)").order("created_at", { ascending: false }).limit(limit),
  ]);

  const feed: any[] = [];

  if (invoices) {
    invoices.forEach((i) => {
      feed.push({
        id: i.id,
        timestamp: new Date(i.created_at).getTime(),
        date: i.invoice_date,
        type: "invoice",
        title: `Sales Invoice ${i.invoice_number}`,
        amount: Number(i.final_amount),
        entity: i.customers ? (i.customers as any).name : "Unknown Customer",
      });
    });
  }

  if (customerPayments) {
    customerPayments.forEach((p) => {
      feed.push({
        id: p.id,
        timestamp: new Date(p.created_at).getTime(),
        date: p.payment_date,
        type: "customer_payment",
        title: "Customer Payment Received",
        amount: Number(p.amount),
        entity: p.customers ? (p.customers as any).name : "Unknown Customer",
      });
    });
  }

  if (purchases) {
    purchases.forEach((pur) => {
      feed.push({
        id: pur.id,
        timestamp: new Date(pur.created_at).getTime(),
        date: pur.purchase_date,
        type: "purchase",
        title: "Purchase Order Logged",
        amount: Number(pur.total_amount),
        entity: pur.suppliers ? (pur.suppliers as any).name : "Unknown Supplier",
      });
    });
  }

  if (supplierPayments) {
    supplierPayments.forEach((p) => {
      feed.push({
        id: p.id,
        timestamp: new Date(p.created_at).getTime(),
        date: p.payment_date,
        type: "supplier_payment",
        title: "Payment Logged to Supplier",
        amount: Number(p.amount),
        entity: p.suppliers ? (p.suppliers as any).name : "Unknown Supplier",
      });
    });
  }

  if (damages) {
    damages.forEach((d) => {
      feed.push({
        id: d.id,
        timestamp: new Date(d.created_at).getTime(),
        date: d.damage_date,
        type: "damage",
        title: `Stock Write-off (${d.reason})`,
        amount: Number(d.cost),
        entity: `${d.items ? (d.items as any).name : "Item"} (${d.quantity} units)`,
      });
    });
  }

  // Sort descending by timestamp
  return feed.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}
