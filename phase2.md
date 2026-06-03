# Phase 2 PRD — Suppliers & Purchases
## Medical Distribution Management System

> **Status:** Not Started  
> **Prerequisites:** Phase 1 complete ✅ — Items catalog, stock balance, add/edit item  
> **Goal:** By end of Phase 2, admin can manage suppliers, record purchases from them, track what we owe, and record payments. Stock quantities update automatically when a purchase is recorded.  
> **Rule:** No sales. No customers. Buying side only.

---

## What We Are Building in Phase 2

The buying side of the business. When the company receives medical items from a supplier (like Amershine), this phase handles recording that transaction, updating inventory automatically, and tracking the debt owed to that supplier over time.

---

## Supabase — Create These Tables First

Before touching any UI, create all three tables.

### Table 1: suppliers
```sql
create table suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_person text,
  phone text,
  address text,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Table 2: purchases
```sql
create table purchases (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references suppliers(id) not null,
  purchase_date date not null default current_date,
  total_amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  notes text,
  status text default 'unpaid', -- 'unpaid' | 'partial' | 'paid'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Table 3: purchase_items
```sql
create table purchase_items (
  id uuid default gen_random_uuid() primary key,
  purchase_id uuid references purchases(id) not null,
  item_id uuid references items(id) not null,
  quantity integer not null,
  buy_price numeric(10,2) not null,
  expiry_date date,
  subtotal numeric(12,2) generated always as (quantity * buy_price) stored,
  created_at timestamp with time zone default now()
);
```

### Table 4: supplier_payments
```sql
create table supplier_payments (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references suppliers(id) not null,
  purchase_id uuid references purchases(id),
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  notes text,
  created_at timestamp with time zone default now()
);
```

### Critical: Stock Update Trigger
When a purchase_item is inserted, automatically increase stock in items table:

```sql
create or replace function update_stock_on_purchase()
returns trigger as $$
begin
  update items
  set stock_qty = stock_qty + NEW.quantity,
      updated_at = now()
  where id = NEW.item_id;
  return NEW;
end;
$$ language plpgsql;

create trigger after_purchase_item_insert
after insert on purchase_items
for each row execute function update_stock_on_purchase();
```

**This is critical.** Stock must update automatically. Never manually.

---

## Sidebar — Update Navigation

```
INVENTORY
  ├── Items List
  ├── Add Item
  └── Stock Balance

TRANSACTIONS
  ├── Purchases          → /dashboard/purchases        ← NEW (unlocked)
  ├── Suppliers          → /dashboard/suppliers        ← NEW (unlocked)
  ├── Sales & Invoices (Phase 3)                       ← still locked
  ├── Customers Ledger (Phase 3)                       ← still locked
  └── Finances & Debt (Phase 4)                        ← still locked
```

---

## Page 1: Suppliers List `/dashboard/suppliers`

### What it shows
Table of all suppliers the company buys from.

### Table columns
| Column | Description |
|--------|-------------|
| Supplier Name | |
| Contact Person | |
| Phone | |
| Total Debt | How much we currently owe them (IQD) |
| Total Purchases | Number of purchase orders made |
| Status | Active / Inactive |
| Actions | View / Edit / Deactivate |

### Behaviors
- Search by supplier name
- Highlight row in red if total debt > 0
- Empty state: "No suppliers added yet"
- Button top right: **+ Add Supplier**

---

## Page 2: Add / Edit Supplier `/dashboard/suppliers/new` & `/dashboard/suppliers/[id]/edit`

### Form fields
| Field | Type | Required |
|-------|------|----------|
| Supplier Name | Text | Yes |
| Contact Person | Text | No |
| Phone | Text | No |
| Address | Text | No |
| Notes | Textarea | No |

Simple form. No financial data here — that comes from purchases automatically.

---

## Page 3: Supplier Detail `/dashboard/suppliers/[id]`

Full profile of one supplier. Most important page in Phase 2.

### Top section — Summary cards
- **Total Purchased** — total IQD value of all purchases from this supplier
- **Total Paid** — how much we have paid them
- **Outstanding Debt** — what we still owe (Total Purchased - Total Paid)

### Middle section — Purchase History
Table of all purchases from this supplier:
| Column | Description |
|--------|-------------|
| Date | Purchase date |
| Items | Number of item types in this purchase |
| Total Amount | IQD |
| Amount Paid | IQD |
| Remaining | IQD |
| Status | Unpaid / Partial / Paid |
| Actions | View details |

### Bottom section — Payment History
Table of all payments made to this supplier:
| Column | Description |
|--------|-------------|
| Date | Payment date |
| Amount | IQD |
| Linked Purchase | Which purchase this payment was for |
| Notes | |

### Action button
**+ Record Payment** — opens modal to log a payment to this supplier

---

## Page 4: Purchases List `/dashboard/purchases`

All purchase orders across all suppliers.

### Table columns
| Column | Description |
|--------|-------------|
| Date | Purchase date |
| Supplier | Supplier name |
| Items | Count of item types |
| Total Amount | IQD |
| Amount Paid | IQD |
| Remaining Debt | IQD |
| Status | Unpaid / Partial / Paid |
| Actions | View / Record Payment |

### Behaviors
- Filter by supplier
- Filter by status (Unpaid / Partial / Paid)
- Sort by date, amount, remaining debt
- Summary bar at top: Total Outstanding Debt across all suppliers
- Button top right: **+ New Purchase**

---

## Page 5: New Purchase `/dashboard/purchases/new`

Most complex form in Phase 2. This is where we record receiving items from a supplier.

### Step 1 — Purchase Info
| Field | Type | Required |
|-------|------|----------|
| Supplier | Select from suppliers list | Yes |
| Purchase Date | Date picker | Yes — defaults to today |
| Notes | Textarea | No |

### Step 2 — Add Items
Dynamic list. User adds items one by one.

Per item row:
| Field | Type | Required |
|-------|------|----------|
| Item | Select from items catalog | Yes |
| Quantity | Number | Yes |
| Buy Price (IQD) | Number — pre-filled from item's buy price but editable | Yes |
| Expiry Date | Date picker | No |
| Subtotal | Auto-calculated (qty × price) | Read only |

- **+ Add Another Item** button to add more rows
- **Remove** button per row
- Running total at bottom updates live as user adds items

### Step 3 — Payment
| Field | Type | Required |
|-------|------|----------|
| Initial Payment | Number — how much paid right now | No — can be 0 |

- If 0 → status = "Unpaid"
- If partial → status = "Partial"
- If full → status = "Paid"

### On Submit
1. Create purchase record
2. Create all purchase_items records
3. Trigger automatically updates stock_qty in items table
4. If initial payment > 0, create supplier_payment record
5. Redirect to purchase detail page
6. Show success toast: "Purchase recorded. X items added to inventory."

---

## Page 6: Purchase Detail `/dashboard/purchases/[id]`

Read-only view of one purchase order.

### Shows:
- Supplier name + date
- Items table: name, quantity, buy price, expiry, subtotal
- Total amount
- Payments made against this purchase
- Remaining balance
- **+ Record Payment** button if not fully paid

---

## Record Payment — Modal

Used on both Supplier Detail and Purchase Detail pages.

### Fields:
| Field | Type | Required |
|-------|------|----------|
| Amount | Number | Yes |
| Date | Date picker — defaults today | Yes |
| Linked Purchase | Select from unpaid/partial purchases for this supplier | No |
| Notes | Text | No |

### On Submit:
1. Create supplier_payment record
2. Update amount_paid on the linked purchase
3. Recalculate purchase status (unpaid/partial/paid)
4. Show updated debt balance

---

## Dashboard — Update Overview Cards

Add to the existing 4 cards from Phase 1:

**New cards:**
- Total Suppliers
- Outstanding Supplier Debt (total IQD owed to all suppliers)

---

## TypeScript Types

```typescript
export type Supplier = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Purchase = {
  id: string;
  supplier_id: string;
  purchase_date: string;
  total_amount: number;
  amount_paid: number;
  notes: string | null;
  status: 'unpaid' | 'partial' | 'paid';
  created_at: string;
  updated_at: string;
};

export type PurchaseItem = {
  id: string;
  purchase_id: string;
  item_id: string;
  quantity: number;
  buy_price: number;
  expiry_date: string | null;
  subtotal: number;
};

export type SupplierPayment = {
  id: string;
  supplier_id: string;
  purchase_id: string | null;
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
    /suppliers
      page.tsx                    ← Suppliers list
      /new
        page.tsx                  ← Add supplier
      /[id]
        page.tsx                  ← Supplier detail
        /edit
          page.tsx                ← Edit supplier
    /purchases
      page.tsx                    ← Purchases list
      /new
        page.tsx                  ← New purchase form
      /[id]
        page.tsx                  ← Purchase detail

/components
  /suppliers
    SuppliersTable.tsx
    SupplierForm.tsx
    SupplierDetail.tsx
    SupplierPaymentModal.tsx
  /purchases
    PurchasesTable.tsx
    NewPurchaseForm.tsx
    PurchaseDetail.tsx
    PurchaseItemsRow.tsx

/lib
  /supabase
    suppliers.ts
    purchases.ts
```

---

## Critical Business Rules for Phase 2

1. **Stock only goes UP in Phase 2** — purchases add stock, nothing removes it yet (that's Phase 3 sales)
2. **Never delete a purchase** — mark as void only, keep all records
3. **Payment cannot exceed total amount** — validate this on frontend and backend
4. **Buy price on purchase_item is locked after saving** — historical price must not change
5. **If supplier is deactivated, existing purchases stay visible** — never hide financial history

---

## Phase 2 Completion Checklist

- [ ] All 4 Supabase tables created
- [ ] Stock update trigger created and tested
- [ ] Sidebar updated — Purchases and Suppliers unlocked
- [ ] Suppliers list page
- [ ] Add / Edit supplier form
- [ ] Supplier detail page with debt summary + history
- [ ] Purchases list page with filters
- [ ] New purchase form — multi-item, live total, initial payment
- [ ] Purchase detail page
- [ ] Record payment modal
- [ ] Dashboard updated with supplier debt card
- [ ] All TypeScript types defined
- [ ] All Supabase query functions written
- [ ] Stock increases correctly when purchase is saved — TESTED

---

## Done = Ready for Phase 3

Phase 2 is complete when:
1. Admin can add suppliers
2. Admin can record a purchase (multiple items) from a supplier
3. Stock quantities automatically increase in inventory
4. Admin can see total debt owed to each supplier
5. Admin can record payments against purchases
6. Debt balance updates correctly after payments

**Phase 3 builds the mirror image of this:** Customers + Sales/Invoices → which removes stock and creates customer debt.

---

*Phase 2 PRD v1.0 — June 2026*