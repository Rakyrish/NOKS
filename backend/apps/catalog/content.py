"""
Deterministic product-content authoring.

Every product page needs real depth: at least seven applications, seven
benefits and seven FAQs, plus a description that reads like a supplier wrote
it. Doing that by hand across the catalogue is not practical, and handing it
to an LLM produces text nobody has reviewed and costs money per run.

So the copy is composed here instead, from three layers:

  1. `CHEMICAL_PROFILES` — what this specific substance is actually used for.
     Matched on the product name, keyed by chemical family.
  2. `CATEGORY_PROFILES` / `INDUSTRY_APPLICATIONS` — the sector context, used
     to top a product up when its family entry is thin or missing.
  3. Commercial and logistics lines derived from the row itself — pack sizes,
     lead time, minimum order, grade, CAS number, delivery footprint.

Layer 3 is what keeps the output from reading as boilerplate: it interpolates
fields that genuinely differ per product. Phrase selection is seeded from the
slug, so two products in the same category do not come out word-for-word
identical, and a given product produces the same copy on every run.

Nothing here invents a specification. Numbers only ever come from fields the
product already carries; the prose around them is what is being generated.
"""

from __future__ import annotations

import random
import re
from typing import Iterable

# ── Delivery footprint ────────────────────────────────────────────────
# Named explicitly because "East Africa" on its own does not win the search
# that a buyer in Nakuru or Kampala actually types.

KENYA_COUNTIES = [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu (Eldoret)",
    "Kiambu", "Machakos", "Kajiado", "Nyeri", "Meru", "Kericho", "Kakamega",
    "Bungoma", "Trans Nzoia (Kitale)", "Kilifi", "Murang'a", "Embu",
    "Laikipia (Nanyuki)", "Kirinyaga", "Narok", "Nyandarua", "Busia",
]

COUNTRIES = [
    "Kenya", "Uganda", "Tanzania", "Ethiopia", "Rwanda",
    "Burundi", "South Sudan", "Somalia", "DR Congo", "Zambia",
]

PRIMARY_COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Ethiopia"]


def counties_phrase(count: int = 6, seed: str = "") -> str:
    rng = random.Random(f"counties:{seed}")
    picked = rng.sample(KENYA_COUNTIES, min(count, len(KENYA_COUNTIES)))
    picked = sorted(picked, key=KENYA_COUNTIES.index)
    return ", ".join(picked[:-1]) + " and " + picked[-1]


def countries_phrase() -> str:
    return "Kenya, Uganda, Tanzania and Ethiopia"


# ── Layer 1: chemical families ────────────────────────────────────────
# Keyed by a substring matched against the lowercased product name. Order
# matters — the first match wins, so put the specific before the generic.

