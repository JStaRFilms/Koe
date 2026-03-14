import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://koe.jstarstudios.com"),
  title: {
    default: "Koe - Free Voice Dictation for Desktop and Mobile",
    template: "%s | Koe",
  },
  description: "Lightning-fast, free voice dictation for desktop and mobile. Powered by AI, completely open source. No subscriptions, just your voice.",
  keywords: ["voice dictation", "speech to text", "desktop", "mobile", "Windows", "macOS", "iOS", "Android", "free", "open source", "Whisper", "Groq"],
  authors: [{ name: "Koe" }],
  creator: "Koe",
  publisher: "Koe",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Koe - Free Voice Dictation for Desktop and Mobile",
    description: "Lightning-fast, free voice dictation for desktop and mobile. Powered by AI, completely open source.",
    url: "https://koe.jstarstudios.com",
    siteName: "Koe",
    images: [
      {
        url: "/og-image.svg",
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
    title: "Koe - Free Voice Dictation for Desktop and Mobile",
    description: "Lightning-fast, free voice dictation for desktop and mobile. Powered by AI, completely open source.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml", sizes: "any" }],
    apple: [{ url: "/logo.svg" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Righteous&family=IBM+Plex+Mono:wght@400;600;700&family=Noto+Serif+JP:wght@900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-bone font-mono uppercase selection:bg-amber selection:text-void min-h-screen flex flex-col grid-bg">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Koe",
              applicationCategory: "ProductivityApplication",
              operatingSystem: "Windows 10/11, macOS, iOS, Android",
              url: "https://koe.jstarstudios.com",
              description: "Free and open source voice dictation tools for desktop and mobile with AI transcription.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
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





