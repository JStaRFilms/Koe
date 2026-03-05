import Link from "next/link";
import { Github } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/GIGAHAT1994/whisper_alt";

export function Header() {
    return (
        <header className="w-full border-raw-b bg-void/80 backdrop-blur z-40">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row border-raw-r border-l border-zinc border-opacity-30">
                {/* Brand */}
                <div className="p-6 border-raw-b md:border-b-0 md:border-raw-r flex items-center gap-4 bg-void">
                    <span className="font-deco text-4xl text-amber">KOE</span>
                    <span className="font-jp text-3xl opacity-50">声</span>
                </div>

                {/* Navigation */}
                <nav className="flex-grow flex text-sm font-bold">
                    <a
                        href="#features"
                        className="flex-1 p-6 border-raw-r flex items-center justify-center hover:bg-zinc hover:text-amber transition-colors glitch-hover"
                    >
                        SYS.FEATURES
                    </a>
                    <a
                        href="#specs"
                        className="flex-1 p-6 border-raw-r flex items-center justify-center hover:bg-zinc hover:text-amber transition-colors glitch-hover"
                    >
                        SYS.SPECS
                    </a>
                    <a
                        href="#faq"
                        className="flex-1 p-6 flex items-center justify-center hover:bg-zinc hover:text-amber transition-colors glitch-hover"
                    >
                        SYS.FAQ
                    </a>
                </nav>

                <div className="p-6 border-t border-zinc md:border-t-0 md:border-l border-zinc flex justify-center bg-void">
                    <a
                        href={GITHUB_REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-amber"
                    >
                        <Github className="w-5 h-5" /> [SOURCE]
                    </a>
                </div>
            </div>
        </header>
    );
}
