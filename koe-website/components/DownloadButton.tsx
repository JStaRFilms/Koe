"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { detectClientPlatform, getDownloadCtaLabel, getPreferredAsset } from "@/lib/download-platform";

interface DownloadButtonProps {
    className?: string;
    showVersion?: boolean;
}

interface ReleaseInfo {
    version: string;
    downloadUrl: string;
    publishedAt: string;
    buttonLabel: string;
}

export function DownloadButton({ className = "", showVersion = true }: DownloadButtonProps) {
    const [release, setRelease] = useState<ReleaseInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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
            <a
                href={release.downloadUrl}
                className={`btn-brutal ${className}`}
            >
                <Download className="w-4 h-4" />
                {release.buttonLabel}
            </a>
            {showVersion && (
                <span className="text-xs text-muted">
                    {release.version} • {new Date(release.publishedAt).toLocaleDateString()}
                </span>
            )}
        </div>
    );
}
