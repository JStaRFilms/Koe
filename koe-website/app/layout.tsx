import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://koe.jstarstudios.com"),
  title: "Koe — Free Voice Dictation for Windows",
  description: "Lightning-fast, free voice dictation app for Windows. Powered by AI, completely open source. No subscriptions, just your voice.",
  keywords: ["voice dictation", "speech to text", "Windows", "free", "open source", "Whisper", "Groq"],
  authors: [{ name: "Koe" }],
  creator: "Koe",
  publisher: "Koe",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Koe — Free Voice Dictation for Windows",
    description: "Lightning-fast, free voice dictation app for Windows. Powered by AI, completely open source.",
    url: "https://koe.jstarstudios.com",
    siteName: "Koe",
    images: [{
      url: "/og-image.svg",
      width: 1200,
      height: 630,
      alt: "Koe - Free Voice Dictation for Windows",
    }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Koe — Free Voice Dictation for Windows",
    description: "Lightning-fast, free voice dictation app for Windows. Powered by AI, completely open source.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts: Righteous (Deco) & IBM Plex Mono (Terminal) & Noto Serif JP */}
        <link
          href="https://fonts.googleapis.com/css2?family=Righteous&family=IBM+Plex+Mono:wght@400;600;700&family=Noto+Serif+JP:wght@900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-bone font-mono uppercase selection:bg-amber selection:text-void min-h-screen flex flex-col grid-bg">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
