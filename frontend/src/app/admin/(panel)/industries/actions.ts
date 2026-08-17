"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AdminApiError, adminApi } from "@/lib/admin/api";

export type FormState = { error?: string };

function buildInput(formData: FormData) {
  const applications = String(formData.get("applications") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    name: String(formData.get("name") || ""),
    tagline: String(formData.get("tagline") || ""),
    description: String(formData.get("description") || ""),
    icon: String(formData.get("icon") || ""),
    accent_color: String(formData.get("accent_color") || ""),
    applications,
    is_featured: formData.get("is_featured") === "on",
    is_published: formData.get("is_published") === "on",
    order: Number(formData.get("order")) || 0,
    meta_title: String(formData.get("meta_title") || ""),
    meta_description: String(formData.get("meta_description") || ""),
  };
}

export async function createIndustry(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  try {
    await adminApi.industries.create(buildInput(formData));
  } catch (error) {
    return { error: error instanceof AdminApiError ? JSON.stringify(error.payload ?? error.message) : "Could not create industry." };
  }
  revalidatePath("/admin/industries");
  redirect("/admin/industries");
}

export async function updateIndustry(
  id: number,
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  try {
    await adminApi.industries.update(id, buildInput(formData));
  } catch (error) {
    return { error: error instanceof AdminApiError ? JSON.stringify(error.payload ?? error.message) : "Could not save industry." };
  }
  revalidatePath("/admin/industries");
  redirect("/admin/industries");
}

export async function deleteIndustry(id: number) {
  await adminApi.industries.remove(id);
  revalidatePath("/admin/industries");
  redirect("/admin/industries");
}
