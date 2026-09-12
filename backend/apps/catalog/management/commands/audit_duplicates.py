"""Report duplicate product listings and, on request, consolidate the safe ones.

    manage.py audit_duplicates                     # report only (default)
    manage.py audit_duplicates --apply-canonicals  # write canonical_url on the
                                                   # unambiguous clusters
    manage.py audit_duplicates --markdown docs/duplicate-listings.md

Consolidation here means pointing the weaker listing's `canonical_url` at the
stronger one. Deliberately NOT a redirect and NOT an unpublish:

  * both pages stay reachable, so no bookmark, quote link or supplier
    reference breaks;
  * the sitemap drops the non-canonical URL (see the Next.js sitemap route),
    so we stop asking Google to index both;
  * ranking signals consolidate onto one URL, which is the actual SEO goal;
  * it is one nullable field, so it is trivially reversible if the owner
    decides the two listings really are different products.

Merging or deleting a listing is a commercial decision about the catalogue, not
a technical one, so this command will never do it.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.duplicates import concentration, find_clusters


class Command(BaseCommand):
    help = "Find products that duplicate another listing of the same substance."

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply-canonicals",
            action="store_true",
            help="Write canonical_url on duplicates in unambiguous clusters.",
        )
        parser.add_argument(
            "--markdown",
            metavar="PATH",
            help="Also write the report as Markdown to PATH.",
        )
        parser.add_argument(
            "--site-url",
            default="",
            help="Public site origin for canonical URLs (defaults to settings.SITE_URL).",
        )

    def handle(self, *args, **options):
        from django.conf import settings

        site_url = (options["site_url"] or settings.SITE_URL).rstrip("/")
        clusters = find_clusters()
        safe = [c for c in clusters if c.consolidatable]
        review = [c for c in clusters if not c.consolidatable]

        lines: list[str] = []

        def emit(text=""):
            lines.append(text)
            self.stdout.write(text)

        emit(f"{len(clusters)} CAS numbers carry more than one published listing.")
        emit(f"  {len(safe)} consolidatable automatically")
        emit(f"  {len(review)} need a human to compare specifications")
        emit()

        emit("## Consolidatable — same CAS, concentration, form and grade")
        emit()
        for cluster in safe:
            canonical = cluster.canonical
            emit(f"### CAS {cluster.cas_number}")
            emit(f"  KEEP      /products/{canonical.slug}  ({canonical.name})")
            for duplicate in cluster.duplicates:
                emit(
                    f"  CANONICAL /products/{duplicate.slug}  ({duplicate.name})"
                    f"  ->  /products/{canonical.slug}"
                )
            emit()

        emit("## Needs review — shares a CAS number but the listings differ")
        emit()
        for cluster in review:
            emit(f"### CAS {cluster.cas_number} — {cluster.reason}")
            for product in cluster.members:
                emit(
                    f"  /products/{product.slug}"
                    f"  conc={concentration(product) or '—'}"
                    f"  grade={product.grade}"
                    f"  views={product.view_count}"
                    f"  ai={'yes' if product.ai_generated else 'no'}"
                )
            emit()

        if options["apply_canonicals"]:
            changed = 0
            with transaction.atomic():
                for cluster in safe:
                    canonical = cluster.canonical
                    target = f"{site_url}/products/{canonical.slug}"
                    for duplicate in cluster.duplicates:
                        if duplicate.canonical_url != target:
                            duplicate.canonical_url = target
                            duplicate.save(update_fields=["canonical_url"])
                            changed += 1
                    # A canonical target must never itself canonicalise
                    # elsewhere — that is a chain, and Google follows only the
                    # first hop reliably.
                    if canonical.canonical_url:
                        canonical.canonical_url = ""
                        canonical.save(update_fields=["canonical_url"])
            self.stdout.write(
                self.style.SUCCESS(f"\nApplied canonical_url to {changed} listing(s).")
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    "\nReport only. Re-run with --apply-canonicals to write them."
                )
            )

        if options["markdown"]:
            self._write_markdown(
                options["markdown"], safe, review, site_url, options["apply_canonicals"]
            )
            self.stdout.write(f"Markdown written to {options['markdown']}")

    def _write_markdown(self, path, safe, review, site_url, applied):
        out = [
            "# Duplicate product listings",
            "",
            "Generated by `manage.py audit_duplicates`. Products are grouped by CAS",
            "number. A shared CAS number alone is not a duplicate — concentration,",
            "form (dense/light, anhydrous/hydrate, flakes/prills) and grade are real",
            "product distinctions, so only clusters where all of those agree are",
            "treated as consolidatable.",
            "",
            f"- **{len(safe)}** clusters {'consolidated by' if applied else 'eligible for'} "
            "canonical URL",
            f"- **{len(review)}** clusters left for owner review",
            "",
            "## Consolidated automatically" if applied else "## Eligible for consolidation",
            "",
            ""
            if applied
            else "_Not yet applied — run with `--apply-canonicals` to write these._",
            "",
            "| CAS | Canonical listing | Now canonicalises to it |",
            "| --- | --- | --- |",
        ]
        for cluster in safe:
            canonical = cluster.canonical
            dupes = ", ".join(f"`/products/{d.slug}`" for d in cluster.duplicates)
            out.append(f"| {cluster.cas_number} | `/products/{canonical.slug}` | {dupes} |")

        out += [
            "",
            "## Needs owner review",
            "",
            "These share a CAS number but state different concentrations, forms or",
            "grades. Confirm whether each pair is one product or two, then either",
            "merge them in the admin or leave them as distinct listings.",
            "",
            "| CAS | Why it was not consolidated | Listings |",
            "| --- | --- | --- |",
        ]
        for cluster in review:
            listings = "<br>".join(
                f"`/products/{p.slug}` — conc `{concentration(p) or '—'}`, "
                f"grade `{p.grade}`, {p.view_count} views"
                f"{', AI-drafted' if p.ai_generated else ''}"
                for p in cluster.members
            )
            out.append(f"| {cluster.cas_number} | {cluster.reason} | {listings} |")

        out.append("")
        with open(path, "w", encoding="utf-8") as handle:
            handle.write("\n".join(out))
