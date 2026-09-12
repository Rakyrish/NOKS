"""Flag product data that contradicts itself, or that nothing supports.

    manage.py audit_product_data                        # report to stdout
    manage.py audit_product_data --markdown docs/product-data-audit.md

This command **never edits anything**. Chemical identity, hazard classification
and food/pharma suitability are safety information: a wrong CAS number sends a
buyer the wrong substance, and a wrong hazard statement sends it in the wrong
packaging. Rewriting any of that from a language model's general knowledge —
which is where much of the current catalogue came from, see
`Product.ai_generated` — would launder a guess into something that reads like a
datasheet. The only safe output is a list for a chemist to work through against
the supplier's own SDS and COA.

Checks fall into three classes:

  * **contradiction** — two fields on the same row disagree, or a field
    contradicts a field on another row for the same substance. Machine-checkable,
    so these are asserted, not guessed.
  * **unsupported** — a claim with no source anywhere in the system (a food-grade
    designation with no document, "in stock" with no inventory).
  * **malformed** — the value cannot be what it claims to be (a control
    character in a hazard statement, a formula that is not a formula).
"""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass

from django.core.management.base import BaseCommand

from apps.catalog.models import Product

# ── Reference data ───────────────────────────────────────────────────────
# Only facts that are structural, not chemical. Nothing here asserts what a
# substance *is*; it asserts what a well-formed field looks like.

#: CAS registry numbers are 2–7 digits, 2 digits, 1 check digit.
CAS_PATTERN = re.compile(r"^\d{2,7}-\d{2}-\d$")

#: Grades that make a regulatory claim about human exposure.
CONSUMPTION_GRADES = {"food", "pharma"}

#: Characters that cannot legitimately appear in prose pulled from a datasheet.
CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

#: Unicode subscript digits, so "C₃H₆O" and "C3H6O" are not reported as a
#: disagreement about chemistry when they are a disagreement about typography.
SUBSCRIPTS = str.maketrans("₀₁₂₃₄₅₆₇₈₉", "0123456789")


def normalize_formula(formula: str) -> str:
    """Compare formulas on substance, not on presentation."""
    return re.sub(r"\s+", "", (formula or "").translate(SUBSCRIPTS))


def cas_check_digit_valid(cas: str) -> bool:
    """The CAS check digit is a positional weighted sum of the other digits.

    This is pure arithmetic defined by CAS, so a failure is a definite data
    error rather than an opinion about the chemistry.
    """
    if not CAS_PATTERN.match(cas):
        return False
    digits = cas.replace("-", "")
    body, check = digits[:-1], int(digits[-1])
    total = sum(int(digit) * weight for weight, digit in enumerate(reversed(body), start=1))
    return total % 10 == check


@dataclass
class Finding:
    slug: str
    name: str
    field: str
    kind: str  # contradiction | unsupported | malformed
    detail: str

    def __str__(self):
        return f"[{self.kind}] {self.slug} · {self.field}: {self.detail}"


