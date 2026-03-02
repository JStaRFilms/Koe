export class HistoryPanel {
    constructor() {
        this.container = document.getElementById('history-panel');
        this.content = document.getElementById('history-content');
        this.btnClose = document.getElementById('btn-close-history');
        this.btnClear = document.getElementById('btn-clear-history');
        this.btnCopyAll = document.getElementById('btn-copy-history');

        if (this.btnClose) {
            this.btnClose.addEventListener('click', () => this.hide());
        }

        if (this.btnClear) {
            this.btnClear.addEventListener('click', () => this.clearHistory());
        }

        if (this.btnCopyAll) {
            this.btnCopyAll.addEventListener('click', () => this.copyAllToClipboard());
        }
    }

    show() {
        if (!this.container) return;
        this.container.classList.remove('hide');
        this.loadHistory();
    }

    hide() {
        if (!this.container) return;
        this.container.classList.add('hide');
    }

    async loadHistory() {
        if (!window.api || !window.api.getHistory) return;
        try {
            const history = await window.api.getHistory();
            this.renderHistory(history);
        } catch (error) {
            window.api.log(`Failed to load history: ${error.message}`);
        }
    }

    renderHistory(historyEntries) {
        if (!this.content) return;

        this.content.innerHTML = ''; // Clear current content

        if (!historyEntries || historyEntries.length === 0) {
            this.content.innerHTML = '<div class="history-empty">No transcription history yet.</div>';
            return;
        }

        historyEntries.forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.className = 'history-entry';

            const date = new Date(entry.timestamp);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Truncate text for preview
            const previewText = entry.text.length > 80 ? entry.text.substring(0, 80) + '...' : entry.text;

            let badges = `<span class="badge lang-badge">${entry.language.toUpperCase()}</span>`;
            if (entry.isLlamaEnhanced) {
                badges += `<span class="badge enhance-badge">Enhanced</span>`;
            }

            entryEl.innerHTML = `
                <div class="history-header">
                    <span class="history-time">${timeString}</span>
                    <div class="history-badges">${badges}</div>
                </div>
                <div class="history-text-preview">${previewText}</div>
                <div class="history-text-full hide">${entry.text}</div>
                <div class="history-actions">
                    <button class="icon-btn btn-history-expand" title="Expand">v</button>
                    <button class="icon-btn btn-history-copy" title="Copy">📋</button>
                </div>
            `;

            // Expand/Collapse logic
            const btnExpand = entryEl.querySelector('.btn-history-expand');
            const preview = entryEl.querySelector('.history-text-preview');
            const fullText = entryEl.querySelector('.history-text-full');

            btnExpand.addEventListener('click', () => {
                if (fullText.classList.contains('hide')) {
                    fullText.classList.remove('hide');
                    preview.classList.add('hide');
                    btnExpand.textContent = '^';
                } else {
                    fullText.classList.add('hide');
                    preview.classList.remove('hide');
                    btnExpand.textContent = 'v';
                }
            });

            // Copy logic
            const btnCopy = entryEl.querySelector('.btn-history-copy');
            btnCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(entry.text).then(() => {
                    this.showToast('Copied to clipboard');
                }).catch(err => {
                    window.api.log('Failed to copy text: ' + err);
                });
            });

            this.content.appendChild(entryEl);
        });
    }

    async clearHistory() {
        if (confirm("Are you sure you want to clear your transcription history? This cannot be undone.")) {
            try {
                if (window.api && window.api.clearHistory) {
                    await window.api.clearHistory();
                    this.renderHistory([]);
                }
            } catch (err) {
                window.api.log(`Failed to clear history: ${err.message}`);
            }
        }
    }

    async copyAllToClipboard() {
        if (!window.api || !window.api.getHistory) return;
        try {
            const history = await window.api.getHistory();
            if (history && history.length > 0) {
                const allText = history.map(h => h.text).join('\n\n');
                navigator.clipboard.writeText(allText).then(() => {
                    this.showToast('Copied all to clipboard');
                });
            }
        } catch (e) { }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.querySelector('.toast-text').innerText = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }
    }
}