CHEMICAL_PROFILES: list[tuple[tuple[str, ...], dict]] = [
    (("hydrochloric", "muriatic"), {
        "role": "a strong mineral acid",
        "applications": [
            "pH correction in municipal and industrial water treatment",
            "Regeneration of cation exchange resins in demineralisation plants",
            "Boiler and heat-exchanger descaling",
            "Pickling and surface preparation of carbon steel",
            "Ore leaching and pH adjustment in mineral processing",
            "Chlorine dioxide generation for disinfection",
            "Effluent neutralisation ahead of discharge",
            "Cleaning of tanks, pipework and concrete surfaces",
        ],
        "benefits": [
            "Consistent acid strength batch to batch, stated on the COA",
            "Low iron content, so it will not stain treated surfaces",
            "Supplied in HDPE carboys and drums rated for acid service",
        ],
    }),
    (("sulfuric", "sulphuric"), {
        "role": "a strong mineral acid",
        "applications": [
            "Battery electrolyte preparation and top-up",
            "pH depression in effluent and process water",
            "Fertiliser and phosphate manufacture",
            "Ore leaching in mining and metal recovery",
            "Resin regeneration in demineralisation trains",
            "Sugar juice clarification and pH control",
            "Pickling and descaling of steel",
            "Dehydration duty in chemical synthesis",
        ],
        "benefits": [
            "Concentration confirmed by titration on every batch",
            "Low chloride and iron for sensitive process duty",
            "Delivered in acid-rated packaging with full transport documentation",
        ],
    }),
    (("nitric",), {
        "role": "a strong oxidising mineral acid",
        "applications": [
            "Passivation of stainless steel vessels and pipework",
            "Dairy and brewery CIP acid cleaning cycles",
            "Fertiliser and nitrate salt manufacture",
            "Metal etching, brightening and pickling",
            "Laboratory digestion and sample preparation",
            "Descaling of heat exchangers and evaporators",
            "pH control in specialist effluent streams",
        ],
        "benefits": [
            "Assay confirmed per batch with a manufacturer certificate",
            "Low residue on evaporation for CIP and passivation duty",
            "Supplied in UN-approved packaging for oxidising acids",
        ],
    }),
    (("phosphoric",), {
        "role": "a food- and technical-grade mineral acid",
        "applications": [
            "Acidulant and pH control in soft drinks and food processing",
            "Rust conversion and metal surface treatment",
            "Fertiliser and phosphate salt production",
            "Detergent and cleaner formulation as a builder acid",
            "Boiler and cooling water treatment programmes",
            "Sugar refining pH adjustment",
            "Dairy and beverage CIP acid wash",
        ],
        "benefits": [
            "Food-grade quality available for direct beverage use",
            "Clear, low-colour material suitable for visible products",
            "Stated assay on every batch certificate",
        ],
    }),
    (("citric",), {
        "role": "a food-grade organic acidulant",
        "applications": [
            "Acidity regulation in soft drinks, juices and cordials",
            "Preservation support in jams, sauces and canned foods",
            "Chelating agent in detergents and cleaning formulations",
            "Descaling of kettles, boilers and membranes",
            "pH buffering in cosmetics and personal care",
            "Effervescent tablet and sachet formulation",
            "Metal cleaning and passivation in food plants",
            "Flavour enhancement and tartness adjustment",
        ],
        "benefits": [
            "Meets BP/USP/FCC expectations for food and beverage use",
            "Low heavy-metal profile suited to direct food contact",
            "Free-flowing crystals that dissolve without clumping",
        ],
    }),
    (("caustic soda", "sodium hydroxide"), {
        "role": "a strong alkali",
        "applications": [
            "pH correction and neutralisation of acidic effluent",
            "Saponification in soap and detergent manufacture",
            "Clean-in-place caustic wash in food and dairy plants",
            "Pulp and paper processing",
            "Textile mercerising and scouring",
            "Alumina and mineral processing",
            "Drain, tank and pipework cleaning",
            "Water treatment alkalinity adjustment",
        ],
        "benefits": [
            "High assay with low carbonate for predictable dosing",
            "Low iron, so it will not discolour finished product",
            "Packed in moisture-resistant bags that survive humid storage",
        ],
    }),
    (("potassium hydroxide", "caustic potash"), {
        "role": "a strong alkali",
        "applications": [
            "Liquid and soft soap manufacture",
            "Biodiesel transesterification catalysis",
            "Electrolyte preparation for alkaline batteries",
            "pH adjustment in process and effluent streams",
            "Agricultural and fertiliser potassium salts",
            "Laboratory reagent preparation and titration",
            "Industrial cleaning and degreasing formulations",
        ],
        "benefits": [
            "Reagent and technical grades from one supplier",
            "Low chloride and carbonate content",
            "Flake form dissolves quickly with less dust than prills",
        ],
    }),
    (("soda ash", "sodium carbonate"), {
        "role": "an alkaline builder salt",
        "applications": [
            "pH and alkalinity correction in water treatment",
            "Detergent and soap building",
            "Glass manufacture",
            "Textile dyeing and scouring baths",
            "Swimming pool alkalinity adjustment",
            "Flue gas and effluent neutralisation",
            "Softening of hard process water",
        ],
        "benefits": [
            "Dense grade with good flow and low dust for bulk handling",
            "Consistent alkalinity so dosing rates stay stable",
            "Available in bag and bulk quantities",
        ],
    }),
    (("sodium bicarbonate", "bicarb"), {
        "role": "a mild alkaline salt",
        "applications": [
            "Leavening in baking and food manufacture",
            "pH buffering in food, beverage and pharmaceutical processing",
            "Flue gas treatment and acid gas scrubbing",
            "Animal feed supplementation as a rumen buffer",
            "Effluent pH correction without overshoot",
            "Haemodialysis and pharmaceutical preparations (grade dependent)",
            "Mild abrasive in cleaning products",
        ],
        "benefits": [
            "Food-grade quality available for direct food use",
            "Buffers gently, so it is hard to overshoot pH",
            "Uniform particle size for consistent dosing",
        ],
    }),
    (("calcium hypochlorite",), {
        "role": "a solid chlorine donor",
        "applications": [
            "Drinking water chlorination and borehole disinfection",
            "Swimming pool shock dosing and routine sanitation",
            "Surface and equipment sanitation in food plants",
            "Wastewater disinfection before discharge",
            "Poultry house and livestock water sanitation",
            "Cooling tower biological control",
            "Emergency water treatment and outbreak response",
        ],
        "benefits": [
            "High available chlorine, so less product per volume treated",
            "Granule and tablet forms for dosers or manual dosing",
            "Stable in storage compared with liquid hypochlorite",
        ],
    }),
    (("sodium hypochlorite",), {
        "role": "a liquid chlorine donor",
        "applications": [
            "Drinking water and borehole chlorination",
            "Surface sanitation in food and beverage plants",
            "Laundry bleaching",
            "Wastewater and effluent disinfection",
            "Cooling water biological control",
            "Membrane and tank cleaning cycles",
            "Household and institutional bleach formulation",
        ],
        "benefits": [
            "Available chlorine stated per batch so dosing is predictable",
            "Supplied in UV-resistant packaging to slow strength loss",
            "Bulk and jerrycan quantities for any dosing scale",
        ],
    }),
    (("poly aluminium chloride", "polyaluminium", "pac"), {
        "role": "a pre-hydrolysed coagulant",
        "applications": [
            "Potable water clarification and turbidity removal",
            "Municipal wastewater primary treatment",
            "Industrial effluent solids removal",
            "Paper mill retention and drainage aid",
            "Colour and organic removal from surface water",
            "Phosphate precipitation in nutrient removal",
            "Sludge conditioning and dewatering support",
        ],
        "benefits": [
            "Works across a wider pH band than alum, so less pH correction",
            "Produces less sludge per unit of turbidity removed",
            "Effective at low temperature where alum slows down",
        ],
    }),
    (("aluminium sulphate", "aluminum sulfate", "alum"), {
        "role": "a primary coagulant",
        "applications": [
            "Drinking water clarification",
            "Municipal wastewater treatment",
            "Industrial effluent solids removal",
            "Paper sizing and retention",
            "Phosphate removal in nutrient control",
            "Turbidity reduction in surface water intakes",
            "Sludge conditioning ahead of dewatering",
        ],
        "benefits": [
            "Guaranteed Al₂O₃ content stated on every batch certificate",
            "Low insolubles, which means less sludge to handle",
            "Rapid floc formation for shorter settling times",
        ],
    }),
    (("hydrogen peroxide",), {
        "role": "an oxidising agent",
        "applications": [
            "Textile and pulp bleaching",
            "Aseptic packaging sterilisation",
            "Wastewater COD and colour reduction",
            "Disinfection of process water and surfaces",
            "Odour control in effluent and sewer systems",
            "Mining and metal recovery oxidation duty",
            "Cosmetic and personal care formulation (grade dependent)",
        ],
        "benefits": [
            "Stabilised for a predictable shelf life in tropical storage",
            "Breaks down to water and oxygen, leaving no salt residue",
            "Supplied in vented packaging rated for peroxide service",
        ],
    }),
    (("calcium chloride",), {
        "role": "a hygroscopic calcium salt",
        "applications": [
            "Dust suppression on haul roads and unpaved surfaces",
            "Concrete set acceleration in construction",
            "Drilling and completion fluid density control",
            "Refrigeration and chilled brine systems",
            "Moisture absorption and container desiccation",
            "De-icing and freeze protection",
            "Calcium fortification in food processing (food grade)",
            "Tyre ballasting on agricultural machinery",
        ],
        "benefits": [
            "High assay prills and granules that dissolve fast",
            "Low insolubles for brine systems and clear solutions",
            "Moisture-barrier packaging that survives humid warehousing",
        ],
    }),
    (("magnesium sulfate", "magnesium sulphate", "epsom"), {
        "role": "a soluble magnesium salt",
        "applications": [
            "Magnesium correction in fertiliser and foliar programmes",
            "Animal feed magnesium supplementation",
            "Textile dyeing and finishing baths",
            "Pharmaceutical and personal care preparations",
            "Fermentation nutrient supply",
            "Water treatment hardness adjustment",
            "Bath salt and cosmetic formulation",
        ],
        "benefits": [
            "High solubility for clean, residue-free solutions",
            "Available in technical and feed grades",
            "Consistent crystal size for even blending",
        ],
    }),
    (("titanium dioxide",), {
        "role": "a white pigment",
        "applications": [
            "Opacity and whiteness in decorative and industrial paint",
            "Masterbatch and plastics pigmentation",
            "Printing ink formulation",
            "Paper and board coating",
            "Rubber and cable compound whitening",
            "Cosmetic and sunscreen formulation (grade dependent)",
            "Powder coating and coil coating",
        ],
        "benefits": [
            "Rutile grade for high opacity and outdoor durability",
            "Surface-treated for easy dispersion and low grit",
            "Consistent tint strength batch to batch",
        ],
    }),
    (("iron oxide", "pigment", "carbon black"), {
        "role": "a colour pigment",
        "applications": [
            "Colouring of paints, primers and undercoats",
            "Concrete, paver and roof tile pigmentation",
            "Plastic and masterbatch colouring",
            "Printing ink and toner manufacture",
            "Rubber compounding",
            "Ceramic and glaze colouring",
            "Paper and board tinting",
        ],
        "benefits": [
            "Stable shade with good light and weather fastness",
            "Low oil absorption for easier let-down",
            "Consistent tint strength so shade matching holds",
        ],
    }),
    (("calcium carbonate", "kaolin", "talc", "bentonite", "gypsum"), {
        "role": "a functional mineral filler",
        "applications": [
            "Extender and filler in paints and coatings",
            "Plastic and PVC compounding",
            "Paper filling and coating",
            "Rubber compounding",
            "Adhesive, sealant and putty formulation",
            "Construction products and dry mortar",
            "Agricultural soil conditioning (grade dependent)",
            "Drilling fluid viscosity and filtration control",
        ],
        "benefits": [
            "Controlled particle size for predictable rheology",
            "Low moisture, so it disperses without lumping",
            "High brightness for light-coloured formulations",
        ],
    }),
    (("sodium lauryl ether sulphate", "sles", "labsa", "linear alkyl benzene", "cocamide",
      "nonylphenol", "np9", "np-9", "sodium xylene sulfonate", "surfactant"), {
        "role": "a surfactant raw material",
        "applications": [
            "Liquid dishwashing and laundry detergent manufacture",
            "Shampoo, body wash and personal care formulation",
            "Industrial and institutional cleaner production",
            "Foam generation and stabilisation",
            "Emulsion polymerisation as an emulsifier",
            "Textile wetting and scouring",
            "Agrochemical adjuvant and wetting agent",
            "Car wash and vehicle care products",
        ],
        "benefits": [
            "High active content, so less product per batch",
            "Consistent viscosity that keeps batch build repeatable",
            "Low colour for clear and pastel finished products",
        ],
    }),
    (("acetone", "isopropyl", "methanol", "toluene", "xylene", "methyl ethyl ketone", "mek",
      "ethyl acetate", "methyl acetate", "butanol", "hexane", "white spirit",
      "perchloroethylene", "cyclohexanone", "n-propanol", "propanol"), {
        "role": "an industrial solvent",
        "applications": [
            "Thinning and viscosity adjustment of paints and coatings",
            "Degreasing and surface cleaning before finishing",
            "Resin, adhesive and ink manufacture",
            "Extraction and purification in process chemistry",
            "Printing press and equipment wash-up",
            "Laboratory reagent and analytical use (grade dependent)",
            "Cleaning of tanks, tools and application equipment",
        ],
        "benefits": [
            "Low water content and tight assay for consistent evaporation",
            "Low non-volatile residue, so it leaves clean surfaces",
            "Supplied in sealed drums with batch traceability",
        ],
    }),
    (("glycol",), {
        "role": "a glycol",
        "applications": [
            "Heat transfer and coolant formulation",
            "Antifreeze and freeze protection systems",
            "Humectant in cosmetics and personal care",
            "Solvent and carrier in paints and inks",
            "Polyester resin and PET manufacture",
            "Food and pharmaceutical carrier duty (grade dependent)",
            "Gas dehydration in oil and gas processing",
        ],
        "benefits": [
            "Low water content for reliable freeze protection",
            "Food and USP grades available where required",
            "Clear, low-colour material for visible applications",
        ],
    }),
    (("resin", "emulsion", "veova", "polyvinyl alcohol", "acrylic"), {
        "role": "a polymer binder",
        "applications": [
            "Binder for emulsion and decorative paints",
            "Adhesive and construction chemical manufacture",
            "Textile finishing and pigment binding",
            "Paper coating and surface sizing",
            "Primer and sealer formulation",
            "Plaster, skim coat and tile adhesive modification",
            "Printing ink vehicle manufacture",
        ],
        "benefits": [
            "Consistent solids content so film build stays predictable",
            "Good pigment binding and scrub resistance",
            "Stable viscosity through tropical storage",
        ],
    }),
    (("cellulose", "cmc", "hydroxyethyl"), {
        "role": "a cellulose thickener",
        "applications": [
            "Thickening and rheology control in paints",
            "Drilling fluid filtration and viscosity control",
            "Detergent and liquid soap thickening",
            "Food thickening and stabilising (food grade)",
            "Textile printing paste preparation",
            "Ceramic body and glaze binding",
            "Tile adhesive and render water retention",
        ],
        "benefits": [
            "Uniform viscosity grade for repeatable batches",
            "Disperses without fish-eyes when added correctly",
            "Low insolubles for clean finished product",
        ],
    }),
    (("wax", "petroleum jelly", "mineral oil", "castor oil", "stearic", "oleic",
      "cetearyl", "lecithin", "stearate"), {
        "role": "an oleochemical raw material",
        "applications": [
            "Candle and wax product manufacture",
            "Cosmetic cream, lotion and balm formulation",
            "Polish, coating and release agent production",
            "Rubber and plastic processing aid",
            "Emulsifier and consistency builder in personal care",
            "Paper and board coating",
            "Lubricant and grease formulation",
        ],
        "benefits": [
            "Consistent melt point and colour batch to batch",
            "Pharmacopoeia grades available for personal care",
            "Packed in liners that keep material clean and dry",
        ],
    }),
    (("sodium benzoate", "potassium sorbate", "calcium propionate", "metabisulfite",
      "sorbitol", "dextrose", "monosodium glutamate", "saccharin", "cyclamate",
      "lactate", "gluconate", "taurine", "tartaric", "malic", "lactic"), {
        "role": "a food-grade additive",
        "applications": [
            "Preservation of soft drinks, juices and sauces",
            "Shelf-life extension in bakery and confectionery",
            "Acidity and flavour adjustment in beverages",
            "Sweetening and bulking in food formulation",
            "Dairy and processed food stabilisation",
            "Pharmaceutical and nutraceutical formulation",
            "Animal feed and premix supplementation",
        ],
        "benefits": [
            "Food-grade quality with documentation for audit",
            "Low heavy-metal profile for direct food contact",
            "Consistent particle size for accurate dosing",
        ],
    }),
    (("fertilizer", "fertiliser", "dap", "diammonium", "potassium sulphate",
      "ammonium chloride", "sodium nitrate", "dicalcium phosphate"), {
        "role": "a plant and animal nutrition input",
        "applications": [
            "Blending of NPK and custom fertiliser formulations",
            "Foliar feed and fertigation programmes",
            "Soil conditioning and nutrient correction",
            "Animal feed mineral supplementation",
            "Greenhouse and horticulture nutrient dosing",
            "Hydroponic nutrient solution preparation",
            "Crop-specific top dressing",
        ],
        "benefits": [
            "Guaranteed nutrient analysis on every batch",
            "Free-flowing granules that blend without segregation",
            "Moisture-barrier packaging for long field storage",
        ],
    }),
    (("benzalkonium", "disinfect", "descaling", "pine oil", "formaldehyde", "formalin"), {
        "role": "a disinfectant raw material",
        "applications": [
            "Hard surface disinfectant manufacture",
            "Food plant and dairy sanitation",
            "Hospital and institutional cleaning formulation",
            "Livestock housing and hatchery disinfection",
            "Water system biological control",
            "Laundry sanitising formulation",
            "Algae and biofilm control in cooling systems",
        ],
        "benefits": [
            "Stated active concentration so dilution rates are reliable",
            "Broad-spectrum activity against bacteria and fungi",
            "Stable through tropical storage and transport",
        ],
    }),
    (("edta", "hexametaphosphate", "tripolyphosphate", "sodium formate", "carbohydrazide",
      "sodium metasilicate", "sodium silicate", "sodium perborate", "sodium hydrosulfite"), {
        "role": "a performance builder salt",
        "applications": [
            "Sequestering hardness in detergent formulation",
            "Boiler water oxygen scavenging and scale control",
            "Cleaning-in-place formulation for food plants",
            "Textile processing and bleach stabilisation",
            "Water treatment scale and corrosion inhibition",
            "Industrial degreaser and alkaline cleaner building",
            "Ceramic and mineral slurry dispersion",
        ],
        "benefits": [
            "High active content for economical dosing",
            "Low insolubles that keep dosing lines clear",
            "Consistent assay so formulations stay in specification",
        ],
    }),
    (("octoate", "drier", "cobalt", "manganese", "zirconium"), {
        "role": "a paint drier",
        "applications": [
            "Through-dry and surface-dry acceleration in alkyd paints",
            "Printing ink drying systems",
            "Wood coating and varnish formulation",
            "Marine and protective coating manufacture",
            "Putty and filler curing",
            "Road marking paint production",
            "Anti-skinning and drier balance packages",
        ],
        "benefits": [
            "Stated metal content for accurate drier balance",
            "Clear solution that will not cloud a finished coating",
            "Consistent activity so dry times stay predictable",
        ],
    }),
    (("activated carbon",), {
        "role": "an adsorbent",
        "applications": [
            "Taste, odour and colour removal from drinking water",
            "Dechlorination ahead of membrane systems",
            "Effluent polishing and organic removal",
            "Sugar and syrup decolourisation",
            "Edible oil bleaching support",
            "Gold recovery in mineral processing",
            "Air and vapour phase odour control",
        ],
        "benefits": [
            "High iodine number for strong adsorption capacity",
            "Low ash and dust for clean bed operation",
            "Granular and powdered forms for any contactor design",
        ],
    }),
    (("industrial salt", "sodium chloride"), {
        "role": "an industrial salt",
        "applications": [
            "Ion exchange resin regeneration in water softening",
            "Brine preparation for chlor-alkali and food processing",
            "Food processing and curing (food grade)",
            "Textile dyeing salt",
            "Drilling fluid density control",
            "Hide and skin curing in tanneries",
            "De-icing and dust control",
        ],
        "benefits": [
            "Low insolubles that will not foul resin beds",
            "Consistent granule size for reliable brine saturation",
            "Bulk and bagged supply for any consumption rate",
        ],
    }),
    (("lime", "calcium hydroxide", "magnesium oxide"), {
        "role": "an alkaline earth base",
        "applications": [
            "pH correction and alkalinity boosting in water treatment",
            "Effluent neutralisation and heavy metal precipitation",
            "Soil conditioning and acidity correction",
            "Construction mortar, plaster and stabilisation",
            "Flue gas desulphurisation",
            "Sugar juice clarification",
            "Sludge stabilisation and odour control",
        ],
        "benefits": [
            "High available content for economical dosing",
            "Low grit for slurry systems that block easily",
            "Bagged in moisture-resistant packaging",
        ],
    }),
    (("ferrous sulfate", "copper", "manganese sulphate", "zinc"), {
        "role": "a metal salt",
        "applications": [
            "Micronutrient supply in fertiliser blends",
            "Animal feed trace mineral supplementation",
            "Water treatment coagulation and phosphate removal",
            "Effluent sulphide and odour control",
            "Agricultural fungicide and spray preparation",
            "Electroplating and surface treatment baths",
            "Cement chromate reduction",
        ],
        "benefits": [
            "Stated metal assay on every batch",
            "Low insolubles for spray and dosing systems",
            "Crystal size chosen for even blending",
        ],
    }),
]


