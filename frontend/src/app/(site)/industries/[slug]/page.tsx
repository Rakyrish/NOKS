import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isVerified } from "@/lib/business";
import { ProductCard } from "@/components/catalog/product-card";
import { CtaBand } from "@/components/home/cta-band";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Section, SectionHeading } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { industryTitle, notFoundMetadata, pageMetadata } from "@/lib/metadata";
import { pageHref, parsePage } from "@/lib/pagination";
import { serviceSchema } from "@/lib/schema";
import { brand, contact } from "@/lib/site";
import Link from "next/link";

export const revalidate = 900;

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function loadIndustry(slug: string) {
  try {
    return await api.industry(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { slug } = await params;
  const industry = await loadIndustry(slug);
  if (!industry) return notFoundMetadata(`/industries/${slug}`, "Industry");
  const query = await searchParams;
  const page = parsePage(query.page) ?? 1;

  return pageMetadata({
    title: page > 1 ? `${industryTitle(industry.name, contact.country)} — Page ${page}` : industryTitle(industry.name, contact.country),
    description:
      industry.seo?.description ||
      `${brand.fullName} supplies chemicals for ${industry.name.toLowerCase()} in Kenya and across East Africa. ${industry.tagline}`,
    path: `/industries/${industry.slug}`,
    canonicalOverride: page === 1 ? industry.seo?.canonical : undefined,
    searchParams: query,
    keywords: industry.seo?.keywords,
    image: industry.image,
    imageAlt: industry.name,
    noindex: industry.seo?.noindex || (industry.product_count ?? 0) === 0,
  });
}

export default async function IndustryPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const industry = await loadIndustry(slug);
  if (!industry) notFound();

  const query = await searchParams;
  const page = parsePage(query.page);
  if (page === null) notFound();
  const products = await api.products({ industry: slug, page, page_size: 12 }).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const path = `/industries/${industry.slug}`;

  const crumbs = [
    { name: "Industries", url: "/industries" },
    { name: industry.name, url: `/industries/${industry.slug}` },
    ...(page > 1 ? [{ name: `Page ${page}`, url: pageHref(path, page) }] : []),
  ];

  return (
    <>
      <JsonLd id={`industry-${industry.slug}`} data={serviceSchema(industry)} />
      {/* Breadcrumb JSON-LD comes from PageHero below (crumbs prop) — one
          BreadcrumbList block per page, not two. */}

      <PageHero
        eyebrow="Industry"
        title={`Chemicals for ${industry.name}${page > 1 ? ` — Page ${page}` : ""}`}
        description={industry.tagline}
        crumbs={crumbs}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="bg-white text-navy-900 hover:bg-brand-50">
            <Link href="#industry-products">
              Browse {products.count} products
            </Link>
          </Button>
          <Button asChild variant="glass">
            <Link href="/quote">Request a quotation</Link>
          </Button>
        </div>
      </PageHero>

      {/* Overview + applications */}
      <Section size="sm">
        <div className="container-noks grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy-900">
              Supporting {industry.name.toLowerCase()} across East Africa
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-slate-600">
              {industry.description}
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-slate-600">
              {isVerified("documents-with-every-batch")
                ? "Every delivery arrives with a batch Certificate of Analysis and Safety Data Sheet. "
                : "Request the relevant Certificate of Analysis and Safety Data Sheet when enquiring; document availability must be confirmed for the quoted product. "}
              Confirm the grade, concentration and required approvals for your intended
              application before purchasing. A catalogue association alone does not establish specialised suitability.
            </p>
          </div>

          {industry.applications?.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface-muted p-7">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                Typical applications
              </p>
              <ul className="mt-4 space-y-3">
                {industry.applications.map((application) => (
                  <li key={application} className="flex gap-3 text-[14.5px] text-slate-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-emerald)]" />
                    {application}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* Products */}
      {products.results.length > 0 && (
        <Section tone="muted" size="sm" id="industry-products">
          <div className="container-noks">
            <SectionHeading
              align="left"
              eyebrow="Catalogue"
              title={`Products listed under ${industry.name.toLowerCase()}`}
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.results.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>

            {products.num_pages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2">
                {Array.from({ length: products.num_pages }, (_, index) => index + 1).map((number) => (
                  <Link key={number} href={pageHref(path, number)} aria-current={number === page ? "page" : undefined}
                    className="grid size-10 place-items-center rounded-full border border-line bg-white text-sm font-semibold text-navy-900 hover:bg-brand-50">
                    {number}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </Section>
      )}

      <CtaBand
        title={`Supplying ${industry.name.toLowerCase()} in East Africa`}
        description="Tell us your intended use, grade, quantity and delivery location. Request a quotation with packaging, documentation and availability confirmed."
      />
    </>
  );
}
