"""Give categories names a buyer would type.

Most top-level category names were entered in lower case ("cleaning and
disinfectants"), and the page title, H1 and breadcrumb all render the name
verbatim — so the live <title> read "cleaning and disinfectants Suppliers in
Kenya". A few were also unclear on their own: "pharm and cosmetic", "dyes"
(both products are pigments) and "preservation and chemicals" (formalin,
grease, a refractory castable — a mixed specialty bucket).

Slugs are untouched, so no URL changes. A row is only renamed while it still
holds the old value, so an editor's later rename is never overwritten.

Historical models skip the custom save(), so `name_key` (the unique
duplicate-detection key) and `content_updated_at` (the sitemap lastmod) are set
here explicitly.
"""

from django.db import migrations
from django.utils import timezone

from apps.core.models import normalize_name

RENAMES = {
    # slug: (old name, new name)
    "cleaning-and-disinfectants": ("cleaning and disinfectants", "Cleaning & Disinfectant Chemicals"),
    "soaps-and-detergents": ("soaps and detergents", "Soap & Detergent Raw Materials"),
    "coolant-and-thermoregulation": ("coolant and thermoregulation", "Coolants & Heat Transfer Fluids"),
    "dyes": ("dyes", "Dyes & Pigments"),
    "food-and-beverages": ("food and beverages", "Food & Beverage Ingredients"),
    "oil-and-gas": ("oil and gas", "Oil & Gas Chemicals"),
    "paints-an-coatings": ("paints and coatings", "Paint & Coating Chemicals"),
    "paper-and-pulp": ("paper and pulp", "Paper & Pulp Chemicals"),
    "pharm-and-cosmetic": ("pharm and cosmetic", "Pharmaceutical & Cosmetic Chemicals"),
    "preservation-and-chemicals": ("preservation and chemicals", "Preservation & Specialty Chemicals"),
    "rubber-and-plastics": ("rubber and plastics", "Rubber & Plastic Chemicals"),
    "textile-treatment": ("textile treatment", "Textile Chemicals"),
    "solvent-and-thinner": ("solvent and thinner", "Solvents & Thinners"),
    "construction-chemicals": ("construction chemicals", "Construction Chemicals"),
    "polyurethane": ("polyurethane", "Polyurethane Chemicals"),
}


def apply(apps, schema_editor, forward=True):
    Category = apps.get_model("catalog", "Category")
    now = timezone.now()
    for slug, (old, new) in RENAMES.items():
        current, target = (old, new) if forward else (new, old)
        for row in Category.objects.filter(slug=slug, name=current):
            row.name = target
            row.name_key = normalize_name(target)
            row.content_updated_at = now
            row.save(update_fields=["name", "name_key", "content_updated_at"])


def forwards(apps, schema_editor):
    apply(apps, schema_editor, forward=True)


def backwards(apps, schema_editor):
    apply(apps, schema_editor, forward=False)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0009_backfill_content_updated_at")]

    operations = [migrations.RunPython(forwards, backwards)]