# ── Layer 2: category and industry context ────────────────────────────

CATEGORY_PROFILES: dict[str, list[str]] = {
    "agricultural chemicals": [
        "Fertiliser blending and nutrient correction",
        "Crop protection and spray programme formulation",
        "Soil conditioning and pH management",
        "Animal feed and premix supplementation",
        "Greenhouse and horticultural production",
        "Irrigation water treatment and line sanitation",
        "Post-harvest handling and storage protection",
    ],
    "cleaning and disinfectants": [
        "Hard surface cleaner and disinfectant manufacture",
        "Food and beverage plant sanitation",
        "Institutional and hospital hygiene programmes",
        "Laundry and dishwash formulation",
        "Vehicle and equipment cleaning products",
        "Water system and cooling tower hygiene",
        "Livestock housing sanitation",
    ],
    "paints and coatings": [
        "Decorative emulsion and gloss paint manufacture",
        "Industrial and protective coating production",
        "Printing ink and pigment paste formulation",
        "Wood finish and varnish manufacture",
        "Road marking and traffic paint",
        "Powder and coil coating production",
        "Primer, filler and undercoat formulation",
    ],
    "soaps and detergents": [
        "Bar and liquid soap manufacture",
        "Laundry powder and liquid formulation",
        "Dishwashing product manufacture",
        "Industrial and institutional cleaner production",
        "Shampoo and body wash formulation",
        "Fabric care and softener manufacture",
        "Car wash and vehicle care formulation",
    ],
    "food and beverages": [
        "Soft drink and juice manufacture",
        "Bakery and confectionery production",
        "Dairy and processed food manufacture",
        "Sauce, condiment and preserve production",
        "Brewing and distilling operations",
        "Food plant sanitation and CIP programmes",
        "Shelf-life extension and preservation",
    ],
    "pharm and cosmetic": [
        "Cosmetic cream, lotion and balm manufacture",
        "Personal care and toiletry formulation",
        "Pharmaceutical excipient and carrier duty",
        "Nutraceutical and supplement production",
        "Hair care and skin care formulation",
        "Sanitiser and antiseptic manufacture",
        "Laboratory and compounding preparation",
    ],
    "textile treatment": [
        "Scouring and desizing of greige fabric",
        "Dyeing and printing bath preparation",
        "Bleaching and whitening processes",
        "Softening and finishing treatments",
        "Effluent treatment in textile mills",
        "Wetting and levelling in dye houses",
        "Fixation and after-treatment of dyed goods",
    ],
    "oil and gas": [
        "Drilling fluid formulation and conditioning",
        "Filtration and fluid loss control",
        "Corrosion and scale inhibition programmes",
        "Well completion and workover fluids",
        "Produced water treatment",
        "Pipeline cleaning and pigging support",
        "Storage tank maintenance chemistry",
    ],
    "construction chemicals": [
        "Concrete admixture and set control",
        "Mortar, render and plaster modification",
        "Tile adhesive and grout manufacture",
        "Waterproofing and sealing systems",
        "Surface preparation and etching",
        "Precast and paver production",
        "Repair mortar and patching compounds",
    ],
    "paper and pulp": [
        "Pulp bleaching and brightening",
        "Retention and drainage on the paper machine",
        "Surface sizing and coating",
        "Broke and white water treatment",
        "Effluent clarification in paper mills",
        "Deinking of recovered fibre",
        "Board coating and finishing",
    ],
    "preservation and chemicals": [
        "Shelf-life extension in packaged food",
        "Antimicrobial protection of finished goods",
        "Water-based product preservation",
        "Cosmetic and personal care preservation",
        "Timber and material protection",
        "Feed and grain storage protection",
        "Process water biological control",
    ],
    "dyes": [
        "Textile dyeing and printing",
        "Leather and hide colouring",
        "Paper and board tinting",
        "Ink and marker manufacture",
        "Plastic and masterbatch colouring",
        "Cosmetic colourant formulation (grade dependent)",
        "Shade matching and colour correction",
    ],
    "acids": [
        "pH correction across process and effluent streams",
        "Descaling of boilers and heat exchangers",
        "Metal pickling and surface preparation",
        "Resin regeneration in water treatment",
        "Cleaning-in-place acid wash cycles",
        "Mineral processing and leaching",
        "Neutralisation of alkaline waste",
    ],
    "disinfectants": [
        "Drinking water disinfection",
        "Surface and equipment sanitation",
        "Wastewater disinfection before discharge",
        "Swimming pool and recreational water treatment",
        "Livestock and poultry house hygiene",
        "Cooling water biological control",
        "Outbreak response and emergency sanitation",
    ],
    "coagulants & flocculants": [
        "Potable water clarification",
        "Municipal wastewater primary treatment",
        "Industrial effluent solids removal",
        "Sludge conditioning and dewatering",
        "Colour and organic matter removal",
        "Phosphate precipitation",
        "Turbidity control at surface water intakes",
    ],
    "industrial chemicals": [
        "General manufacturing process chemistry",
        "Cleaning, degreasing and maintenance",
        "Water and effluent treatment programmes",
        "Formulation of downstream products",
        "Laboratory and quality control use",
        "Equipment and plant maintenance",
        "Blending and repacking operations",
    ],
}

