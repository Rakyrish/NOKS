"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AdminApiError, adminApi } from "@/lib/admin/api";

export type FormState = { error?: string };

function buildInput(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    parent: formData.get("parent") ? Number(formData.get("parent")) : null,
    description: String(formData.get("description") || ""),
    icon: String(formData.get("icon") || ""),
    is_featured: formData.get("is_featured") === "on",
    is_published: formData.get("is_published") === "on",
    order: Number(formData.get("order")) || 0,
    meta_title: String(formData.get("meta_title") || ""),
    meta_description: String(formData.get("meta_description") || ""),
  };
}

export async function createCategory(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  try {
    await adminApi.categories.create(buildInput(formData));
  } catch (error) {
    return { error: error instanceof AdminApiError ? JSON.stringify(error.payload ?? error.message) : "Could not create category." };
  }
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(
  id: number,
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  try {
    await adminApi.categories.update(id, buildInput(formData));
  } catch (error) {
    return { error: error instanceof AdminApiError ? JSON.stringify(error.payload ?? error.message) : "Could not save category." };
  }
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: number) {
  await adminApi.categories.remove(id);
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}
