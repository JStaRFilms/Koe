/**
 * PillUI — The minimal HUD-style status indicator for Koe.
 *
 * States: idle → recording → processing → done → (hidden)
 * No text display — purely a visual feedback element.
 */
export class PillUI {
    constructor() {
        this.state = 'idle';
        this.timerInterval = null;
        this.timerSeconds = 0;

        // DOM
        this.pill = document.getElementById('pill');
        this.status = document.getElementById('pill-status');
        this.timer = document.getElementById('pill-timer');
        this.spinner = document.getElementById('pill-spinner');
        this.check = document.getElementById('pill-check');
    }

    /** Trigger CSS entrance animation */
    animateIn() {
        // Force reflow to reset animation
        this.pill.classList.remove('animate-in', 'animate-out');
        void this.pill.offsetWidth;
        this.pill.classList.add('animate-in');
    }

    /** Trigger CSS exit animation, then hide window */
    animateOut() {
        this.pill.classList.remove('animate-in');
        this.pill.classList.add('animate-out');

        // After animation completes, tell main to hide the window
        setTimeout(() => {
            if (window.api && window.api.hideWindow) {
                window.api.hideWindow();
            }
            // Reset for next appearance
            this.pill.classList.remove('animate-out');
            this.setState('idle');
        }, 300); // matches CSS exit duration
    }

    /**
     * Set the pill state and update all visual elements.
     * @param {'idle'|'recording'|'processing'|'done'} newState
     */
    setState(newState) {
        if (this.state === newState) return;

        // Remove old state class
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
                this.status.textContent = 'Pasted ✓';
                this.stopTimer();
                break;
        }
    }

    /** Start the recording duration timer */
    startTimer() {
        this.timerSeconds = 0;
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timerSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    /** Stop the timer */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /** Render MM:SS in the timer element */
    updateTimerDisplay() {
        const mins = Math.floor(this.timerSeconds / 60);
        const secs = this.timerSeconds % 60;
        this.timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Show the "done" state briefly, then animate out.
     * Called after transcription + paste completes.
     */
    showDoneAndHide() {
        this.setState('done');

        // Show "Pasted ✓" for 1.2s, then slide out
        setTimeout(() => {
            this.animateOut();
        }, 1200);
    }
}
