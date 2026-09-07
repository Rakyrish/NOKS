import { ArrowRight, BadgeCheck, FileText, Microscope, ScrollText, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";

const DOCUMENTS = [
  {
    icon: ScrollText,
    title: "Certificate of Analysis",
    desc: "Manufacturer COA for the exact batch shipped — assay, appearance, and test method.",
  },
  {
    icon: FileText,
    title: "Safety Data Sheet",
    desc: "Full 16-section SDS in English, plus hazard class and UN number for transport.",
  },
  {
    icon: Microscope,
    title: "Batch traceability",
    desc: "Lot number on every drum and bag, traced back to the manufacturing run.",
  },
  {
    icon: BadgeCheck,
    title: "Compliance paperwork",
    desc: "HS codes, import documentation, and KEBS conformity references on request.",
  },
];

export const QualityBand = () => (
  <section className="relative overflow-hidden border-y border-navy-800 bg-navy-950 py-16 text-white lg:py-24">
    <div className="bg-grid-light absolute inset-0 opacity-40" aria-hidden />
    <div
      className="pointer-events-none absolute -top-40 -left-32 size-[34rem] rounded-full bg-blue-600/15 blur-[130px]"
      aria-hidden
    />

    <div className="container-noks relative">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* ── Image side ───────────────────────────────────────── */}
        <Reveal className="order-last lg:order-first">
          <div className="relative">
            <div className="media-tile aspect-[4/3] border border-white/10 shadow-2xl">
              <Image
                src="/images/sections/qc-powder.jpg"
                alt="Quality control chemist weighing a powder sample before batch release"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-tr from-navy-950/70 via-navy-950/10 to-transparent"
                aria-hidden
              />
            </div>

            {/* Overlapping secondary image */}
            <div className="media-tile absolute -right-3 -bottom-8 hidden aspect-square w-44 border-4 border-navy-950 shadow-2xl sm:block lg:-right-8 lg:w-52">
              <Image
                src="/images/sections/scientists.jpg"
                alt="Laboratory technicians reviewing analytical results"
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>

            {/* Floating assurance chip. Overlaps the image vertically only —
                a negative left offset gets clipped by the section's overflow. */}
            <div
              className="absolute -top-5 left-5 flex items-center gap-2.5 rounded-xl border border-white/15
                         bg-navy-900/90 px-4 py-3 shadow-xl backdrop-blur-md"
            >
              <ShieldCheck className="size-6 shrink-0 text-teal-400" />
              <div>
                <p className="font-display text-lg leading-none font-extrabold text-white">100%</p>
                <p className="mt-1 text-[11px] font-semibold tracking-wide text-silver-300 uppercase">
                  Batches documented
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Copy side ────────────────────────────────────────── */}
        <div>
          <Reveal>
            <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.16em] text-blue-300 uppercase">
              <span className="h-px w-7 bg-blue-300/50" aria-hidden />
              Quality & compliance
            </div>

            <h2 className="mt-4 font-display text-[clamp(1.85rem,3.4vw,2.9rem)] leading-[1.1] font-bold text-white">
              Every drum arrives with the paperwork your auditor asks for
            </h2>

            <p className="mt-5 text-[15.5px] leading-relaxed text-silver-300">
              Food-grade, potable-water and pharmaceutical-adjacent applications live or die on
              documentation. We ship the certificates with the goods — not three emails later.
            </p>
          </Reveal>

          <RevealGroup className="mt-9 grid gap-x-6 gap-y-7 sm:grid-cols-2">
            {DOCUMENTS.map(({ icon: Icon, title, desc }) => (
              <RevealItem key={title}>
                <div className="flex size-9 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-600/15">
                  <Icon className="size-[18px] text-blue-300" />
                </div>
                <h3 className="mt-3 font-heading text-[15px] font-bold text-white">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-silver-400">{desc}</p>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.1}>
            <Link
              href="/services"
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5
                         px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm
                         transition-all hover:border-white/50 hover:bg-white/15"
            >
              <span>How we assure quality</span>
              <ArrowRight className="size-4 text-blue-300" />
            </Link>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
);
