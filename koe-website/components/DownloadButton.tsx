"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface DownloadButtonProps {
    className?: string;
    showVersion?: boolean;
}

interface ReleaseInfo {
    version: string;
    downloadUrl: string;
    publishedAt: string;
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

                // Find Windows installer
                const installer = data.assets.find((asset: { name: string }) =>
                    asset.name.endsWith(".exe") || asset.name.endsWith(".msi")
                );

                setRelease({
                    version: data.tag_name,
                    downloadUrl: installer?.browser_download_url || data.html_url,
                    publishedAt: data.published_at,
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
                className={`flex items-center justify-center gap-2 px-6 py-3 bg-zinc text-muted cursor-not-allowed ${className}`}
            >
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
            </button>
        );
    }

    if (error || !release) {
        return (
            <a
                    href="https://github.com/JStaRFilms/Koe/releases"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 px-6 py-3 bg-amber text-void font-bold uppercase tracking-wider hover:bg-bone transition-colors ${className}`}
            >
                <Download className="w-4 h-4" />
                View Releases
            </a>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <a
                href={release.downloadUrl}
                className={`flex items-center justify-center gap-2 px-6 py-3 bg-amber text-void font-bold uppercase tracking-wider hover:bg-bone transition-colors ${className}`}
            >
                <Download className="w-4 h-4" />
                Download for Windows
            </a>
            {showVersion && (
                <span className="text-xs text-muted">
                    {release.version} • {new Date(release.publishedAt).toLocaleDateString()}
                </span>
            )}
        </div>
    );
}
