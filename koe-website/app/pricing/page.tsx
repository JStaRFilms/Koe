import { StatusBar } from "@/components/StatusBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { PricingSection } from "@/components/sections/PricingSection";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
    title: "Koe Pricing",
    description: "Use Koe free with your own API key, or choose managed cloud processing when you want Koe to handle the key.",
    path: "/pricing/",
});

export default function PricingPage() {
    return (
        <>
            <div id="top" />
            <StatusBar />
            <Header />

            <main className="flex-grow flex flex-col">
                <PricingSection />
            </main>

            <Footer />
        </>
    );
}
