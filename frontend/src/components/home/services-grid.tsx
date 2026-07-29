import { Check } from "lucide-react";

import { Icon } from "@/components/shared/icon";
import { RevealGroup, RevealItem } from "@/components/shared/motion";
import { Section, SectionHeading } from "@/components/shared/section";
import type { Service } from "@/types";

export const ServicesGrid = ({
  services,
  tone = "white",
}: {
  services: Service[];
  tone?: "white" | "muted";
}) => {
  if (!services.length) return null;

  return (
    <Section tone={tone} id="services">
      <div className="container-noks">
        <SectionHeading
          eyebrow="What we do"
          title="More than a chemical catalog"
          description="Sourcing, technical support, packaging and logistics — the services that turn
                       a product list into a working supply chain."
        />

        <RevealGroup
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          staggerChildren={0.06}
        >
          {services.map((service) => (
            <RevealItem key={service.id} className="h-full">
              <div
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl
                           border border-line bg-white p-6 transition-all duration-300
                           hover:-translate-y-1 hover:border-brand-200
                           hover:shadow-[var(--shadow-lift)]"
              >
                <span
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0
                             bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-emerald)]
                             transition-transform duration-400 group-hover:scale-x-100"
                  aria-hidden
                />

                <span
                  className="grid size-11 place-items-center rounded-xl bg-brand-50
                             text-[var(--brand-primary)] transition-colors duration-300
                             group-hover:bg-[var(--brand-primary)] group-hover:text-white"
                >
                  <Icon name={service.icon} className="size-5" />
                </span>

                <h3 className="mt-5 font-display text-[16.5px] font-bold text-navy-900">
                  {service.name}
                </h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-500">
                  {service.summary}
                </p>

                {service.highlights?.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                    {service.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex gap-2 text-[12.5px] leading-snug text-slate-500"
                      >
                        <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--brand-emerald)]" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
};
