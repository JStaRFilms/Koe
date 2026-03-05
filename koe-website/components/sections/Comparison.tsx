import { Check, X } from "lucide-react";

const comparisons = [
    { feature: "COST STRUCTURE", koe: "$0 FOREVER", whisperflow: "$8-12/mo", osNative: "$0", koeHighlight: true },
    { feature: "ENGINE TYPE", koe: "WHISPER (HIGH)", whisperflow: "WHISHER (HIGH)", osNative: "NATIVE (LOW)", koeHighlight: false },
    { feature: "PRIVACY", koe: "LOCAL VAD", whisperflow: "CLOUD", osNative: "LOCAL", koeHighlight: true },
    { feature: "UNIVERSAL", koe: "ALL APPS", whisperflow: "ALL APPS", osNative: "LIMITED", koeHighlight: true },
    { feature: "OPEN SOURCE", koe: "YES", whisperflow: "NO", osNative: "NO", koeHighlight: true },
    { feature: "CUSTOM HOTKEY", koe: "YES", whisperflow: "FIXED", osNative: "FIXED", koeHighlight: true },
    { feature: "HISTORY", koe: "UNLIMITED", whisperflow: "LIMITED", osNative: "NO", koeHighlight: true },
];

export function Comparison() {
    return (
        <section id="comparison" className="border-b border-zinc">
            <div className="flex flex-col md:flex-row">
                {/* Left header */}
                <div className="w-full md:w-1/3 bg-amber text-void p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-zinc">
                    <h2 className="font-display text-3xl md:text-4xl mb-4">COMPARE.</h2>
                    <p className="normal-case font-bold">THE CHOICES ARE CLEAR. UPGRADE YOUR WORKFLOW.</p>
                </div>

                {/* Table */}
                <div className="w-full md:w-2/3 flex flex-col">
                    {/* Header row */}
                    <div className="flex w-full border-b border-zinc bg-zinc/50 font-bold text-xs md:text-sm">
                        <div className="w-1/4 p-4 border-r border-zinc text-bone">METRIC</div>
                        <div className="w-1/4 p-4 border-r border-zinc text-amber">KOE</div>
                        <div className="w-1/4 p-4 border-r border-zinc text-muted">WHISPERFLOW</div>
                        <div className="w-1/4 p-4 text-muted">OS NATIVE</div>
                    </div>

                    {/* Data rows */}
                    {comparisons.map((row, i) => (
                        <div
                            key={row.feature}
                            className={`flex w-full text-xs md:text-sm ${i < comparisons.length - 1 ? "border-b border-zinc" : ""
                                }`}
                        >
                            <div className="w-1/4 p-4 border-r border-zinc text-muted">{row.feature}</div>
                            <div className={`w-1/4 p-4 border-r border-zinc font-bold ${row.koeHighlight ? "text-amber bg-amber/5" : "text-bone"}`}>
                                {row.koe}
                            </div>
                            <div className="w-1/4 p-4 border-r border-zinc text-muted font-mono">
                                {row.whisperflow}
                            </div>
                            <div className="w-1/4 p-4 text-muted font-mono">{row.osNative}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
