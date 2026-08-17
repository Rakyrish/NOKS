import type { Metadata } from "next";

import { adminApi, publicCategoriesFlat, publicIndustries } from "@/lib/admin/api";

import { createProduct } from "../actions";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, industries, manufacturers] = await Promise.all([
    publicCategoriesFlat(),
    publicIndustries(),
    adminApi.manufacturers.list(),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">New product</h1>
        <p className="mt-1 text-sm text-muted-fg">
          Save as a draft (unpublished) first if you want to add photos and documents before it
          goes live.
        </p>
      </div>
      <ProductForm
        categories={categories}
        industries={industries}
        manufacturers={manufacturers}
        action={createProduct}
      />
    </div>
  );
}
