"""OpenAI-assisted product drafting for the admin control panel.

Given a chemical name (plus optional CAS number / category / notes), draft
the full set of catalog + SEO + safety fields a staff member would otherwise
type by hand — description, applications, benefits, specifications, CAS/HS
identifiers, hazard/storage data, and meta title/description/keywords. The
draft is returned to the admin UI for review; nothing here ever touches the
database.

Uses the OpenAI Responses API (not Chat Completions). The built-in
`web_search` tool is optional and OFF by default, purely on cost: OpenAI
bills a search at $25 per 1k calls, which is ~15x what everything else in a
draft costs put together. Two modes, and the system prompt differs between
them:

* OPENAI_WEB_SEARCH_ENABLED=False (default) — no search tool. Identifiers
  and safety data may not be answered from training data, so the model is
  told to leave anything it can't be certain of empty and list it in
  confidence_note for the admin to look up. A draft costs about $0.0012 from
  a name and $0.0015 from a photo, against
  settings.OPENAI_DRAFT_COST_BUDGET_USD ($0.0025).
* OPENAI_WEB_SEARCH_ENABLED=True — the model looks identifiers and GHS data
  up against live sources and says so in confidence_note when it can't
  verify one. Costs ~$0.026-0.03 a draft — the search calls, not the tokens.
  OPENAI_MODEL must then be a Responses-API model supporting web_search
  (the gpt-4.1 line does); plain chat models like gpt-4o-mini don't.

Either way generate_product_draft() prices the response from its own usage
numbers and logs a WARNING if a draft came in over the budget, so a config
change that makes drafting 30x more expensive shows up in the logs rather
than only on the invoice.

If the admin has pasted a product photo URL, the same image doubles as vision
input: we fetch it once (through the same SSRF-guarded fetch used to store it
as the product's actual photo — see apps.catalog.admin_views.save_image_from_url)
and hand it to the model alongside the text prompt, so a label the admin can't
be bothered to retype (grade, purity, net weight, appearance) gets read
straight off the packaging instead of guessed at.

Hazard class, safety information and storage/handling are drafted too, but
this is high-stakes data — wrong hazard or storage guidance can cause real
harm, not just a bad catalog listing. generate_product_draft() therefore
always appends a fixed reminder to confidence_note whenever any of those
three fields comes back non-empty, regardless of what the model itself says,
so the admin UI can't silently drop the "verify against the actual supplier
SDS" warning. With search on, the model is instructed to source them from
authoritative GHS/SDS references; with search off it is told to leave all
three empty. Either way: never infer classification from a photo or a
chemical's general reputation, and leave a field blank rather than guess.
"""

from __future__ import annotations

import base64
import json
import logging
from collections.abc import Sequence
from copy import deepcopy

from django.conf import settings

logger = logging.getLogger(__name__)

_ALLOWED_GRADES = ["industrial", "technical", "laboratory", "food", "pharma"]

