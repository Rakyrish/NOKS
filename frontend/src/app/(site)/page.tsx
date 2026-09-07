import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PostCard } from "@/components/blog/post-card";
import { CtaBand } from "@/components/home/cta-band";
import { FaqSection } from "@/components/home/faq-section";
import { Hero } from "@/components/home/hero";
import { HowWeWorkTeaser } from "@/components/home/how-we-work-teaser";
import { IdentityBand } from "@/components/home/identity-band";
import { IndustriesGrid } from "@/components/home/industries-grid";
import { IndustryTabs } from "@/components/home/industry-tabs";
import { Testimonials } from "@/components/home/testimonials";
import { TrustStrip } from "@/components/home/trust-strip";
import { JsonLd } from "@/components/shared/json-ld";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { faqSchema, itemListSchema, localBusinessSchema } from "@/lib/schema";

export const revalidate = 300;

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

      {/* ── 1. Karivex Interactive Carousel Hero ─────────────── */}
      <Hero />

      {/* ── 2. Karivex Identity & Credentials Band ───────────── */}
      <IdentityBand />

      {/* ── 3. Karivex Industry Tabs Product Showcase ─────────── */}
      <IndustryTabs products={data.featured_products} />

      {/* ── 4. Karivex Trust & Quality Strip ─────────────────── */}
      <TrustStrip />

      {/* ── 5. Karivex Multi-Tone Industry Grid ──────────────── */}
      <IndustriesGrid industries={data.industries} />

      {/* ── 6. Karivex "How We Work" Supply Chain Teaser ─────── */}
      <HowWeWorkTeaser />

      {/* ── 7. Client Trust & Testimonials ───────────────────── */}
      <Testimonials testimonials={data.testimonials} clients={data.clients} />

      {/* ── 8. Technical Knowledge & Buying Guides ───────────── */}
      {data.latest_posts.length > 0 && (
        <Section className="bg-silver-100/50 border-b border-rule">
          <div className="container-noks">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Technical Center
                </span>
                <h2 className="mt-1 font-heading text-2xl sm:text-3xl font-bold text-navy-900">
                  Chemical Buying Guides & Application Notes
                </h2>
                <p className="mt-2 text-sm text-steel-700 max-w-2xl">
                  Practical briefings written by our industrial chemists on coagulant selection, food grade compliance, surfactant blending, and safety.
                </p>
              </div>
              <Reveal delay={0.1}>
                <Link
                  href="/knowledge"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  <span>All technical guides</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Reveal>
            </div>

            <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.latest_posts.map((post) => (
                <RevealItem key={post.id} className="h-full">
                  <PostCard post={post} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Section>
      )}

      {/* ── 9. FAQ Section ───────────────────────────────────── */}
      <FaqSection faqs={data.faqs} />

      {/* ── 10. Call to Action Band ──────────────────────────── */}
      <CtaBand />
    </>
  );
}
