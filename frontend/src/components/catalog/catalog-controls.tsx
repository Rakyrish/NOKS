"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Facets } from "@/types";

const SORT_OPTIONS = [
  { value: "", label: "Most relevant" },
  { value: "name", label: "Name (A–Z)" },
  { value: "-name", label: "Name (Z–A)" },
  { value: "-created_at", label: "Newest first" },
  { value: "-quote_count", label: "Most requested" },
  { value: "-view_count", label: "Most viewed" },
] as const;

export const GRADE_LABELS: Record<string, string> = {
  industrial: "Industrial grade",
  technical: "Technical grade",
  laboratory: "Laboratory / analytical",
  food: "Food grade",
  pharma: "Pharmaceutical grade",
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  made_to_order: "Made to order",
  out_of_stock: "Out of stock",
};

/** Multi-value params are stored as repeated keys, matching DRF's expectation. */
const MULTI_KEYS = new Set(["grade", "availability"]);
const NON_FILTER_KEYS = ["page", "view", "ordering", "q"];

/** Shared filter state — the toolbar and the rail both drive the same URL. */
export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page"); // any filter change resets pagination
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const toggleValue = React.useCallback(
    (key: string, value: string) =>
      update((params) => {
        if (MULTI_KEYS.has(key)) {
          const current = params.getAll(key);
          params.delete(key);
          const next = current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value];
          next.forEach((item) => params.append(key, item));
        } else if (params.get(key) === value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }),
    [update],
  );

  const isChecked = React.useCallback(
    (key: string, value: string) =>
      MULTI_KEYS.has(key)
        ? searchParams.getAll(key).includes(value)
        : searchParams.get(key) === value,
    [searchParams],
  );

  const activeFilters = React.useMemo(() => {
    const chips: { key: string; value: string; label: string }[] = [];
    searchParams.forEach((value, key) => {
      if (NON_FILTER_KEYS.includes(key)) return;
      const label =
        key === "grade"
          ? (GRADE_LABELS[value] ?? value)
          : key === "availability"
            ? (AVAILABILITY_LABELS[value] ?? value)
            : value.replace(/-/g, " ");
      chips.push({ key, value, label });
    });
    return chips;
  }, [searchParams]);

  const clearAll = React.useCallback(
    () =>
      update((params) => {
        Array.from(params.keys()).forEach((key) => {
          if (key !== "view") params.delete(key);
        });
      }),
    [update],
  );

  return { searchParams, update, toggleValue, isChecked, activeFilters, clearAll };
}

/* ── Toolbar ───────────────────────────────────────────────── */

