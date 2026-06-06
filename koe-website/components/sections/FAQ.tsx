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
                        <span>[Q 01] IS KOE FREE?</span>
                        <Plus className="w-6 h-6 text-amber group-open:hidden" />
                        <Minus className="w-6 h-6 text-amber hidden group-open:block" />
                    </summary>
                    <div className="p-6 pt-0 text-muted normal-case text-lg border-t border-dashed border-zinc mt-2">
                        <span className="text-amber uppercase font-mono mr-2">{`> RESPONSE:`}</span>
                        Koe is free when you bring your own provider key. If you do not want to manage an API key, managed cloud processing will have a free starter allowance and paid plans.
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
                        Not if you use managed mode. BYOK is still available for people who want control and free Koe usage. Managed mode is for normal users who want to sign in and start talking.
                    </div>
                </details>
                <details className="w-full group cursor-pointer bg-void hover:bg-zinc transition-colors">
                    <summary className="p-6 font-bold text-lg md:text-xl flex justify-between items-center outline-none">
                        <span>[Q 03] WHAT DOES KOE STORE?</span>
                        <Plus className="w-6 h-6 text-amber group-open:hidden" />
                        <Minus className="w-6 h-6 text-amber hidden group-open:block" />
                    </summary>
                    <div className="p-6 pt-0 text-muted normal-case text-lg border-t border-dashed border-zinc mt-2">
                        <span className="text-amber uppercase font-mono mr-2">{`> RESPONSE:`}</span>
                        Audio is sent only to process your request and is not stored by Koe. If you are signed out and using a local key, transcript history stays on your device. If you are signed in, transcript text and usage metadata are stored with your account for history, usage tracking, and future cross-device sync.
                    </div>
                </details>
            </div>
        </section>
    );
}
