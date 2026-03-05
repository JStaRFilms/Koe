import type { Metadata } from "next";
import { IBM_Plex_Mono, Righteous } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const righteous = Righteous({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
});

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
      <body
        className={`${ibmPlexMono.variable} ${righteous.variable} font-mono antialiased bg-void text-bone min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="grid-bg min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
