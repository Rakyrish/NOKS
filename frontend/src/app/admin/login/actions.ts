"use server";

import { redirect } from "next/navigation";

import { AdminApiError, adminLoginRequest } from "@/lib/admin/api";
import { setAdminToken } from "@/lib/admin/session";

export type LoginState = { error?: string };

export async function login(_prev: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  if (!username || !password) {
    return { error: "Enter both a username and password." };
  }

  try {
    const { token } = await adminLoginRequest(username, password);
    await setAdminToken(token);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return { error: error.message };
    }
    return { error: "Login failed — the backend may be unreachable. Try again." };
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}