# Field descriptions are deliberately terse: every one is re-sent on every
# request, and the rules they used to restate at length live in
# _SYSTEM_PROMPT, which is the cached prefix. Keep any rule in exactly one of
# the two — duplicating it across both is what made a draft cost ~2k tokens
# of fixed overhead before the prompt/schema trim.
_BASE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "suggested_name": {
            "type": "string",
            "description": (
                "Product name. Echo back a given name (capitalization cleanup "
                "only); otherwise identify it from the photo and propose a "
                "specific, buyer-searchable name. Empty only if neither given."
            ),
        },
        "chemical_formula": {"type": "string"},
        "cas_number": {
            "type": "string",
            "description": (
                "CAS Registry Number, e.g. '7647-14-5'. Correct a given one if "
                "wrong. Empty if unconfirmed."
            ),
        },
        "hs_code": {
            "type": "string",
            "description": "HS customs tariff code, e.g. '2828.90'. Empty if unconfirmed.",
        },
        "synonyms": {"type": "string", "description": "Comma separated alternative names."},
        "grade": {"type": "string", "enum": _ALLOWED_GRADES},
        "purity": {"type": "string", "description": "e.g. '≥ 98%'"},
        "short_description": {
            "type": "string",
            "description": "One sentence, max ~200 characters, for catalog cards.",
        },
        "description": {"type": "string"},
        "applications": {"type": "array", "items": {"type": "string"}},
        "benefits": {"type": "array", "items": {"type": "string"}},
        "specifications": {
            "type": "array",
            "description": (
                "Physical/chemical reference data only (Appearance, Molecular "
                "Weight, Solubility, pH) — never hazard/GHS/UN/storage data. "
                "A list of {name, value} pairs because strict mode can't "
                "express a free-form object; generate_product_draft() reshapes "
                "it into the dict Product.specifications expects."
            ),
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "value": {"type": "string"},
                },
                "required": ["name", "value"],
            },
        },
        "packaging_options": {"type": "array", "items": {"type": "string"}},
        "hazard_class": {
            "type": "string",
            "description": (
                "GHS classification / signal word for this exact substance and "
                "grade, e.g. 'GHS05 Corrosive, GHS07 Harmful — Danger'. "
                "Sourced per the high-stakes rule; empty if unconfirmed."
            ),
        },
        "safety_information": {
            "type": "string",
            "description": (
                "The full list of applicable GHS hazard (H) and precautionary "
                "(P) statements for this exact substance, each with its code "
                "and text — not a summary. Sourced per the high-stakes rule; "
                "empty if unconfirmed."
            ),
        },
        "storage_handling": {
            "type": "string",
            "description": (
                "Temperature, ventilation, incompatible materials, PPE. Sourced "
                "per the high-stakes rule; empty if unconfirmed."
            ),
        },
        "meta_title": {
            "type": "string",
            "description": "SEO title tag, 50-60 characters. Lead with the product name.",
        },
        "meta_description": {
            "type": "string",
            "description": "SEO meta description, 140-160 characters.",
        },
        "meta_keywords": {
            "type": "string",
            "description": (
                "5-10 comma separated B2B search phrases — name, synonyms, CAS, "
                "grade, applications."
            ),
        },
        "confidence_note": {
            "type": "string",
            "description": (
                "One short sentence flagging anything unsure or unfound. Empty if none."
            ),
        },
    },
    "required": [
        "suggested_name",
        "chemical_formula",
        "cas_number",
        "hs_code",
        "synonyms",
        "grade",
        "purity",
        "short_description",
        "description",
        "applications",
        "benefits",
        "specifications",
        "packaging_options",
        "hazard_class",
        "safety_information",
        "storage_handling",
        "meta_title",
        "meta_description",
        "meta_keywords",
        "confidence_note",
    ],
}


def _response_schema(industry_choices: Sequence[str] = ()) -> dict:
    """The strict json_schema for one draft.

    Built per request rather than kept as a constant because `industries` can
    only be an enum of the Industry rows that actually exist — which makes a
    drafted industry a row the admin form can tick, not a plausible label like
    "Pharmaceuticals" that this catalog has no listing for. The list is stable
    between drafts, so the schema stays a cacheable prefix (see
    prompt_cache_key below); it changes only when someone adds an industry.
    """
    schema = deepcopy(_BASE_SCHEMA)
    if industry_choices:
        schema["properties"]["industries"] = {
            "type": "array",
            "description": (
                "Industries from the allowed list that this product is genuinely "
                "sold into. Pick every one that fits and no more — an empty list "
                "is better than a loose fit."
            ),
            "items": {"type": "string", "enum": list(industry_choices)},
        }
        # strict mode requires every property to be listed in `required`; the
        # model returns [] rather than omitting the key when nothing fits.
        schema["required"].append("industries")
    return schema

