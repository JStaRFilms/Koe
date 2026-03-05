import { StatusBar } from "@/components/StatusBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";

export const metadata = {
    title: "Privacy Policy | Koe",
    description: "Koe's privacy policy - we don't collect any of your data.",
};

export default function PrivacyPage() {
    return (
        <>
            <div id="top" />
            <StatusBar />
            <Header />

            <main className="flex-grow flex flex-col">
                {/* Decostyle Header */}
                <header className="w-full mt-12 mb-8 bg-void/80 backdrop-blur z-40">
                    <div className="max-w-4xl mx-auto flex flex-col border-x border-t border-zinc p-8 md:p-16">
                        <h1 className="font-display text-6xl md:text-8xl text-bone leading-none mb-4">PRIVACY<br /><span
                            className="text-amber">DIRECTIVE</span></h1>
                        <p className="font-mono text-muted border-t border-dashed border-muted pt-4">
                            &gt; EXECUTING READ: LOCAL_DATA_PROTOCOL<br />
                            &gt; STATUS: CLEAR. NO TELEMETRY FOUND.
                        </p>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto w-full border-x border-zinc bg-void shadow-2xl">
                    <article className="p-8 md:p-16 flex flex-col gap-16">

                        {/* Sec 1 */}
                        <section className="border-l-4 border-amber pl-8 relative">
                            <span className="absolute -left-12 top-0 font-display text-4xl text-zinc">01</span>
                            <h2 className="font-display text-3xl mb-4 text-bone uppercase">NO DATA COLLECTION.</h2>
                            <div className="text-muted normal-case text-lg leading-relaxed space-y-4">
                                <p>Koe operates completely locally. Voice Activity Detection (VAD) happens exclusively within your
                                    machine boundaries. We do not track you, we do not log your activity, and we actively maintain
                                    zero central databases containing your transcriptions.</p>
                            </div>
                        </section>

                        {/* Sec 2 */}
                        <section className="border-l-4 border-zinc pl-8 relative hover:border-amber transition-colors group">
                            <span
                                className="absolute -left-12 top-0 font-display text-4xl text-zinc group-hover:text-amber transition-colors">02</span>
                            <h2 className="font-display text-3xl mb-4 text-bone group-hover:text-amber transition-colors uppercase">CREDENTIAL
                                STORAGE.</h2>
                            <div className="text-muted normal-case text-lg leading-relaxed space-y-4">
                                <p>Your Groq API key is stored locally on your machine in an encrypted state, utilizing standard OS
                                    credential managers. It is fetched into memory strictly to authenticate immediate transcription
                                    requests to Groq servers.</p>
                            </div>
                        </section>

                        {/* Sec 3 */}
                        <section className="border-l-4 border-zinc pl-8 relative hover:border-amber transition-colors group">
                            <span
                                className="absolute -left-12 top-0 font-display text-4xl text-zinc group-hover:text-amber transition-colors">03</span>
                            <h2 className="font-display text-3xl mb-4 text-bone group-hover:text-amber transition-colors uppercase">AUDIO
                                TRANSMISSION.</h2>
                            <div className="text-muted normal-case text-lg leading-relaxed space-y-4">
                                <p>Audio is only ever transmitted to Groq when the dedicated global hotkey is engaged. For details
                                    regarding payload processing, <a href="https://groq.com/privacy-policy"
                                        className="text-bone uppercase border-b border-amber hover:bg-amber hover:text-void transition-all mix-blend-difference z-10 font-bold"
                                        target="_blank" rel="noopener noreferrer">[ACCESS GROQ PROTOCOL]</a>.</p>
                            </div>
                        </section>

                        {/* Sec 4 */}
                        <section className="border-l-4 border-zinc pl-8 relative hover:border-amber transition-colors group">
                            <span
                                className="absolute -left-12 top-0 font-display text-4xl text-zinc group-hover:text-amber transition-colors">04</span>
                            <h2 className="font-display text-3xl mb-4 text-bone group-hover:text-amber transition-colors uppercase">TRANSPARENCY //
                                OPEN SOURCE.</h2>
                            <div className="text-muted normal-case text-lg leading-relaxed space-y-4">
                                <p>Do not simply trust these systems; verify them. Koe&apos;s logic pipeline is constructed entirely in
                                    the open. You can verify every claim by traversing the source code directly.</p>
                            </div>
                        </section>

                        {/* Final CTA */}
                        <div className="mt-8 p-12 border border-zinc bg-zinc/10 text-center flex flex-col items-center">
                            <h3 className="font-display text-3xl text-bone mb-8 uppercase">INITIATE INQUIRY?</h3>
                            <p className="text-muted mb-8 normal-case max-w-md">Deploy all privacy, vulnerability, or logic questions
                                directly to the issue tracker linked below.</p>

                            <a href="https://github.com/JStaRFilms/Koe/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-amber text-void px-8 py-4 font-bold text-lg border-2 border-amber hover:bg-bone hover:border-bone transition-colors relative group">
                                <span className="absolute -inset-2 border border-amber pointer-events-none group-hover:inset-0 transition-all opacity-50"></span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                                CREATE GITHUB ISSUE
                            </a>
                        </div>
                    </article>
                </div>
            </main>

            <Footer />
        </>
    );
}
