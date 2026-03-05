"use client";

import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

export function Hero() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section className="max-w-7xl mx-auto w-full flex flex-col md:flex-row border-x border-zinc min-h-[80vh] relative overflow-hidden bg-void/40">
            {/* Deco structural lines */}
            <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-amber opacity-50"></div>
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-amber opacity-50"></div>

            <div className="w-full md:w-3/5 p-8 md:p-16 flex flex-col justify-center border-raw-b md:border-b-0 md:border-raw-r z-10">
                <div className="mb-8 font-mono text-sm text-amber space-y-1">
                    <p>{`> INITIATING LOCAL VAD PROTOCOL...`}</p>
                    <p>{`> BYOK DETECTED. ALL SYSTEMS FREE.`}</p>
                </div>

                <h1 className="font-deco text-6xl md:text-8xl leading-none mb-6">
                    YOUR
                    <br />
                    <span className="text-amber">VOICE</span>
                    <br />
                    EVERYWHERE.
                </h1>

                <p className="text-lg md:text-xl text-muted mb-12 max-w-lg normal-case font-mono tracking-wide">
                    Lightning-fast voice dictation for Windows. Local VAD. Powered by Groq. Zero subscriptions.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <a href="#download" className="btn-brutal">
                        <Terminal className="w-6 h-6" />
                        EXECUTE DOWNLOAD
                    </a>
                    <div className="text-xs text-muted flex flex-col group">
                        <span>[WARN] REQUIRES WINDOWS 10/11</span>
                        <span className="group-hover:text-amber transition-colors">[INFO] REQUIRES GROQ API KEY</span>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-2/5 p-8 md:p-16 flex items-center justify-center relative bg-zinc/20 z-10 hidden md:flex">
                {/* Terminal block visual representation of voice UI */}
                <div className="w-full aspect-square border-raw bg-void p-6 flex flex-col shadow-[12px_12px_0_0_#1F1F1F]">
                    <div className="flex justify-between items-center border-raw-b pb-4 mb-4 text-sm text-amber">
                        <span>// KOE_TERMINAL_UI \\</span>
                        <span className="w-3 h-3 bg-red-500 rounded-none animate-pulse"></span>
                    </div>
                    {/* Audio Equalizer Brutal style */}
                    {mounted && (
                        <div className="flex-grow flex items-end gap-2 pb-8">
                            <div
                                className="w-1/5 bg-bone animate-[flicker_0.5s_infinite]"
                                style={{ height: "25%" }}
                            ></div>
                            <div
                                className="w-1/5 bg-amber animate-[flicker_0.3s_infinite_alternate]"
                                style={{ height: "100%" }}
                            ></div>
                            <div
                                className="w-1/5 bg-bone animate-[flicker_0.7s_infinite]"
                                style={{ height: "75%" }}
                            ></div>
                            <div
                                className="w-1/5 bg-crimson animate-[flicker_0.4s_infinite_alternate]"
                                style={{ height: "50%" }}
                            ></div>
                            <div
                                className="w-1/5 bg-bone animate-[flicker_0.6s_infinite]"
                                style={{ height: "33%" }}
                            ></div>
                        </div>
                    )}
                    <div className="text-xs text-muted font-mono normal-case">
                        TRANSCRIBING AT 216X REALTIME...
                    </div>
                </div>
            </div>
        </section>
    );
}
