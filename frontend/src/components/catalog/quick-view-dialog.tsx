"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Beaker, Download, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AvailabilityBadge, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/utils";

export const QuickViewDialog = ({
  slug,
  open,
  onOpenChange,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.product(slug),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const image = mediaUrl(product?.image ?? null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-navy-950/50 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-1/2 left-1/2 z-[90] max-h-[88vh] w-[calc(100%-2rem)]
                           max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto
                           rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(7,18,51,0.5)]"
              >
                <Dialog.Close
                  className="absolute top-4 right-4 z-10 grid size-9 place-items-center
                             rounded-full bg-white/90 text-slate-500 shadow-[var(--shadow-soft)]
                             transition-colors hover:bg-surface-muted hover:text-navy-900"
                  aria-label="Close quick view"
                >
                  <X className="size-4" />
                </Dialog.Close>

                {isLoading || !product ? (
                  <div className="grid h-72 place-items-center">
                    <Loader2 className="size-6 animate-spin text-[var(--brand-primary)]" />
                    <Dialog.Title className="sr-only">Loading product</Dialog.Title>
                  </div>
                ) : (
                  <div className="grid gap-0 sm:grid-cols-[minmax(0,0.85fr)_1fr]">
                    <div className="relative grid aspect-square place-items-center bg-surface-muted">
                      {image ? (
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 40vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Beaker className="size-12 text-brand-300" aria-hidden />
                          {product.chemical_formula && (
                            <span className="font-display text-2xl font-bold text-brand-400">
                              {product.chemical_formula}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-6 sm:p-7">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge size="sm">{product.grade_display}</Badge>
                        <AvailabilityBadge
                          availability={product.availability}
                          label={product.availability_display}
                        />
                      </div>

                      <Dialog.Title className="mt-3 font-display text-xl leading-tight font-bold text-navy-900">
                        {product.name}
                      </Dialog.Title>

                      <Dialog.Description className="mt-2.5 text-[14px] leading-relaxed text-slate-600">
                        {product.short_description}
                      </Dialog.Description>

                      <dl className="mt-5 space-y-2 rounded-xl bg-surface-muted p-4 text-[13px]">
                        <Row label="SKU" value={product.sku} />
                        {product.cas_number && <Row label="CAS number" value={product.cas_number} />}
                        {product.chemical_formula && (
                          <Row label="Formula" value={product.chemical_formula} />
                        )}
                        {product.purity && <Row label="Purity" value={product.purity} />}
                        <Row label="Category" value={product.category_name} />
                        {product.packaging_options?.length > 0 && (
                          <Row label="Packaging" value={product.packaging_options.join(", ")} />
                        )}
                        {product.lead_time && <Row label="Lead time" value={product.lead_time} />}
                      </dl>

                      {product.applications?.length > 0 && (
                        <div className="mt-5">
                          <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                            Key applications
                          </p>
                          <ul className="mt-2 flex flex-wrap gap-1.5">
                            {product.applications.slice(0, 4).map((application) => (
                              <li
                                key={application}
                                className="rounded-full bg-brand-50 px-3 py-1 text-[12px] text-brand-700"
                              >
                                {application}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap gap-2">
                        <Button asChild size="sm">
                          <Link href={`/quote?product=${product.slug}`}>Request Quote</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/products/${product.slug}`}>
                            Full details
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                        {product.documents?.[0] && (
                          <Button asChild size="sm" variant="ghost">
                            <a
                              href={product.documents[0].file}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="size-3.5" />
                              Datasheet
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <dt className="shrink-0 text-slate-400">{label}</dt>
    <dd className="text-right font-medium text-slate-700">{value}</dd>
  </div>
);
