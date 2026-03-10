export type ClientPlatform = "mac" | "windows" | "other";

export interface GitHubAsset {
    name: string;
    browser_download_url: string;
}

export interface DownloadOption {
    key: string;
    label: string;
    description: string;
    url: string;
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

function getAssetArchitecture(name: string) {
    if (name.includes("universal")) {
        return "Universal";
    }

    if (name.includes("arm64")) {
        return "Apple Silicon";
    }

    if (name.includes("x64")) {
        return "Intel";
    }

    return "";
}

function buildMacOption(asset: GitHubAsset, format: "dmg" | "zip"): DownloadOption {
    const architecture = getAssetArchitecture(asset.name);
    const suffix = architecture ? ` (${architecture})` : "";

    return {
        key: `mac-${format}-${asset.name}`,
        label: format === "dmg" ? `Mac App${suffix}` : `Mac Archive${suffix}`,
        description: format === "dmg" ? ".dmg installer" : ".zip archive",
        url: asset.browser_download_url,
    };
}

function buildWindowsOption(asset: GitHubAsset): DownloadOption {
    return {
        key: `windows-${asset.name}`,
        label: "Windows Installer",
        description: asset.name.endsWith(".msi") ? ".msi package" : ".exe installer",
        url: asset.browser_download_url,
    };
}

export function getDownloadOptions(assets: GitHubAsset[], releaseUrl: string) {
    const options: DownloadOption[] = [];
    const seen = new Set<string>();

    const pushOption = (option: DownloadOption | undefined) => {
        if (!option || seen.has(option.url)) {
            return;
        }

        seen.add(option.url);
        options.push(option);
    };

    const macDmg = getPreferredAsset(assets, "mac");
    const macZip = assets.find((asset) =>
        asset.name.includes("universal") && asset.name.endsWith(".zip")
    ) || assets.find((asset) => asset.name.endsWith(".zip"));
    const windowsInstaller = getPreferredAsset(assets, "windows");

    pushOption(macDmg ? buildMacOption(macDmg, "dmg") : undefined);
    pushOption(windowsInstaller ? buildWindowsOption(windowsInstaller) : undefined);
    pushOption(macZip ? buildMacOption(macZip, "zip") : undefined);
    pushOption({
        key: "all-releases",
        label: "All Releases",
        description: "Browse every asset",
        url: releaseUrl,
    });

    return options;
}
