import { StatusBar } from "@/components/StatusBar";
import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Features } from "@/components/sections/Features";
import { Specs } from "@/components/sections/Specs";
import { FAQ } from "@/components/sections/FAQ";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      {/* Giant Background Kanji */}
      <div className="giant-kanji font-jp pointer-events-none fixed">声</div>

      {/* Top Status Bar (Terminal Style) */}
      <StatusBar />

      {/* Decostyle Header */}
      <Header />

      <main className="flex-grow flex flex-col">
        {/* HERO SECTION */}
        <Hero />

        {/* Marquee Bar */}
        <Marquee />

        {/* FEATURES TABLE (Brutalist List) */}
        <Features />

        {/* SPECS / HOW IT WORKS GRID + COMPARISON */}
        <Specs />

        {/* FAQ BRUTAL STYLE */}
        <FAQ />
      </main>

      {/* FOOTER NOIR */}
      <Footer />
    </>
  );
}
