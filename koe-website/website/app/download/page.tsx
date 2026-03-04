import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DownloadButton } from "@/components/DownloadButton";
import { Github, Monitor, Cpu, Wifi, Mic } from "lucide-react";

export const metadata = {
    title: "Download | Koe",
    description: "Download Koe for Windows. Free voice dictation app with AI-powered transcription.",
};

export default function DownloadPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />

            <main className="flex-1">
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        {/* Header */}
                        <div className="text-center mb-16">
                            <h1 className="font-display text-4xl md:text-6xl mb-6 text-bone">
                                EXECUTE DOWNLOAD
                            </h1>
                            <p className="text-xl text-muted max-w-2xl mx-auto normal-case">
                                Get Koe for Windows. Free forever. No subscriptions.
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto">
                            {/* Windows Download Card */}
                            <div className="border border-zinc p-8 md:p-12 mb-8 bg-zinc/5">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex items-center justify-center w-24 h-24 border border-zinc bg-void">
                                        <Monitor className="w-12 h-12 text-amber" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h2 className="font-display text-2xl md:text-3xl text-bone mb-2">WINDOWS</h2>
                                        <p className="text-muted mb-4">Windows 10/11 (64-bit)</p>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            <DownloadButton className="w-full sm:w-auto" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* GitHub Link Card */}
                            <div className="border border-zinc p-8 text-center">
                                <h3 className="font-display text-xl mb-4 text-bone">OPEN SOURCE</h3>
                                <p className="text-muted mb-6 max-w-md mx-auto normal-case">
                                    Koe is open source. View the code, report issues, or contribute on GitHub.
                                </p>
                                <a
                                    href="https://github.com/GIGAHAT1994/whisper_alt"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative inline-flex items-center gap-2 px-6 py-3 border border-zinc text-bone hover:border-amber hover:text-amber transition-colors uppercase tracking-wider"
                                >
                                    <Github className="w-5 h-5" />
                                    View on GitHub
                                </a>
                            </div>

                            {/* System Requirements */}
                            <div className="mt-16 grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-display text-xl mb-6 text-bone uppercase tracking-wider">System Requirements</h3>
                                    <ul className="space-y-4 text-muted">
                                        <li className="flex items-center gap-3">
                                            <Monitor className="w-5 h-5 text-amber" />
                                            Windows 10 or Windows 11 (64-bit)
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <Mic className="w-5 h-5 text-amber" />
                                            Microphone for voice input
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <Cpu className="w-5 h-5 text-amber" />
                                            Groq API key (free at groq.com)
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <Wifi className="w-5 h-5 text-amber" />
                                            Internet connection for transcription
                                        </li>
                                    </ul>
                                </div>

                                {/* Installation Steps */}
                                <div>
                                    <h3 className="font-display text-xl mb-6 text-bone uppercase tracking-wider">Installation</h3>
                                    <ol className="space-y-4 text-muted">
                                        <li className="flex gap-3">
                                            <span className="text-amber font-bold">1.</span>
                                            <span>Download the .exe installer</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-amber font-bold">2.</span>
                                            <span>Run the installer and follow prompts</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-amber font-bold">3.</span>
                                            <span>Launch Koe from the system tray</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-amber font-bold">4.</span>
                                            <span>Add your Groq API key in settings</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-amber font-bold">5.</span>
                                            <span>Press Ctrl+Shift+Space to dictate!</span>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
