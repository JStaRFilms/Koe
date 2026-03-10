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
    buttonLabel: string;
}

type ClientPlatform = "mac" | "windows" | "other";

interface GitHubAsset {
    name: string;
    browser_download_url: string;
}

function detectClientPlatform(): ClientPlatform {
    if (typeof navigator === "undefined") {
        return "windows";
    }

    const userAgentDataPlatform = (navigator as Navigator & {
        userAgentData?: { platform?: string };
    }).userAgentData?.platform;
    const platform = userAgentDataPlatform || navigator.platform || navigator.userAgent;

    if (/mac/i.test(platform)) {
        return "mac";
    }

    if (/win/i.test(platform)) {
        return "windows";
    }

    return "other";
}

function getPreferredAsset(assets: GitHubAsset[], platform: ClientPlatform) {
    if (platform === "mac") {
        return assets.find((asset) =>
            asset.name.endsWith(".dmg") || asset.name.endsWith(".pkg") || asset.name.endsWith(".zip")
        );
    }

    return assets.find((asset) =>
        asset.name.endsWith(".exe") || asset.name.endsWith(".msi")
    );
}

function getButtonLabel(platform: ClientPlatform) {
    return platform === "mac" ? "DOWNLOAD FOR YOUR MAC" : "DOWNLOAD FOR WINDOWS";
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

                setRelease({
                    version: data.tag_name,
                    downloadUrl: preferredAsset?.browser_download_url || windowsInstaller?.browser_download_url || data.html_url,
                    publishedAt: data.published_at,
                    buttonLabel: getButtonLabel(platform),
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
