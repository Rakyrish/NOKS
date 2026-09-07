"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AdminApiError, adminApi } from "@/lib/admin/api";
import type { AdminProductInput, ProductDraft } from "@/types/admin";

export type FormState = { error?: string; success?: string };

/**
 * DRF returns field errors as {field: [msg, ...]}. Rendering that with
 * JSON.stringify put a raw `{"name":["…"]}` blob in front of the admin, which
 * buries the one message that matters most here — the duplicate-name
 * rejection from AdminProductSerializer.validate_name.
 */
function readableError(error: AdminApiError, fallback: string): string {
  const payload = error.payload;
  if (!payload || typeof payload !== "object") return error.message || fallback;

  const entries = Object.entries(payload as Record<string, unknown>);
  if (!entries.length) return error.message || fallback;

  const messages = entries.map(([field, value]) => {
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    return field === "detail" || field === "non_field_errors" ? text : `${field}: ${text}`;
  });
  return messages.join("\n");
}

function parseListField(formData: FormData, name: string): string[] {
  const raw = String(formData.get(name) || "");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseSpecifications(formData: FormData): Record<string, string> {
  const raw = String(formData.get("specifications") || "");
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) out[key.trim()] = rest.join(":").trim();
  }
  return out;
}

function buildProductInput(formData: FormData): AdminProductInput {
  const industries = formData.getAll("industries").map(Number).filter(Boolean);
  return {
    name: String(formData.get("name") || ""),
    category: Number(formData.get("category")) || null,
    manufacturer: formData.get("manufacturer") ? Number(formData.get("manufacturer")) : null,
    industries,
    chemical_formula: String(formData.get("chemical_formula") || ""),
    cas_number: String(formData.get("cas_number") || ""),
    hs_code: String(formData.get("hs_code") || ""),
    synonyms: String(formData.get("synonyms") || ""),
    grade: String(formData.get("grade") || "industrial"),
    purity: String(formData.get("purity") || ""),
    short_description: String(formData.get("short_description") || ""),
    description: String(formData.get("description") || ""),
    applications: parseListField(formData, "applications"),
    benefits: parseListField(formData, "benefits"),
    specifications: parseSpecifications(formData),
    packaging_options: parseListField(formData, "packaging_options"),
    storage_handling: String(formData.get("storage_handling") || ""),
    safety_information: String(formData.get("safety_information") || ""),
    hazard_class: String(formData.get("hazard_class") || ""),
    availability: String(formData.get("availability") || "in_stock"),
    unit: String(formData.get("unit") || "kg"),
    min_order_quantity: Number(formData.get("min_order_quantity")) || 1,
    price_on_request: formData.get("price_on_request") === "on",
    indicative_price: formData.get("indicative_price")
      ? String(formData.get("indicative_price"))
      : null,
    currency: String(formData.get("currency") || "KES"),
    lead_time: String(formData.get("lead_time") || ""),
    is_published: formData.get("is_published") === "on",
    is_featured: formData.get("is_featured") === "on",
    is_bestseller: formData.get("is_bestseller") === "on",
    meta_title: String(formData.get("meta_title") || ""),
    meta_description: String(formData.get("meta_description") || ""),
    meta_keywords: String(formData.get("meta_keywords") || ""),
  };
}

export async function createProduct(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const data = buildProductInput(formData);
  const fromAiDraft = formData.get("_from_ai_draft") === "on";
  const imageUrl = String(formData.get("image_url") || "").trim();

  let created;
  try {
    created = await adminApi.products.create({
      ...data,
      _from_ai_draft: fromAiDraft,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    });
  } catch (error) {
    if (error instanceof AdminApiError) {
      return { error: readableError(error, "Could not create the product.") };
    }
    return { error: "Could not create the product." };
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${created.id}/edit`);
}

export async function updateProduct(
  id: number,
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const data = buildProductInput(formData);
  try {
    await adminApi.products.update(id, data);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return { error: readableError(error, "Could not save the product.") };
    }
    return { error: "Could not save the product." };
  }
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  return { success: "Saved." };
}

export async function deleteProduct(id: number) {
  await adminApi.products.remove(id);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export type DuplicateOf = { id: number; name: string; sku: string };

export type DraftResult =
  | { ok: true; draft: ProductDraft }
  | { ok: false; error: string; duplicateOf?: DuplicateOf };

/**
 * Returns a result rather than throwing: an Error raised in a Server Action
 * reaches the client with its message redacted in production, which would
 * turn the backend's "already in the catalog" 409 — the one response the
 * admin most needs to read — into a generic failure.
 */
export async function generateDraft(input: {
  name?: string;
  cas_number?: string;
  category_id?: number;
  notes?: string;
  image_url?: string;
}): Promise<DraftResult> {
  try {
    return { ok: true, draft: await adminApi.products.generate(input) };
  } catch (error) {
    if (error instanceof AdminApiError) {
      const payload = (error.payload ?? {}) as { detail?: string; duplicate_of?: DuplicateOf };
      return {
        ok: false,
        error: payload.detail || readableError(error, "AI drafting failed."),
        duplicateOf: payload.duplicate_of,
      };
    }
    return { ok: false, error: "AI drafting failed." };
  }
}

export async function uploadImage(productId: number, formData: FormData) {
  await adminApi.products.uploadImage(productId, formData);
  revalidatePath(`/admin/products/${productId}/edit`);
}

export type ImageUrlFormState = { error?: string };

export async function uploadImageFromUrl(
  productId: number,
  _prev: ImageUrlFormState | undefined,
  formData: FormData,
): Promise<ImageUrlFormState> {
  const url = String(formData.get("url") || "").trim();
  const altText = String(formData.get("alt_text") || "");
  if (!url) return { error: "Paste an image URL first." };

  try {
    await adminApi.products.uploadImageFromUrl(productId, url, altText);
  } catch (error) {
    return {
      error:
        error instanceof AdminApiError
          ? (error.payload as { detail?: string })?.detail || error.message
          : "Could not fetch that image.",
    };
  }
  revalidatePath(`/admin/products/${productId}/edit`);
  return {};
}

export async function deleteImage(productId: number, imageId: number) {
  await adminApi.products.deleteImage(productId, imageId);
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function makePrimaryImage(productId: number, imageId: number) {
  await adminApi.products.makePrimaryImage(productId, imageId);
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function uploadDocument(productId: number, formData: FormData) {
  await adminApi.products.uploadDocument(productId, formData);
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function deleteDocument(productId: number, docId: number) {
  await adminApi.products.deleteDocument(productId, docId);
  revalidatePath(`/admin/products/${productId}/edit`);
}
