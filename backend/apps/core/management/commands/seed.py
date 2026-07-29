"""Seed the database with a realistic NOKS chemical catalog.

    python manage.py seed          # idempotent, safe to re-run
    python manage.py seed --flush  # wipe seeded content first
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.blog.models import Author, BlogCategory, Post, PostFAQ
from apps.catalog.models import Category, Industry, Manufacturer, PackageSize, Product
from apps.core.models import (
    FAQ,
    Certification,
    ClientLogo,
    Milestone,
    ProcessStep,
    Service,
    Stat,
    TeamMember,
    Testimonial,
    ValueProp,
)

# ── Reference data ────────────────────────────────────────────────

INDUSTRIES = [
    ("Water Treatment", "droplets", "Municipal & industrial water and effluent treatment",
     ["Coagulation & flocculation", "Disinfection", "pH correction", "Scale & corrosion control"]),
    ("Food Processing", "utensils", "Food grade ingredients and processing aids",
     ["Preservation", "Acidity regulation", "Fortification", "CIP sanitation"]),
    ("Agriculture", "sprout", "Soil, crop nutrition and agrochemical inputs",
     ["Fertiliser blending", "Soil conditioning", "Crop protection", "Irrigation treatment"]),
    ("Mining", "mountain", "Mineral processing and extraction reagents",
     ["Flotation", "Leaching", "Dust suppression", "Tailings treatment"]),
    ("Construction", "hard-hat", "Admixtures and construction chemistry",
     ["Concrete admixtures", "Waterproofing", "Surface preparation", "Grouting"]),
    ("Paint & Coatings", "paint-roller", "Pigments, solvents, resins and additives",
     ["Solvent blending", "Pigment dispersion", "Resin manufacture", "Anti-corrosion"]),
    ("Manufacturing", "factory", "General industrial process chemicals",
     ["Process cleaning", "Degreasing", "Boiler treatment", "Raw materials"]),
    ("Textile", "shirt", "Dyeing, bleaching and finishing auxiliaries",
     ["Scouring & bleaching", "Dye fixing", "Softening", "Effluent treatment"]),
    ("Laboratories", "flask-conical", "Analytical reagents and laboratory consumables",
     ["Titration", "Sample preparation", "Media preparation", "Quality control"]),
    ("Oil & Gas", "fuel", "Drilling, production and refinery chemicals",
     ["Drilling fluids", "Demulsifiers", "Corrosion inhibition", "Tank cleaning"]),
    ("Hospitality", "hotel", "Cleaning, laundry and pool chemistry",
     ["Laundry chemistry", "Pool treatment", "Kitchen hygiene", "Surface disinfection"]),
    ("Healthcare", "heart-pulse", "Disinfection and pharmaceutical grade inputs",
     ["Surface disinfection", "Hand hygiene", "Sterilisation", "Excipients"]),
]

CATEGORIES = [
    ("Industrial Chemicals", "beaker", [
        "Acids", "Alkalis & Caustics", "Solvents", "Salts & Inorganics", "Surfactants",
    ]),
    ("Laboratory Reagents", "flask-conical", [
        "Analytical Reagents", "Indicators & Stains", "Buffer Solutions", "Culture Media",
    ]),
    ("Water Treatment Chemicals", "droplets", [
        "Coagulants & Flocculants", "Disinfectants", "pH Adjusters", "Antiscalants",
    ]),
    ("Food Grade Chemicals", "utensils", [
        "Preservatives", "Acidulants", "Sweeteners & Additives",
    ]),
    ("Specialty Chemicals", "atom", [
        "Cleaning & Hygiene", "Construction Admixtures", "Textile Auxiliaries",
    ]),
]

MANUFACTURERS = [
    ("Solvay", "Belgium"), ("BASF", "Germany"), ("Merck Millipore", "Germany"),
    ("Tata Chemicals", "India"), ("Sinochem", "China"), ("NOKS Blends", "Kenya"),
]

PACKAGES = ["500 g", "1 kg", "2.5 L", "5 L", "20 L", "25 kg bag", "50 kg drum",
            "200 L drum", "1000 kg IBC", "Bulk tanker"]

# name, category, formula, CAS, grade, short desc, applications, benefits, specs, packaging, industries
PRODUCTS = [
    ("Caustic Soda Flakes", "Alkalis & Caustics", "NaOH", "1310-73-2", "industrial",
     "High-purity sodium hydroxide flakes (98% min) for pH correction, saponification and industrial cleaning.",
     ["pH correction in effluent treatment", "Soap and detergent manufacture", "Textile mercerising",
      "Pulp and paper processing", "CIP cleaning of process lines"],
     ["98% minimum assay", "Low chloride and iron content", "Consistent flake size, easy dissolution",
      "Available ex-stock Nairobi"],
     {"Appearance": "White flakes", "Assay (NaOH)": "≥ 98%", "Sodium carbonate": "≤ 0.5%",
      "Sodium chloride": "≤ 0.05%", "Iron (Fe)": "≤ 30 ppm"},
     ["25 kg bag", "Bulk tanker"], ["Water Treatment", "Textile", "Manufacturing", "Hospitality"]),

    ("Hydrochloric Acid 33%", "Acids", "HCl", "7647-01-0", "industrial",
     "Technical grade hydrochloric acid, 33% w/w, for pH control, pickling and regeneration duties.",
     ["pH reduction in water treatment", "Steel pickling and descaling", "Ion exchange resin regeneration",
      "Borehole and well rehabilitation", "Concrete surface etching"],
     ["Consistent 33% ± 1% concentration", "Low iron for sensitive applications",
      "Supplied in UN-approved containers", "Full SDS and handling training provided"],
     {"Appearance": "Clear to pale yellow liquid", "Assay (HCl)": "33% ± 1%",
      "Specific gravity": "1.16 g/cm³", "Iron (Fe)": "≤ 5 ppm"},
     ["20 L", "200 L drum", "Bulk tanker"], ["Water Treatment", "Mining", "Construction", "Manufacturing"]),

    ("Sulphuric Acid 98%", "Acids", "H₂SO₄", "7664-93-9", "industrial",
     "Concentrated sulphuric acid for battery, fertiliser, mineral processing and effluent neutralisation.",
     ["Fertiliser manufacture", "Mineral leaching", "Effluent pH correction",
      "Battery electrolyte preparation", "Dehydrating agent in synthesis"],
     ["98% concentration", "Low residue on ignition", "Dedicated bulk delivery fleet",
      "Technical handling support included"],
     {"Appearance": "Colourless oily liquid", "Assay": "≥ 98%",
      "Specific gravity": "1.84 g/cm³", "Residue on ignition": "≤ 0.01%"},
     ["200 L drum", "Bulk tanker"], ["Mining", "Agriculture", "Manufacturing", "Water Treatment"]),

    ("Aluminium Sulphate (Alum)", "Coagulants & Flocculants", "Al₂(SO₄)₃·14H₂O", "10043-01-3",
     "technical",
     "Primary coagulant for potable and wastewater clarification, supplied in slabs, kibbled or liquid form.",
     ["Drinking water clarification", "Municipal wastewater treatment", "Paper sizing",
      "Industrial effluent treatment", "Phosphate removal"],
     ["17% Al₂O₃ guaranteed", "Low insolubles for reduced sludge", "Rapid floc formation",
      "NSF-comparable potable water quality"],
     {"Appearance": "Off-white slabs / kibbled", "Al₂O₃ content": "≥ 17%",
      "Iron (Fe₂O₃)": "≤ 0.5%", "Insolubles": "≤ 0.3%", "pH (1% solution)": "3.0 – 3.5"},
     ["25 kg bag", "50 kg drum", "Bulk tanker"], ["Water Treatment", "Manufacturing"]),

    ("Poly Aluminium Chloride (PAC)", "Coagulants & Flocculants", "Aln(OH)mCl(3n-m)", "1327-41-9",
     "technical",
     "High-basicity PAC coagulant delivering faster settling and lower sludge volumes than alum.",
     ["Potable water treatment", "Textile effluent decolourisation", "Paper mill clarification",
      "Turbidity removal at low temperature", "Oil-water separation"],
     ["Effective across pH 5–9", "Up to 40% less sludge than alum", "Minimal alkalinity consumption",
      "Powder and liquid grades available"],
     {"Appearance": "Pale yellow powder", "Al₂O₃": "30% ± 1%", "Basicity": "60 – 75%",
      "Water insolubles": "≤ 0.5%", "pH (1% solution)": "3.5 – 5.0"},
     ["25 kg bag", "1000 kg IBC"], ["Water Treatment", "Textile", "Manufacturing"]),

    ("Calcium Hypochlorite 70%", "Disinfectants", "Ca(ClO)₂", "7778-54-3", "industrial",
     "Granular chlorine donor (70% available chlorine) for water disinfection and pool sanitation.",
     ["Drinking water disinfection", "Swimming pool sanitation", "Surface and equipment disinfection",
      "Borehole shock chlorination", "Wastewater final disinfection"],
     ["70% available chlorine", "Stable, slow-dissolving granules", "Long shelf life when stored dry",
      "Sealed drums prevent moisture ingress"],
     {"Appearance": "White granules", "Available chlorine": "≥ 70%", "Moisture": "≤ 8%",
      "Bulk density": "0.9 g/cm³"},
     ["5 L", "25 kg bag", "50 kg drum"], ["Water Treatment", "Hospitality", "Healthcare"]),

    ("Sodium Hypochlorite 12%", "Disinfectants", "NaOCl", "7681-52-9", "industrial",
     "Liquid chlorine bleach at 12% available chlorine for continuous dosing and sanitation.",
     ["Continuous water disinfection", "CIP sanitation in food plants", "Laundry bleaching",
      "Cooling tower biocide", "Odour control"],
     ["12% available chlorine at dispatch", "Low-metal formulation for slow decay",
      "Delivered in vented HDPE containers", "Bulk dosing tanks available on loan"],
     {"Appearance": "Pale yellow liquid", "Available chlorine": "12% ± 0.5%",
      "Free alkali (NaOH)": "0.5 – 1.0%", "Specific gravity": "1.20 g/cm³"},
     ["20 L", "200 L drum", "Bulk tanker"], ["Water Treatment", "Food Processing", "Hospitality", "Healthcare"]),

    ("Citric Acid Monohydrate", "Acidulants", "C₆H₈O₇·H₂O", "5949-29-1", "food",
     "Food grade citric acid for acidity regulation, flavour enhancement and chelation.",
     ["Beverage acidity regulation", "Jam and confectionery production", "Dairy pH control",
      "Descaling and CIP cleaning", "Chelating agent in cosmetics"],
     ["99.5% – 100.5% assay", "Meets FCC and BP monographs", "Non-GMO, kosher and halal certified",
      "Fine and granular mesh available"],
     {"Appearance": "White crystalline powder", "Assay": "99.5 – 100.5%",
      "Heavy metals": "≤ 10 ppm", "Sulphated ash": "≤ 0.05%", "Water content": "7.5 – 9.0%"},
     ["1 kg", "25 kg bag"], ["Food Processing", "Hospitality", "Healthcare", "Laboratories"]),

    ("Sodium Bicarbonate — Food Grade", "Preservatives", "NaHCO₃", "144-55-8", "food",
     "Food grade sodium bicarbonate for leavening, pH buffering and effervescence.",
     ["Bakery leavening", "Beverage carbonation", "Animal feed buffering",
      "Effervescent formulations", "Flue gas and pH neutralisation"],
     ["99% minimum assay", "FCC and BP compliant", "Low heavy metals",
      "Multiple particle sizes for dosing control"],
     {"Appearance": "White crystalline powder", "Assay (NaHCO₃)": "≥ 99%",
      "Chloride": "≤ 0.02%", "Heavy metals": "≤ 5 ppm", "Loss on drying": "≤ 0.25%"},
     ["1 kg", "25 kg bag"], ["Food Processing", "Agriculture", "Healthcare"]),

    ("Sodium Hydroxide Pellets — AR", "Analytical Reagents", "NaOH", "1310-73-2", "laboratory",
     "Analytical reagent grade sodium hydroxide pellets for titration and standard preparation.",
     ["Preparation of standard solutions", "Acid-base titration", "Sample digestion",
      "pH adjustment in analysis", "Media preparation"],
     ["≥ 97% assay, AR specification", "Certificate of analysis with every batch",
      "Low carbonate content", "Moisture-resistant packaging"],
     {"Appearance": "White pellets", "Assay": "≥ 97%", "Carbonate (Na₂CO₃)": "≤ 1.0%",
      "Chloride": "≤ 0.01%", "Heavy metals": "≤ 20 ppm"},
     ["500 g", "1 kg"], ["Laboratories", "Healthcare"]),

    ("Methanol — Analytical Grade", "Solvents", "CH₃OH", "67-56-1", "laboratory",
     "High-purity methanol (99.9%) suitable for HPLC, extraction and analytical work.",
     ["HPLC mobile phase", "Sample extraction", "Laboratory cleaning",
      "Biodiesel transesterification", "Solvent for synthesis"],
     ["99.9% purity", "Low water and residue content", "UV-transparent, HPLC grade available",
      "Supplied with full COA"],
     {"Appearance": "Clear colourless liquid", "Purity": "≥ 99.9%", "Water": "≤ 0.05%",
      "Residue after evaporation": "≤ 0.001%", "Boiling point": "64.7 °C"},
     ["2.5 L", "20 L", "200 L drum"], ["Laboratories", "Oil & Gas", "Paint & Coatings"]),

    ("Isopropyl Alcohol 99%", "Solvents", "C₃H₈O", "67-63-0", "technical",
     "Technical and pharmaceutical grade IPA for cleaning, disinfection and formulation.",
     ["Surface and equipment disinfection", "Electronics and optics cleaning",
      "Hand sanitiser formulation", "Ink and coating thinning", "Extraction solvent"],
     ["99% minimum purity", "Low water content", "Pharma grade available on request",
      "Ex-stock availability in Nairobi"],
     {"Appearance": "Clear colourless liquid", "Purity": "≥ 99%", "Water": "≤ 0.2%",
      "Acidity (as acetic acid)": "≤ 0.002%", "Specific gravity": "0.785 g/cm³"},
     ["5 L", "20 L", "200 L drum"], ["Healthcare", "Manufacturing", "Laboratories", "Hospitality"]),

    ("Soda Ash Dense (Sodium Carbonate)", "Salts & Inorganics", "Na₂CO₃", "497-19-8", "industrial",
     "Dense soda ash for glass manufacture, alkalinity correction and detergent production.",
     ["Water alkalinity and pH correction", "Glass manufacture", "Detergent formulation",
      "Textile scouring", "Flue gas desulphurisation"],
     ["99.2% minimum assay", "Dense grade for reduced dust", "Low chloride",
      "Reliable bulk supply chain"],
     {"Appearance": "White granular powder", "Assay (Na₂CO₃)": "≥ 99.2%",
      "Sodium chloride": "≤ 0.5%", "Iron": "≤ 35 ppm", "Bulk density": "1.0 g/cm³"},
     ["25 kg bag", "1000 kg IBC", "Bulk tanker"], ["Water Treatment", "Textile", "Manufacturing"]),

    ("Sodium Lauryl Ether Sulphate (SLES 70%)", "Surfactants", "C₁₂H₂₅(OCH₂CH₂)₂OSO₃Na",
     "68585-34-2", "technical",
     "Primary anionic surfactant paste (70% active) for detergents, shampoos and industrial cleaners.",
     ["Liquid detergent manufacture", "Shampoo and body wash formulation",
      "Industrial degreasers", "Car and floor care products", "Foaming agent"],
     ["70% active matter", "Low salt, low dioxane grade", "Excellent foaming and viscosity response",
      "Consistent batch-to-batch quality"],
     {"Appearance": "White viscous paste", "Active matter": "70% ± 2%",
      "Sodium chloride": "≤ 1.0%", "pH (1% solution)": "7.0 – 9.5", "Free oil": "≤ 2%"},
     ["50 kg drum", "200 L drum"], ["Manufacturing", "Hospitality", "Textile"]),

    ("Hydrogen Peroxide 50%", "Disinfectants", "H₂O₂", "7722-84-1", "technical",
     "Stabilised 50% hydrogen peroxide for bleaching, disinfection and advanced oxidation.",
     ["Textile bleaching", "Aseptic packaging sterilisation", "Advanced oxidation of effluent",
      "Pulp bleaching", "Borehole iron removal"],
     ["50% w/w concentration", "Stabilised for extended shelf life",
      "Leaves only water and oxygen", "Vented containers for safe storage"],
     {"Appearance": "Clear colourless liquid", "Assay": "50% ± 1%",
      "Stability (at 100 °C)": "≥ 97%", "Total carbon": "≤ 300 ppm"},
     ["20 L", "200 L drum", "1000 kg IBC"], ["Textile", "Food Processing", "Water Treatment", "Healthcare"]),

    ("Calcium Chloride 94% Prills", "Salts & Inorganics", "CaCl₂", "10043-52-4", "industrial",
     "Anhydrous calcium chloride prills for dust control, concrete acceleration and drilling fluids.",
     ["Road dust suppression", "Concrete set acceleration", "Drilling and completion fluids",
      "Refrigeration brines", "Desiccant applications"],
     ["94% minimum assay", "Free-flowing prills, low caking", "Rapid dissolution with high heat release",
      "Moisture-barrier packaging"],
     {"Appearance": "White prills", "Assay (CaCl₂)": "≥ 94%",
      "Alkali chlorides": "≤ 5%", "Magnesium": "≤ 0.5%", "Moisture": "≤ 5%"},
     ["25 kg bag", "1000 kg IBC"], ["Construction", "Oil & Gas", "Mining", "Agriculture"]),

    ("Titanium Dioxide (Rutile)", "Salts & Inorganics", "TiO₂", "13463-67-7", "industrial",
     "Rutile-grade titanium dioxide pigment delivering high opacity and weather durability.",
     ["Decorative and industrial paint", "Plastic masterbatch", "Paper coating",
      "Printing inks", "Powder coatings"],
     ["≥ 93% TiO₂ content", "Excellent whiteness and hiding power",
      "Surface-treated for easy dispersion", "Outstanding UV durability"],
     {"Appearance": "White powder", "TiO₂ content": "≥ 93%", "Rutile content": "≥ 98%",
      "Oil absorption": "18 g/100 g", "pH (aqueous)": "6.5 – 8.5"},
     ["25 kg bag"], ["Paint & Coatings", "Manufacturing", "Construction"]),

    ("Xanthan Gum — Food Grade", "Sweeteners & Additives", "C₃₅H₄₉O₂₉", "11138-66-2", "food",
     "Food grade xanthan gum for viscosity control, suspension and texture in food and drilling fluids.",
     ["Sauce and dressing thickening", "Gluten-free baking", "Beverage suspension",
      "Oil drilling fluid viscosifier", "Cosmetic stabilisation"],
     ["80 and 200 mesh available", "Stable across wide pH and temperature range",
      "Kosher and halal certified", "Excellent freeze-thaw stability"],
     {"Appearance": "Cream-coloured powder", "Viscosity (1% KCl)": "1200 – 1600 cP",
      "Loss on drying": "≤ 13%", "Ash": "≤ 13%", "Particle size": "≥ 95% through 80 mesh"},
     ["1 kg", "25 kg bag"], ["Food Processing", "Oil & Gas", "Hospitality"]),
]

SERVICES = [
    ("Chemical Supply", "package", "Reliable ex-stock and indent supply of over 1,200 industrial and laboratory chemicals.",
     ["Ex-stock Nairobi warehouse", "Scheduled call-off contracts", "Emergency same-day dispatch"]),
    ("Technical Consultation", "microscope", "Application engineering support from qualified chemists — dosing, trials and troubleshooting.",
     ["On-site plant audits", "Jar testing and dosage optimisation", "Operator training"]),
    ("Import & Export", "ship", "End-to-end import handling and regional distribution across East Africa.",
     ["Customs and KEBS clearance", "Hazardous goods documentation", "Regional freight"]),
    ("Custom Packaging", "boxes", "Repackaging and private-label filling from 500 g laboratory packs to 1000 kg IBCs.",
     ["Private label service", "Nitrogen blanketing", "Tamper-evident sealing"]),
    ("Chemical Sourcing", "search", "Global sourcing for specialty and hard-to-find chemicals with verified supply chains.",
     ["Verified manufacturer network", "Sample-first evaluation", "Full COA traceability"]),
    ("Bulk Distribution", "truck", "Dedicated tanker and bulk logistics with GPS-tracked, ADR-compliant delivery.",
     ["Tanker and flexitank delivery", "Bulk storage tank loan", "GPS-tracked fleet"]),
    ("Laboratory Support", "flask-conical", "Analytical reagents, consumables and method support for QC laboratories.",
     ["Reagent supply programmes", "Method validation support", "Calibration standards"]),
    ("Industrial Solutions", "settings", "Turnkey treatment programmes combining chemistry, dosing equipment and service.",
     ["Dosing system supply", "Performance-based contracts", "Monthly reporting"]),
]

VALUE_PROPS = [
    ("Certified Products", "badge-check",
     "Every batch ships with a Certificate of Analysis and full SDS documentation, traceable to source."),
    ("Fast Delivery", "truck",
     "Same-day dispatch within Nairobi and 24–72 hour delivery across Kenya and East Africa."),
    ("Technical Support", "headset",
     "Qualified chemists on call for dosing, compatibility, handling and troubleshooting."),
    ("Competitive Pricing", "tag",
     "Direct manufacturer relationships and bulk buying power translate into transparent pricing."),
    ("Bulk Supply", "warehouse",
     "From 500 g laboratory packs to full tanker loads, with dedicated bulk storage and logistics."),
    ("Expert Team", "users",
     "Over 15 years of applied chemical expertise across water, food, mining and manufacturing."),
]

PROCESS = [
    ("Consultation", "message-circle", "We start by understanding your process, volumes and quality requirements.", "Same day"),
    ("Product Selection", "list-checks", "Our chemists recommend the right grade, concentration and packaging.", "Within 24 hrs"),
    ("Quotation", "file-text", "You receive a detailed quotation with specifications, pricing and lead time.", "Within 24 hrs"),
    ("Order Confirmation", "check-circle", "We confirm stock, documentation and delivery schedule in writing.", "1–2 days"),
    ("Delivery", "truck", "Goods dispatched with COA, SDS and compliant hazardous-goods handling.", "1–5 days"),
    ("Technical Support", "life-buoy", "Ongoing dosing optimisation, retesting and supply planning.", "Continuous"),
]

MILESTONES = [
    ("2010", "Founded in Nairobi", "NOKS opens its first warehouse serving Nairobi's industrial area with core commodity chemicals."),
    ("2014", "Laboratory division launched", "Analytical reagents and laboratory consumables added, serving universities and QC labs."),
    ("2017", "Water treatment specialisation", "Dedicated water treatment programme launched with jar testing and dosing support."),
    ("2020", "Food grade certification", "Food grade handling and storage certified, opening the beverage and dairy sectors."),
    ("2023", "Regional expansion", "Distribution extended to Uganda, Tanzania, Rwanda and beyond — eight countries served."),
    ("2025", "Digital catalog & AI assistant", "Full technical catalog published online with AI-guided product selection."),
]

TESTIMONIALS = [
    ("Peter Kamau", "Plant Manager", "Nairobi Water & Sewerage", 5, "google",
     "NOKS has supplied our coagulants for four years without a single stock-out. Their jar testing support cut our alum dosage by 18% — that's a real saving on every megalitre we treat."),
    ("Dr. Amina Yusuf", "Quality Assurance Lead", "Rift Valley Beverages", 5, "google",
     "Food grade citric acid and sodium bicarbonate delivered with full documentation, every time. The COA arrives before the truck does, which makes our audits painless."),
    ("James Otieno", "Procurement Director", "Kilimanjaro Mining Ltd", 5, "direct",
     "Bulk sulphuric acid across the border used to be a logistics nightmare. NOKS handles clearance and delivery end to end — we simply confirm the schedule."),
    ("Grace Wanjiru", "Laboratory Manager", "Kenyatta University", 5, "google",
     "Analytical reagents with proper certificates, competitive pricing and genuinely fast turnaround. Their team understands what a teaching lab actually needs."),
    ("Samuel Mwangi", "Operations Head", "Coastal Textiles", 5, "linkedin",
     "The switch to their PAC coagulant cut our effluent sludge volume by nearly a third. Technical support came on site to run the trials with us."),
]

FAQS = [
    ("Do you supply chemicals outside Nairobi?",
     "Yes. We deliver countrywide across Kenya and export to Uganda, Tanzania, Rwanda, Burundi, South Sudan, Ethiopia and the DRC. Nairobi orders are typically dispatched the same day, upcountry within 24–72 hours, and regional exports within 3–7 working days depending on customs clearance."),
    ("What is your minimum order quantity?",
     "It varies by product. Laboratory reagents start from 500 g or 1 litre packs, while industrial commodities typically start at one 25 kg bag or 20 litre container. Bulk tanker deliveries start at 5 tonnes. The minimum order quantity is listed on each product page."),
    ("Do your products come with a Certificate of Analysis?",
     "Every batch ships with a Certificate of Analysis and a Safety Data Sheet. Technical datasheets are downloadable directly from each product page, and we retain batch records for full traceability."),
    ("How do I request a quotation?",
     "Use the Request Quote button on any product page, build a multi-product request from the catalog, or talk to our AI assistant. You will receive a written quotation with specifications, pricing, packaging and lead time within one business day."),
    ("Can you source a chemical that isn't in your catalog?",
     "Yes — chemical sourcing is one of our core services. Send us the name, CAS number or specification and we will identify a verified manufacturer, supply a sample for evaluation where practical, and quote on a delivered basis."),
    ("Are your food grade chemicals certified?",
     "Our food grade range meets FCC, BP or equivalent monographs and is stored in a segregated, food-safe area. Kosher and halal certificates are available for the relevant products on request."),
    ("How should hazardous chemicals be stored on our site?",
     "Storage requirements differ by product and are set out in section 7 of each Safety Data Sheet. Our technical team can carry out a site assessment and advise on segregation, bunding, ventilation and PPE before your first delivery."),
    ("Do you offer credit terms?",
     "Yes, for established accounts. New customers typically start on pro-forma terms, and we review credit facilities after a short trading history. Contact our sales team to begin the account opening process."),
]

CERTIFICATIONS = [
    ("ISO 9001:2015", "Quality Management", "Certified quality management across sourcing, storage and dispatch."),
    ("KEBS Approved", "Kenya Bureau of Standards", "Products conform to applicable Kenyan standards and import requirements."),
    ("Food Safety Compliant", "HACCP-aligned", "Segregated food grade storage and handling under HACCP-aligned controls."),
    ("GHS Compliant", "Globally Harmonised System", "Full GHS labelling and Safety Data Sheets on every hazardous product."),
]

TEAM = [
    ("Dr. Nelson Okoth", "Managing Director",
     "Industrial chemist with over 20 years in chemical distribution and water treatment across East Africa."),
    ("Faith Njeri", "Head of Technical Services",
     "Leads application engineering, jar testing and on-site dosing optimisation for municipal and industrial clients."),
    ("Brian Kiptoo", "Supply Chain Manager",
     "Manages import clearance, hazardous goods documentation and the regional distribution fleet."),
    ("Mercy Achieng", "Laboratory Sales Lead",
     "Supports universities, hospitals and QC laboratories with reagents, standards and method guidance."),
]

CLIENTS = ["Nairobi Water", "Rift Valley Beverages", "Kilimanjaro Mining", "Coastal Textiles",
           "Kenyatta University", "Highlands Dairy", "Savannah Cement", "East Africa Breweries"]

BLOG_CATEGORIES = [
    ("Industrial Chemicals", "beaker", "Guidance on commodity chemicals, grades and industrial applications."),
    ("Water Treatment", "droplets", "Coagulation, disinfection and effluent treatment practice."),
    ("Food Ingredients", "utensils", "Food grade additives, compliance and processing aids."),
    ("Laboratory Science", "flask-conical", "Reagents, analytical methods and laboratory best practice."),
    ("Chemical Safety", "shield-check", "Safe storage, handling, transport and regulatory compliance."),
    ("Industry News", "newspaper", "Market movements and regulatory updates across East Africa."),
    ("Buying Guides", "shopping-cart", "How to specify, compare and procure chemicals with confidence."),
]

POSTS = [
    ("How to Choose the Right Coagulant for Water Treatment", "Water Treatment",
     "Alum, PAC or ferric? A practical comparison of the three most common coagulants used in East African water treatment plants, with dosing guidance and cost considerations.",
     """Choosing a coagulant is one of the highest-leverage decisions in any water treatment plant. Get it right and you cut chemical spend, reduce sludge handling and produce consistently clear water. Get it wrong and you chase turbidity all day.

