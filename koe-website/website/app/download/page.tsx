import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Download, Github, Monitor } from "lucide-react";

export const metadata = {
    title: "Download | Koe",
    description: "Download Koe for Windows. Free voice dictation app.",
};

export default function DownloadPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />

            <main className="flex-1">
                <section className="py-24">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-bone">
                                DOWNLOAD
                            </h1>
                            <p className="text-xl text-muted max-w-2xl mx-auto">
                                Get Koe for Windows. Free forever.
                            </p>
                        </div>

                        <div className="max-w-2xl mx-auto">
                            {/* Windows Download */}
                            <div className="border border-zinc p-8 mb-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <Monitor className="w-12 h-12 text-amber" />
                                    <div>
                                        <h2 className="text-2xl font-bold text-bone">Windows</h2>
                                        <p className="text-muted">Windows 10/11 (64-bit)</p>
                                    </div>
                                </div>

                                <a
                                    href="https://github.com/GIGAHAT1994/whisper_alt/releases/latest"
                                    className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-amber text-void font-bold text-lg uppercase tracking-wider hover:bg-bone transition-colors border-2 border-amber mb-4"
                                >
                                    <Download className="w-5 h-5" />
                                    Download for Windows
                                </a>

                                <p className="text-center text-muted text-sm">
                                    Latest version available on GitHub
                                </p>
                            </div>

                            {/* GitHub Link */}
                            <div className="border border-zinc p-8 text-center">
                                <h3 className="text-xl font-bold mb-4 text-bone">Open Source</h3>
                                <p className="text-muted mb-6">
                                    Koe is open source. View the code, report issues, or contribute on GitHub.
                                </p>
                                <a
                                    href="https://github.com/GIGAHAT1994/whisper_alt"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-zinc text-bone hover:border-amber hover:text-amber transition-colors uppercase tracking-wider"
                                >
                                    <Github className="w-5 h-5" />
                                    View on GitHub
                                </a>
                            </div>
                        </div>

                        {/* System Requirements */}
                        <div className="max-w-2xl mx-auto mt-16">
                            <h3 className="text-xl font-bold mb-6 text-bone uppercase">System Requirements</h3>
                            <ul className="space-y-2 text-muted">
                                <li>• Windows 10 or Windows 11 (64-bit)</li>
                                <li>• Microphone for voice input</li>
                                <li>• Groq API key (free at groq.com)</li>
                                <li>• Internet connection for transcription</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
