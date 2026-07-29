"use client";

import { motion } from "framer-motion";
import { Eye, FileText, GitCompare, Heart, Beaker, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { AvailabilityBadge, Badge } from "@/components/ui";
import { useCompare } from "@/lib/use-compare";
import { useWishlist } from "@/lib/use-wishlist";
import { cn, mediaUrl } from "@/lib/utils";
import type { Product } from "@/types";

import { QuickViewDialog } from "./quick-view-dialog";

const GRADE_VARIANT: Record<string, "brand" | "emerald" | "amber" | "navy" | "neutral"> = {
  food: "emerald",
  laboratory: "brand",
  pharma: "navy",
  technical: "neutral",
  industrial: "neutral",
};

export const ProductCard = ({
  product,
  view = "grid",
  index = 0,
}: {
  product: Product;
  view?: "grid" | "list";
  index?: number;
}) => {
  const [quickView, setQuickView] = React.useState(false);
  const { toggle: toggleCompare, has: inCompare } = useCompare();
  const { toggle: toggleWishlist, has: inWishlist } = useWishlist();

  const image = mediaUrl(product.image);
  const href = `/products/${product.slug}`;

  const actions = (
    <div className="flex items-center gap-1.5">
      <IconAction
        label="Quick view"
        active={false}
        onClick={() => setQuickView(true)}
        Icon={Eye}
      />
      <IconAction
        label={inCompare(product.slug) ? "Remove from compare" : "Add to compare"}
        active={inCompare(product.slug)}
        onClick={() => toggleCompare(product.slug)}
        Icon={GitCompare}
      />
      <IconAction
        label={inWishlist(product.slug) ? "Remove from wishlist" : "Save to wishlist"}
        active={inWishlist(product.slug)}
        onClick={() => toggleWishlist(product.slug)}
        Icon={Heart}
      />
    </div>
  );

  if (view === "list") {
    return (
      <>
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
          className="group grid gap-5 rounded-2xl border border-line bg-white p-5
                     transition-all duration-300 hover:border-brand-200
                     hover:shadow-[var(--shadow-lift)] sm:grid-cols-[132px_1fr]"
        >
          <Link
            href={href}
            className="relative grid aspect-4/3 place-items-center overflow-hidden
                       rounded-xl bg-surface-muted sm:aspect-square"
          >
            <ProductVisual image={image} product={product} />
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={GRADE_VARIANT[product.grade] ?? "neutral"} size="sm">
                {product.grade_display}
              </Badge>
              <AvailabilityBadge
                availability={product.availability}
                label={product.availability_display}
              />
              {product.is_bestseller && (
                <Badge variant="amber" size="sm">
                  Bestseller
                </Badge>
              )}
            </div>

            <h3 className="mt-2.5 font-display text-[17px] font-bold text-navy-900">
              <Link href={href} className="transition-colors hover:text-[var(--brand-primary)]">
                {product.name}
              </Link>
            </h3>

            <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-slate-500">
              {product.short_description}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-400">
              <span>SKU {product.sku}</span>
              {product.cas_number && <span>CAS {product.cas_number}</span>}
              {product.chemical_formula && <span>{product.chemical_formula}</span>}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              {actions}
              <div className="flex items-center gap-2">
                <Link
                  href={href}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border
                             border-line px-4 text-[13px] font-semibold text-navy-900
                             transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <FileText className="size-3.5" />
                  Details
                </Link>
                <Link
                  href={`/quote?product=${product.slug}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full
                             bg-[var(--brand-primary)] px-4 text-[13px] font-semibold text-white
                             transition-colors hover:bg-[var(--brand-primary-dark)]"
                >
                  <Send className="size-3.5" />
                  Quick Quote
                </Link>
              </div>
            </div>
          </div>
        </motion.article>

        <QuickViewDialog slug={product.slug} open={quickView} onOpenChange={setQuickView} />
      </>
    );
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.35) }}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line
                   bg-white transition-all duration-300 hover:-translate-y-1
                   hover:border-brand-200 hover:shadow-[var(--shadow-lift)]"
      >
        <Link
          href={href}
          className="relative grid aspect-4/3 place-items-center overflow-hidden bg-surface-muted"
        >
          <ProductVisual image={image} product={product} />

          {product.is_bestseller && (
            <Badge variant="amber" size="sm" className="absolute top-3 left-3">
              Bestseller
            </Badge>
          )}

          {/* Hover action rail */}
          <div
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center
                       justify-center gap-1.5 bg-gradient-to-t from-white via-white/95
                       to-transparent p-3 transition-transform duration-300
                       group-hover:translate-y-0"
          >
            {actions}
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={GRADE_VARIANT[product.grade] ?? "neutral"} size="sm">
              {product.grade_display}
            </Badge>
            <AvailabilityBadge
              availability={product.availability}
              label={product.availability_display}
            />
          </div>

          <h3 className="mt-3 font-display text-[16px] leading-snug font-bold text-navy-900">
            <Link href={href} className="transition-colors hover:text-[var(--brand-primary)]">
              {product.name}
            </Link>
          </h3>

          <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-slate-500">
            {product.short_description}
          </p>

          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Category</dt>
              <dd className="truncate font-medium text-slate-600">{product.category_name}</dd>
            </div>
            {product.cas_number && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">CAS</dt>
                <dd className="font-medium text-slate-600">{product.cas_number}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex gap-2">
            <Link
              href={href}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-full
                         border border-line text-[13px] font-semibold text-navy-900
                         transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              Details
            </Link>
            <Link
              href={`/quote?product=${product.slug}`}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-full
                         bg-[var(--brand-primary)] text-[13px] font-semibold text-white
                         transition-colors hover:bg-[var(--brand-primary-dark)]"
            >
              Quick Quote
            </Link>
          </div>
        </div>
      </motion.article>

      <QuickViewDialog slug={product.slug} open={quickView} onOpenChange={setQuickView} />
    </>
  );
};

/* ── Pieces ─────────────────────────────────────────────────── */

const ProductVisual = ({ image, product }: { image: string | null; product: Product }) =>
  image ? (
    <Image
      src={image}
      alt={product.name}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover transition-transform duration-500 group-hover:scale-105"
    />
  ) : (
    // No photograph yet — render a branded chemical placeholder rather than a broken frame.
    <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-50 to-white">
      <Beaker className="size-9 text-brand-300" aria-hidden />
      {product.chemical_formula && (
        <span className="font-display text-lg font-bold text-brand-400">
          {product.chemical_formula}
        </span>
      )}
    </div>
  );

const IconAction = ({
  label,
  Icon,
  onClick,
  active,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active: boolean;
}) => (
  <button
    type="button"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    }}
    title={label}
    aria-label={label}
    aria-pressed={active}
    className={cn(
      "grid size-9 place-items-center rounded-full border transition-all",
      active
        ? "border-brand-300 bg-brand-50 text-[var(--brand-primary)]"
        : "border-line bg-white text-slate-400 hover:border-brand-300 hover:bg-brand-50 hover:text-[var(--brand-primary)]",
    )}
  >
    <Icon className={cn("size-4", active && "fill-current")} />
  </button>
);
