from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("catalog", "0011_one_company_name")]
    operations = [migrations.AddField(model_name="product", name="secondary_categories", field=models.ManyToManyField(blank=True, related_name="secondary_products", to="catalog.category"))]