## The three workhorses

**Aluminium sulphate (alum)** remains the most widely used coagulant in Kenya. It is inexpensive, well understood and effective on moderate-to-high turbidity raw water. Its weaknesses are a narrow optimum pH window (typically 6.5–7.5), significant alkalinity consumption and comparatively high sludge production.

**Poly aluminium chloride (PAC)** is a pre-hydrolysed coagulant. Because part of the hydrolysis has already happened during manufacture, PAC works across a wider pH band (roughly 5–9), consumes far less alkalinity and produces noticeably less sludge — often 30–40% less than alum on the same water. It also performs better in cold water, which matters at higher-altitude plants.

**Ferric chloride** excels on water with high natural organic matter and in phosphate removal duties. It works at lower pH than alum and produces a dense, fast-settling floc. The trade-offs are corrosivity, staining risk and the need for corrosion-resistant dosing equipment.

## Let the jar test decide

No specification sheet substitutes for a jar test on your actual raw water. Run each candidate coagulant across a dose range, record settled turbidity at 30 minutes, and note the pH shift. Compare on delivered cost per megalitre treated — not on price per tonne. A coagulant that costs 20% more per tonne but works at 60% of the dose is the cheaper option.

## Watch the alkalinity

Alum consumes roughly 0.5 mg/L of alkalinity as CaCO₃ for every 1 mg/L dosed. On soft raw water this quickly drives pH below the coagulation optimum, at which point you are buying soda ash to correct what the alum did. PAC's lower alkalinity demand often eliminates that secondary chemical entirely — a saving that rarely shows up in the initial price comparison.

