import { Cpu } from "lucide-react";

export function Specs() {
    return (
        <section id="specs" className="max-w-7xl mx-auto w-full border-x border-zinc bg-void flex flex-col">
            {/* Hotkey Row */}
            <div className="w-full flex">
                <div className="w-1/2 p-12 border-raw-r border-raw-b hidden md:block relative overflow-hidden bg-zinc/10">
                    <div
                        className="absolute inset-0 opacity-10 font-jp leading-[0.8] tracking-tighter"
                        style={{ fontSize: "20rem", wordBreak: "break-all" }}
                    >
                        声声声声声声声声声
                    </div>
                    <div className="relative z-10 w-full h-full border-2 border-bone/20 flex flex-col justify-between p-4">
                        <div className="flex gap-2 text-amber text-xs">
                            <Cpu className="w-4 h-4" />
                            <span>[PROCESS: KEY_HOOK]</span>
                        </div>
                        <div className="text-5xl font-mono opacity-80">{`> CTRL+SHIFT+SPACE`}</div>
                    </div>
                </div>
                <div className="w-full md:w-1/2 p-8 md:p-12 border-raw-b flex flex-col justify-center">
                    <span className="text-amber font-bold mb-4">[GLOBAL HOTKEY]</span>
                    <h2 className="font-deco text-4xl mb-6">THE SHORTCUT TO DOMINANCE.</h2>
                    <p className="text-muted normal-case text-lg leading-relaxed">
                        Configure any binding. Execute it anywhere—VS Code, Chrome, Notion. Focus drops, microphone
                        captures, transcription inserts instantly at your cursor.
                    </p>
                </div>
            </div>

            {/* Comparison Table directly merged */}
            <div className="w-full flex flex-col md:flex-row border-raw-b">
                <div className="w-full md:w-1/3 bg-amber text-void p-8 flex flex-col justify-center">
                    <h2 className="font-deco text-4xl mb-4">COMPARE.</h2>
                    <p className="normal-case font-bold">THE CHOICES ARE CLEAR. UPGRADE YOUR WORKFLOW.</p>
                </div>
                <div className="w-full md:w-2/3 flex flex-col">
                    <div className="flex w-full border-raw-b bg-zinc font-bold text-xs md:text-sm">
                        <div className="w-2/5 p-4 border-raw-r text-bone">METRIC</div>
                        <div className="w-2/5 p-4 border-raw-r text-amber">KOE [V1.0]</div>
                        <div className="w-1/5 p-4 text-muted">A OS NATIVE</div>
                    </div>
                    <div className="flex w-full border-raw-b text-sm md:text-base">
                        <div className="w-2/5 p-4 border-raw-r">COST STRUCTURE</div>
                        <div className="w-2/5 p-4 border-raw-r font-bold text-amber bg-amber/10">$0 FOREVER</div>
                        <div className="w-1/5 p-4 text-muted font-mono">$0</div>
                    </div>
                    <div className="flex w-full border-raw-b text-sm md:text-base">
                        <div className="w-2/5 p-4 border-raw-r">ENGINE TYPE</div>
                        <div className="w-2/5 p-4 border-raw-r font-bold text-bone">WHISPER (HIGH)</div>
                        <div className="w-1/5 p-4 text-muted font-mono">NATIVE (LOW)</div>
                    </div>
                    <div className="flex w-full text-sm md:text-base">
                        <div className="w-2/5 p-4 border-raw-r">SOURCE</div>
                        <div className="w-2/5 p-4 border-raw-r font-bold text-bone">OPEN (GITHUB)</div>
                        <div className="w-1/5 p-4 text-muted font-mono">CLOSED</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
