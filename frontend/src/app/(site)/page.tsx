import { CtaBand } from "@/components/home/cta-band";
import { FaqSection } from "@/components/home/faq-section";
import { Hero } from "@/components/home/hero";
import { IndustriesGrid } from "@/components/home/industries-grid";
import { IndustryTabs } from "@/components/home/industry-tabs";
import { SupplyMosaic } from "@/components/home/supply-mosaic";
import { TrustStrip } from "@/components/home/trust-strip";
import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/shared/section";
import { SupplyCoverage } from "@/components/shared/supply-coverage";
import { api } from "@/lib/api";
import { faqSchema, itemListSchema, localBusinessSchema } from "@/lib/schema";

export const revalidate = 300;

/**
 * The homepage answers four questions in order: what do you sell, why should
 * I believe you, show me the products, how do I buy.
 *
 * Company depth — the quality regime, the order process, testimonials and the
 * full delivery footprint — lives on /about. It used to sit here too, which
 * meant the page made the same documentation claim three separate times
 * (trust strip, mosaic stats, quality band) before a buyer reached the
 * catalogue.
 */
export default async function HomePage() {
  const data = await api.homepage();

  return (
    <>
      <JsonLd id="local-business" data={localBusinessSchema()} />
      {data.faqs.length > 0 && <JsonLd id="home-faq" data={faqSchema(data.faqs)} />}
      {data.featured_products.length > 0 && (
        <JsonLd
          id="featured-products"
          data={itemListSchema(
            data.featured_products.map((product) => ({
              name: product.name,
              url: `/products/${product.slug}`,
            })),
            "Featured chemical products",
          )}
        />
      )}

      {/* ── 1. What we supply ─────────────────────────────────── */}
      <Hero />

      {/* ── 2. Credibility, straight under the fold ───────────── */}
      <TrustStrip />

      {/* ── 3. What we actually do ────────────────────────────── */}
      <SupplyMosaic />

      {/* ── 4. The catalogue, filterable by sector ────────────── */}
      <IndustryTabs products={data.featured_products} />

      {/* ── 5. Sectors — also the internal links to /industries ── */}
      <IndustriesGrid industries={data.industries} />

      {/* ── 6. Where we deliver. Compact here; the full county
             breakdown is on /about. ───────────────────────────── */}
      <Section size="sm" className="border-b border-rule bg-white">
        <div className="container-noks">
          <SupplyCoverage compact />
        </div>
      </Section>

      {/* ── 7. Objections ─────────────────────────────────────── */}
      <FaqSection faqs={data.faqs} />

      {/* ── 8. Act ────────────────────────────────────────────── */}
      <CtaBand />
    </>
  );
}
