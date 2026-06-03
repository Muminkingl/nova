# Phase 3 PRD — Customers & Sales / Invoices
## Medical Distribution Management System

> **Status:** Not Started  
> **Prerequisites:** Phase 1 ✅ Phase 2 ✅  
> **Goal:** By end of Phase 3, admin can manage customers, create sales invoices, track what customers owe, and record their payments. Stock quantities decrease automatically when a sale is recorded.  
> **Rule:** This is the exact mirror of Phase 2 but on the selling side.

---

## The Mirror Logic

If you understood Phase 2, you already understand Phase 3.

```
PHASE 2 (Buying)                    PHASE 3 (Selling)
─────────────────                   ─────────────────
Supplier → us                       Us → Customer
Purchase order                      Sales invoice
Stock goes UP                       Stock goes DOWN
We OWE supplier                     Customer OWES us
We record payments TO supplier      We record payments FROM customer
```

Same structure. Opposite direction.

---

## Supabase — Create These Tables First

### Table 1: customers
```sql
create table customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text default 'hospital', -- 'hospital' | 'clinic' | 'pharmacy' | 'other'
  contact_person text,
  phone text,
  address text,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Table 2: invoices
```sql
create table invoices (
  id uuid default gen_random_uuid() primary key,
  invoice_number text unique not null, -- auto-generated: INV-0001, INV-0002...
  customer_id uuid references customers(id) not null,
  invoice_date date not null default current_date,
  total_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  final_amount numeric(12,2) not null default 0, -- total_amount - discount_amount
  amount_paid numeric(12,2) not null default 0,
  notes text,
  status text default 'unpaid', -- 'unpaid' | 'partial' | 'paid'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Table 3: invoice_items
```sql
create table invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references invoices(id) not null,
  item_id uuid references items(id) not null,
  quantity integer not null,
  sell_price numeric(10,2) not null,
  discount_percent numeric(5,2) default 0,
  subtotal numeric(12,2) generated always as (
    quantity * sell_price * (1 - discount_percent / 100)
  ) stored,
  created_at timestamp with time zone default now()
);
```

### Table 4: customer_payments
```sql
create table customer_payments (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customers(id) not null,
  invoice_id uuid references invoices(id),
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  notes text,
  created_at timestamp with time zone default now()
);
```

### Critical: Stock Decrease Trigger
When an invoice_item is inserted, automatically decrease stock:

```sql
create or replace function update_stock_on_sale()
returns trigger as $$
begin
  -- Block if not enough stock
  if (select stock_qty from items where id = NEW.item_id) < NEW.quantity then
    raise exception 'Insufficient stock for item %', NEW.item_id;
  end if;

  update items
  set stock_qty = stock_qty - NEW.quantity,
      updated_at = now()
  where id = NEW.item_id;
  return NEW;
end;
$$ language plpgsql;

create trigger after_invoice_item_insert
after insert on invoice_items
for each row execute function update_stock_on_sale();
```

**This is critical.** Stock cannot go negative. The trigger blocks it at database level.

### Auto-increment invoice number function
```sql
create or replace function generate_invoice_number()
returns text as $$
declare
  next_num integer;
begin
  select count(*) + 1 into next_num from invoices;
  return 'INV-' || lpad(next_num::text, 4, '0');
end;
$$ language plpgsql;
```

---

## Sidebar — Update Navigation

```
INVENTORY
  ├── Items List
  ├── Add Item
  └── Stock Balance

TRANSACTIONS
  ├── Purchases                               ← Phase 2 ✅
  ├── Suppliers                               ← Phase 2 ✅
  ├── Sales & Invoices   → /dashboard/invoices    ← NEW (unlocked)
  ├── Customers          → /dashboard/customers   ← NEW (unlocked)
  └── Finances & Debt (Phase 4)               ← still locked
```

---

## Page 1: Customers List `/dashboard/customers`

### Table columns
| Column | Description |
|--------|-------------|
| Customer Name | |
| Type | Hospital / Clinic / Pharmacy / Other |
| Contact Person | |
| Phone | |
| Outstanding Debt | How much they owe us (IQD) |
| Total Invoices | Number of invoices created |
| Status | Active / Inactive |
| Actions | View / Edit / Deactivate |

### Behaviors
- Search by customer name
- Filter by type (Hospital / Clinic / Pharmacy)
- Highlight row in yellow if outstanding debt > 0
- Empty state: "No customers added yet"
- Button top right: **+ Add Customer**

---

## Page 2: Add / Edit Customer

### Form fields
| Field | Type | Required |
|-------|------|----------|
| Customer Name | Text | Yes |
| Type | Select: Hospital / Clinic / Pharmacy / Other | Yes |
| Contact Person | Text | No |
| Phone | Text | No |
| Address | Text | No |
| Notes | Textarea | No |

---

## Page 3: Customer Detail `/dashboard/customers/[id]`

Mirror of Supplier Detail from Phase 2.

### Top section — Summary cards
- **Total Invoiced** — total IQD value of all invoices for this customer
- **Total Paid** — how much they have paid us
- **Outstanding Debt** — what they still owe (Total Invoiced - Total Paid)

### Middle section — Invoice History
| Column | Description |
|--------|-------------|
| Invoice # | INV-0001 etc |
| Date | Invoice date |
| Items | Number of item types |
| Total Amount | IQD |
| Amount Paid | IQD |
| Remaining | IQD |
| Status | Unpaid / Partial / Paid |
| Actions | View details |

### Bottom section — Payment History
| Column | Description |
|--------|-------------|
| Date | Payment date |
| Amount | IQD |
| Linked Invoice | Which invoice this payment was for |
| Notes | |

### Action button
**+ Record Payment** — opens modal to log a payment received from this customer

---

## Page 4: Invoices List `/dashboard/invoices`

All sales invoices across all customers.

### Table columns
| Column | Description |
|--------|-------------|
| Invoice # | INV-0001 |
| Date | Invoice date |
| Customer | Customer name |
| Items | Count of item types |
| Total Amount | IQD |
| Discount | IQD discount applied |
| Final Amount | IQD after discount |
| Amount Paid | IQD |
| Remaining | IQD |
| Status | Unpaid / Partial / Paid |
| Actions | View / Record Payment |

### Behaviors
- Filter by customer
- Filter by status
- Sort by date, amount, remaining
- Summary bar: Total Outstanding Customer Debt
- Button top right: **+ New Invoice**

---

## Page 5: New Invoice `/dashboard/invoices/new`

Most important page in Phase 3.

### Step 1 — Invoice Info
| Field | Type | Required |
|-------|------|----------|
| Customer | Select from customers list | Yes |
| Invoice Date | Date picker — defaults today | Yes |
| Notes | Textarea | No |

### Step 2 — Add Items
Dynamic list. Same pattern as Phase 2 purchase form.

Per item row:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Item | Select from items catalog | Yes | Only show items with stock_qty > 0 |
| Available Stock | Read only | — | Show current stock next to item name |
| Quantity | Number | Yes | Cannot exceed available stock — validate live |
| Sell Price (IQD) | Number — pre-filled from item sell price but editable | Yes | |
| Discount % | Number — default 0 | No | Volume discount applied here |
| Subtotal | Auto-calculated | Read only | qty × price × (1 - discount%) |

- **+ Add Another Item** button
- **Remove** button per row
- Running total updates live
- **Stock warning** — if quantity entered exceeds stock, show red warning inline

### Step 3 — Discount Summary
- Show itemized subtotals
- Show total before discount
- Show total discount amount
- Show **final amount** (bold)

### Step 4 — Initial Payment
| Field | Type | Required |
|-------|------|----------|
| Initial Payment | Number — how much paid right now | No — can be 0 |

- If 0 → status = "Unpaid"
- If partial → status = "Partial"
- If full amount → status = "Paid"

### On Submit
1. Generate invoice number (INV-XXXX)
2. Create invoice record
3. Create all invoice_items records
4. Trigger automatically decreases stock_qty in items
5. If initial payment > 0, create customer_payment record
6. Redirect to invoice detail page
7. Show success toast: "Invoice INV-XXXX created. Stock updated."

---

## Page 6: Invoice Detail `/dashboard/invoices/[id]`

Read-only view. Clean printable layout.

### Shows:
- Invoice number + date
- Customer name + contact
- Items table: name, qty, sell price, discount %, subtotal
- Total before discount
- Discount amount
- **Final amount** (bold)
- Payments received
- Remaining balance
- **+ Record Payment** button if not fully paid
- **Print / Export** button (basic browser print)

---

## Record Payment — Modal

Used on both Customer Detail and Invoice Detail pages.

### Fields:
| Field | Type | Required |
|-------|------|----------|
| Amount | Number | Yes |
| Date | Date picker — defaults today | Yes |
| Linked Invoice | Select from unpaid/partial invoices for this customer | No |
| Notes | Text | No |

### Validation:
- Amount cannot exceed remaining balance on linked invoice
- Amount cannot exceed total outstanding debt of customer

### On Submit:
1. Create customer_payment record
2. Update amount_paid on the linked invoice
3. Recalculate invoice status (unpaid/partial/paid)
4. Show updated debt balance

---

## Discount / Bonus Logic

This is the "bonus" feature discussed earlier. Apply at item level on the invoice.

**How it works:**
- Discount % is entered per item row on the invoice form
- Admin decides the % manually (e.g. 10% for large order)
- System calculates and shows the discount amount
- Discount is stored permanently on invoice_item — never changes after save

**Future phase can add automatic discount rules. For now: manual entry.**

---

## Dashboard — Update Overview Cards

Add to existing cards:

**New cards:**
- Total Customers
- Outstanding Customer Debt (total IQD owed to us by all customers)

**Existing cards stay.** Dashboard now shows both sides:
- What we owe suppliers (Phase 2)
- What customers owe us (Phase 3)

---

## TypeScript Types

```typescript
export type Customer = {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'other';
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  amount_paid: number;
  notes: string | null;
  status: 'unpaid' | 'partial' | 'paid';
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  item_id: string;
  quantity: number;
  sell_price: number;
  discount_percent: number;
  subtotal: number;
};

export type CustomerPayment = {
  id: string;
  customer_id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
};
```

---

## File & Folder Structure

```
/app
  /dashboard
    /customers
      page.tsx                    ← Customers list
      /new
        page.tsx                  ← Add customer
      /[id]
        page.tsx                  ← Customer detail
        /edit
          page.tsx                ← Edit customer
    /invoices
      page.tsx                    ← Invoices list
      /new
        page.tsx                  ← New invoice form
      /[id]
        page.tsx                  ← Invoice detail

/components
  /customers
    CustomersTable.tsx
    CustomerForm.tsx
    CustomerDetail.tsx
    CustomerPaymentModal.tsx
  /invoices
    InvoicesTable.tsx
    NewInvoiceForm.tsx
    InvoiceDetail.tsx
    InvoiceItemsRow.tsx

/lib
  /supabase
    customers.ts
    invoices.ts
```

---

## Critical Business Rules for Phase 3

1. **Stock cannot go negative** — block at trigger level AND frontend level
2. **Never delete an invoice** — void only, keep all records forever
3. **Sell price on invoice_item is locked after saving** — historical price is sacred
4. **Invoice number is permanent and sequential** — never reuse a number
5. **Discount is stored as % AND calculated IQD amount** — both saved on record
6. **Payment cannot exceed invoice final_amount** — validate strictly
7. **Only show items with stock > 0 in invoice item selector** — prevent ghost sales

---

## Phase 3 Completion Checklist

- [ ] All 4 Supabase tables created
- [ ] Stock decrease trigger created and tested
- [ ] Invoice number generator function created
- [ ] Sidebar updated — Sales & Invoices and Customers unlocked
- [ ] Customers list page
- [ ] Add / Edit customer form
- [ ] Customer detail page with debt summary + history
- [ ] Invoices list page with filters
- [ ] New invoice form — multi-item, live total, discount, initial payment
- [ ] Invoice detail page with print option
- [ ] Record payment modal
- [ ] Dashboard updated with customer debt card
- [ ] Stock decreases correctly when invoice is saved — TESTED
- [ ] Stock blocked from going negative — TESTED
- [ ] All TypeScript types defined
- [ ] All Supabase query functions written

---

## Done = Ready for Phase 4

Phase 3 is complete when:
1. Admin can add customers (hospitals, clinics, pharmacies)
2. Admin can create a sales invoice with multiple items and discounts
3. Stock quantities automatically decrease in inventory
4. Admin can see total debt owed by each customer
5. Admin can record payments received from customers
6. Debt balance updates correctly after payments

**At this point the core business loop is complete:**
- Buy from suppliers → stock goes up → owe suppliers
- Sell to customers → stock goes down → customers owe us

**Phase 4 is the financial intelligence layer:** Reports, profit analysis, account statements, expiry alerts, damages.

---

*Phase 3 PRD v1.0 — June 2026*