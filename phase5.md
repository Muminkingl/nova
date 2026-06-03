# Phase 5 PRD — Final Polish
## Medical Distribution Management System

> **Status:** Not Started  
> **Prerequisites:** Phase 1 ✅ Phase 2 ✅ Phase 3 ✅ Phase 4 ✅  
> **Goal:** Production-ready. Real users. Real data. Secure, logged, backed up.  
> **This is the last phase. After this, the system ships.**

---

## What We Are Building in Phase 5

Four things. Nothing more.

1. **User Roles & Permissions** — control who can do what
2. **Print-Ready Invoice PDF** — professional invoice output
3. **Daily Telegram Backup** — automatic database backup via n8n
4. **Activity Log** — full audit trail of every action

---

## FEATURE 1: User Roles & Permissions

### The Two Roles

| Role | Who | What They Can Do |
|------|-----|-----------------|
| **Admin** | Owner, 1-2 people | Everything. Full access. |
| **Staff** | Employees, 1-2 people | Limited. See below. |

### Staff Permissions — Exactly What They CAN Do

| Module | Staff Can | Staff Cannot |
|--------|-----------|--------------|
| Items | View only | Add / Edit / Delete |
| Stock Balance | View only | — |
| Purchases | View + Create | Edit / Delete |
| Suppliers | View only | Add / Edit / Delete |
| Invoices | View + Create | Edit / Delete / Void |
| Customers | View only | Add / Edit / Delete |
| Reports | View Sales & Profits only | Financial Overview / Account Statements |
| Damages | Cannot access | — |
| Activity Log | Cannot access | — |
| User Management | Cannot access | — |

### Admin Permissions
Full access to everything. No restrictions.

---

### Supabase Setup for Roles

#### Step 1 — Add role to user profile
```sql
create table user_profiles (
  id uuid references auth.users(id) primary key,
  full_name text not null,
  role text not null default 'staff', -- 'admin' | 'staff'
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

#### Step 2 — Row Level Security policies
Enable RLS on sensitive tables. Example for damages:
```sql
alter table damages enable row level security;

create policy "admin only"
on damages
for all
using (
  (select role from user_profiles where id = auth.uid()) = 'admin'
);
```

Apply same pattern to:
- damages → admin only
- user_profiles → admin only
- activity_log → admin only (read), all authenticated (insert)
- suppliers → admin only for insert/update/delete
- customers → admin only for insert/update/delete
- items → admin only for insert/update/delete

#### Step 3 — Frontend role check
```typescript
// lib/auth.ts
export async function getUserRole(): Promise<'admin' | 'staff'> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .single();
  return data?.role ?? 'staff';
}
```

Use this to hide/show UI elements and protect routes.

---

### User Management Page `/dashboard/users` (Admin only)

Simple page. Admin manages team accounts.

#### Users Table
| Column | Description |
|--------|-------------|
| Name | Full name |
| Email | Login email |
| Role | Admin / Staff |
| Status | Active / Inactive |
| Created | Date added |
| Actions | Edit role / Deactivate |

#### Invite User Flow
1. Admin enters email + name + role
2. Supabase sends invite email automatically
3. User sets their password via email link
4. Profile created with assigned role

#### Edit User
- Can change role (admin ↔ staff)
- Can deactivate account (does not delete)
- Cannot delete users — deactivate only

---

### Route Protection

Protect all dashboard routes. Redirect to login if not authenticated.

```typescript
// middleware.ts
// Check session on every /dashboard/* route
// If no session → redirect to /login
// If staff tries to access admin-only page → redirect to /dashboard with toast "Access denied"
```

Admin-only routes to protect:
- /dashboard/users
- /dashboard/damages
- /dashboard/reports/overview (financial)
- /dashboard/reports/statements
- /dashboard/suppliers/new
- /dashboard/customers/new
- /dashboard/items/new

---

## FEATURE 2: Print-Ready Invoice PDF

When admin or staff views an invoice, they can generate a clean PDF to print or send to the customer.

### What the PDF contains

```
┌─────────────────────────────────────────┐
│  NOVA PORTAL                            │
│  Medical Distribution                   │
│  Erbil, Kurdistan Region, Iraq          │
│                                         │
│  INVOICE                                │
│  Invoice #: INV-0001                    │
│  Date: June 2, 2026                     │
│                                         │
│  Bill To:                               │
│  Rizgary Hospital                       │
│  Contact: Dr. Ahmed                     │
│  Phone: 0750-XXX-XXXX                   │
│                                         │
│  ┌──────────┬────┬──────┬───────┬─────┐ │
│  │ Item     │ Qty│Price │Disc % │Total│ │
│  ├──────────┼────┼──────┼───────┼─────┤ │
│  │ IV Bags  │ 20 │4,000 │  0%   │80k  │ │
│  │ Syringes │ 50 │1,000 │ 10%   │45k  │ │
│  └──────────┴────┴──────┴───────┴─────┘ │
│                                         │
│  Subtotal:        125,000 IQD           │
│  Discount:         -5,000 IQD           │
│  TOTAL:           120,000 IQD           │
│  Amount Paid:      50,000 IQD           │
│  BALANCE DUE:      70,000 IQD           │
│                                         │
│  Status: PARTIAL                        │
└─────────────────────────────────────────┘
```

### Implementation

Use `@react-pdf/renderer` — generates PDF entirely in the browser, no server needed.

```bash
npm install @react-pdf/renderer
```

```typescript
// components/invoices/InvoicePDF.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export function InvoicePDF({ invoice, customer, items }) {
  // Clean professional layout
  // Company header
  // Customer info
  // Items table
  // Totals
  // Balance due
}
```

Add **Download PDF** button on Invoice Detail page.
Add **Print** button — opens PDF in new tab, browser handles print.

### PDF Rules
- All amounts in IQD formatted with commas (1,000,000)
- Status shown clearly: PAID / PARTIAL / UNPAID
- If balance due = 0, show "PAID IN FULL" in green
- Company name and address at top (configurable in settings)

---

## FEATURE 3: Daily Telegram Backup

Automatic daily export of all critical data to a Telegram group. Built entirely in n8n. No code in the Next.js app.

### Setup Steps

#### Step 1 — Create Telegram Bot
1. Open Telegram → search @BotFather
2. Send `/newbot` → follow steps → get bot token
3. Create a private Telegram group (owner + bot)
4. Get the group chat ID

#### Step 2 — n8n Workflow

**Trigger:** Schedule — every day at 12:00 AM Erbil time (UTC+3 = 21:00 UTC)

**Nodes in order:**

```
1. Schedule Trigger (daily 21:00 UTC)
        ↓
