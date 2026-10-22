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
import { categoryTitle, notFoundMetadata, pageMetadata } from "@/lib/metadata";
import { itemListSchema } from "@/lib/schema";
import { brand, contact } from "@/lib/site";

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
  if (!category) return notFoundMetadata(`/categories/${slug}`, "Category");

  return pageMetadata({
    title: categoryTitle(category.name, category.seo?.title, contact.country),
    description:
      category.seo?.description ||
      category.description ||
      // The old default asserted "a Certificate of Analysis and Safety Data
      // Sheet on every batch" on all 40 category pages. There are zero
      // documents in the system — see CLAIMS["documents-with-every-batch"].
      `${brand.fullName} supplies ${category.name.toLowerCase()} in Kenya and across East Africa. Specification, grade and packaging published for every product; request a written quotation with availability and delivery details.`,
    path: `/categories/${category.slug}`,
    canonicalOverride: category.seo?.canonical,
    keywords: category.seo?.keywords,
    image: category.image,
    imageAlt: category.name,
    // An empty category is a thin page with nothing to rank for. Rather than
    // serving 15 of them to the index, they stay crawlable (so the crumb trail
    // and any child links still carry) but out of it, until they hold stock.
    noindex: category.seo?.noindex || (category.product_count ?? 0) === 0,
  });
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = await loadCategory(slug);
  if (!category) notFound();

  // Every product in the category, not the first 24. The link report found 33
  // products orphaned — in the sitemap, reachable from no internal link —
  // because the overflow was only reachable through "View all", which pointed
  // at `/products?category=…`: a noindex parameter URL whose pagination is
  // client-side `router.push` with no crawlable <a> for page 2. The largest
  // category holds 38 products, so listing them all costs one extra API page
  // and puts every product two clicks from the homepage.
  const products = await api.products({ category: slug, page_size: 96 });

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
            {/* Anchors to the list below rather than bouncing through the
                noindex `/products?category=…` facet. */}
            <Link href="#category-products">
              Browse {category.product_count ?? products.count} products
            </Link>
          </Button>
          <Button asChild variant="glass">
            <Link href="/quote">Request a quotation</Link>
          </Button>
        </div>
      </PageHero>

      {category.children && category.children.some((child) => (child.product_count ?? 0) > 0) && (
        <Section size="sm">
          <div className="container-noks">
            <SectionHeading align="left" eyebrow="Browse" title={`${category.name} subcategories`} />
            <div className="mt-8 flex flex-wrap gap-3">
              {category.children.filter((child) => (child.product_count ?? 0) > 0).map((child) => (
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
        <Section tone="muted" size="sm" id="category-products">
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
                  {/* The full catalogue index, which is crawlable — not the
                      filtered facet, which is not. */}
                  <Link href="/catalogue">
                    See all {products.count} products in the full catalogue
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </Section>
      )}

      <CtaBand
        title={`Supplying ${category.name.toLowerCase()} in East Africa`}
        description="Tell us your specification, volumes and delivery location — we'll confirm price, availability and delivery details in your quotation."
      />
    </>
  );
}