INDUSTRY_APPLICATIONS: dict[str, list[str]] = {
    "water-treatment": [
        "Municipal potable water treatment",
        "Borehole and community water supply",
        "Industrial effluent treatment",
        "Boiler and cooling water programmes",
    ],
    "food-processing": [
        "Food and beverage manufacture",
        "Plant sanitation and CIP programmes",
        "Shelf-life and preservation systems",
    ],
    "agriculture": [
        "Fertiliser blending and crop nutrition",
        "Livestock and feed supplementation",
        "Irrigation and farm water treatment",
    ],
    "manufacturing": [
        "General industrial manufacturing",
        "Maintenance, cleaning and degreasing",
        "Downstream product formulation",
    ],
    "mining": [
        "Mineral processing and flotation",
        "Tailings and process water treatment",
        "Dust suppression on site roads",
    ],
    "construction": [
        "Concrete and mortar production",
        "Surface preparation and treatment",
        "Waterproofing and sealing systems",
    ],
    "laboratories": [
        "Analytical and quality control testing",
        "Reagent and standard preparation",
        "Research and method development",
    ],
    "healthcare": [
        "Hospital hygiene and disinfection",
        "Pharmaceutical preparation",
        "Clinical laboratory use",
    ],
    "hospitality": [
        "Laundry and housekeeping chemistry",
        "Kitchen and food service hygiene",
        "Pool and spa water treatment",
    ],
    "textile": [
        "Textile wet processing",
        "Dyeing and finishing operations",
        "Mill effluent treatment",
    ],
    "paint-coatings": [
        "Paint and coating manufacture",
        "Ink and pigment paste production",
        "Resin and binder formulation",
    ],
    "oil-gas": [
        "Drilling and completion fluids",
        "Production chemistry programmes",
        "Produced water treatment",
    ],
}

