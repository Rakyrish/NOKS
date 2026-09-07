"use client";

import { Box, FileText, Globe2, ShieldCheck } from "lucide-react";
import * as React from "react";

import { brand } from "@/lib/site";

const CAPABILITIES = [
  {
    icon: Box,
    title: "Bulk & Packaged Supply",
    desc: "From 25 kg bags and 200 L drums to 1,000 L IBCs and full bulk tanker deliveries, we supply to manufacturing specifications.",
    tag: "Flexible Packaging",
    tone: "border-t-[#0c48e6]",
  },
  {
    icon: FileText,
    title: "COA & MSDS with Every Order",
    desc: "Every chemical shipment is accompanied by manufacturer Certificate of Analysis and complete Safety Data Sheets for strict compliance.",
    tag: "Quality Verified",
    tone: "border-t-teal-500",
  },
  {
    icon: Globe2,
    title: "East Africa Distribution",
    desc: "Seamless regional logistics supplying manufacturing facilities, water boards, and labs throughout Kenya, Uganda, Tanzania, and Rwanda.",
    tag: "Regional Logistics",
    tone: "border-t-navy-700",
  },
  {
    icon: ShieldCheck,
    title: "Technical Formulation Support",
    desc: "Qualified industrial chemists available for application advice, dosage optimization, compatibility testing, and regulatory documentation.",
    tag: "Expert Advisory",
    tone: "border-t-[#2f5efa]",
  },
];

export const IdentityBand = () => {
  return (
    <section className="py-12 lg:py-16 bg-white border-b border-rule">
      <div className="container-noks">
        {/* Lede / Headline */}
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            About {brand.name} Chemical Division
          </span>
          <h2 className="mt-2 font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-900 leading-tight">
            Trusted Chemical Supplier & Industrial Distributor in Kenya
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-steel-700">
            <strong className="text-navy-950 font-semibold">{brand.fullName}</strong> is an authorized distributor of industrial chemicals, laboratory reagents, water treatment solutions, and food-grade raw materials. Headquartered on Enterprise Road, Nairobi Industrial Area, we combine international sourcing with deep local inventory to guarantee supply continuity for East African manufacturers.
          </p>
        </div>

        {/* 4-Column Capability Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className={`product-card ${cap.tone} p-6 flex flex-col justify-between transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-silver-100 text-navy-900 border border-rule">
                      <Icon className="size-5 text-[#0c48e6]" />
                    </span>
                    <span className="text-[11px] font-bold text-steel-700 bg-silver-200/60 px-2 py-0.5 rounded">
                      {cap.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-navy-900">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel-700">
                    {cap.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
