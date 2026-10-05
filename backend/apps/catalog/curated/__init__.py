"""Hand-written product copy that automated enrichment must not overwrite.

Each JSON file in this package maps product slugs to curated field values.
`manage.py apply_curated_copy` writes them; `enrich_products` skips every slug
listed here so a later run cannot replace edited copy with template text.
"""

import json
from functools import lru_cache
from pathlib import Path

CURATED_DIR = Path(__file__).resolve().parent

#: Product fields a curated file may set directly.
COPY_FIELDS = (
    "short_description",
    "meta_description",
    "description",
    "applications",
    "benefits",
    "faqs",
    "chemical_formula",
)


def curated_files():
    return sorted(CURATED_DIR.glob("*.json"))


def load(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache(maxsize=1)
def curated_slugs():
    """Every slug that has hand-written copy, across all curated files."""
    slugs = set()
    for path in curated_files():
        slugs.update(load(path).get("products", {}))
    return frozenset(slugs)
