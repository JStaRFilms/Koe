export interface UsageStats {
    date: string;
    requestCount: number;
    audioSecondsUsed: number;
}

export class UsageTracker {
    private stats: UsageStats;

    constructor(initialStats?: UsageStats) {
        this.stats = initialStats || this.createEmptyStats();
    }

    private createEmptyStats(): UsageStats {
        return {
            date: new Date().toISOString().split('T')[0],
            requestCount: 0,
            audioSecondsUsed: 0
        };
    }

    recordRequest(audioSeconds: number) {
        const today = new Date().toISOString().split('T')[0];
        
        if (this.stats.date !== today) {
            this.stats = this.createEmptyStats();
        }

        this.stats.requestCount += 1;
        this.stats.audioSecondsUsed += audioSeconds;
    }

    getStats(): UsageStats {
        return { ...this.stats };
    }

    setStats(stats: UsageStats) {
        this.stats = { ...stats };
    }
}
