import { Check } from "lucide-react";
import type { Metadata } from "next";

import { CtaBand } from "@/components/home/cta-band";
import { StatsBand } from "@/components/home/stats-band";
import { WhyNoks } from "@/components/home/why-noks";
import { JsonLd } from "@/components/shared/json-ld";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { PageHero } from "@/components/shared/page-hero";
import { Section, SectionHeading } from "@/components/shared/section";
import { api } from "@/lib/api";
import { localBusinessSchema } from "@/lib/schema";
import { brand, contact, stats } from "@/lib/site";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "About — Chemical Supplier in Kenya",
  description: `${brand.mission} Learn about our history, certifications, technical team and quality assurance.`,
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [data, team, milestones] = await Promise.all([
    api.homepage(),
    api.team(),
    api.milestones(),
  ]);

  return (
    <>
      <JsonLd id="about-business" data={localBusinessSchema()} />

      <PageHero
        eyebrow={`About ${brand.name}`}
        title={`${stats.years} years of chemistry that shows up on time`}
        description={brand.mission}
        crumbs={[{ name: "About", url: "/about" }]}
        image="/images/pages/about.jpg"
      />

      <StatsBand stats={data.stats} />

      {/* Story */}
      <Section>
        <div className="container-noks grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Our story"
              title="Built in Nairobi, trusted across the region"
              className="max-w-none"
            />
            <div className="mt-6 space-y-4 text-[15.5px] leading-relaxed text-slate-600">
              <p>
                {brand.fullName} began as a single warehouse in Nairobi&apos;s Industrial
                Area, supplying commodity chemicals to manufacturers who were tired of
                unreliable delivery and missing documentation.
              </p>
              <p>
                That original problem still shapes how we operate. Stock availability,
                batch traceability and honest lead times are not features we advertise —
                they are the baseline. Around them we built a laboratory reagents division,
                a dedicated water treatment programme with on-site jar testing, and food
                grade handling certified for the beverage and dairy sectors.
              </p>
              <p>
                Today we serve {contact.country || "Kenya"} and seven neighbouring markets,
                supported by applications chemists who spend as much time in client plants
                as they do in our own laboratory.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-line bg-surface-muted p-8">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                What we hold ourselves to
              </p>
              <ul className="mt-5 space-y-4">
                {[
                  "A Certificate of Analysis with every batch, without being asked",
                  "Honest lead times — we quote what we can actually deliver",
                  "Technical advice before the sale, not just after it",
                  "Segregated storage for food grade and laboratory products",
                  "GHS-compliant labelling and Safety Data Sheets on every hazardous product",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-[14.5px] text-slate-700">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--brand-emerald)] text-white">
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Timeline */}
      {milestones.length > 0 && (
        <Section tone="muted">
          <div className="container-noks">
            <SectionHeading
              eyebrow="Milestones"
              title="How we got here"
              description={`${stats.years} years of steady, deliberate expansion.`}
            />

            <div className="relative mx-auto mt-14 max-w-3xl">
              <div className="absolute top-0 bottom-0 left-[15px] w-px bg-line" aria-hidden />
              <ol className="space-y-8">
                {milestones.map((milestone) => (
                  <li key={milestone.id} className="relative pl-12">
                    <span
                      className="absolute top-1 left-0 grid size-8 place-items-center rounded-full
                                 border-4 border-surface-muted bg-[var(--brand-primary)]
                                 text-[11px] font-bold text-white"
                      aria-hidden
                    />
                    <p className="font-display text-sm font-bold text-[var(--brand-primary)]">
                      {milestone.year}
                    </p>
                    <h3 className="mt-1 font-display text-[17px] font-bold text-navy-900">
                      {milestone.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-slate-600">
                      {milestone.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Section>
      )}

      <WhyNoks items={data.value_props} />

      {/* Team */}
      {team.length > 0 && (
        <Section>
          <div className="container-noks">
            <SectionHeading
              eyebrow="Our team"
              title="The people behind the chemistry"
              description="Chemists, engineers and logistics specialists who know East African industry."
            />

            <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <RevealItem key={member.id} className="h-full">
                  <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 text-center">
                    <span
                      className="mx-auto grid size-16 place-items-center rounded-full bg-brand-50
                                 font-display text-lg font-bold text-[var(--brand-primary)]"
                      aria-hidden
                    >
                      {member.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <h3 className="mt-4 font-display text-[15.5px] font-bold text-navy-900">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-[13px] font-medium text-[var(--brand-primary)]">
                      {member.role}
                    </p>
                    {member.bio && (
                      <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Section>
      )}

      <CtaBand />
    </>
  );
}
