import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Serif_JP, Righteous } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GITHUB_REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, absoluteUrl } from "@/lib/site";

const deco = Righteous({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-deco",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const jp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: "900",
  variable: "--font-jp",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: SITE_TITLE,
    description: "Lightning-fast voice dictation for desktop and mobile. Use your own API key for free, or choose managed cloud processing.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Koe - Free Voice Dictation for Desktop and Mobile",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: "Lightning-fast voice dictation for desktop and mobile. Free BYOK or managed cloud processing.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
      { url: "/logo.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${deco.variable} ${mono.variable} ${jp.variable}`}>
      <body className="bg-void text-bone font-mono uppercase selection:bg-amber selection:text-void min-h-screen flex flex-col grid-bg">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": absoluteUrl("/#organization"),
                  name: SITE_NAME,
                  url: SITE_URL,
                  sameAs: [GITHUB_REPO_URL],
                },
                {
                  "@type": "WebSite",
                  "@id": absoluteUrl("/#website"),
                  name: SITE_NAME,
                  url: SITE_URL,
                  publisher: { "@id": absoluteUrl("/#organization") },
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": absoluteUrl("/#software"),
                  name: SITE_NAME,
                  applicationCategory: "ProductivityApplication",
                  operatingSystem: "Windows 10/11, macOS, iOS, Android",
                  url: SITE_URL,
                  description: SITE_DESCRIPTION,
                  publisher: { "@id": absoluteUrl("/#organization") },
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                    url: absoluteUrl("/pricing/"),
                  },
                },
              ],
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}





