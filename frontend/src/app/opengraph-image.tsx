import { ImageResponse } from "next/og";

import { brand, colors, contact, seo } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `${brand.name} ${brand.division}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded Open Graph card, generated from the same env tokens as the site. */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.primaryDark} 62%, ${colors.primary} 100%)`,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#fff",
              color: colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            {brand.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 32, fontWeight: 700 }}>{brand.name}</span>
            <span style={{ fontSize: 17, opacity: 0.65, letterSpacing: 2 }}>
              {brand.division.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.1, maxWidth: 940 }}>
            Engineering Better Chemical Solutions for Africa
          </span>
          <span style={{ fontSize: 24, opacity: 0.7, marginTop: 22, maxWidth: 900 }}>
            {seo.description.slice(0, 150)}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            fontSize: 20,
            opacity: 0.6,
            borderTop: "1px solid rgba(255,255,255,0.18)",
            paddingTop: 26,
          }}
        >
          <span>{contact.city}, {contact.country}</span>
          <span>·</span>
          <span>{contact.phone}</span>
          <span>·</span>
          <span>{contact.email}</span>
        </div>
      </div>
    ),
    size,
  );
}
