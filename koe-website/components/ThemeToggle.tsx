"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="hover:text-amber transition-colors flex items-center gap-1 cursor-pointer group invisible">
                <span className="hidden md:inline group-hover:block transition-all max-w-0 overflow-hidden group-hover:max-w-xl duration-300 whitespace-nowrap">
                    TOGGLE.MODE()
                </span>
                <Sun className="w-3 h-3" />
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:text-amber transition-colors flex items-center gap-1 cursor-pointer group"
        >
            <span className="hidden md:inline group-hover:block transition-all max-w-0 overflow-hidden group-hover:max-w-xl duration-300 whitespace-nowrap">
                TOGGLE.MODE()
            </span>
            <Sun className="w-3 h-3 hidden dark:block" />
            <Moon className="w-3 h-3 block dark:hidden" />
        </button>
    );
}
