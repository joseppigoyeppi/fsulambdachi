"use client";

import { ProductManager } from "@/components/admin/product-manager";
import { PageHeader } from "@/components/admin/primitives";
import { useAdmin } from "@/components/admin/session";

export default function ProductsPage() {
  const { data } = useAdmin();
  if (!data) return null;
  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="Menu & prices"
        description="Change a price, mark something sold out, or add a new drink or piece of merch. Changes show on the store immediately."
      />
      <ProductManager products={data.products} brandOrder={data.settings.brandOrder} />
    </>
  );
}
