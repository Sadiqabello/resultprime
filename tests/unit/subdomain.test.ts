import { describe, it, expect } from "vitest";
import { parseSubdomain } from "@/lib/tenant/subdomain";

describe("parseSubdomain", () => {
  it("extracts a tenant slug from a real-domain host", () => {
    expect(parseSubdomain("greenfield.rps.com", "rps.com")).toBe("greenfield");
    expect(parseSubdomain("unity-high.rps.com", "rps.com")).toBe("unity-high");
  });
  it("works in dev with a port", () => {
    expect(parseSubdomain("greenfield.localhost:3000", "localhost:3000")).toBe("greenfield");
    expect(parseSubdomain("greenfield.localhost", "localhost:3000")).toBe("greenfield");
  });
  it("returns null for the apex and www", () => {
    expect(parseSubdomain("rps.com", "rps.com")).toBeNull();
    expect(parseSubdomain("www.rps.com", "rps.com")).toBeNull();
    expect(parseSubdomain("localhost:3000", "localhost:3000")).toBeNull();
  });
  it("ignores reserved/platform subdomains", () => {
    expect(parseSubdomain("app.rps.com", "rps.com")).toBeNull();
    expect(parseSubdomain("api.rps.com", "rps.com")).toBeNull();
  });
  it("returns null for a foreign host or empty input", () => {
    expect(parseSubdomain("evil.com", "rps.com")).toBeNull();
    expect(parseSubdomain(null, "rps.com")).toBeNull();
    expect(parseSubdomain("greenfield.rps.com", "")).toBeNull();
  });
  it("rejects malformed slug labels", () => {
    expect(parseSubdomain("Bad_Slug.rps.com", "rps.com")).toBeNull();
    expect(parseSubdomain("a b.rps.com", "rps.com")).toBeNull();
  });
});
