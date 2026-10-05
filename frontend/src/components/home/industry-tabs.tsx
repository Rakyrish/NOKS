"use client";

import { ArrowRight, Check, ExternalLink, FileText, Phone } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { ProductContactActions } from "@/components/catalog/product-contact-actions";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

type TabKey = "all" | "water" | "food" | "detergents" | "agriculture" | "lab";

interface IndustryTabsProps {
  products?: Product[];
}

const TABS: { key: TabKey; label: string; filter: (p: Product) => boolean }[] = [
  { key: "all", label: "All Chemicals", filter: () => true },
  {
    key: "water",
    label: "Water Treatment",
    filter: (p) =>
      p.category_slug?.includes("water") ||
      p.industry_slugs?.some((i) => i.toLowerCase().includes("water")) ||
      false,
  },
  {
    key: "food",
    label: "Food Grade & Additives",
    filter: (p) =>
      p.grade === "food" ||
      p.category_slug?.includes("food") ||
      p.industry_slugs?.some((i) => i.toLowerCase().includes("food")) ||
      false,
  },
  {
    key: "detergents",
    label: "Cosmetic & Detergent Raw Materials",
    filter: (p) =>
      p.name.includes("SLES") ||
      p.name.includes("LABSA") ||
      p.name.includes("Caustic") ||
      p.industry_slugs?.some((i) => i.toLowerCase().includes("manufacturing")) ||
      false,
  },
  {
    key: "agriculture",
    label: "Agriculture & Feed",
    filter: (p) =>
      p.industry_slugs?.some((i) => i.toLowerCase().includes("agriculture") || i.toLowerCase().includes("mining")) ||
      false,
  },
  {
    key: "lab",
    label: "Laboratory Reagents",
    filter: (p) =>
      p.grade === "analytical" ||
      p.category_slug?.includes("laboratory") ||
      p.industry_slugs?.some((i) => i.toLowerCase().includes("lab")) ||
      false,
  },
];

export const IndustryTabs = ({ products = [] }: IndustryTabsProps) => {
  const [activeTab, setActiveTab] = React.useState<TabKey>("all");

  // No fabricated fallback. This used to fall back to eight hardcoded
  // "products" with invented SKUs (CHEM-CS-001), an invented manufacturer
  // ("NOKS Industrial") and slugs that do not exist — the homepage was
  // linking to five 404s, because `api.homepage()` degrades to an empty
  // payload when the backend is unreachable and the fallback filled the gap
  // with fiction. An empty catalogue now renders nothing.
  const catalog = products;
  const currentTabDef = TABS.find((t) => t.key === activeTab) || TABS[0];
  const filtered = catalog.filter(currentTabDef.filter);
  const displayItems = filtered.length > 0 ? filtered : catalog.slice(0, 6);

  if (catalog.length === 0) return null;

  return (
    <section className="industry-tabs py-12 lg:py-16 bg-silver-100/60 border-b border-rule">
      <div className="container-noks">
        {/* Section Head */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Chemical Catalogue
            </span>
            <h2 className="mt-1 font-heading text-2xl sm:text-3xl font-bold text-navy-900">
              Featured Industrial & Specialty Chemicals
            </h2>
            <p className="mt-2 text-sm text-steel-700 max-w-2xl">
              Select an industry sector to filter our catalogue. Every listing publishes
              its CAS number, grade and packaging.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
          >
            <span>View all products</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Tab Buttons (Karivex Style with Blue Active State) */}
        <div className="industry-tabs-list overflow-x-auto scrollbar-none mb-8">
          {TABS.map((tab) => {
            const count = catalog.filter(tab.filter).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  isActive
                    ? "!bg-gradient-to-r !from-blue-700 !to-blue-600 !text-white !border-transparent shadow-sm"
                    : "hover:!bg-blue-50 hover:!border-blue-300 hover:!text-blue-700",
                )}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-1 text-[11px] rounded-full px-1.5 py-0.5",
                      isActive ? "bg-white/20 text-white" : "bg-silver-200/80 text-steel-700",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid (Karivex Style) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayItems.map((product, idx) => {
            const borderColors = ["border-t-[#0c48e6]", "border-t-teal-500", "border-t-navy-700"];
            const topColor = borderColors[idx % 3];


            return (
              <div
                key={product.slug || product.id}
                className={cn("product-card", topColor, "flex flex-col justify-between")}
              >
                {/* Product Info */}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    {product.cas_number ? (
                      <span className="rounded bg-silver-200/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-navy-900">
                        CAS {product.cas_number}
                      </span>
                    ) : (
                      <span className="rounded bg-silver-200/80 px-2 py-0.5 text-[11px] font-semibold text-navy-900">
                        {product.chemical_formula || "Chemical"}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
                      {product.grade || "Industrial"}
                    </span>
                  </div>

                  <Link href={`/products/${product.slug}`} className="block group mt-3">
                    <h3 className="font-heading text-lg font-bold text-navy-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="mt-2 text-xs leading-relaxed text-steel-700 line-clamp-3">
                    {product.short_description}
                  </p>
                </div>

                {/* Actions (Dual Action Buttons in Blue & WhatsApp) */}
                <div className="p-5 pt-0 border-t border-rule/50 flex flex-col gap-2 mt-2">
                  <Link
                    href={`/quote?product=${product.slug}`}
                    rel="nofollow"
                    className="flex items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 py-2 px-3 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110"
                  >
                    <span>Request Quotation</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                  <ProductContactActions
                    productName={product.name}
                    casNumber={product.cas_number}
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom catalogue link */}
        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full border-2 border-blue-600 bg-white px-6 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
          >
            <span>Explore the full chemical catalogue</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