# One template, two sourcing regimes. Which one is used depends on whether the
# draft was given the built-in search tool (settings.OPENAI_WEB_SEARCH_ENABLED)
# — and it has to, because every "look it up" instruction becomes a licence to
# recall-and-hope the moment there is nothing to look it up with. The
# no-search variant therefore trades coverage for honesty: unverifiable fields
# come back empty, and the hazard fields come back empty always.
_PROMPT_TEMPLATE = """You are drafting catalog copy for an industrial chemical \
distributor's admin system. A staff member reviews and edits everything before \
it is published — this is a first draft, not a publication.

{sourcing}

Rules:
- HIGH-STAKES: {high_stakes}
- Never invent a price, certification, or supplier claim. From a photo, report \
only what you can actually read or clearly see (grade, net weight, appearance, \
brand).
- specifications holds ordinary physical/chemical values, never safety data.
- industries: choose only from the list you are given, and only ones this \
product is actually sold into. None fitting is an empty list, not a guess.
- With no name given, identify the product from the photo and fill \
suggested_name with a specific, buyer-searchable name — not "chemical powder". \
If you genuinely can't identify it, say so in confidence_note.
- SEO fields are real search-result copy, not taglines: include identifying \
facts (grade, formula, primary use), stay in the stated length ranges, and \
never state a claim not supported elsewhere in the draft.
- Fill every field the rules allow you to support. An empty string means "could \
not confirm", not "did not try".
- Write for a B2B industrial buyer: precise, factual, no marketing fluff."""

_SOURCING_SEARCH = """Use the web_search tool for identifiers (CAS number, HS \
code, formula, molecular weight, specifications) rather than answering from \
memory. Prefer CAS Common Chemistry, PubChem, ECHA, national registries, or a \
manufacturer SDS/spec sheet. If sources disagree or none is reliable, leave the \
field empty and say so in confidence_note — never pick a plausible-looking \
value."""

_HIGH_STAKES_SEARCH = """hazard_class, safety_information and storage_handling \
can cause real physical harm if wrong. Fill them only from an authoritative \
source you actually found via web_search (PubChem GHS, ECHA CLP, OSHA, or a \
supplier SDS) for this exact substance and grade. Never infer them from a \
pictogram you see in a photo, from the substance's name, or from what a similar \
chemical is usually classified as. Unsourced ⇒ leave empty and say so in \
confidence_note."""

_SOURCING_NO_SEARCH = """You have no search tool on this request, so you cannot \
verify anything. Write the descriptive and SEO copy — description, \
short_description, applications, benefits, packaging_options, meta_* — freely. \
But an identifier or a physical constant (cas_number, hs_code, \
chemical_formula, purity, specifications) is a fact a buyer will act on: give \
one only where you are certain, leave the rest empty, and name the empty ones \
in confidence_note as fields the admin still needs to look up. A wrong CAS \
number is worse than a blank one."""

_HIGH_STAKES_NO_SEARCH = """hazard_class, safety_information and \
storage_handling can cause real physical harm if wrong, and on this request you \
have no way to source them. Leave all three empty — every time, however \
confident you feel — and say in confidence_note that they must be taken from \
the supplier's Safety Data Sheet. Never fill them from memory, from a \
pictogram you see in a photo, from the substance's name, or from what a similar \
chemical is usually classified as."""


def _system_prompt(*, web_search: bool) -> str:
    return _PROMPT_TEMPLATE.format(
        sourcing=_SOURCING_SEARCH if web_search else _SOURCING_NO_SEARCH,
        high_stakes=_HIGH_STAKES_SEARCH if web_search else _HIGH_STAKES_NO_SEARCH,
    )


def _estimate_cost_usd(usage, *, web_search: bool) -> float:
    """Price one draft from the usage numbers the response came back with.

    An estimate, not a bill: it uses the published rates in settings, which
    are only as current as whoever last edited them. Cached input tokens are
    a subset of input_tokens (not an extra charge), hence the subtraction.
    """
    cached = getattr(getattr(usage, "input_tokens_details", None), "cached_tokens", 0) or 0
    fresh = max((usage.input_tokens or 0) - cached, 0)
    cost = (
        fresh * settings.OPENAI_INPUT_USD_PER_MTOK
        + cached * settings.OPENAI_CACHED_INPUT_USD_PER_MTOK
        + (usage.output_tokens or 0) * settings.OPENAI_OUTPUT_USD_PER_MTOK
    ) / 1_000_000
    if web_search:
        # Billed per call whether or not the model chose to search; one draft
        # is one call.
        cost += settings.OPENAI_WEB_SEARCH_USD_PER_CALL
    return cost


class ProductDraftError(Exception):
    """Raised when the draft could not be produced (no key, API error, bad output)."""


