"""Focused, reversible catalogue corrections. Dry-run unless --apply is supplied."""
import json
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from apps.catalog.models import Category, Product

PRIMARY = {
    "acetone": "analytical-reagents",
    "acetone-technical-grade": "solvents",
    "potassium-iodide-acs-reagent-grade": "analytical-reagents",
    "potassium-hydroxide-reagent-grade-90-flakes": "analytical-reagents",
    "methanol-analytical-grade": "analytical-reagents",
    "caustic-soda-flakes": "alkalis-caustics",
    "phosphoric-acid": "acids",
    "phosphoric-acid-85": "acids",
    "calcium-hypochlorite": "disinfectants",
    "sulfuric-acid-98": "acids",
}
SECONDARY = {
    "caustic-soda-flakes": "ph-adjusters",
    "hydrochloric-acid-33": "ph-adjusters",
    "sulfuric-acid-98": "ph-adjusters",
    "calcium-hydroxide-technical-grade": "ph-adjusters",
    "sodium-carbonate-soda-ash": "ph-adjusters",
    "soda-ash-dense-sodium-carbonate": "ph-adjusters",
    "poly-aluminium-chloride-powder": "coagulants-flocculants",
}
# Use recorded grade/packaging for enquiry context, never claim vendor certification.
COPY = {
    "acetone": ("Laboratory-grade acetone for laboratory solvent requirements. Compare with technical acetone and request grade and batch documentation before ordering.",
        "Acetone is a volatile solvent used for laboratory cleaning and solvent work. This laboratory-grade listing is separate from Acetone Technical Grade; select against your method's impurity and residue requirements rather than purity alone.\n\nPackaging options are 1 L bottles, 5 L cans and 20 L drums. Include your method, required grade, quantity, packaging and delivery location in the quotation. Ask our team to confirm the current batch specification and whether an SDS or COA is available. Food, pharmaceutical and cosmetic suitability is not established by this listing."),
    "acetone-technical-grade": ("Technical-grade acetone for industrial solvent enquiries. Compare grade requirements with laboratory acetone and confirm packaging in your quotation.",
        "Technical acetone is a solvent used in industrial cleaning and formulation. It is a distinct grade from the laboratory acetone listing. Where a process limits water content, non-volatile residue or other impurities, provide those requirements for confirmation.\n\nThe packaging options shown are 1 litre glass bottles, 5 litre plastic containers and 20 litre metal drums. Request the quantity and pack size needed for your process, with a delivery location. Our team must confirm stock, actual container suitability and batch documentation before supply."),
    "caustic-soda-flakes": ("Industrial sodium hydroxide flakes for soap, detergent and pH-control enquiries. Request quantity, packaging and delivery details with your specification.",
        "Caustic soda flakes are solid sodium hydroxide. Common industrial uses include soap manufacture and pH adjustment in effluent treatment. This industrial-grade product should be selected against your process specification; purity alone does not establish food or pharmaceutical suitability.\n\nThe packaging options are 25 kg polypropylene bags and 200 kg iron drums. State your required assay, quantity, packaging and delivery location. Ask for confirmation of the available container and batch specification, and request SDS and COA availability. Handling and dosing must follow the supplied SDS and your process procedures."),
    "poly-aluminium-chloride-pac": ("Technical poly aluminium chloride coagulant for process-water and effluent-treatment enquiries. Confirm form and dosing requirements before ordering.",
        "Poly aluminium chloride (PAC) is an aluminium-based coagulant used to bring suspended particles together for separation. Product form, aluminium content and basicity affect selection; do not choose a PAC variant by name alone. Jar testing and process requirements determine suitability and dosing.\n\nThis listing shows 25 kg bags and 1,000 kg IBC packaging options. Ask our team to confirm whether the quotation is for powder or liquid and the matching concentration and pack. Include treatment application, required specification, quantity and delivery location. Drinking-water suitability and supporting approvals require separate written confirmation."),
    "aluminium-sulphate-alum": ("Technical aluminium sulphate coagulant for clarification and industrial effluent enquiries. Confirm product form, specification and packaging with your quote.",
        "Aluminium sulphate (alum) is used as a coagulant in clarification and wastewater treatment. Its performance depends on water chemistry and treatment conditions, so provide your process requirements and confirm the product specification before selection.\n\nThe packaging options are 25 kg bags, 50 kg drums and bulk tanker; form and container compatibility need confirmation in the quotation. State the quantity, delivery location and documentation required. Potable-water approval is not established by the technical-grade label; request written confirmation for that use."),
    "hydrogen-peroxide-50": ("Hydrogen peroxide 50% for industrial oxidation and bleaching enquiries. Confirm concentration, compatible packaging and batch documentation with sales.",
        "Hydrogen peroxide 50% is a concentrated oxidising chemical used in industrial bleaching and oxidation processes. It differs from dilute household peroxide and must be selected and handled under the supplier SDS and the plant's procedures.\n\nConfirm concentration, stabilisation requirements and container compatibility for your process. Include quantity, preferred packaging and delivery location in your request. Ask whether the current batch specification, SDS and COA can be provided. This listing does not establish food, pharmaceutical or drinking-water approval."),
}
CATEGORY_COPY = {
    "water-treatment-chemicals": "Browse coagulants, disinfectants and pH-adjusting chemicals for process water and industrial effluent. Choose by treatment objective, product form and process specification. Share your required grade, quantity and delivery location for a quotation. Drinking-water use requires confirmation of the exact product and relevant approvals; a general water-treatment application is not evidence of potable-water suitability.",
    "laboratory-reagents": "Compare laboratory reagents by chemical identity, grade, method requirements and packaging. A purity figure alone does not establish analytical suitability. Include your required impurity limits, quantity and documentation needs in the enquiry, and ask our team to confirm the current batch specification.",
    "industrial-chemicals": "Browse acids, alkalis, solvents and other industrial chemicals by product and application. Specify concentration, grade, quantity and packaging, together with the delivery location. Confirm compatibility with your process and request the supplier documentation needed before purchase.",
}
FIELDS = ["category_id", "description", "short_description", "applications", "benefits", "faqs", "meta_description", "canonical_url", "content_updated_at"]

