"""OpenAI-assisted product drafting for the admin control panel.

Scope is deliberately narrow: given a chemical name (plus optional CAS number /
category / notes), draft the *marketing, reference and SEO copy* a staff
member would otherwise type by hand — description, applications, benefits, a
handful of non-safety specifications, and meta title/description. The draft
is returned to the admin UI for review; nothing here ever touches the
database.

If the admin has pasted a product photo URL, the same image doubles as vision
input: we fetch it once (through the same SSRF-guarded fetch used to store it
as the product's actual photo — see apps.catalog.admin_views.save_image_from_url)
and hand it to the model alongside the text prompt, so a label the admin can't
be bothered to retype (grade, purity, net weight, appearance) gets read
straight off the packaging instead of guessed at.

Hard rule, carried over from the Part 2 brief and unchanged by adding vision:
this must never draft GHS hazard classification, hazard statements, UN
numbers, or storage/handling instructions — even when a label in the photo
shows GHS pictograms or hazard text. That field set does not exist in the
schema the model is allowed to fill in, and the prompt tells it why. Safety
data has to come from an authoritative SDS, verified by a human, never
transcribed from a photo by a model.
"""

from __future__ import annotations

import base64
import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

_ALLOWED_GRADES = ["industrial", "technical", "laboratory", "food", "pharma"]

_RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "suggested_name": {
            "type": "string",
            "description": (
                "The product's name. If a name was given, return it back "
                "(lightly cleaned up in capitalization only, never changed in "
                "substance). If no name was given, identify the product from "
                "the photo and propose a clear, buyer-searchable name — e.g. "
                "'Sodium Bicarbonate', not 'White powder in a bag'. Empty "
                "string only if neither a name nor a legible photo was given."
            ),
        },
        "chemical_formula": {"type": "string"},
        "synonyms": {
            "type": "string",
            "description": "Comma separated alternative names.",
        },
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
            "type": "object",
            "description": (
                "Physical/chemical reference data only — e.g. Appearance, "
                "Molecular Weight, Solubility, pH. Never hazard, GHS, UN number, "
                "or storage/handling data, even if visible on a label photo."
            ),
            "additionalProperties": {"type": "string"},
        },
        "packaging_options": {"type": "array", "items": {"type": "string"}},
        "meta_title": {
            "type": "string",
            "description": (
                "SEO title tag, ideally 50-60 characters. Lead with the product "
                "name, work in the most search-relevant attribute (grade, CAS, "
                "or primary use) naturally — no keyword stuffing, no clickbait."
            ),
        },
        "meta_description": {
            "type": "string",
            "description": (
                "SEO meta description, ideally 140-160 characters. Factual and "
                "specific (what it is, primary use, grade/purity if known) so it "
                "reads as a genuine answer to a buyer's search, not ad copy. "
                "Never mention price, hazard class, or anything not established "
                "elsewhere in this draft."
            ),
        },
        "confidence_note": {
            "type": "string",
            "description": (
                "One short sentence flagging anything you are unsure about or "
                "could not find reliable data for. Empty string if none."
            ),
        },
    },
    "required": [
        "suggested_name",
        "chemical_formula",
        "synonyms",
        "grade",
        "purity",
        "short_description",
        "description",
        "applications",
        "benefits",
        "specifications",
        "packaging_options",
        "meta_title",
        "meta_description",
        "confidence_note",
    ],
}

_SYSTEM_PROMPT = """You are drafting catalog copy for an industrial chemical \
distributor's admin system. A staff member will review and edit everything \
you write before it is published — you are producing a first draft, not \
publishing directly.

Rules:
- Output must match the given JSON schema exactly.
- NEVER include GHS hazard classification, hazard statements, UN numbers, or \
storage/handling instructions — even if a hazard pictogram or hazard/precautionary \
text is visible in a photo you're shown. That field set does not exist in your \
schema on purpose. Hazard data must come from an authoritative safety data \
sheet, verified by a human, never transcribed by you from a label photo.
- Do not invent a CAS number, price, certification, or supplier claim. If a \
product photo is provided, only report what you can actually read or clearly \
see on it (e.g. a printed grade, net weight, appearance, brand); if you are \
not confident about a fact, either omit it or say so in confidence_note.
- specifications should hold ordinary physical/chemical reference values \
(appearance, molecular weight, solubility, melting point, pH, etc.), not \
safety data.
- Keep short_description to one plain sentence suitable for a product card.
- If no product name was given, you MUST identify the product from the photo \
and fill suggested_name with a specific, buyer-searchable name — not a vague \
description like "chemical powder". If you genuinely cannot identify it from \
the photo, say so plainly in confidence_note and leave the fields you can't \
support empty rather than guessing.
- SEO: meta_title and meta_description are real search-result copy, not \
marketing taglines — write them so they'd satisfy a buyer who searched the \
product name or its CAS number, include specific identifying facts (grade, \
formula, primary use) rather than generic praise, and stay within the stated \
length ranges. Never fabricate a claim in them that isn't also in the rest of \
the draft.
- Write for a B2B industrial buyer: precise, factual, no marketing fluff."""


class ProductDraftError(Exception):
    """Raised when the draft could not be produced (no key, API error, bad output)."""


def _image_data_uri(image_url: str) -> str:
    from .url_fetch import UnsafeUrlError, fetch_image_bytes

    try:
        data, ext = fetch_image_bytes(image_url)
    except UnsafeUrlError as exc:
        raise ProductDraftError(f"Could not read the product photo: {exc}") from exc
    mime = "image/jpeg" if ext == "jpg" else f"image/{ext}"
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


def generate_product_draft(
    *,
    name: str = "",
    cas_number: str = "",
    category_name: str = "",
    notes: str = "",
    image_url: str = "",
) -> dict:
    """Return an AI-drafted set of catalog + SEO fields for a new product,
    including a suggested product name when `name` is blank — the photo alone
    is enough to draft from, as long as `image_url` identifies something.

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
        user_content.append({"type": "image_url", "image_url": {"url": _image_data_uri(image_url)}})
        user_context.append(
            "A photo of the actual product/packaging is attached — examine it and use "
            "anything you can read or clearly see (label text, grade, net weight, "
            "container type, appearance) as source material, alongside the rules above."
        )
    user_content.append({"type": "text", "text": "\n".join(user_context)})

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            temperature=0.3,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "product_draft",
                    "schema": _RESPONSE_SCHEMA,
                    "strict": True,
                },
            },
        )
    except Exception as exc:  # noqa: BLE001 - surface any provider error uniformly
        logger.warning("OpenAI product draft request failed: %s", exc)
        raise ProductDraftError(f"AI drafting request failed: {exc}") from exc

    raw = response.choices[0].message.content
    try:
        draft = json.loads(raw)
    except (TypeError, ValueError) as exc:
        logger.warning("OpenAI product draft returned non-JSON content: %r", raw)
        raise ProductDraftError("AI drafting returned an unreadable response.") from exc

    return draft