## Seasonal reality

Raw water quality in East Africa swings hard between dry and wet seasons. Turbidity that sits at 15 NTU in January can hit 400 NTU after heavy rain. Plants that fix a single dose rate year-round overdose for eight months and underdose for two. Re-run jar tests at least quarterly, and always after a major catchment event.

Our technical team runs jar testing on site at no charge for clients evaluating a coagulant change. It usually pays for itself in the first month.""",
     [("Is PAC always better than alum?",
       "Not always. PAC generally produces less sludge and works across a wider pH range, but alum can be more economical on consistently high-turbidity water where its higher dose is offset by a lower unit price. A jar test on your own raw water is the only reliable way to decide."),
      ("How often should I run jar tests?",
       "At minimum quarterly, and always after a significant change in raw water quality such as heavy rainfall in the catchment. Plants with highly variable sources benefit from monthly testing."),
      ("Can I switch coagulants without changing my dosing equipment?",
       "Usually yes when moving between alum and PAC, though PAC is typically dosed at a lower rate so pump settings need recalibration. Switching to ferric chloride normally requires corrosion-resistant pumps and lines.")],
     ["Aluminium Sulphate (Alum)", "Poly Aluminium Chloride (PAC)", "Soda Ash Dense (Sodium Carbonate)"]),

    ("Food Grade vs Industrial Grade Chemicals: What Actually Differs", "Food Ingredients",
     "The difference between food grade and industrial grade goes well beyond purity numbers. Here is what changes in specification, documentation, handling and liability.",
     """Buyers regularly ask whether they can save money by using industrial grade material in a food application. The honest answer is no — and the reasons are more interesting than a simple purity percentage.

