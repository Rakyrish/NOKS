"use client";

import { ArrowRight, Check, ExternalLink, FileText, Phone } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { brand, contact } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

type TabKey = "all" | "water" | "food" | "detergents" | "agriculture" | "lab";

interface IndustryTabsProps {
  products?: Product[];
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Caustic Soda Flakes",
    slug: "caustic-soda-flakes",
    sku: "CHEM-CS-001",
    cas_number: "1310-73-2",
    chemical_formula: "NaOH",
    category_name: "Industrial Chemicals",
    category_slug: "industrial-chemicals",
    grade: "industrial",
    grade_display: "Industrial Grade",
    purity: "",
    manufacturer_name: "NOKS Industrial",
    availability: "in_stock",
    availability_display: "In Stock",
    unit: "kg",
    lead_time: "3-5 days",
    price_on_request: true,
    indicative_price: null,
    currency: "USD",
    is_featured: true,
    is_bestseller: false,
    image: null,
    short_description: "High-purity sodium hydroxide flakes (98% min) for pH correction, saponification, and industrial cleaning.",
    industry_slugs: ["water-treatment", "textile", "manufacturing"],
  },
  {
    id: 2,
    name: "Aluminum Sulphate 17%",
    slug: "aluminum-sulphate-17",
    sku: "CHEM-AS-002",
    cas_number: "10043-01-3",
    chemical_formula: "Al2(SO4)3",
    category_name: "Water Treatment Chemicals",
    category_slug: "water-treatment-chemicals",
    grade: "industrial",
    grade_display: "Industrial Grade",
    purity: "",
    manufacturer_name: "NOKS Industrial",
    availability: "in_stock",
    availability_display: "In Stock",
    unit: "kg",
    lead_time: "3-5 days",
    price_on_request: true,
    indicative_price: null,
    currency: "USD",
    is_featured: true,
    is_bestseller: false,
    image: null,
    short_description: "Standard municipal and industrial coagulant for water purification, suspended solids removal, and turbidity reduction.",
    industry_slugs: ["water-treatment", "pulp-paper"],
  },
  {
    id: 3,
    name: "Citric Acid Anhydrous",
    slug: "citric-acid-anhydrous",
    sku: "CHEM-CA-003",
    cas_number: "77-92-9",
    chemical_formula: "C6H8O7",
    category_name: "Food Grade Chemicals",
    category_slug: "food-grade-chemicals",
    grade: "food",
    grade_display: "Food Grade",
    purity: "",
    manufacturer_name: "NOKS Industrial",
    availability: "in_stock",
    availability_display: "In Stock",
    unit: "kg",
    lead_time: "3-5 days",
    price_on_request: true,
    indicative_price: null,
    currency: "USD",
    is_featured: true,
    is_bestseller: false,
    image: null,
    short_description: "High-purity food grade acidulant and preservative meeting BP/USP/FCC standards for beverage and food manufacturing.",
    industry_slugs: ["food-processing", "cosmetics"],
  },
  {
    id: 4,
    name: "Sodium Lauryl Ether Sulphate (SLES 70%)",
    slug: "sles-70",
    sku: "CHEM-SLES-004",
    cas_number: "68585-34-2",
    chemical_formula: "C12H25O(C2H4O)2SO3Na",
    category_name: "Industrial Chemicals",
    category_slug: "industrial-chemicals",
    grade: "industrial",
    grade_display: "Industrial Grade",
    purity: "",
    manufacturer_name: "NOKS Industrial",
    availability: "in_stock",
    availability_display: "In Stock",
    unit: "kg",
    lead_time: "3-5 days",
    price_on_request: true,
    indicative_price: null,
    currency: "USD",
    is_featured: true,
    is_bestseller: false,
    image: null,
    short_description: "Primary anionic surfactant offering excellent foaming, detergency, and wetting for liquid detergents and shampoo formulation.",
    industry_slugs: ["manufacturing", "hospitality"],
  },
  {
    id: 5,
    name: "Linear Alkyl Benzene Sulphonic Acid (LABSA 96%)",
    slug: "labsa-96",
    sku: "CHEM-LABSA-005",
    cas_number: "27176-87-0",
    chemical_formula: "RC6H4SO3H",
    category_name: "Industrial Chemicals",
    category_slug: "industrial-chemicals",
    grade: "industrial",
    grade_display: "Industrial Grade",
    purity: "",
    manufacturer_name: "NOKS Industrial",
    availability: "in_stock",
    availability_display: "In Stock",
    unit: "kg",
    lead_time: "3-5 days",
    price_on_request: true,
    indicative_price: null,
    currency: "USD",
    is_featured: true,
    is_bestseller: false,
    image: null,
    short_description: "High-active biodegradable anionic surfactant base for powder and liquid detergent manufacturing.",
    industry_slugs: ["manufacturing"],
  },
  {
    id: 6,
    name: "Hydrochloric Acid 33%",
    slug: "hydrochloric-acid-33",
    sku: "CHEM-HA-006",
    cas_number: "7647-01-0",
    chemical_formula: "HCl",
    category_name: "Industrial Chemicals",
    category_slug: "industrial-chemicals",
    grade: "industrial",
    grade_display: "Industrial Grade",
    purity: "",
    manufacturer_name: "NOKS Industrial",
    availability: "in_stock",
    availability_display: "In Stock",
    unit: "kg",
    lead_time: "3-5 days",
    price_on_request: true,
    indicative_price: null,
    currency: "USD",
    is_featured: true,
    is_bestseller: false,
    image: null,
    short_description: "Technical grade aqueous solution for pH control, boiler descaling, pickling, and resin regeneration.",
    industry_slugs: ["water-treatment", "mining", "manufacturing"],
  },
  {
    id: 7,
    name: "Sodium Hypochlorite 10-15%",
    slug: "sodium-hypochlorite-15",
    sku: "CHEM-SH-007",
    cas_number: "7681-52-9",
    chemical_formula: "NaOCl",
    category_name: "Water Treatment Chemicals",
    category_slug: "water-treatment-chemicals",
    grade: "industrial",
    grade_display: "Industrial Grade",
    purity: "",
    manufacturer_name: "NOKS Industrial",
    availability: "in_stock",
    availability_display: "In Stock",
    unit: "kg",
    lead_time: "3-5 days",
    price_on_request: true,
    indicative_price: null,
    currency: "USD",
    is_featured: true,
    is_bestseller: false,
    image: null,
    short_description: "Broad-spectrum oxidizing disinfectant and bleaching agent for drinking water chlorination and sanitization.",
    industry_slugs: ["water-treatment", "hospitality", "healthcare"],
  },
  {
    id: 8,
    name: "Potassium Chloride (AR Grade)",
    slug: "potassium-chloride-ar",
    sku: "CHEM-PC-008",
    cas_number: "7447-40-7",
    chemical_formula: "KCl",
    category_name: "Laboratory Reagents",
    category_slug: "laboratory-reagents",
    grade: "analytical",
    grade_display: "Analytical Grade",
    purity: "",
    manufacturer_name: "NOKS Industrial",
    availability: "in_stock",
    availability_display: "In Stock",
    unit: "kg",
    lead_time: "3-5 days",
    price_on_request: true,
    indicative_price: null,
    currency: "USD",
    is_featured: true,
    is_bestseller: false,
    image: null,
    short_description: "Analytical reagent grade potassium chloride (≥99.5%) for standard solutions, buffers, and diagnostic laboratories.",
    industry_slugs: ["laboratories", "healthcare"],
  },
];

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

  const catalog = products.length > 0 ? products : DEFAULT_PRODUCTS;
  const currentTabDef = TABS.find((t) => t.key === activeTab) || TABS[0];
  const filtered = catalog.filter(currentTabDef.filter);
  const displayItems = filtered.length > 0 ? filtered : catalog.slice(0, 6);

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
              Select an industry sector to filter available ex-stock products in our Nairobi warehouse. Technical datasheets and COA available for every chemical.
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

            const whatsappMessage = encodeURIComponent(
              `Hello ${brand.name}, I'd like a price quotation for ${product.name} (CAS: ${product.cas_number || "N/A"}).`,
            );

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
                    className="flex items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 py-2 px-3 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110"
                  >
                    <span>Request Quotation</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                  <a
                    href={`https://wa.me/${contact.whatsapp || "254700000000"}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-md bg-[#25D366]/15 border border-[#25D366]/40 py-2 px-3 text-xs font-bold text-[#04310f] transition-all hover:bg-[#25D366]/25"
                  >
                    <span>WhatsApp Inquiry</span>
                  </a>
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
            <span>Explore All 1,200+ Products in Chemical Catalogue</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
