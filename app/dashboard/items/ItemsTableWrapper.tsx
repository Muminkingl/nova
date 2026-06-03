"use client";

import { useRouter } from "next/navigation";
import ItemsTable from "@/components/items/ItemsTable";
import { Item } from "@/types";

export default function ItemsTableWrapper({
  initialItems
}: {
  initialItems: Item[];
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return <ItemsTable initialItems={initialItems} onRefresh={handleRefresh} />;
}
