import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/Marquee";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Comparison } from "@/components/sections/Comparison";
import { FAQ } from "@/components/sections/FAQ";
import { GitHubCTA } from "@/components/sections/GitHubCTA";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* FR-001: Hero Section */}
        <Hero />

        {/* Marquee */}
        <Marquee />

        {/* FR-003: Features Section */}
        <Features />

        {/* FR-004: How It Works / Specs */}
        <HowItWorks />

        {/* FR-004: Comparison Table */}
        <Comparison />

        {/* FAQ Section */}
        <FAQ />

        {/* FR-005: GitHub CTA */}
        <GitHubCTA />
      </main>

      <Footer />
    </div>
  );
}
