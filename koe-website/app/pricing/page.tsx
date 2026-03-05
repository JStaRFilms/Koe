import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check } from "lucide-react";

export const metadata = {
    title: "Pricing | Koe",
    description: "Koe is completely free and open source. No subscriptions, no limits.",
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
        <div className="flex min-h-screen flex-col">
            <Navbar />

            <main className="flex-1">
                <section className="py-24">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-bone">
                                PRICING
                            </h1>
                            <p className="text-xl text-muted max-w-2xl mx-auto">
                                Completely free. No subscriptions. No limits.
                            </p>
                        </div>

                        <div className="max-w-md mx-auto">
                            <div className="border border-zinc p-8 text-center">
                                <h2 className="text-2xl font-bold mb-4 text-bone">FREE FOREVER</h2>
                                <div className="text-5xl font-bold text-amber mb-6">
                                    $0
                                </div>
                                <p className="text-muted mb-8">
                                    BYOK (Bring Your Own Key) model. Just add your Groq API key and start dictating.
                                </p>

                                <ul className="text-left space-y-3 mb-8">
                                    {features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-bone">
                                            <Check className="w-5 h-5 text-amber flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href="/download/"
                                    className="block w-full px-8 py-4 bg-amber text-void font-bold text-lg uppercase tracking-wider hover:bg-bone transition-colors border-2 border-amber"
                                >
                                    Download Now
                                </a>
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <p className="text-muted text-sm">
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
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
