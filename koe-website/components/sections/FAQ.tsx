import { Plus, Minus } from "lucide-react";

export function FAQ() {
    return (
        <section id="faq" className="max-w-7xl mx-auto w-full border-x border-raw-b border-zinc bg-void">
            <div className="w-full p-8 border-raw-b">
                <h2 className="font-deco text-4xl text-bone">SYS.FAQ</h2>
            </div>
            <div className="w-full flex flex-col">
                <details className="w-full border-raw-b group cursor-pointer bg-void hover:bg-zinc transition-colors" open>
                    <summary className="p-6 font-bold text-lg md:text-xl flex justify-between items-center outline-none">
                        <span>[Q 01] IS KOE REALLY FREE?</span>
                        <Plus className="w-6 h-6 text-amber group-open:hidden" />
                        <Minus className="w-6 h-6 text-amber hidden group-open:block" />
                    </summary>
                    <div className="p-6 pt-0 text-muted normal-case text-lg border-t border-dashed border-zinc mt-2">
                        <span className="text-amber uppercase font-mono mr-2">{`> RESPONSE:`}</span>
                        Yes, completely free and open source. No hidden costs or subscriptions to be found in the core
                        logic.
                    </div>
                </details>
                <details className="w-full border-raw-b group cursor-pointer bg-void hover:bg-zinc transition-colors">
                    <summary className="p-6 font-bold text-lg md:text-xl flex justify-between items-center outline-none">
                        <span>[Q 02] DO I NEED AN API KEY?</span>
                        <Plus className="w-6 h-6 text-amber group-open:hidden" />
                        <Minus className="w-6 h-6 text-amber hidden group-open:block" />
                    </summary>
                    <div className="p-6 pt-0 text-muted normal-case text-lg border-t border-dashed border-zinc mt-2">
                        <span className="text-amber uppercase font-mono mr-2">{`> RESPONSE:`}</span>
                        Yes. Koe operates on a BYOK (Bring Your Own Key) model. Acquire a free hardware-accelerated key
                        from Groq to activate full capabilities.
                    </div>
                </details>
                <details className="w-full group cursor-pointer bg-void hover:bg-zinc transition-colors">
                    <summary className="p-6 font-bold text-lg md:text-xl flex justify-between items-center outline-none">
                        <span>[Q 03] IS MY AUDIO MINED FOR DATA?</span>
                        <Plus className="w-6 h-6 text-amber group-open:hidden" />
                        <Minus className="w-6 h-6 text-amber hidden group-open:block" />
                    </summary>
                    <div className="p-6 pt-0 text-muted normal-case text-lg border-t border-dashed border-zinc mt-2">
                        <span className="text-amber uppercase font-mono mr-2">{`> RESPONSE:`}</span>
                        Negative. VAD is processed 100% locally. Audio transmission only occurs explicitly on hotkey
                        trigger directly to the AI provider. No telemetry.
                    </div>
                </details>
            </div>
        </section>
    );
}
