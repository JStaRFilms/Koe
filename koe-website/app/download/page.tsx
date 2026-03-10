import { StatusBar } from "@/components/StatusBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { DownloadButton } from "@/components/DownloadButton";
import { Github, Monitor, Cpu, Wifi, Mic, ExternalLink, KeyRound, Settings, Keyboard, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Download",
    description: "Download Koe for your desktop. Free voice dictation app with AI-powered transcription.",
    alternates: {
        canonical: "/download/",
    },
};

export default function DownloadPage() {
    const requirements = [
        {
            icon: Monitor,
            title: "Windows 10/11",
            description: "64-bit system required.",
        },
        {
            icon: Mic,
            title: "Working Microphone",
            description: "Any input device for voice capture.",
        },
        {
            icon: Cpu,
            title: "GROQ API Key",
            description: "Free key from Groq console.",
        },
        {
            icon: Wifi,
            title: "Internet Connection",
            description: "Needed for transcription requests.",
        },
    ];

    const firstRunSteps = [
        {
            step: "01",
            title: "INSTALL THE EXE",
            description: "Download the Windows installer and complete setup in under 1 minute.",
            icon: Monitor,
        },
        {
            step: "02",
            title: "OPEN KOE FROM SYSTEM TRAY",
            description: "After launch, Koe runs in the tray area near your clock.",
            icon: CheckCircle2,
        },
        {
            step: "03",
            title: "RIGHT-CLICK -> SETTINGS",
            description: "Open Settings from the tray menu to configure your API key.",
            icon: Settings,
        },
        {
            step: "04",
            title: "PASTE YOUR GROQ API KEY",
            description: "Save your key once, then Koe is ready for transcription.",
            icon: KeyRound,
        },
        {
            step: "05",
            title: "PRESS CTRL+SHIFT+SPACE",
            description: "Start dictating anywhere and Koe will insert transcribed text.",
            icon: Keyboard,
        },
    ];

    const groqKeySteps = [
        {
            step: "01",
            title: "CREATE OR LOG IN TO GROQ",
            description: "Sign in to your Groq account to access developer settings.",
        },
        {
            step: "02",
            title: "OPEN API KEYS",
            description: "Go to the API keys page in the Groq console.",
        },
        {
            step: "03",
            title: "GENERATE A NEW KEY",
            description: "Create a key and copy it immediately.",
        },
        {
            step: "04",
            title: "PASTE KEY INTO KOE SETTINGS",
            description: "Return to Koe -> Settings and save the key.",
        },
    ];

    return (
        <>
            <div id="top" />
            <StatusBar />
            <Header />

            <main className="flex-grow flex flex-col relative w-full">
                <div className="giant-kanji select-none pointer-events-none" aria-hidden="true">
                    声
                </div>
                <section className="max-w-7xl mx-auto w-full border-x border-raw py-16 md:py-24 px-4 md:px-8 relative z-10">
                    <div className="text-center mb-14 relative z-10">
                        <h1 className="font-deco text-4xl md:text-6xl mb-6 text-bone crt-flicker relative z-10">
                            EXECUTE DOWNLOAD
                        </h1>
                        <p className="text-xl text-muted max-w-2xl mx-auto normal-case">
                            Get Koe for your desktop. Free forever. No subscriptions.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        <div className="border-raw p-8 md:p-12 mb-8 bg-zinc/5 relative overflow-hidden">
                            <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
                            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                <div className="flex items-center justify-center w-24 h-24 border-raw bg-void relative z-10">
                                    <Monitor className="w-12 h-12 text-amber" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="font-deco text-2xl md:text-3xl text-bone mb-2">LATEST DOWNLOAD</h2>
                                    <p className="text-muted mb-4">Grab the latest build.</p>
                                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                                        <DownloadButton className="w-full sm:w-auto" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-raw p-5 md:p-6 mb-10 bg-zinc/10 relative overflow-hidden">
                            <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
                            <div className="grid md:grid-cols-3 gap-4 relative z-10">
                                <div className="border-raw p-4 bg-void glitch-hover group transition-colors">
                                    <p className="text-amber font-bold text-xs mb-2 group-hover:text-void">START HERE</p>
                                    <p className="text-bone normal-case text-sm group-hover:text-void/80">Install the suggested app package, open Koe settings, paste your key.</p>
                                </div>
                                <div className="border-raw p-4 bg-void glitch-hover group transition-colors">
                                    <p className="text-amber font-bold text-xs mb-2 group-hover:text-void">FIRST USE</p>
                                    <p className="text-bone normal-case text-sm group-hover:text-void/80">Everything is ready in about 2 minutes.</p>
                                </div>
                                <a
                                    href="https://github.com/JStaRFilms/Koe"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border-raw p-4 bg-void glitch-hover group transition-colors block"
                                >
                                    <p className="text-amber font-bold text-xs mb-2 group-hover:text-void flex items-center gap-2">
                                        SUPPORT + CODE <ExternalLink className="w-3 h-3 group-hover:text-void" />
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-bone text-sm group-hover:text-void">
                                        <Github className="w-4 h-4" />
                                    </div>
                                </a>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-10">
                            <div className="border-raw bg-zinc/5 p-6 md:p-8 relative overflow-hidden">
                                <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
                                <h3 className="font-deco text-2xl mb-6 text-bone uppercase tracking-wider relative z-10 crt-flicker">System Requirements</h3>
                                <ul className="space-y-4 relative z-10">
                                    {requirements.map((item) => (
                                        <li key={item.title} className="flex items-start gap-4 border-raw-b pb-4 last:border-b-0 last:pb-0 bg-void p-2">
                                            <item.icon className="w-5 h-5 text-amber mt-0.5" />
                                            <div>
                                                <p className="text-bone text-sm">{item.title}</p>
                                                <p className="text-muted normal-case text-sm">{item.description}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border-raw bg-zinc/5 p-6 md:p-8 relative overflow-hidden">
                                <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
                                <h3 className="font-deco text-2xl mb-6 text-bone uppercase tracking-wider relative z-10 crt-flicker">Quick Install</h3>
                                <ol className="space-y-4 relative z-10">
                                    {firstRunSteps.map((item) => (
                                        <li key={item.step} className="flex gap-4 border-raw bg-void p-4 glitch-hover group transition-colors">
                                            <div className="flex flex-col items-center min-w-12">
                                                <span className="text-amber font-bold text-sm group-hover:text-void">[{item.step}]</span>
                                                <item.icon className="w-4 h-4 text-amber mt-2" />
                                            </div>
                                            <div className="pt-0.5">
                                                <p className="text-bone text-sm group-hover:text-void">{item.title}</p>
                                                <p className="text-muted normal-case text-sm group-hover:text-void/80">{item.description}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        <div className="mt-16 border-raw bg-zinc/5 p-8 md:p-10 relative overflow-hidden">
                            <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
                            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 relative z-10">
                                <div>
                                    <h3 className="font-deco text-3xl text-bone mb-3 uppercase tracking-wider crt-flicker">Get Your GROQ API Key</h3>
                                    <p className="text-muted normal-case max-w-2xl mb-7">
                                        This is required once. After saving your key in Koe Settings, you do not need to repeat this.
                                    </p>

                                    <ol className="grid sm:grid-cols-2 gap-4">
                                        {groqKeySteps.map((item) => (
                                            <li key={item.step} className="border-raw p-5 bg-void glitch-hover group transition-colors">
                                                <p className="text-amber font-bold mb-2 group-hover:text-void">[{item.step}]</p>
                                                <p className="text-bone text-sm mb-2 group-hover:text-void">{item.title}</p>
                                                <p className="text-muted normal-case text-sm group-hover:text-void/80">{item.description}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                <aside className="border-raw bg-void p-6 h-fit relative">
                                    <div className="absolute top-0 right-0 p-2 opacity-50"><KeyRound className="w-16 h-16 text-amber" /></div>
                                    <p className="text-amber font-bold text-xs mb-3 relative z-10">ACTION REQUIRED</p>
                                    <p className="text-bone text-sm mb-3 relative z-10">Open Groq, generate a key, then paste it in:</p>
                                    <p className="text-muted normal-case text-sm mb-6 relative z-10">
                                        Tray Icon {"->"} Right-click {"->"} Settings {"->"} API Key
                                    </p>
                                    <a
                                        href="https://console.groq.com/keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-brutal text-sm relative z-10 inline-flex items-center"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                        Open GROQ Keys
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </aside>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}