## Purity is only the visible difference

An industrial grade citric acid might assay at 99.5%, exactly the same headline figure as the food grade product. The difference lies in what makes up the remaining 0.5%. Food grade material is manufactured and tested against specific limits for heavy metals, arsenic, lead and microbiological contamination. Industrial grade simply is not tested for these.

## Compliance monographs

Food grade chemicals conform to a recognised monograph — the Food Chemicals Codex (FCC), the British Pharmacopoeia (BP), or an equivalent. These documents specify not just assay but identification tests, impurity limits and the analytical methods used to verify them. An industrial specification carries no such obligation.

## Manufacturing environment

Food grade production runs in facilities with documented hygiene controls, segregated equipment and validated cleaning between products. The same reactor that made an industrial batch yesterday cannot make a food batch today without validated changeover.

## Storage and handling at the distributor

This is where many supply chains quietly fail. A correctly manufactured food grade chemical stored beside solvents in a shared warehouse, handled with the same pallet jack used for pesticides, is no longer reliably food safe. Ask your supplier directly how food grade stock is segregated.

## Documentation you should insist on

For every food grade delivery you should receive a Certificate of Analysis referencing the applicable monograph, a Safety Data Sheet, an allergen and GMO statement, and where relevant kosher and halal certificates. If a supplier cannot produce these on request, treat the material as industrial grade regardless of what the label says.

