# Phase 4 PRD — Reports & Financial Intelligence
## Medical Distribution Management System

> **Status:** Not Started  
> **Prerequisites:** Phase 1 ✅ Phase 2 ✅ Phase 3 ✅  
> **Goal:** By end of Phase 4, the owner can see the full financial picture — profits, debts, stock value, expiry alerts, damages, and account statements for every supplier and customer.  
> **Rule:** Phase 4 is mostly READ-ONLY. No new transactions. Pure intelligence on top of existing data.

---

## What We Are Building in Phase 4

The owner's command center. Every number the business needs to make decisions. All data already exists in the database from Phases 1-3. Phase 4 just surfaces it intelligently.

---

## Supabase — One New Table Only

### Table: damages
```sql
create table damages (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references items(id) not null,
  quantity integer not null,
  reason text, -- 'expired' | 'damaged' | 'lost' | 'other'
  notes text,
  cost numeric(12,2) not null, -- quantity × buy_price at time of damage
  damage_date date not null default current_date,
  created_at timestamp with time zone default now()
);
```

### Stock decrease trigger for damages
```sql
create or replace function update_stock_on_damage()
returns trigger as $$
begin
  if (select stock_qty from items where id = NEW.item_id) < NEW.quantity then
    raise exception 'Cannot write off more than available stock';
  end if;

  update items
  set stock_qty = stock_qty - NEW.quantity,
      updated_at = now()
  where id = NEW.item_id;
  return NEW;
end;
$$ language plpgsql;

create trigger after_damage_insert
after insert on damages
for each row execute function update_stock_on_damage();
```

---

## Sidebar — Final Navigation (Complete)

```
INVENTORY
  ├── Items List
  ├── Add Item
  └── Stock Balance

TRANSACTIONS
  ├── Purchases
  ├── Suppliers
  ├── Sales & Invoices
  └── Customers

REPORTS & FINANCE         ← NEW SECTION (fully unlocked)
  ├── Financial Overview  → /dashboard/reports/overview
  ├── Sales & Profits     → /dashboard/reports/profits
  ├── Account Statements  → /dashboard/reports/statements
  ├── Expiry Alerts       → /dashboard/reports/expiry
  └── Damages & Losses    → /dashboard/damages
```

---

## Page 1: Financial Overview `/dashboard/reports/overview`

The owner's main dashboard. One page that shows everything important at a glance.

### Section 1 — Top Summary Cards (8 cards)

| Card | Value | Color |
|------|-------|-------|
| Total Revenue | Sum of all invoice final_amounts | Green |
| Total Cost | Sum of all purchase totals | Red |
| Gross Profit | Revenue - Cost | Green/Red |
| Customer Debt | Total outstanding from all customers | Yellow |
| Supplier Debt | Total outstanding owed to all suppliers | Orange |
| Stock Value | Sum of (stock_qty × buy_price) for all items | Blue |
| Damage Losses | Total cost of all recorded damages | Red |
| Net Position | Gross Profit - Supplier Debt + Customer Debt | Bold |

### Section 2 — Top 5 Best Selling Items
Table:
| Item | Units Sold | Revenue | Profit |
|------|-----------|---------|--------|
| ... | ... | ... | ... |

### Section 3 — Top 5 Customers by Debt
Table:
| Customer | Total Invoiced | Paid | Owes |
|----------|---------------|------|------|
| ... | ... | ... | ... |

### Section 4 — Top 5 Suppliers by Debt
Table:
| Supplier | Total Purchased | Paid | Owe |
|----------|----------------|------|-----|
| ... | ... | ... | ... |

### Section 5 — Recent Activity Feed
Last 10 transactions across all types (purchases + invoices + payments), sorted by date.

---

## Page 2: Sales & Profits `/dashboard/reports/profits`

Detailed profit analysis per item and per period.

### Filters at top
- Date range picker (from / to)
- Filter by customer
- Filter by item category

### Section 1 — Summary bar
- Total Sales (IQD)
- Total Discounts Given (IQD)
- Total Cost of Goods Sold (IQD)
- **Gross Profit (IQD)**
- **Profit Margin (%)**

