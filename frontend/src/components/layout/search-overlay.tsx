"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { api } from "@/lib/api";

type Suggestion = {
  name: string;
  slug: string;
  sku: string;
  cas_number: string;
  category: string;
};

export const SearchOverlay = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const router = useRouter();
  const [term, setTerm] = React.useState("");
  const [results, setResults] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);

  // Debounced type-ahead against the catalog.
  React.useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const data = await api.searchSuggest(term.trim());
      setResults(data);
      setActive(0);
      setLoading(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [term]);

  React.useEffect(() => {
    if (!open) {
      setTerm("");
      setResults([]);
    }
  }, [open]);

  const go = (slug?: string) => {
    onOpenChange(false);
    router.push(slug ? `/products/${slug}` : `/products?q=${encodeURIComponent(term.trim())}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]?.slug);
    }
  };

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
                className="fixed inset-0 z-[80] bg-navy-950/45 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, y: -18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-[12vh] left-1/2 z-[90] w-[calc(100%-2rem)] max-w-2xl
                           -translate-x-1/2 overflow-hidden rounded-2xl border border-line
                           bg-white shadow-[0_30px_80px_-20px_rgba(7,18,51,0.4)]"
              >
                <Dialog.Title className="sr-only">Search products</Dialog.Title>

                <div className="flex items-center gap-3 border-b border-line px-5">
                  <Search className="size-5 shrink-0 text-slate-400" />
                  <input
                    autoFocus
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Search by product, CAS number or application…"
                    className="h-16 w-full bg-transparent text-[15px] outline-none
                               placeholder:text-slate-400"
                  />
                  {loading && <Loader2 className="size-4 animate-spin text-slate-400" />}
                  <Dialog.Close
                    className="grid size-8 shrink-0 place-items-center rounded-full
                               text-slate-400 transition-colors hover:bg-surface-muted"
                    aria-label="Close search"
                  >
                    <X className="size-4" />
                  </Dialog.Close>
                </div>

                <div className="max-h-[52vh] overflow-y-auto p-2">
                  {results.length > 0 ? (
                    results.map((item, index) => (
                      <button
                        key={item.slug}
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(item.slug)}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl
                                    px-4 py-3 text-left transition-colors ${
                                      index === active ? "bg-brand-50" : "hover:bg-surface-muted"
                                    }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-navy-900">
                            {item.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {item.category}
                            {item.cas_number && ` · CAS ${item.cas_number}`}
                          </span>
                        </span>
                        <CornerDownLeft className="size-3.5 shrink-0 text-slate-400" />
                      </button>
                    ))
                  ) : term.trim().length >= 2 && !loading ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm text-slate-500">
                        No product matches “{term}”.
                      </p>
                      <button
                        type="button"
                        onClick={() => go()}
                        className="mt-2 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
                      >
                        Search the full catalog anyway
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      Try “caustic soda”, “7647-01-0” or “water treatment”.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-line
                                bg-surface-muted px-5 py-2.5 text-[11px] text-slate-500">
                  <span>↑ ↓ to navigate · ↵ to open · esc to close</span>
                  <span className="font-medium">NOKS catalog</span>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
