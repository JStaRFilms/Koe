"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
    {
        question: "IS KOE REALLY FREE?",
        answer: "Yes, completely free and open source. No hidden costs or subscriptions to be found in the core logic. BYOK (Bring Your Own Key) means you just need a free Groq API key.",
    },
    {
        question: "DO I NEED AN API KEY?",
        answer: "Yes. Koe operates on a BYOK (Bring Your Own Key) model. Acquire a free hardware-accelerated key from Groq to activate full transcription capabilities. Groq offers generous free tiers.",
    },
    {
        question: "IS MY AUDIO MINED FOR DATA?",
        answer: "Negative. VAD (Voice Activity Detection) is processed 100% locally on your machine. Audio transmission only occurs explicitly on hotkey trigger, sent directly to Groq's API. No telemetry, no tracking, no data collection.",
    },
    {
        question: "WHAT WINDOWS VERSIONS ARE SUPPORTED?",
        answer: "Koe works on Windows 10 and Windows 11 (64-bit). The app requires a microphone for voice input and an internet connection for transcription via Groq's API.",
    },
    {
        question: "CAN I USE KOE IN ANY APP?",
        answer: "Yes! Koe uses auto-type to insert text wherever your cursor is — Notion, VS Code, Chrome, Word, and more. It works system-wide, not just in specific applications.",
    },
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="border-b border-zinc">
            {/* Section header */}
            <div className="w-full p-8 border-b border-zinc">
                <h2 className="font-display text-3xl md:text-4xl text-bone">SYS.FAQ</h2>
            </div>

            {/* FAQ items */}
            <div className="flex flex-col">
                {faqs.map((faq, index) => (
                    <FAQItem
                        key={index}
                        index={index}
                        question={faq.question}
                        answer={faq.answer}
                        isOpen={openIndex === index}
                        onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                        isLast={index === faqs.length - 1}
                    />
                ))}
            </div>
        </section>
    );
}

interface FAQItemProps {
    index: number;
    question: string;
    answer: string;
    isOpen: boolean;
    onToggle: () => void;
    isLast: boolean;
}

function FAQItem({ index, question, answer, isOpen, onToggle, isLast }: FAQItemProps) {
    return (
        <div
            className={`group cursor-pointer bg-void hover:bg-zinc/30 transition-colors ${!isLast ? "border-b border-zinc" : ""
                }`}
        >
            <button
                onClick={onToggle}
                className="w-full p-6 flex justify-between items-center text-left outline-none"
            >
                <span className="font-bold text-lg md:text-xl pr-4">
                    [Q {String(index + 1).padStart(2, "0")}] {question}
                </span>
                {isOpen ? (
                    <Minus className="w-6 h-6 text-amber flex-shrink-0" />
                ) : (
                    <Plus className="w-6 h-6 text-amber flex-shrink-0" />
                )}
            </button>

            {isOpen && (
                <div className="px-6 pb-6 text-muted normal-case text-lg border-t border-dashed border-zinc mt-2 pt-4">
                    <span className="text-amber uppercase font-mono mr-2">{`> RESPONSE:`}</span>
                    {answer}
                </div>
            )}
        </div>
    );
}
