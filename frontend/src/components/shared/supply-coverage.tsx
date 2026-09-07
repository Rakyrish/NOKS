import { MapPin, Ship, Truck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Where NOKS actually delivers.
 *
 * Named down to county and country rather than left as "East Africa": a buyer
 * searching "caustic soda supplier Nakuru" or "chemical supplier Kampala" is
 * not served by a regional abstraction, and neither is a crawler trying to
 * work out the service area.
 */

export const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu (Eldoret)", "Kiambu",
  "Machakos", "Kajiado", "Nyeri", "Meru", "Kericho", "Kakamega", "Bungoma",
  "Trans Nzoia (Kitale)", "Kilifi", "Murang'a", "Embu", "Laikipia (Nanyuki)",
  "Kirinyaga", "Narok", "Nyandarua", "Busia",
] as const;

export const COUNTRIES = [
  { name: "Kenya", note: "Ex-stock Nairobi, nationwide delivery" },
  { name: "Uganda", note: "Weekly consignments via Malaba" },
  { name: "Tanzania", note: "Road freight via Namanga and Holili" },
  { name: "Ethiopia", note: "Export documentation and HS codes prepared" },
  { name: "Rwanda", note: "Consolidated regional shipments" },
  { name: "Burundi", note: "Consolidated regional shipments" },
  { name: "South Sudan", note: "Export orders on request" },
  { name: "DR Congo", note: "Eastern DRC via regional partners" },
] as const;

export const SupplyCoverage = ({
  className,
  compact = false,
  productName,
}: {
  className?: string;
  compact?: boolean;
  /** When set, the copy is framed around this specific product. */
  productName?: string;
}) => {
  const subject = productName ?? "industrial, food-grade and laboratory chemicals";

  return (
    <div className={cn("rounded-2xl border border-line bg-surface-muted p-6 sm:p-7", className)}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg bg-[var(--brand-primary)] text-white">
          <Truck className="size-[18px]" />
        </span>
        <h2 className="font-heading text-lg font-bold text-navy-900">
          Where we supply {productName ? "this product" : "chemicals"}
        </h2>
      </div>

      <p className="mt-3 text-[14.5px] leading-relaxed text-slate-700">
        NOKS Solutions Ltd supplies {subject} across{" "}
        <strong className="font-semibold text-navy-900">
          Kenya, Uganda, Tanzania and Ethiopia
        </strong>
        , and also serves Rwanda, Burundi, South Sudan and eastern DR Congo. Stock is
        held at our Nairobi warehouse on Enterprise Road, Industrial Area, so most
        orders dispatch the same or next working day.
      </p>

      {!compact && (
        <>
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] text-slate-500 uppercase">
              <Ship className="size-3.5" /> Countries served
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {COUNTRIES.map((country) => (
                <li
                  key={country.name}
                  className="flex items-baseline gap-2 rounded-lg bg-white px-3 py-2 text-[13.5px]"
                >
                  <span className="font-semibold text-navy-900">{country.name}</span>
                  <span className="text-slate-500">— {country.note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] text-slate-500 uppercase">
              <MapPin className="size-3.5" /> Delivery across Kenya
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
              We deliver to every county, including{" "}
              {KENYA_COUNTIES.map((county, index) => (
                <React.Fragment key={county}>
                  <span className="font-medium text-navy-800">{county}</span>
                  {index < KENYA_COUNTIES.length - 1 ? ", " : ""}
                </React.Fragment>
              ))}
              .
            </p>
          </div>
        </>
      )}

      <p className="mt-5 text-[13.5px] text-slate-600">
        Need it somewhere else?{" "}
        <Link
          href="/contact"
          className="font-semibold text-[var(--brand-primary)] hover:underline"
        >
          Talk to our technical sales team
        </Link>{" "}
        or{" "}
        <Link
          href="/quote"
          className="font-semibold text-[var(--brand-primary)] hover:underline"
        >
          request a quotation
        </Link>
        .
      </p>
    </div>
  );
};
