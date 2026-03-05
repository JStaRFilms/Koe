"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Download, Github, Star } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/JStaRFilms/Koe";

const navLinks = [
  { href: "/#top", label: "SYS.HOME" },
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
        const response = await fetch("https://api.github.com/repos/JStaRFilms/Koe", {
          next: { revalidate: 3600 },
        } as RequestInit);

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
        <div className="relative p-4 md:p-6 pr-16 md:pr-6 border-raw-b md:border-b-0 md:border-raw-r flex items-center gap-3 md:gap-4 bg-void">
          <Link href="/#top" className="flex items-center gap-2" aria-label="Koe home">
            <span className="font-deco text-3xl md:text-4xl text-amber leading-none">KOE</span>
            <span className="font-jp text-2xl md:text-3xl opacity-50 leading-none">{"\u58F0"}</span>
          </Link>

          <button
            className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-bone hover:text-amber transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <span className="relative block w-6 h-6">
              <Menu
                className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-out ${
                  isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-out ${
                  isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                }`}
              />
            </span>
          </button>
        </div>

        <nav className="hidden md:flex flex-grow text-sm font-bold">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 p-6 flex items-center justify-center hover:bg-zinc hover:text-amber transition-colors glitch-hover ${
                index < navLinks.length - 1 ? "border-raw-r" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

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
      </div>

      <div
        className={`md:hidden border-t border-zinc overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-[560px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <nav className="flex flex-col">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm uppercase tracking-wider text-bone hover:text-amber hover:bg-zinc py-4 px-6 border-b border-zinc transition-all duration-300 ease-out ${
                isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              }`}
              style={{ transitionDelay: isOpen ? `${index * 40}ms` : "0ms" }}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 py-4 px-6 border-b border-zinc text-bone hover:text-amber hover:bg-zinc transition-all duration-300 ease-out ${
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            }`}
            style={{ transitionDelay: isOpen ? `${navLinks.length * 40}ms` : "0ms" }}
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
            className={`flex items-center justify-center gap-2 px-6 py-4 bg-amber text-void font-bold text-sm uppercase tracking-wider hover:bg-bone transition-all duration-300 ease-out ${
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            }`}
            style={{ transitionDelay: isOpen ? `${(navLinks.length + 1) * 40}ms` : "0ms" }}
            onClick={() => setIsOpen(false)}
          >
            <Download className="w-4 h-4" />
            DOWNLOAD
          </Link>
        </nav>
      </div>
    </header>
  );
}
