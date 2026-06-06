"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";

import { detectClientPlatform, getDownloadCtaLabel, type ClientPlatform } from "@/lib/download-platform";

interface ContextAwareDownloadLinkProps {
    className?: string;
    labelMode?: "full" | "compact";
    onClick?: () => void;
    prefix?: ReactNode;
    style?: CSSProperties;
}

export function ContextAwareDownloadLink({
    className = "",
    labelMode = "full",
    onClick,
    prefix,
    style,
}: ContextAwareDownloadLinkProps) {
    const [platform] = useState<ClientPlatform>(() => detectClientPlatform());

    return (
        <Link
            href="/download/"
            className={className}
            onClick={onClick}
            style={style}
        >
            {prefix}
            {getDownloadCtaLabel(platform, labelMode)}
        </Link>
    );
}
