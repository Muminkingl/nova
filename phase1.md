# Phase 1 PRD — Items & Inventory Foundation
## Medical Distribution Management System

> **Status:** In Progress  
> **Prerequisites:** Login page ✅ | Dashboard shell with sidebar ✅  
> **Goal:** By end of Phase 1, admin can add, view, edit, and manage all medical items in inventory.  
> **Rule:** No purchases. No invoices. No customers. Inventory only.

---

## What We Are Building in Phase 1

The item catalog and stock management foundation. Everything in this system depends on items existing first. No invoice can be created, no purchase can be recorded, without items in the database. This phase builds that foundation.

---

## Supabase — Do This First

Before touching any UI, create this table in Supabase.

```sql
create table items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text,
  unit text not null,
  buy_price numeric(10,2) not null,
  sell_price numeric(10,2) not null,
  stock_qty integer not null default 0,
  expiry_date date,
  min_stock_alert integer default 10,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**Rules:**
- Never hard delete items. Use `is_active = false` to deactivate.
- `stock_qty` cannot go below 0. Enforce this in app logic.
- `updated_at` must update on every edit. Use a Supabase trigger or handle in code.

---

## Sidebar — Update Navigation

Add these links to the existing sidebar. Everything else stays locked for now.

```
INVENTORY
  ├── Items List        → /dashboard/items
  ├── Add Item          → /dashboard/items/new
  └── Stock Balance     → /dashboard/stock

(everything else greyed out — coming in Phase 2+)
```

---

## Page 1: Items List `/dashboard/items`

### What it shows
A full table of all items in the database.

### Table columns
| Column | Description |
|--------|-------------|
| Name | Item name |
| Category | e.g. IV Fluids, Surgical, Equipment |
| Unit | e.g. Box, Piece, Vial, Pack |
| Buy Price | What we paid (IQD) |
| Sell Price | What we charge (IQD) |
| Stock Qty | Current quantity in warehouse |
| Expiry Date | Nearest expiry date |
| Status | Active / Low Stock / Expiring Soon |
| Actions | Edit / Deactivate |

### Behaviors
- **Low Stock warning** — highlight row in yellow if `stock_qty <= min_stock_alert`
- **Expiring Soon warning** — highlight row in orange if expiry date is within 30 days
- **Search** — search by item name
- **Filter** — filter by category
- **Sort** — sort by name, stock qty, expiry date
- Empty state — if no items, show "No items yet. Add your first item." with a button

---

## Page 2: Add Item `/dashboard/items/new`

### Form fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Item Name | Text input | Yes | |
| Category | Select or text input | No | Allow creating new categories |
| Unit | Select | Yes | Box, Piece, Vial, Pack, Bottle, Roll, Other |
| Buy Price | Number input | Yes | IQD — 2 decimal places |
| Sell Price | Number input | Yes | IQD — must be >= buy price, warn if not |
| Opening Stock | Number input | Yes | How many units we have right now |
| Expiry Date | Date picker | No | Leave empty if item has no expiry |
| Min Stock Alert | Number input | No | Default: 10 — alert when stock drops below this |

### Behaviors
- **Profit preview** — show live calculation: `Sell Price - Buy Price = Profit per unit` as user types
- **Validation** — all required fields must be filled before submit
- **On success** — redirect to Items List, show success toast
- **On error** — show error message inline

---

## Page 3: Edit Item `/dashboard/items/[id]/edit`

Same form as Add Item but pre-filled with existing data.

### Extra rules for edit:
- **Do NOT allow editing stock quantity here.** Stock only changes through purchases and sales. This prevents manual errors.
- Show a note: *"Stock quantity is managed automatically through purchases and sales."*
- Allow editing: name, category, unit, buy price, sell price, expiry date, min stock alert
- On save — update `updated_at` timestamp

---

## Page 4: Stock Balance `/dashboard/stock`

A simplified read-only view focused purely on stock levels.

### What it shows
| Column | Description |
|--------|-------------|
| Item Name | |
| Unit | |
| Current Stock | Quantity in warehouse |
| Min Alert | Threshold for low stock warning |
| Status | OK / Low Stock / Out of Stock / Expiring Soon |
| Expiry Date | |

### Behaviors
- **Out of Stock** — red highlight if `stock_qty = 0`
- **Low Stock** — yellow highlight if `stock_qty <= min_stock_alert`
- **Expiring Soon** — orange highlight if expiry within 30 days
- **Summary cards at top:**
  - Total Items
  - Low Stock Items (count)
  - Out of Stock Items (count)
  - Expiring Within 30 Days (count)

---

## Dashboard Home — Minimal Updates

Do not build full dashboard stats yet. You have no real data.

Add only these 4 summary cards to the dashboard home:

- Total Items in Catalog
- Items Low on Stock
- Items Out of Stock
- Items Expiring Soon

Everything else on dashboard stays empty/placeholder for Phase 2+.

---

## File & Folder Structure

```
/app
  /dashboard
    /items
      page.tsx              ← Items list
      /new
        page.tsx            ← Add item form
      /[id]
        /edit
          page.tsx          ← Edit item form
    /stock
      page.tsx              ← Stock balance view
    
/components
  /items
    ItemsTable.tsx
    ItemForm.tsx
    StockTable.tsx
    StockSummaryCards.tsx

/lib
  /supabase
    items.ts                ← All Supabase queries for items

/types
  index.ts                  ← Item type definitions
```

---

## TypeScript Types

```typescript
export type Item = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  buy_price: number;
  sell_price: number;
  stock_qty: number;
  expiry_date: string | null;
  min_stock_alert: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ItemFormData = Omit<Item, 'id' | 'is_active' | 'created_at' | 'updated_at'>;
```

---

## Supabase Query Functions `/lib/supabase/items.ts`

```typescript
// Get all active items
getItems()

// Get single item by id
getItemById(id: string)

// Create new item
createItem(data: ItemFormData)

// Update item (not stock qty)
updateItem(id: string, data: Partial<ItemFormData>)

// Deactivate item (soft delete)
deactivateItem(id: string)

// Get stock summary counts (for dashboard cards)
getStockSummary()
```

---

## What Phase 1 Does NOT Include

- ❌ Purchases from suppliers
- ❌ Sales / invoices
- ❌ Customer management
- ❌ Supplier management
- ❌ Payments
- ❌ Reports
- ❌ User roles / permissions
- ❌ Manual stock adjustment (comes in Phase 2 as part of purchases)

---

## Phase 1 Completion Checklist

- [ ] Supabase `items` table created
- [ ] Sidebar updated with Phase 1 navigation
- [ ] Items list page — table with search, filter, sort
- [ ] Add item form — all fields, validation, profit preview
- [ ] Edit item form — pre-filled, stock qty locked
- [ ] Stock balance page — with summary cards and status highlights
- [ ] Dashboard home — 4 summary cards
- [ ] All Supabase queries written and typed
- [ ] Empty states handled on all pages
- [ ] Error states handled on all pages

---

## Done = Ready for Phase 2

Phase 1 is complete when an admin can:
1. Add any medical item with full details
2. See all items in a clean table
3. Edit item details
4. See current stock levels with visual alerts
5. See low stock and expiry warnings

**Phase 2 will build on top of this:** Suppliers + Purchases → which will be what actually adds stock to the items created here.

---

*Phase 1 PRD v1.0 — June 2026*