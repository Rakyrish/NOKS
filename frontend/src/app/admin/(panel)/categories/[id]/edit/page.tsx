import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin/api";

import { deleteCategory, updateCategory } from "../../actions";
import { CategoryForm } from "../../category-form";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = Number(id);
  const categories = await adminApi.categories.list();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Edit {category.name}</h1>
        <form action={deleteCategory.bind(null, categoryId)}>
          <Button type="submit" variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50">
            Delete
          </Button>
        </form>
      </div>
      <CategoryForm category={category} categories={categories} action={updateCategory.bind(null, categoryId)} />
    </div>
  );
}
