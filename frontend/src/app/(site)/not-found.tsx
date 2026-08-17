import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

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
