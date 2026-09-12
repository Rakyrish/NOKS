"""Merge Category and Industry rows whose names collide.

Runs before 0007 adds the UNIQUE `name_key` column, because backfilling that
column across "water treatment chemicals" and "Water Treatment Chemicals" —
which normalise to the same key — would violate the constraint the moment it is
applied.

Kept as its own migration rather than folded into 0007: on Postgres, deleting a
row and then running `ALTER TABLE` against the same table inside one transaction
fails with "cannot ALTER TABLE because it has pending trigger events". Two
migrations means two transactions.

Data-driven rather than hardcoded to the one pair we know about. The row holding
the most products wins, then the one with the most children, then the earlier
one; everything is moved off the loser before it is deleted, so no product,
child category or industry link is lost.
"""

from django.db import migrations


def normalize(name):
    import re

    key = name.lower().replace("sulph", "sulf")
    key = re.sub(r"[^a-z0-9]+", " ", key)
    return " ".join(key.split())


def merge_duplicate_categories(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Product = apps.get_model("catalog", "Product")

    from collections import defaultdict

    groups = defaultdict(list)
    for row in Category.objects.all():
        groups[normalize(row.name)].append(row)

    for rows in groups.values():
        if len(rows) < 2:
            continue
        keeper, *losers = sorted(
            rows,
            key=lambda r: (
                -Product.objects.filter(category=r).count(),
                -Category.objects.filter(parent=r).count(),
                r.created_at,
                r.pk,
            ),
        )
        for loser in losers:
            Product.objects.filter(category=loser).update(category=keeper)
            Category.objects.filter(parent=loser).update(parent=keeper)
            loser.delete()


def merge_duplicate_industries(apps, schema_editor):
    Industry = apps.get_model("catalog", "Industry")
    Product = apps.get_model("catalog", "Product")

    from collections import defaultdict

    groups = defaultdict(list)
    for row in Industry.objects.all():
        groups[normalize(row.name)].append(row)

    for rows in groups.values():
        if len(rows) < 2:
            continue
        keeper, *losers = sorted(
            rows,
            key=lambda r: (-r.products.count(), r.created_at, r.pk),
        )
        for loser in losers:
            for product in Product.objects.filter(industries=loser):
                product.industries.add(keeper)
                product.industries.remove(loser)
            loser.delete()


def noop(apps, schema_editor):
    """Irreversible: the merged rows no longer exist to be split apart."""


class Migration(migrations.Migration):
    dependencies = [("catalog", "0005_product_faqs")]

    operations = [
        migrations.RunPython(merge_duplicate_categories, noop),
        migrations.RunPython(merge_duplicate_industries, noop),
    ]
