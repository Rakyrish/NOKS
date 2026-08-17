import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/catalog/product-card";
import { CtaBand } from "@/components/home/cta-band";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Section, SectionHeading } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { breadcrumbSchema, serviceSchema } from "@/lib/schema";
import { absoluteUrl, brand, contact } from "@/lib/site";
import Link from "next/link";

export const revalidate = 900;

type Params = { params: Promise<{ slug: string }> };

async function loadIndustry(slug: string) {
  try {
    return await api.industry(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const industry = await loadIndustry(slug);
  if (!industry) return { title: "Industry not found" };

  const title =
    industry.seo?.title || `${industry.name} Chemicals in ${contact.country || "Kenya"}`;
  const description =
    industry.seo?.description ||
    `${brand.fullName} supplies certified chemicals for ${industry.name.toLowerCase()} across Kenya and East Africa. ${industry.tagline}`;

  return {
    title,
    description,
    alternates: { canonical: industry.seo?.canonical || `/industries/${industry.slug}` },
    openGraph: { title, description, url: absoluteUrl(`/industries/${industry.slug}`) },
  };
}

export default async function IndustryPage({ params }: Params) {
  const { slug } = await params;
  const industry = await loadIndustry(slug);
  if (!industry) notFound();

  const products = await api.products({ industry: slug, page_size: 12 });

  const crumbs = [
    { name: "Industries", url: "/industries" },
    { name: industry.name, url: `/industries/${industry.slug}` },
  ];

  return (
    <>
      <JsonLd id={`industry-${industry.slug}`} data={serviceSchema(industry)} />
      <JsonLd
        id={`industry-crumbs-${industry.slug}`}
        data={breadcrumbSchema([{ name: "Home", url: "/" }, ...crumbs])}
      />

      <PageHero
        eyebrow="Industry"
        title={`Chemicals for ${industry.name}`}
        description={industry.tagline}
        crumbs={crumbs}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="bg-white text-navy-900 hover:bg-brand-50">
            <Link href={`/products?industry=${industry.slug}`}>
              Browse {industry.product_count ?? 0} products
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
              Every delivery arrives with a batch Certificate of Analysis and Safety Data
              Sheet. Our applications chemists support dosing selection, compatibility
              checks and on-site handling training — before and after you order.
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
        <Section tone="muted" size="sm">
          <div className="container-noks">
            <SectionHeading
              align="left"
              eyebrow="Recommended"
              title={`Products for ${industry.name.toLowerCase()}`}
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.results.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>

            {products.count > products.results.length && (
              <div className="mt-10 text-center">
                <Button asChild variant="outline">
                  <Link href={`/products?industry=${industry.slug}`}>
                    View all {products.count} products
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </Section>
      )}

      <CtaBand
        title={`Supplying ${industry.name.toLowerCase()} in East Africa`}
        description="Tell us your process, volumes and delivery location — we'll quote with specifications and lead times within one business day."
      />
    </>
  );
}
