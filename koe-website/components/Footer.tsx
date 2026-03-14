import Link from "next/link";
import { Github, Twitter, Zap } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/JStaRFilms/Koe";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-zinc bg-void">
            {/* Deco line */}
            <div className="h-1 bg-amber w-full" />

            <div className="container mx-auto px-4">
                <div className="py-12 md:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <Link href="/" className="flex items-center gap-2 mb-4">
                                <span className="font-display text-2xl text-amber">KOE</span>
                                <span className="text-muted" style={{ fontFamily: 'var(--font-serif)' }}>声</span>
                            </Link>
                            <p className="text-muted text-sm max-w-sm normal-case leading-relaxed">
                                Lightning-fast, free voice dictation for desktop and mobile. Powered by AI, completely open source.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h3 className="text-bone font-bold uppercase tracking-wider mb-4 text-sm">System</h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link href="/download/" className="text-muted text-sm hover:text-amber transition-colors uppercase">
                                        Download
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/pricing/" className="text-muted text-sm hover:text-amber transition-colors uppercase">
                                        Pricing
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy/" className="text-muted text-sm hover:text-amber transition-colors uppercase">
                                        Privacy Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Connect */}
                        <div>
                            <h3 className="text-bone font-bold uppercase tracking-wider mb-4 text-sm">Connect</h3>
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

                    {/* Bottom */}
                    <div className="border-t border-zinc pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <span className="font-display text-xl text-amber">KOE</span>
                            <span className="text-muted text-xs">BUILD // {currentYear}</span>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 text-xs text-muted">
                            <a
                                href={GITHUB_REPO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-amber transition-colors uppercase"
                            >
                                [REPO]
                            </a>
                            <Link href="/privacy/" className="hover:text-amber transition-colors uppercase">
                                [PRIVACY DIRECTIVE]
                            </Link>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span className="uppercase">CONSTRUCTED BY JSTAR</span>
                            <Zap className="w-4 h-4 text-amber" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

