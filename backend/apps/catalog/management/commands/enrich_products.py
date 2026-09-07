"""Fill out thin product pages using apps.catalog.content.

Run with --dry-run first; it reports what would change without writing.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.content import (
    build_applications,
    build_benefits,
    build_description,
    build_faqs,
)
from apps.catalog.models import Product

MIN_POINTS = 7


class Command(BaseCommand):
    help = "Expand product applications, benefits, FAQs and description copy."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing to the database.",
        )
        parser.add_argument(
            "--slug",
            help="Only process this slug — useful for eyeballing output first.",
        )
        parser.add_argument(
            "--min-points",
            type=int,
            default=MIN_POINTS,
            help=f"Floor for applications/benefits/FAQs (default {MIN_POINTS}).",
        )

    def handle(self, *args, **options):
        dry = options["dry_run"]
        minimum = options["min_points"]

        qs = Product.objects.all().select_related("category").prefetch_related("industries")
        if options.get("slug"):
            qs = qs.filter(slug=options["slug"])

        total = qs.count()
        if not total:
            self.stdout.write(self.style.WARNING("No products matched."))
            return

        changed = 0
        short = []

        with transaction.atomic():
            for product in qs:
                applications = build_applications(product, minimum=minimum)
                benefits = build_benefits(product, minimum=minimum)
                faqs = build_faqs(product, minimum=minimum)
                description = build_description(product)

                if min(len(applications), len(benefits), len(faqs)) < minimum:
                    short.append(product.slug)

                product.applications = applications
                product.benefits = benefits
                product.faqs = faqs
                product.description = description

                if not dry:
                    product.save(
                        update_fields=["applications", "benefits", "faqs", "description"]
                    )
                changed += 1

                if options.get("slug"):
                    self.stdout.write(f"\n--- {product.name} ---")
                    self.stdout.write(f"applications ({len(applications)}):")
                    for a in applications:
                        self.stdout.write(f"  • {a}")
                    self.stdout.write(f"benefits ({len(benefits)}):")
                    for b in benefits:
                        self.stdout.write(f"  • {b}")
                    self.stdout.write(f"faqs ({len(faqs)}):")
                    for f in faqs:
                        self.stdout.write(f"  Q: {f['question']}")
                        self.stdout.write(f"  A: {f['answer'][:160]}...")
                    self.stdout.write(f"description:\n{description}")

            if dry:
                transaction.set_rollback(True)

        verb = "Would update" if dry else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} {changed}/{total} products."))
        if short:
            self.stdout.write(
                self.style.WARNING(
                    f"{len(short)} below the {minimum}-point floor: {', '.join(short[:10])}"
                )
            )
