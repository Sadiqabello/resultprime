import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
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
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "education",
  // Don't let browsers auto-link incidental numbers/emails as phone/address.
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: { icon: "/icon.svg" },
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
        <Toaster />
      </body>
    </html>
  );
}
