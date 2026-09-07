from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0004_product_name_key"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="faqs",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='[{"question": "What pack sizes are available?", "answer": "..."}] '
                "— rendered on the product page and published as FAQPage structured data.",
            ),
        ),
    ]
