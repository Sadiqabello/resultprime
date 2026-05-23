import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Editorial serif for display + crisp grotesque for body (see frontend design notes).
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Result Prime — Results, at their prime",
    template: "%s · Result Prime",
  },
  description:
    "Result Prime turns raw scores into audited, branded, QR-verified report cards for primary & secondary schools.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      {/* suppressHydrationWarning: browser extensions (Grammarly, etc.) inject
          attributes onto <body> before React hydrates, causing a benign mismatch. */}
      <body suppressHydrationWarning className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
