"use client";

import { motion } from "framer-motion";
import { Beaker } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { cn, mediaUrl } from "@/lib/utils";
import type { ProductDetail } from "@/types";

export const ProductGallery = ({ product }: { product: ProductDetail }) => {
  const [active, setActive] = React.useState(0);
  const images = product.images ?? [];
  const current = mediaUrl(images[active]?.image ?? product.image);

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-6">
      <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-surface-muted">
        {current ? (
          <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Image
              src={current}
              alt={images[active]?.alt_text || product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          </motion.div>
        ) : (
          // Placeholder that still communicates the chemistry.
          <div className="flex size-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand-50 via-white to-emerald-50/40">
            <Beaker className="size-14 text-brand-300" aria-hidden />
            {product.chemical_formula && (
              <p className="font-display text-3xl font-bold text-brand-400">
                {product.chemical_formula}
              </p>
            )}
            <p className="text-[13px] text-slate-400">
              Product photography available on request
            </p>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const thumb = mediaUrl(image.image);
            if (!thumb) return null;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`View image ${index + 1}`}
                aria-current={index === active}
                className={cn(
                  "relative size-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  index === active
                    ? "border-[var(--brand-primary)]"
                    : "border-transparent hover:border-brand-200",
                )}
              >
                <Image
                  src={thumb}
                  alt={image.alt_text || `${product.name} thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
