/**
 * One source of truth for who NOKS is, and one gate for what we are willing to
 * claim in public.
 *
 * ── Why the gate exists ──────────────────────────────────────────────────
 *
 * The audit found a tier of content on this site that is asserted confidently
 * and backed by nothing in the system:
 *
 *   • 5 five-star testimonials attributed to *named individuals* at named real
 *     organisations (Nairobi Water & Sewerage, Kenyatta University …).
 *   • 8 named client organisations, including East Africa Breweries — real,
 *     listed companies presented as customers.
 *   • "ISO 9001:2015" and "KEBS Approved" certification rows with no number,
 *     no issue date, no certificate and no issuing-body reference.
 *   • "Certificate of Analysis and Safety Data Sheet with every batch", while
 *     `catalog_productdocument` holds **zero rows** — not one COA, SDS or TDS
 *     exists in the system for any of the 182 products.
 *   • Counters reading 1,200 product lines (the catalogue holds 182), 25,000
 *     deliveries, 98% customer satisfaction, 15 years, 8 countries.
 *   • Same-day Nairobi dispatch, a road-tanker fleet, an in-house QC lab.
 *
 * None of that is necessarily false — the business may well hold the
 * certificates and serve those customers. But we cannot verify it from here,
 * and publishing an unverifiable superlative is both a Google quality problem
 * and, where a third party is named, a real-world one.
 *
 * So nothing in `CLAIMS` renders until the owner confirms it, by listing its id
 * in `NEXT_PUBLIC_VERIFIED_CLAIMS`. No data is deleted: every testimonial,
 * client and certification row is still in the database and still in the admin,
 * and turning one back on is one comma in one env var.
 *
 * Counts that CAN be checked are not claims at all — they are read live from
 * the catalogue (see `catalogFacts` in the homepage/about routes) rather than
 * typed into an env var and left to rot.
 */

import { contact, brand } from "./site";

// ─────────────────────────────── NAP ────────────────────────────────

/**
 * Convert a local Kenyan number to E.164.
 *
 * Structured data wants `+254142998027`; the site is configured with the local
 * form `0142998027`, which is what a Kenyan customer expects to see and dial.
 * Both come from the same digits — this only reformats, it never guesses a
 * different number. Anything it cannot parse with confidence returns null, and
 * the caller omits `telephone` rather than publishing a malformed one.
 */
export function toE164(local: string, countryDialCode = "+254"): string | null {
  const digits = (local || "").replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return /^\+\d{8,15}$/.test(digits) ? digits : null;
  // National format: a single leading trunk 0, then the subscriber number.
  const national = digits.replace(/^0+/, "");
  if (!national || national.length < 8 || national.length > 12) return null;
  const e164 = `${countryDialCode}${national}`;
  return /^\+\d{8,15}$/.test(e164) ? e164 : null;
}

/** Name, address and phone — identical everywhere they are rendered. */
export const nap = {
  legalName: brand.fullName,
  street: contact.street,
  city: contact.city,
  postalCode: contact.postal,
  country: contact.country,
  get addressLine() {
    return [this.street, this.city, this.country].filter(Boolean).join(", ");
  },
  /** As a Kenyan customer reads and dials it. */
  phoneDisplay: contact.phone,
  /** As schema.org wants it, or null when the configured value cannot be parsed. */
  get phoneE164() {
    return toE164(contact.phone);
  },
  email: contact.email,
  get telHref() {
    return this.phoneE164 ? `tel:${this.phoneE164}` : "";
  },
  get whatsappUrl() {
    return contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : "";
  },
} as const;

// ───────────────────────────── Claims gate ──────────────────────────

export type ClaimId =
  | "certifications"
  | "testimonials"
  | "client-list"
  | "operational-stats"
  | "same-day-dispatch"
  | "logistics-fleet"
  | "in-house-qc"
  | "documents-with-every-batch"
  | "company-history"
  | "social-profiles";

/**
 * What each gated claim asserts and what would unlock it.
 *
 * Read by `docs/seo-fixes-implemented.md` and by
 * `tests/business-claims.test.ts`, so the list cannot drift from the code.
 */
export const CLAIMS: Record<ClaimId, { asserts: string; needs: string }> = {
  certifications: {
    asserts: "ISO 9001:2015, KEBS Approved, Food Safety Compliant, GHS Compliant.",
    needs: "Certificate numbers, issuing body and issue/expiry dates, or scans.",
  },
  testimonials: {
    asserts: "Five 5-star quotes attributed to named people at named organisations.",
    needs: "Written permission from each named individual and employer.",
  },
  "client-list": {
    asserts: "Eight named organisations presented as NOKS customers.",
    needs: "Written permission from each organisation to use its name.",
  },
  "operational-stats": {
    asserts: "15 years, 8 countries, 25,000 deliveries, 98% satisfaction.",
    needs: "Company registration date, export records, ERP delivery counts, a real survey.",
  },
  "same-day-dispatch": {
    asserts: "Same-day dispatch from Nairobi.",
    needs: "A dispatch cut-off time and the stock conditions under which it holds.",
  },
  "logistics-fleet": {
    asserts: "A road-tanker fleet serving the EAC corridor.",
    needs: "Owned or contracted vehicle list; otherwise say 'delivery arranged'.",
  },
  "in-house-qc": {
    asserts: "An in-house QC laboratory verifying every batch.",
    needs: "Lab location, instruments and the tests actually run.",
  },
  "documents-with-every-batch": {
    asserts: "A COA and SDS accompany every batch.",
    needs: "Zero documents exist in catalog_productdocument. Upload them, or qualify the claim.",
  },
  "company-history": {
    asserts: "A 2010 founding and a six-step milestone timeline.",
    needs: "Certificate of incorporation; confirmation of each milestone year.",
  },
  "social-profiles": {
    asserts: "Organization sameAs links to Facebook, Instagram, LinkedIn and X.",
    needs: "Confirmation each handle belongs to NOKS. x.com/noks returned 404 when probed.",
  },
};

const VERIFIED: ReadonlySet<string> = new Set(
  (process.env.NEXT_PUBLIC_VERIFIED_CLAIMS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

/**
 * Has the owner confirmed this claim?
 *
 * Default is `false` for everything. A claim we forget to think about stays
 * off the site, which is the failure direction we want.
 */
export const isVerified = (id: ClaimId): boolean => VERIFIED.has(id);

/** Every claim still awaiting sign-off — powers the verification report. */
export const unverifiedClaims = (): ClaimId[] =>
  (Object.keys(CLAIMS) as ClaimId[]).filter((id) => !isVerified(id));