def _downscale(data: bytes) -> tuple[bytes, str]:
    """Shrink an oversized product photo before it becomes vision input.

    Vision cost scales with pixel count: the same photo costs ~2,374 input
    tokens at 2000px against ~1,266 at 1024px. The photo is only ever used to
    read label text (grade, purity, net weight), and 1024px keeps small print
    legible, so anything larger is paid for and thrown away. Note that
    `detail: "low"` does NOT help here — it was measured to leave the token
    count unchanged; resizing is what actually reduces it.

    Returns the original bytes untouched if Pillow can't read it or the image
    is already small enough — a photo that fails to resize is not worth
    failing a draft over.
    """
    limit = getattr(settings, "OPENAI_IMAGE_MAX_PX", 0)
    if not limit:
        return data, "jpg"
    try:
        from io import BytesIO

        from PIL import Image

        image = Image.open(BytesIO(data))
        if max(image.size) <= limit:
            return data, "jpg"
        image.thumbnail((limit, limit))
        buffer = BytesIO()
        image.convert("RGB").save(buffer, format="JPEG", quality=85)
        return buffer.getvalue(), "jpg"
    except Exception:  # noqa: BLE001 - never fail a draft over a resize
        logger.debug("Could not downscale product photo; sending it as-is.")
        return data, "jpg"


def _image_data_uri(image_url: str) -> str:
    from .url_fetch import UnsafeUrlError, fetch_image_bytes

    try:
        data, ext = fetch_image_bytes(image_url)
    except UnsafeUrlError as exc:
        raise ProductDraftError(f"Could not read the product photo: {exc}") from exc
    data, resized_ext = _downscale(data)
    ext = resized_ext or ext
    mime = "image/jpeg" if ext == "jpg" else f"image/{ext}"
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


