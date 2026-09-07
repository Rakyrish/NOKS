"use client";

import { Clock, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, ShieldCheck, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { brand, contact, social } from "@/lib/site";

const PRODUCT_CATEGORIES = [
  { label: "Water Treatment Chemicals", href: "/products?category=water-treatment-chemicals" },
  { label: "Food-Grade & Additives", href: "/products?category=food-grade-chemicals" },
  { label: "Cosmetic & Detergent Raw Materials", href: "/products?category=industrial-chemicals" },
  { label: "Construction Chemicals", href: "/products?category=specialty-chemicals" },
  { label: "Paints, Inks & Coatings", href: "/products?category=specialty-chemicals" },
  { label: "Agriculture & Animal Feed", href: "/products?category=industrial-chemicals" },
  { label: "Laboratory Reagents", href: "/products?category=laboratory-reagents" },
  { label: "Specialty Chemicals", href: "/products?category=specialty-chemicals" },
] as const;

const QUICK_LINKS = [
  { label: "Chemical Catalogue", href: "/products" },
  { label: "How We Work", href: "/#how-we-work" },
  { label: "About NOKS", href: "/about" },
  { label: "Buying Guides & Articles", href: "/knowledge" },
  { label: "Industries We Serve", href: "/industries" },
  { label: "Request a Quote", href: "/quote" },
  { label: "Contact Us", href: "/contact" },
] as const;

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner max-w-[var(--max)] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 text-silver-300">
        {/* 4-Column Footer Grid (Karivex Structure with NOKS Blue Branding) */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-white/10">
          {/* Col 1: Brand & Warehouse */}
          <div className="flex flex-col">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-white p-1 shadow-md">
                <Image
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  width={38}
                  height={38}
                  className="size-8 object-contain"
                />
              </span>
              <div className="leading-tight">
                <strong className="font-heading text-xl font-bold tracking-tight text-white">
                  {brand.name} Solutions Ltd
                </strong>
                <span className="block text-[10.5px] font-bold tracking-[0.16em] text-blue-300 uppercase">
                  chemical division
                </span>
              </div>
            </Link>

            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-silver-300">
              {brand.mission || "Authorized distributor of industrial chemicals, laboratory reagents, and specialty ingredients across Kenya and East Africa. Ex-stock Nairobi with certified COA and MSDS."}
            </p>

            <div className="mt-5 space-y-2.5 text-xs text-silver-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 shrink-0 text-blue-400 mt-0.5" />
                <span>Enterprise Road, Industrial Area, Nairobi, Kenya</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 shrink-0 text-teal-400" />
                <span>KEBS & ISO Standard Certified Supply</span>
              </div>
            </div>
          </div>

          {/* Col 2: Chemical Categories */}
          <div>
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-white mb-4">
              Chemical Categories
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-[13px] list-none p-0 m-0">
              {PRODUCT_CATEGORIES.map((cat) => (
                <li key={cat.label}>
                  <Link
                    href={cat.href}
                    className="text-silver-300 transition-colors hover:text-blue-300 hover:underline"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Company & Quick Links */}
          <div>
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-white mb-4">
              Company & Operations
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-[13px] list-none p-0 m-0">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-silver-300 transition-colors hover:text-blue-300 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Direct Contacts & Hours */}
          <div>
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-white mb-4">
              Sales & Depot Contact
            </h3>
            <div className="space-y-3 text-xs sm:text-[13px]">
              {contact.phone && (
                <div>
                  <span className="block text-[11px] text-silver-400 uppercase font-semibold">
                    Sales Hotline
                  </span>
                  <a
                    href={contact.telHref}
                    className="mt-0.5 inline-flex items-center gap-1.5 font-bold text-white hover:text-blue-300"
                  >
                    <Phone className="size-3.5 text-blue-400" />
                    <span>{contact.phone}</span>
                  </a>
                </div>
              )}

              {contact.phoneAlt && (
                <div>
                  <span className="block text-[11px] text-silver-400 uppercase font-semibold">
                    Depot Logistics
                  </span>
                  <a
                    href={`tel:${contact.phoneAlt.replace(/\s+/g, "")}`}
                    className="mt-0.5 inline-block text-silver-300 hover:text-white"
                  >
                    {contact.phoneAlt}
                  </a>
                </div>
              )}

              <div>
                <span className="block text-[11px] text-silver-400 uppercase font-semibold">
                  WhatsApp Direct
                </span>
                <a
                  href={contact.whatsappUrl || "https://wa.me/254700000000"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1.5 font-bold text-[#25D366] hover:underline"
                >
                  <span>Chat with Sales Chemist</span>
                </a>
              </div>

              {contact.email && (
                <div>
                  <span className="block text-[11px] text-silver-400 uppercase font-semibold">
                    Email Inquiries
                  </span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="mt-0.5 inline-flex items-center gap-1.5 text-silver-300 hover:text-white"
                  >
                    <Mail className="size-3.5 text-blue-400" />
                    <span>{contact.email}</span>
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-[11.5px] text-silver-400">
                  <Clock className="size-3.5 text-blue-400" />
                  <span>{contact.hours || "Mo-Fr 08:00-17:30, Sa 08:00-13:00"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-silver-400">
          <p>
            © {new Date().getFullYear()} {brand.name} Solutions Ltd — Chemical Division. All rights reserved.
          </p>
          <p className="flex items-center gap-3">
            <span>Serving Kenya • Uganda • Tanzania • Rwanda</span>
            <span>·</span>
            <Link href="/quote" className="text-blue-400 hover:underline">
              Request a Quote
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};
