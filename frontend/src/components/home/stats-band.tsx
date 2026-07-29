"use client";

import { Counter, RevealGroup, RevealItem } from "@/components/shared/motion";
import { Icon } from "@/components/shared/icon";
import { stats as envStats } from "@/lib/site";
import type { Stat } from "@/types";

/** Falls back to the .env figures when the CMS has no stats yet. */
const FALLBACK: Omit<Stat, "id" | "order">[] = [
  { label: "Years Experience", value: envStats.years, suffix: "+", icon: "calendar" },
  { label: "Products", value: envStats.products, suffix: "+", icon: "package" },
  { label: "Countries Served", value: envStats.countries, suffix: "", icon: "globe" },
  { label: "Industries", value: envStats.industries, suffix: "", icon: "factory" },
  { label: "Deliveries Completed", value: envStats.deliveries, suffix: "+", icon: "truck" },
  { label: "Customer Satisfaction", value: envStats.satisfaction, suffix: "%", icon: "smile" },
];

export const StatsBand = ({ stats }: { stats: Stat[] }) => {
  const items = stats.length ? stats : FALLBACK;

  return (
    <section className="relative border-y border-line bg-surface-muted py-14 sm:py-16">
      <RevealGroup
        className="container-noks grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6"
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
