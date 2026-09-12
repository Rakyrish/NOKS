"""Seed `content_updated_at` from `updated_at`.

Separate from 0008 because Postgres refuses to alter a table that has pending
trigger events from a data write in the same transaction — the same reason 0006
and 0007 are split. Two migrations, two transactions.
"""

from django.db import migrations, models


def backfill(apps, schema_editor):
    for label in ("Category", "Industry", "Product"):
        apps.get_model("catalog", label).objects.update(
            content_updated_at=models.F("updated_at")
        )


def noop(apps, schema_editor):
    """Reversing 0008 drops the column outright; nothing to undo here."""


class Migration(migrations.Migration):
    dependencies = [("catalog", "0008_content_updated_at")]

    operations = [migrations.RunPython(backfill, noop)]
