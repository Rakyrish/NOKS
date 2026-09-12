"""Knowledge-centre half of the SEO integrity work.

* `Post.content_updated_at` — see catalog/0008 for why `updated_at` cannot be
  published as `lastmod`.
* `BlogCategory.name_key` — the duplicate-name guard Category and Industry got
  in catalog/0007. A knowledge category is just as URL-bearing.

The unique constraint lands in 0004, after 0003 has populated the column;
adding it here would collide on the empty-string default.
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("blog", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="post",
            name="content_updated_at",
            field=models.DateTimeField(
                blank=True, db_index=True, editable=False, null=True
            ),
        ),
        migrations.AddField(
            model_name="blogcategory",
            name="name_key",
            field=models.CharField(default="", editable=False, max_length=220),
            preserve_default=False,
        ),
    ]
