import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsContext, clickEvent, trackEvent, trackLead } from "../src/lib/analytics";

afterEach(() => vi.unstubAllGlobals());

describe("consent-aware analytics", () => {
  it("excludes queries, fragments and invalid identifiers", () => {
    expect(analyticsContext("/products/acetone?email=private@example.invalid#message")).toEqual({ page_path: "/products/acetone", product_id: "acetone" });
    expect(analyticsContext("/quote", "private@example.invalid")).toEqual({ page_path: "/quote" });
  });
  it("classifies only recognised conversion links", () => {
    const origin = "https://chemicals.noksindustrial.com";
    expect(clickEvent("tel:+254123", origin)).toBe("phone_click");
    expect(clickEvent("mailto:sales@example.invalid", origin)).toBe("email_click");
    expect(clickEvent("https://wa.me/254123?text=private", origin)).toBe("whatsapp_click");
    expect(clickEvent("/quote?product=acetone", origin)).toBe("request_quote_click");
    expect(clickEvent("https://other.example/quote", origin)).toBeNull();
  });
  it("sends nothing without consent and counts a replayed receipt once", () => {
    const gtag = vi.fn();
    const browser = { noksAnalyticsActive: false, gtag, location: { pathname: "/products/acetone", origin: "https://chemicals.noksindustrial.com" } };
    vi.stubGlobal("window", browser);
    trackEvent("phone_click");
    trackLead("controlled-receipt");
    expect(gtag).not.toHaveBeenCalled();
    browser.noksAnalyticsActive = true;
    trackLead("controlled-receipt");
    trackLead("controlled-receipt");
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag.mock.calls[0][1]).toBe("generate_lead");
    expect(JSON.stringify(gtag.mock.calls)).not.toContain("controlled-receipt");
  });
});
