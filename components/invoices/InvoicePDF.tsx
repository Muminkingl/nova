import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Invoice, InvoiceItem, Settings } from "@/types";

// PDF Stylesheet conforming to clean print rules
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    color: "#18181b",
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    paddingBottom: 15,
    marginBottom: 20,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#09090b",
  },
  companyDetails: {
    fontSize: 8,
    color: "#71717a",
    marginTop: 2,
  },
  invoiceTitleBlock: {
    textAlign: "right",
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#09090b",
  },
  invoiceMeta: {
    fontSize: 8,
    color: "#71717a",
    marginTop: 2,
  },
  billingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  billingCol: {
    width: "48%",
  },
  billingTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  billingText: {
    fontSize: 9,
    color: "#27272a",
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    alignSelf: "flex-start",
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
    fontWeight: "bold",
    color: "#71717a",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
  },
  textRight: {
    textAlign: "right",
  },
  textCenter: {
    textAlign: "center",
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsTable: {
    width: 200,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    color: "#71717a",
  },
  totalsRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    marginTop: 3,
    fontWeight: "bold",
    fontSize: 10,
    color: "#09090b",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 10,
    textAlign: "center",
    fontSize: 7,
    color: "#a1a1aa",
  },
});

interface InvoicePDFProps {
  invoice: Invoice & { customers: { name: string; phone: string | null; address: string | null } | null };
  items: (InvoiceItem & { items: { name: string; unit: string } | null })[];
  settings: Settings | null;
}

export function InvoicePDF({ invoice, items, settings }: InvoicePDFProps) {
  const companyName = settings?.company_name || "Nova Portal";
  const companyAddress = settings?.address || "Erbil, Kurdistan Region, Iraq";
  const companyPhone = settings?.phone || "0750-000-0000";
  const currencyLabel = settings?.currency || "IQD";

  const total = Number(invoice.total_amount || 0);
  const discount = Number(invoice.discount_amount || 0);
  const final = Number(invoice.final_amount || 0);
  const paid = Number(invoice.amount_paid || 0);
  const remaining = Math.max(0, final - paid);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName.toUpperCase()}</Text>
            <Text style={styles.companyDetails}>{companyAddress}</Text>
            <Text style={styles.companyDetails}>Phone: {companyPhone}</Text>
          </View>
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceTitle}>SALES INVOICE</Text>
            <Text style={styles.invoiceMeta}>Invoice #: {invoice.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>Date: {invoice.invoice_date}</Text>
          </View>
        </View>

        {/* Billing Section */}
        <View style={styles.billingSection}>
          <View style={styles.billingCol}>
            <Text style={styles.billingTitle}>Billed To:</Text>
            <Text style={[styles.billingText, { fontWeight: "bold" }]}>
              {invoice.customers?.name || "Unknown Customer"}
            </Text>
            {invoice.customers?.address && (
              <Text style={styles.billingText}>{invoice.customers.address}</Text>
            )}
            {invoice.customers?.phone && (
              <Text style={styles.billingText}>Phone: {invoice.customers.phone}</Text>
            )}
          </View>
          <View style={[styles.billingCol, { textAlign: "right" }]}>
            <Text style={styles.billingTitle}>Payment Status:</Text>
            <Text
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    invoice.status === "paid"
                      ? "#ecfdf5"
                      : invoice.status === "partial"
                      ? "#fef3c7"
                      : "#fef2f2",
                  color:
                    invoice.status === "paid"
                      ? "#047857"
                      : invoice.status === "partial"
                      ? "#b45309"
                      : "#b91c1c",
                },
              ]}
            >
              {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Invoice Item Lines Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRowHeader}>
            <Text style={[styles.tableColHeader, { width: "40%" }]}>Product Description</Text>
            <Text style={[styles.tableColHeader, { width: "12%", textAlign: "center" }]}>Unit</Text>
            <Text style={[styles.tableColHeader, { width: "10%", textAlign: "center" }]}>Qty</Text>
            <Text style={[styles.tableColHeader, { width: "18%", textAlign: "right" }]}>Price ({currencyLabel})</Text>
            <Text style={[styles.tableColHeader, { width: "8%", textAlign: "center" }]}>Disc</Text>
            <Text style={[styles.tableColHeader, { width: "12%", textAlign: "right" }]}>Subtotal</Text>
          </View>

          {/* Table Body Rows */}
          {items.map((row, index) => (
            <View style={styles.tableRow} key={row.id}>
              <Text style={[styles.tableCol, { width: "40%" }]}>{row.items?.name || "Uncataloged"}</Text>
              <Text style={[styles.tableCol, { width: "12%", textAlign: "center" }]}>{row.items?.unit || "Piece"}</Text>
              <Text style={[styles.tableCol, { width: "10%", textAlign: "center" }]}>{row.quantity}</Text>
              <Text style={[styles.tableCol, { width: "18%", textAlign: "right" }]}>
                {Number(row.sell_price).toLocaleString()}
              </Text>
              <Text style={[styles.tableCol, { width: "8%", textAlign: "center" }]}>
                {Number(row.discount_percent || 0)}%
              </Text>
              <Text style={[styles.tableCol, { width: "12%", textAlign: "right" }]}>
                {Number(row.subtotal).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text>Subtotal:</Text>
              <Text>{total.toLocaleString()} {currencyLabel}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Volume Discount:</Text>
              <Text>-{discount.toLocaleString()} {currencyLabel}</Text>
            </View>
            <View style={styles.totalsRowBold}>
              <Text>Total Billing:</Text>
              <Text>{final.toLocaleString()} {currencyLabel}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Amount Paid:</Text>
              <Text>-{paid.toLocaleString()} {currencyLabel}</Text>
            </View>
            <View style={[styles.totalsRowBold, { borderTopWidth: 1, borderColor: "#09090b" }]}>
              <Text>Balance Due:</Text>
              <Text>{remaining.toLocaleString()} {currencyLabel}</Text>
            </View>
          </View>
        </View>

        {/* Footer Notes */}
        <View style={styles.footer}>
          <Text>Thank you for your business. Systems audit logged by {companyName}.</Text>
        </View>
      </Page>
    </Document>
  );
}
