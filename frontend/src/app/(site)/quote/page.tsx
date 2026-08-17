import { Clock, FileCheck, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHero } from "@/components/shared/page-hero";
import { QuoteBuilder } from "@/components/shared/quote-builder";
import { Skeleton } from "@/components/ui";
import { brand } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a Quotation — Industrial & Laboratory Chemicals",
  description: `Request a written quotation from ${brand.fullName}. Add multiple products, specify quantities and packaging, and receive pricing with lead times within one business day.`,
  alternates: { canonical: "/quote" },
};

const ASSURANCES = [
  { Icon: Clock, title: "One business day", note: "Written quotation with lead times." },
  { Icon: FileCheck, title: "Full documentation", note: "COA, SDS and TDS included." },
  { Icon: ShieldCheck, title: "No obligation", note: "Quotes are free and non-binding." },
] as const;

export default function QuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Quotation"
        title="Request a quotation"
        description="Add every product you need, tell us quantities and delivery location, and our
                     technical sales team will respond with pricing and lead times."
        crumbs={[{ name: "Request Quote", url: "/quote" }]}
      />

      <div className="bg-surface-muted py-14 sm:py-20">
        <div className="container-noks grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
          <Suspense fallback={<Skeleton className="h-[36rem]" />}>
            <QuoteBuilder />
          </Suspense>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {ASSURANCES.map(({ Icon, title, note }) => (
              <div key={title} className="rounded-2xl border border-line bg-white p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-[var(--brand-primary)]">
                  <Icon className="size-4.5" />
                </span>
                <p className="mt-4 font-display text-[15px] font-bold text-navy-900">{title}</p>
                <p className="mt-1 text-[13.5px] text-slate-500">{note}</p>
              </div>
            ))}

            <div className="rounded-2xl bg-navy-900 p-6 text-white">
              <p className="font-display text-[15px] font-bold">Need something unusual?</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
                If a product isn&apos;t in our catalog, add it as a free-text line. Chemical
                sourcing is one of our core services.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
