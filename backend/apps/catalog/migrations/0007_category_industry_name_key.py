"""Give Category and Industry the duplicate-name guard Product already has.

`SluggedModel.save()` resolves a slug collision by appending -2, -3, …, which
silently creates the duplicate instead of rejecting it — that is where
`/categories/water-treatment-chemicals-2` came from. `Product` has had a unique
`name_key` since 0004; Category and Industry are just as URL-bearing and now
have one too.

0006 must have merged the existing collisions before this runs.
"""

from django.db import migrations, models


def normalize(name):
    import re

    key = name.lower().replace("sulph", "sulf")
    key = re.sub(r"[^a-z0-9]+", " ", key)
    return " ".join(key.split())


def backfill_name_keys(apps, schema_editor):
    for label in ("Category", "Industry"):
        model = apps.get_model("catalog", label)
        for row in model.objects.all():
            model.objects.filter(pk=row.pk).update(name_key=normalize(row.name))


def noop(apps, schema_editor):
    """Nothing to undo — dropping the column is handled by reversing AddField."""


class Migration(migrations.Migration):
    dependencies = [("catalog", "0006_merge_duplicate_taxonomy")]

    operations = [
        migrations.AddField(
            model_name="category",
            name="name_key",
            field=models.CharField(default="", editable=False, max_length=220),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="industry",
            name="name_key",
            field=models.CharField(default="", editable=False, max_length=220),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_name_keys, noop),
        migrations.AlterField(
            model_name="category",
            name="name_key",
            field=models.CharField(editable=False, max_length=220, unique=True),
        ),
        migrations.AlterField(
            model_name="industry",
            name="name_key",
            field=models.CharField(editable=False, max_length=220, unique=True),
        ),
    ]
