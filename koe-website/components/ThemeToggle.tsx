"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const isThemeReady = resolvedTheme === "dark" || resolvedTheme === "light";
    const isDark = resolvedTheme === "dark";

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="hover:text-amber transition-colors flex items-center gap-1 cursor-pointer group"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            disabled={!isThemeReady}
        >
            <span className="hidden md:inline group-hover:block transition-all max-w-0 overflow-hidden group-hover:max-w-xl duration-300 whitespace-nowrap">
                TOGGLE.MODE()
            </span>
            {isThemeReady ? (
                isDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />
            ) : (
                <span className="inline-block w-3 h-3" aria-hidden="true" />
            )}
        </button>
    );
}
