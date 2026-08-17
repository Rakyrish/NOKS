import type { Paginated, ProductDocument, ProductImage } from "@/types";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
}

export interface DashboardMetrics {
  products_total: number;
  products_published: number;
  products_unpublished: number;
  products_featured: number;
  products_missing_seo: number;
  quotes_total: number;
  quotes_new: number;
  quotes_won: number;
  quotes_30d: number;
  recent_quotes: {
    id: number;
    reference: string;
    full_name: string;
    company: string;
    status: string;
    created_at: string;
  }[];
  top_products: { id: number; name: string; slug: string; quote_count: number; view_count: number }[];
  inquiries_total: number;
  inquiries_open: number;
  posts_published: number;
  posts_draft: number;
  conversations: number;
  qualified_leads: number;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: string | null;
  parent: number | null;
  is_featured: boolean;
  is_published: boolean;
  order: number;
  product_count: number;
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

export interface AdminIndustry {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  image: string | null;
  accent_color: string;
  applications: string[];
  is_featured: boolean;
  is_published: boolean;
  order: number;
  product_count: number;
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

export interface AdminManufacturer {
  id: number;
  name: string;
  slug: string;
  country: string;
  website: string;
  description: string;
  logo: string | null;
  is_published: boolean;
  order: number;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  chemical_formula: string;
  cas_number: string;
  hs_code: string;
  synonyms: string;
  grade: string;
  purity: string;
  category: number | null;
  category_name: string;
  industries: number[];
  industries_names: string[];
  manufacturer: number | null;
  short_description: string;
  description: string;
  applications: string[];
  benefits: string[];
  specifications: Record<string, string>;
  packaging_options: string[];
  storage_handling: string;
  safety_information: string;
  hazard_class: string;
  availability: string;
  unit: string;
  min_order_quantity: number;
  price_on_request: boolean;
  indicative_price: string | null;
  currency: string;
  lead_time: string;
  is_published: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  ai_generated: boolean;
  view_count: number;
  quote_count: number;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  noindex: boolean;
  images: ProductImage[];
  documents: ProductDocument[];
  created_at: string;
  updated_at: string;
}

/** Editable subset the product form actually submits. */
export type AdminProductInput = Partial<
  Omit<AdminProduct, "id" | "images" | "documents" | "created_at" | "updated_at" | "category_name" | "industries_names" | "ai_generated" | "view_count" | "quote_count" | "sku">
>;

export interface ProductDraft {
  suggested_name: string;
  chemical_formula: string;
  synonyms: string;
  grade: string;
  purity: string;
  short_description: string;
  description: string;
  applications: string[];
  benefits: string[];
  specifications: Record<string, string>;
  packaging_options: string[];
  meta_title: string;
  meta_description: string;
  confidence_note: string;
}

export interface AdminQuoteItem {
  product_name: string;
  quantity: string;
  unit: string;
  packaging: string;
  notes: string;
}

export interface AdminQuote {
  id: number;
  reference: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  industry: number | null;
  industry_name: string;
  message: string;
  delivery_location: string;
  required_by: string | null;
  status: string;
  source: string;
  internal_notes: string;
  handled_by: number | null;
  handled_by_username: string;
  items: AdminQuoteItem[];
  created_at: string;
  updated_at: string;
}

export interface AdminInquiry {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  topic: string;
  subject: string;
  message: string;
  is_handled: boolean;
  created_at: string;
}

export type AdminPaginated<T> = Paginated<T>;
