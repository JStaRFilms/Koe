import { Zap, ShieldAlert, Unlock, History } from "lucide-react";

const features = [
    {
        index: "01",
        icon: Zap,
        title: "LIGHTNING FAST",
        description:
            "216x real-time transcription. It's basically instant. Powered by optimized Whisper models on Groq's LPU architecture.",
    },
    {
        index: "02",
        icon: ShieldAlert,
        title: "PRIVACY FIRST. ALWAYS.",
        description:
            "Local Voice Activity Detection processing. Your microphone stays local. Your voice never leaves your boundary until you explicitly trigger dictation.",
    },
    {
        index: "03",
        icon: Unlock,
        title: "COMPLETELY FREE",
        description:
            "No walled gardens. No recurring billing. Bring your own API key and operate indefinitely without limits.",
    },
    {
        index: "04",
        icon: History,
        title: "NEVER LOSE A THOUGHT",
        description:
            "Automatic history saves every transcription. Copy, retry, or delete anytime. Your complete dictation log, locally stored.",
    },
];

export function Features() {
    return (
        <section id="features" className="max-w-7xl mx-auto w-full border-x border-zinc bg-void">
            <div className="w-full p-8 border-raw-b bg-zinc">
                <h2 className="font-deco text-4xl text-amber">SYSTEM ADVANTAGES</h2>
            </div>

            {/* Feature rows */}
            <div className="flex flex-col">
                {features.map((feature, i) => (
                    <FeatureRow
                        key={feature.index}
                        {...feature}
                        isLast={i === features.length - 1}
                    />
                ))}
            </div>
        </section>
    );
}

interface FeatureRowProps {
    index: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    isLast: boolean;
}

function FeatureRow({ index, icon: Icon, title, description, isLast }: FeatureRowProps) {
    return (
        <div
            className={`flex flex-col md:flex-row hover:bg-zinc/30 transition-colors ${!isLast ? "border-raw-b" : ""
                }`}
        >
            <div className="w-full md:w-1/4 p-8 border-raw-b md:border-b-0 md:border-raw-r flex items-center justify-center md:justify-start">
                <span className="font-deco text-8xl text-zinc group-hover:text-amber transition-colors">
                    {index}
                </span>
            </div>
            <div className="w-full md:w-3/4 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                    <Icon className="w-8 h-8 text-amber" />
                    <h3 className="font-deco text-3xl">{title}</h3>
                </div>
                <p className="text-muted normal-case max-w-2xl text-lg">
                    {description}
                </p>
            </div>
        </div>
    );
}
