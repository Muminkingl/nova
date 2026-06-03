# Medical Distribution Management System
## Project Overview Document

> **For:** Internal team, AI agents, developers  
> **Purpose:** Full understanding of what this system is, who it's for, and what it must do  
> **Stack:** Next.js + TypeScript + Supabase + Shadcn/ui + Vercel

---

## 1. What Is This System?

A **web-based ERP (Enterprise Resource Planning) system** for a medical supplies distribution company based in Erbil, Kurdistan Region, Iraq.

The company **buys medical items** (devices, consumables, equipment) from suppliers/manufacturers at wholesale prices, stores them in inventory, then **sells them on credit** to hospitals, clinics, and pharmacies at a marked-up price.

**One sentence:** Track everything you buy, everything you sell, every dinar owed to you, and every dinar you owe — with full inventory control in the middle.

---

## 2. The Core Business Loop

```
SUPPLIER                    COMPANY                      CUSTOMER
(Amershine, etc.)           (This System)                (Hospital, Clinic, Pharmacy)

  Delivers items ─────────► [INVENTORY] ────────────►   Receives items
  Gets paid later ◄───────  Buy price logged             Pays later
                             Sell price set
                             Expiry tracked
                             
  You OWE them              PROFIT =                     They OWE you
  (Supplier Debt)           Sell Price - Buy Price       (Customer Debt)
```

**Key insight:** Both sides operate on credit. Nobody pays immediately. The system tracks all outstanding balances on both sides.

---

## 3. Who Uses This System?

| Role | What They Do |
|------|-------------|
| **Admin/Owner** | Full access — sees all reports, profits, debts, manages everything |
| **Sales Staff** | Creates invoices, records customer payments |
| **Purchasing Staff** | Records purchases from suppliers, logs payments to suppliers |
| **Warehouse Staff** | Manages stock, records damages, tracks expiry |

---

## 4. Core Modules

### Module 1: Items & Inventory
The heart of the system. Every physical product tracked here.

**Data per item:**
- Item name, category, unit (box, piece, vial, etc.)
- Buy price (what we paid)
- Sell price (what we charge)
- Current stock quantity
- Expiry date (per batch)
- Minimum stock alert threshold
- Supplier it came from

**Key operations:**
- Add new item
- Update prices
- View current stock balance
- View items expiring soon (alert)
- Record damaged/lost items
- Item tracking history (full log of every movement)

---

### Module 2: Purchases (Buying from Suppliers)
When we receive items from a supplier.

**Flow:**
1. Create purchase order — select supplier, select items, enter quantities and buy prices
2. Items automatically added to inventory
3. Debt automatically added to supplier account
4. Record payments to supplier over time (partial or full)

**Data tracked:**
- Purchase date
- Supplier name
- Items purchased + quantities + prices
- Total amount
- Amount paid
- Remaining debt

---

### Module 3: Sales & Invoices (Selling to Customers)
When we sell items to a hospital/clinic/pharmacy.

**Flow:**
1. Create invoice — select customer, add items + quantities
2. System calculates total based on sell price
3. Apply volume discount if applicable (e.g. 10% off for large orders)
4. Items automatically deducted from inventory
5. Debt automatically added to customer account
6. Record customer payments over time (partial or full)

**Data tracked:**
- Invoice date + invoice number
- Customer name
- Items sold + quantities + sell prices
- Discount applied
- Total amount
- Amount paid
- Remaining debt (customer owes)

---

### Module 4: Suppliers (Companies)
Manage all supplier relationships.

**Per supplier:**
- Company name, contact info
- Full purchase history
- Total owed to them
- Payment history
- Account statement (full ledger)
- Loans/advances if any

---

### Module 5: Customers
Manage all buyer relationships (hospitals, clinics, pharmacies).

**Per customer:**
- Name, contact info, address
- Full invoice history
- Total they owe us
- Payment history
- Account statement (full ledger)
- Credit limit (optional)

---

### Module 6: Damages & Losses
Track inventory that cannot be sold.

- Record damaged items (remove from stock)
- Record expired items (remove from stock)
- Log reason and date
- Financial impact report

---

### Module 7: Reports & Analytics
The owner's dashboard. Read-only intelligence layer.

**Key reports:**
- Sales & Profits (per item, per period)
- Stock Balance (current inventory value)
- Customer Debt List (who owes what)
- Supplier Debt List (what we owe)
- Item Expiry Alert List
- Amount Received (total cash in)
- Amount Paid (total cash out)
- Account Statements (per customer or supplier)

---

## 5. Discount / Bonus Logic

Volume-based discounts on invoices:

```
Example rule:
- Order 500+ units of any item → 10% discount on that item
- Rules are configurable by admin
```

Discount is applied at invoice creation time and stored on the invoice permanently.

---

## 6. Database Schema (High Level)

```
items
  id, name, category, unit, buy_price, sell_price, stock_qty, expiry_date, supplier_id

suppliers
  id, name, contact, total_debt

supplier_purchases
  id, supplier_id, date, total_amount, amount_paid, status

supplier_purchase_items
  id, purchase_id, item_id, quantity, buy_price

supplier_payments
  id, supplier_id, purchase_id, amount, date, notes

customers
  id, name, contact, address, total_debt

invoices
  id, customer_id, date, total_amount, discount, amount_paid, status

invoice_items
  id, invoice_id, item_id, quantity, sell_price, discount_applied

customer_payments
  id, customer_id, invoice_id, amount, date, notes

damages
  id, item_id, quantity, reason, date, cost

inventory_log
  id, item_id, change_type, quantity_change, reference_id, date
```

---

## 7. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 + TypeScript | Fast, SEO-ready, developer knows it |
| UI Components | Shadcn/ui + Tailwind | Clean, professional, fast to build |
| Database | Supabase (PostgreSQL) | Relational, real-time, auth built-in |
| Auth | Supabase Auth | Role-based access |
| Deployment | Vercel | Zero-config, instant |
| State | Zustand or React Query | Client state + server sync |

---

## 8. Phased Build Plan (Overview)

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| **Phase 1** | Foundation | Auth, items CRUD, inventory, basic stock view |
| **Phase 2** | Buying side | Suppliers, purchases, supplier debt/payments |
| **Phase 3** | Selling side | Customers, invoices, customer debt/payments |
| **Phase 4** | Finance layer | Reports, profits, account statements, alerts |
| **Phase 5** | Polish | Discounts, damages, expiry alerts, roles, UI refinement |

Each phase delivers a working, usable piece. No phase is "invisible" work.

---

## 9. Critical Business Rules

1. **Never delete records** — mark as void/cancelled only. Financial history is sacred.
2. **Stock cannot go negative** — system must block overselling.
3. **Expiry is per batch** — same item can have multiple batches with different expiry dates. Sell oldest first (FIFO).
4. **All prices in IQD** (Iraqi Dinar) — no multi-currency needed for now.
5. **Partial payments are standard** — both customers and suppliers pay in installments.
6. **Every inventory change must be logged** — full audit trail required.

---

## 10. What This System Is NOT

- Not a hospital management system
- Not a patient records system
- Not an e-commerce storefront
- Not a multi-branch system (for now)
- Not mobile app (web browser only)

---

*Document version: 1.0 — June 2026*
*To be updated as phases are defined in detail*