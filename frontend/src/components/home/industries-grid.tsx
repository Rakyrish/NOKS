import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/components/shared/icon";
import { RevealGroup, RevealItem } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";
import type { Industry } from "@/types";

export const IndustriesGrid = ({ industries }: { industries: Industry[] }) => {
  if (!industries.length) return null;

  return (
    <Section tone="muted" id="industries">
      <div className="container-noks">
        <SectionHeading
          eyebrow="Industries we serve"
          title="Chemistry engineered for your sector"
          description="Twelve industries, one supplier. Each with its own specification requirements,
                       documentation standards and delivery realities — all of which we handle."
        />

        <RevealGroup
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          staggerChildren={0.05}
        >
          {industries.map((industry) => (
            <RevealItem key={industry.id}>
              <Link
                href={`/industries/${industry.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl
                           border border-line bg-white p-6 transition-all duration-300
                           hover:-translate-y-1 hover:border-brand-200
                           hover:shadow-[var(--shadow-lift)]"
              >
                {/* Hover wash */}
                <span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br
                             from-brand-50/0 to-brand-50 opacity-0 transition-opacity
                             duration-300 group-hover:opacity-100"
                  aria-hidden
                />

                <span
                  className="relative grid size-12 place-items-center rounded-xl bg-brand-50
                             text-[var(--brand-primary)] transition-all duration-300
                             group-hover:bg-[var(--brand-primary)] group-hover:text-white"
                >
                  <Icon name={industry.icon} className="size-5.5" />
                </span>

                <h3 className="relative mt-5 font-display text-[17px] font-bold text-navy-900">
                  {industry.name}
                </h3>

                <p className="relative mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-500">
                  {industry.tagline}
                </p>

                <span className="relative mt-5 flex items-center justify-between border-t border-line pt-4">
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
    </Section>
  );
};
