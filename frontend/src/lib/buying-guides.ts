export type BuyingGuide = {
  heading: string;
  summary: string;
  categories: { name: string; slug: string }[];
  references: { name: string; url: string }[];
};

// These are existing catalogue routes, selected for the article's actual topic.
export const BUYING_GUIDES: Record<string, BuyingGuide> = {
  "food-grade-vs-industrial-grade-chemicals-what-actually-differs": {
    heading: "Selecting food ingredients for your order in Kenya",
    summary: "Compare the exact ingredient and required food specification before requesting a price. Include your intended food application, quantity, pack size and documentation requirements. A food-grade label alone does not establish suitability for every recipe or market.",
    categories: [{ name: "Food & beverage ingredients", slug: "food-and-beverages" }, { name: "Food preservatives", slug: "preservatives" }],
    references: [{ name: "USP: food ingredient identity and quality standards", url: "https://qualitymatters.usp.org/whats-usps-role-helping-ensure-food-ingredients-safety" }],
  },
  "safe-storage-and-handling-of-industrial-acids": {
    heading: "Documentation to request before ordering an acid",
    summary: "Match the acid and concentration to your process and storage arrangements. Request the current supplier SDS and confirm container compatibility, quantity and delivery requirements before approving the order.",
    categories: [{ name: "Industrial acids", slug: "acids" }, { name: "Industrial chemicals", slug: "industrial-chemicals" }],
    references: [{ name: "HSE: what a Safety Data Sheet covers", url: "https://www.hse.gov.uk/coshh/basics/datasheets.htm" }, { name: "HSE: assessing hazardous substances", url: "https://www.hse.gov.uk/coshh/basics/assessment.htm" }],
  },
  "how-to-choose-the-right-coagulant-for-water-treatment": {
    heading: "Compare coagulants for your treatment process",
    summary: "Start with product form, specification and your treatment trial requirements. Include quantity and delivery location, and ask for written confirmation of any approval needed for the intended water use.",
    categories: [{ name: "Coagulants & flocculants", slug: "coagulants-flocculants" }, { name: "Water treatment chemicals", slug: "water-treatment-chemicals" }],
    references: [],
  },
  "reducing-chemical-costs-without-compromising-water-quality": {
    heading: "Request comparable water treatment quotations",
    summary: "Use the same concentration, quantity, pack size and delivery destination for each quotation. Compare delivered cost for the required specification alongside your own treatment performance results.",
    categories: [{ name: "Water treatment chemicals", slug: "water-treatment-chemicals" }, { name: "Coagulants & flocculants", slug: "coagulants-flocculants" }],
    references: [],
  },
  "understanding-cas-numbers-and-chemical-specifications": {
    heading: "Turn your specification into a comparable quotation",
    summary: "Send the chemical name, CAS number, required grade, concentration or assay, impurity limits and quantity. State the pack size and delivery location so suppliers can quote against the same requirements.",
    categories: [{ name: "Industrial chemicals", slug: "industrial-chemicals" }, { name: "Laboratory reagents", slug: "laboratory-reagents" }],
    references: [{ name: "CAS: chemical substance identifiers", url: "https://www.cas.org/cas-data/cas-registry" }],
  },
  "setting-up-a-reliable-qc-laboratory-the-reagent-essentials": {
    heading: "Source reagents against your laboratory method",
    summary: "Specify the method, reagent grade, pack size and required documentation. Compare the method's impurity and residue limits rather than relying on the headline purity percentage alone.",
    categories: [{ name: "Analytical reagents", slug: "analytical-reagents" }, { name: "Laboratory reagents", slug: "laboratory-reagents" }],
    references: [],
  },
};
