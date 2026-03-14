import Link from "next/link";
import { Github, Twitter, Zap } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/JStaRFilms/Koe";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full max-w-7xl mx-auto border-x border-raw-b border-zinc bg-void mt-16 mb-8 relative">
            <div className="deco-line"></div>

            <div className="p-12 md:p-24">
                {/* Main footer content */}
                <div className="flex flex-col md:flex-row gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:w-1/2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <span className="font-deco text-4xl text-amber">KOE</span>
                            <span className="font-jp text-3xl opacity-50">声</span>
                        </Link>
                        <p className="text-muted normal-case max-w-md">
                            Lightning-fast, free voice dictation for desktop and mobile. Powered by AI, completely open source.
                        </p>
                    </div>

                    {/* Links Grid */}
                    <div className="md:w-1/2 grid grid-cols-2 gap-8">
                        {/* System Links */}
                        <div>
                            <h3 className="font-deco text-bone mb-4 text-lg">SYSTEM</h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link href="/download/" className="text-muted hover:text-amber transition-colors text-sm uppercase">
                                        Download
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/pricing/" className="text-muted hover:text-amber transition-colors text-sm uppercase">
                                        Pricing
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy/" className="text-muted hover:text-amber transition-colors text-sm uppercase">
                                        Privacy Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Connect Links */}
                        <div>
                            <h3 className="font-deco text-bone mb-4 text-lg">CONNECT</h3>
                            <div className="flex gap-4">
                                <a
                                    href={GITHUB_REPO_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted hover:text-amber transition-colors"
                                    aria-label="GitHub"
                                >
                                    <Github className="w-5 h-5" />
                                </a>
                                <a
                                    href="https://x.com/OlulekeJOke"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted hover:text-amber transition-colors"
                                    aria-label="Twitter"
                                >
                                    <Twitter className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center mb-16">
                    <h2 className="font-deco text-5xl md:text-7xl mb-12 text-bone tracking-wider">
                        END OF THE LINE.
                        <br />
                        <span className="text-crimson line-through decoration-[6px]">TYPING</span>.
                    </h2>

                    <a
                        href={GITHUB_REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-brutal mb-16 shadow-[8px_8px_0_0_#FFF] hover:shadow-[4px_4px_0_0_#FFF] translate-x-0 hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                        <Github className="w-6 h-6" />
                        ENGAGE GITHUB
                    </a>
                </div>

                {/* Bottom bar */}
                <div className="w-full flex flex-col md:flex-row justify-between items-center border-t border-zinc pt-8 text-sm text-muted gap-6">
                    <div className="flex items-center gap-4">
                        <span className="font-deco text-2xl text-amber">KOE</span>
                        <span>BUILD // {currentYear}</span>
                    </div>

                    <div className="flex gap-8">
                        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-amber uppercase">
                            [REPO]
                        </a>
                        <Link href="/privacy" className="hover:text-amber uppercase">
                            [PRIVACY DIRECTIVE]
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        CONSTRUCTED BY JSTAR <Zap className="w-4 h-4 text-amber" />
                    </div>
                </div>
            </div>
        </footer>
    );
}

