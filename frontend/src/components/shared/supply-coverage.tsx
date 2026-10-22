import { MapPin, Truck } from "lucide-react";
import Link from "next/link";

import { brand, contact } from "@/lib/site";
import { cn } from "@/lib/utils";

export const SupplyCoverage = ({ className, compact = false, productName }: {
  className?: string;
  compact?: boolean;
  productName?: string;
}) => (
  <section className={cn("rounded-2xl border border-line bg-surface-muted p-6 sm:p-7", className)}>
    <h2 className="flex items-center gap-2.5 font-heading text-lg font-bold text-navy-900">
      <Truck className="size-5 text-brand-600" />
      Chemical supply from {contact.city || "Nairobi"}
    </h2>
    <p className="mt-3 text-[14.5px] leading-relaxed text-slate-700">
      {brand.fullName} handles enquiries for {productName || "industrial, food-grade and laboratory chemicals"}{" "}
      from {contact.street || "Enterprise Road, Industrial Area"}, {contact.city || "Nairobi"}.
      Include your destination and required delivery date when requesting a quotation.
    </p>
    {!compact && (
      <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-slate-600">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-navy-900"><MapPin className="size-4" />Collection and delivery in Kenya</h3>
          <p className="mt-1">For collection in Nairobi or delivery to another destination, confirm the pack size, loading requirements, transport charges and lead time with our team before ordering.</p>
        </div>
        <div>
          <h3 className="font-semibold text-navy-900">Regional enquiries</h3>
          <p className="mt-1">For Uganda, Tanzania, Rwanda or another East African destination, provide the delivery address and required documentation so transport and export requirements can be confirmed for the order.</p>
        </div>
      </div>
    )}
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-[14px] font-semibold text-brand-600">
      <Link href="/contact" className="underline">Contact the Nairobi team</Link>
      <Link href="/quote" className="underline">Request delivery details</Link>
    </div>
  </section>
);
