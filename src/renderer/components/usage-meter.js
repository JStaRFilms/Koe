export class UsageMeter {
    constructor() {
        this.container = document.getElementById('usage-meter');
        this.barRpd = document.getElementById('bar-rpd');
        this.barAudio = document.getElementById('bar-audio');
        this.barRpm = document.getElementById('bar-rpm');

        this.textRpd = document.getElementById('text-rpd');
        this.textAudio = document.getElementById('text-audio');
        this.textRpm = document.getElementById('text-rpm');

        this.updateTimeStr();
        setInterval(() => this.updateTimeStr(), 60000); // Update local time every minute
    }

    show() {
        if (!this.container) return;
        this.container.classList.remove('hide');
        this.fetchUsage();
    }

    hide() {
        if (!this.container) return;
        this.container.classList.add('hide');
    }

    async fetchUsage() {
        if (!window.api || !window.api.getUsageStats) return;
        try {
            const stats = await window.api.getUsageStats();
            this.updateMeters(stats);
        } catch (error) {
            window.api.log(`Failed to fetch usage: ${error.message}`);
        }
    }

    /**
     * stats = { dailyRequests, dailyRequestsLimit, dailyAudioSeconds, dailyAudioSecondsLimit, requestsThisMinute, rpmLimit }
     */
    updateMeters(stats) {
        if (!stats) return;

        this.updateBar(this.barRpd, this.textRpd, stats.dailyRequests, stats.dailyRequestsLimit, 'Reqs');
        this.updateBar(this.barAudio, this.textAudio, Math.round(stats.dailyAudioSeconds), stats.dailyAudioSecondsLimit, 'Secs');
        this.updateBar(this.barRpm, this.textRpm, stats.requestsThisMinute, stats.rpmLimit, 'RPM');
    }

    updateBar(barEl, textEl, current, limit, suffix) {
        if (!barEl || !textEl) return;

        const percentage = Math.min((current / limit) * 100, 100);
        barEl.style.width = `${percentage}%`;
        textEl.textContent = `${current} / ${limit} ${suffix}`;

        // Color coding
        barEl.classList.remove('bar-green', 'bar-yellow', 'bar-red');
        if (percentage < 50) {
            barEl.classList.add('bar-green');
        } else if (percentage < 80) {
            barEl.classList.add('bar-yellow');
        } else {
            barEl.classList.add('bar-red');
        }
    }

    updateTimeStr() {
        const timeLabel = document.getElementById('usage-time-label');
        if (!timeLabel) return;
        // Check how long until midnight
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntilMidnight = tomorrow - now;
        const hours = Math.floor(msUntilMidnight / 3600000);
        const mins = Math.floor((msUntilMidnight % 3600000) / 60000);
        timeLabel.textContent = `Resets in ${hours}h ${mins}m`;
    }
}
