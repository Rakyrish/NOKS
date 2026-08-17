"use server";

import { redirect } from "next/navigation";

import { adminApi } from "@/lib/admin/api";
import { clearAdminToken } from "@/lib/admin/session";

export async function logoutAction() {
  try {
    await adminApi.logout();
  } catch {
    // Token already invalid/expired server-side — fine, we're clearing it anyway.
  }
  await clearAdminToken();
  redirect("/admin/login");
}