GRADE_NOTES = {
    "food": "food grade, suitable for direct use in food and beverage manufacture",
    "pharma": "pharmaceutical grade, supplied against pharmacopoeia expectations",
    "laboratory": "analytical/laboratory grade for testing and method work",
    "technical": "technical grade for industrial process duty",
    "industrial": "industrial grade for general process and manufacturing duty",
}


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", (text or "").lower())


def match_profile(name: str, formula: str = "") -> dict | None:
    """First chemical family whose keyword appears in the product name."""
    hay = f"{_norm(name)} {_norm(formula)}"
    for keys, profile in CHEMICAL_PROFILES:
        for key in keys:
            # Word-boundary match so "pac" does not fire inside "packaging".
            if re.search(rf"\b{re.escape(key)}\b", hay):
                return profile
    return None


_STOPWORDS = {
    "a", "an", "and", "for", "in", "of", "on", "the", "to", "with", "that",
    "it", "is", "so", "you", "your", "our", "we", "as", "at", "by", "or",
    "which", "means", "from", "into", "not", "less", "more", "per", "every",
}


def _dedupe(items: Iterable[str]) -> list[str]:
    """Drop exact repeats and near-repeats.

    The layers overlap by design — a family entry and a category entry often
    describe the same duty in different words ("Paper sizing" vs "Paper sizing
    and retention"). Keeping both makes the list look padded, so where one
    point is a prefix of another the more specific wording wins.
    """
    cleaned: list[str] = []
    for item in items:
        text = (item or "").strip()
        if text:
            cleaned.append(text)

    kept: list[str] = []
    for item in cleaned:
        key = re.sub(r"[^a-z0-9 ]+", "", item.lower()).strip()
        replaced = False
        drop = False
        for index, existing in enumerate(kept):
            other = re.sub(r"[^a-z0-9 ]+", "", existing.lower()).strip()
            if key == other:
                drop = True
                break
            if key.startswith(other + " "):
                # This one says the same thing with more detail.
                kept[index] = item
                replaced = True
                break
            if other.startswith(key + " "):
                drop = True
                break
            # Reworded repeats: "low insolubles for reduced sludge" against
            # "low insolubles, which means less sludge to handle".
            a, b = set(key.split()), set(other.split())
            a -= _STOPWORDS
            b -= _STOPWORDS
            if a and b and len(a & b) / min(len(a), len(b)) >= 0.72:
                if len(key) > len(other):
                    kept[index] = item
                    replaced = True
                else:
                    drop = True
                break
        if not drop and not replaced:
            kept.append(item)
    return kept