export const CatalogToolbar = ({
  facets,
  view,
  onViewChange,
  total,
}: {
  facets: Facets;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  total: number;
}) => {
  const { searchParams, update, toggleValue, activeFilters, clearAll } = useCatalogFilters();
  const [term, setTerm] = React.useState(searchParams.get("q") ?? "");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => setTerm(searchParams.get("q") ?? ""), [searchParams]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            update((params) => {
              if (term.trim()) params.set("q", term.trim());
              else params.delete("q");
            });
          }}
          className="relative min-w-0 flex-1"
        >
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="catalog-search" className="sr-only">
            Search the catalog
          </label>
          <input
            id="catalog-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search by name, CAS number, formula or application…"
            className="h-11 w-full rounded-full border border-line bg-white pr-4 pl-11 text-sm
                       transition-all placeholder:text-slate-400 focus:border-brand-500
                       focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
          />
        </form>

        <label htmlFor="catalog-sort" className="sr-only">
          Sort products
        </label>
        <select
          id="catalog-sort"
          value={searchParams.get("ordering") ?? ""}
          onChange={(event) =>
            update((params) => {
              if (event.target.value) params.set("ordering", event.target.value);
              else params.delete("ordering");
            })
          }
          className="h-11 cursor-pointer rounded-full border border-line bg-white px-4 text-[13px]
                     font-medium transition-colors hover:border-brand-300 focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex h-11 items-center gap-0.5 rounded-full border border-line bg-white p-1">
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewChange(mode)}
              aria-label={`${mode} view`}
              aria-pressed={view === mode}
              className={cn(
                "grid size-9 place-items-center rounded-full transition-colors",
                view === mode
                  ? "bg-[var(--brand-primary)] text-white"
                  : "text-slate-400 hover:bg-surface-muted hover:text-navy-900",
              )}
            >
              {mode === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeFilters.length > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-[var(--brand-primary)] text-[11px] text-white">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] text-slate-400">
            {total} result{total === 1 ? "" : "s"} ·
          </span>
          {activeFilters.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() => toggleValue(chip.key, chip.value)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pr-2 pl-3
                         text-[12.5px] font-medium text-brand-700 capitalize transition-colors
                         hover:bg-brand-100"
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-[12.5px] font-semibold text-slate-400 underline-offset-2 hover:text-navy-900 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[70] bg-navy-950/45 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              role="dialog"
              aria-label="Filters"
              className="fixed inset-y-0 right-0 z-[75] w-[86%] max-w-sm overflow-y-auto
                         bg-white p-6 shadow-2xl lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="font-display text-lg font-bold text-navy-900">Filters</p>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                  className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-surface-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              <FilterRail facets={facets} />

              <div className="sticky bottom-0 -mx-6 mt-8 border-t border-line bg-white px-6 pt-4 pb-2">
                <Button className="w-full" onClick={() => setDrawerOpen(false)}>
                  Show {total} result{total === 1 ? "" : "s"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Filter rail ───────────────────────────────────────────── */

export const FilterRail = ({ facets }: { facets: Facets }) => {
  const { searchParams, update, toggleValue, isChecked } = useCatalogFilters();

  return (
    <div className="space-y-7">
      <FilterGroup
        title="Category"
        paramKey="category"
        items={facets.categories.map((item) => ({
          value: item.value ?? "",
          label: item.label,
          count: item.count,
        }))}
        isChecked={isChecked}
        onToggle={toggleValue}
      />
      <FilterGroup
        title="Industry"
        paramKey="industry"
        items={facets.industries.map((item) => ({
          value: item.value ?? "",
          label: item.label,
          count: item.count,
        }))}
        isChecked={isChecked}
        onToggle={toggleValue}
      />
      <FilterGroup
        title="Grade"
        paramKey="grade"
        items={facets.grades.map((item) => ({
          value: item.grade,
          label: GRADE_LABELS[item.grade] ?? item.grade,
          count: item.count,
        }))}
        isChecked={isChecked}
        onToggle={toggleValue}
      />
      <FilterGroup
        title="Availability"
        paramKey="availability"
        items={facets.availability.map((item) => ({
          value: item.availability,
          label: AVAILABILITY_LABELS[item.availability] ?? item.availability,
          count: item.count,
        }))}
        isChecked={isChecked}
        onToggle={toggleValue}
      />
      <FilterGroup
        title="Package size"
        paramKey="package_size"
        items={facets.package_sizes.map((item) => ({
          value: item.label,
          label: item.label,
          count: item.count,
        }))}
        isChecked={isChecked}
        onToggle={toggleValue}
      />
      <FilterGroup
        title="Brand"
        paramKey="manufacturer"
        items={facets.manufacturers.map((item) => ({
          value: item.value ?? "",
          label: item.label,
          count: item.count,
        }))}
        isChecked={isChecked}
        onToggle={toggleValue}
      />

      {/* CAS lookup — chemical buyers search by number, not name. */}
      <div>
        <p className="mb-2.5 text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
          CAS number
        </p>
        <input
          defaultValue={searchParams.get("cas_number") ?? ""}
          onBlur={(event) =>
            update((params) => {
              const value = event.target.value.trim();
              if (value) params.set("cas_number", value);
              else params.delete("cas_number");
            })
          }
          placeholder="e.g. 1310-73-2"
          className="h-10 w-full rounded-xl border border-line bg-white px-3.5 text-[13px]
                     transition-all placeholder:text-slate-400 focus:border-brand-500
                     focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
        />
      </div>
    </div>
  );
};

const FilterGroup = ({
  title,
  items,
  paramKey,
  isChecked,
  onToggle,
}: {
  title: string;
  items: { value: string; label: string; count: number }[];
  paramKey: string;
  isChecked: (key: string, value: string) => boolean;
  onToggle: (key: string, value: string) => void;
}) => {
  const [expanded, setExpanded] = React.useState(false);
  if (!items.length) return null;

  const visible = expanded ? items : items.slice(0, 6);

  return (
    <div>
      <p className="mb-2.5 text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
        {title}
      </p>
      <ul className="space-y-0.5">
        {visible.map((item) => {
          const checked = isChecked(paramKey, item.value);
          return (
            <li key={item.value}>
              <button
                type="button"
                onClick={() => onToggle(paramKey, item.value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13.5px] transition-colors",
                  checked
                    ? "bg-brand-50 font-semibold text-[var(--brand-primary)]"
                    : "text-slate-600 hover:bg-surface-muted",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                    checked
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]"
                      : "border-slate-300 bg-white",
                  )}
                  aria-hidden
                >
                  {checked && (
                    <svg viewBox="0 0 12 12" className="size-2.5 text-white" fill="none">
                      <path
                        d="M2 6l2.5 2.5L10 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="shrink-0 text-[11.5px] text-slate-400">{item.count}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {items.length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1.5 px-2 text-[12.5px] font-semibold text-[var(--brand-primary)] hover:underline"
        >
          {expanded ? "Show less" : `Show ${items.length - 6} more`}
        </button>
      )}
    </div>
  );
};
