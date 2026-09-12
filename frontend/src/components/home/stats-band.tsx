"use client";

import { Counter, RevealGroup, RevealItem } from "@/components/shared/motion";
import { Icon } from "@/components/shared/icon";
import { isVerified } from "@/lib/business";
import type { CatalogFacts, Stat } from "@/types";

/**
 * Counters the site can prove, straight from the catalogue.
 *
 * The editable counters this band used to render were claims, and one of them
 * was checkably false: "1,200+ product lines" against a catalogue of 182
 * published products. "25,000 deliveries", "98% customer satisfaction",
 * "15 years" and "8 countries" are unverifiable from here. All five are gated
 * behind CLAIMS["operational-stats"]; until the owner supplies the evidence,
 * the band shows counts that are recomputed on every request and cannot drift.
 */
const verifiableStats = (facts: CatalogFacts): Omit<Stat, "id" | "order">[] => [
  { label: "Products in catalogue", value: facts.products, suffix: "", icon: "package" },
  { label: "Chemical categories", value: facts.categories, suffix: "", icon: "layers" },
  { label: "Industries supplied", value: facts.industries, suffix: "", icon: "factory" },
];

export const StatsBand = ({ stats, facts }: { stats: Stat[]; facts: CatalogFacts }) => {
  const items = isVerified("operational-stats") && stats.length ? stats : verifiableStats(facts);

  return (
    <section className="relative border-y border-line bg-surface-muted py-14 sm:py-16">
      <RevealGroup
        className="container-noks grid grid-cols-2 justify-center gap-x-6 gap-y-10 sm:grid-cols-3
                   lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]"
        staggerChildren={0.07}
      >
        {items.map((stat) => (
          <RevealItem key={stat.label} className="text-center">
            <span
              className="mx-auto mb-3 grid size-11 place-items-center rounded-xl border
                         border-line bg-white text-[var(--brand-primary)]
                         shadow-[var(--shadow-soft)]"
            >
              <Icon name={stat.icon} className="size-5" />
            </span>
            <p className="font-display text-[clamp(1.6rem,3.4vw,2.35rem)] leading-none font-extrabold text-navy-900">
              <Counter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-[12.5px] leading-snug font-medium text-slate-500">
              {stat.label}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
};
