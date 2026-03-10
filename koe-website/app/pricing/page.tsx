import { StatusBar } from "@/components/StatusBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { ContextAwareDownloadLink } from "@/components/ContextAwareDownloadLink";
import { Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing",
    description: "Koe is completely free and open source. No subscriptions, no limits.",
    alternates: {
        canonical: "/pricing/",
    },
};

export default function PricingPage() {
    const features = [
        "Unlimited voice dictation",
        "Local VAD processing",
        "Global hotkey support",
        "Auto-type functionality",
        "History & transcripts",
        "Open source code",
        "Community support",
    ];

    return (
        <>
            <div id="top" />
            <StatusBar />
            <Header />

            <main className="flex-grow flex flex-col">
                <section className="max-w-7xl mx-auto w-full border-x border-zinc py-24 px-4 md:px-8">
                    <div className="text-center mb-16">
                        <h1 className="font-deco text-4xl md:text-6xl mb-6 text-bone">
                            PRICING
                        </h1>
                        <p className="text-xl text-muted max-w-2xl mx-auto normal-case">
                            Completely free. No subscriptions. No limits.
                        </p>
                    </div>

                    <div className="max-w-md mx-auto">
                        <div className="border border-zinc p-8 text-center">
                            <h2 className="font-deco text-2xl mb-4 text-bone">FREE FOREVER</h2>
                            <div className="text-5xl font-bold text-amber mb-6">
                                $0
                            </div>
                            <p className="text-muted mb-8 normal-case">
                                BYOK (Bring Your Own Key) model. Just add your Groq API key and start dictating.
                            </p>

                            <ul className="text-left space-y-3 mb-8">
                                {features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-bone normal-case">
                                        <Check className="w-5 h-5 text-amber flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <ContextAwareDownloadLink
                                className="block w-full px-8 py-4 bg-amber text-void font-bold text-lg uppercase tracking-wider hover:bg-bone transition-colors border-2 border-amber text-center"
                            />
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-muted text-sm normal-case">
                            Need a Groq API key?{" "}
                            <a
                                href="https://groq.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber hover:underline"
                            >
                                Get one free at groq.com
                            </a>
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
