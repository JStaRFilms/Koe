"use client";

import { useEffect, useState } from "react";
import { Github, Star } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/JStaRFilms/Koe";

export function GitHubCTA() {
    const [starCount, setStarCount] = useState<number | null>(null);

    useEffect(() => {
        async function fetchStars() {
            try {
                const response = await fetch(
                    "https://api.github.com/repos/JStaRFilms/Koe",
                    { next: { revalidate: 3600 } } as RequestInit
                );
                if (response.ok) {
                    const data = await response.json();
                    setStarCount(data.stargazers_count);
                }
            } catch (error) {
                console.error("Failed to fetch star count:", error);
            }
        }

        fetchStars();
    }, []);

    return (
        <section className="py-16 md:py-24 border-b border-zinc">
            <div className="container mx-auto px-4 text-center">
                <h2 className="font-display text-4xl md:text-6xl mb-6 text-bone tracking-wider">
                    END OF THE LINE.
                    <br />
                    <span className="text-crimson line-through decoration-[6px]">TYPING</span>.
                </h2>

                <p className="text-muted max-w-xl mx-auto mb-12 normal-case text-lg">
                    Join the open source revolution. Star us on GitHub, report issues, or contribute to the codebase.
                </p>

                <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center gap-3 bg-amber text-void px-8 py-4 font-bold text-lg uppercase tracking-wider border-2 border-amber hover:bg-bone hover:border-bone transition-all duration-150 mb-8"
                >
                    <span className="absolute top-1.5 left-1.5 right-[-12px] bottom-[-12px] border border-amber -z-10 group-hover:top-0 group-hover:left-0 group-hover:right-0 group-hover:bottom-0 transition-all duration-150" />
                    <Github className="w-6 h-6" />
                    ENGAGE GITHUB
                    {starCount !== null && (
                        <span className="flex items-center gap-1 ml-2 text-sm">
                            <Star className="w-4 h-4 fill-current" />
                            {starCount}
                        </span>
                    )}
                </a>

                {/* Additional links */}
                <div className="flex flex-wrap justify-center gap-8 text-sm text-muted">
                    <a
                        href={`${GITHUB_REPO_URL}/issues`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-amber transition-colors uppercase tracking-wider"
                    >
                        [REPORT ISSUE]
                    </a>
                    <a
                        href={`${GITHUB_REPO_URL}/blob/main/README.md`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-amber transition-colors uppercase tracking-wider"
                    >
                        [DOCUMENTATION]
                    </a>
                    <a
                        href={`${GITHUB_REPO_URL}/releases`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-amber transition-colors uppercase tracking-wider"
                    >
                        [RELEASES]
                    </a>
                </div>
            </div>
        </section>
    );
}
