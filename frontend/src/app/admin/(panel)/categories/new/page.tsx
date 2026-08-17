import type { Metadata } from "next";

import { adminApi } from "@/lib/admin/api";

import { createCategory } from "../actions";
import { CategoryForm } from "../category-form";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  const categories = await adminApi.categories.list();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">New category</h1>
      <CategoryForm categories={categories} action={createCategory} />
    </div>
  );
}
