export type ClientPlatform = "mac" | "windows" | "other";

export interface GitHubAsset {
    name: string;
    browser_download_url: string;
}

export function detectClientPlatform(): ClientPlatform {
    if (typeof navigator === "undefined") {
        return "other";
    }

    const userAgentData = navigator as Navigator & {
        userAgentData?: { platform?: string; mobile?: boolean };
    };
    const platform = userAgentData.userAgentData?.platform || navigator.platform || "";
    const userAgent = navigator.userAgent || "";

    if (userAgentData.userAgentData?.mobile || /android|iphone|ipad|ipod/i.test(userAgent)) {
        return "other";
    }

    if (/mac/i.test(platform)) {
        return "mac";
    }

    if (/win/i.test(platform)) {
        return "windows";
    }

    return "other";
}

export function getDownloadCtaLabel(platform: ClientPlatform, mode: "full" | "compact" = "full") {
    if (mode === "compact") {
        switch (platform) {
            case "mac":
                return "MAC DOWNLOAD";
            case "windows":
                return "WINDOWS DOWNLOAD";
            default:
                return "DESKTOP DOWNLOADS";
        }
    }

    switch (platform) {
        case "mac":
            return "DOWNLOAD FOR YOUR MAC";
        case "windows":
            return "DOWNLOAD FOR WINDOWS";
        default:
            return "VIEW DESKTOP DOWNLOADS";
    }
}

export function getPreferredAsset(assets: GitHubAsset[], platform: ClientPlatform) {
    if (platform === "mac") {
        const macAssetPreferences = [
            (asset: GitHubAsset) => asset.name.includes("universal") && asset.name.endsWith(".dmg"),
            (asset: GitHubAsset) => asset.name.includes("universal") && asset.name.endsWith(".zip"),
            (asset: GitHubAsset) => asset.name.endsWith(".dmg"),
            (asset: GitHubAsset) => asset.name.endsWith(".pkg"),
            (asset: GitHubAsset) => asset.name.endsWith(".zip"),
        ];

        for (const matches of macAssetPreferences) {
            const asset = assets.find(matches);
            if (asset) {
                return asset;
            }
        }

        return undefined;
    }

    if (platform === "windows") {
        return assets.find((asset) =>
            asset.name.endsWith(".exe") || asset.name.endsWith(".msi")
        );
    }

    return undefined;
}