def audit() -> list[Finding]:
    findings: list[Finding] = []
    products = list(
        Product.objects.published().select_related("category").prefetch_related("documents")
    )

    # Substance-level cross-checks: two listings for one CAS number must agree
    # about what the substance *is*, even when they are legitimately different
    # grades or concentrations.
    by_cas: dict[str, list[Product]] = defaultdict(list)

    for product in products:
        cas = (product.cas_number or "").strip()
        formula = (product.chemical_formula or "").strip()

        # ── CAS number ───────────────────────────────────────────────
        if cas:
            if not CAS_PATTERN.match(cas):
                findings.append(Finding(product.slug, product.name, "cas_number",
                                        "malformed", f"{cas!r} is not in CAS format"))
            elif not cas_check_digit_valid(cas):
                findings.append(Finding(product.slug, product.name, "cas_number", "malformed",
                                        f"{cas!r} fails the CAS check-digit test"))
            else:
                by_cas[cas].append(product)
        else:
            findings.append(Finding(product.slug, product.name, "cas_number", "unsupported",
                                    "no CAS number — buyers cannot confirm the substance"))

        # ── Formula ──────────────────────────────────────────────────
        if formula:
            # A formula with no capital letter is not a formula. Deliberately
            # weak: anything stronger starts asserting chemistry.
            if not re.search(r"[A-Z]", formula):
                findings.append(Finding(product.slug, product.name, "chemical_formula",
                                        "malformed", f"{formula!r} contains no element symbol"))
            if CONTROL_CHARS.search(formula):
                findings.append(Finding(product.slug, product.name, "chemical_formula",
                                        "malformed", "contains a control character"))

        # ── Hazard and safety prose ──────────────────────────────────
        for field in ("hazard_class", "safety_information", "storage_handling"):
            value = getattr(product, field) or ""
            if CONTROL_CHARS.search(value):
                findings.append(Finding(
                    product.slug, product.name, field, "malformed",
                    "contains a control character — the text was corrupted on import "
                    "and is rendered to visitors as-is",
                ))

        if product.hazard_class and not product.safety_information:
            findings.append(Finding(
                product.slug, product.name, "safety_information", "contradiction",
                f"declares hazard class {product.hazard_class!r} but carries no safety text",
            ))

        # ── Grades that make a regulatory claim ──────────────────────
        if product.grade in CONSUMPTION_GRADES:
            has_document = product.documents.filter(doc_type__in=("coa", "sds", "spec")).exists()
            if not has_document:
                findings.append(Finding(
                    product.slug, product.name, "grade", "unsupported",
                    f"sold as {product.get_grade_display()} — a claim about human "
                    "consumption — with no COA, SDS or specification on file",
                ))

        # ── Commerce fields that are still model defaults ────────────
        if product.availability == Product.Availability.IN_STOCK:
            findings.append(Finding(
                product.slug, product.name, "availability", "unsupported",
                "'In stock' is the model default and there is no inventory source",
            ))
        if product.min_order_quantity == 1:
            findings.append(Finding(
                product.slug, product.name, "min_order_quantity", "unsupported",
                f"MOQ of 1 {product.unit} is the model default, not a stated minimum",
            ))

        # ── Packaging ────────────────────────────────────────────────
        if not product.packaging_options:
            findings.append(Finding(product.slug, product.name, "packaging_options",
                                    "unsupported", "no pack sizes listed"))
        else:
            imperial = [p for p in product.packaging_options
                        if re.search(r"\b(lb|lbs|gal|oz|pound)\b", str(p), re.I)]
            if imperial:
                findings.append(Finding(
                    product.slug, product.name, "packaging_options", "contradiction",
                    f"imperial pack sizes {imperial} in a metric market — "
                    "likely carried over from a US datasheet",
                ))
            tanker = [p for p in product.packaging_options if re.search(r"tanker", str(p), re.I)]
            powdery = re.search(r"\b(powder|flakes|granular|prills|pellets|dense|bag)\b",
                                f"{product.name} {product.short_description}", re.I)
            if tanker and powdery:
                findings.append(Finding(
                    product.slug, product.name, "packaging_options", "contradiction",
                    f"offers {tanker} for what the listing describes as a solid — "
                    "confirm whether dry-bulk tanker delivery is actually available",
                ))

        if product.ai_generated:
            findings.append(Finding(
                product.slug, product.name, "ai_generated", "unsupported",
                "content was seeded from an AI draft and has not been marked as "
                "checked against a supplier datasheet",
            ))

    # ── Cross-listing contradictions ─────────────────────────────────
    for cas, group in sorted(by_cas.items()):
        if len(group) < 2:
            continue
        formulas = {
            normalize_formula(p.chemical_formula) for p in group if p.chemical_formula
        }
        if len(formulas) > 1:
            shown = sorted(p.chemical_formula for p in group if p.chemical_formula)
            for product in group:
                findings.append(Finding(
                    product.slug, product.name, "chemical_formula", "contradiction",
                    f"CAS {cas} is listed with {len(formulas)} different formulas across "
                    f"{len(group)} products: {shown}",
                ))

    return findings


class Command(BaseCommand):
    help = "Flag product data that contradicts itself or that nothing supports."

    def add_arguments(self, parser):
        parser.add_argument("--markdown", metavar="PATH", help="Write the report to PATH.")
        parser.add_argument("--kind", choices=["contradiction", "unsupported", "malformed"],
                            help="Show only one class of finding.")

    def handle(self, *args, **options):
        findings = audit()
        if options["kind"]:
            findings = [f for f in findings if f.kind == options["kind"]]

        by_kind: dict[str, list[Finding]] = defaultdict(list)
        for finding in findings:
            by_kind[finding.kind].append(finding)

        lines = [
            "# Product data audit",
            "",
            "Generated by `manage.py audit_product_data`. **Nothing here has been "
            "changed automatically.** Every row needs a human to check it against the "
            "supplier's SDS, COA or technical datasheet.",
            "",
            f"- Products audited: **{Product.objects.published().count()}**",
            f"- Findings: **{len(findings)}**",
            "",
        ]

        for kind, heading, blurb in [
            ("malformed", "Malformed values",
             "The stored value cannot be what it claims to be. These are certain."),
            ("contradiction", "Contradictions",
             "Two fields disagree, on the same row or across rows for the same substance."),
            ("unsupported", "Unsupported claims",
             "Published as fact with no source anywhere in the system."),
        ]:
            group = by_kind.get(kind, [])
            lines += [f"## {heading} ({len(group)})", "", blurb, ""]
            if not group:
                lines += ["None.", ""]
                continue
            # Collapse the high-volume systemic findings — 182 identical rows
            # help nobody.
            counts: dict[tuple[str, str], list[Finding]] = defaultdict(list)
            for finding in group:
                counts[(finding.field, finding.detail.split("—")[0].strip()[:200])].append(finding)
            lines += ["| Field | Issue | Products |", "| --- | --- | --- |"]
            for (field, detail), items in sorted(counts.items(), key=lambda kv: -len(kv[1])):
                if len(items) > 5:
                    sample = f"**{len(items)}** products (e.g. `{items[0].slug}`)"
                else:
                    sample = ", ".join(f"`{i.slug}`" for i in items)
                lines.append(f"| `{field}` | {detail} | {sample} |")
            lines.append("")

        report = "\n".join(lines)
        if options["markdown"]:
            with open(options["markdown"], "w", encoding="utf-8") as handle:
                handle.write(report + "\n")
            self.stdout.write(self.style.SUCCESS(f"Wrote {options['markdown']}"))
        else:
            self.stdout.write(report)
