import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PostCard } from "@/components/blog/post-card";
import { AboutSplit } from "@/components/home/about-split";
import { CtaBand } from "@/components/home/cta-band";
import { FaqSection } from "@/components/home/faq-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { IndustriesGrid } from "@/components/home/industries-grid";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { ServicesGrid } from "@/components/home/services-grid";
import { StatsBand } from "@/components/home/stats-band";
import { Testimonials } from "@/components/home/testimonials";
import { WhyNoks } from "@/components/home/why-noks";
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

      <Hero />
      <StatsBand stats={data.stats} />
      <AboutSplit certifications={data.certifications} />
      <IndustriesGrid industries={data.industries} />
      <FeaturedProducts products={data.featured_products} />
      <WhyNoks items={data.value_props} />
      <ServicesGrid services={data.services} tone="muted" />
      <ProcessTimeline steps={data.process} />
      <Testimonials testimonials={data.testimonials} clients={data.clients} />

      {data.latest_posts.length > 0 && (
        <Section>
          <div className="container-noks">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                align="left"
                eyebrow="Knowledge centre"
                title="Technical guidance from our chemists"
                description="Practical articles on coagulant selection, food grade compliance,
                             chemical safety and procurement."
                className="max-w-2xl"
              />
              <Reveal delay={0.1}>
                <Button asChild variant="outline">
                  <Link href="/knowledge">
                    All articles
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Reveal>
            </div>

            <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.latest_posts.map((post) => (
                <RevealItem key={post.id} className="h-full">
                  <PostCard post={post} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Section>
      )}

      <FaqSection faqs={data.faqs} />
      <CtaBand />
    </>
  );
}
