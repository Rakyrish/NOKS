import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/catalog/product-card";
import { CtaBand } from "@/components/home/cta-band";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Section, SectionHeading } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { itemListSchema } from "@/lib/schema";
import { absoluteUrl, brand, contact } from "@/lib/site";

export const revalidate = 900;

type Params = { params: Promise<{ slug: string }> };

async function loadCategory(slug: string) {
  try {
    return await api.category(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await loadCategory(slug);
  if (!category) return { title: "Category not found" };

  const title = category.seo?.title || `${category.name} Suppliers in ${contact.country || "Kenya"}`;
  const description =
    category.seo?.description ||
    category.description ||
    `${brand.fullName} supplies ${category.name.toLowerCase()} across Kenya and East Africa, with a Certificate of Analysis and Safety Data Sheet on every batch.`;

  return {
    title,
    description,
    alternates: { canonical: category.seo?.canonical || `/categories/${category.slug}` },
    robots: category.seo?.noindex ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: absoluteUrl(`/categories/${category.slug}`) },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = await loadCategory(slug);
  if (!category) notFound();

  const products = await api.products({ category: slug, page_size: 24 });

  const crumbs = [
    { name: "Products", url: "/products" },
    { name: category.name, url: `/categories/${category.slug}` },
  ];

  return (
    <>
      {products.results.length > 0 && (
        <JsonLd
          id={`category-${category.slug}`}
          data={itemListSchema(
            products.results.map((product) => ({ name: product.name, url: `/products/${product.slug}` })),
            `${category.name} products`,
          )}
        />
      )}
      {/* Breadcrumb JSON-LD comes from PageHero below (crumbs prop). */}

      <PageHero
        eyebrow="Category"
        title={category.name}
        description={category.description}
        crumbs={crumbs}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="bg-white text-navy-900 hover:bg-brand-50">
            <Link href={`/products?category=${category.slug}`}>
              Browse {category.product_count ?? products.count} products
            </Link>
          </Button>
          <Button asChild variant="glass">
            <Link href="/quote">Request a quotation</Link>
          </Button>
        </div>
      </PageHero>

      {category.children && category.children.length > 0 && (
        <Section size="sm">
          <div className="container-noks">
            <SectionHeading align="left" eyebrow="Browse" title={`${category.name} subcategories`} />
            <div className="mt-8 flex flex-wrap gap-3">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/categories/${child.slug}`}
                  className="rounded-full border border-line bg-white px-5 py-2.5 text-[14px]
                             font-medium text-navy-900 transition-colors hover:border-brand-300
                             hover:bg-brand-50 hover:text-[var(--brand-primary)]"
                >
                  {child.name}
                  {typeof child.product_count === "number" && (
                    <span className="ml-1.5 text-slate-400">({child.product_count})</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      {products.results.length > 0 && (
        <Section tone="muted" size="sm">
          <div className="container-noks">
            <SectionHeading
              align="left"
              eyebrow="Catalog"
              title={`${category.name} products`}
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.results.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>

            {products.count > products.results.length && (
              <div className="mt-10 text-center">
                <Button asChild variant="outline">
                  <Link href={`/products?category=${category.slug}`}>
                    View all {products.count} products
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </Section>
      )}

      <CtaBand
        title={`Supplying ${category.name.toLowerCase()} in East Africa`}
        description="Tell us your specification, volumes and delivery location — we'll quote with lead times within one business day."
      />
    </>
  );
}
