"""Populate the columns 0002 added, before 0004 constrains them."""

import re

from django.db import migrations, models


def normalize(name):
    key = (name or "").lower().replace("sulph", "sulf")
    key = re.sub(r"[^a-z0-9]+", " ", key)
    return " ".join(key.split())


def backfill(apps, schema_editor):
    Post = apps.get_model("blog", "Post")
    Post.objects.update(content_updated_at=models.F("updated_at"))

    BlogCategory = apps.get_model("blog", "BlogCategory")
    for pk, name in BlogCategory.objects.values_list("pk", "name"):
        BlogCategory.objects.filter(pk=pk).update(name_key=normalize(name))


def noop(apps, schema_editor):
    """Reversing 0002 drops both columns; nothing to undo here."""


class Migration(migrations.Migration):
    dependencies = [("blog", "0002_post_content_updated_at_blogcategory_name_key")]

    operations = [migrations.RunPython(backfill, noop)]
