"""Write hand-curated product copy from apps/catalog/curated/*.json.

Every value about to be replaced is saved first to a JSON backup, so a run can
be reverted with `--restore <backup>`. Run with --dry-run to see what changes.
"""

import json
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalog.curated import COPY_FIELDS, curated_files, load
from apps.catalog.models import Product

TOUCHED = (*COPY_FIELDS, "hazard_class", "specifications")


class Command(BaseCommand):
    help = "Apply curated product copy, backing up the values it replaces."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument(
            "--backup-dir",
            default="/tmp/curated-backups",
            help="Where the before-values are written. Copy the file out of the container afterwards; /app/media is served publicly by nginx, so never write backups there.",
        )
        parser.add_argument("--restore", help="Path of a backup file to write back.")

    def handle(self, *args, **options):
        if options["restore"]:
            return self.restore(Path(options["restore"]))

        plan = {}
        for path in curated_files():
            data = load(path)
            for slug, fields in data.get("products", {}).items():
                plan.setdefault(slug, {}).update(
                    {k: v for k, v in fields.items() if k in COPY_FIELDS}
                )
            for slug, fix in data.get("corrections", {}).items():
                plan.setdefault(slug, {})["_correction"] = fix

        products = {p.slug: p for p in Product.objects.filter(slug__in=plan)}
        missing = sorted(set(plan) - set(products))
        if missing:
            raise CommandError(f"Curated slugs not in the catalogue: {', '.join(missing)}")

        backup = {slug: {f: getattr(p, f) for f in TOUCHED} for slug, p in products.items()}

        with transaction.atomic():
            for slug, changes in plan.items():
                product = products[slug]
                fix = changes.pop("_correction", {})
                for field, value in changes.items():
                    setattr(product, field, value)
                if "chemical_formula" in fix:
                    product.chemical_formula = fix["chemical_formula"]
                if "hazard_class" in fix:
                    product.hazard_class = fix["hazard_class"]
                specs = dict(product.specifications or {})
                for key in fix.get("specifications_remove", []):
                    specs.pop(key, None)
                specs.update(fix.get("specifications_set", {}))
                product.specifications = specs
                if not options["dry_run"]:
                    # Full save so content_updated_at (the sitemap lastmod) moves.
                    product.save()
                self.stdout.write(f"{'would update' if options['dry_run'] else 'updated'} {slug}")

            if options["dry_run"]:
                transaction.set_rollback(True)
                return

        out_dir = Path(options["backup_dir"])
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / f"curated-before-{datetime.now():%Y%m%d-%H%M%S}.json"
        out.write_text(json.dumps(backup, ensure_ascii=False, indent=1, default=str))
        self.stdout.write(self.style.SUCCESS(f"{len(plan)} products updated; backup at {out}"))

    def restore(self, path):
        backup = json.loads(path.read_text())
        with transaction.atomic():
            for slug, fields in backup.items():
                product = Product.objects.get(slug=slug)
                for field, value in fields.items():
                    setattr(product, field, value)
                product.save()
        self.stdout.write(self.style.SUCCESS(f"Restored {len(backup)} products from {path}"))
