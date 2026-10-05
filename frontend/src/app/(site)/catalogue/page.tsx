import type { Metadata } from "next";
import Link from "next/link";

import { CtaBand } from "@/components/home/cta-band";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { api } from "@/lib/api";
import { pageMetadata } from "@/lib/metadata";
import { itemListSchema } from "@/lib/schema";
import type { Product } from "@/types";

export const revalidate = 900;

/**
 * The HTML catalogue index — one plain, crawlable page listing every published
 * product, grouped by category.
 *
 * §13 of the SEO brief allows an HTML sitemap "if it genuinely helps catalogue
 * discovery". Here it does, and the link report says why: 33 products were
 * orphaned and 86 sat more than three clicks from the homepage. The catalogue
 * browse UI is a client component that drives filtering and pagination through
 * `router.push`, so beyond the first page there is no `<a href>` for a crawler
 * to follow, and the "View all" escape hatch pointed at a `noindex` facet URL.
 *
 * This page is the crawlable counterpart: no filters, no pagination, no
 * JavaScript needed. It puts every product two clicks from the homepage and
 * gives each one a real inbound link.
 */
export const metadata: Metadata = pageMetadata({
  title: "Chemical Products A–Z — Full Catalogue Kenya",
  description:
    "Every chemical NOKS supplies, listed by category with CAS number and grade — the complete index of the catalogue in one page.",
  path: "/catalogue",
});

type Grouped = { name: string; slug: string; products: Product[] };

async function loadCatalogue(): Promise<Grouped[]> {
  const products: Product[] = [];
  // The API caps page_size, so walk the pages. Bounded so a backend fault
  // cannot spin here.
  for (let page = 1; page <= 20; page += 1) {
    const response = await api.products({ page, page_size: 96 });
    products.push(...response.results);
    if (!response.has_next) break;
  }

  const groups = new Map<string, Grouped>();
  for (const product of products) {
    const slug = product.category_slug ?? "uncategorised";
    if (!groups.has(slug)) {
      groups.set(slug, { name: product.category_name ?? "Other", slug, products: [] });
    }
    groups.get(slug)!.products.push(product);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      products: [...group.products].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function CataloguePage() {
  const groups = await loadCatalogue();
  const total = groups.reduce((sum, group) => sum + group.products.length, 0);

  return (
    <>
      {total > 0 && (
        <JsonLd
          id="catalogue-index"
          data={itemListSchema(
            groups.flatMap((group) =>
              group.products.map((product) => ({
                name: product.name,
                url: `/products/${product.slug}`,
              })),
            ),
            "NOKS full chemical catalogue",
          )}
        />
      )}

      <PageHero
        eyebrow="Full catalogue"
        title="Every chemical we supply"
        description={`All ${total} published products, grouped by category, with CAS number and grade. One page, no filters — the fastest way to find a specific chemical or to see the whole range.`}
        crumbs={[
          { name: "Products", url: "/products" },
          { name: "Full catalogue", url: "/catalogue" },
        ]}
      />

      <Section size="sm">
        <div className="container-noks">
          <nav aria-label="Jump to category" className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <a
                key={group.slug}
                href={`#${group.slug}`}
                className="rounded-full border border-line bg-white px-4 py-2 text-[13px]
                           font-medium text-navy-900 transition-colors hover:border-brand-300
                           hover:bg-brand-50 hover:text-[var(--brand-primary)]"
              >
                {group.name}
                <span className="ml-1.5 text-slate-400">{group.products.length}</span>
              </a>
            ))}
          </nav>

          <div className="mt-12 space-y-12">
            {groups.map((group) => (
              <section key={group.slug} id={group.slug} className="scroll-mt-28">
                <h2 className="font-display text-[19px] font-bold text-navy-900">
                  <Link
                    href={`/categories/${group.slug}`}
                    className="transition-colors hover:text-[var(--brand-primary)]"
                  >
                    {group.name}
                  </Link>
                  <span className="ml-2 text-[14px] font-medium text-slate-400">
                    {group.products.length} products
                  </span>
                </h2>

                <ul className="mt-4 grid gap-x-8 gap-y-2 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.products.map((product) => (
                    <li key={product.id} className="text-[14px] leading-relaxed">
                      <Link
                        href={`/products/${product.slug}`}
                        className="text-navy-900 underline-offset-2 hover:text-[var(--brand-primary)]
                                   hover:underline"
                      >
                        {product.name}
                      </Link>
                      {product.cas_number && (
                        <span className="ml-1.5 text-[12.5px] text-slate-400">
                          CAS {product.cas_number}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand
        title="Can't find it here?"
        description="We source specialty and hard-to-find chemicals. Send the name, CAS number or specification and we'll come back with availability and a price."
      />
    </>
  );
}