## The liability question

If a contaminated ingredient reaches a consumer, the food manufacturer carries the primary liability — not the chemical supplier. The modest premium for verified food grade material buys documented traceability, which is exactly what a regulator or an insurer will ask for.""",
     [("Can industrial grade be used in food if it tests clean?",
       "No. A single passing test does not establish the ongoing controls, segregation and traceability that food safety systems and regulators require. Certification covers the process, not just one batch."),
      ("What certificates should accompany a food grade delivery?",
       "A batch-specific Certificate of Analysis referencing FCC, BP or an equivalent monograph, a current Safety Data Sheet, and allergen and GMO statements. Kosher and halal certificates are available for many products on request."),
      ("Does food grade material have a shorter shelf life?",
       "Not inherently, but storage conditions matter more. Hygroscopic food grade powders such as citric acid should be kept sealed in a dry, temperature-controlled area, away from any industrial chemical storage.")],
     ["Citric Acid Monohydrate", "Sodium Bicarbonate — Food Grade", "Xanthan Gum — Food Grade"]),

    ("Safe Storage and Handling of Industrial Acids", "Chemical Safety",
     "A practical guide to storing hydrochloric and sulphuric acid on industrial sites — segregation, bunding, PPE and the spill response steps that actually matter.",
     """Acid incidents are rarely caused by exotic failures. They are caused by an incompatible chemical stored on the wrong shelf, a bund that was never sized correctly, or an operator who did not know where the eyewash station was.

## Segregation is the first control

Acids must be stored away from alkalis, oxidisers, cyanides and sulphides. Mixing hydrochloric acid with sodium hypochlorite releases chlorine gas; contact with cyanide salts releases hydrogen cyanide. Physical separation by a wall or a dedicated store is the only reliable control. Adjacent shelving in the same bund does not qualify.

## Size the bund properly

A bund should hold at least 110% of the largest single container it serves, or 25% of the total stored volume, whichever is greater. It must be constructed from acid-resistant material — plain concrete degrades under sulphuric acid — and must have no drain to storm water.

## Ventilation and temperature

Concentrated hydrochloric acid gives off corrosive fumes that will attack nearby steelwork and electrical fittings. Store in a well-ventilated area, ideally with local extraction, and keep out of direct sunlight. Sulphuric acid generates significant heat when it contacts water, so keep the store dry.

## PPE that is actually available

Chemical splash goggles, a face shield, acid-resistant gloves (neoprene or butyl, not latex) and an apron should be stored at the point of use, not in a supervisor's office. An emergency shower and eyewash must be within ten seconds' walk and tested weekly.

## Decanting: always acid to water

