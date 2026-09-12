import { ArrowLeft, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { brand } from "@/lib/site";

/**
 * Authoritative head for every 404.
 *
 * When a route calls `notFound()`, Next discards that route's
 * `generateMetadata()` result and renders this boundary against the *root
 * layout's* metadata instead. That is how missing products came to serve
 * `<link rel="canonical" href="https://chemicals.noksindustrial.com">` and
 * `<meta name="robots" content="index, follow">` — both inherited from
 * app/(site)/layout.tsx, neither correct for a page that does not exist.
 *
 * `canonical: null` removes the inherited tag rather than replacing it: a
 * missing page has no canonical, and pointing one at the homepage tells Google
 * these two URLs are the same document.
 */
export const metadata: Metadata = {
  title: { absolute: `Page not found | ${brand.fullName}` },
  description:
    "The page you requested is not in the NOKS chemical catalogue. Search the catalogue or tell us which chemical you need.",
  alternates: { canonical: null },
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
  openGraph: null,
  twitter: null,
};

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-navy-900 py-20">
      <div className="bg-grid-light absolute inset-0 opacity-45" aria-hidden />
      <div
        className="pointer-events-none absolute -top-24 right-1/4 size-[28rem] rounded-full
                   bg-[var(--brand-primary)]/28 blur-[110px]"
        aria-hidden
      />

      <div className="relative container-noks text-center">
        <p className="font-display text-[clamp(4rem,12vw,8rem)] leading-none font-extrabold text-white/12">
          404
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold text-white">
          That page isn&apos;t in our catalog
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/60">
          The page may have moved, or the product may have been renamed. Try the catalog
          search, or tell us what chemical you need.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-white text-navy-900 hover:bg-brand-50">
            <Link href="/products">
              <Search className="size-4" />
              Browse products
            </Link>
          </Button>
          <Button asChild size="lg" variant="glass">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back home
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