### Section 2 — Profit per Item table
| Column | Description |
|--------|-------------|
| Item Name | |
| Units Sold | Total quantity sold in period |
| Revenue | Total sell value |
| Cost | Total buy value (qty × buy_price) |
| Discount Given | Total discount applied |
| Profit | Revenue - Cost - Discount |
| Margin % | Profit / Revenue × 100 |

- Sort by profit (highest first by default)
- Export to Excel button

### Section 3 — Sales Over Time
Simple bar chart — monthly sales vs cost vs profit.
Use Recharts (already in your stack).

---

## Page 3: Account Statements `/dashboard/reports/statements`

Full ledger for any single customer or supplier.

### How it works
- User selects: Customer OR Supplier
- User selects: specific customer/supplier from dropdown
- User selects: date range (optional)
- System generates full transaction history

### Customer Account Statement
Shows for the selected customer, in chronological order:

| Date | Type | Reference | Debit (they owe) | Credit (they paid) | Balance |
|------|------|-----------|------------------|-------------------|---------|
| Jan 5 | Invoice | INV-0001 | 500,000 | — | 500,000 |
| Jan 10 | Payment | PMT-001 | — | 200,000 | 300,000 |
| Jan 15 | Invoice | INV-0002 | 300,000 | — | 600,000 |
| Jan 20 | Payment | PMT-002 | — | 600,000 | 0 |

- Running balance column always current
- Opening balance shown at top
- Closing balance shown at bottom
- Print button

### Supplier Account Statement
Same structure but reversed — what we owe them.

---

## Page 4: Expiry Alerts `/dashboard/reports/expiry`

Everything about expiring stock.

### Section 1 — Alert Cards
| Card | Description |
|------|-------------|
| Already Expired | Items past expiry date — must be written off |
| Expiring in 7 days | Critical |
| Expiring in 30 days | Warning |
| Expiring in 90 days | Caution |

### Section 2 — Expiry Table
| Column | Description |
|--------|-------------|
| Item Name | |
| Current Stock | Qty remaining |
| Expiry Date | |
| Days Until Expiry | Calculated — red if past, orange if <30, yellow if <90 |
| Stock Value at Risk | stock_qty × buy_price |
| Action | Record as Damage button |

- Sort by expiry date (soonest first)
- Filter by status (expired / critical / warning / ok)

---

## Page 5: Damages & Losses `/dashboard/damages`

Record and view all inventory write-offs.

### Damages List
Table of all recorded damages:
| Column | Description |
|--------|-------------|
| Date | |
| Item Name | |
| Quantity Written Off | |
| Reason | Expired / Damaged / Lost / Other |
| Cost | Financial loss (IQD) |
| Notes | |

- Total losses shown at top (sum of all damage costs)
- Filter by reason, date range
- Button: **+ Record Damage**

### Record Damage Form
| Field | Type | Required |
|-------|------|----------|
| Item | Select from items with stock > 0 | Yes |
| Quantity | Number — cannot exceed stock_qty | Yes |
| Reason | Select: Expired / Damaged / Lost / Other | Yes |
| Date | Date picker | Yes |
| Notes | Text | No |

**On submit:**
- Creates damage record
- Trigger decreases stock_qty
- Shows financial loss: qty × buy_price

---

## Update Main Dashboard (Overview Page)

Replace the basic Phase 1 cards with the full financial overview.

Final dashboard home shows:
- All 8 financial summary cards from Page 1
- Quick links to each report
- Recent activity feed
- Expiry alert count (red badge if any expired items)

---

## Supabase Query Functions

All queries for Phase 4 are aggregations on existing data.

```typescript
// reports.ts

// Get financial overview summary
getFinancialOverview()
// Returns: total_revenue, total_cost, gross_profit,
//          customer_debt, supplier_debt, stock_value, damage_losses

// Get profit per item (with date filter)
getProfitByItem(from?: string, to?: string)
// Returns: item_id, name, units_sold, revenue, cost, discount, profit, margin

// Get monthly sales/cost/profit for chart
getMonthlySalesTrend(months: number)

// Get top customers by debt
getTopCustomersByDebt(limit: number)

// Get top suppliers by debt
getTopSuppliersByDebt(limit: number)

// Get customer account statement
getCustomerStatement(customerId: string, from?: string, to?: string)

// Get supplier account statement
getSupplierStatement(supplierId: string, from?: string, to?: string)

// Get expiry alerts grouped by urgency
getExpiryAlerts()

// Get all damages
getDamages(filters?: { reason?: string, from?: string, to?: string })

// Create damage record
createDamage(data: DamageFormData)

// Get recent activity feed
getRecentActivity(limit: number)
```

