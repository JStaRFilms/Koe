"use client";

import { useState } from "react";
import { Check, HelpCircle, Key, Server, Download, ShieldAlert, Cpu } from "lucide-react";
import { ContextAwareDownloadLink } from "@/components/ContextAwareDownloadLink";

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
        highlighted: false,
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
        ],
        cta: "Open app",
        highlighted: false,
    },
    {
        name: "Managed Plus",
        price: "NGN 9,000/mo",
        eyebrow: "BEST VALUE // BEST FIT",
        description: "For regular voice-first writing and everyday cross-app dictation.",
        features: [
            "No API key required",
            "25 hours of managed audio per month",
            "2,500 managed requests per month",
            "Usage dashboard and account history",
        ],
        cta: "Open app",
        highlighted: true,
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
        ],
        cta: "Open app",
        highlighted: false,
    },
];

export function PricingSection() {
    const byokPlan = tiers[0];
    const managedTiers = tiers.filter((t) => t.name !== "BYOK");
    const [activeManagedTab, setActiveManagedTab] = useState("Managed Plus");

    const selectedManagedPlan =
        managedTiers.find((t) => t.name === activeManagedTab) || managedTiers[0];

    return (
        <section className="max-w-7xl mx-auto w-full border-x border-zinc py-16 px-4 md:px-8 bg-void/35">
            {/* Header section */}
            <div className="text-center mb-16 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 font-mono text-xs text-amber opacity-30 select-none">
                    [ SYS.PRICING_ROUTER_ONLINE ]
                </div>
                <p className="text-amber font-mono text-xs sm:text-sm tracking-[0.25em] mb-4 uppercase">
                    BYOK IS FREE // MANAGED IS OPTIONAL
                </p>
                <h1 className="font-deco text-5xl sm:text-6xl md:text-7xl mb-6 text-bone tracking-wide">
                    PRICING
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted max-w-3xl mx-auto normal-case font-mono tracking-wide leading-relaxed">
                    Koe stays free when you bring your own key. If you do not want API-key setup, managed cloud processing gives you a simpler account-based path.
                </p>
            </div>

            {/* Redesigned 2-column pricing block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch mb-16">
                
                {/* Developer BYOK Card - Left Column */}
                <div className="lg:col-span-5 border border-zinc p-8 flex flex-col justify-between bg-void relative shadow-[8px_8px_0_0_var(--color-zinc)] transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 border-b border-l border-zinc px-3 py-1 font-mono text-[10px] text-muted uppercase">
                        [ BYOK_MODE ]
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Key className="w-5 h-5 text-amber" />
                            <span className="text-xs text-amber font-mono tracking-[0.2em] uppercase">
                                {byokPlan.eyebrow}
                            </span>
                        </div>
                        <h2 className="font-deco text-3xl md:text-4xl mb-4 text-bone">{byokPlan.name}</h2>
                        <div className="text-5xl md:text-6xl font-bold text-amber mb-6 normal-case">
                            {byokPlan.price}
                        </div>
                        <p className="text-muted mb-8 normal-case font-mono text-sm leading-relaxed">
                            {byokPlan.description}
                        </p>

                        <div className="border-t border-dashed border-zinc/60 my-6"></div>

                        <ul className="text-left space-y-4 mb-8">
                            {byokPlan.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-bone normal-case">
                                    <Check className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
                                    <span className="font-mono text-xs sm:text-sm tracking-wide leading-relaxed">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-auto pt-6">
                        <ContextAwareDownloadLink
                            className="btn-brutal w-full justify-center text-center uppercase tracking-wider"
                        />
                    </div>
                </div>

                {/* Managed Cloud Card - Right Column */}
                <div className="lg:col-span-7 border-2 border-amber p-8 flex flex-col justify-between bg-void relative shadow-[12px_12px_0_0_var(--color-amber)] transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 bg-amber text-void px-3 py-1 font-mono text-[10px] uppercase font-bold">
                        [ MANAGED_CLOUD ]
                    </div>
                    <div>
                        {/* Selector Tabs */}
                        <div className="flex flex-col mb-8">
                            <span className="text-[10px] font-mono text-muted mb-2 uppercase tracking-widest">[ SELECT MANAGED QUOTA ]</span>
                            <div className="grid grid-cols-4 border border-zinc overflow-hidden bg-void/60">
                                {managedTiers.map((tier) => {
                                    const isActive = tier.name === activeManagedTab;
                                    return (
                                        <button
                                            key={tier.name}
                                            type="button"
                                            onClick={() => setActiveManagedTab(tier.name)}
                                            className={`py-3 text-[10px] sm:text-xs font-bold tracking-wider text-center border-r last:border-r-0 border-zinc cursor-pointer transition-colors uppercase ${
                                                isActive
                                                    ? "bg-amber text-void border-amber font-extrabold"
                                                    : "text-muted hover:bg-zinc/30 hover:text-bone"
                                            }`}
                                        >
                                            {tier.name.replace("Managed ", "")}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <Server className="w-5 h-5 text-amber animate-pulse" />
                            <span className="text-xs text-amber font-mono tracking-[0.2em] uppercase">
                                {selectedManagedPlan.eyebrow}
                            </span>
                        </div>
                        <h2 className="font-deco text-3xl md:text-4xl mb-4 text-bone">{selectedManagedPlan.name}</h2>
                        <div className="text-5xl md:text-6xl font-bold text-amber mb-6 normal-case">
                            {selectedManagedPlan.price}
                        </div>
                        <p className="text-muted mb-8 normal-case font-mono text-sm leading-relaxed">
                            {selectedManagedPlan.description}
                        </p>

                        <div className="border-t border-dashed border-zinc/60 my-6"></div>

                        <ul className="text-left space-y-4 mb-8">
                            {selectedManagedPlan.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-bone normal-case">
                                    <Check className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
                                    <span className="font-mono text-xs sm:text-sm tracking-wide leading-relaxed">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-auto pt-6">
                        <a
                            href="/app"
                            className="block w-full px-6 py-4 bg-amber text-void font-bold text-center text-base uppercase tracking-wider hover:bg-bone hover:text-void transition-all border-2 border-amber btn-brutal justify-center"
                        >
                            {selectedManagedPlan.cta}
                        </a>
                    </div>
                </div>

            </div>

            {/* Additional FAQ / Info cards redesigned */}
            <div className="mt-16 grid gap-8 md:grid-cols-2">
                <div className="border border-zinc p-8 bg-void/20 relative">
                    <div className="absolute top-0 right-0 border-b border-l border-zinc px-3 py-1 font-mono text-[9px] text-muted uppercase">
                        [ DIRECTIVE: TRANSCRIPTS ]
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldAlert className="w-5 h-5 text-amber" />
                        <h3 className="font-deco text-2xl text-bone">What happens to transcripts?</h3>
                    </div>
                    <p className="text-muted normal-case leading-relaxed font-mono text-sm">
                        Signed-out BYOK keeps transcript history on your device. Signed-in processing, whether managed or account BYOK, stores transcript text and usage metadata with your account so Koe can support account history, quota tracking, and future cross-device sync.
                    </p>
                </div>
                <div className="border border-zinc p-8 bg-void/20 relative">
                    <div className="absolute top-0 right-0 border-b border-l border-zinc px-3 py-1 font-mono text-[9px] text-muted uppercase">
                        [ DIRECTIVE: AUDIO_DATA ]
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <Cpu className="w-5 h-5 text-amber" />
                        <h3 className="font-deco text-2xl text-bone">Does Koe store audio?</h3>
                    </div>
                    <p className="text-muted normal-case leading-relaxed font-mono text-sm">
                        No. Audio is sent to process the request, then discarded by Koe. Text history and usage metadata are the account records we keep when you are signed in.
                    </p>
                </div>
            </div>
        </section>
    );
}
