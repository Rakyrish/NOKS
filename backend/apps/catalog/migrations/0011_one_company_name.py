"""Name the company "NOKS Chemical Division" everywhere.

162 generated product descriptions said "NOKS Solutions Ltd supplies …" while
the titles, footer and Organization schema said "NOKS Chemical Division", and a
manufacturer row called "NOKS Blends" was published as the Product `brand` on
two own-label products. One business, three names, weakens the entity Google
builds for it. The owner confirmed on 2026-10-05: NOKS Chemical Division.

The same generated sentence also asserted every product "is held ex-stock at
our Nairobi warehouse … so orders ship without waiting on an import cycle".
There is no inventory system behind that (the `stock-status` claim in
frontend/src/lib/business.ts is unverified), so the clause is dropped and the
sentence ends at the range it belongs to.

Exact-string replacements only: every one of the 162 rows carried identical
generated wording, verified before writing this migration. Take a database
dump before applying; that dump is the way back.
"""

from django.db import migrations
from django.utils import timezone

OLD_NAME = "NOKS Solutions Ltd"
NEW_NAME = "NOKS Chemical Division"
STOCK_CLAUSE = (
    " and is held ex-stock at our Nairobi warehouse on Enterprise Road, "
    "Industrial Area, so orders ship without waiting on an import cycle."
)


def forwards(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    Manufacturer = apps.get_model("catalog", "Manufacturer")
    now = timezone.now()

    for product in Product.objects.filter(description__contains=OLD_NAME):
        text = product.description
        text = text.replace(f"{OLD_NAME} — Chemical Division", NEW_NAME)
        text = text.replace(OLD_NAME, NEW_NAME)
        text = text.replace(STOCK_CLAUSE, ".")
        product.description = text
        product.content_updated_at = now
        product.save(update_fields=["description", "content_updated_at"])

    Manufacturer.objects.filter(name="NOKS Blends").update(name=NEW_NAME)


def backwards(apps, schema_editor):
    """Not reversed in place: restore the pre-migration database dump instead.

    The old wording asserted a stock claim we cannot back up, so there is no
    reason to regenerate it; the name rename alone is not worth a lossy undo.
    """


class Migration(migrations.Migration):
    dependencies = [("catalog", "0010_tidy_category_names")]

    operations = [migrations.RunPython(forwards, backwards)]
