import { getCustomerByIdAction } from "@/app/actions/customers";
import CustomerForm from "@/components/customers/CustomerForm";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Edit Customer - Nova Medical ERP",
  description: "Modify customer configuration settings and contact logs",
};

export default async function EditCustomerPage({ params }: { params: Params }) {
  const { id } = await params;

  const res = await getCustomerByIdAction(id);
  if (res.error || !res.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Customer Profile</h1>
        <p className="text-sm text-muted-foreground">
          Modify contact card settings for `{res.data.customer.name}`
        </p>
      </div>

      <CustomerForm customer={res.data.customer} />
    </div>
  );
}
