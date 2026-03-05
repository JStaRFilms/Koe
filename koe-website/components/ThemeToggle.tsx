"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    if (!resolvedTheme) {
        return (
            <button className="hover:text-amber transition-colors flex items-center gap-1 cursor-pointer group invisible">
                <span className="hidden md:inline group-hover:block transition-all max-w-0 overflow-hidden group-hover:max-w-xl duration-300 whitespace-nowrap">
                    TOGGLE.MODE()
                </span>
                <Sun className="w-3 h-3" />
            </button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="hover:text-amber transition-colors flex items-center gap-1 cursor-pointer group"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            <span className="hidden md:inline group-hover:block transition-all max-w-0 overflow-hidden group-hover:max-w-xl duration-300 whitespace-nowrap">
                TOGGLE.MODE()
            </span>
            {isDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
        </button>
    );
}
