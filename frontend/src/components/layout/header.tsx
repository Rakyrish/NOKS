"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Mail, Menu, Phone, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { brand, contact } from "@/lib/site";
import { cn } from "@/lib/utils";

import { SearchOverlay } from "./search-overlay";

const NAV = [
  { label: "Products", href: "/products" },
  { label: "How we work", href: "/#how-we-work" },
  { label: "About", href: "/about" },
  { label: "Guides", href: "/knowledge" },
  { label: "Contact", href: "/contact" },
] as const;

const INDUSTRIES = [
  { name: "Water Treatment", href: "/products?category=water-treatment-chemicals", count: "32 products" },
  { name: "Food-Grade & Additives", href: "/products?category=food-grade-chemicals", count: "28 products" },
  { name: "Cosmetics & Detergents", href: "/products?category=industrial-chemicals", count: "45 products" },
  { name: "Agriculture & Feed", href: "/products?category=industrial-chemicals", count: "24 products" },
  { name: "Construction Chemicals", href: "/products?category=specialty-chemicals", count: "19 products" },
  { name: "Paints, Inks & Coatings", href: "/products?category=specialty-chemicals", count: "26 products" },
  { name: "Laboratory Reagents", href: "/products?category=laboratory-reagents", count: "60+ items" },
  { name: "Mining & Flotation", href: "/products?category=industrial-chemicals", count: "14 products" },
  { name: "Oil, Gas & Lubricants", href: "/products?category=industrial-chemicals", count: "18 products" },
  { name: "Textile & Leather", href: "/products?category=specialty-chemicals", count: "15 products" },
] as const;