---

## TypeScript Types

```typescript
export type Damage = {
  id: string;
  item_id: string;
  quantity: number;
  reason: 'expired' | 'damaged' | 'lost' | 'other';
  notes: string | null;
  cost: number;
  damage_date: string;
  created_at: string;
};

export type FinancialOverview = {
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  customer_debt: number;
  supplier_debt: number;
  stock_value: number;
  damage_losses: number;
  net_position: number;
};

export type ProfitByItem = {
  item_id: string;
  name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  discount: number;
  profit: number;
  margin: number;
};

export type StatementEntry = {
  date: string;
  type: 'invoice' | 'payment' | 'purchase' | 'supplier_payment';
  reference: string;
  debit: number;
  credit: number;
  balance: number;
};

export type ExpiryAlert = {
  item_id: string;
  name: string;
  stock_qty: number;
  expiry_date: string;
  days_until_expiry: number;
  value_at_risk: number;
  status: 'expired' | 'critical' | 'warning' | 'caution';
};
```

---

## File & Folder Structure

```
/app
  /dashboard
    /reports
      /overview
        page.tsx              ← Financial overview
      /profits
        page.tsx              ← Sales & profits
      /statements
        page.tsx              ← Account statements
      /expiry
        page.tsx              ← Expiry alerts
    /damages
      page.tsx                ← Damages list + record damage

/components
  /reports
    FinancialOverviewCards.tsx
    ProfitTable.tsx
    SalesTrendChart.tsx
    AccountStatement.tsx
    ExpiryTable.tsx
    RecentActivityFeed.tsx
  /damages
    DamagesTable.tsx
    RecordDamageForm.tsx

/lib
  /supabase
    reports.ts
    damages.ts
```

---

## Critical Business Rules for Phase 4

1. **All report data is read-only** — no editing of historical transactions ever
2. **Damage write-offs are permanent** — cannot undo a damage record, only add a correction entry
3. **Account statements must balance** — opening + debits - credits = closing balance always
4. **Profit calculation uses buy_price at time of purchase** — not current buy_price
5. **Expired items still in stock = financial risk** — show prominently, force action
6. **Export to Excel must work offline** — use SheetJS, no external service

---

## Phase 4 Completion Checklist

- [ ] damages table created with trigger
- [ ] Sidebar fully unlocked — all sections visible
- [ ] Financial Overview page — 8 cards + top 5 tables + activity feed
- [ ] Sales & Profits page — filters, profit table, trend chart
- [ ] Account Statements — customer and supplier ledger view
- [ ] Expiry Alerts page — grouped by urgency, action button
- [ ] Damages page — list + record damage form
- [ ] Dashboard home updated with full financial cards
- [ ] Export to Excel working on profits report
- [ ] Print working on account statements
- [ ] All Supabase query functions written
- [ ] All TypeScript types defined
- [ ] Damage trigger tested — stock decreases correctly

---

## Done = System is Feature Complete

Phase 4 complete means:

1. Owner opens dashboard → sees full financial picture instantly
2. Can drill into any item's profitability
3. Can pull account statement for any customer or supplier
4. Gets warned about expiring stock before it becomes a loss
5. Can write off damaged/expired items and track the financial loss
6. Can export profit reports to Excel

**This is a fully functional medical distribution ERP.**

---

## What Comes After (Phase 5 — Polish)

Not a PRD yet. But the list:
- User roles & permissions (staff vs admin vs read-only)
- Print-ready invoice PDF
- Low stock email/Telegram alerts
- Daily automated backup to Telegram (n8n workflow)
- Multi-user activity log (who did what)
- Performance optimization for large datasets

---

*Phase 4 PRD v1.0 — June 2026*