import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CtaBand } from "@/components/home/cta-band";
import { Icon } from "@/components/shared/icon";
import { JsonLd } from "@/components/shared/json-ld";
import { RevealGroup, RevealItem } from "@/components/shared/motion";
import { PageHero } from "@/components/shared/page-hero";
import { api } from "@/lib/api";
import { itemListSchema } from "@/lib/schema";
import { brand } from "@/lib/site";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Industries We Serve — Chemical Supply Across East Africa",
  description: `${brand.fullName} supplies water treatment, food processing, agriculture, mining, construction, paint, manufacturing, textile, laboratory, oil & gas, hospitality and healthcare sectors across Kenya and East Africa.`,
  alternates: { canonical: "/industries" },
};

export default async function IndustriesPage() {
  const industries = await api.industries();

  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Chemistry for twelve industries"
        description="Each sector brings its own specifications, documentation standards and delivery
                     realities. We supply — and support — all of them."
        crumbs={[{ name: "Industries", url: "/industries" }]}
        image="/images/pages/industries.jpg"
      />

      {industries.length > 0 && (
        <JsonLd
          id="industries-list"
          data={itemListSchema(
            industries.map((industry) => ({
              name: industry.name,
              url: `/industries/${industry.slug}`,
            })),
            "Industries served",
          )}
        />
      )}

      <div className="bg-surface-muted py-14 sm:py-20">
        <div className="container-noks">
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry) => (
              <RevealItem key={industry.id} className="h-full">
                <Link
                  href={`/industries/${industry.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-white p-7
                             transition-all duration-300 hover:-translate-y-1
                             hover:border-brand-200 hover:shadow-[var(--shadow-lift)]"
                >
                  <span
                    className="grid size-12 place-items-center rounded-xl bg-brand-50
                               text-[var(--brand-primary)] transition-colors duration-300
                               group-hover:bg-[var(--brand-primary)] group-hover:text-white"
                  >
                    <Icon name={industry.icon} className="size-5.5" />
                  </span>

                  <h2 className="mt-5 font-display text-[18px] font-bold text-navy-900">
                    {industry.name}
                  </h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
                    {industry.tagline}
                  </p>

                  {industry.applications?.length > 0 && (
                    <ul className="mt-4 flex flex-1 flex-wrap content-start gap-1.5">
                      {industry.applications.slice(0, 4).map((application) => (
                        <li
                          key={application}
                          className="rounded-full bg-surface-muted px-2.5 py-1 text-[11.5px] text-slate-500"
                        >
                          {application}
                        </li>
                      ))}
                    </ul>
                  )}

                  <span className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="text-[12px] font-semibold text-slate-400">
                      {industry.product_count ?? 0} products
                    </span>
                    <ArrowUpRight
                      className="size-4 text-slate-300 transition-all duration-300
                                 group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                                 group-hover:text-[var(--brand-primary)]"
                    />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>

      <CtaBand />
    </>
  );
}
