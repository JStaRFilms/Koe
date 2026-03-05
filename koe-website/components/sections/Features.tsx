import { Zap, ShieldAlert, Unlock } from "lucide-react";

export function Features() {
    return (
        <section id="features" className="max-w-7xl mx-auto w-full border-x border-zinc bg-void">
            <div className="w-full p-8 border-raw-b bg-zinc">
                <h2 className="font-deco text-4xl text-amber">SYSTEM ADVANTAGES</h2>
            </div>

            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row border-raw-b hover:bg-zinc/30 transition-colors group">
                <div className="w-full md:w-1/4 p-8 border-raw-b md:border-b-0 md:border-raw-r flex items-center justify-center md:justify-start">
                    <span className="font-deco text-8xl text-zinc group-hover:text-amber transition-colors">
                        01
                    </span>
                </div>
                <div className="w-full md:w-3/4 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                        <Zap className="w-8 h-8 text-amber" />
                        <h3 className="font-deco text-3xl">LIGHTNING FAST</h3>
                    </div>
                    <p className="text-muted normal-case max-w-2xl text-lg">
                        216x real-time transcription. It's basically instant. Powered by optimized Whisper models on
                        Groq's LPU architecture.
                    </p>
                </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row border-raw-b hover:bg-zinc/30 transition-colors group">
                <div className="w-full md:w-1/4 p-8 border-raw-b md:border-b-0 md:border-raw-r flex items-center justify-center md:justify-start">
                    <span className="font-deco text-8xl text-zinc group-hover:text-amber transition-colors">
                        02
                    </span>
                </div>
                <div className="w-full md:w-3/4 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                        <ShieldAlert className="w-8 h-8 text-amber" />
                        <h3 className="font-deco text-3xl">PRIVACY FIRST. ALWAYS.</h3>
                    </div>
                    <p className="text-muted normal-case max-w-2xl text-lg">
                        Local Voice Activity Detection processing. Your microphone stays local. Your voice never leaves
                        your boundary until you explicitly trigger dictation.
                    </p>
                </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col md:flex-row border-raw-b hover:bg-zinc/30 transition-colors group">
                <div className="w-full md:w-1/4 p-8 border-raw-b md:border-b-0 md:border-raw-r flex items-center justify-center md:justify-start">
                    <span className="font-deco text-8xl text-zinc group-hover:text-amber transition-colors">
                        03
                    </span>
                </div>
                <div className="w-full md:w-3/4 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                        <Unlock className="w-8 h-8 text-amber" />
                        <h3 className="font-deco text-3xl">COMPLETELY FREE</h3>
                    </div>
                    <p className="text-muted normal-case max-w-2xl text-lg">
                        No walled gardens. No recurring billing. Bring your own API key and operate indefinitely without
                        limits.
                    </p>
                </div>
            </div>
        </section>
    );
}
