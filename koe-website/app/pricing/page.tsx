import { StatusBar } from "@/components/StatusBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { ContextAwareDownloadLink } from "@/components/ContextAwareDownloadLink";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
    title: "Koe Pricing",
    description: "Use Koe free with your own API key, or choose managed cloud processing when you want Koe to handle the key.",
    path: "/pricing/",
});

const tiers = [
    {
        name: "BYOK",
        price: "$0",
        eyebrow: "FREE FROM KOE",
        description: "Bring your own Groq key. Koe does not charge you for app usage; provider costs are handled directly by you.",
        features: [
            "Desktop and mobile app access",
            "Use your own Groq API key",
            "Signed-out local processing keeps transcript history on your device",
            "Signed-in account BYOK can store transcript history for future sync",
            "No Koe subscription required",
        ],
        cta: "Download Koe",
        highlighted: false,
    },
    {
        name: "Managed Starter",
        price: "NGN 0",
        eyebrow: "NO API KEY NEEDED",
        description: "For people who just want to sign in and test managed processing before choosing a paid monthly quota.",
        features: [
            "No provider key setup",
            "5 min/day guaranteed when managed free is enabled",
            "Bonus free time while the shared pool is quiet",
            "Server-side processing key stays private",
            "Usage tracked against your account quota",
            "Designed for casual testing",
        ],
        cta: "Create account in app",
        highlighted: true,
    },
    {
        name: "Managed Lite",
        price: "NGN 5,000/mo",
        eyebrow: "CASUAL PAID",
        description: "For light daily dictation without setting up a provider account.",
        features: [
            "No API key required",
            "10 hours of managed audio per month",
            "1,000 managed requests per month",
            "Account history and usage dashboard",
            "Paystack monthly billing",
        ],
        cta: "Open app",
        highlighted: false,
    },
    {
        name: "Managed Plus",
        price: "NGN 9,000/mo",
        eyebrow: "BEST FIT",
        description: "For regular voice-first writing and everyday cross-app dictation.",
        features: [
            "No API key required",
            "25 hours of managed audio per month",
            "2,500 managed requests per month",
            "Usage dashboard and account history",
            "Paystack monthly billing",
        ],
        cta: "Open app",
        highlighted: false,
    },
    {
        name: "Managed Pro",
        price: "NGN 15,000/mo",
        eyebrow: "HEAVIER USE",
        description: "For users who rely on Koe throughout the workday and want a larger cap.",
        features: [
            "No API key required",
            "40 hours of managed audio per month",
            "4,000 managed requests per month",
            "Usage dashboard and account history",
            "Paystack monthly billing",
        ],
        cta: "Open app",
        highlighted: false,
    },
];

export default function PricingPage() {
    return (
        <>
            <div id="top" />
            <StatusBar />
            <Header />

            <main className="flex-grow flex flex-col">
                <section className="max-w-7xl mx-auto w-full border-x border-zinc py-24 px-4 md:px-8">
                    <div className="text-center mb-16">
                        <p className="text-amber font-mono text-sm tracking-[0.25em] mb-4">BYOK IS FREE // MANAGED IS OPTIONAL</p>
                        <h1 className="font-deco text-4xl md:text-6xl mb-6 text-bone">
                            PRICING
                        </h1>
                        <p className="text-xl text-muted max-w-3xl mx-auto normal-case">
                            Koe stays free when you bring your own key. If you do not want API-key setup, managed cloud processing gives you a simpler account-based path.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
                        {tiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={`border p-8 flex flex-col ${tier.highlighted ? "border-amber bg-amber/10 shadow-[8px_8px_0_#ffb000]" : "border-zinc"}`}
                            >
                                <div className="text-xs text-amber font-mono tracking-[0.2em] mb-3">{tier.eyebrow}</div>
                                <h2 className="font-deco text-2xl mb-4 text-bone">{tier.name}</h2>
                                <div className="text-4xl font-bold text-amber mb-6 normal-case">
                                    {tier.price}
                                </div>
                                <p className="text-muted mb-8 normal-case min-h-[96px]">
                                    {tier.description}
                                </p>

                                <ul className="text-left space-y-3 mb-8 flex-grow">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-bone normal-case">
                                            <Check className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {tier.name === "BYOK" ? (
                                    <ContextAwareDownloadLink
                                        className="block w-full px-6 py-4 bg-amber text-void font-bold text-base uppercase tracking-wider hover:bg-bone transition-colors border-2 border-amber text-center"
                                    />
                                ) : (
                                    <a href="/app" className="block w-full px-6 py-4 border-2 border-zinc text-muted font-bold text-base uppercase tracking-wider text-center hover:border-amber hover:text-amber transition-colors">
                                        {tier.cta}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        <div className="border border-zinc p-6">
                            <h3 className="font-deco text-2xl text-bone mb-3">What happens to transcripts?</h3>
                            <p className="text-muted normal-case leading-relaxed">
                                Signed-out BYOK keeps transcript history on your device. Signed-in processing, whether managed or account BYOK, stores transcript text and usage metadata with your account so Koe can support account history, quota tracking, and future cross-device sync.
                            </p>
                        </div>
                        <div className="border border-zinc p-6">
                            <h3 className="font-deco text-2xl text-bone mb-3">Does Koe store audio?</h3>
                            <p className="text-muted normal-case leading-relaxed">
                                No. Audio is sent to process the request, then discarded by Koe. Text history and usage metadata are the account records we keep when you are signed in.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
