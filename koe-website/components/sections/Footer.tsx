import { Github, Zap } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/GIGAHAT1994/whisper_alt";

export function Footer() {
    return (
        <footer className="w-full max-w-7xl mx-auto border-x border-raw-b border-zinc bg-void mt-16 mb-8 relative">
            <div className="deco-line"></div>
            <div className="p-12 md:p-24 flex flex-col items-center text-center">
                <h2 className="font-deco text-5xl md:text-7xl mb-12 text-bone tracking-wider">
                    END OF THE LINE.
                    <br />
                    <span className="text-crimson line-through decoration-[6px]">TYPING</span>.
                </h2>

                <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-brutal mb-16 shadow-[8px_8px_0_0_#FFF] hover:shadow-[4px_4px_0_0_#FFF] translate-x-0 hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                    <Github className="w-6 h-6" />
                    ENGAGE GITHUB
                </a>

                <div className="w-full flex flex-col md:flex-row justify-between items-center border-t border-zinc pt-8 text-sm text-muted gap-6">
                    <div className="flex items-center gap-4">
                        <span className="font-deco text-2xl text-amber">KOE</span>
                        <span>BUILD // 2026</span>
                    </div>

                    <div className="flex gap-8">
                        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-amber">
                            [REPO]
                        </a>
                        <a href="/privacy" className="hover:text-amber">
                            [PRIVACY DIRECTIVE]
                        </a>
                    </div>

                    <div className="flex items-center gap-2">
                        CONSTRUCTED BY JSTAR <Zap className="w-4 h-4 text-amber" />
                    </div>
                </div>
            </div>
        </footer>
    );
}