def generate_product_draft(
    *,
    name: str = "",
    cas_number: str = "",
    category_name: str = "",
    notes: str = "",
    image_url: str = "",
    industry_choices: Sequence[str] = (),
) -> dict:
    """Return an AI-drafted set of catalog + SEO fields for a new product,
    including a suggested product name when `name` is blank — the photo alone
    is enough to draft from, as long as `image_url` identifies something.

    `industry_choices` is the catalog's own list of industry names; pass it and
    the draft comes back with an `industries` list drawn only from it, which
    the admin form pre-ticks. Omit it and the field is left out of the schema
    entirely rather than drafted against nothing.

    Raises ProductDraftError if drafting isn't configured, if neither a name
    nor a photo was given, or if the request/response otherwise fails.
    Callers (the admin_views endpoint) are responsible for turning that into
    a clean 4xx/5xx response instead of ever falling back to fabricated data.
    """
    if not settings.AI_PRODUCT_DRAFTING_ENABLED:
        raise ProductDraftError("AI product drafting is not configured (OPENAI_API_KEY unset).")
    if not name.strip() and not image_url.strip():
        raise ProductDraftError("Provide a product name, a product photo, or both.")

    try:
        from openai import OpenAI
    except ImportError as exc:  # pragma: no cover - dependency always installed in prod
        raise ProductDraftError("The openai package is not installed.") from exc

    user_context = (
        [f"Product name: {name}"]
        if name.strip()
        else ["No product name was given — identify the product from the photo below and "
              "propose one in suggested_name."]
    )
    if cas_number:
        user_context.append(f"CAS number: {cas_number}")
    if category_name:
        user_context.append(f"Catalog category: {category_name}")
    if notes:
        user_context.append(f"Additional notes from the admin: {notes}")

    user_content: list[dict] = []
    if image_url:
        user_content.append(
            {"type": "input_image", "image_url": _image_data_uri(image_url)}
        )
        user_context.append(
            "A photo of the actual product/packaging is attached — examine it and use "
            "anything you can read or clearly see (label text, grade, net weight, "
            "container type, appearance) as source material, alongside the rules above."
        )
    user_content.append({"type": "input_text", "text": "\n".join(user_context)})

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    web_search = bool(settings.OPENAI_WEB_SEARCH_ENABLED)
    request: dict = {}
    if web_search:
        # Omitted entirely when disabled — an empty `tools` list is not the
        # same request, and this is the $0.025 line item.
        request["tools"] = [{"type": settings.OPENAI_WEB_SEARCH_TOOL}]

    # gpt-5 and o-series are reasoning models: they reject `temperature`
    # outright, so only the gpt-4.x line gets it. Keeps a change of
    # OPENAI_MODEL from turning into a 400 on every draft.
    if not settings.OPENAI_MODEL.startswith(("gpt-5", "o1", "o3", "o4")):
        request["temperature"] = 0.3

    try:
        response = client.responses.create(
            model=settings.OPENAI_MODEL,
            instructions=_system_prompt(web_search=web_search),
            input=[{"role": "user", "content": user_content}],
            max_output_tokens=settings.OPENAI_MAX_OUTPUT_TOKENS,
            # `instructions` + the schema are identical on every draft, so this
            # lets OpenAI reuse the cached prefix (~1.2k tokens at the cached
            # rate, a quarter of the price on gpt-4.1-nano) instead of
            # re-reading it each time. Keep the static parts static:
            # anything variable must stay in `input`, at the end, or the prefix
            # stops matching and the discount is lost.
            prompt_cache_key="noks-product-draft",
            text={
                "format": {
                    "type": "json_schema",
                    "name": "product_draft",
                    "schema": _response_schema(industry_choices),
                    "strict": True,
                }
            },
            **request,
        )
    except Exception as exc:  # noqa: BLE001 - surface any provider error uniformly
        logger.warning("OpenAI product draft request failed: %s", exc)
        raise ProductDraftError(f"AI drafting request failed: {exc}") from exc

    usage = getattr(response, "usage", None)
    if usage is not None:
        cost = _estimate_cost_usd(usage, web_search=web_search)
        logger.info(
            "Product draft tokens: input=%s (cached=%s) output=%s total=%s "
            "≈$%.5f%s [%s]",
            usage.input_tokens,
            getattr(getattr(usage, "input_tokens_details", None), "cached_tokens", 0),
            usage.output_tokens,
            usage.total_tokens,
            cost,
            " +web_search" if web_search else "",
            name or "from photo",
        )
        budget = settings.OPENAI_DRAFT_COST_BUDGET_USD
        if budget and cost > budget:
            logger.warning(
                "Product draft cost ≈$%.5f, over the $%.5f budget (model=%s, "
                "web_search=%s) — check OPENAI_MODEL/OPENAI_WEB_SEARCH_ENABLED "
                "and the OPENAI_*_USD_PER_MTOK rates.",
                cost,
                budget,
                settings.OPENAI_MODEL,
                web_search,
            )

    raw = response.output_text
    try:
        draft = json.loads(raw)
    except (TypeError, ValueError) as exc:
        logger.warning("OpenAI product draft returned non-JSON content: %r", raw)
        raise ProductDraftError("AI drafting returned an unreadable response.") from exc

    # Only ever industry names the caller offered: the enum makes this all but
    # impossible to violate, but a name that no longer matches a row would
    # otherwise reach the admin form as an unticked ghost.
    allowed = {choice.casefold(): choice for choice in industry_choices}
    draft["industries"] = [
        allowed[value.casefold()]
        for value in draft.get("industries") or []
        if value.casefold() in allowed
    ]

    # Undo the {name, value} pairs the strict schema forced specifications
    # into (see _RESPONSE_SCHEMA) — every caller expects a plain dict, same
    # shape as Product.specifications.
    draft["specifications"] = {
        pair["name"]: pair["value"] for pair in draft.get("specifications") or []
    }

    # Enforced in code, not just prompted for: whenever any hazard/storage
    # field actually came back non-empty, the admin UI must see a
    # verify-against-the-real-SDS warning — this can't depend on the model
    # remembering to say so itself.
    if any(draft.get(field) for field in ("hazard_class", "safety_information", "storage_handling")):
        reminder = (
            "Hazard/storage data was AI-drafted from public sources — verify it against "
            "the actual supplier's Safety Data Sheet for this exact product before publishing."
        )
        draft["confidence_note"] = (
            f"{draft['confidence_note']} {reminder}" if draft.get("confidence_note") else reminder
        )

    return draft
