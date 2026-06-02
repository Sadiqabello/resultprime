import { ImageResponse } from "next/og";

/**
 * Social share card (1200×630). Next auto-wires this as the site's OpenGraph +
 * Twitter image. Editorial/"register" styling to match the landing page.
 */
// Edge runtime: next/og's ImageResponse renders cleanly here; the Node runtime
// fails to statically prerender this at build time. The "edge disables static
// generation" build note is expected and harmless.
export const runtime = "edge";
export const alt = "Result Prime — the official record of every child's term";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fefae0",
          padding: "72px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#283618",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 32, letterSpacing: 3, textTransform: "uppercase" }}>
          <div style={{ width: 18, height: 18, backgroundColor: "#bc6c25", transform: "rotate(45deg)", marginRight: 18 }} />
          Result Prime
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.04, maxWidth: 960 }}>
            The official record of every child&apos;s term.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#5b6048", marginTop: 30, maxWidth: 900 }}>
            Audited scores · ranked positions · branded, QR-verified report cards.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "3px double #283618",
            paddingTop: 26,
            fontSize: 26,
          }}
        >
          <div style={{ display: "flex" }}>resultprime.xyz</div>
          <div style={{ display: "flex", color: "#bc6c25", fontWeight: 700 }}>✓ Verified record</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