When diluting, add acid to water slowly with stirring — never the reverse. Adding water to concentrated sulphuric acid causes violent, localised boiling that ejects acid from the vessel.

## Spill response, in order

Evacuate and isolate the area. Do not use water on a concentrated acid spill — it generates heat and spreads the material. Contain with an inert absorbent such as vermiculite or dry sand, then neutralise carefully with soda ash or lime. Collect the residue for licensed disposal. Only trained personnel in full PPE should approach.

## Documentation

Keep the current Safety Data Sheet at the store, not in a filing cabinet. Section 7 covers handling and storage, section 8 covers exposure controls and PPE. Train new operators against it and record the training.""",
     [("Can hydrochloric and sulphuric acid be stored together?",
       "Yes, mineral acids are generally compatible with each other and may share a store. Both must be kept well away from alkalis, oxidisers, cyanides and sulphides."),
      ("What neutralises an acid spill?",
       "Soda ash or hydrated lime, applied carefully to contained material. Never apply water directly to a concentrated acid spill — it generates heat and spreads the spill."),
      ("What PPE is required for decanting concentrated acid?",
       "Chemical splash goggles plus a face shield, acid-resistant gloves such as neoprene or butyl, an acid-resistant apron and closed footwear. An emergency shower and eyewash must be immediately accessible.")],
     ["Hydrochloric Acid 33%", "Sulphuric Acid 98%", "Soda Ash Dense (Sodium Carbonate)"]),

    ("Understanding CAS Numbers and Chemical Specifications", "Buying Guides",
     "How to read a chemical specification sheet, why the CAS number matters more than the trade name, and the specification traps that cost buyers money.",
     """Two suppliers quote what appears to be the same product at prices 30% apart. Before assuming one is overcharging, read both specifications properly.

## Start with the CAS number

A CAS Registry Number uniquely identifies a chemical substance regardless of trade name, language or supplier. Caustic soda, sodium hydroxide, lye and NaOH all share CAS 1310-73-2. When comparing quotes, match on CAS number first — trade names mislead, CAS numbers do not.

Note that CAS numbers identify the substance, not the hydrate form or concentration. Citric acid anhydrous (77-92-9) and citric acid monohydrate (5949-29-1) carry different numbers, and buying the wrong one changes your dosing arithmetic by about 8%.

## Assay is the headline, impurities are the story

Assay tells you how much of the substance is present. The impurity profile tells you what else you are buying. For water treatment, iron content matters because it causes colour. For electronics cleaning, chloride matters because it causes corrosion. For food, heavy metals matter because they are regulated. A cheaper product with a loose impurity specification is often the more expensive choice once you account for the consequences.

## Concentration and basis

A quote for hydrochloric acid at "33%" should specify whether that is w/w or w/v, and whether the price is per tonne of solution or per tonne of contained HCl. Suppliers who quote on the solution basis for a weaker product appear cheaper until you calculate cost per unit of active chemical.

## Physical form affects your process

Caustic soda flakes dissolve faster than pearls; dense soda ash dusts less than light. Titanium dioxide particle size determines opacity. These attributes rarely appear in a headline price comparison, but they determine whether the material works in your plant.

## What a complete specification includes

A specification worth trusting states appearance, assay with a tolerance, named impurity limits with numeric values, physical properties such as bulk density or specific gravity, packaging, and the test methods used. Vague entries like "high purity" or "meets industry standard" are marketing, not specification.

## Ask for a batch COA before you commit

A specification sheet describes what the supplier intends to deliver. A Certificate of Analysis describes what was actually in a specific batch. Request a recent COA alongside any new quotation, and check it against the specification line by line.""",
     [("Where do I find a product's CAS number?",
       "It appears on the product page of our catalog, on the Certificate of Analysis and in section 1 of the Safety Data Sheet. You can search our catalog directly by CAS number."),
      ("Does the same CAS number guarantee identical products?",
       "It guarantees the same chemical substance, but not the same grade, concentration, physical form or impurity profile. Always compare the full specification, not just the CAS number."),
      ("What is the difference between a specification sheet and a Certificate of Analysis?",
       "A specification sheet states the limits a product is manufactured to. A Certificate of Analysis reports the measured results for one specific batch. Ask for both.")],
     ["Caustic Soda Flakes", "Citric Acid Monohydrate", "Hydrochloric Acid 33%"]),

    ("Setting Up a Reliable QC Laboratory: The Reagent Essentials", "Laboratory Science",
     "A practical starting list of reagents, standards and consumables for a new quality control laboratory, and how to keep them fit for use.",
     """A new QC laboratory usually over-buys glassware and under-buys the reagents that determine whether results are defensible.

## Grades, and when each is appropriate

**Analytical Reagent (AR)** grade is the default for quantitative analysis — titrations, standard preparation, sample digestion. **HPLC grade** solvents are required for chromatography, where UV transparency and low residue matter. **Technical grade** is adequate for cleaning and non-quantitative work. Buying AR grade for glassware rinsing wastes money; buying technical grade for a titration wastes the result.

## The core reagent list

For a general QC laboratory: sodium hydroxide pellets AR and hydrochloric acid AR for acid-base work; a primary standard such as potassium hydrogen phthalate for standardisation; methanol and isopropyl alcohol for extraction and cleaning; buffer solutions at pH 4, 7 and 10 for meter calibration; and appropriate indicators — phenolphthalein and methyl orange cover most titrimetric needs.

## Primary standards deserve real care

Your entire chain of results traces back to primary standards. Buy small quantities, store them sealed in a desiccator, and never return unused material to the bottle. Record the lot number against every standardisation.

## Buffer solutions expire

pH buffers absorb carbon dioxide and support microbial growth once opened. Date the bottle on opening, discard three months later regardless of appearance, and never pour used buffer back. A meter calibrated against a degraded buffer produces confidently wrong numbers.

## Water quality is a reagent decision

Type II deionised water is the minimum for most analytical work. Tap water carries chloride, calcium and organics that interfere with titrations and chromatography. If your results drift inexplicably, test the water before blaming the method.

## Certificates and traceability

Every AR grade reagent should arrive with a batch Certificate of Analysis. File them — an auditor will ask for the COA of the reagent used in a specific test on a specific date. Maintain a reagent register recording receipt date, opening date, lot number and expiry.

## Storage discipline

Segregate acids from bases, keep oxidisers away from flammables, store solvents in a flammables cabinet, and keep light-sensitive reagents in amber glass. Label every prepared solution with contents, concentration, preparer and date. Unlabelled bottles are disposal costs waiting to be incurred.""",
     [("What grade of reagent do I need for titration?",
       "Analytical Reagent (AR) grade or better. Technical grade carries undeclared impurities that shift endpoints and make results indefensible under audit."),
      ("How long do pH buffer solutions last once opened?",
       "Approximately three months for pH 4 and 7, and less for pH 10 which absorbs carbon dioxide readily. Date bottles on opening and never return used buffer to the container."),
      ("Do laboratory reagents come with certificates?",
       "All our AR and HPLC grade reagents ship with a batch-specific Certificate of Analysis. Retain these for your audit trail.")],
     ["Sodium Hydroxide Pellets — AR", "Methanol — Analytical Grade", "Isopropyl Alcohol 99%"]),

    ("Reducing Chemical Costs Without Compromising Water Quality", "Water Treatment",
     "Six evidence-based ways treatment plants cut chemical spend — from dosing control to bulk logistics — without touching the quality of the treated water.",
     """Chemical spend is usually the second-largest operating cost in a water treatment plant after energy. It is also the line item most amenable to improvement, because most plants dose conservatively rather than accurately.

