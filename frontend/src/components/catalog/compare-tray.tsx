"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GitCompare, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCompare } from "@/lib/use-compare";

/** Docked tray listing the products queued for comparison. */
export const CompareTray = () => {
  const { items, remove, clear, count } = useCompare();

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-lg"
        >
          <div className="container-noks flex flex-wrap items-center gap-4 py-4">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-navy-900">
              <GitCompare className="size-4 text-[var(--brand-primary)]" />
              Compare ({count}/4)
            </span>

            <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
              {items.map((slug) => (
                <li key={slug}>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted
                               py-1.5 pr-2 pl-3 text-[12.5px] font-medium text-slate-600 capitalize"
                  >
                    {slug.replace(/-/g, " ")}
                    <button
                      type="button"
                      onClick={() => remove(slug)}
                      aria-label={`Remove ${slug.replace(/-/g, " ")} from comparison`}
                      className="grid size-4 place-items-center rounded-full text-slate-400 hover:text-navy-900"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clear}
                className="text-[12.5px] font-semibold text-slate-400 hover:text-navy-900"
              >
                Clear
              </button>
              <Button asChild size="sm" disabled={count < 2}>
                <Link href={`/compare?slugs=${items.join(",")}`}>Compare now</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
