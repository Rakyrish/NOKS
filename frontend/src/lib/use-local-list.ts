"use client";

import * as React from "react";

/**
 * A small list of slugs persisted in localStorage, shared across every
 * component instance on the page (compare tray, wishlist, product cards).
 */
export function createLocalList(storageKey: string, limit = 50) {
  const listeners = new Set<(items: string[]) => void>();
  let cache: string[] | null = null;

  const read = (): string[] => {
    if (cache) return cache;
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      cache = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      cache = [];
    }
    return cache;
  };

  const write = (items: string[]) => {
    cache = items.slice(0, limit);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(cache));
    } catch {
      /* storage full or unavailable — keep the in-memory copy */
    }
    listeners.forEach((listener) => listener(cache as string[]));
  };

  return function useList() {
    const [items, setItems] = React.useState<string[]>([]);

    React.useEffect(() => {
      setItems(read());
      const listener = (next: string[]) => setItems([...next]);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);

    const toggle = React.useCallback((slug: string) => {
      const current = read();
      write(
        current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
      );
    }, []);

    const remove = React.useCallback((slug: string) => {
      write(read().filter((s) => s !== slug));
    }, []);

    const clear = React.useCallback(() => write([]), []);

    const has = React.useCallback((slug: string) => items.includes(slug), [items]);

    return { items, toggle, remove, clear, has, count: items.length };
  };
}
