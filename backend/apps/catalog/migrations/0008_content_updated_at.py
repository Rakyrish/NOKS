"""Add `content_updated_at` — the timestamp the sitemap can honestly publish.

`updated_at` is `auto_now`, so it moves on every save: a flag toggle, a
re-import that rewrites identical values, any future bookkeeping write. The old
sitemap sidestepped that by publishing `new Date()` for every URL, which is
worse — it claimed the entire catalogue changed on every fetch, which is a
`lastmod` signal crawlers learn to ignore.

This column advances only when a field a reader would actually notice changes;
see `ContentTimeStampedModel.CONTENT_FIELDS` on each model. Backfilled from
`updated_at` in 0009 so existing rows start from a truthful value rather than
from "now".
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0007_category_industry_name_key")]

    operations = [
        migrations.AddField(
            model_name=model,
            name="content_updated_at",
            field=models.DateTimeField(
                blank=True, db_index=True, editable=False, null=True
            ),
        )
        for model in ("category", "industry", "product")
    ]
