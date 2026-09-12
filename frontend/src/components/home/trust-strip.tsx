"use client";

import { FileCheck, Layers, ShieldCheck, Truck } from "lucide-react";
import * as React from "react";

import { isVerified } from "@/lib/business";

/**
 * What this strip may say.
 *
 * Three of the four original items asserted things the codebase cannot back:
 * ISO/KEBS certification (four Certification rows with no number, issuer
 * reference or date), "100% Verified COA & MSDS" (zero rows in
 * catalog_productdocument), and same-day dispatch (no cut-off, no policy).
 * Each is now gated on its claim id and replaced, while unverified, with the
 * narrower statement that is actually true — we publish the specification and
 * the documentation we hold, and we quote a real lead time per line.
 */
const TRUST_ITEMS = [
  {
    claim: "certifications",
    icon: ShieldCheck,
    title: "KEBS & Standard Compliant",
    desc: "Rigorous quality compliance aligned with Kenya Bureau of Standards & international ISO criteria.",
    fallback: {
      title: "Specification on every line",
      desc: "CAS number, grade, purity and packaging published for every product in the catalogue — before you ask.",
    },
    gradient: "from-blue-700 to-blue-500",
  },
  {
    claim: "documents-with-every-batch",
    icon: FileCheck,
    title: "100% Verified COA & MSDS",
    desc: "Pre-dispatch batch verification with manufacturer Certificate of Analysis and safety documentation.",
    fallback: {
      title: "Documentation on request",
      desc: "Certificate of Analysis and Safety Data Sheet for a given batch, supplied with your quotation.",
    },
    gradient: "from-teal-600 to-teal-400",
  },
  {
    claim: "same-day-dispatch",
    icon: Truck,
    title: "Same-Day Nairobi Dispatch",
    desc: "Strategically located warehousing on Enterprise Road, Industrial Area for rapid regional transport.",
    fallback: {
      title: "Nairobi Industrial Area",
      desc: "Enterprise Road warehousing, with a written lead time quoted against every line you order.",
    },
    gradient: "from-navy-950 to-navy-700",
  },
  {
    // No claim id: bulk pricing tiers are how the quote process already works.
    claim: null,
    icon: Layers,
    title: "Wholesale & Contract Tiers",
    desc: "Competitive bulk volume pricing for industrial manufacturers, municipal water authorities, and labs.",
    fallback: null,
    gradient: "from-blue-600 to-cyan-500",
  },
] as const;

export const TrustStrip = () => {
  return (
    <section className="trust-strip py-10 bg-white border-b border-rule">
      <div className="container-noks">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 list-none p-0 m-0">
          {TRUST_ITEMS.map((entry) => {
            const Icon = entry.icon;
            const item =
              entry.claim && !isVerified(entry.claim) && entry.fallback
                ? { ...entry, ...entry.fallback }
                : entry;
            return (
              <li
                key={item.title}
                className="flex items-start gap-4 rounded-xl border border-rule bg-white p-5 shadow-card"
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient} text-white shadow-sm`}
                >
                  <Icon className="size-5.5" />
                </div>
                <div>
                  <strong className="block text-sm font-bold text-navy-900 leading-snug">
                    {item.title}
                  </strong>
                  <span className="mt-1 block text-xs leading-relaxed text-steel-700">
                    {item.desc}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
