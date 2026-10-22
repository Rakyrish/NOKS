import Link from "next/link";

import { contact } from "@/lib/site";
import type { ProductDetail } from "@/types";

export function ProductBuyingDetails({ product }: { product: ProductDetail }) {
  const country = contact.country || "Kenya";
  return (
    <section className="rounded-2xl border border-line bg-white p-6 sm:p-7" aria-labelledby="buying-details">
      <h2 id="buying-details" className="font-display text-[17px] font-bold text-navy-900">
        Buying {product.name} in {country}
      </h2>
      <p className="mt-4 text-[14px] leading-relaxed text-slate-600">
        Request a quotation from our team in {contact.city || "Nairobi"}. Include your
        application, required grade, total quantity and delivery location so the quote
        can specify the product, pack size and transport arrangements you need.
      </p>
      <dl className="mt-5 space-y-4 text-[14px]">
        <div>
          <dt className="font-semibold text-navy-900">Grade to specify</dt>
          <dd className="mt-1 text-slate-600">
            {product.grade_display || "Confirm the required grade"}.
            {product.purity && ` Listed assay: ${product.purity}.`}{" "}
            Include any impurity limits or test method required by your process.
          </dd>
        </div>
        {product.packaging_options?.length > 0 && (
          <div>
            <dt className="font-semibold text-navy-900">Pack sizes to ask about</dt>
            <dd className="mt-1 text-slate-600">
              {product.packaging_options.join("; ")}. Confirm the available pack and
              minimum order quantity when requesting a price.
            </dd>
          </div>
        )}
        <div>
          <dt className="font-semibold text-navy-900">Price and delivery</dt>
          <dd className="mt-1 text-slate-600">
            Ask for the quoted currency, price per pack or unit, tax treatment,
            delivery charges and quotation validity. Availability and lead time
            need confirmation for your quantity and destination.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-navy-900">Documents for approval</dt>
          <dd className="mt-1 text-slate-600">
            Request the current specification, Safety Data Sheet and batch Certificate
            of Analysis. Confirm which documents are available before approving an order.
          </dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-[14px] font-semibold text-brand-600">
        <Link href={`/quote?product=${product.slug}`} className="underline">Request a {product.name} quotation</Link>
        <Link href={`/categories/${product.category_slug}`} className="underline">Compare {product.category_name.toLowerCase()}</Link>
        <Link href="/knowledge/understanding-cas-numbers-and-chemical-specifications" className="underline">How to compare specifications</Link>
      </div>
    </section>
  );
}
