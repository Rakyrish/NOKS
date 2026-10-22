from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("leads", "0002_delivery_receipts")]
    operations = [
        migrations.AlterField(model_name=model, name="submission_digest", field=models.CharField(blank=True, editable=False, max_length=64, db_default=""))
        for model in ("quoterequest", "inquiry")
    ] + [
        migrations.AlterField(model_name="quoteitem", name="product_grade", field=models.CharField(blank=True, max_length=80, db_default="")),
        migrations.AlterField(model_name="quoteitem", name="product_url", field=models.URLField(blank=True, max_length=500, db_default="")),
    ]