# ── Composition ───────────────────────────────────────────────────────


def _lower_phrase(text: str) -> str:
    """Lowercase a phrase for mid-sentence use without wrecking acronyms.

    Existing catalogue entries are Title Case ("Glass and Ceramic
    Manufacturing"), so lowering only the first character left "glass and
    Ceramic manufacturing". Only plainly-capitalised words are lowered;
    all-caps (CIP, COA, USP) and mixed-case (pH) are left alone.
    """
    out = []
    for word in (text or "").split(" "):
        out.append(word.lower() if re.fullmatch(r"[A-Z][a-z]+", word) else word)
    return " ".join(out)


def _rng(product) -> random.Random:
    """Seeded per product, so wording is varied across the catalogue but
    stable for any given product across runs."""
    return random.Random(f"noks:{product.slug}")


def _identity(product) -> str:
    bits = []
    if product.chemical_formula:
        bits.append(product.chemical_formula)
    if product.cas_number:
        bits.append(f"CAS {product.cas_number}")
    return " · ".join(bits)


def build_applications(product, minimum: int = 7) -> list[str]:
    profile = match_profile(product.name, product.chemical_formula)
    items: list[str] = list(product.applications or [])

    if profile:
        items += profile["applications"]

    cat = (product.category.name if product.category_id else "").strip().lower()
    items += CATEGORY_PROFILES.get(cat, [])

    for industry in product.industries.all():
        items += INDUSTRY_APPLICATIONS.get(industry.slug, [])

    items = _dedupe(items)

    # Last resort so nothing ever falls short of the floor.
    if len(items) < minimum:
        items += CATEGORY_PROFILES["industrial chemicals"]
        items = _dedupe(items)

    return items[: max(minimum, min(len(items), 10))]


