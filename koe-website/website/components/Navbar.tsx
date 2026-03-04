"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Download } from "lucide-react";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/pricing/", label: "Pricing" },
        { href: "/download/", label: "Download" },
        { href: "/privacy/", label: "Privacy" },
    ];

    return (
        <header className="sticky top-0 z-40 w-full border-b border-zinc bg-void/95 backdrop-blur supports-[backdrop-filter]:bg-void/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-amber" style={{ fontFamily: 'var(--font-display)' }}>
                            KOE
                        </span>
                        <span className="text-muted text-sm hidden sm:inline">声</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm uppercase tracking-wider text-bone hover:text-amber transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* CTA Button */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            href="/download/"
                            className="flex items-center gap-2 px-4 py-2 bg-amber text-void font-bold text-sm uppercase tracking-wider hover:bg-bone transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-bone hover:text-amber transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden border-t border-zinc py-4">
                        <nav className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm uppercase tracking-wider text-bone hover:text-amber transition-colors py-2"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/download/"
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-amber text-void font-bold text-sm uppercase tracking-wider hover:bg-bone transition-colors mt-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
