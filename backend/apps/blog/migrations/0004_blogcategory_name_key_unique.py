"""Make the knowledge-category name key unique.

Its own migration so the UNIQUE index is built in a transaction that has no
pending trigger events from 0003's data write.
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("blog", "0003_backfill_blog_keys")]

    operations = [
        migrations.AlterField(
            model_name="blogcategory",
            name="name_key",
            field=models.CharField(editable=False, max_length=220, unique=True),
        )
    ]
