import { Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ProductDetail } from "@/types";

export const metadata: Metadata = {
  title: "Compare Chemical Products",
  description:
    "Compare specifications, grades, packaging and availability across NOKS chemical products side by side.",
  robots: { index: false, follow: true },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const raw = typeof params.slugs === "string" ? params.slugs : "";
  const slugs = raw.split(",").map((slug) => slug.trim()).filter(Boolean).slice(0, 4);

  const products = slugs.length ? await api.compare(slugs) : [];

  return (
    <>
      <PageHero
        eyebrow="Compare"
        title="Side-by-side product comparison"
        description="Grades, specifications, packaging and availability — compared across up to four products."
        crumbs={[
          { name: "Products", url: "/products" },
          { name: "Compare", url: "/compare" },
        ]}
      />

      <div className="bg-surface-muted py-14 sm:py-20">
        <div className="container-noks">
          {products.length < 2 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white py-20 text-center">
              <p className="font-display text-lg font-bold text-navy-900">
                Select at least two products to compare
              </p>
              <p className="mt-2 text-[14px] text-slate-500">
                Use the compare icon on any product card to build a comparison.
              </p>
              <Button asChild className="mt-6">
                <Link href="/products">Browse the catalog</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-[720px] text-[14px]">
                <caption className="sr-only">Product comparison</caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="w-48 p-5 text-left text-[12px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                      Attribute
                    </th>
                    {products.map((product) => (
                      <th key={product.id} scope="col" className="p-5 text-left align-top">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-display text-[15.5px] font-bold text-navy-900 transition-colors hover:text-[var(--brand-primary)]"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-[12px] font-normal text-slate-400">
                          {product.sku}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <Row label="Category" products={products} value={(p) => p.category_name} />
                  <Row label="Grade" products={products} value={(p) => p.grade_display} />
                  <Row label="CAS number" products={products} value={(p) => p.cas_number} />
                  <Row label="Formula" products={products} value={(p) => p.chemical_formula} />
                  <Row label="Purity" products={products} value={(p) => p.purity} />
                  <Row
                    label="Availability"
                    products={products}
                    value={(p) => p.availability_display}
                  />
                  <Row label="Lead time" products={products} value={(p) => p.lead_time} />
                  <Row
                    label="Packaging"
                    products={products}
                    value={(p) => p.packaging_options?.join(", ") ?? ""}
                  />
                  <Row
                    label="Minimum order"
                    products={products}
                    value={(p) => `${p.min_order_quantity} ${p.unit}`}
                  />
                  <Row
                    label="Applications"
                    products={products}
                    value={(p) => p.applications?.slice(0, 3).join(", ") ?? ""}
                  />
                  <Row
                    label="Documentation"
                    products={products}
                    value={(p) => (p.documents?.length ? `${p.documents.length} available` : "")}
                  />

                  <tr>
                    <th scope="row" className="p-5 text-left font-medium text-slate-500">
                      Request
                    </th>
                    {products.map((product) => (
                      <td key={product.id} className="p-5">
                        <Button asChild size="sm">
                          <Link href={`/quote?product=${product.slug}`}>Quick Quote</Link>
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const Row = ({
  label,
  products,
  value,
}: {
  label: string;
  products: ProductDetail[];
  value: (product: ProductDetail) => string;
}) => (
  <tr className="border-b border-line last:border-0 odd:bg-surface-muted/50">
    <th scope="row" className="p-5 text-left font-medium text-slate-500">
      {label}
    </th>
    {products.map((product) => {
      const content = value(product);
      return (
        <td key={product.id} className="p-5 align-top text-slate-700">
          {content ? (
            <span className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand-emerald)]" aria-hidden />
              {content}
            </span>
          ) : (
            <Minus className="size-4 text-slate-300" aria-label="Not specified" />
          )}
        </td>
      );
    })}
  </tr>
);
