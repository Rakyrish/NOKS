import {
  AlertTriangle,
  Box,
  Check,
  Download,
  FileText,
  MessageCircle,
  Phone,
  ShieldCheck,
  Thermometer,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/catalog/product-card";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductQuoteBox } from "@/components/catalog/product-quote-box";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";
import { AvailabilityBadge, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { productSchema } from "@/lib/schema";
import { brand, contact } from "@/lib/site";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 600;

type Params = { params: Promise<{ slug: string }> };

async function loadProduct(slug: string) {
  try {
    return await api.product(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Product not found" };

  const title = product.seo?.title || `${product.name} — Supplier in ${contact.country || "Kenya"}`;
  const description = product.seo?.description || product.short_description;

  return {
    title,
    description,
    keywords: product.seo?.keywords ? product.seo.keywords.split(",") : undefined,
    alternates: { canonical: product.seo?.canonical || `/products/${product.slug}` },
    robots: product.seo?.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(`/products/${product.slug}`),
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const crumbs = [
    { name: "Products", url: "/products" },
    { name: product.category_name, url: `/categories/${product.category_slug}` },
    { name: product.name, url: `/products/${product.slug}` },
  ];

  const specs = Object.entries(product.specifications ?? {});

  return (
    <>
      <JsonLd id={`product-${product.slug}`} data={productSchema(product)} />
      {/* Breadcrumb JSON-LD comes from PageHero below (crumbs prop) — one
          BreadcrumbList block per page, not two. */}

      <PageHero
        eyebrow={product.category_name}
        title={product.name}
        description={product.short_description}
        crumbs={crumbs}
      >
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge variant="glass" size="md">
            {product.grade_display}
          </Badge>
          <AvailabilityBadge
            availability={product.availability}
            label={product.availability_display}
            className="bg-white/12 text-white"
          />
          {product.cas_number && (
            <Badge variant="glass" size="md">
              CAS {product.cas_number}
            </Badge>
          )}
          {product.chemical_formula && (
            <Badge variant="glass" size="md">
              {product.chemical_formula}
            </Badge>
          )}
          <Badge variant="glass" size="md">
            SKU {product.sku}
          </Badge>
        </div>
      </PageHero>

      <div className="bg-surface-muted py-12 sm:py-16">
        <div className="container-noks grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* ── Main column ─────────────────────────────── */}
          <div className="min-w-0 space-y-8">
            <ProductGallery product={product} />

            {/* Overview */}
            <Panel title="Product overview">
              <div className="prose-noks">
                {product.description.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Panel>

            {/* Specifications */}
            {specs.length > 0 && (
              <Panel title="Technical specifications" icon={FileText}>
                <div className="overflow-x-auto">
                  <table className="w-full text-[14px]">
                    <caption className="sr-only">
                      Technical specifications for {product.name}
                    </caption>
                    <tbody>
                      {specs.map(([key, value], index) => (
                        <tr
                          key={key}
                          className={index % 2 ? "bg-surface-muted/60" : undefined}
                        >
                          <th
                            scope="row"
                            className="w-2/5 px-4 py-3 text-left font-medium text-slate-500"
                          >
                            {key}
                          </th>
                          <td className="px-4 py-3 font-semibold text-navy-900">
                            {String(value)}
                          </td>
                        </tr>
                      ))}
                      {product.purity && (
                        <tr className={specs.length % 2 ? "bg-surface-muted/60" : undefined}>
                          <th scope="row" className="px-4 py-3 text-left font-medium text-slate-500">
                            Purity
                          </th>
                          <td className="px-4 py-3 font-semibold text-navy-900">
                            {product.purity}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {/* Applications */}
            {product.applications?.length > 0 && (
              <Panel title="Applications">
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {product.applications.map((application) => (
                    <li
                      key={application}
                      className="flex gap-2.5 rounded-xl bg-surface-muted px-4 py-3 text-[14px] text-slate-700"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-emerald)]" />
                      {application}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {/* Benefits */}
            {product.benefits?.length > 0 && (
              <Panel title="Key benefits">
                <ul className="space-y-3">
                  {product.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-3 text-[14.5px] text-slate-700">
                      <span
                        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full
                                   bg-brand-50 text-[var(--brand-primary)]"
                        aria-hidden
                      >
                        <Check className="size-3" />
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {/* Packaging */}
            {product.packaging_options?.length > 0 && (
              <Panel title="Packaging & pack sizes" icon={Box}>
                <ul className="flex flex-wrap gap-2">
                  {product.packaging_options.map((option) => (
                    <li
                      key={option}
                      className="rounded-full border border-line bg-white px-4 py-2 text-[13.5px] font-medium text-navy-900"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[13.5px] text-slate-500">
                  Minimum order quantity: {product.min_order_quantity} {product.unit}.
                  Custom packaging and private labelling available on request.
                </p>
              </Panel>
            )}

            {/* Storage & safety */}
            <div className="grid gap-5 sm:grid-cols-2">
              {product.storage_handling && (
                <Panel title="Storage & handling" icon={Thermometer}>
                  <p className="text-[14px] leading-relaxed text-slate-600">
                    {product.storage_handling}
                  </p>
                </Panel>
              )}
              {product.safety_information && (
                <Panel title="Safety information" icon={AlertTriangle} tone="amber">
                  <p className="text-[14px] leading-relaxed text-slate-600">
                    {product.safety_information}
                  </p>
                  {product.hazard_class && (
                    <p className="mt-3 text-[13px] font-medium text-amber-700">
                      Hazard classification: {product.hazard_class}
                    </p>
                  )}
                </Panel>
              )}
            </div>

            {/* Downloads */}
            <Panel title="Downloads & documentation" icon={Download}>
              {product.documents?.length > 0 ? (
                <ul className="space-y-2">
                  {product.documents.map((document) => (
                    <li key={document.id}>
                      <a
                        href={document.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-4 rounded-xl border
                                   border-line px-4 py-3 transition-colors
                                   hover:border-brand-300 hover:bg-brand-50"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <FileText className="size-4 shrink-0 text-[var(--brand-primary)]" />
                          <span className="min-w-0">
                            <span className="block truncate text-[14px] font-semibold text-navy-900">
                              {document.title}
                            </span>
                            <span className="block text-[12px] text-slate-400">
                              {document.doc_type_display}
                            </span>
                          </span>
                        </span>
                        <Download className="size-4 shrink-0 text-slate-400" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-line bg-surface-muted p-5 text-center">
                  <p className="text-[14px] text-slate-600">
                    Technical datasheet, Safety Data Sheet and Certificate of Analysis are
                    issued with every quotation and delivery.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href={`/quote?product=${product.slug}`}>Request documentation</Link>
                  </Button>
                </div>
              )}
            </Panel>

            {/* Frequently bought together */}
            {product.bought_together?.length > 0 && (
              <Panel title="Frequently requested together">
                <div className="grid gap-4 sm:grid-cols-3">
                  {product.bought_together.map((item, index) => (
                    <ProductCard key={item.id} product={item} index={index} />
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* ── Sticky sidebar ──────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            <ProductQuoteBox product={product} />

            <div className="mt-4 rounded-2xl border border-line bg-white p-5">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                Talk to a specialist
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                Unsure which grade or dosage suits your process? Our chemists will advise
                before you order.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {contact.phone && (
                  <Button asChild variant="outline" size="sm">
                    <a href={contact.telHref}>
                      <Phone className="size-3.5" />
                      {contact.phone}
                    </a>
                  </Button>
                )}
                {contact.whatsappUrl && (
                  <Button asChild variant="ghost" size="sm">
                    <a
                      href={`${contact.whatsappUrl}?text=${encodeURIComponent(
                        `Hello ${brand.name}, I'd like information about ${product.name}.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="size-3.5" />
                      WhatsApp us
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-5">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--brand-emerald)]" />
              <p className="text-[13px] leading-relaxed text-emerald-900">
                Every batch is supplied with a Certificate of Analysis and Safety Data
                Sheet, traceable to source.
              </p>
            </div>

            {product.industries?.length > 0 && (
              <div className="mt-4 rounded-2xl border border-line bg-white p-5">
                <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                  Used in
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {product.industries.map((industry) => (
                    <li key={industry.id}>
                      <Link
                        href={`/industries/${industry.slug}`}
                        className="inline-block rounded-full bg-surface-muted px-3 py-1.5 text-[12.5px]
                                   font-medium text-slate-600 transition-colors
                                   hover:bg-brand-50 hover:text-[var(--brand-primary)]"
                      >
                        {industry.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related */}
      {product.related?.length > 0 && (
        <Section size="sm">
          <div className="container-noks">
            <SectionHeading
              align="left"
              eyebrow="Related products"
              title={`More from ${product.category_name}`}
            />
            <Reveal className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {product.related.map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} />
              ))}
            </Reveal>
          </div>
        </Section>
      )}
    </>
  );
}

/* ── Panel ─────────────────────────────────────────────────── */

const Panel = ({
  title,
  icon: IconComponent,
  tone = "default",
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "amber";
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-line bg-white p-6 sm:p-7">
    <h2 className="mb-5 flex items-center gap-2.5 font-display text-[17px] font-bold text-navy-900">
      {IconComponent && (
        <span
          className={`grid size-8 place-items-center rounded-lg ${
            tone === "amber"
              ? "bg-amber-50 text-amber-600"
              : "bg-brand-50 text-[var(--brand-primary)]"
          }`}
        >
          <IconComponent className="size-4" />
        </span>
      )}
      {title}
    </h2>
    {children}
  </section>
);
