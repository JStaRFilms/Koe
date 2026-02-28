export class FloatingWindow {
    constructor() {
        this.state = 'idle'; // 'idle', 'recording', 'processing'
        this.segments = []; // Array of { text, isFinal }

        // DOM Elements
        this.container = document.getElementById('app');
        this.contentArea = document.getElementById('transcription-content');
        this.mainArea = document.getElementById('transcription-area');
        this.statusText = document.getElementById('status-text');
        this.btnCopy = document.getElementById('btn-copy');
        this.toast = document.getElementById('toast');

        // Title bar controls
        this.btnMinimize = document.getElementById('btn-minimize');
        this.btnClose = document.getElementById('btn-close');

        this.initListeners();
    }

    initListeners() {
        // Top bar controls (Requires IPC to main process, assuming standard channels)
        // Note: If you don't have these exposed, they can be implemented later.
        if (this.btnMinimize) {
            this.btnMinimize.addEventListener('click', () => {
                if (window.api && window.api.minimizeWindow) window.api.minimizeWindow();
            });
        }

        if (this.btnClose) {
            this.btnClose.addEventListener('click', () => {
                if (window.api && window.api.closeWindow) window.api.closeWindow();
            });
        }

        // Copy button
        if (this.btnCopy) {
            this.btnCopy.addEventListener('click', () => this.copyToClipboard());
        }
    }

    setState(newState) {
        // We allow setting the identical state if it's the very first initialization
        // to ensure the CSS class is applied
        if (this.state === newState && this.container.classList.contains(`state-${newState}`)) return;

        // Remove old state class
        this.container.classList.remove(`state-${this.state}`);
        this.state = newState;

        // Add new state class
        this.container.classList.add(`state-${this.state}`);

        // Update label
        switch (this.state) {
            case 'idle':
                this.statusText.textContent = 'Idle';
                break;
            case 'recording':
                this.statusText.textContent = 'Recording...';
                break;
            case 'processing':
                this.statusText.textContent = 'Transcribing...';
                break;
        }
    }

    appendTranscription(text, isFinal = true) {
        // If it's the first actual text, clear placeholder
        const placeholder = this.contentArea.querySelector('.placeholder-text');
        if (placeholder) {
            placeholder.remove();
        }

        // Find if we have a partial segment to update
        const existingPartial = this.contentArea.querySelector('.transcript-segment.partial');

        if (existingPartial && !isFinal) {
            // Update existing partial
            existingPartial.textContent = text;
        } else if (existingPartial && isFinal) {
            // Finalize partial
            existingPartial.textContent = text;
            existingPartial.classList.remove('partial');
        } else {
            // completely new segment
            const el = document.createElement('div');
            el.className = `transcript-segment${isFinal ? '' : ' partial'}`;
            el.textContent = text;
            this.contentArea.appendChild(el);
        }

        this.scrollToBottom();

        if (isFinal) {
            // Push to internal state for copy all
            this.segments.push(text);
            // Let's copy automatically if enabled
            this.checkAutoCopy(text);
        }
    }

    clear() {
        this.segments = [];
        this.contentArea.innerHTML = '<p class="placeholder-text">Waiting for speech...</p>';
    }

    scrollToBottom() {
        // Smooth scroll to bottom
        this.mainArea.scrollTo({
            top: this.mainArea.scrollHeight,
            behavior: 'smooth'
        });
    }

    async copyToClipboard(textToCopy = null) {
        const text = textToCopy || this.segments.join('\n');

        if (!text.trim()) {
            return; // Nothing to copy
        }

        try {
            // Use standard clipboard API if possible, or fallback to IPC
            await navigator.clipboard.writeText(text);
            this.showToast('Copied ✓');

            // Flash success on the button
            const originalHtml = this.btnCopy.innerHTML;
            this.btnCopy.innerHTML = '✓ <span class="action-label">Copied</span>';
            this.btnCopy.style.borderColor = 'var(--koe-success)';
            this.btnCopy.style.color = 'var(--koe-success)';

            setTimeout(() => {
                this.btnCopy.innerHTML = originalHtml;
                this.btnCopy.style.borderColor = '';
                this.btnCopy.style.color = '';
            }, 2000);

        } catch (err) {
            console.error('Failed to copy', err);
        }
    }

    async checkAutoCopy(latestText) {
        // If settings are available and autoCopy is true
        if (window.api && window.api.getSettings) {
            try {
                const settings = await window.api.getSettings();
                if (settings && settings.autoCopy) {
                    await this.copyToClipboard(latestText); // optionally just copy latest or all
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }

    showToast(message) {
        if (!this.toast) return;

        this.toast.querySelector('.toast-text').textContent = message;
        this.toast.classList.add('show');

        // Clear existing timeout
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }

        this._toastTimeout = setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2500);
    }
}
