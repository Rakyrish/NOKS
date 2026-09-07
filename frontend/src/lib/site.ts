/**
 * Single typed accessor for every environment-driven value in the UI.
 * Nothing in `src/` should read `process.env` directly.
 */

/**
 * Every NEXT_PUBLIC_* value, inlined as one blob by next.config.mjs.
 *
 * This exists because the lookup below is dynamic. Next.js substitutes
 * `process.env.SOME_LITERAL_KEY` at build time, but it cannot rewrite
 * `process.env[key]`, so in the browser bundle every lookup here returned
 * undefined and each value silently fell back to "". Server-rendered markup
 * therefore carried the real phone and email, and hydration then stripped
 * them out. Reading a single static key restores them on the client.
 */
const PUBLIC_ENV: Record<string, string | undefined> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_ENV_JSON || "{}") as Record<string, string>;
  } catch {
    return {};
  }
})();

const env = (key: string, fallback = ""): string => {
  // process.env is the real thing on the server; PUBLIC_ENV covers the browser.
  const value = process.env[key] ?? PUBLIC_ENV[key];
  return value === undefined || value === "" ? fallback : value;
};

const num = (key: string, fallback = 0): number => {
  const parsed = Number(env(key));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const bool = (key: string, fallback = false): boolean => {
  const value = env(key).toLowerCase();
  if (!value) return fallback;
  return value === "true" || value === "1" || value === "yes";
};

const list = (key: string): string[] =>
  env(key)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const brand = {
  name: env("NEXT_PUBLIC_BRAND_NAME", "NOKS"),
  division: env("NEXT_PUBLIC_BRAND_DIVISION", "Chemical Division"),
  tagline: env("NEXT_PUBLIC_BRAND_TAGLINE"),
  mission: env("NEXT_PUBLIC_BRAND_MISSION"),
  logo: env("NEXT_PUBLIC_BRAND_LOGO", "/noks-logo.jpeg"),
  get fullName() {
    return `${this.name} ${this.division}`;
  },
} as const;

export const colors = {
  primary: env("NEXT_PUBLIC_COLOR_PRIMARY", "#0C48E6"),
  primaryDark: env("NEXT_PUBLIC_COLOR_PRIMARY_DARK", "#0A38C2"),
  navy: env("NEXT_PUBLIC_COLOR_NAVY", "#071233"),
  navySoft: env("NEXT_PUBLIC_COLOR_NAVY_SOFT", "#0E1E45"),
  emerald: env("NEXT_PUBLIC_COLOR_EMERALD", "#059669"),
  emeraldLight: env("NEXT_PUBLIC_COLOR_EMERALD_LIGHT", "#10B981"),
  accent: env("NEXT_PUBLIC_COLOR_ACCENT", "#2F5EFA"),
  surface: env("NEXT_PUBLIC_COLOR_SURFACE", "#FFFFFF"),
  muted: env("NEXT_PUBLIC_COLOR_MUTED", "#F5F7FB"),
} as const;

export const fonts = {
  sans: env("NEXT_PUBLIC_FONT_SANS", "Inter"),
  display: env("NEXT_PUBLIC_FONT_DISPLAY", "Sora"),
} as const;

export const contact = {
  email: env("NEXT_PUBLIC_CONTACT_EMAIL"),
  emailSupport: env("NEXT_PUBLIC_CONTACT_EMAIL_SUPPORT"),
  phone: env("NEXT_PUBLIC_CONTACT_PHONE"),
  phoneAlt: env("NEXT_PUBLIC_CONTACT_PHONE_ALT"),
  whatsapp: env("NEXT_PUBLIC_WHATSAPP_NUMBER"),
  street: env("NEXT_PUBLIC_ADDRESS_STREET"),
  city: env("NEXT_PUBLIC_ADDRESS_CITY"),
  country: env("NEXT_PUBLIC_ADDRESS_COUNTRY"),
  postal: env("NEXT_PUBLIC_ADDRESS_POSTAL"),
  lat: env("NEXT_PUBLIC_GEO_LAT"),
  lng: env("NEXT_PUBLIC_GEO_LNG"),
  hours: env("NEXT_PUBLIC_OPENING_HOURS"),
  mapsEmbed: env("NEXT_PUBLIC_GOOGLE_MAPS_EMBED"),
  get addressLine() {
    return [this.street, this.city, this.country].filter(Boolean).join(", ");
  },
  get whatsappUrl() {
    return this.whatsapp ? `https://wa.me/${this.whatsapp}` : "";
  },
  get telHref() {
    return `tel:${this.phone.replace(/\s+/g, "")}`;
  },
} as const;

export const social = {
  linkedin: env("NEXT_PUBLIC_SOCIAL_LINKEDIN"),
  facebook: env("NEXT_PUBLIC_SOCIAL_FACEBOOK"),
  twitter: env("NEXT_PUBLIC_SOCIAL_TWITTER"),
  instagram: env("NEXT_PUBLIC_SOCIAL_INSTAGRAM"),
} as const;

export const stats = {
  years: num("NEXT_PUBLIC_STAT_YEARS"),
  products: num("NEXT_PUBLIC_STAT_PRODUCTS"),
  countries: num("NEXT_PUBLIC_STAT_COUNTRIES"),
  industries: num("NEXT_PUBLIC_STAT_INDUSTRIES"),
  deliveries: num("NEXT_PUBLIC_STAT_DELIVERIES"),
  satisfaction: num("NEXT_PUBLIC_STAT_SATISFACTION"),
} as const;

export const seo = {
  title: env("NEXT_PUBLIC_SEO_TITLE"),
  description: env("NEXT_PUBLIC_SEO_DESCRIPTION"),
  keywords: list("NEXT_PUBLIC_SEO_KEYWORDS"),
  locale: env("NEXT_PUBLIC_SEO_LOCALE", "en_KE"),
  twitterHandle: env("NEXT_PUBLIC_SEO_TWITTER_HANDLE"),
  googleVerification: env("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"),
  gaId: env("NEXT_PUBLIC_GA_MEASUREMENT_ID"),
} as const;

export const ai = {
  enabled: bool("NEXT_PUBLIC_AI_ENABLED", true),
  name: env("NEXT_PUBLIC_AI_ASSISTANT_NAME", "Chem Assistant"),
} as const;

export const siteUrl = env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(/\/$/, "");

/** Browser-facing API base. */
export const apiUrl = env("NEXT_PUBLIC_API_URL", "http://localhost:8000/api/v1").replace(
  /\/$/,
  "",
);

/** Server-side API base — inside Docker this points at the backend service. */
export const internalApiUrl = (process.env.INTERNAL_API_URL || apiUrl).replace(/\/$/, "");

export const absoluteUrl = (path = "/") =>
  `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
