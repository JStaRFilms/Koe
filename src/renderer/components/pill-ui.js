export class PillUI {
    constructor() {
        this.state = 'idle';
        this.sessionId = 0;
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.hideTimeout = null;
        this.animateOutTimeout = null;

        this.pill = document.getElementById('pill');
        this.status = document.getElementById('pill-status');
        this.timer = document.getElementById('pill-timer');
        this.progressBar = document.getElementById('pill-progress-bar');
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
        this.pill.classList.remove('animate-out');
        this.pill.classList.add('animate-in');
    }

    animateIn() {
        this.clearPendingTransitions();
        this.pill.classList.remove('animate-in', 'animate-out');
        void this.pill.offsetWidth;
        this.pill.classList.add('animate-in');
    }

    animateOut(sessionId = this.sessionId) {
        if (!this.isCurrentSession(sessionId)) {
            return;
        }

        this.clearPendingTransitions();
        this.pill.classList.remove('animate-in');
        this.pill.classList.add('animate-out');

        this.animateOutTimeout = setTimeout(() => {
            if (!this.isCurrentSession(sessionId)) {
                return;
            }

            if (window.api && window.api.hideWindow) {
                window.api.hideWindow();
            }

            this.pill.classList.remove('animate-out');
            this.setProgress(0);
            this.setState('idle');
        }, 300);
    }

    setState(newState) {
        if (this.state === newState) {
            return;
        }

        this.pill.classList.remove(`state-${this.state}`);
        this.state = newState;
        this.pill.classList.add(`state-${this.state}`);

        switch (this.state) {
            case 'idle':
                this.status.textContent = 'Ready';
                this.stopTimer();
                break;
            case 'recording':
                this.status.textContent = 'Listening...';
                this.startTimer();
                break;
            case 'processing':
                this.status.textContent = 'Transcribing';
                this.stopTimer();
                break;
            case 'done':
                this.status.textContent = 'Pasted';
                this.stopTimer();
                break;
            case 'error':
                this.stopTimer();
                break;
        }
    }

    setProcessingStatus(label, progress = 0, sessionId = this.sessionId) {
        if (!this.isCurrentSession(sessionId)) {
            return;
        }

        this.clearPendingTransitions();
        this.setState('processing');
        this.status.textContent = label || 'Transcribing';
        this.setProgress(progress);
    }

    setError(message, sessionId = this.sessionId) {
        if (!this.isCurrentSession(sessionId)) {
            return;
        }

        this.clearPendingTransitions();
        this.pill.classList.remove(`state-${this.state}`);
        this.state = 'error';
        this.pill.classList.add('state-error');
        this.status.textContent = message || 'Error';
        this.stopTimer();
        this.setProgress(0);

        this.hideTimeout = setTimeout(() => {
            this.animateOut(sessionId);
        }, 3500);
    }

    hideWithMessage(message, sessionId = this.sessionId) {
        if (!this.isCurrentSession(sessionId)) {
            return;
        }

        this.clearPendingTransitions();
        this.setState('idle');
        this.status.textContent = message || 'Ready';
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
