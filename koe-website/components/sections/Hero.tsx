"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal } from "lucide-react";

export function Hero() {
    const [levels, setLevels] = useState([22, 78, 56, 42, 28]);

    useEffect(() => {
        const ranges = [
            { min: 12, max: 42 },
            { min: 45, max: 100 },
            { min: 30, max: 82 },
            { min: 20, max: 68 },
            { min: 10, max: 50 },
        ];

        const interval = setInterval(() => {
            setLevels((prev) =>
                prev.map((value, index) => {
                    const { min, max } = ranges[index];
                    const target = min + Math.random() * (max - min);
                    const eased = value + (target - value) * 0.6;
                    return Math.max(min, Math.min(max, Math.round(eased)));
                })
            );
        }, 140);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="max-w-7xl mx-auto w-full flex flex-col md:flex-row border-x border-zinc min-h-[80vh] relative overflow-hidden bg-void/40">
            {/* Deco structural lines */}
            <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-amber opacity-50"></div>
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-amber opacity-50"></div>

            <div className="w-full md:w-3/5 p-6 sm:p-8 md:p-16 flex flex-col justify-center border-raw-b md:border-b-0 md:border-raw-r z-10">
                <div className="mb-6 md:mb-8 font-mono text-xs sm:text-sm text-amber space-y-1">
                    <p>{`> INITIATING LOCAL VAD PROTOCOL...`}</p>
                    <p>{`> BYOK DETECTED. ALL SYSTEMS FREE.`}</p>
                </div>

                <h1 className="font-deco text-5xl sm:text-6xl md:text-8xl leading-[0.9] mb-5 md:mb-6 break-words">
                    YOUR
                    <br />
                    <span className="text-amber">VOICE</span>
                    <br />
                    EVERYWHERE.
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-muted mb-8 md:mb-12 max-w-lg normal-case font-mono tracking-wide leading-relaxed">
                    Lightning-fast voice dictation for desktop. Local VAD. Powered by Groq. Zero subscriptions.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center w-full">
                    <Link href="/download/" className="btn-brutal w-full sm:w-auto justify-center sm:justify-start">
                        <Terminal className="w-6 h-6" />
                        EXECUTE DOWNLOAD
                    </Link>
                    <div className="text-xs text-muted flex flex-col group">
                        <span>[INFO] ADAPTS TO YOUR DEVICE</span>
                        <span className="group-hover:text-amber transition-colors">[INFO] REQUIRES GROQ API KEY</span>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-2/5 p-8 md:p-16 flex items-center justify-center relative bg-zinc/20 z-10 hidden md:flex">
                {/* Terminal block visual representation of voice UI */}
                <div className="w-full aspect-square border-raw bg-void p-6 flex flex-col shadow-[12px_12px_0_0_#1F1F1F]">
                    <div className="flex justify-between items-center border-raw-b pb-4 mb-4 text-sm text-amber">
                        <span>{`// KOE_TERMINAL_UI \\\\`}</span>
                        <span className="w-3 h-3 bg-red-500 rounded-none animate-pulse"></span>
                    </div>
                    {/* Audio Equalizer Brutal style */}
                    <div className="flex-grow flex items-end gap-2 pb-8">
                        <div
                            className="w-1/5 bg-bone voice-bar voice-bar-1"
                            style={{ height: `${levels[0]}%` }}
                        ></div>
                        <div
                            className="w-1/5 bg-amber voice-bar voice-bar-2"
                            style={{ height: `${levels[1]}%` }}
                        ></div>
                        <div
                            className="w-1/5 bg-bone voice-bar voice-bar-3"
                            style={{ height: `${levels[2]}%` }}
                        ></div>
                        <div
                            className="w-1/5 bg-crimson voice-bar voice-bar-4"
                            style={{ height: `${levels[3]}%` }}
                        ></div>
                        <div
                            className="w-1/5 bg-bone voice-bar voice-bar-5"
                            style={{ height: `${levels[4]}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-muted font-mono normal-case">
                        TRANSCRIBING AT 216X REALTIME...
                    </div>
                </div>
            </div>
        </section>
    );
}
