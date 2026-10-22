export const measurementId = "G-KV3L9112Z1";
export const consentKey = "noks-analytics-consent-v1";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    noksAnalyticsActive?: boolean;
  }
}

/** Only allow catalogue identifiers and paths, never URL queries or form values. */
export function analyticsContext(path: string, productSlug?: string) {
  const pagePath = path.split(/[?#]/)[0];
  const slug = productSlug || /^\/products\/([a-z0-9-]+)$/.exec(pagePath)?.[1];
  return {
    page_path: pagePath,
    ...(slug && /^[a-z0-9-]+$/.test(slug) ? { product_id: slug } : {}),
  };
}

export function trackEvent(
  event: "generate_lead" | "phone_click" | "email_click" | "whatsapp_click" | "request_quote_click",
  productSlug?: string,
) {
  if (typeof window === "undefined" || !window.noksAnalyticsActive) return;
  window.gtag?.("event", event, {
    send_to: measurementId,
    page_location: window.location.origin + window.location.pathname,
    page_referrer: "",
    page_title: "NOKS Chemical Division",
    ...analyticsContext(window.location.pathname, productSlug),
  });
}

const leadReceipts = new Set<string>();
/** A replayed successful receipt must not count as another lead. */
export function trackLead(receipt: string, productSlug?: string) {
  if (typeof window === "undefined" || !window.noksAnalyticsActive || leadReceipts.has(receipt)) return;
  leadReceipts.add(receipt);
  // Receipt identifiers are only used locally, not sent to Analytics.
  trackEvent("generate_lead", productSlug);
}

export function clickEvent(href: string, origin: string) {
  if (href.startsWith("tel:")) return "phone_click" as const;
  if (href.startsWith("mailto:")) return "email_click" as const;
  try {
    const url = new URL(href, origin);
    if (["wa.me", "api.whatsapp.com", "www.whatsapp.com"].includes(url.hostname)) return "whatsapp_click" as const;
    if (url.origin === origin && url.pathname === "/quote") return "request_quote_click" as const;
  } catch { /* Not a navigable link. */ }
  return null;
}
