import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/shared/motion";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/site";
import type { Certification } from "@/types";

const PILLARS = [
  "Batch-traceable Certificate of Analysis on every delivery",
  "Applications chemists on call for dosing and compatibility",
  "Segregated food grade and laboratory storage",
  "Bulk logistics with ADR-compliant hazardous handling",
];

export const AboutSplit = ({ certifications }: { certifications: Certification[] }) => (
  <Section id="about">
    <div className="container-noks grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
      {/* Visual */}
      <Reveal className="relative order-2 lg:order-1">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-navy-900 p-8 sm:p-10">
          <div className="bg-grid-light absolute inset-0 opacity-60" aria-hidden />
          <div
            className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full
                       bg-[var(--brand-primary)]/30 blur-[90px]"
            aria-hidden
          />

          <div className="relative">
            <p className="text-[11px] font-bold tracking-[0.16em] text-white/45 uppercase">
              Quality assurance
            </p>
            <p className="mt-4 font-display text-[2rem] leading-tight font-bold text-white sm:text-[2.4rem]">
              Every batch documented.
              <br />
              <span className="text-[var(--brand-emerald-light)]">Every delivery traceable.</span>
            </p>

            <ul className="mt-8 space-y-3.5">
              {PILLARS.map((item) => (
                <li key={item} className="flex gap-3 text-[14.5px] text-white/72">
                  <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-[var(--brand-emerald-light)]" />
                  {item}
                </li>
              ))}
            </ul>

            {certifications.length > 0 && (
              <div className="mt-9 flex flex-wrap gap-2 border-t border-white/10 pt-7">
                {certifications.map((certification) => (
                  <span
                    key={certification.id}
                    className="rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5
                               text-[12px] font-medium text-white/75"
                  >
                    {certification.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* Copy */}
      <div className="order-1 lg:order-2">
        <Reveal>
          <div className="mb-4 flex items-center gap-2.5 text-[11px] font-bold tracking-[0.16em] text-[var(--brand-primary)] uppercase">
            <span className="h-px w-7 bg-[var(--brand-primary)]/40" aria-hidden />
            About {brand.name}
          </div>

          <h2 className="font-display text-[clamp(1.85rem,4vw,2.9rem)] leading-[1.12] font-bold text-navy-900">
            A chemical partner built on
            <span className="text-gradient-brand"> technical depth</span>, not just stock.
          </h2>

          <p className="mt-6 text-[15.5px] leading-relaxed text-slate-600 sm:text-[16.5px]">
            {brand.mission}
          </p>

          <p className="mt-4 text-[15.5px] leading-relaxed text-slate-600">
            From municipal water treatment plants to food processors, mines, laboratories
            and paint manufacturers, we supply the chemistry — and the application
            engineering that makes it work in your process. Our team runs jar tests on site,
            optimises dosing, and keeps documentation audit-ready.
          </p>
        </Reveal>

        <Reveal delay={0.12} className="mt-9 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/about">
              Our story
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/services">Explore services</Link>
          </Button>
        </Reveal>
      </div>
    </div>
  </Section>
);
