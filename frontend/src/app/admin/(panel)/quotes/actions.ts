"use server";

import { revalidatePath } from "next/cache";

import { adminApi } from "@/lib/admin/api";

export async function updateQuoteStatus(id: number, formData: FormData) {
  const status = String(formData.get("status") || "");
  await adminApi.quotes.update(id, { status });
  revalidatePath("/admin/quotes");
}
