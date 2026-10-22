import { describe, expect, it } from "vitest";
import { pageHref, parsePage } from "../src/lib/pagination";

describe("public pagination", () => {
  it("accepts positive whole pages and defaults only when omitted", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("1")).toBe(1);
    expect(parsePage("13")).toBe(13);
    expect(pageHref("/industries/manufacturing", 1)).toBe("/industries/manufacturing");
    expect(pageHref("/industries/manufacturing", 2)).toBe("/industries/manufacturing?page=2");
  });
  it("rejects negative, zero, fractional, ambiguous and unsafe values", () => {
    for (const value of ["0", "-1", "abc", "1.5", "", "01", "1e2", "9007199254740992", ["1", "2"]]) expect(parsePage(value)).toBeNull();
  });
});
