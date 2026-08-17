/**
 * Server-only admin API client. Mirrors the shape of lib/api.ts but always
 * runs on the server (Server Components / Server Actions), always hits the
 * backend container directly via `internalApiUrl`, and always carries the
 * admin's bearer token — which therefore never reaches the browser bundle.
 */
import "server-only";

import { redirect } from "next/navigation";

import { internalApiUrl, siteUrl } from "@/lib/site";
import type {
  AdminCategory,
  AdminIndustry,
  AdminInquiry,
  AdminManufacturer,
  AdminPaginated,
  AdminProduct,
  AdminProductInput,
  AdminQuote,
  AdminUser,
  DashboardMetrics,
  ProductDraft,
} from "@/types/admin";
import type { Category, Industry } from "@/types";

import { clearAdminToken, getAdminToken } from "./session";

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

// See lib/api.ts's identical pair for why both of these are needed — this
// client only ever runs server-side, so it always sends them.
const forwardedHeaders = { "X-Forwarded-Proto": "https", "X-Forwarded-Host": new URL(siteUrl).host };

const qs = (params: Record<string, string | number | boolean | undefined> = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

/** Unauthenticated call — only used by the login action itself. */
export async function adminLoginRequest(username: string, password: string) {
  const response = await fetch(`${internalApiUrl}/auth/login/`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...forwardedHeaders },
    body: JSON.stringify({ username, password }),
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new AdminApiError(payload?.detail || "Login failed.", response.status, payload);
  }
  return payload as { token: string; user: AdminUser };
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAdminToken();
  if (!token) redirect("/admin/login");

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(`${internalApiUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Token ${token}`,
      ...forwardedHeaders,
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 401) {
    await clearAdminToken();
    redirect("/admin/login");
  }

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = await response.text().catch(() => undefined);
    }
    throw new AdminApiError(
      `Request to ${path} failed with ${response.status}`,
      response.status,
      payload,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const j = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export const adminApi = {
  logout: () => adminRequest<void>("/auth/logout/", { method: "POST" }),
  me: () => adminRequest<AdminUser>("/auth/me/"),
  dashboard: () => adminRequest<DashboardMetrics>("/admin/dashboard/"),

  products: {
    list: (params: { q?: string; status?: string; category?: number; page?: number; page_size?: number } = {}) =>
      adminRequest<AdminPaginated<AdminProduct>>(`/admin/products/${qs(params)}`),
    get: (id: number) => adminRequest<AdminProduct>(`/admin/products/${id}/`),
    create: (data: AdminProductInput & { _from_ai_draft?: boolean; image_url?: string }) =>
      adminRequest<AdminProduct>("/admin/products/", { method: "POST", ...j(data) }),
    update: (id: number, data: AdminProductInput) =>
      adminRequest<AdminProduct>(`/admin/products/${id}/`, { method: "PATCH", ...j(data) }),
    remove: (id: number) => adminRequest<void>(`/admin/products/${id}/`, { method: "DELETE" }),
    generate: (data: {
      name?: string;
      cas_number?: string;
      category_id?: number;
      notes?: string;
      image_url?: string;
    }) => adminRequest<ProductDraft>("/admin/products/generate/", { method: "POST", ...j(data) }),
    uploadImage: (productId: number, form: FormData) =>
      adminRequest(`/admin/products/${productId}/images/`, { method: "POST", body: form }),
    uploadImageFromUrl: (productId: number, url: string, altText?: string) =>
      adminRequest(`/admin/products/${productId}/images/from-url/`, {
        method: "POST",
        ...j({ url, alt_text: altText }),
      }),
    deleteImage: (productId: number, imageId: number) =>
      adminRequest<void>(`/admin/products/${productId}/images/${imageId}/`, { method: "DELETE" }),
    makePrimaryImage: (productId: number, imageId: number) =>
      adminRequest(`/admin/products/${productId}/images/${imageId}/make-primary/`, {
        method: "POST",
      }),
    uploadDocument: (productId: number, form: FormData) =>
      adminRequest(`/admin/products/${productId}/documents/`, { method: "POST", body: form }),
    deleteDocument: (productId: number, docId: number) =>
      adminRequest<void>(`/admin/products/${productId}/documents/${docId}/`, {
        method: "DELETE",
      }),
  },

  categories: {
    list: () => adminRequest<AdminCategory[]>("/admin/categories/"),
    create: (data: Partial<AdminCategory>) =>
      adminRequest<AdminCategory>("/admin/categories/", { method: "POST", ...j(data) }),
    update: (id: number, data: Partial<AdminCategory>) =>
      adminRequest<AdminCategory>(`/admin/categories/${id}/`, { method: "PATCH", ...j(data) }),
    remove: (id: number) => adminRequest<void>(`/admin/categories/${id}/`, { method: "DELETE" }),
  },

  industries: {
    list: () => adminRequest<AdminIndustry[]>("/admin/industries/"),
    create: (data: Partial<AdminIndustry>) =>
      adminRequest<AdminIndustry>("/admin/industries/", { method: "POST", ...j(data) }),
    update: (id: number, data: Partial<AdminIndustry>) =>
      adminRequest<AdminIndustry>(`/admin/industries/${id}/`, { method: "PATCH", ...j(data) }),
    remove: (id: number) => adminRequest<void>(`/admin/industries/${id}/`, { method: "DELETE" }),
  },

  manufacturers: {
    list: () => adminRequest<AdminManufacturer[]>("/admin/manufacturers/"),
  },

  quotes: {
    list: (params: { status?: string; page?: number } = {}) =>
      adminRequest<AdminPaginated<AdminQuote>>(`/admin/quotes/${qs(params)}`),
    get: (id: number) => adminRequest<AdminQuote>(`/admin/quotes/${id}/`),
    update: (id: number, data: Partial<Pick<AdminQuote, "status" | "internal_notes">>) =>
      adminRequest<AdminQuote>(`/admin/quotes/${id}/`, { method: "PATCH", ...j(data) }),
  },

  inquiries: {
    list: (params: { is_handled?: boolean; page?: number } = {}) =>
      adminRequest<AdminPaginated<AdminInquiry>>(`/admin/inquiries/${qs(params)}`),
    update: (id: number, data: Partial<Pick<AdminInquiry, "is_handled">>) =>
      adminRequest<AdminInquiry>(`/admin/inquiries/${id}/`, { method: "PATCH", ...j(data) }),
  },
};

/** Public taxonomy (category/industry pickers) — read via the ordinary public API. */
export async function publicCategoriesFlat(): Promise<Category[]> {
  const response = await fetch(`${internalApiUrl}/categories/?tree=false`, {
    cache: "no-store",
    headers: forwardedHeaders,
  });
  if (!response.ok) return [];
  return response.json();
}

export async function publicIndustries(): Promise<Industry[]> {
  const response = await fetch(`${internalApiUrl}/industries/`, {
    cache: "no-store",
    headers: forwardedHeaders,
  });
  if (!response.ok) return [];
  return response.json();
}

export { AdminApiError as default };