def build_benefits(product, minimum: int = 7) -> list[str]:
    profile = match_profile(product.name, product.chemical_formula)
    rng = _rng(product)

    items: list[str] = list(product.benefits or [])
    if profile:
        items += profile["benefits"]

    grade_note = GRADE_NOTES.get(product.grade, "")
    if grade_note:
        items.append(f"Supplied as {grade_note}")

    if product.purity:
        items.append(f"Purity {product.purity}, confirmed on the batch certificate")

    # Commercial and service lines — these interpolate real row values, which
    # is what stops the list reading as the same boilerplate on every product.
    packs = list(product.packaging_options or [])
    if packs:
        items.append(
            f"Available in {', '.join(packs[:3])} — repacked to your handling requirement"
        )
    if product.lead_time:
        lead = product.lead_time
        suffix = "" if "nairobi" in lead.lower() else " from our Nairobi warehouse"
        items.append(f"Lead time {lead}{suffix}")
    if product.min_order_quantity:
        items.append(
            f"Minimum order {product.min_order_quantity} {product.unit} — trial quantities available"
        )

    service = [
        "Certificate of Analysis and Safety Data Sheet supplied with every batch",
        f"Ex-stock in Nairobi with delivery across {countries_phrase()}",
        "Batch and lot numbers traceable back to the manufacturing run",
        "Technical support from our applications chemists on dosing and handling",
        "Contract and repeat-order pricing for production volumes",
        "Stock held locally, so you are not waiting on an import cycle",
    ]
    rng.shuffle(service)
    items += service

    items = _dedupe(items)
    return items[: max(minimum, min(len(items), 10))]


