"use client";

import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Facets, Paginated, Product } from "@/types";

import { CatalogToolbar, FilterRail } from "./catalog-controls";
import { CompareTray } from "./compare-tray";
import { ProductCard } from "./product-card";

export const CatalogView = ({
  page,
  facets,
}: {
  page: Paginated<Product>;
  facets: Facets;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = React.useState<"grid" | "list">("grid");

  React.useEffect(() => {
    const stored = window.localStorage.getItem("noks.catalog.view");
    if (stored === "grid" || stored === "list") setView(stored);
  }, []);

  const changeView = (next: "grid" | "list") => {
    setView(next);
    window.localStorage.setItem("noks.catalog.view", next);
  };

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <>
      <div className="container-noks">
        <CatalogToolbar
          facets={facets}
          view={view}
          onViewChange={changeView}
          total={page.count}
        />
      </div>

      <div className="container-noks mt-8 grid gap-10 lg:grid-cols-[248px_1fr]">
        <aside className="hidden lg:block" aria-label="Product filters">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <FilterRail facets={facets} />
          </div>
        </aside>

        <div className="min-w-0">
          {page.results.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
              <PackageSearch className="size-10 text-slate-300" aria-hidden />
              <p className="mt-4 font-display text-lg font-bold text-navy-900">
                No products match those filters
              </p>
              <p className="mt-1.5 max-w-sm text-[14px] text-slate-500">
                Try removing a filter, or tell us what you need — we source specialty
                chemicals on request.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/products">Clear filters</Link>
                </Button>
                <Button asChild>
                  <Link href="/quote">Request sourcing</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  view === "grid"
                    ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-4",
                )}
              >
                {page.results.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    view={view}
                    index={index}
                  />
                ))}
              </div>

              {page.num_pages > 1 && (
                <nav
                  className="mt-12 flex items-center justify-center gap-2"
                  aria-label="Pagination"
                >
                  <button
                    type="button"
                    onClick={() => goToPage(page.page - 1)}
                    disabled={!page.has_previous}
                    className="h-10 rounded-full border border-line bg-white px-4 text-[13px]
                               font-semibold text-navy-900 transition-colors
                               hover:border-brand-300 hover:bg-brand-50
                               disabled:pointer-events-none disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {buildPageList(page.page, page.num_pages).map((item, index) =>
                    item === "…" ? (
                      <span key={`gap-${index}`} className="px-1 text-slate-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => goToPage(item)}
                        aria-current={item === page.page ? "page" : undefined}
                        className={cn(
                          "size-10 rounded-full text-[13px] font-semibold transition-colors",
                          item === page.page
                            ? "bg-[var(--brand-primary)] text-white"
                            : "border border-line bg-white text-navy-900 hover:border-brand-300 hover:bg-brand-50",
                        )}
                      >
                        {item}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => goToPage(page.page + 1)}
                    disabled={!page.has_next}
                    className="h-10 rounded-full border border-line bg-white px-4 text-[13px]
                               font-semibold text-navy-900 transition-colors
                               hover:border-brand-300 hover:bg-brand-50
                               disabled:pointer-events-none disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}

              <p className="mt-6 text-center text-[12.5px] text-slate-400">
                Showing {page.results.length} of {page.count} products
              </p>
            </>
          )}
        </div>
      </div>

      <CompareTray />
    </>
  );
};

/** 1 … 4 5 [6] 7 8 … 20 */
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("…");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push("…");
  pages.push(total);

  return pages;
}