## 1. Dose to the water, not to the habit

Most plants set a dose during commissioning and adjust it rarely. Raw water quality varies daily. Streaming current detectors or regular jar testing let you match dose to actual demand. Plants moving from fixed to responsive dosing typically save 10–20% on coagulant without any change in treated water quality.

## 2. Correct the pH before, not after

Coagulation has a pH optimum. Running outside it means overdosing coagulant to compensate. A modest amount of soda ash or lime to bring raw water into the optimum window often costs less than the extra coagulant it replaces.

## 3. Compare on cost per megalitre treated

Unit price per tonne is the wrong metric. A coagulant costing 25% more per tonne but effective at 60% of the dose is substantially cheaper in service, and it produces less sludge to handle. Build the comparison on delivered cost per megalitre.

## 4. Buy in the right package size

The price gap between 25 kg bags and bulk delivery is significant. If your storage and handling can accommodate IBCs or tanker deliveries, the saving is immediate. Where capital is the barrier, ask about supplier-loaned bulk storage tanks.

## 5. Cut losses in storage and handling

Hygroscopic chemicals absorb moisture and cake. Hypochlorite decays measurably in warm storage — a solution at 12% on delivery can fall below 10% within weeks in an unshaded tank. Shaded, ventilated, correctly rotated storage protects the strength you paid for.

## 6. Consolidate suppliers

Splitting orders across several suppliers to chase the lowest unit price usually costs more in freight, administration and inconsistent quality. Consolidating volume with one supplier improves pricing tiers and simplifies traceability.

## Measure what changes

