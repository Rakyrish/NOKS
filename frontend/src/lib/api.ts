import { apiUrl, internalApiUrl } from "./site";
import type {
  BlogCategory,
  Category,
  Facets,
  HomepageData,
  Industry,
  Milestone,
  Paginated,
  PostDetail,
  PostSummary,
  Product,
  ProductDetail,
  QuoteItemInput,
  Service,
  TeamMember,
} from "@/types";

const isServer = typeof window === "undefined";
const base = () => (isServer ? internalApiUrl : apiUrl);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOptions = RequestInit & {
  /** ISR window in seconds. Omit for the default 5-minute revalidate. */
  revalidate?: number | false;
};

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate = 300, ...init } = options;

  const response = await fetch(`${base()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...(isServer && init.method === undefined
      ? { next: { revalidate: revalidate === false ? undefined : revalidate } }
      : {}),
  });

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = await response.text().catch(() => undefined);
    }
    throw new ApiError(
      `Request to ${path} failed with ${response.status}`,
      response.status,
      payload,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const qs = (params: Record<string, string | number | boolean | undefined | string[]>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === false) continue;
    if (Array.isArray(value)) value.forEach((v) => v && search.append(key, String(v)));
    else search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

/** Read endpoints tolerate a cold/absent backend so pages still render. */
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api] falling back:", (error as Error).message);
    }
    return fallback;
  }
}

const emptyPage = <T>(): Paginated<T> => ({
  count: 0,
  num_pages: 0,
  page: 1,
  page_size: 0,
  has_next: false,
  has_previous: false,
  next: null,
  previous: null,
  results: [],
});

export type ProductQuery = {
  q?: string;
  category?: string;
  industry?: string;
  manufacturer?: string;
  grade?: string[];
  availability?: string[];
  cas_number?: string;
  package_size?: string;
  application?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  featured?: boolean;
};

export const api = {
  homepage: () =>
    safe(request<HomepageData>("/homepage/"), {
      stats: [],
      industries: [],
      categories: [],
      featured_products: [],
      value_props: [],
      services: [],
      process: [],
      testimonials: [],
      clients: [],
      certifications: [],
      faqs: [],
      latest_posts: [],
    }),

  products: (query: ProductQuery = {}) =>
    safe(
      request<Paginated<Product>>(`/products/${qs(query as Record<string, string>)}`),
      emptyPage<Product>(),
    ),

  product: (slug: string) =>
    request<ProductDetail>(`/products/${encodeURIComponent(slug)}/`),

  facets: (query: ProductQuery = {}) =>
    safe(request<Facets>(`/products/facets/${qs(query as Record<string, string>)}`), {
      grades: [],
      availability: [],
      categories: [],
      industries: [],
      manufacturers: [],
      package_sizes: [],
      total: 0,
    }),

  searchSuggest: (term: string) =>
    safe(
      request<{ name: string; slug: string; sku: string; cas_number: string; category: string }[]>(
        `/products/search_suggest/${qs({ q: term })}`,
        { revalidate: false },
      ),
      [],
    ),

  compare: (slugs: string[]) =>
    safe(request<ProductDetail[]>(`/products/compare/${qs({ slugs: slugs.join(",") })}`), []),

  categories: () => safe(request<Category[]>("/categories/?tree=false"), []),
  categoryTree: () => safe(request<Category[]>("/categories/"), []),
  category: (slug: string) => request<Category>(`/categories/${slug}/`),

  industries: () => safe(request<Industry[]>("/industries/"), []),
  industry: (slug: string) => request<Industry>(`/industries/${slug}/`),

  services: () => safe(request<Service[]>("/services/"), []),
  team: () => safe(request<TeamMember[]>("/team/"), []),
  milestones: () => safe(request<Milestone[]>("/milestones/"), []),

  posts: (query: { page?: number; category__slug?: string; tag?: string; search?: string } = {}) =>
    safe(
      request<Paginated<PostSummary>>(`/posts/${qs(query as Record<string, string>)}`),
      emptyPage<PostSummary>(),
    ),

  post: (slug: string) => request<PostDetail>(`/posts/${encodeURIComponent(slug)}/`),
  blogCategories: () => safe(request<BlogCategory[]>("/blog-categories/"), []),

  // ── Mutations ────────────────────────────────────────────────
  submitQuote: (payload: {
    full_name: string;
    email: string;
    phone?: string;
    company?: string;
    country?: string;
    message?: string;
    delivery_location?: string;
    source?: string;
    items: QuoteItemInput[];
  }) =>
    request<{ reference: string }>("/quotes/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  submitInquiry: (payload: {
    full_name: string;
    email: string;
    phone?: string;
    company?: string;
    topic?: string;
    subject?: string;
    message: string;
  }) => request<unknown>("/inquiries/", { method: "POST", body: JSON.stringify(payload) }),

  subscribe: (email: string, source = "footer") =>
    request<{ detail: string }>("/newsletter/", {
      method: "POST",
      body: JSON.stringify({ email, source }),
    }),

  assistantChat: (payload: { message: string; session_id?: string | null; path?: string }) =>
    request<{
      session_id: string;
      reply: string;
      configured: boolean;
      products: Product[];
    }>("/assistant/chat/", { method: "POST", body: JSON.stringify(payload) }),

  assistantConfig: () =>
    safe(
      request<{ enabled: boolean; name: string; greeting: string; suggestions: string[] }>(
        "/assistant/config/",
      ),
      { enabled: false, name: "Assistant", greeting: "", suggestions: [] },
    ),
};
