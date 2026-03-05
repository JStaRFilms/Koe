import { Zap, Shield, Gift, History } from "lucide-react";

const features = [
    {
        index: "01",
        icon: Zap,
        title: "LIGHTNING FAST",
        description: "216x real-time transcription. It's basically instant. Powered by optimized Whisper models on Groq's LPU architecture.",
    },
    {
        index: "02",
        icon: Shield,
        title: "PRIVACY FIRST. ALWAYS.",
        description: "Local Voice Activity Detection processing. Your microphone stays local. Your voice never leaves your boundary until you explicitly trigger dictation.",
    },
    {
        index: "03",
        icon: Gift,
        title: "COMPLETELY FREE",
        description: "No walled gardens. No recurring billing. Bring your own API key and operate indefinitely without limits.",
    },
    {
        index: "04",
        icon: History,
        title: "NEVER LOSE A THOUGHT",
        description: "Automatic history saves every transcription. Copy, retry, or delete anytime. Your complete dictation log, locally stored.",
    },
];

export function Features() {
    return (
        <section id="features" className="border-b border-zinc">
            {/* Section header */}
            <div className="w-full p-8 border-b border-zinc bg-zinc/30">
                <h2 className="font-display text-3xl md:text-4xl text-amber">SYSTEM ADVANTAGES</h2>
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
            className={`flex flex-col md:flex-row group hover:bg-zinc/20 transition-colors ${!isLast ? "border-b border-zinc" : ""
                }`}
        >
            {/* Index number */}
            <div className="w-full md:w-1/4 p-8 border-b md:border-b-0 md:border-r border-zinc flex items-center justify-center md:justify-start">
                <span className="font-display text-7xl md:text-8xl text-zinc group-hover:text-amber transition-colors duration-300">
                    {index}
                </span>
            </div>

            {/* Content */}
            <div className="w-full md:w-3/4 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                    <Icon className="w-8 h-8 text-amber" />
                    <h3 className="font-display text-2xl md:text-3xl">{title}</h3>
                </div>
                <p className="text-muted normal-case max-w-2xl text-lg leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
