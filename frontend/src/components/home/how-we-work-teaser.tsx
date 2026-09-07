"use client";

import { ArrowRight, CheckCircle2, FileCheck2, HelpCircle, Phone, Send } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { brand, contact } from "@/lib/site";

const STEPS = [
  {
    step: "1",
    title: "Submit Inquiry & Technical Requirements",
    desc: "Specify chemical name, CAS number, purity grade (Industrial, Food, Analytical), and required volume or delivery frequency.",
  },
  {
    step: "2",
    title: "Commercial Quote & Technical Datasheet",
    desc: "Our sales chemists provide a competitive quote, batch availability, lead times, and technical datasheets (TDS).",
  },
  {
    step: "3",
    title: "Batch Verification, COA & Safety Data",
    desc: "Every order is inspected and dispatched with manufacturer Certificate of Analysis and complete MSDS for compliance.",
  },
  {
    step: "4",
    title: "Secure Delivery to Your Factory Gate",
    desc: "Prompt dispatch from our Enterprise Road warehouse to facilities across Kenya, Uganda, Tanzania, and Rwanda.",
  },
];

export const HowWeWorkTeaser = () => {
  return (
    <section id="how-we-work" className="py-14 lg:py-20 bg-silver-100/40 border-b border-rule">
      <div className="container-noks">
        {/* Karivex .hww-teaser Box with Dark Navy & Blue Accents */}
        <div className="rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-8 sm:p-12 lg:p-14 text-white shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Ambient Blue Background Glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 size-96 rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            {/* Left: Workflow Steps */}
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-400">
                Supply Chain Execution
              </span>
              <h2 className="mt-2 font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                How We Work: Reliable Chemical Procurement
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-silver-300 max-w-xl">
                We remove uncertainty from raw material supply. Our standardized process guarantees verified product quality, compliant packaging, and predictable delivery for East African industries.
              </p>

              <ul className="mt-8 space-y-4 list-none p-0 m-0">
                {STEPS.map((step) => (
                  <li
                    key={step.step}
                    className="flex items-start gap-4 rounded-xl bg-white/[0.07] border border-white/10 p-4 backdrop-blur-sm transition-all hover:bg-white/[0.12]"
                  >
                    <strong className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white text-sm font-extrabold shadow-sm">
                      {step.step}
                    </strong>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-silver-300">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Quick Action Card */}
            <div className="rounded-xl border border-white/15 bg-white/[0.05] p-6 sm:p-8 backdrop-blur-md">
              <h3 className="font-heading text-xl font-bold text-white">
                Need a Custom Chemical Quotation?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-silver-300 leading-relaxed">
                Whether you need a one-time trial sample, recurring monthly LTL deliveries, or emergency replacement stock in Nairobi, our team responds within 2 business hours.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/quote"
                  className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 py-3.5 px-6 text-sm font-bold text-white shadow-glow-blue transition-transform hover:scale-[1.02]"
                >
                  <span>Open RFQ / Quote Form</span>
                  <ArrowRight className="size-4" />
                </Link>

                <a
                  href={`https://wa.me/${contact.whatsapp || "254700000000"}?text=${encodeURIComponent("Hello NOKS, I'd like to talk to a chemical sales specialist about pricing and availability.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 px-6 text-sm font-bold text-navy-950 transition-transform hover:scale-[1.02]"
                >
                  <span>Chat on WhatsApp</span>
                </a>

                {contact.phone && (
                  <a
                    href={contact.telHref}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/20 py-3 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <Phone className="size-4 text-blue-400" />
                    <span>Call Sales: {contact.phone}</span>
                  </a>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-silver-400">
                <span>Working Hours: {contact.hours || "08:00 - 17:30"}</span>
                <span className="text-blue-300 font-semibold">Ex-Stock Nairobi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
