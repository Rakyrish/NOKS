import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogView } from "@/components/catalog/catalog-view";
import { CtaBand } from "@/components/home/cta-band";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Skeleton } from "@/components/ui";
import { api, type ProductQuery } from "@/lib/api";
import { itemListSchema } from "@/lib/schema";
import { brand } from "@/lib/site";

export const revalidate = 300;

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const term = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";

  const label = term
    ? `“${term}”`
    : category
      ? category.replace(/-/g, " ")
      : "Industrial & Laboratory Chemicals";

  const title = term || category ? `${label} — Product Catalog` : "Product Catalog";

  return {
    title,
    description: `Browse ${label} from ${brand.fullName}. Certified industrial chemicals, laboratory reagents, water treatment and food grade products with technical datasheets and fast delivery across Kenya and East Africa.`,
    alternates: { canonical: "/products" },
    // Filtered permutations must not compete with the canonical catalog page.
    robots: term || Object.keys(params).length > 1 ? { index: false, follow: true } : undefined,
  };
}

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const many = (value: string | string[] | undefined): string[] | undefined =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const query: ProductQuery = {
    q: first(params.q),
    category: first(params.category),
    industry: first(params.industry),
    manufacturer: first(params.manufacturer),
    grade: many(params.grade),
    availability: many(params.availability),
    cas_number: first(params.cas_number),
    package_size: first(params.package_size),
    application: first(params.application),
    ordering: first(params.ordering),
    page: Number(first(params.page) ?? 1) || 1,
    page_size: 12,
  };

  const [page, facets] = await Promise.all([api.products(query), api.facets(query)]);

  return (
    <>
      <PageHero
        eyebrow="Catalog"
        title="Industrial & Laboratory Chemicals"
        description="Over a thousand products across five categories — searchable by name, CAS number, industry, grade and package size. Every product ships with a Certificate of Analysis."
        crumbs={[{ name: "Products", url: "/products" }]}
        image="/images/pages/products.jpg"
      />

      {page.results.length > 0 && (
        <JsonLd
          id="catalog-list"
          data={itemListSchema(
            page.results.map((product) => ({
              name: product.name,
              url: `/products/${product.slug}`,
            })),
            "NOKS chemical product catalog",
          )}
        />
      )}

      <div className="bg-surface-muted py-10 sm:py-12">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogView page={page} facets={facets} />
        </Suspense>
      </div>

      <CtaBand
        title="Can't find what you need?"
        description="We source specialty and hard-to-find chemicals through a verified global manufacturer network. Send us the name, CAS number or specification."
      />
    </>
  );
}

const CatalogSkeleton = () => (
  <div className="container-noks grid gap-10 lg:grid-cols-[248px_1fr]">
    <div className="hidden space-y-4 lg:block">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-32" />
      ))}
    </div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <Skeleton key={index} className="h-80" />
      ))}
    </div>
  </div>
);
