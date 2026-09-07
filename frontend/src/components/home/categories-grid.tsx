import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/components/shared/icon";
import { RevealGroup, RevealItem } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";
import type { Category } from "@/types";

export const CategoriesGrid = ({ categories }: { categories: Category[] }) => {
  if (!categories.length) return null;

  return (
    <Section id="categories">
      <div className="container-noks">
        <SectionHeading
          eyebrow="Shop by category"
          title="Every category, fully documented"
          description="Certificates of Analysis, Safety Data Sheets and technical specifications
                       ship with every order — browse the catalog by chemical family."
        />

        <RevealGroup
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          staggerChildren={0.05}
        >
          {categories.map((category) => (
            <RevealItem key={category.id}>
              <Link
                href={`/categories/${category.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl
                           border border-line bg-white p-6 transition-all duration-300
                           hover:-translate-y-1 hover:border-brand-200
                           hover:shadow-[var(--shadow-lift)]"
              >
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
                  <Icon name={category.icon} className="size-5.5" />
                </span>

                <h3 className="relative mt-5 font-display text-[17px] font-bold text-navy-900">
                  {category.name}
                </h3>

                <p className="relative mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-500">
                  {category.description}
                </p>

                <span className="relative mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-[12px] font-semibold text-slate-400">
                    {category.product_count ?? 0} products
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
