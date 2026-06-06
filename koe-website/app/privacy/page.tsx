import type { Metadata } from "next";
import { StatusBar } from "@/components/StatusBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
    title: "Privacy Policy",
    description: "How Koe handles audio, transcripts, account data, BYOK credentials, and managed processing.",
    path: "/privacy/",
});

const sections = [
    {
        number: "01",
        title: "Short version",
        body: [
            "Koe has two paths: local BYOK when you are signed out, and account processing when you are signed in. Signed-out local BYOK keeps transcript history on your device. Signed-in processing stores transcript text and usage metadata with your account so Koe can support account history, quota tracking, and future cross-device sync.",
            "Koe does not store your audio files. Audio is sent only to process a transcription request.",
        ],
    },
    {
        number: "02",
        title: "When you are signed out",
        body: [
            "If you use Koe without signing in, you can save a provider API key locally on your device. In that mode, transcript history is stored locally by the app, not in Koe's account database.",
            "Your audio is sent to the configured provider only when you record and submit audio for transcription. Koe does not receive signed-out local BYOK transcript history through an account backend.",
        ],
    },
    {
        number: "03",
        title: "When you are signed in",
        body: [
            "If you sign in and use managed mode or account BYOK, your request goes through Koe's account backend. Koe stores transcript text, refined transcript text, usage metadata, account settings, device metadata, and billing/quota information tied to your account.",
            "We store this so your account can work across desktop and mobile, so usage can be counted fairly, and so future account history and cross-device sync can work without guessing.",
        ],
    },
    {
        number: "04",
        title: "Audio handling",
        body: [
            "Koe processes audio to produce a transcript. Koe does not intentionally store audio files after the request completes.",
            "Voice activity detection can run locally in the app before upload. When cloud transcription is needed, the recorded audio is sent to the processing provider for that request.",
        ],
    },
    {
        number: "05",
        title: "API keys and BYOK",
        body: [
            "If you save a local device key while signed out, it stays on that device. If you save an account BYOK key while signed in, Koe stores it encrypted on the server so the same account can use BYOK across supported devices.",
            "Managed mode uses Koe's server-owned provider key. That managed key is never sent to desktop or mobile clients.",
        ],
    },
    {
        number: "06",
        title: "What we use account data for",
        body: [
            "We use account data to authenticate you, keep your settings in sync, resolve BYOK or managed mode, track usage and quotas, prevent abuse, support retries, and prepare account history/cross-device history features.",
            "We do not sell transcript content. We do not need transcript text for advertising. The point of storing signed-in transcript text is product functionality: history, sync, support, and usage accounting.",
        ],
    },
    {
        number: "07",
        title: "Providers",
        body: [
            "Koe uses external AI providers for transcription and refinement. Provider handling may depend on whether you use your own key or managed mode. Review your provider's privacy terms if you use BYOK.",
            "For managed processing, Koe chooses the provider configuration and keeps the provider key server-side.",
        ],
    },
];

export default function PrivacyPage() {
    return (
        <>
            <div id="top" />
            <StatusBar />
            <Header />

            <main className="flex-grow flex flex-col">
                <header className="w-full mt-12 mb-8 bg-void/80 backdrop-blur z-40">
                    <div className="max-w-4xl mx-auto flex flex-col border-x border-t border-zinc p-8 md:p-16">
                        <h1 className="font-display text-6xl md:text-8xl text-bone leading-none mb-4">
                            PRIVACY<br /><span className="text-amber">POLICY</span>
                        </h1>
                        <p className="font-mono text-muted border-t border-dashed border-muted pt-4 normal-case">
                            Plain version: signed-out local BYOK stays local. Signed-in account processing stores transcript text and usage data for history, quotas, and future sync. Audio is not stored by Koe.
                        </p>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto w-full border-x border-zinc bg-void shadow-2xl">
                    <article className="p-8 md:p-16 flex flex-col gap-14">
                        {sections.map((section) => (
                            <section key={section.number} className="border-l-4 border-zinc pl-8 relative hover:border-amber transition-colors group">
                                <span className="absolute -left-12 top-0 font-display text-4xl text-zinc group-hover:text-amber transition-colors">{section.number}</span>
                                <h2 className="font-display text-3xl mb-4 text-bone group-hover:text-amber transition-colors uppercase">{section.title}</h2>
                                <div className="text-muted normal-case text-lg leading-relaxed space-y-4">
                                    {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                                </div>
                            </section>
                        ))}

                        <div className="mt-8 p-8 border border-zinc bg-zinc/10 flex flex-col gap-4">
                            <h3 className="font-display text-3xl text-bone uppercase">Questions or deletion requests?</h3>
                            <p className="text-muted normal-case leading-relaxed">
                                We are still building account controls. If you need help with account data before self-serve controls are available, contact us through the GitHub issue tracker.
                            </p>
                            <a href="https://github.com/JStaRFilms/Koe/issues" target="_blank" rel="noopener noreferrer" className="inline-flex self-start bg-amber text-void px-6 py-3 font-bold border-2 border-amber hover:bg-bone hover:border-bone transition-colors">
                                Open GitHub issue
                            </a>
                        </div>
                    </article>
                </div>
            </main>

            <Footer />
        </>
    );
}
