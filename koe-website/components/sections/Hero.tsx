"use client";

import { useEffect, useState } from "react";
import { Terminal, Github } from "lucide-react";
import Link from "next/link";

export function Hero() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section className="max-w-7xl mx-auto w-full flex flex-col md:flex-row border-x border-zinc min-h-[80vh] relative overflow-hidden bg-void/40">
            {/* Decorative corners */}
            <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-amber opacity-50 z-10 pointer-events-none" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-amber opacity-50 z-10 pointer-events-none" />

            {/* Left content */}
            <div className="w-full md:w-3/5 p-8 md:p-16 flex flex-col justify-center border-b md:border-b-0 md:border-r border-zinc z-10">
                {/* Terminal status */}
                <div className="mb-8 font-mono text-sm text-amber space-y-1">
                    <p className="crt-flicker">{`> INITIATING LOCAL VAD PROTOCOL...`}</p>
                    <p>{`> BYOK DETECTED. ALL SYSTEMS FREE.`}</p>
                </div>

                {/* Main headline */}
                <h1 className="font-display text-6xl md:text-8xl leading-none mb-6">
                    YOUR
                    <br />
                    <span className="text-amber">VOICE</span>
                    <br />
                    EVERYWHERE.
                </h1>

                {/* Subheadline */}
                <p className="text-lg md:text-xl text-muted mb-12 max-w-lg normal-case tracking-wide">
                    Lightning-fast voice dictation for Windows. Local VAD. Powered by Groq. Zero subscriptions.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <Link
                        href="/download/"
                        className="group relative inline-flex items-center gap-3 bg-amber text-void px-8 py-4 font-bold text-lg uppercase tracking-wider border-2 border-amber hover:bg-bone hover:border-bone transition-all duration-150"
                    >
                        <span className="absolute top-1 left-1 right-[-8px] bottom-[-8px] border border-amber -z-10 group-hover:top-0 group-hover:left-0 group-hover:right-0 group-hover:bottom-0 transition-all duration-150" />
                        <Terminal className="w-6 h-6" />
                        EXECUTE DOWNLOAD
                    </Link>

                    <div className="text-xs text-muted flex flex-col group mt-4 sm:mt-0">
                        <span>[WARN] REQUIRES WINDOWS 10/11</span>
                        <span className="group-hover:text-amber transition-colors">[INFO] REQUIRES GROQ API KEY</span>
                    </div>
                </div>

            </div>

            {/* Right visual - Terminal block with waveform */}
            <div className="w-full md:w-2/5 p-8 md:p-16 flex items-center justify-center relative bg-zinc/20 z-10 hidden md:flex">
                <div className="w-full aspect-square border border-zinc bg-void p-6 flex flex-col shadow-[12px_12px_0_0_#1F1F1F]">
                    {/* Terminal header */}
                    <div className="flex justify-between items-center border-b border-zinc pb-4 mb-4 text-sm text-amber">
                        <span>// KOE_TERMINAL_UI \\</span>
                        <span className="w-3 h-3 bg-red-500 rounded-none animate-pulse" />
                    </div>

                    {/* Animated waveform */}
                    <div className="flex-grow flex items-end gap-2 pb-8 px-2">
                        {mounted && (
                            <>
                                <WaveformBar delay="0s" height="25%" color="bone" />
                                <WaveformBar delay="0.1s" height="100%" color="amber" />
                                <WaveformBar delay="0.2s" height="75%" color="bone" />
                                <WaveformBar delay="0.3s" height="50%" color="crimson" />
                                <WaveformBar delay="0.4s" height="33%" color="bone" />
                            </>
                        )}
                    </div>

                    {/* Status text */}
                    <div className="text-xs text-muted font-mono normal-case">
                        TRANSCRIBING AT 216X REALTIME...
                    </div>
                </div>
            </div>
        </section>
    );
}

function WaveformBar({ delay, height, color = "bone" }: { delay: string; height: string; color?: "bone" | "amber" | "crimson" }) {
    const colorClasses = {
        bone: "bg-bone",
        amber: "bg-amber",
        crimson: "bg-crimson",
    };

    return (
        <div
            className={`w-1/5 ${colorClasses[color]} transition-all duration-150 animate-waveform`}
            style={{
                height,
                animationDelay: delay,
            }}
        />
    );
}
