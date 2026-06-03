import CustomerForm from "@/components/customers/CustomerForm";

export const metadata = {
  title: "Add Customer - Nova Medical ERP",
  description: "Register a new medical customer clinic, hospital or pharmacy",
};

export default function AddCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Register New Customer</h1>
        <p className="text-sm text-muted-foreground">
          Create a new customer profile. Sales billing logs and outstanding receivables will aggregate automatically.
        </p>
      </div>

      <CustomerForm />
    </div>
  );
}
