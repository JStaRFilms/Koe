export interface GitHubRelease {
    tag_name: string;
    published_at: string;
    html_url: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
        size: number;
    }>;
}

export interface GitHubRepo {
    stargazers_count: number;
    html_url: string;
}

const GITHUB_OWNER = "JStaRFilms";
const GITHUB_REPO = "Koe";

/**
 * Fetches the latest release from GitHub API
 * Uses Next.js caching for 1 hour
 */
export async function getLatestRelease(): Promise<GitHubRelease | null> {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
            {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                },
                next: { revalidate: 3600 }, // Cache for 1 hour
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch latest release:", response.statusText);
            return null;
        }

        return response.json();
    } catch (error) {
        console.error("Error fetching latest release:", error);
        return null;
    }
}

/**
 * Fetches repository information including star count
 * Uses Next.js caching for 1 hour
 */
export async function getRepoInfo(): Promise<GitHubRepo | null> {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
            {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                },
                next: { revalidate: 3600 }, // Cache for 1 hour
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch repo info:", response.statusText);
            return null;
        }

        return response.json();
    } catch (error) {
        console.error("Error fetching repo info:", error);
        return null;
    }
}

/**
 * Finds the Windows installer asset in a release
 */
export function findWindowsInstaller(release: GitHubRelease): { name: string; url: string; size: number } | null {
    const installer = release.assets.find((asset) =>
        asset.name.endsWith(".exe") || asset.name.endsWith(".msi")
    );

    if (!installer) {
        return null;
    }

    return {
        name: installer.name,
        url: installer.browser_download_url,
        size: installer.size,
    };
}

/**
 * Formats a file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats a date string to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}