Record chemical consumption per megalitre treated, monthly. Without that denominator, a fall in consumption looks like a saving when it may simply reflect lower throughput. The metric that matters is chemical cost per unit of water produced, tracked over time.""",
     [("How much can dosing optimisation realistically save?",
       "Plants moving from fixed dosing to jar-test-guided or streaming-current-controlled dosing typically reduce coagulant consumption by 10–20% with no reduction in treated water quality."),
      ("Is bulk delivery worth the storage investment?",
       "For plants using more than roughly five tonnes per month, bulk delivery usually pays back the storage investment within a year. We can supply bulk storage tanks on loan against a supply agreement."),
      ("Does sodium hypochlorite really lose strength in storage?",
       "Yes. Decay accelerates with temperature and light exposure. A 12% solution can drop below 10% within a few weeks in unshaded storage, so keep tanks shaded and ventilated and rotate stock.")],
     ["Poly Aluminium Chloride (PAC)", "Sodium Hypochlorite 12%", "Aluminium Sulphate (Alum)"]),
]


class Command(BaseCommand):
    help = "Seed the NOKS chemical catalog with production-realistic content."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush", action="store_true", help="Delete seeded content before seeding."
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write(self.style.WARNING("Flushing seeded content…"))
            for model in (Post, PostFAQ, BlogCategory, Author, Product, Category, Industry,
                          Manufacturer, PackageSize, Service, ValueProp, ProcessStep,
                          Milestone, Testimonial, ClientLogo, FAQ, Certification,
                          TeamMember, Stat):
                model.objects.all().delete()

        self._superuser()
        industries = self._industries()
        categories = self._categories()
        manufacturers = self._manufacturers()
        packages = self._packages()
        self._products(categories, industries, manufacturers, packages)
        self._site_content()
        self._blog()

        self.stdout.write(self.style.SUCCESS(
            f"\n✓ Seeded {Product.objects.count()} products, "
            f"{Category.objects.count()} categories, {Industry.objects.count()} industries, "
            f"{Post.objects.count()} articles.\n"
            f"  Admin: {settings.API_URL}/{settings.ADMIN_URL}"
        ))

    # ── helpers ───────────────────────────────────────────────

    def _superuser(self):
        User = get_user_model()
        import environ

        env = environ.Env()
        username = env("DJANGO_SUPERUSER_USERNAME", default="admin")
        email = env("DJANGO_SUPERUSER_EMAIL", default="admin@example.com")
        password = env("DJANGO_SUPERUSER_PASSWORD", default="")
        if password and not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f"  Superuser '{username}' created."))

    def _industries(self):
        out = {}
        for i, (name, icon, tagline, apps) in enumerate(INDUSTRIES):
            out[name], _ = Industry.objects.update_or_create(
                name=name,
                defaults={
                    "icon": icon, "tagline": tagline, "applications": apps, "order": i,
                    "description": (
                        f"NOKS supplies certified chemicals and technical support to the "
                        f"{name.lower()} sector across Kenya and East Africa. "
                        f"{tagline}, backed by batch documentation and application engineering."
                    ),
                    "meta_title": f"{name} Chemicals in Kenya | NOKS Chemical Division",
                    "meta_description": (
                        f"Certified chemicals for {name.lower()} in Kenya and East Africa. "
                        f"{tagline}. Request a quotation from NOKS Chemical Division."
                    ),
                },
            )
        self.stdout.write(f"  {len(out)} industries")
        return out

    def _categories(self):
        out = {}
        order = 0
        for parent_name, icon, children in CATEGORIES:
            parent, _ = Category.objects.update_or_create(
                name=parent_name,
                defaults={
                    "icon": icon, "order": order, "is_featured": True,
                    "description": f"Browse our full range of {parent_name.lower()} "
                                   f"available ex-stock and to order across East Africa.",
                    "meta_title": f"{parent_name} Supplier in Kenya | NOKS",
                    "meta_description": (
                        f"Buy {parent_name.lower()} in Kenya from NOKS Chemical Division. "
                        f"Certified quality, full documentation, fast nationwide delivery."
                    ),
                },
            )
            out[parent_name] = parent
            order += 1
            for child_name in children:
                child, _ = Category.objects.update_or_create(
                    name=child_name,
                    defaults={
                        "parent": parent, "order": order,
                        "description": f"{child_name} for industrial and laboratory use.",
                        "meta_title": f"{child_name} Suppliers Kenya | NOKS Chemical Division",
                        "meta_description": (
                            f"{child_name} supplied across Kenya and East Africa with "
                            f"Certificate of Analysis and Safety Data Sheet."
                        ),
                    },
                )
                out[child_name] = child
                order += 1
        self.stdout.write(f"  {len(out)} categories")
        return out

    def _manufacturers(self):
        out = {}
        for i, (name, country) in enumerate(MANUFACTURERS):
            out[name], _ = Manufacturer.objects.update_or_create(
                name=name, defaults={"country": country, "order": i}
            )
        return out

    def _packages(self):
        out = {}
        for i, label in enumerate(PACKAGES):
            out[label], _ = PackageSize.objects.update_or_create(
                label=label, defaults={"order": i}
            )
        return out

    def _products(self, categories, industries, manufacturers, packages):
        mfr_cycle = list(manufacturers.values())
        for i, row in enumerate(PRODUCTS):
            (name, cat, formula, cas, grade, short, apps, benefits,
             specs, pkgs, inds) = row
            product, _ = Product.objects.update_or_create(
                name=name,
                defaults={
                    "category": categories[cat],
                    "manufacturer": mfr_cycle[i % len(mfr_cycle)],
                    "chemical_formula": formula,
                    "cas_number": cas,
                    "grade": grade,
                    "short_description": short,
                    "description": (
                        f"{short}\n\nNOKS Chemical Division supplies {name} across Kenya and "
                        f"East Africa with a batch Certificate of Analysis and Safety Data Sheet "
                        f"on every delivery. Our technical team supports dosage selection, "
                        f"compatibility checks and on-site handling training."
                    ),
                    "applications": apps,
                    "benefits": benefits,
                    "specifications": specs,
                    "packaging_options": pkgs,
                    "storage_handling": (
                        "Store in a cool, dry, well-ventilated area in the original sealed "
                        "container, away from incompatible materials and direct sunlight. "
                        "Keep containers closed when not in use and rotate stock on a "
                        "first-in-first-out basis. Refer to section 7 of the Safety Data Sheet "
                        "for the complete storage specification."
                    ),
                    "safety_information": (
                        "Wear appropriate personal protective equipment including chemical "
                        "splash goggles, gloves and protective clothing. Ensure eyewash and "
                        "emergency shower facilities are accessible. Consult the Safety Data "
                        "Sheet before handling. In case of contact, rinse immediately with "
                        "plenty of water and seek medical advice."
                    ),
                    "hazard_class": "Refer to SDS section 2",
                    "unit": "kg" if "kg" in " ".join(pkgs) else "L",
                    "lead_time": "1–3 working days ex-stock Nairobi",
                    "is_featured": i < 8,
                    "is_bestseller": i < 4,
                    "meta_title": f"{name} Supplier in Kenya | NOKS Chemical Division",
                    "meta_description": short[:300],
                    "meta_keywords": (
                        f"{name} Kenya,{name} price Nairobi,{cas},"
                        f"{name} supplier East Africa,buy {name}"
                    ),
                },
            )
            product.industries.set([industries[n] for n in inds if n in industries])
            product.package_sizes.set([packages[p] for p in pkgs if p in packages])

        # Cross-sell graph: same category first, otherwise the next few products.
        all_products = list(Product.objects.all())
        for product in all_products:
            siblings = [p for p in all_products
                        if p.category_id == product.category_id and p.pk != product.pk][:3]
            if len(siblings) < 3:
                extra = [p for p in all_products if p.pk != product.pk][:3 - len(siblings)]
                siblings += extra
            product.related_products.set(siblings)
            product.frequently_bought_together.set(siblings[:2])

        self.stdout.write(f"  {Product.objects.count()} products")

    def _site_content(self):
        for key, label, suffix, icon in [
            ("NEXT_PUBLIC_STAT_YEARS", "Years Experience", "+", "calendar"),
            ("NEXT_PUBLIC_STAT_PRODUCTS", "Products", "+", "package"),
            ("NEXT_PUBLIC_STAT_COUNTRIES", "Countries Served", "", "globe"),
            ("NEXT_PUBLIC_STAT_INDUSTRIES", "Industries", "", "factory"),
            ("NEXT_PUBLIC_STAT_DELIVERIES", "Deliveries Completed", "+", "truck"),
            ("NEXT_PUBLIC_STAT_SATISFACTION", "Customer Satisfaction", "%", "smile"),
        ]:
            import environ

            env = environ.Env()
            Stat.objects.update_or_create(
                label=label,
                defaults={
                    "value": env.int(key, default=0),
                    "suffix": suffix,
                    "icon": icon,
                    "order": len(Stat.objects.all()),
                },
            )

        for i, (name, icon, summary, highlights) in enumerate(SERVICES):
            Service.objects.update_or_create(
                name=name,
                defaults={"icon": icon, "summary": summary, "highlights": highlights,
                          "order": i,
                          "description": f"{summary} Delivered by NOKS Chemical Division "
                                         f"across Kenya and East Africa."},
            )

        for i, (title, icon, desc) in enumerate(VALUE_PROPS):
            ValueProp.objects.update_or_create(
                title=title, defaults={"icon": icon, "description": desc, "order": i}
            )

        for i, (title, icon, desc, duration) in enumerate(PROCESS):
            ProcessStep.objects.update_or_create(
                title=title,
                defaults={"icon": icon, "description": desc, "duration": duration, "order": i},
            )

        for i, (year, title, desc) in enumerate(MILESTONES):
            Milestone.objects.update_or_create(
                year=year, defaults={"title": title, "description": desc, "order": i}
            )

        for i, (author, role, company, rating, source, quote) in enumerate(TESTIMONIALS):
            Testimonial.objects.update_or_create(
                author=author,
                defaults={"role": role, "company": company, "rating": rating,
                          "source": source, "quote": quote, "order": i},
            )

        for i, name in enumerate(CLIENTS):
            ClientLogo.objects.update_or_create(name=name, defaults={"order": i})

        for i, (question, answer) in enumerate(FAQS):
            FAQ.objects.update_or_create(
                question=question,
                defaults={"answer": answer, "page": "home", "order": i},
            )

        for i, (name, issuer, desc) in enumerate(CERTIFICATIONS):
            Certification.objects.update_or_create(
                name=name, defaults={"issuer": issuer, "description": desc, "order": i}
            )

        for i, (name, role, bio) in enumerate(TEAM):
            TeamMember.objects.update_or_create(
                name=name, defaults={"role": role, "bio": bio, "order": i}
            )

        self.stdout.write("  site content (stats, services, FAQs, testimonials, team)")

    def _blog(self):
        author, _ = Author.objects.update_or_create(
            name="NOKS Technical Team",
            defaults={
                "role": "Applications & Technical Services",
                "bio": "Chemists and process engineers at NOKS Chemical Division supporting "
                       "water treatment, food processing, laboratory and industrial clients "
                       "across Kenya and East Africa.",
            },
        )

        categories = {}
        for i, (name, icon, desc) in enumerate(BLOG_CATEGORIES):
            categories[name], _ = BlogCategory.objects.update_or_create(
                name=name,
                defaults={
                    "icon": icon, "description": desc, "order": i,
                    "meta_title": f"{name} — Knowledge Centre | NOKS Chemical Division",
                    "meta_description": desc,
                },
            )

        now = timezone.now()
        for i, (title, cat, excerpt, body, faqs, product_names) in enumerate(POSTS):
            post, _ = Post.objects.update_or_create(
                title=title,
                defaults={
                    "name": title,
                    "category": categories[cat],
                    "author": author,
                    "excerpt": excerpt,
                    "body": body,
                    "status": Post.Status.PUBLISHED,
                    "published_at": now - timezone.timedelta(days=i * 9 + 3),
                    "is_featured": i < 3,
                    "meta_title": f"{title} | NOKS Chemical Division",
                    "meta_description": excerpt[:300],
                },
            )
            post.tags.set([cat, "Kenya", "East Africa"])
            post.suggested_products.set(Product.objects.filter(name__in=product_names))
            post.faqs.all().delete()
            for j, (q, a) in enumerate(faqs):
                PostFAQ.objects.create(post=post, question=q, answer=a, order=j)

        for post in Post.objects.all():
            siblings = Post.objects.exclude(pk=post.pk).filter(category=post.category)[:2]
            others = Post.objects.exclude(pk=post.pk)[:3]
            post.related_posts.set(list(siblings) or list(others))

        self.stdout.write(f"  {Post.objects.count()} knowledge centre articles")
