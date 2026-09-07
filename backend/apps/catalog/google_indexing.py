"""Google Indexing API client.

Pushes a single product URL into Google's crawl queue so a newly published
(or edited, or removed) product doesn't have to wait for the next crawl of
/sitemap.xml to be picked up. Configured entirely from the root .env — see
settings.GOOGLE_INDEXING_CREDENTIALS_JSON / GOOGLE_INDEXING_ENABLED.

Never raises: a Search Console outage, a revoked key, or a network blip must
never break product publishing. Callers already run this out-of-band via
apps.catalog.tasks, so failures are logged and swallowed here too, as a
second line of defence.
"""

import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

_INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing"
_INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"

_session = None


def _get_session():
    global _session
    if _session is not None:
        return _session

    from google.auth.transport.requests import AuthorizedSession
    from google.oauth2 import service_account

    info = json.loads(settings.GOOGLE_INDEXING_CREDENTIALS_JSON)
    credentials = service_account.Credentials.from_service_account_info(
        info, scopes=[_INDEXING_SCOPE]
    )
    _session = AuthorizedSession(credentials)
    return _session


def submit_url(url: str, action: str = "URL_UPDATED") -> bool:
    """Notify Google that `url` was published/edited (URL_UPDATED) or removed
    (URL_DELETED). Returns True on a 200 from Google, False otherwise —
    callers treat this as best-effort and never let it block a request."""
    if not settings.GOOGLE_INDEXING_ENABLED:
        return False

    try:
        session = _get_session()
        response = session.post(
            _INDEXING_ENDPOINT,
            json={"url": url, "type": action},
            timeout=10,
        )
    except Exception:
        logger.exception("Google Indexing API request failed for %s (%s)", url, action)
        # A bad key or malformed JSON leaves a stale AuthorizedSession behind —
        # drop it so the next call re-reads settings instead of repeating the
        # same failure for the life of the process.
        global _session
        _session = None
        return False

    if response.status_code >= 400:
        logger.warning(
            "Google Indexing API rejected %s (%s): %s %s",
            url, action, response.status_code, response.text,
        )
        return False

    logger.info("Google Indexing API accepted %s (%s)", url, action)
    return True
