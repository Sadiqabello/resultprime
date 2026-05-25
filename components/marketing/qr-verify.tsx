import QRCode from "qrcode";

const VERIFY = "#bc6c25";

/**
 * A real, scannable QR rendered to SVG at render time — the same idea as the
 * code printed on every published report card. Points at the public verify page
 * so a visitor can scan and see what "QR-verified" means. Async server
 * component; returns null if generation fails (never blocks the page).
 */
export async function QrVerify({ value, className = "" }: { value?: string; className?: string }) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://resultprime.xyz";
  const target = value ?? `${base}/verify`;

  let svg = "";
  try {
    svg = await QRCode.toString(target, {
      type: "svg",
      margin: 1,
      color: { dark: "#283618", light: "#ffffff" },
    });
  } catch {
    return null;
  }

  return (
    <span
      className={`flex items-center gap-2.5 rounded-lg border border-[#0a1130]/12 bg-white/95 p-2 shadow-[0_12px_28px_-12px_rgba(10,17,48,0.4)] backdrop-blur ${className}`}
    >
      <span className="block size-12 shrink-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <span className="pr-1 font-sans text-[10px] font-bold uppercase leading-tight tracking-[0.14em]" style={{ color: VERIFY }}>
        Scan to
        <br />
        verify
      </span>
    </span>
  );
}
