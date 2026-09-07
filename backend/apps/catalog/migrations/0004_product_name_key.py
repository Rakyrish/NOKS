"""Make duplicate product listings impossible at the database level.

Products were previously deduplicated by nothing at all: SluggedModel.save()
resolved a name collision by appending -2/-3 to the slug, so saving the same
product twice silently produced a second listing. This backfills a normalized
`name_key` for every existing row and makes it unique.

The backfill asserts rather than guesses: if two rows still normalize to the
same key the migration stops and names them, because picking a winner is a
content decision (which row has the better photo and copy), not a mechanical one.
"""

from django.db import migrations, models

from apps.catalog.models import normalize_product_name


def backfill_name_key(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    seen = {}
    for product in Product.objects.all().order_by("id"):
        key = normalize_product_name(product.name)
        if key in seen:
            raise RuntimeError(
                f"Cannot apply unique name_key: products {seen[key]} and "
                f"{product.id} both normalize to {key!r}. Remove the duplicate "
                f"first, then re-run this migration."
            )
        seen[key] = product.id
        Product.objects.filter(pk=product.pk).update(name_key=key)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [("catalog", "0003_product_ai_generated")]

    operations = [
        migrations.AddField(
            model_name="product",
            name="name_key",
            field=models.CharField(default="", editable=False, max_length=220),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_name_key, noop),
        migrations.AlterField(
            model_name="product",
            name="name_key",
            field=models.CharField(editable=False, max_length=220, unique=True),
        ),
    ]
