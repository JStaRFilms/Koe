import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-zinc bg-void">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <span className="text-2xl font-bold text-amber" style={{ fontFamily: 'var(--font-display)' }}>
                                KOE
                            </span>
                            <span className="text-muted text-sm">声</span>
                        </Link>
                        <p className="text-muted text-sm max-w-sm">
                            Lightning-fast, free voice dictation for Windows. Powered by AI, completely open source.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-bone font-bold uppercase tracking-wider mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/download/" className="text-muted text-sm hover:text-amber transition-colors">
                                    Download
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing/" className="text-muted text-sm hover:text-amber transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy/" className="text-muted text-sm hover:text-amber transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="text-bone font-bold uppercase tracking-wider mb-4">Connect</h3>
                        <div className="flex gap-4">
                            <a
                                href="https://github.com/GIGAHAT1994/whisper_alt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted hover:text-amber transition-colors"
                                aria-label="GitHub"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <a
                                href="https://twitter.com"
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
                <div className="border-t border-zinc mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-muted text-sm">
                        © {currentYear} Koe. All rights reserved.
                    </p>
                    <p className="text-muted text-xs">
                        Open source under MIT License
                    </p>
                </div>
            </div>
        </footer>
    );
}
