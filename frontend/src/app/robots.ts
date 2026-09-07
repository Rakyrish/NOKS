import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing that renders content is blocked. The filtered catalogue and
        // knowledge URLs used to be disallowed, which also stopped crawlers
        // discovering products reachable only through a facet; every one of
        // those pages carries a self-referencing canonical, so duplicates are
        // handled there rather than by hiding the URLs.
        //
        // Only the two non-content surfaces stay out: the JSON API (not pages)
        // and the staff panel (login-walled, nothing to index).
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
