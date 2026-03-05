"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Download, Github, Star, Terminal } from "lucide-react";

import { ThemeToggle } from "./ThemeToggle";

const GITHUB_REPO_URL = "https://github.com/GIGAHAT1994/whisper_alt";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [starCount, setStarCount] = useState<number | null>(null);

    // Faux terminal stats state
    const [cpu, setCpu] = useState("0.1");
    const [mem, setMem] = useState("12");

    useEffect(() => {
        // Star fetcher
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

        // Terminal stats effect
        const interval = setInterval(() => {
            const newCpu = (Math.random() * 5).toFixed(1);
            const newMem = Math.floor(12 + Math.random() * 10);
            setCpu(newCpu);
            setMem(newMem.toString());
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const navLinks = [
        { href: "/", label: "SYS.HOME" },
        { href: "/#features", label: "SYS.FEATURES" },
        { href: "/#faq", label: "SYS.FAQ" },
        { href: "/pricing/", label: "SYS.PRICING" },
    ];

    return (
        <>
            {/* Top status bar */}
            <div className="w-full flex justify-between px-4 py-2 border-b border-zinc text-xs text-muted bg-void/90 backdrop-blur sticky top-0 z-50">
                <div className="flex gap-4 text-xs font-mono">
                    <span className="crt-flicker text-amber">SYS.ONLINE</span>
                    <span className="hidden md:inline">VAD://LOCAL</span>
                </div>
                <div className="flex gap-4 text-xs font-mono items-center">
                    <ThemeToggle />
                    <span>MEM: <span>{mem}</span>MB</span>
                    <span className="hidden md:inline">CPU: <span>{cpu}</span>%</span>
                </div>
            </div>

            {/* Main navbar */}
            <header className="w-full border-b border-zinc bg-void/90 backdrop-blur z-40">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row">
                        {/* Logo */}
                        <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-zinc flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-2">
                                <span className="font-display text-2xl md:text-3xl text-amber">KOE</span>
                                <span className="text-muted text-lg" style={{ fontFamily: 'var(--font-serif)' }}>声</span>
                            </Link>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex flex-grow text-sm font-bold">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex-1 px-6 border-r border-zinc flex items-center justify-center hover:bg-zinc hover:text-amber transition-colors uppercase tracking-wider text-bone"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Right side - GitHub + Download */}
                        <div className="hidden md:flex items-center">
                            <a
                                href={GITHUB_REPO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 border-r border-zinc h-full flex items-center gap-2 hover:text-amber transition-colors text-bone"
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
                                className="px-6 bg-amber text-void h-full flex items-center gap-2 font-bold uppercase tracking-wider hover:bg-bone transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden lg:inline">DOWNLOAD</span>
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
                </div>
            </header>
        </>
    );
}
