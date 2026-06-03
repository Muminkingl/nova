# Backup Feature PRD
## Nova Portal — Automated Daily Excel Backup to Telegram

---

## What We Are Building

A daily automated backup that exports all database tables to an Excel file and sends it to a private Telegram group. Built as a Next.js API route + n8n workflow.

---

## Step 1 — Install SheetJS

```bash
npm install xlsx
```

---

## Step 2 — Add Environment Variables

In `.env` and Vercel dashboard:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BACKUP_SECRET=make_up_any_random_string_here
```

---

## Step 3 — Create the API Route

File: `app/api/backup/export/route.ts`

- Protect with Bearer token (BACKUP_SECRET)
- Fetch all 5 tables: items, invoices, purchases, customers, suppliers
- Build Excel with 5 sheets using SheetJS
- Return as .xlsx file download

Code is already written above in our conversation — copy it directly.

---

## Step 4 — Deploy to Vercel

```bash
git push
```

Make sure BACKUP_SECRET and SUPABASE_SERVICE_ROLE_KEY are added in Vercel dashboard → Settings → Environment Variables.

Test the endpoint manually in browser:
```
GET https://your-app.vercel.app/api/backup/export
Header: Authorization: Bearer your_secret
```

Should download an Excel file with 5 sheets.

---

## Step 5 — Update n8n Workflow

Replace current workflow with:

```
Schedule Trigger (daily midnight)
      ↓
HTTP Request
  Method: GET
  URL: https://your-app.vercel.app/api/backup/export
  Header: Authorization: Bearer your_secret
  Response Format: FILE
      ↓
Telegram — Send Document
  Chat ID: -5152601020
  File: data from previous node
  Caption: 📦 Nova Portal Backup — {{ $now.toFormat('dd/MM/yyyy') }}
```

---

## Done When

- [ ] SheetJS installed
- [ ] API route created and deployed
- [ ] Endpoint tested manually — Excel file downloads correctly
- [ ] n8n workflow updated
- [ ] Test run — Excel file arrives in Telegram group
- [ ] All 5 sheets have correct data

---

*Backup PRD v1.0 — June 2026*