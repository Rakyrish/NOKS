"use client";

import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Reveal } from "@/components/shared/motion";
import { contact } from "@/lib/site";

export const CtaBand = ({
  title = "Ready to Streamline Your Chemical Supply?",
  description = "Send us your product list, CAS number, required purity, and delivery schedule. You'll receive a competitive formal commercial quotation backed by certified manufacturer COA.",
}: {
  title?: string;
  description?: string;
}) => (
  <section className="relative overflow-hidden py-20 sm:py-24 bg-navy-950 border-t-2 border-blue-600">
    <div
      className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-850"
      aria-hidden
    />
    <div
      className="pointer-events-none absolute -top-32 right-1/4 size-[28rem] rounded-full
                 bg-blue-600/15 blur-[120px]"
      aria-hidden
    />

    <Reveal className="relative container-noks text-center">
      <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
        Direct B2B Procurement
      </span>
      <h2 className="mx-auto mt-2 max-w-3xl font-heading text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl leading-tight">
        {title}
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-silver-300 sm:text-base">
        {description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
        <Link
          href="/quote"
          className="nav-cta !px-7 !py-3.5 !text-sm !font-bold"
        >
          <span>Request Quotation</span>
          <ArrowRight className="size-4 ml-1.5" />
        </Link>

        {contact.phone && (
          <a
            href={contact.telHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <Phone className="size-4 text-blue-400" />
            <span>Call Sales: {contact.phone}</span>
          </a>
        )}

        <a
          href={contact.whatsappUrl || "https://wa.me/254700000000"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-navy-950 transition-transform hover:scale-[1.02]"
        >
          <MessageCircle className="size-4" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-silver-400 border-t border-white/10 pt-6 max-w-xl mx-auto">
        <span>Nairobi Warehouse • Enterprise Road</span>
        <span>•</span>
        <span>Same-Day Dispatch</span>
        <span>•</span>
        <span>COA & MSDS Included</span>
      </div>
    </Reveal>
  </section>
);
