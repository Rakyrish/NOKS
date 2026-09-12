"""
Duplicate-listing detection for the product catalogue.

`Product.name_key` already stops the *same name* being listed twice. What it
cannot see is the same substance listed under two different names — which is
exactly what happened when the catalogue was topped up from AI-drafted rows in
August 2026: 20 CAS numbers now carry two or three listings each, and every one
of them is a separate indexable URL competing with its twin.

Two listings sharing a CAS number are not automatically duplicates, though.
Concentration and grade are real product distinctions:

    Hydrochloric Acid 33%   and  Hydrochloric Acid 25%     — different products
    Sodium Bicarbonate      and  Sodium Bicarbonate (food) — different products
    Phosphoric Acid ≥85%    and  Phosphoric Acid 85%       — the same product

So a cluster is only reported as *consolidatable* when CAS, normalised
concentration and grade all agree. Everything else is reported as *review*: a
human has to decide, because collapsing two genuinely different specifications
would be worse than the duplication.

Nothing here mutates anything. `manage.py audit_duplicates` decides what to do
with the findings.
"""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass, field

from .models import Product

# Words that describe the *form* of a chemical rather than its identity, and so
# genuinely separate two listings that share a CAS number.
DISTINGUISHING_TERMS = (
    "dense",
    "light",
    "anhydrous",
    "monohydrate",
    "dihydrate",
    "heptahydrate",
    "prills",
    "pellets",
    "flakes",
    "granular",
    "powder",
    "solution",
    "food",
    "pharma",
    "usp",
    "bp",
    "acs",
    "reagent",
)


def concentration(product: Product) -> str | None:
    """Extract a comparable percentage from purity, name or formula fields.

    `"≥85%"`, `"85%"` and `"≥ 85 %"` all normalise to `"85"`. A range
    (`"37-41%"`) keeps both bounds so it cannot be confused with a single
    figure. Returns None when the product states no concentration at all —
    which is itself a distinguishing fact, not a wildcard.
    """
    for source in (product.purity, product.name):
        if not source:
            continue
        text = source.replace("≥", ">=").replace("≤", "<=")
        found = re.findall(r"(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*%", text)
        if found:
            low, high = found[0]
            return f"{float(low):g}-{float(high):g}"
        found = re.findall(r"(\d+(?:\.\d+)?)\s*%", text)
        if found:
            return f"{float(found[0]):g}"
    return None


def distinguishing_terms(product: Product) -> frozenset[str]:
    """Form/grade words present in the product name."""
    words = set(re.findall(r"[a-z]+", product.name.lower()))
    return frozenset(term for term in DISTINGUISHING_TERMS if term in words)


@dataclass
class Cluster:
    cas_number: str
    members: list[Product] = field(default_factory=list)

    @property
    def canonical(self) -> Product:
        """The listing the others should defer to.

        Ranked by how much we trust it, most significant first:

        1. Human-authored beats AI-drafted (`ai_generated`). The curated rows
           predate the August top-up and carry hand-checked specifications.
        2. More page views — the listing search engines and buyers already
           found is the one whose equity is worth keeping.
        3. Has a photograph.
        4. Oldest, as a stable tie-break so repeated runs agree.
        """
        return sorted(
            self.members,
            key=lambda p: (
                p.ai_generated,
                -p.view_count,
                0 if p.images.exists() else 1,
                p.created_at,
            ),
        )[0]

    @property
    def duplicates(self) -> list[Product]:
        canonical = self.canonical
        return [p for p in self.members if p.pk != canonical.pk]

    @property
    def consolidatable(self) -> bool:
        """True only when every member states the same concentration and form.

        This is the conservative half of the report — the half safe to act on
        without a human comparing datasheets.
        """
        if len(self.members) < 2:
            return False
        signatures = {
            (concentration(p), distinguishing_terms(p), p.grade) for p in self.members
        }
        return len(signatures) == 1

    @property
    def reason(self) -> str:
        if self.consolidatable:
            return "same CAS, concentration, form and grade"
        differing = []
        if len({concentration(p) for p in self.members}) > 1:
            differing.append("concentration")
        if len({distinguishing_terms(p) for p in self.members}) > 1:
            differing.append("form/grade wording")
        if len({p.grade for p in self.members}) > 1:
            differing.append("grade")
        return "differs by " + ", ".join(differing) if differing else "unclear"


def find_clusters(queryset=None) -> list[Cluster]:
    """Group published products that share a non-empty CAS number."""
    products = (
        queryset
        if queryset is not None
        else Product.objects.published().exclude(cas_number="").select_related("category")
    )

    grouped: dict[str, list[Product]] = defaultdict(list)
    for product in products:
        grouped[product.cas_number.strip().lower()].append(product)

    return [
        Cluster(cas_number=cas, members=members)
        for cas, members in sorted(grouped.items())
        if len(members) > 1
    ]
