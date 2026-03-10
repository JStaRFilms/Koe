"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Loader2 } from "lucide-react";

import {
    detectClientPlatform,
    getDownloadCtaLabel,
    getDownloadOptions,
    getPreferredAsset,
    type DownloadOption,
} from "@/lib/download-platform";

interface DownloadButtonProps {
    className?: string;
    showVersion?: boolean;
}

interface ReleaseInfo {
    version: string;
    downloadUrl: string;
    publishedAt: string;
    buttonLabel: string;
    options: DownloadOption[];
}

export function DownloadButton({ className = "", showVersion = true }: DownloadButtonProps) {
    const [release, setRelease] = useState<ReleaseInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function fetchRelease() {
            try {
                const response = await fetch(
                    "https://api.github.com/repos/JStaRFilms/Koe/releases/latest"
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch release");
                }

                const data = await response.json();
                const platform = detectClientPlatform();

                const preferredAsset = getPreferredAsset(data.assets, platform);
                const windowsInstaller = getPreferredAsset(data.assets, "windows");
                const fallbackUrl = platform === "windows"
                    ? windowsInstaller?.browser_download_url || data.html_url
                    : data.html_url;

                setRelease({
                    version: data.tag_name,
                    downloadUrl: preferredAsset?.browser_download_url || fallbackUrl,
                    publishedAt: data.published_at,
                    buttonLabel: getDownloadCtaLabel(platform),
                    options: getDownloadOptions(data.assets, data.html_url),
                });
            } catch (err) {
                console.error("Error fetching release:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchRelease();
    }, []);

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (!menuRef.current || menuRef.current.contains(event.target as Node)) {
                return;
            }

            setIsMenuOpen(false);
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    if (loading) {
        return (
            <button
                disabled
                className={`btn-brutal cursor-not-allowed opacity-50 ${className}`}
            >
                <Loader2 className="w-4 h-4 animate-spin" />
                LOADING...
            </button>
        );
    }

    if (error || !release) {
        return (
            <a
                href="https://github.com/JStaRFilms/Koe/releases"
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-brutal ${className}`}
            >
                <Download className="w-4 h-4" />
                VIEW RELEASES
            </a>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <div ref={menuRef} className={`relative w-full ${className}`}>
                <div className="flex w-full items-stretch gap-2">
                    <a
                        href={release.downloadUrl}
                        className="btn-brutal flex-1 justify-center"
                    >
                        <Download className="w-4 h-4" />
                        {release.buttonLabel}
                    </a>
                    <button
                        type="button"
                        className="btn-brutal min-w-12 justify-center px-4"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        aria-label="Choose another build"
                        onClick={() => setIsMenuOpen((open) => !open)}
                    >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="absolute right-0 top-full z-20 mt-2 min-w-[260px] border-raw bg-void shadow-[8px_8px_0_0_#D83B1D]">
                        <div className="border-raw-b px-4 py-3 text-left">
                            <p className="text-xs font-bold text-amber">OTHER BUILDS</p>
                        </div>
                        <div className="p-2">
                            {release.options.map((option) => (
                                <a
                                    key={option.key}
                                    href={option.url}
                                    target={option.key === "all-releases" ? "_blank" : undefined}
                                    rel={option.key === "all-releases" ? "noopener noreferrer" : undefined}
                                    className="flex w-full items-center justify-between gap-4 border-raw px-3 py-3 text-left transition-colors hover:bg-amber hover:text-void"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span className="flex flex-col">
                                        <span className="text-sm text-bone normal-case">{option.label}</span>
                                        <span className="text-xs text-muted normal-case">{option.description}</span>
                                    </span>
                                    <Download className="h-4 w-4 shrink-0" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {showVersion && (
                <span className="text-xs text-muted">
                    {release.version} • {new Date(release.publishedAt).toLocaleDateString()}
                </span>
            )}
        </div>
    );
}
