"use client";

import { FileCheck, Layers, ShieldCheck, Truck } from "lucide-react";
import * as React from "react";

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "KEBS & Standard Compliant",
    desc: "Rigorous quality compliance aligned with Kenya Bureau of Standards & international ISO criteria.",
    gradient: "from-blue-700 to-blue-500",
  },
  {
    icon: FileCheck,
    title: "100% Verified COA & MSDS",
    desc: "Pre-dispatch batch verification with manufacturer Certificate of Analysis and safety documentation.",
    gradient: "from-teal-600 to-teal-400",
  },
  {
    icon: Truck,
    title: "Same-Day Nairobi Dispatch",
    desc: "Strategically located warehousing on Enterprise Road, Industrial Area for rapid regional transport.",
    gradient: "from-navy-950 to-navy-700",
  },
  {
    icon: Layers,
    title: "Wholesale & Contract Tiers",
    desc: "Competitive bulk volume pricing for industrial manufacturers, municipal water authorities, and labs.",
    gradient: "from-blue-600 to-cyan-500",
  },
];

export const TrustStrip = () => {
  return (
    <section className="trust-strip py-10 bg-white border-b border-rule">
      <div className="container-noks">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 list-none p-0 m-0">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
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
