import { Phone } from "lucide-react";
import * as React from "react";

import { nap } from "@/lib/business";
import { absoluteUrl, brand, contact } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * WhatsApp + call buttons for a single product.
 *
 * Buyers here overwhelmingly enquire by phone or WhatsApp rather than filling
 * in a form, so every card carries both and pre-fills the message with the
 * product name and CAS number — the two things sales asks for first.
 */
export const ProductContactActions = ({
  productName,
  casNumber,
  productSlug,
  grade,
  className,
  size = "md",
}: {
  productName: string;
  casNumber?: string;
  productSlug?: string;
  grade?: string;
  className?: string;
  size?: "sm" | "md";
}) => {
  const message = encodeURIComponent(
    `Hello ${brand.name}, I would like a quotation for ${productName}` +
      (casNumber ? ` (CAS ${casNumber})` : "") +
      (grade ? ` — ${grade}` : "") +
      (productSlug ? `\n${absoluteUrl(`/products/${productSlug}`)}` : "") +
      `\nQuantity: [please specify]\nPackaging: [please specify]\nDelivery location: [please specify]\nPlease confirm price and availability.`,
  );
  const whatsappHref = `${contact.whatsappUrl}?text=${message}`;
  const telHref = nap.telHref;

  const height = size === "sm" ? "h-8 text-[12px]" : "h-9 text-[13px]";

  return (
    <div data-product-slug={productSlug} className={cn("flex gap-2", className)}>
      {contact.whatsappUrl && <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Enquire about ${productName} on WhatsApp`}
        className={cn(
          "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full",
          "border border-[#25D366]/40 bg-[#25D366]/12 font-semibold text-[#04310f]",
          "transition-colors hover:bg-[#25D366]/22",
          height,
        )}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5 text-[#128C4A]">
          <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-6.99A9.82 9.82 0 0 0 12.04 2z" />
        </svg>
        WhatsApp
      </a>}
      {telHref && <a
        href={telHref}
        aria-label={`Call NOKS about ${productName}`}
        className={cn(
          "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full",
          "border border-line bg-white font-semibold text-navy-900",
          "transition-colors hover:border-brand-300 hover:bg-brand-50",
          height,
        )}
      >
        <Phone className="size-3.5 text-[var(--brand-primary)]" />
        Call
      </a>}
    </div>
  );
};