2. Supabase Node — fetch all items
        ↓
3. Supabase Node — fetch all invoices (last 30 days)
        ↓
4. Supabase Node — fetch all purchases (last 30 days)
        ↓
5. Supabase Node — fetch all customer debts summary
        ↓
6. Supabase Node — fetch all supplier debts summary
        ↓
7. Code Node — convert all data to Excel format (xlsx)
        ↓
8. Telegram Node — send Excel file to group
        ↓
9. Telegram Node — send summary text message
```

**Summary text message format:**
```
📦 Nova Portal Daily Backup
Date: June 2, 2026

💰 Financial Summary:
• Customer Debt: 12,500,000 IQD
• Supplier Debt: 8,200,000 IQD
• Items in Stock: 47

✅ Backup file attached above.
```

#### Step 3 — Excel file structure
One Excel file with multiple sheets:
- Sheet 1: Items & Stock
- Sheet 2: Recent Invoices
- Sheet 3: Recent Purchases
- Sheet 4: Customer Debts
- Sheet 5: Supplier Debts

#### Cost
- n8n: free (you already have it running)
- Telegram bot: free
- Total: $0/month

---

## FEATURE 4: Activity Log

Full audit trail. Every action by every user is recorded. Admin can see who did what and when.

### Supabase Table

```sql
create table activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  user_name text not null,
  action text not null,        -- 'created' | 'updated' | 'voided' | 'payment_recorded' | 'damage_recorded'
  entity_type text not null,   -- 'invoice' | 'purchase' | 'item' | 'customer' | 'supplier' | 'damage' | 'payment'
  entity_id text,              -- id of the affected record
  entity_label text,           -- human readable: 'INV-0001' or 'Rizgary Hospital'
  details jsonb,               -- extra info: { amount: 50000, items_count: 3 }
  created_at timestamp with time zone default now()
);
```

### What Gets Logged

| Action | Trigger |
|--------|---------|
| Item created | Add item form submitted |
| Item updated | Edit item form submitted |
| Purchase created | New purchase saved |
| Payment to supplier recorded | Supplier payment modal submitted |
| Invoice created | New invoice saved |
| Payment from customer recorded | Customer payment modal submitted |
| Damage recorded | Record damage form submitted |
| User invited | Admin invites new user |
| User role changed | Admin edits user role |

### How to Log (Frontend)

Call this after every successful Supabase mutation:

```typescript
// lib/supabase/activity.ts
export async function logActivity({
  action,
  entity_type,
  entity_id,
  entity_label,
  details
}: LogActivityParams) {
  const user = await supabase.auth.getUser();
  const profile = await getUserProfile();

  await supabase.from('activity_log').insert({
    user_id: user.data.user?.id,
    user_name: profile.full_name,
    action,
    entity_type,
    entity_id,
    entity_label,
    details
  });
}
```

Usage example:
```typescript
// After creating invoice
await logActivity({
  action: 'created',
  entity_type: 'invoice',
  entity_id: invoice.id,
  entity_label: 'INV-0024',
  details: { customer: 'Rizgary Hospital', amount: 120000, items_count: 2 }
});
```

### Activity Log Page `/dashboard/activity` (Admin only)

#### Filters
- Filter by user
- Filter by action type
- Filter by entity type
- Date range picker

#### Table
| Column | Description |
|--------|-------------|
| Time | Date + time |
| User | Who did it |
| Action | Created / Updated / Voided / Payment recorded |
| What | Entity type + label (e.g. Invoice INV-0024) |
| Details | Brief summary |

- Most recent first
- No pagination needed for small team — just show last 500 entries
- No delete button — log is permanent and sacred

---

## Settings Page `/dashboard/settings` (Admin only)

Simple page. Company info used in PDF invoices.

| Field | Description |
|-------|-------------|
| Company Name | Shown on PDF header |
| Address | Shown on PDF |
| Phone | Shown on PDF |
| Currency Label | Default: IQD |

Stored in a single Supabase row:
```sql
create table settings (
  id integer primary key default 1,
  company_name text default 'Nova Portal',
  address text,
  phone text,
  currency text default 'IQD',
  updated_at timestamp with time zone default now()
);
-- Only one row ever. id = 1 always.
```

---

## File & Folder Structure

```
/app
  /dashboard
    /users
      page.tsx                  ← User management (admin only)
    /activity
      page.tsx                  ← Activity log (admin only)
    /settings
      page.tsx                  ← Company settings (admin only)

