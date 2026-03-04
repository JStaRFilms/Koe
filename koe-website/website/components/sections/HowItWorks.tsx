import { Cpu } from "lucide-react";

export function HowItWorks() {
    return (
        <section className="border-b border-zinc">
            <div className="flex flex-col md:flex-row">
                {/* Visual - Hotkey diagram */}
                <div className="w-full md:w-1/2 p-8 md:p-12 border-b md:border-b-0 md:border-r border-zinc relative overflow-hidden bg-zinc/10 min-h-[300px] flex items-center justify-center">
                    {/* Background kanji pattern */}
                    <div className="absolute inset-0 opacity-5 font-serif leading-[0.8] tracking-tighter select-none pointer-events-none overflow-hidden"
                        style={{ fontSize: "15rem" }}
                    >
                        声声声声声声声声声
                    </div>

                    {/* Hotkey box */}
                    <div className="relative z-10 w-full max-w-md aspect-video border-2 border-bone/20 flex flex-col justify-between p-6">
                        <div className="flex gap-2 text-amber text-xs">
                            <Cpu className="w-4 h-4" />
                            <span>[PROCESS: KEY_HOOK]</span>
                        </div>
                        <div className="text-3xl md:text-5xl font-mono opacity-80 text-center">{`> CTRL+SHIFT+SPACE`}</div>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <span className="text-amber font-bold mb-4 text-sm tracking-wider">[GLOBAL HOTKEY]</span>
                    <h2 className="font-display text-3xl md:text-4xl mb-6">THE SHORTCUT TO DOMINANCE.</h2>
                    <p className="text-muted normal-case text-lg leading-relaxed">
                        Configure any binding. Execute it anywhere—VS Code, Chrome, Notion. Focus drops, microphone
                        captures, transcription inserts instantly at your cursor.
                    </p>
                </div>
            </div>
        </section>
    );
}
