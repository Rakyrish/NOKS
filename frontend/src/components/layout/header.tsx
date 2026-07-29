"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, Menu, Phone, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { brand, contact } from "@/lib/site";
import { cn } from "@/lib/utils";

import { SearchOverlay } from "./search-overlay";

const NAV = [
  { label: "Products", href: "/products" },
  { label: "Industries", href: "/industries" },
  { label: "Services", href: "/services" },
  { label: "Knowledge", href: "/knowledge" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const Header = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // ⌘K / Ctrl+K opens search from anywhere.
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Utility strip */}
      <div className="hidden bg-navy-900 text-white/75 lg:block">
        <div className="container-noks flex h-10 items-center justify-between text-[12.5px]">
          <p className="truncate">{brand.tagline}</p>
          <div className="flex items-center gap-6">
            {contact.phone && (
              <a
                href={contact.telHref}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Phone className="size-3.5" />
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Mail className="size-3.5" />
                {contact.email}
              </a>
            )}
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "glass border-b border-line/70 shadow-[0_1px_20px_rgba(7,18,51,0.07)]"
            : "border-b border-transparent bg-white",
        )}
      >
        <div className="container-noks flex h-[68px] items-center justify-between gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={brand.fullName}>
            <Image
              src={brand.logo}
              alt={`${brand.name} logo`}
              width={104}
              height={32}
              priority
              className="h-7 w-auto object-contain sm:h-8"
            />
            <span className="hidden border-l border-line pl-3 text-[11px] leading-tight font-bold tracking-[0.14em] text-navy-900/70 uppercase sm:block">
              {brand.division}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "text-[var(--brand-primary)]"
                    : "text-slate-600 hover:text-navy-900",
                )}
              >
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-brand-50"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="flex h-10 items-center gap-2 rounded-full border border-line px-3.5
                         text-sm text-slate-500 transition-all hover:border-brand-300
                         hover:bg-brand-50 hover:text-[var(--brand-primary)] sm:px-4"
            >
              <Search className="size-4" />
              <span className="hidden xl:inline">Search products</span>
              <kbd className="hidden rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium xl:inline">
                ⌘K
              </kbd>
            </button>

            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/quote">Request Quote</Link>
            </Button>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="grid size-10 place-items-center rounded-full text-navy-900
                         transition-colors hover:bg-surface-muted lg:hidden"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line bg-white lg:hidden"
            >
              <nav className="container-noks flex flex-col py-4" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-brand-50 text-[var(--brand-primary)]"
                        : "text-slate-700 hover:bg-surface-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-3 flex flex-col gap-2 border-t border-line pt-4">
                  <Button asChild>
                    <Link href="/quote">Request Quote</Link>
                  </Button>
                  {contact.phone && (
                    <Button asChild variant="outline">
                      <a href={contact.telHref}>
                        <Phone className="size-4" />
                        {contact.phone}
                      </a>
                    </Button>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};