def build_faqs(product, minimum: int = 7) -> list[dict]:
    """Questions a buyer actually asks, answered from this product's own row."""
    rng = _rng(product)
    name = product.name
    packs = list(product.packaging_options or [])
    pack_text = ", ".join(packs) if packs else "bags, drums and bulk quantities"
    grade_note = GRADE_NOTES.get(product.grade, "industrial process duty")
    apps = build_applications(product, minimum=7)
    identity = _identity(product)
    counties = counties_phrase(6, product.slug)

    faqs: list[dict] = []

    faqs.append({
        "question": f"What is {name} used for?",
        "answer": (
            f"{name} is used for {_lower_phrase(apps[0])}, "
            f"{_lower_phrase(apps[1])} and {_lower_phrase(apps[2])}, "
            f"among other applications. It is supplied as {grade_note}. "
            f"Our technical team can advise on the right grade for your process."
        ),
    })

    if identity:
        faqs.append({
            "question": f"What is the chemical identity of {name}?",
            "answer": (
                f"{name} is supplied as {identity}. "
                f"The exact assay for the batch you receive is stated on its "
                f"Certificate of Analysis, which ships with the order."
            ),
        })

    faqs.append({
        "question": f"What pack sizes does {name} come in?",
        "answer": (
            f"{name} is available in {pack_text}. We also repack to suit your "
            f"handling and storage setup, so you are not forced into a pack size "
            f"that does not fit your line. Tell us the quantity you need and we "
            f"will quote against it."
        ),
    })

    faqs.append({
        "question": f"Do you supply a COA and MSDS with {name}?",
        "answer": (
            "Yes. Every order ships with the manufacturer Certificate of Analysis "
            "for the exact batch delivered, plus a full 16-section Safety Data "
            "Sheet. Hazard class, UN number and handling guidance are included, so "
            "your compliance file is complete on delivery rather than three emails later."
        ),
    })

    faqs.append({
        "question": f"How quickly can {name} be delivered?",
        "answer": (
            f"{product.lead_time or 'Stock lines typically dispatch within 1–3 working days'}"
            f"{'' if 'nairobi' in (product.lead_time or '').lower() else ' from our Nairobi warehouse'}. "
            f"Same-day dispatch is usually possible for orders "
            f"placed early in the day. Deliveries reach {counties} and the rest of the country, "
            f"with export to Uganda, Tanzania, Ethiopia and the wider region."
        ),
    })

    faqs.append({
        "question": f"What is the minimum order quantity for {name}?",
        "answer": (
            f"The minimum order is {product.min_order_quantity or 1} {product.unit}. "
            f"We supply trial quantities for formulation work and scale up to bulk "
            f"once the product is qualified in your process. Volume pricing applies "
            f"to contract and repeat orders."
        ),
    })

    faqs.append({
        "question": f"How should {name} be stored and handled?",
        "answer": (
            product.storage_handling
            or "Store in a cool, dry, well-ventilated area in the original sealed "
               "container, away from incompatible materials and direct sunlight. "
               "Keep containers closed when not in use."
        ),
    })

    faqs.append({
        "question": f"Do you supply {name} outside Kenya?",
        "answer": (
            "Yes. We supply industrial, food-grade and laboratory chemicals across "
            "Kenya, Uganda, Tanzania and Ethiopia, and also serve Rwanda, Burundi, "
            "South Sudan and eastern DR Congo. Export documentation and HS codes are "
            "prepared with the shipment."
        ),
    })

    faqs.append({
        "question": f"Can I get pricing for {name} in bulk?",
        "answer": (
            f"Yes. Send the quantity, required grade and delivery point and you will "
            f"get a formal quotation, typically within one business day. "
            f"{'Indicative pricing is available on request; ' if product.price_on_request else ''}"
            f"contract rates are available for scheduled monthly volumes."
        ),
    })

    if product.safety_information:
        faqs.append({
            "question": f"What safety precautions apply to {name}?",
            "answer": product.safety_information,
        })

    # Keep the first two (identity/use) anchored, vary the tail order slightly.
    head, tail = faqs[:2], faqs[2:]
    rng.shuffle(tail)
    faqs = head + tail
    return faqs[: max(minimum, min(len(faqs), 10))]


def build_description(product) -> str:
    """Multi-paragraph body copy. Existing text is kept as the opening."""
    name = product.name
    profile = match_profile(product.name, product.chemical_formula)
    role = profile["role"] if profile else "an industrial chemical"
    identity = _identity(product)
    apps = build_applications(product, minimum=7)
    packs = list(product.packaging_options or [])
    counties = counties_phrase(8, product.slug)
    cat = product.category.name if product.category_id else "industrial chemicals"

    existing = (product.description or "").strip()
    # Drop any previously generated tail so re-running does not stack copies.
    existing = existing.split("\n\nNOKS Solutions Ltd supplies")[0].strip()
    opening = existing or (
        f"{name} is {role} supplied by NOKS Solutions Ltd — Chemical Division"
        f"{f' ({identity})' if identity else ''}."
    )

    paras = [opening]

    paras.append(
        f"NOKS Solutions Ltd supplies {name} to manufacturers, water utilities, "
        f"processors and laboratories across Kenya and the wider East African region. "
        f"It sits in our {cat.lower()} range and is held ex-stock at our Nairobi "
        f"warehouse on Enterprise Road, Industrial Area, so orders ship without "
        f"waiting on an import cycle."
    )

    top = apps[:5]
    paras.append(
        "Typical applications include "
        + ", ".join(_lower_phrase(a) for a in top[:-1])
        + f" and {_lower_phrase(top[-1])}. "
        + (
            f"It is supplied as {GRADE_NOTES.get(product.grade, 'technical grade material')}"
            + (f", {product.purity}" if product.purity else "")
            + ". "
        )
        + "If you are matching an existing specification, send it across and our "
        "applications chemists will confirm the grade before you order."
    )

    if packs:
        paras.append(
            f"{name} is available in {', '.join(packs)}, and we repack to suit your "
            f"handling setup. Every delivery carries the manufacturer Certificate of "
            f"Analysis for the batch supplied together with a full Safety Data Sheet, "
            f"and lot numbers stay traceable to the manufacturing run."
        )

    paras.append(
        f"Delivery covers {counties} and the rest of Kenya, with regular export "
        f"shipments to Uganda, Tanzania, Ethiopia, Rwanda, Burundi, South Sudan and "
        f"eastern DR Congo. Request a quotation with your quantity, grade and delivery "
        f"point and our technical sales team will respond, usually within one business day."
    )

    return "\n\n".join(paras)