const CATEGORY_CHIPS = [
  { label: "All products", href: "/products" },
  { label: "Water Treatment Chemicals", href: "/products?category=water-treatment-chemicals" },
  { label: "Food-Grade & Additives", href: "/products?category=food-grade-chemicals" },
  { label: "Cosmetic & Detergent Raw Materials", href: "/products?category=industrial-chemicals" },
  { label: "Construction Chemicals", href: "/products?category=specialty-chemicals" },
  { label: "Paints, Inks & Coatings", href: "/products?category=specialty-chemicals" },
  { label: "Agriculture & Animal Feed", href: "/products?category=industrial-chemicals" },
  { label: "Laboratory Reagents", href: "/products?category=laboratory-reagents" },
  { label: "Specialty Chemicals", href: "/products?category=specialty-chemicals" },
  { label: "Cleaning & Hygiene", href: "/products?category=water-treatment-chemicals" },
] as const;

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const megaMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  // Click outside to close mega menu
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // ⌘K / Ctrl+K opens search
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setSearchOpen(true);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Top Bar (Karivex Style with Blue Accents) ─────────── */}
      <div className="top-bar">
        <div className="top-bar-inner">
          <div className="flex items-center gap-4 text-[12px] sm:gap-6 sm:text-[12.5px]">
            {contact.phone && (
              <a
                href={contact.telHref}
                className="flex items-center gap-1.5 font-medium text-white transition-colors hover:text-blue-300"
                aria-label={`Call Sales: ${contact.phone}`}
              >
                <Phone className="size-3.5 text-blue-400" />
                <span>{contact.phone}</span>
              </a>
            )}

            {contact.phoneAlt && (
              <a
                href={`tel:${contact.phoneAlt.replace(/\s+/g, "")}`}
                className="hidden font-medium text-silver-300 transition-colors hover:text-white md:inline-block"
                aria-label={`Alternative phone: ${contact.phoneAlt}`}
              >
                {contact.phoneAlt}
              </a>
            )}

            <a
              href={contact.whatsappUrl || "https://wa.me/254700000000"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium text-[#25D366] transition-colors hover:underline"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-6.99A9.82 9.82 0 0 0 12.04 2z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="hidden items-center gap-1.5 text-silver-300 transition-colors hover:text-white lg:flex"
              >
                <Mail className="size-3.5 text-blue-400" />
                <span>{contact.email}</span>
              </a>
            )}
          </div>

          <div className="hidden items-center gap-2 text-[12px] text-silver-400 xl:flex">
            <span>{contact.hours || "Mo-Fr 08:00-17:30, Sa 08:00-13:00"}</span>
            <span aria-hidden="true">·</span>
            <span>Serving Kenya, Uganda, Tanzania, Rwanda</span>
          </div>
        </div>
      </div>

      {/* ── Main Header (Karivex Structure · NOKS Blue) ──────── */}
      <header className="site-header">
        <div className="top-bar-inner !py-2.5 flex items-center justify-between gap-4 sm:gap-6">
          {/* Brand Logo & Name. min-w-0 so the wordmark can compress rather
              than pushing the row wider than a phone viewport. */}
          <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label={brand.fullName}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-md sm:size-11">
              <Image
                src={brand.logo}
                alt={`${brand.name} logo`}
                width={40}
                height={40}
                priority
                className="size-9 object-contain"
              />
            </span>
            <div className="flex min-w-0 flex-col leading-tight">
              <strong className="truncate font-heading text-base font-bold tracking-tight text-white sm:text-xl">
                {brand.name} Solutions Ltd
              </strong>
              <span className="text-[10.5px] font-bold tracking-[0.16em] text-blue-300 uppercase">
                chemical division
              </span>
            </div>
          </Link>

          {/* Integrated Search Bar */}
          <div className="hidden max-w-md flex-1 md:block lg:max-w-lg">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <label htmlFor="header-search-input" className="sr-only">
                Search chemical catalogue
              </label>
              <input
                id="header-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => setSearchOpen(true)}
                placeholder="Search products, CAS number…"
                autoComplete="off"
                className="h-10 w-full rounded-full border border-white/20 bg-navy-950/80 pr-11 pl-4
                           text-sm text-white placeholder:text-silver-400 transition-all
                           focus:border-blue-500 focus:bg-navy-950 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 flex size-7 items-center justify-center rounded-full
                           bg-gradient-to-r from-blue-700 to-blue-600 text-white transition-transform hover:scale-105"
              >
                <Search className="size-3.5 stroke-[2.5]" />
              </button>
            </form>
          </div>

          {/* Nav Links & Actions */}
          <nav className="flex items-center gap-3 lg:gap-4" aria-label="Main Navigation">
            <div className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    isActive(item.href)
                      ? "bg-white/15 text-blue-300"
                      : "text-white/90 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Nav phone button */}
            {contact.phone && (
              <a href={contact.telHref} className="nav-phone hidden sm:inline-flex" aria-label={`Call ${contact.phone}`}>
                <Phone className="size-3.5 text-blue-300" />
                <span className="hidden xl:inline">{contact.phone}</span>
                <span className="xl:hidden">Call</span>
              </a>
            )}

            {/* Request a quote CTA button. Short label on phones — the full
                one plus the brand block overflows a 390px viewport. */}
            <Link href="/quote" className="nav-cta whitespace-nowrap max-sm:!px-3.5">
              <span className="max-sm:hidden">Request a quote</span>
              <span className="sm:hidden">Quote</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex size-10 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
            >
              {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </nav>
        </div>

        {/* Mobile Search Input */}
        <div className="border-t border-white/10 px-4 py-2 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => setSearchOpen(true)}
              placeholder="Search products, CAS number…"
              className="h-9 w-full rounded-full border border-white/20 bg-navy-950/90 pr-10 pl-3.5
                         text-xs text-white placeholder:text-silver-400 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 flex size-7 items-center justify-center rounded-full
                         bg-blue-600 text-white"
            >
              <Search className="size-3" />
            </button>
          </form>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-white/10 bg-navy-950 lg:hidden"
            >
              <nav className="container-noks flex flex-col py-4" aria-label="Mobile Navigation">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-4 py-2.5 text-[15px] font-semibold transition-colors",
                      isActive(item.href)
                        ? "bg-white/10 text-blue-300"
                        : "text-white/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                  <Link
                    href="/products"
                    className="rounded-lg px-4 py-2 text-sm text-silver-300 hover:text-white"
                  >
                    Browse Chemical Catalogue →
                  </Link>
                  <Link
                    href="/quote"
                    className="flex items-center justify-center rounded-full bg-blue-600 py-2.5 text-sm font-bold text-white shadow-glow-blue"
                  >
                    Request a Quote
                  </Link>
                  {contact.phone && (
                    <a
                      href={contact.telHref}
                      className="flex items-center justify-center gap-2 rounded-full border border-white/20 py-2 text-sm text-white"
                    >
                      <Phone className="size-4 text-blue-400" />
                      {contact.phone}
                    </a>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mega Bar (NOKS Blue Accent) ───────────────────────── */}
      <div className="mega-bar relative" ref={megaMenuRef}>
        <div className="top-bar-inner !py-0 flex items-center justify-between gap-4">
          {/* Shop by Industry Trigger Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMegaOpen(!megaOpen)}
              className="mega-trigger"
              aria-expanded={megaOpen}
              aria-haspopup="true"
            >
              <span className="flex flex-col gap-1">
                <span className="block h-0.5 w-4 bg-white"></span>
                <span className="block h-0.5 w-4 bg-white"></span>
                <span className="block h-0.5 w-4 bg-white"></span>
              </span>
              <span>Shop by industry</span>
              <ChevronDown
                className={cn("size-3.5 transition-transform duration-200 text-white", megaOpen && "rotate-180")}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {megaOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-0 z-50 mt-1 w-72 rounded-b-xl border border-rule
                             bg-white py-2 shadow-2xl"
                >
                  <div className="px-4 py-2 border-b border-rule">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-navy-800">
                      Chemical Industries
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1">
                    {INDUSTRIES.map((ind) => (
                      <Link
                        key={ind.name}
                        href={ind.href}
                        onClick={() => setMegaOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-sm text-ink
                                   transition-colors hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span className="font-medium">{ind.name}</span>
                        <span className="text-[11px] text-muted-fg">{ind.count}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-rule px-4 py-2 bg-silver-100">
                    <Link
                      href="/products"
                      onClick={() => setMegaOpen(false)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      View complete catalogue →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Catalogue Shortcut Links */}
          <nav className="hidden items-center gap-5 text-xs font-semibold text-silver-300 md:flex" aria-label="Catalogue shortcuts">
            <Link href="/products" className="hover:text-blue-300 transition-colors">
              All products
            </Link>
            <Link href="/products" className="hover:text-blue-300 transition-colors">
              All categories
            </Link>
            <Link href="/products?featured=true" className="hover:text-blue-300 transition-colors">
              Featured
            </Link>
            <Link href="/knowledge" className="hover:text-blue-300 transition-colors">
              Buying guides
            </Link>
            <Link href="/quote" className="hover:text-blue-300 transition-colors">
              Request a quote
            </Link>
          </nav>
        </div>

        {/* Horizontally Scrollable Category Chips (.mega-chips) */}
        <div className="border-t border-white/10 bg-navy-950/40">
          <div className="top-bar-inner !py-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2">
              {CATEGORY_CHIPS.map((chip, idx) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className={cn(
                    "category-chip",
                    idx === 0 && pathname === "/products" && "category-chip-active",
                  )}
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search Overlay (⌘K / Click search) ───────────────── */}
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};
