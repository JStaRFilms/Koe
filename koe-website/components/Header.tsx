"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Download, Github, Star } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/GIGAHAT1994/whisper_alt";

const navLinks = [
    { href: "/", label: "SYS.HOME" },
    { href: "/#features", label: "SYS.FEATURES" },
    { href: "/#specs", label: "SYS.SPECS" },
    { href: "/#faq", label: "SYS.FAQ" },
    { href: "/pricing/", label: "SYS.PRICING" },
];

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [starCount, setStarCount] = useState<number | null>(null);

    useEffect(() => {
        async function fetchStars() {
            try {
                const response = await fetch(
                    "https://api.github.com/repos/GIGAHAT1994/whisper_alt",
                    { next: { revalidate: 3600 } } as RequestInit
                );
                if (response.ok) {
                    const data = await response.json();
                    setStarCount(data.stargazers_count);
                }
            } catch (error) {
                console.error("Failed to fetch star count:", error);
            }
        }
        fetchStars();
    }, []);

    return (
        <header className="w-full border-raw-b bg-void/80 backdrop-blur z-40">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row border-raw-r border-l border-zinc border-opacity-30">
                {/* Brand */}
                <div className="p-6 border-raw-b md:border-b-0 md:border-raw-r flex items-center gap-4 bg-void">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="font-deco text-4xl text-amber">KOE</span>
                        <span className="font-jp text-3xl opacity-50">声</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex flex-grow text-sm font-bold">
                    {navLinks.map((link, index) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex-1 p-6 flex items-center justify-center hover:bg-zinc hover:text-amber transition-colors glitch-hover ${index < navLinks.length - 1 ? "border-raw-r" : ""}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right side - GitHub with star count + download */}
                <div className="hidden md:flex border-t border-zinc md:border-t-0 md:border-l border-zinc justify-center bg-void items-center">
                    <a
                        href={GITHUB_REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-amber transition-colors px-6 py-6 border-raw-r"
                    >
                        <Github className="w-5 h-5" />
                        <span className="text-sm">[SOURCE]</span>
                        {starCount !== null && (
                            <span className="flex items-center gap-1 text-xs text-muted">
                                <Star className="w-3 h-3" />
                                {starCount}
                            </span>
                        )}
                    </a>
                    <Link
                        href="/download/"
                        className="px-6 py-6 bg-amber text-void font-bold text-sm uppercase tracking-wider hover:bg-bone transition-colors"
                    >
                        <span>DOWNLOAD</span>
                    </Link>
                </div>

                {/* Mobile menu button */}
                <button
                    className="md:hidden absolute right-4 top-14 p-2 text-bone hover:text-amber transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden border-t border-zinc">
                    <nav className="flex flex-col">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm uppercase tracking-wider text-bone hover:text-amber hover:bg-zinc transition-colors py-4 px-6 border-b border-zinc"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <a
                            href={GITHUB_REPO_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 py-4 px-6 border-b border-zinc text-bone hover:text-amber hover:bg-zinc transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Github className="w-5 h-5" />
                            [SOURCE]
                            {starCount !== null && (
                                <span className="flex items-center gap-1 text-xs text-muted ml-auto">
                                    <Star className="w-3 h-3" />
                                    {starCount}
                                </span>
                            )}
                        </a>
                        <Link
                            href="/download/"
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-amber text-void font-bold text-sm uppercase tracking-wider hover:bg-bone transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Download className="w-4 h-4" />
                            DOWNLOAD
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
