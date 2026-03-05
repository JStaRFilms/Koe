import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
    title: "Privacy Policy | Koe",
    description: "Koe's privacy policy - we don't collect any of your data.",
};

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />

            <main className="flex-1">
                <section className="py-24">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-bone">
                            PRIVACY POLICY
                        </h1>
                        <p className="text-muted mb-12">
                            Last updated: March 4, 2026
                        </p>

                        <article className="prose prose-invert max-w-none">
                            <section className="mb-12">
                                <h2 className="text-2xl font-bold mb-4 text-amber">Overview</h2>
                                <p className="text-bone leading-relaxed">
                                    At Koe, we take your privacy seriously. This privacy policy explains how we handle
                                    your data when you use our voice dictation application.
                                </p>
                            </section>

                            <section className="mb-12">
                                <h2 className="text-2xl font-bold mb-4 text-amber">What We Collect</h2>
                                <p className="text-bone leading-relaxed">
                                    <strong>We don't collect anything.</strong> Koe is designed to be completely
                                    local and privacy-first. Your voice data, transcripts, and settings never leave
                                    your machine except when you explicitly choose to send audio to Groq for
                                    transcription.
                                </p>
                            </section>

                            <section className="mb-12">
                                <h2 className="text-2xl font-bold mb-4 text-amber">API Key Storage</h2>
                                <p className="text-bone leading-relaxed">
                                    Your Groq API key is stored locally on your machine only. We never have access
                                    to it, and it is never transmitted to our servers (we don't have any servers).
                                </p>
                            </section>

                            <section className="mb-12">
                                <h2 className="text-2xl font-bold mb-4 text-amber">Audio Processing</h2>
                                <p className="text-bone leading-relaxed">
                                    Voice Activity Detection (VAD) happens entirely on your local machine using
                                    Silero VAD. Audio is only sent to Groq's API when you explicitly trigger
                                    dictation, and only for the purpose of transcription.
                                </p>
                            </section>

                            <section className="mb-12">
                                <h2 className="text-2xl font-bold mb-4 text-amber">Open Source</h2>
                                <p className="text-bone leading-relaxed">
                                    Koe is open source software. You can inspect the code yourself to verify our
                                    privacy claims:
                                </p>
                                <p className="mt-4">
                                    <a
                                        href="https://github.com/GIGAHAT1994/whisper_alt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-amber hover:underline"
                                    >
                                        github.com/GIGAHAT1994/whisper_alt
                                    </a>
                                </p>
                            </section>

                            <section className="mb-12">
                                <h2 className="text-2xl font-bold mb-4 text-amber">Contact</h2>
                                <p className="text-bone leading-relaxed">
                                    If you have any questions about this privacy policy, please open an issue on
                                    our GitHub repository.
                                </p>
                            </section>
                        </article>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
