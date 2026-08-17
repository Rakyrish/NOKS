"use server";

import { revalidatePath } from "next/cache";

import { adminApi } from "@/lib/admin/api";

export async function toggleHandled(id: number, isHandled: boolean) {
  await adminApi.inquiries.update(id, { is_handled: isHandled });
  revalidatePath("/admin/inquiries");
}
