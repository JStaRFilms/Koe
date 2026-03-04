import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Placeholder */}
        <section className="relative flex min-h-[90vh] items-center justify-center border-b border-zinc">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-6 text-bone">
              YOUR VOICE
            </h1>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-amber">
              ANYWHERE
            </h2>
            <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto mb-12">
              Lightning-fast voice dictation for Windows. Free forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-amber text-void font-bold text-lg uppercase tracking-wider hover:bg-bone transition-colors border-2 border-amber">
                Download for Windows
              </button>
              <button className="px-8 py-4 bg-transparent text-bone font-bold text-lg uppercase tracking-wider hover:text-amber transition-colors border-2 border-zinc hover:border-amber">
                View on GitHub
              </button>
            </div>
          </div>
        </section>

        {/* Features Placeholder */}
        <section className="py-24 border-b border-zinc">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-bone">
              FEATURES
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Lightning Fast", desc: "216x real-time transcription. It's basically instant." },
                { title: "Privacy First", desc: "Local VAD processing. Your voice never leaves your machine until you choose to send it." },
                { title: "Completely Free", desc: "No subscriptions. No limits. Just your voice, transcribed." },
              ].map((feature) => (
                <div key={feature.title} className="p-8 border border-zinc hover:border-amber transition-colors">
                  <h3 className="text-2xl font-bold mb-4 text-amber">{feature.title}</h3>
                  <p className="text-muted">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Placeholder */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-bone">
              READY TO START?
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto mb-12">
              Join thousands of users who have already discovered the power of voice dictation.
            </p>
            <button className="px-8 py-4 bg-amber text-void font-bold text-lg uppercase tracking-wider hover:bg-bone transition-colors border-2 border-amber">
              Download Now
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
