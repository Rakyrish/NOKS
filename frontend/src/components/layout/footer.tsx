import { Clock, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { NewsletterForm } from "@/components/shared/newsletter-form";
import { brand, contact, social } from "@/lib/site";

const COLUMNS = [
  {
    title: "Products",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Industrial Chemicals", href: "/products?category=industrial-chemicals" },
      { label: "Laboratory Reagents", href: "/products?category=laboratory-reagents" },
      { label: "Water Treatment", href: "/products?category=water-treatment-chemicals" },
      { label: "Food Grade", href: "/products?category=food-grade-chemicals" },
      { label: "Specialty Chemicals", href: "/products?category=specialty-chemicals" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About NOKS", href: "/about" },
      { label: "Industries We Serve", href: "/industries" },
      { label: "Our Services", href: "/services" },
      { label: "Knowledge Centre", href: "/knowledge" },
      { label: "Contact Us", href: "/contact" },
      { label: "Request a Quote", href: "/quote" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Technical Datasheets", href: "/products" },
      { label: "Safety Information", href: "/knowledge?category=chemical-safety" },
      { label: "Buying Guides", href: "/knowledge?category=buying-guides" },
      { label: "Delivery & Lead Times", href: "/contact" },
      { label: "Chemical Sourcing", href: "/services" },
    ],
  },
] as const;

const SOCIALS = [
  { href: social.linkedin, Icon: Linkedin, label: "LinkedIn" },
  { href: social.facebook, Icon: Facebook, label: "Facebook" },
  { href: social.twitter, Icon: Twitter, label: "X" },
  { href: social.instagram, Icon: Instagram, label: "Instagram" },
] as const;

export const Footer = () => (
  <footer className="relative overflow-hidden bg-navy-900 text-white">
    <div
      className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full
                 bg-[var(--brand-primary)]/20 blur-[120px]"
      aria-hidden
    />
    <div
      className="pointer-events-none absolute -bottom-48 -left-24 size-[28rem] rounded-full
                 bg-[var(--brand-emerald)]/12 blur-[120px]"
      aria-hidden
    />

    <div className="relative">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container-noks grid gap-8 py-12 lg:grid-cols-2 lg:items-center lg:py-14">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-[1.75rem]">
              Technical insight, straight to your inbox
            </h2>
            <p className="mt-2 max-w-lg text-[15px] text-white/60">
              Product updates, application guides and chemical safety briefings from our
              technical team. No noise — usually once a month.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Main */}
      <div className="container-noks grid gap-12 py-14 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:py-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label={brand.fullName}>
            <span className="rounded-xl bg-white px-3 py-2">
              <Image
                src={brand.logo}
                alt={`${brand.name} logo`}
                width={96}
                height={28}
                className="h-6 w-auto object-contain"
              />
            </span>
          </Link>
          <p className="mt-3 text-[11px] font-bold tracking-[0.16em] text-white/45 uppercase">
            {brand.division}
          </p>
          <p className="mt-5 max-w-sm text-[14.5px] leading-relaxed text-white/60">
            {brand.mission}
          </p>

          <ul className="mt-7 space-y-3.5 text-[14.5px] text-white/70">
            {contact.addressLine && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--brand-emerald-light)]" />
                <span>{contact.addressLine}</span>
              </li>
            )}
            {contact.phone && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-[var(--brand-emerald-light)]" />
                <a href={contact.telHref} className="transition-colors hover:text-white">
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-[var(--brand-emerald-light)]" />
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all transition-colors hover:text-white"
                >
                  {contact.email}
                </a>
              </li>
            )}
            {contact.hours && (
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-[var(--brand-emerald-light)]" />
                <span>{contact.hours}</span>
              </li>
            )}
          </ul>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-[11px] font-bold tracking-[0.14em] text-white/45 uppercase">
              {column.title}
            </h3>
            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14.5px] text-white/65 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="container-noks flex flex-col items-center justify-between gap-5 py-6 sm:flex-row">
          <p className="text-[13px] text-white/45">
            © {new Date().getFullYear()} {brand.fullName}. All rights reserved.
          </p>

          <div className="flex items-center gap-2.5">
            {SOCIALS.filter((item) => item.href).map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid size-9 place-items-center rounded-full border border-white/12
                           text-white/60 transition-all hover:border-white/30
                           hover:bg-white/10 hover:text-white"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-5 text-[13px] text-white/45">
            <Link href="/privacy" className="transition-colors hover:text-white/80">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white/80">
              Terms
            </Link>
            <Link href="/sitemap.xml" className="transition-colors hover:text-white/80">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
