import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (value: string | Date, locale = "en-KE") =>
  new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const formatNumber = (value: number, locale = "en-KE") =>
  new Intl.NumberFormat(locale).format(value);

// Image URL handling lives in lib/images.ts — `imageSrc()` for display,
// `absoluteImageUrl()`/`schemaImages()` for structured data, OG and sitemaps.
// It used to be split between a permissive `mediaUrl()` here and
// `absoluteUrl()` in lib/site.ts, which disagreed about absolute values and
// produced `https://<site>/https://res.cloudinary.com/...` in every Product
// JSON-LD. One helper, one rule.

export const truncate = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

/** Deterministic pick so server and client render the same decorative variant. */
export const pickBySeed = <T,>(items: readonly T[], seed: string): T => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return items[Math.abs(hash) % items.length];
};
