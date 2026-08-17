"""Server-side URL fetching for admin-only features: adding a product image
by pasting its URL, and reading that same image for AI vision drafting.

Every caller here is a staff user authenticated through the admin API — this
is never reachable from the public site — but the URL itself is arbitrary
admin-supplied input, so it still gets minimal SSRF hardening: http(s) only,
and the resolved address must not be a private/loopback/link-local one. That
stops a compromised or careless admin session from using this as a probe
against internal services (e.g. the db/redis containers, or a cloud metadata
endpoint), which staff-only auth alone wouldn't prevent.
"""

import ipaddress
import socket
from urllib.parse import urlparse

import requests

USER_AGENT = "NOKS-Admin-Bot/1.0 (+internal product research tool)"


class UnsafeUrlError(Exception):
    """URL is malformed, unresolvable, or points at a non-public address."""


def _assert_public_http_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise UnsafeUrlError("Only http:// or https:// URLs are supported.")
    if not parsed.hostname:
        raise UnsafeUrlError("That URL doesn't have a hostname.")
    try:
        infos = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror as exc:
        raise UnsafeUrlError(f"Could not resolve host: {exc}") from exc
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise UnsafeUrlError("That URL resolves to a non-public address.")


def fetch_image_bytes(url: str, *, max_bytes: int = 8_000_000, timeout: int = 10) -> tuple[bytes, str]:
    """Fetch a URL and return (bytes, file_extension). Raises UnsafeUrlError
    if it's not reachable, not an image, or larger than max_bytes."""
    _assert_public_http_url(url)
    try:
        response = requests.get(
            url, timeout=timeout, headers={"User-Agent": USER_AGENT}, stream=True
        )
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "")
        if not content_type.startswith("image/"):
            raise UnsafeUrlError("That URL didn't return an image.")
        data = response.raw.read(max_bytes + 1, decode_content=True)
    except requests.RequestException as exc:
        raise UnsafeUrlError(f"Could not fetch that URL: {exc}") from exc

    if len(data) > max_bytes:
        raise UnsafeUrlError("That image is larger than 8MB.")

    ext = content_type.split("/")[-1].split(";")[0].strip().lower() or "jpg"
    if ext == "jpeg":
        ext = "jpg"
    if ext not in {"jpg", "png", "webp", "gif"}:
        ext = "jpg"
    return data, ext