class Command(BaseCommand):
    help = "Repair verified category errors and enquiry content; preserve every product and URL."
    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true")
        parser.add_argument("--snapshot")
        parser.add_argument("--restore")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["restore"]:
            data = json.loads(Path(options["restore"]).read_text())
            if not options["apply"]:
                self.stdout.write(f"Restore preview: {len(data['products'])} products, {len(data['categories'])} categories")
                return
            for item in data["products"]:
                product = Product.objects.get(pk=item["id"])
                for field, value in item["fields"].items():
                    if field != "content_updated_at":setattr(product, field, value)
                product.save();product.secondary_categories.set(item["secondary_categories"])
            for item in data["categories"]:
                category = Category.objects.get(pk=item["id"]);category.description = item["description"];category.save()
            return
        slugs = set(PRIMARY) | set(SECONDARY) | set(COPY) | {"benzalkonium-chloride-solution-50", "phosphoric-acid-85"}
        products = list(Product.objects.filter(slug__in=slugs))
        if len(products) != len(slugs):raise CommandError("Expected catalogue products missing; aborting")
        categories = {c.slug:c for c in Category.objects.all()}
        if not (set(PRIMARY.values()) | set(SECONDARY.values()) | set(CATEGORY_COPY)).issubset(categories):raise CommandError("Expected categories missing; aborting")
        snapshot = {"products": [{"id":p.pk,"slug":p.slug,"fields":{f:getattr(p,f) for f in FIELDS},"secondary_categories":list(p.secondary_categories.values_list('id',flat=True))} for p in products], "categories":[{"id":categories[slug].pk,"description":categories[slug].description} for slug in CATEGORY_COPY]}
        self.stdout.write(f"Products: {len(products)}; primary mappings: {len(PRIMARY)}; secondary applications: {len(SECONDARY)}; content pages: {len(COPY)}; category guides: {len(CATEGORY_COPY)}")
        if not options["apply"]:return
        if not options["snapshot"]:raise CommandError("--snapshot path required for --apply")
        path = Path(options["snapshot"])
        if path.exists():raise CommandError("Snapshot already exists; preserve original backup")
        path.write_text(json.dumps(snapshot, default=str, indent=2));path.chmod(0o600)
        for product in products:
            if product.slug in PRIMARY:product.category = categories[PRIMARY[product.slug]]
            if product.slug in COPY:
                product.short_description, product.description = COPY[product.slug]
                product.meta_description = product.short_description
                product.benefits=[];product.faqs=[]
                # Remove unsupported specialist applications from these rewritten listings.
                product.applications={
                    "acetone":["Laboratory solvent work", "Laboratory cleaning"],
                    "acetone-technical-grade":["Industrial solvent formulation", "Industrial cleaning"],
                    "caustic-soda-flakes":["Soap and detergent manufacture", "Industrial effluent pH adjustment"],
                    "poly-aluminium-chloride-pac":["Process-water clarification", "Industrial effluent coagulation"],
                    "aluminium-sulphate-alum":["Industrial effluent clarification", "Process-water coagulation"],
                    "hydrogen-peroxide-50":["Industrial bleaching", "Industrial oxidation"],
                }[product.slug]
            if product.slug in {"benzalkonium-chloride-solution-50", "phosphoric-acid-85"}:
                # Packaging differs; equivalence and supplier identity remain unverified.
                product.canonical_url = ""
                product.description += "\n\nWhen comparing this listing with other concentrations or packaging options, state the exact grade, pack and intended use in your request. Confirm the supplier specification and any specialised-use approval before ordering."
            product.save()
            if product.slug in SECONDARY:product.secondary_categories.add(categories[SECONDARY[product.slug]])
        for slug, description in CATEGORY_COPY.items():
            category = categories[slug];category.description = description;category.save()
        # This command intentionally does not enqueue emails, delete records or change stock/price.
