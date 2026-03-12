export class PillUI {
    constructor() {
        this.state = 'idle';
        this.sessionId = 0;
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.hideTimeout = null;
        this.animateOutTimeout = null;
        this.visualizerFrame = null;
        this.targetLevels = [];
        this.renderedLevels = [];
        this.visualizerBarHeights = [0.34, 0.52, 0.72, 0.96, 0.74, 0.54, 0.36];

        this.shell = document.getElementById('pill-shell');
        this.pill = document.getElementById('pill');
        this.banner = document.getElementById('pill-banner');
        this.status = document.getElementById('pill-status');
        this.detail = document.getElementById('pill-detail');
        this.timer = document.getElementById('pill-timer');
        this.progressBar = document.getElementById('pill-progress-bar');
        this.visualizerBars = Array.from(document.querySelectorAll('.viz-bar'));

        this.resetVisualizer();
    }

    clearPendingTransitions() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        if (this.animateOutTimeout) {
            clearTimeout(this.animateOutTimeout);
            this.animateOutTimeout = null;
        }
    }

    isCurrentSession(sessionId) {
        return sessionId == null || sessionId === this.sessionId;
    }

    beginSession(sessionId) {
        this.sessionId = sessionId ?? this.sessionId;
        this.clearPendingTransitions();
        this.setProgress(0);
        this.shell.classList.remove('animate-out');
        this.shell.classList.add('animate-in');
    }

    animateIn() {
        this.clearPendingTransitions();
        this.shell.classList.remove('animate-in', 'animate-out');
        void this.shell.offsetWidth;
        this.shell.classList.add('animate-in');
    }

    animateOut(sessionId = this.sessionId) {
        if (!this.isCurrentSession(sessionId)) {
            return;
        }

        this.clearPendingTransitions();
        this.shell.classList.remove('animate-in');
        this.shell.classList.add('animate-out');

        this.animateOutTimeout = setTimeout(() => {
            if (!this.isCurrentSession(sessionId)) {
                return;
            }

            if (window.api && window.api.hideWindow) {
                window.api.hideWindow();
            }

            this.shell.classList.remove('animate-out');
            this.setProgress(0);
            this.setDetail('');
            this.setState('idle');
        }, 300);
    }

    setState(newState) {
        if (this.state === newState) {
            return;
        }

        this.shell.classList.remove(`state-${this.state}`);
        this.state = newState;
        this.shell.classList.add(`state-${this.state}`);

        switch (this.state) {
            case 'idle':
                this.status.textContent = 'Ready';
                this.setDetail('');
                this.stopTimer();
                this.stopVisualizer();
                break;
            case 'recording':
                this.status.textContent = 'Listening...';
                this.setDetail('');
                this.startTimer();
                this.startVisualizer();
                break;
            case 'processing':
                this.status.textContent = 'Transcribing';
                this.stopTimer();
                this.stopVisualizer();
                break;
            case 'done':
                this.status.textContent = 'Pasted';
                this.setDetail('');
                this.stopTimer();
                this.stopVisualizer();
                break;
            case 'error':
                this.stopTimer();
                this.stopVisualizer();
                break;
            default:
                this.stopVisualizer();
        }
    }

    setDetail(message = '') {
        if (!this.detail) {
            return;
        }

        const value = String(message || '').trim();
        this.detail.textContent = value;
        this.detail.classList.toggle('has-content', Boolean(value));
        if (this.banner) {
            this.banner.classList.toggle('has-content', Boolean(value));
        }
    }

    setVoiceLevels(levels = []) {
        if (!Array.isArray(levels) || this.visualizerBars.length === 0) {
            return;
        }

        this.targetLevels = this.visualizerBars.map((_, index) => {
            const value = Number(levels[index] ?? 0);
            return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
        });

        if (this.state === 'recording') {
            this.startVisualizer();
        }
    }

    setProcessingStatus(label, progress = 0, sessionId = this.sessionId, detail = '') {
        if (!this.isCurrentSession(sessionId)) {
            return;
        }

        this.clearPendingTransitions();
        this.setState('processing');
        this.status.textContent = label || 'Transcribing';
        this.setDetail(detail);
        this.setProgress(progress);
    }

    setError(message, sessionId = this.sessionId, options = {}) {
        if (!this.isCurrentSession(sessionId)) {
            return;
        }

        this.clearPendingTransitions();
        this.shell.classList.remove(`state-${this.state}`);
        this.state = 'error';
        this.shell.classList.add('state-error');
        this.status.textContent = message || 'Error';
        this.setDetail(options.detail || '');
        this.stopTimer();
        this.setProgress(0);

        this.hideTimeout = setTimeout(() => {
            this.animateOut(sessionId);
        }, options.lingerMs || 3500);
    }

    hideWithMessage(message, sessionId = this.sessionId, detail = '') {
        if (!this.isCurrentSession(sessionId)) {
            return;
        }

        this.clearPendingTransitions();
        this.setState('idle');
        this.status.textContent = message || 'Ready';
        this.setDetail(detail);
        this.setProgress(0);

        this.hideTimeout = setTimeout(() => {
            this.animateOut(sessionId);
        }, 900);
    }

    startTimer() {
        this.stopTimer();
        this.timerSeconds = 0;
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timerSeconds += 1;
            this.updateTimerDisplay();
        }, 1000);
    }

    startVisualizer() {
        if (this.visualizerFrame) {
            return;
        }

        if (this.renderedLevels.length !== this.visualizerBars.length) {
            this.renderedLevels = this.visualizerBars.map(() => 0);
        }
        if (this.targetLevels.length !== this.visualizerBars.length) {
            this.targetLevels = this.visualizerBars.map(() => 0);
        }

        const render = () => {
            this.visualizerBars.forEach((bar, index) => {
                const target = this.targetLevels[index] ?? 0;
                const current = this.renderedLevels[index] ?? 0;
                const eased = current + (target - current) * 0.34;
                const floor = target > 0.02 ? 0.18 : 0;
                const normalized = Math.max(floor, eased);
                const baseHeight = this.visualizerBarHeights[index] ?? 0.5;
                const height = 4 + Math.round(18 * baseHeight * normalized);

                this.renderedLevels[index] = normalized;
                bar.style.height = `${height}px`;
                bar.style.opacity = `${0.35 + normalized * 0.65}`;
            });

            const hasActivity = this.renderedLevels.some((value) => value > 0.01) || this.targetLevels.some((value) => value > 0.01);
            if (this.state !== 'recording' && !hasActivity) {
                this.visualizerFrame = null;
                this.resetVisualizer();
                return;
            }

            this.visualizerFrame = requestAnimationFrame(render);
        };

        this.visualizerFrame = requestAnimationFrame(render);
    }

    stopVisualizer() {
        this.targetLevels = this.visualizerBars.map(() => 0);

        if (!this.visualizerFrame && this.renderedLevels.every((value) => value === 0)) {
            this.resetVisualizer();
            return;
        }

        this.startVisualizer();
    }

    resetVisualizer() {
        this.targetLevels = this.visualizerBars.map(() => 0);
        this.renderedLevels = this.visualizerBars.map(() => 0);
        this.visualizerBars.forEach((bar) => {
            bar.style.height = '4px';
            bar.style.opacity = '0.4';
        });
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.timerSeconds / 60);
        const secs = this.timerSeconds % 60;
        this.timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    setProgress(progress = 0) {
        const clamped = Math.max(0, Math.min(100, progress));
        if (this.progressBar) {
            this.progressBar.style.width = `${clamped}%`;
        }
    }

    showDoneAndHide(sessionId = this.sessionId) {
        if (!this.isCurrentSession(sessionId)) {
            return;
        }

        this.clearPendingTransitions();
        this.setProgress(100);
        this.setState('done');

        this.hideTimeout = setTimeout(() => {
            this.animateOut(sessionId);
        }, 1200);
    }
}
