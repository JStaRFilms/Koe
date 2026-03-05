"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function StatusBar() {
    const [mem, setMem] = useState(12);
    const [cpu, setCpu] = useState("0.1");
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            const newCpu = (Math.random() * 5).toFixed(1);
            const newMem = Math.floor(12 + Math.random() * 10);
            setCpu(newCpu);
            setMem(newMem);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle("dark");
    };

    return (
        <div className="w-full flex justify-between px-4 py-2 border-raw-b text-xs text-muted bg-void/90 backdrop-blur top-0 z-50 sticky">
            <div className="flex gap-4">
                <span className="crt-flicker text-amber">SYS.ONLINE</span>
                <span className="hidden md:inline">VAD://LOCAL</span>
            </div>
            <div className="flex gap-4">
                <button
                    className="hover:text-amber transition-colors flex items-center gap-1 cursor-pointer group"
                    onClick={toggleTheme}
                >
                    <span className="hidden md:inline group-hover:block transition-all max-w-0 overflow-hidden group-hover:max-w-xl duration-300 whitespace-nowrap">
                        TOGGLE.MODE()
                    </span>
                    {isDark ? (
                        <Sun className="w-3 h-3" />
                    ) : (
                        <Moon className="w-3 h-3" />
                    )}
                </button>
                <span>
                    MEM: <span>{mem}</span>MB
                </span>
                <span className="hidden md:inline">
                    CPU: <span>{cpu}</span>%
                </span>
            </div>
        </div>
    );
}
