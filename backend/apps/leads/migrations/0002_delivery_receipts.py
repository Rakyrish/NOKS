from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("leads", "0001_initial")]
    operations = [
        migrations.AddField(model_name=model, name=name, field=field)
        for model in ("quoterequest", "inquiry")
        for name, field in (
            ("idempotency_key", models.UUIDField(blank=True, editable=False, null=True, unique=True)),
            ("submission_digest", models.CharField(blank=True, editable=False, max_length=64)),
        )
    ] + [
        migrations.AddField(model_name="quoteitem", name="product_grade", field=models.CharField(blank=True, max_length=80)),
        migrations.AddField(model_name="quoteitem", name="product_url", field=models.URLField(blank=True, max_length=500)),
        migrations.CreateModel(
        name="LeadNotification",
        fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("sales_sent_at", models.DateTimeField(blank=True, null=True)),
            ("acknowledgement_sent_at", models.DateTimeField(blank=True, null=True)),
            ("attempts", models.PositiveIntegerField(default=0)),
            ("next_attempt_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("last_error", models.CharField(blank=True, max_length=80)),
            ("quote", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="leads.quoterequest")),
            ("inquiry", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="leads.inquiry")),
        ],
        options={"constraints": [models.CheckConstraint(condition=(models.Q(quote__isnull=False, inquiry__isnull=True) | models.Q(quote__isnull=True, inquiry__isnull=False)), name="notification_has_one_lead")]},
    )]
