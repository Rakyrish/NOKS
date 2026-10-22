"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import { analyticsContext, clickEvent, consentKey, measurementId, trackEvent } from "@/lib/analytics";

type Consent = "accepted" | "declined";

export function AnalyticsConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = React.useState<Consent | null>(null);
  const [ready, setReady] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const lastPage = React.useRef("");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(consentKey);
      if (saved === "accepted" || saved === "declined") setChoice(saved);
      else setOpen(true);
    } catch { setOpen(true); }
    setReady(true);
  }, []);

  React.useEffect(() => {
    window.noksAnalyticsActive = choice === "accepted";
    if (choice !== "accepted") {
      // Disables future collection if consent is withdrawn after loading.
      (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = true;
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      lastPage.current = "";
      return;
    }
    (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = false;
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer!.push(arguments); };
      window.gtag("consent", "default", {
        analytics_storage: "denied", ad_storage: "denied",
        ad_user_data: "denied", ad_personalization: "denied",
      });
      window.gtag("js", new Date());
      window.gtag("config", measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: window.location.hostname,
        page_location: window.location.origin + window.location.pathname,
        page_referrer: "",
        page_title: "NOKS Chemical Division",
      });
      const script = document.createElement("script");
      script.id = "noks-google-analytics";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }
    window.gtag("consent", "update", { analytics_storage: "granted" });
    if (lastPage.current !== pathname) {
      lastPage.current = pathname;
      window.gtag("event", "page_view", {
        send_to: measurementId,
        ...analyticsContext(pathname),
        page_location: window.location.origin + pathname,
        page_referrer: "",
        page_title: "NOKS Chemical Division",
      });
    }
  }, [choice, pathname]);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const type = clickEvent(link.href, window.location.origin);
      if (!type) return;
      const slug = link.closest<HTMLElement>("[data-product-slug]")?.dataset.productSlug
        || (type === "request_quote_click" ? new URL(link.href).searchParams.get("product") || undefined : undefined);
      trackEvent(type, slug);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function choose(next: Consent) {
    setChoice(next);
    try { localStorage.setItem(consentKey, next); } catch { /* Session choice still applies. */ }
    if (next === "declined") {
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.trim().split("=")[0];
        if (!/^_ga($|_)/.test(name)) continue;
        for (const domain of ["", window.location.hostname, `.${window.location.hostname}`]) {
          document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""} SameSite=Lax; Secure`;
        }
      }
    }
    setOpen(false);
  }

  if (!ready) return null;
  return open ? (
    <section aria-label="Analytics preferences" className="fixed bottom-4 left-4 right-4 z-[110] max-w-md rounded-xl border border-line bg-white p-4 shadow-xl">
      <p className="font-semibold text-navy-900">Optional analytics</p>
      <p className="mt-2 text-sm text-slate-700">Allow Google Analytics cookies to help us understand website visits and enquiry actions? Forms and contact links work either way. We do not send your form details to Analytics.</p>
      <div className="mt-3 flex gap-3">
        <button type="button" onClick={() => choose("accepted")} className="rounded-lg bg-navy-900 px-4 py-2 text-sm text-white">Accept analytics</button>
        <button type="button" onClick={() => choose("declined")} className="rounded-lg border border-line px-4 py-2 text-sm text-navy-900">Decline analytics</button>
      </div>
    </section>
  ) : <button type="button" onClick={() => setOpen(true)} className="fixed bottom-2 left-2 z-[80] rounded-md border border-line bg-white px-2 py-1 text-xs text-slate-600 shadow-sm">Analytics preferences</button>;
}
