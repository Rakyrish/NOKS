"""Throttles that do not mistake our own renderer for an anonymous visitor.

Every page on the marketing site is server-rendered, and that render calls this
API. Those calls arrive unauthenticated from one address — the frontend
container — so DRF counted the whole site's rendering against a single
`anon` bucket of 120 requests an hour.

The consequence only shows up under exactly the traffic SEO work is meant to
attract. Googlebot crawling the 182 product URLs makes the frontend issue 182
API calls; past request 120 the API answers 429, `request()` raises, and the
route returns HTTP 500. A crawler that meets 500s on a catalogue stops crawling
it. The audit hit this on the very first full-sitemap crawl.

Raising the anonymous rate would trade the crawl failure for weaker abuse
protection on an API that is public and unauthenticated. Instead the renderer
identifies itself with a shared secret that never reaches a browser (it is
`INTERNAL_API_TOKEN`, not `NEXT_PUBLIC_*`), and only that caller is exempt.
Genuine anonymous clients — including anyone who copies the header value they
cannot see — are throttled exactly as before.
"""

import hmac

from django.conf import settings
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

#: Set by the Next.js server-side fetch. See frontend/src/lib/api.ts.
RENDERER_HEADER = "HTTP_X_INTERNAL_RENDERER"


def is_trusted_renderer(request) -> bool:
    """True when the caller proves it is our own server-side renderer."""
    expected = getattr(settings, "INTERNAL_API_TOKEN", "") or ""
    if not expected:
        # No token configured: nothing can be trusted, so nothing is exempt.
        return False
    presented = request.META.get(RENDERER_HEADER, "")
    # Constant-time: this is a secret comparison, however low the stakes.
    return bool(presented) and hmac.compare_digest(presented, expected)


class _RendererExempt:
    """Mixin: let the trusted renderer past before any counting happens."""

    def allow_request(self, request, view):
        if is_trusted_renderer(request):
            return True
        return super().allow_request(request, view)


class RendererAwareAnonThrottle(_RendererExempt, AnonRateThrottle):
    """`AnonRateThrottle`, except our own renderer is not an anonymous visitor."""


class RendererAwareUserThrottle(_RendererExempt, UserRateThrottle):
    """`UserRateThrottle`, same exemption.

    Both classes matter. `UserRateThrottle` falls back to the client IP when
    there is no authenticated user, so an unauthenticated request is counted
    twice — once against `anon` (120/hour) and once against `user`
    (1000/hour). Exempting only the first moved the crawl failure from request
    121 to request 1001 instead of removing it; the second crawl of the
    sitemap hit it again.
    """
