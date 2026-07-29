"""AI Chemical Assistant — grounded on the live catalog, never on guesswork."""

import logging

from django.conf import settings

from apps.catalog.models import Category, Industry, Product

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are {assistant_name}, the technical sales assistant for \
{brand} {division}, a chemical supplier based in {city}, {country}.

Your job:
1. Help visitors find the right chemical product from the catalog provided below.
2. Explain applications, grades, packaging and handling in clear, practical terms.
3. Recommend alternatives when an exact product is unavailable.
4. Guide visitors toward a formal quotation, collecting name, company, email,
   product, quantity and delivery location when they show buying intent.

Hard rules:
- ONLY recommend products that appear in the catalog context. Never invent a
  product, SKU, CAS number, price or specification.
- If a product is not in the catalog, say so and offer our chemical sourcing
  service instead.
- Never give medical, pharmaceutical dosing or illegal-synthesis advice. For
  hazardous handling, point to the official Safety Data Sheet and our technical team.
- Prices are quotation-based. Never state a price; offer to raise a quote.
- Be concise: 2-4 short paragraphs or a tight bullet list. No markdown headers.
- Contact: {email} · {phone} · WhatsApp {whatsapp}.
"""

_NO_KEY_REPLY = (
    "The AI assistant isn't configured yet (no ANTHROPIC_API_KEY in the root .env). "
    "In the meantime our team is happy to help directly — request a quote or reach us on "
    "{email} / {phone}."
)


def build_catalog_context(query: str = "", limit: int = 24) -> str:
    """A compact, grounded snapshot of the catalog for the model."""
    qs = Product.objects.published().select_related("category")
    if query:
        from django.db.models import Q

        matched = qs.filter(
            Q(name__icontains=query)
            | Q(synonyms__icontains=query)
            | Q(cas_number__icontains=query)
            | Q(category__name__icontains=query)
            | Q(short_description__icontains=query)
        )[:limit]
        qs = matched if matched.exists() else qs[:limit]
    else:
        qs = qs.filter(is_featured=True)[:limit]

    lines = []
    for p in qs:
        bits = [f"{p.name} (SKU {p.sku})", f"category: {p.category.name}"]
        if p.cas_number:
            bits.append(f"CAS {p.cas_number}")
        if p.chemical_formula:
            bits.append(p.chemical_formula)
        bits.append(f"grade: {p.get_grade_display()}")
        bits.append(f"availability: {p.get_availability_display()}")
        if p.packaging_options:
            bits.append(f"packaging: {', '.join(map(str, p.packaging_options[:3]))}")
        if p.applications:
            bits.append(f"used for: {', '.join(map(str, p.applications[:3]))}")
        lines.append("- " + " | ".join(bits))

    categories = ", ".join(Category.objects.published().values_list("name", flat=True)[:20])
    industries = ", ".join(Industry.objects.published().values_list("name", flat=True)[:20])

    return (
        f"CATEGORIES: {categories}\nINDUSTRIES SERVED: {industries}\n\n"
        f"CATALOG PRODUCTS:\n" + ("\n".join(lines) if lines else "- (no matches)")
    )


def system_prompt() -> str:
    b = settings.BRAND
    return SYSTEM_PROMPT.format(
        assistant_name=settings.AI_ASSISTANT_NAME,
        brand=b["name"],
        division=b["division"],
        city=b["city"],
        country=b["country"],
        email=b["email"],
        phone=b["phone"],
        whatsapp=b["whatsapp"],
    )


def ask(messages: list[dict], query: str = "") -> dict:
    """Send the conversation to Claude with catalog grounding.

    `messages` is a list of {"role": "user"|"assistant", "content": str}.
    Returns {"reply": str, "products": [slug, ...], "configured": bool}.
    """
    if not settings.ANTHROPIC_API_KEY:
        b = settings.BRAND
        return {
            "reply": _NO_KEY_REPLY.format(email=b["email"], phone=b["phone"]),
            "products": [],
            "configured": False,
        }

    try:
        import anthropic
    except ImportError:  # pragma: no cover
        logger.exception("anthropic SDK not installed")
        return {"reply": "The assistant is temporarily unavailable.", "products": [], "configured": False}

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    context = build_catalog_context(query)

    try:
        response = client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=settings.AI_TEMPERATURE,
            system=[
                {"type": "text", "text": system_prompt()},
                {
                    "type": "text",
                    "text": f"<catalog>\n{context}\n</catalog>",
                    "cache_control": {"type": "ephemeral"},
                },
            ],
            messages=messages,
        )
    except Exception:
        logger.exception("Anthropic request failed")
        b = settings.BRAND
        return {
            "reply": (
                "I couldn't reach the assistant just now. Please try again, or "
                f"contact our team on {b['phone']} / {b['email']}."
            ),
            "products": [],
            "configured": True,
        }

    reply = "".join(block.text for block in response.content if block.type == "text")
    return {"reply": reply, "products": _mentioned_products(reply), "configured": True}


def _mentioned_products(reply: str) -> list[str]:
    """Resolve product names the reply mentions, so the UI can render cards."""
    slugs = []
    for product in Product.objects.published().only("name", "slug", "sku"):
        if product.name.lower() in reply.lower() or product.sku.lower() in reply.lower():
            slugs.append(product.slug)
    return slugs[:4]