/components
  /users
    UsersTable.tsx
    InviteUserModal.tsx
  /invoices
    InvoicePDF.tsx              ← PDF template
  /activity
    ActivityTable.tsx

/lib
  /supabase
    activity.ts                 ← logActivity function
    users.ts                    ← user management queries
    settings.ts

/middleware.ts                  ← Route protection
```

---

## Phase 5 Completion Checklist

**Roles & Permissions**
- [ ] user_profiles table created
- [ ] RLS policies applied to all sensitive tables
- [ ] getUserRole() function working
- [ ] Middleware protecting all routes
- [ ] Admin-only pages redirect staff with toast
- [ ] User management page — invite, edit role, deactivate
- [ ] Sidebar hides restricted links for staff

**Invoice PDF**
- [ ] @react-pdf/renderer installed
- [ ] InvoicePDF component built
- [ ] Download PDF button on invoice detail
- [ ] Print button working
- [ ] IQD formatting correct
- [ ] PAID IN FULL shown when balance = 0

**Telegram Backup**
- [ ] Telegram bot created
- [ ] Private group created with bot
- [ ] n8n workflow built and tested
- [ ] Schedule set to 12:00 AM Erbil time
- [ ] Excel file with 5 sheets sends correctly
- [ ] Summary text message sends correctly
- [ ] Manual test run confirmed working

**Activity Log**
- [ ] activity_log table created
- [ ] logActivity() function written
- [ ] Logging added to: invoice create, purchase create, both payment types, damage record, item create/edit, user management
- [ ] Activity log page built (admin only)
- [ ] Filters working

**Settings**
- [ ] settings table created
- [ ] Settings page built
- [ ] Company info pulls into PDF correctly

---

## System Is Complete After Phase 5

After this phase the system has:
- ✅ Full inventory management
- ✅ Supplier and purchase tracking
- ✅ Customer invoicing and debt tracking
- ✅ Financial reports and profit analysis
- ✅ Expiry alerts and damage write-offs
- ✅ Role-based access control
- ✅ Professional PDF invoices
- ✅ Automatic daily backup to Telegram
- ✅ Full audit trail of all actions

**This is a production-grade medical distribution ERP.**

---

*Phase 5 PRD v1.0 — June 2026*
*Final phase. Ship it.*