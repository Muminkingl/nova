import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Authenticate request using Bearer token
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.BACKUP_SECRET}`;

  if (!authHeader || authHeader !== expectedToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 2. Fetch all 5 main tables concurrently using service role
    const [
      { data: items, error: itemsError },
      { data: invoices, error: invoicesError },
      { data: purchases, error: purchasesError },
      { data: customers, error: customersError },
      { data: suppliers, error: suppliersError }
    ] = await Promise.all([
      supabaseAdmin.from("items").select("*").order("name", { ascending: true }),
      supabaseAdmin.from("invoices").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("purchases").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("customers").select("*").order("name", { ascending: true }),
      supabaseAdmin.from("suppliers").select("*").order("name", { ascending: true })
    ]);

    // Check for query errors
    if (itemsError || invoicesError || purchasesError || customersError || suppliersError) {
      console.error("Database query error during export:", {
        itemsError,
        invoicesError,
        purchasesError,
        customersError,
        suppliersError
      });
      return NextResponse.json({ error: "Failed to retrieve backup datasets." }, { status: 500 });
    }

    // 3. Build SheetJS Workbook
    const workbook = XLSX.utils.book_new();

    const sheetsList = [
      { sheetName: "Items", data: items || [] },
      { sheetName: "Invoices", data: invoices || [] },
      { sheetName: "Purchases", data: purchases || [] },
      { sheetName: "Customers", data: customers || [] },
      { sheetName: "Suppliers", data: suppliers || [] }
    ];

    sheetsList.forEach(({ sheetName, data }) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // 4. Compile workbook to buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    // 5. Stream back as file attachment download
    return new Response(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=nova_backup_${new Date().toISOString().split("T")[0]}.xlsx`,
        "Cache-Control": "no-store, max-age=0"
      }
    });

  } catch (err: any) {
    console.error("Backup export handler exception:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
